import { CanonicalIngestSchema, normalizeCanonical } from "@/lib/ingest-schema";
import { deriveWebhookSecret, verifyWebhookSig, SIGNATURE_HEADER } from "@/lib/webhook-secret";
import { getRepositories } from "@/lib/repositories";
import { ingestTicket } from "@/lib/service";

/**
 * Injectable core for POST /api/ingest/[channel]/[token] — the per-merchant
 * helpdesk webhook (ADR-0011, task W2), the clean API integration path (vs the
 * email-forward rung). This lives in lib/ (not the route file) so the handler is
 * unit-testable without the Next runtime, and so the route file exports only its
 * HTTP verb.
 *
 * Merchant identity comes ONLY from the URL path token, resolved via
 * `merchants.findByInboxToken`. There is no `?merchant=` / body merchant id to
 * forge, which is what closes the ADR-0008/§F3 cross-merchant-replay note: a
 * captured payload replayed at a different token authenticates against a
 * DIFFERENT derived secret and lands under that token's merchant only.
 *
 * Order of operations mirrors the email route (read raw ONCE → resolve merchant
 * → verify signature over the RAW bytes → parse → drop-at-edge → ingest):
 *
 *   1. raw = req.text() once.
 *   2. channel param validated to a small allowlist (else 400).
 *   3. resolve merchant by token; unknown → 404 (no merchant leak).
 *   4. signature gate: in demo mode with no WEBHOOK_ROOT_SECRET, accept unsigned
 *      (seeded/test path); otherwise verifyWebhookSig MUST pass or 401 (bare).
 *      Fails CLOSED under NODE_ENV=production even if both are unset.
 *   5. JSON.parse (400) → canonical zod parse (400 on shape).
 *   6. drop-at-edge: a tagged payload missing the merchant's presaleTags is
 *      acked `discarded` but never persisted or drafted.
 *   7. normalize → ingestTicket (idempotency on external_id, auto-draft).
 *
 * Fast-ACK: bounded repo work + deterministic drafting, then 200 well inside a
 * vendor's ~5s webhook timeout.
 *
 * Uses the Web-standard Response (not next/server) so it is exercisable in unit
 * tests without the Next runtime; Next 14 App Router accepts a plain Response.
 */

/** URL channel labels a merchant may configure. Cosmetic routing label only —
 *  every canonical webhook flows the `email`-shaped pipeline (see ingest-schema). */
export const INGEST_CHANNELS: readonly string[] = ["webhook", "gorgias", "zendesk", "email"];

export async function handleCanonicalIngest(
  req: Request,
  channel: string,
  token: string,
): Promise<Response> {
  const raw = await req.text();

  if (!INGEST_CHANNELS.includes(channel)) {
    return Response.json({ error: "unknown channel" }, { status: 400 });
  }

  // Merchant identity is bound to the URL token — never a body/query id.
  const repos = getRepositories();
  const merchant = token ? await repos.merchants.findByInboxToken(token) : null;
  if (!merchant) {
    // Unknown token → 404, bare, no merchant leak.
    return new Response(null, { status: 404 });
  }

  // ── auth gate ──────────────────────────────────────────────────────────────
  // Two layers of secret protect this endpoint: the unguessable per-merchant URL
  // token (already verified above — a bad token 404'd) AND, for a live merchant,
  // an HMAC body signature. Unsigned payloads are accepted ONLY on the demo/test
  // path: DEMO_MODE != "false" AND NODE_ENV != "production" AND no root secret —
  // the same posture as .env.example and the resend inbound route. Everywhere
  // else (any production build, an explicit DEMO_MODE=false, or a root secret
  // set) the signature over the RAW bytes must verify before any parse, and a
  // missing WEBHOOK_ROOT_SECRET fails closed — an empty root would make the
  // derived secret computable from the public URL token, so we 401 rather than
  // accept a forgeable signature.
  const secret = process.env.WEBHOOK_ROOT_SECRET;
  const demo = process.env.DEMO_MODE !== "false" && process.env.NODE_ENV !== "production";
  if (demo && !secret) {
    // demo/test path: token-authenticated, signature optional.
  } else if (
    !secret ||
    !verifyWebhookSig(raw, req.headers.get(SIGNATURE_HEADER), deriveWebhookSecret(token))
  ) {
    return new Response(null, { status: 401 });
  }

  let json: unknown;
  try {
    json = JSON.parse(raw);
  } catch {
    return Response.json({ error: "invalid JSON" }, { status: 400 });
  }
  const parsed = CanonicalIngestSchema.safeParse(json);
  if (!parsed.success) {
    return Response.json({ error: "invalid body" }, { status: 400 });
  }
  const payload = parsed.data;

  // Drop-at-edge (ADR-0011 §4): when the merchant scopes ingest to presale tags,
  // anything without a matching tag — INCLUDING an untagged payload — is acked
  // but never persisted or drafted (honors the onboarding promise "untagged
  // tickets never reach us"). With no presaleTags configured, accept everything.
  const tags = payload.tags ?? [];
  const allowed = merchant.presaleTags;
  if (allowed && allowed.length > 0 && !tags.some((t) => allowed.includes(t))) {
    console.log(
      JSON.stringify({ event: "ingest.discarded", merchantId: merchant.id, channel, tags }),
    );
    return Response.json({ status: "discarded" });
  }

  const normalized = normalizeCanonical(payload, merchant.id);
  const result = await ingestTicket(normalized);
  if ("error" in result) {
    return Response.json({ status: "error", error: result.error }, { status: 422 });
  }
  if (result.duplicate) {
    return Response.json({ status: "duplicate", ticketId: result.ticket.id });
  }
  return Response.json({
    status: "ingested",
    ticketId: result.ticket.id,
    draft: result.ticket.draft,
  });
}
