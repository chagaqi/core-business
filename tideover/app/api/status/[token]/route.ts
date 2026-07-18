import { NextResponse } from "next/server";
import { getPublicStatus, viewMetaFromHeaders } from "@/lib/status";
import { createRateLimiter } from "@/lib/rate-limit";

/**
 * GET /api/status/[token] — token-scoped customer status. Delegates the PII
 * boundary to getPublicStatus (shared with the /status page). Invalid/forged
 * tokens 404. Basic in-memory rate limiting (60/min per forwarded-for value —
 * shared impl in lib/rate-limit.ts; see its per-instance caveat).
 */
const rateLimited = createRateLimiter(60);

export async function GET(req: Request, { params }: { params: { token: string } }) {
  const ip = req.headers.get("x-forwarded-for") ?? "local";
  if (rateLimited(ip)) return NextResponse.json({ error: "rate limited" }, { status: 429 });

  const status = await getPublicStatus(params.token, viewMetaFromHeaders(req.headers));
  if (!status) return NextResponse.json({ error: "not found" }, { status: 404 });
  return NextResponse.json(status);
}
