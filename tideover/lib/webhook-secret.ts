import { createHmac, timingSafeEqual } from "crypto";

/**
 * Per-merchant webhook signing (ADR-0011, task W2). Tideover's OWN canonical
 * signature — the merchant templates the request body in their helpdesk, so we
 * cannot verify a vendor-native Svix/Gorgias signature over it. Instead each
 * merchant configures a Tideover-derived secret in their webhook tool.
 *
 * Derived secret (no new stored field): the secret is a deterministic function
 * of the merchant's existing `inboxToken` (reused from ADR-0008) keyed by a
 * single server-side root:
 *
 *     webhookSecret = HMAC_SHA256(WEBHOOK_ROOT_SECRET, inboxToken)  (hex)
 *
 * One leaked token exposes exactly one merchant, and rotating the token rotates
 * the secret. With WEBHOOK_ROOT_SECRET unset (demo) the derivation still runs
 * (empty key) so the value is stable, but the route accepts unsigned traffic in
 * demo mode and only enforces the signature once a root secret is configured.
 *
 * Wire format: the merchant's helpdesk sends
 *     X-Tideover-Signature: sha256=<hex HMAC_SHA256(webhookSecret, rawBody)>
 * The `sha256=` prefix is optional on input (bare hex is also accepted).
 */

export const SIGNATURE_HEADER = "x-tideover-signature";
const SIG_PREFIX = "sha256=";

/** Per-merchant webhook secret, derived from the inbox token. */
export function deriveWebhookSecret(inboxToken: string): string {
  const root = process.env.WEBHOOK_ROOT_SECRET ?? "";
  return createHmac("sha256", root).update(inboxToken).digest("hex");
}

/** The canonical body signature a merchant's helpdesk must send (hex). */
export function signWebhookBody(rawBody: string, secret: string): string {
  return createHmac("sha256", secret).update(rawBody).digest("hex");
}

/** Constant-time compare of a `sha256=<hex>` (or bare hex) header against the
 *  expected HMAC of the RAW bytes. Any missing/short-circuit input fails. */
export function verifyWebhookSig(
  rawBody: string,
  signatureHeader: string | null,
  secret: string,
): boolean {
  if (!signatureHeader || !secret) return false;
  const provided = signatureHeader.startsWith(SIG_PREFIX)
    ? signatureHeader.slice(SIG_PREFIX.length)
    : signatureHeader;
  const expected = signWebhookBody(rawBody, secret);
  const a = Buffer.from(provided);
  const b = Buffer.from(expected);
  // Equal-length guard first — timingSafeEqual throws on a length mismatch.
  if (a.length !== b.length) return false;
  try {
    return timingSafeEqual(a, b);
  } catch {
    return false;
  }
}
