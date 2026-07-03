import { createHmac, timingSafeEqual } from "crypto";

/**
 * Hand-rolled Svix webhook verification (ADR-0008) — no new dependency, mirrors
 * the HMAC pattern in GorgiasAdapter.verifyWebhook. Resend signs its inbound
 * webhooks with Svix, so this is the gate on POST /api/inbound/resend.
 *
 * The signed content is `${svix-id}.${svix-timestamp}.${rawBody}`, HMAC-SHA256
 * keyed by the base64-decoded portion of the `whsec_<base64>` secret. The
 * `svix-signature` header carries one or more space-separated `v1,<base64>`
 * entries (a secret rotation exposes both old + new), so a match against ANY of
 * them passes. The digest is base64'd and compared constant-time. A timestamp
 * outside a 5-minute skew is rejected to blunt replay of a captured payload.
 *
 * Node crypto is fine here: this runs in the Node route handler, not the edge.
 */

const TOLERANCE_SEC = 5 * 60;

/** Constant-time string compare (equal-length guard first — timingSafeEqual throws otherwise). */
function safeEqual(a: string, b: string): boolean {
  const ab = Buffer.from(a);
  const bb = Buffer.from(b);
  if (ab.length !== bb.length) return false;
  return timingSafeEqual(ab, bb);
}

export function verifySvix(rawBody: string, headers: Headers, secret: string): boolean {
  const id = headers.get("svix-id");
  const timestamp = headers.get("svix-timestamp");
  const signature = headers.get("svix-signature");
  if (!id || !timestamp || !signature || !secret) return false;

  // Reject a stale (or absurd future) timestamp before doing any HMAC work.
  const ts = Number(timestamp);
  if (!Number.isFinite(ts)) return false;
  const nowSec = Math.floor(Date.now() / 1000);
  if (Math.abs(nowSec - ts) > TOLERANCE_SEC) return false;

  // Secret is `whsec_<base64>`; the HMAC key is the decoded base64 material.
  const b64 = secret.startsWith("whsec_") ? secret.slice("whsec_".length) : secret;
  const key = Buffer.from(b64, "base64");
  if (key.length === 0) return false;

  const signedContent = `${id}.${timestamp}.${rawBody}`;
  const expected = createHmac("sha256", key).update(signedContent).digest("base64");

  // Header is a space-separated list of `<version>,<signature>` pairs.
  for (const entry of signature.split(" ")) {
    const comma = entry.indexOf(",");
    if (comma < 0) continue;
    const version = entry.slice(0, comma);
    const sig = entry.slice(comma + 1);
    if (version !== "v1" || !sig) continue;
    if (safeEqual(expected, sig)) return true;
  }
  return false;
}
