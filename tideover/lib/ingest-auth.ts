import { createHmac, timingSafeEqual } from "crypto";
import { deriveWebhookSecret, verifyWebhookSig, SIGNATURE_HEADER } from "@/lib/webhook-secret";
import type { IngestAuthScheme, IngestVendorSpec } from "@/lib/channel-adapters/ingest-vendors";

/**
 * Per-vendor ingest auth (ADR-0021).
 *
 * Every credential is DERIVED from (WEBHOOK_ROOT_SECRET, inboxToken) with a
 * domain separator, exactly like the original webhook secret (ADR-0011):
 *
 *     credential(purpose) = HMAC_SHA256(WEBHOOK_ROOT_SECRET, "<purpose>:<inboxToken>")
 *
 * so no new per-merchant field is stored, the secrets are independent of each
 * other (a leaked bearer does not yield the HMAC key), one leaked token exposes
 * exactly one merchant, and rotating the token rotates every credential at once.
 *
 * THE POSTURE IS UNCHANGED AND STILL FAILS CLOSED:
 *   - demo/dev with no root secret  → unauthenticated accept (seeded/test path).
 *   - anything else                 → a root secret MUST be set AND one of the
 *                                     vendor's schemes MUST verify, or 401.
 *   - NODE_ENV=production           → never the demo branch, even with DEMO_MODE
 *                                     and the root secret both unset.
 *
 * What changed is WHAT counts as verifying: the strongest credential the vendor
 * can actually send, instead of one scheme two of our four target helpdesks are
 * physically incapable of producing.
 */

/** Where each credential arrives. */
export const BEARER_HEADER = "authorization";
/** Fallback for tools that cannot set `Authorization` (some proxies strip it). */
export const BEARER_HEADER_ALT = "x-tideover-token";
export const HELPSCOUT_SIGNATURE_HEADER = "x-helpscout-signature";
export { SIGNATURE_HEADER };

/** Why a payload was turned away. Every value maps to a copy-paste fix
 *  (lib/ingest-health.ts → ingestFixFor) that the merchant sees on /app/setup. */
export type IngestRejectReason =
  | "no-root-secret"
  | "missing-credential"
  | "bad-bearer"
  | "bad-signature"
  | "ip-not-allowed";

export type IngestAuthResult =
  | { ok: true; scheme: IngestAuthScheme | "demo-unsigned" }
  | { ok: false; reason: IngestRejectReason };

/** Help Scout caps a webhook secret key at 40 characters, so ours is 32. */
const HELPSCOUT_SECRET_LEN = 32;
/** Recognizable prefix so a merchant can tell our bearer from their other keys. */
const BEARER_PREFIX = "tdo_";

function derive(purpose: string, inboxToken: string): string {
  const root = process.env.WEBHOOK_ROOT_SECRET ?? "";
  return createHmac("sha256", root).update(`${purpose}:${inboxToken}`).digest("hex");
}

/**
 * The long random per-merchant shared secret Gorgias/Zendesk send as
 * `Authorization: Bearer <secret>`. 256 bits of entropy behind the root secret.
 */
export function deriveBearerSecret(inboxToken: string): string {
  return `${BEARER_PREFIX}${derive("bearer", inboxToken)}`;
}

/**
 * The secret the merchant pastes into Help Scout's "Secret Key" field when they
 * create the webhook. Help Scout then signs every payload with it, and we verify
 * with the same derived value — so Help Scout's OWN signature scheme works
 * end-to-end with nothing stored on our side.
 */
export function deriveHelpScoutSecret(inboxToken: string): string {
  return derive("helpscout", inboxToken).slice(0, HELPSCOUT_SECRET_LEN);
}

/** Help Scout's signature: base64(HMAC-SHA1(rawBody, secret)). */
export function signHelpScoutBody(rawBody: string, secret: string): string {
  return createHmac("sha1", secret).update(rawBody, "utf8").digest("base64");
}

/** Constant-time compare of two secrets/signatures. Length mismatch → false. */
function constantTimeEqual(a: string, b: string): boolean {
  const ab = Buffer.from(a);
  const bb = Buffer.from(b);
  if (ab.length !== bb.length || ab.length === 0) return false;
  try {
    return timingSafeEqual(ab, bb);
  } catch {
    return false;
  }
}

/** Verify Help Scout's `X-HelpScout-Signature` over the RAW bytes. */
export function verifyHelpScoutSig(
  rawBody: string,
  signatureHeader: string | null,
  secret: string,
): boolean {
  if (!signatureHeader || !secret) return false;
  return constantTimeEqual(signatureHeader.trim(), signHelpScoutBody(rawBody, secret));
}

/** Verify a shared-secret bearer header in constant time. Accepts `Bearer <s>`,
 *  `Token <s>` and a bare `<s>` (Zendesk's "API key" mode sends the bare value). */
export function verifyBearer(header: string | null, expected: string): boolean {
  if (!header || !expected) return false;
  const provided = header.trim().replace(/^(?:bearer|token)\s+/i, "");
  return constantTimeEqual(provided, expected);
}

