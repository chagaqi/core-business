import { createHmac } from "crypto";
import { customAlphabet } from "nanoid";

/**
 * ID + token helpers.
 *
 * Entity ids are short prefixed nanoids (human-scannable in seed data).
 * Customer status tokens are opaque, high-entropy, and HMAC-signed so a
 * /status/[token] URL can't be guessed or tampered with, and carries no PII.
 */

const ALPHABET = "0123456789abcdefghijklmnopqrstuvwxyz";
const nano = customAlphabet(ALPHABET, 12);
const nanoToken = customAlphabet(ALPHABET, 24);

export type IdPrefix = "mch" | "ord" | "cus" | "tkt" | "gft" | "sig" | "drf";

export function newId(prefix: IdPrefix): string {
  return `${prefix}_${nano()}`;
}

function secret(): string {
  return process.env.STATUS_TOKEN_SECRET || "dev-only-change-me";
}

function sign(raw: string): string {
  return createHmac("sha256", secret()).update(raw).digest("hex").slice(0, 10);
}

/**
 * Build a status token: <24-char random>.<10-char hmac>. The random part is the
 * lookup key stored on the order; the suffix authenticates it.
 */
export function newStatusToken(): string {
  const raw = nanoToken();
  return `${raw}.${sign(raw)}`;
}

/** Verify a token's signature. Returns the lookup key or null if invalid. */
export function verifyStatusToken(token: string): string | null {
  const [raw, mac] = token.split(".");
  if (!raw || !mac) return null;
  // constant-ish time compare is overkill for the demo; correctness is the point.
  return sign(raw) === mac ? raw : null;
}
