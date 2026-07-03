/**
 * Operator session cookie (ADR-0004). Value is "<expiresEpoch>.<hexsig>" where
 * the sig is HMAC-SHA256 over "tideover-session.<expiresEpoch>" keyed with
 * AUTH_SECRET. Uses SubtleCrypto only so the same helper runs in edge
 * middleware and node route handlers.
 */
export const SESSION_COOKIE = "tideover_session";

const SESSION_TTL_SECONDS = 7 * 24 * 60 * 60;
const SIGNED_PREFIX = "tideover-session";

async function hmacHex(secret: string, message: string): Promise<string> {
  const enc = new TextEncoder();
  const key = await crypto.subtle.importKey(
    "raw",
    enc.encode(secret),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"],
  );
  const sig = await crypto.subtle.sign("HMAC", key, enc.encode(message));
  return Array.from(new Uint8Array(sig))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}

/** Constant-time string compare (edge has no timingSafeEqual). */
function safeEqual(a: string, b: string): boolean {
  if (a.length !== b.length) return false;
  let diff = 0;
  for (let i = 0; i < a.length; i++) diff |= a.charCodeAt(i) ^ b.charCodeAt(i);
  return diff === 0;
}

/** Mint a session value valid for 7 days. Throws if AUTH_SECRET is unset. */
export async function createSessionValue(now = Date.now()): Promise<string> {
  const secret = process.env.AUTH_SECRET;
  if (!secret) throw new Error("AUTH_SECRET is not set");
  const expires = Math.floor(now / 1000) + SESSION_TTL_SECONDS;
  return `${expires}.${await hmacHex(secret, `${SIGNED_PREFIX}.${expires}`)}`;
}

/** True iff the value is well-formed, unexpired, and correctly signed. */
export async function verifySessionValue(value: string, now = Date.now()): Promise<boolean> {
  const secret = process.env.AUTH_SECRET;
  if (!secret) return false;
  const dot = value.indexOf(".");
  if (dot <= 0) return false;
  const expiresRaw = value.slice(0, dot);
  const sig = value.slice(dot + 1);
  if (!/^\d+$/.test(expiresRaw) || !sig) return false;
  if (Number(expiresRaw) * 1000 <= now) return false;
  return safeEqual(sig, await hmacHex(secret, `${SIGNED_PREFIX}.${expiresRaw}`));
}

/** Cookie attributes shared by login (set) and logout (clear). */
export function sessionCookieOptions() {
  return {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax" as const,
    path: "/",
    maxAge: SESSION_TTL_SECONDS,
  };
}