// ── optional IP allowlist ───────────────────────────────────────────────────
// Defense in depth for the bearer schemes: a shared secret is replayable, so a
// merchant on Gorgias/Zendesk can additionally pin ingest to the vendor's egress
// ranges. OFF by default (an empty/unset list allows everything) — turning it on
// with a wrong range would silently empty the queue, which is the exact failure
// this whole ADR exists to kill, so it must be an explicit opt-in.

/** Comma-separated exact IPs and/or IPv4 CIDRs, e.g. "1.2.3.4,52.10.0.0/16". */
export function ipAllowlist(): string[] {
  return (process.env.INGEST_IP_ALLOWLIST ?? "")
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean);
}

function ipv4ToInt(ip: string): number | null {
  const parts = ip.split(".");
  if (parts.length !== 4) return null;
  let out = 0;
  for (const p of parts) {
    if (!/^\d{1,3}$/.test(p)) return null;
    const n = Number(p);
    if (n > 255) return null;
    out = (out << 8) | n;
  }
  return out >>> 0;
}

/** Pure allowlist check. An empty list allows everything (feature off). */
export function ipAllowed(clientIp: string | null, list: readonly string[]): boolean {
  if (list.length === 0) return true;
  if (!clientIp) return false;
  const ip = clientIp.trim();
  const asInt = ipv4ToInt(ip);
  for (const entry of list) {
    if (entry === ip) return true;
    const slash = entry.indexOf("/");
    if (slash === -1 || asInt === null) continue;
    const base = ipv4ToInt(entry.slice(0, slash));
    const bits = Number(entry.slice(slash + 1));
    if (base === null || !Number.isInteger(bits) || bits < 0 || bits > 32) continue;
    const mask = bits === 0 ? 0 : (0xffffffff << (32 - bits)) >>> 0;
    if ((asInt & mask) === (base & mask)) return true;
  }
  return false;
}

/** The caller's IP as seen through the platform proxy. Trusts x-forwarded-for's
 *  FIRST hop, which on Vercel is set by the platform edge, not the client. */
export function clientIpFrom(headers: Headers): string | null {
  const xff = headers.get("x-forwarded-for");
  if (xff) {
    const first = xff.split(",")[0]?.trim();
    if (first) return first;
  }
  return headers.get("x-real-ip")?.trim() ?? null;
}

/** True when the request is on the demo/seeded path (unauthenticated accept).
 *  Production is NEVER demo, even with DEMO_MODE unset — a misconfigured deploy
 *  must not take forged webhooks. */
export function isDemoIngestPosture(): boolean {
  return process.env.DEMO_MODE !== "false" && process.env.NODE_ENV !== "production";
}

export interface IngestAuthInput {
  rawBody: string;
  headers: Headers;
  /** the merchant's inboxToken — every credential is derived from it. */
  inboxToken: string;
  spec: IngestVendorSpec;
}

/**
 * Verify a webhook against the credentials its vendor can actually produce.
 *
 * Order of operations (nothing is parsed before this returns ok):
 *   1. demo/seeded path (no root secret, not production) → accept.
 *   2. no root secret anywhere else → REJECT. An empty root makes every derived
 *      credential computable from the public URL token, so accepting would be
 *      accepting a forgeable secret. Fail closed.
 *   3. optional IP allowlist.
 *   4. try each of the vendor's schemes, strongest first, over the RAW bytes.
 *   5. no credential sent at all → `missing-credential` (the single most common
 *      real-world misconfiguration, and the one whose fix text matters most).
 */
export function verifyIngestAuth(input: IngestAuthInput): IngestAuthResult {
  const { rawBody, headers, inboxToken, spec } = input;

  const root = process.env.WEBHOOK_ROOT_SECRET;
  if (isDemoIngestPosture() && !root) return { ok: true, scheme: "demo-unsigned" };
  if (!root) return { ok: false, reason: "no-root-secret" };

  if (!ipAllowed(clientIpFrom(headers), ipAllowlist())) {
    return { ok: false, reason: "ip-not-allowed" };
  }

  let sawCredential = false;
  let lastFailed: IngestAuthScheme | null = null;

  for (const scheme of spec.schemes) {
    if (scheme === "tideover-hmac") {
      const sig = headers.get(SIGNATURE_HEADER);
      if (!sig) continue;
      sawCredential = true;
      if (verifyWebhookSig(rawBody, sig, deriveWebhookSecret(inboxToken))) {
        return { ok: true, scheme };
      }
      lastFailed = scheme;
    } else if (scheme === "helpscout-hmac-sha1") {
      const sig = headers.get(HELPSCOUT_SIGNATURE_HEADER);
      if (!sig) continue;
      sawCredential = true;
      if (verifyHelpScoutSig(rawBody, sig, deriveHelpScoutSecret(inboxToken))) {
        return { ok: true, scheme };
      }
      lastFailed = scheme;
    } else {
      const bearer = headers.get(BEARER_HEADER) ?? headers.get(BEARER_HEADER_ALT);
      if (!bearer) continue;
      sawCredential = true;
      if (verifyBearer(bearer, deriveBearerSecret(inboxToken))) {
        return { ok: true, scheme };
      }
      lastFailed = scheme;
    }
  }

  if (!sawCredential) return { ok: false, reason: "missing-credential" };
  return { ok: false, reason: lastFailed === "bearer" ? "bad-bearer" : "bad-signature" };
}
