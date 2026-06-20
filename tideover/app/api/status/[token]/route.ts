import { NextResponse } from "next/server";
import { getPublicStatus } from "@/lib/status";

/**
 * GET /api/status/[token] — token-scoped customer status. Delegates the PII
 * boundary to getPublicStatus (shared with the /status page). Invalid/forged
 * tokens 404. Basic in-memory rate limiting.
 */
const HITS = new Map<string, { n: number; ts: number }>();
function rateLimited(key: string): boolean {
  const now = Date.now();
  const e = HITS.get(key);
  if (!e || now - e.ts > 60000) {
    HITS.set(key, { n: 1, ts: now });
    return false;
  }
  e.n += 1;
  return e.n > 60;
}

export async function GET(req: Request, { params }: { params: { token: string } }) {
  const ip = req.headers.get("x-forwarded-for") ?? "local";
  if (rateLimited(ip)) return NextResponse.json({ error: "rate limited" }, { status: 429 });

  const status = await getPublicStatus(params.token);
  if (!status) return NextResponse.json({ error: "not found" }, { status: 404 });
  return NextResponse.json(status);
}
