import { CanonicalIngestSchema, normalizeCanonical } from "@/lib/ingest-schema";
import { verifyIngestAuth } from "@/lib/ingest-auth";
import {
  specForChannel,
  tagsAllowed,
  INGEST_CHANNELS,
} from "@/lib/channel-adapters/ingest-vendors";
import { recordIngestEvent, UNKNOWN_TOKEN_BUCKET } from "@/lib/ingest-health";
import { getRepositories } from "@/lib/repositories";
import { ingestTicket } from "@/lib/service";

/**
 * Injectable core for POST /api/ingest/[channel]/[token] — the per-merchant
 * helpdesk webhook (ADR-0011 as amended by ADR-0021). This lives in lib/ (not the
 * route file) so the handler is unit-testable without the Next runtime, and so the
 * route file exports only its HTTP verb.
 *
 * Merchant identity comes ONLY from the URL path token, resolved via
 * `merchants.findByInboxToken`. There is no `?merchant=` / body merchant id to
 * forge, which is what closes the ADR-0008/§F3 cross-merchant-replay note: a
 * captured payload replayed at a different token authenticates against a
 * DIFFERENT derived credential and lands under that token's merchant only.
 *
 * WHAT ADR-0021 CHANGED. The auth gate used to demand ONE credential: a Tideover
 * HMAC-SHA256 over the raw body. Gorgias cannot compute a per-request HMAC (its
 * HTTP Integration sends static headers or OAuth2), Help Scout signs with its own
 * HMAC-SHA1 scheme, and Zendesk was not routed at all. At DEMO_MODE=false those
 * merchants' webhooks 401'd forever and their cockpit showed a calm, empty queue.
 * The gate now accepts the STRONGEST credential each vendor can actually produce
 * (lib/channel-adapters/ingest-vendors.ts declares which), the HMAC path is
 * unchanged for anyone who can do it, and the posture still fails CLOSED.
 *
 * And every terminal outcome is now COUNTED with its reason (lib/ingest-health.ts)
 * so "nothing is arriving" becomes a loud, explained state on /app/setup instead
 * of a peaceful one.
 *
 * Order of operations (read raw ONCE → resolve merchant → verify over the RAW
 * bytes → parse → drop-at-edge → ingest):
 *
 *   1. raw = req.text() once.
 *   2. channel param resolved to a vendor spec (else 400).
 *   3. resolve merchant by token; unknown → 404 (bare, no merchant leak) + counted.
 *   4. auth gate: per-vendor. Unauthenticated accept ONLY on the demo/test path
 *      (DEMO_MODE != "false" AND NODE_ENV != "production" AND no root secret).
 *      Everywhere else a credential MUST verify or 401 (bare, counted with reason).
 *   5. JSON.parse (400) → canonical zod parse (400 on shape) — both counted.
 *   6. drop-at-edge: a payload whose tags miss the merchant's presaleTags is acked
 *      `discarded`, never persisted, and counted. Tags are split/case-folded first
 *      (a Zendesk `{{ticket.tags}}` arrives as one space-joined string).
 *   7. `test: true` → the connection test short-circuits HERE, after the full gate
 *      and the real tag rule, before anything is written. It proves the connection
 *      without putting a fake ticket in a real queue.
 *   8. normalize → ingestTicket (idempotency on external_id, auto-draft).
 *
 * Fast-ACK: bounded repo work + deterministic drafting, then 200 well inside a
 * vendor's ~5s webhook timeout.
 *
 * Uses the Web-standard Response (not next/server) so it is exercisable in unit
 * tests without the Next runtime; Next 14 App Router accepts a plain Response.
 */

export { INGEST_CHANNELS };

/** Reserved flag: a connection test fired from the connect panel. It runs the
 *  REAL gate (auth, schema, tag rule) and then stops, so a merchant can prove the
 *  wiring works without a synthetic ticket landing in their queue. */
function isConnectionTest(json: unknown): boolean {
  return typeof json === "object" && json !== null && (json as { test?: unknown }).test === true;
}

