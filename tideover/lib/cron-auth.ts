import { timingSafeEqual } from "crypto";

/**
 * Shared auth for /api/cron/* routes (ADR-0013). Vercel Cron attaches
 * `Authorization: Bearer <CRON_SECRET>` when CRON_SECRET is set. FAIL CLOSED in
 * production — a missing secret OR a mismatched bearer is refused, so a job never
 * runs unauthenticated in prod; in demo/dev it runs open so the seed is testable.
 */

const BEARER_PREFIX = "Bearer ";

function bearerMatches(header: string | null, secret: string): boolean {
  if (!header || !header.startsWith(BEARER_PREFIX)) return false;
  const provided = Buffer.from(header.slice(BEARER_PREFIX.length));
  const expected = Buffer.from(secret);
  if (provided.length !== expected.length) return false; // timingSafeEqual throws on length mismatch
  try {
    return timingSafeEqual(provided, expected);
  } catch {
    return false;
  }
}

/** True if the request may run a cron job. Fails closed in production. */
export function cronAuthorized(req: Request): boolean {
  const secret = process.env.CRON_SECRET;
  if (process.env.NODE_ENV === "production") {
    if (!secret) return false;
    return bearerMatches(req.headers.get("authorization"), secret);
  }
  return true; // demo/dev: open so the hosted demo + tests can drive it
}
