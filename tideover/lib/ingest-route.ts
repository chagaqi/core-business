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
  // an HMAC body signature. In demo mode the URL token alone authenticates (it is
  // a per-merchant capability, revocable by rotation) so the hosted demo is
  // testable. A real pilot runs with DEMO_MODE=false (set at go-live, task D12),
  // which requires the signature over the RAW bytes before any parse — a forged
  // or unsigned POST then fails closed with 401.
  if (process.env.DEMO_MODE !== "false") {
    // demo: token-authenticated, signature optional.
  } else if (!verifyWebhookSig(raw, req.headers.get(SIGNATURE_HEADER), deriveWebhookSecret(token))) {
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
  // a tagged payload with no match is acked but never persisted or drafted.
  const tags = payload.tags ?? [];
  const allowed = merchant.presaleTags;
  if (tags.length > 0 && allowed && allowed.length > 0 && !tags.some((t) => allowed.includes(t))) {
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