export async function handleCanonicalIngest(
  req: Request,
  channel: string,
  token: string,
): Promise<Response> {
  const raw = await req.text();

  const spec = specForChannel(channel);
  if (!spec) {
    return Response.json({ error: "unknown channel" }, { status: 400 });
  }

  // Merchant identity is bound to the URL token — never a body/query id.
  const repos = getRepositories();
  const merchant = token ? await repos.merchants.findByInboxToken(token) : null;
  if (!merchant) {
    // Unknown token → 404, bare, no merchant leak. Counted in the ops bucket: a
    // helpdesk pointed at a rotated/mistyped token retries forever, and this is
    // the only place that fact is visible.
    recordIngestEvent(UNKNOWN_TOKEN_BUCKET, {
      kind: "rejected",
      channel,
      reason: "unknown-token",
    });
    return new Response(null, { status: 404 });
  }

  // ── auth gate (over the RAW bytes, before any parse) ────────────────────────
  // Two layers of secret protect this endpoint: the unguessable per-merchant URL
  // token (already verified above — a bad token 404'd) AND, for a live merchant,
  // a per-vendor credential derived from that token (ADR-0021). Fails CLOSED:
  // any production build, an explicit DEMO_MODE=false, or a root secret being set
  // all require a credential, and a MISSING root secret is itself a rejection
  // (an empty root makes every derived credential computable from the public URL
  // token, so accepting would be accepting a forgeable secret).
  const auth = verifyIngestAuth({ rawBody: raw, headers: req.headers, inboxToken: token, spec });
  if (!auth.ok) {
    recordIngestEvent(merchant.id, { kind: "rejected", channel, reason: auth.reason });
    return new Response(null, { status: 401 });
  }

  let json: unknown;
  try {
    json = JSON.parse(raw);
  } catch {
    recordIngestEvent(merchant.id, {
      kind: "invalid",
      channel,
      reason: "invalid-json",
      detail: "the request body was not valid JSON",
    });
    return Response.json({ error: "invalid JSON" }, { status: 400 });
  }
  const test = isConnectionTest(json);

  // Canonical first. If the body isn't canonical, fall back to the vendor's OWN
  // payload shape — Help Scout cannot template a webhook body at all (it POSTs
  // its conversation object), so for that vendor this fallback IS the integration.
  let parsed = CanonicalIngestSchema.safeParse(json);
  if (!parsed.success && spec.normalizeNative) {
    const native = spec.normalizeNative(json);
    if (native) parsed = CanonicalIngestSchema.safeParse(native);
  }
  if (!parsed.success) {
    const fields = parsed.error.issues
      .map((i) => i.path.join("."))
      .filter(Boolean)
      .slice(0, 6)
      .join(", ");
    recordIngestEvent(merchant.id, {
      kind: "invalid",
      channel,
      reason: "schema",
      detail: fields ? `off-template fields: ${fields}` : "the body did not match the template",
    });
    return Response.json({ error: "invalid body" }, { status: 400 });
  }
  const payload = parsed.data;

  // Drop-at-edge (ADR-0011 §4): when the merchant scopes ingest to presale tags,
  // anything without a matching tag — INCLUDING an untagged payload — is acked
  // but never persisted or drafted (honors the onboarding promise "untagged
  // tickets never reach us"). With no presaleTags configured, accept everything.
  //
  // tagsAllowed splits and case-folds first: Zendesk renders `{{ticket.tags}}` as
  // ONE space-separated string, so a ticket tagged `presale vip` used to arrive as
  // ["presale vip"], match nothing, and be silently discarded — which is how a
  // multi-seat Zendesk shop tags EVERY ticket. See ingest-vendors.expandTags.
  if (!tagsAllowed(payload.tags, merchant.presaleTags)) {
    recordIngestEvent(merchant.id, {
      kind: "discarded",
      channel,
      reason: "tag-rule",
      detail: `tags [${(payload.tags ?? []).join(", ") || "none"}] did not match your presale filter [${(merchant.presaleTags ?? []).join(", ")}]`,
    });
    return Response.json({
      status: "discarded",
      ...(test
        ? {
            test: true,
            reason:
              "The test event reached Tideover and passed authentication, but your presale tag rule discarded it. A real ticket tagged this way would also be dropped.",
          }
        : {}),
    });
  }

  // The connection test stops here: the full gate passed and the merchant's own
  // tag rule would keep this ticket. Nothing is written.
  if (test) {
    recordIngestEvent(merchant.id, {
      kind: "test",
      channel,
      detail: `connection test passed (${auth.scheme})`,
    });
    return Response.json({
      status: "test-ok",
      authScheme: auth.scheme,
      wouldIngest: true,
    });
  }

  const normalized = normalizeCanonical(payload, merchant.id);
  const result = await ingestTicket(normalized);
  if ("error" in result) {
    recordIngestEvent(merchant.id, { kind: "invalid", channel, reason: result.error });
    return Response.json({ status: "error", error: result.error }, { status: 422 });
  }
  if (result.duplicate) {
    recordIngestEvent(merchant.id, { kind: "duplicate", channel });
    return Response.json({ status: "duplicate", ticketId: result.ticket.id });
  }

  // An ingested ticket with no order is in the UNMATCHED bucket (lib/service.ts
  // tags it `presale:unmatched` rather than borrow a stranger's order). It is in
  // the queue but carries no wait, no stage and no drafted reassurance — a real
  // and previously invisible failure mode, so it is counted separately.
  const unmatched = !result.ticket.orderId;
  recordIngestEvent(merchant.id, {
    kind: unmatched ? "unmatched" : "accepted",
    channel,
    ...(unmatched
      ? { reason: "no-order-match", detail: "no order matched this customer or order_ref" }
      : {}),
  });

  return Response.json({
    status: "ingested",
    ticketId: result.ticket.id,
    draft: result.ticket.draft,
  });
}
