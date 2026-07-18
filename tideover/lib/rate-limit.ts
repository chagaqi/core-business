/**
 * Naive in-memory rate limiter shared by the public token-gated API routes
 * (/api/analyze, /api/status/[token], /api/widget-submit). Fixed window: the
 * first hit for a key opens a window; hits past `max` inside `windowMs` are
 * rejected until the window expires.
 *
 * KNOWN LIMITATION — per-instance, not distributed. The hit map lives in
 * module memory, so on serverless (Vercel) the cap is per lambda instance and
 * resets on cold start: N warm instances allow up to N×max per window, and a
 * parallel flood that fans out across instances is only partially throttled.
 * It still blunts the common case — a single source hammering one warm
 * instance — and it is the only throttle we run today. Upgrade path when a
 * real cap matters: back the counter with a shared store (Upstash Redis or
 * Vercel KV `INCR` + TTL, or a Mongo TTL collection), or add a platform-level
 * WAF rate rule in front of the route. Do not treat this limiter as a
 * security boundary; it is cost control and abuse friction.
 */
export function createRateLimiter(max: number, windowMs = 60_000): (key: string) => boolean {
  const hits = new Map<string, { n: number; ts: number }>();
  /** Returns true when `key` is over its limit for the current window. */
  return function rateLimited(key: string): boolean {
    const now = Date.now();
    const e = hits.get(key);
    if (!e || now - e.ts > windowMs) {
      hits.set(key, { n: 1, ts: now });
      return false;
    }
    e.n += 1;
    return e.n > max;
  };
}

/** First client IP from x-forwarded-for (the connecting client on Vercel),
 *  with a stable fallback for local/test requests that carry no header. */
export function clientIp(req: Request): string {
  return req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || "local";
}
