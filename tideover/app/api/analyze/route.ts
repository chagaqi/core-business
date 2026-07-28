import { z } from "zod";
import { withApiErrorHandling } from "@/lib/api-handler";
import { analyzeSite } from "@/lib/site-analyze";
import { createRateLimiter, clientIp } from "@/lib/rate-limit";

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

// Naive in-memory per-IP limiter (10/min) — shared impl in lib/rate-limit.ts;
// see its header for the per-instance-on-serverless caveat.
const rateLimited = createRateLimiter(10);

export const POST = withApiErrorHandling("/api/analyze", async (req: Request): Promise<Response> => {
  const ip = clientIp(req);
  if (rateLimited(ip)) return Response.json({ ok: false, reason: "rate-limited" }, { status: 429 });

  // Body cap before parse (pre-merge review 2026-07-27): the body is just {url}.
  const raw = await req.text();
  if (raw.length > 8_000) return Response.json({ ok: false, reason: "too-large" }, { status: 413 });
  let json: unknown = null;
  try {
    json = JSON.parse(raw);
  } catch {
    /* invalid-body reject below */
  }
  const parsed = Body.safeParse(json);
  if (!parsed.success) return Response.json({ ok: false, reason: "invalid-body" }, { status: 400 });

  const result = await analyzeSite(parsed.data.url);
  // result is already { ok:true, ...analysis } or { ok:false, reason }.
  return Response.json(result, { status: result.ok ? 200 : 422 });
});
