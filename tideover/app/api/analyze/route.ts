import { z } from "zod";
import { withApiErrorHandling } from "@/lib/api-handler";
import { analyzeSite } from "@/lib/site-analyze";

/**
 * POST /api/analyze — deterministic site / Kickstarter analysis for onboarding
 * autofill (UX-90). Fetches the merchant's own URL behind the SSRF guard in
 * lib/site-analyze and returns brand + reward + gift-candidate signals. Reads no
 * datastore, so it is safe in both demo and real mode.
 *
 * SECURITY: this fetches an operator-supplied URL. It is listed in middleware's
 * matcher so real mode requires operator auth before it will run — the SSRF
 * guard is defense-in-depth on top of that gate, not the only control. No
 * upstream HTML is ever echoed to the client; failures return a tagged reason.
 * Node runtime is required for node:dns / node:net used by the guard.
 */
export const runtime = "nodejs";

const Body = z.object({ url: z.string().url().max(2048) });

// Naive in-memory per-IP limiter (10/min), mirroring app/api/status/[token].
const HITS = new Map<string, { n: number; ts: number }>();
function rateLimited(key: string): boolean {
  const now = Date.now();
  const e = HITS.get(key);
  if (!e || now - e.ts > 60000) {
    HITS.set(key, { n: 1, ts: now });
    return false;
  }
  e.n += 1;
  return e.n > 10;
}

export const POST = withApiErrorHandling("/api/analyze", async (req: Request): Promise<Response> => {
  const ip = req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || "local";
  if (rateLimited(ip)) return Response.json({ ok: false, reason: "rate-limited" }, { status: 429 });

  const parsed = Body.safeParse(await req.json().catch(() => null));
  if (!parsed.success) return Response.json({ ok: false, reason: "invalid-body" }, { status: 400 });

  const result = await analyzeSite(parsed.data.url);
  // result is already { ok:true, ...analysis } or { ok:false, reason }.
  return Response.json(result, { status: result.ok ? 200 : 422 });
});
