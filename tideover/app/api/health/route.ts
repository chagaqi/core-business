import { NextResponse } from "next/server";
import { checkHealth } from "@/lib/health";

/**
 * GET /api/health — liveness + data-driver reachability (task F6).
 *
 * PUBLIC and unauthenticated on purpose: an external uptime monitor
 * (UptimeRobot / Cronitor / BetterStack) pings it as a dead-man switch — see
 * RELEASE.md "Uptime monitoring". Not in middleware.ts's matcher, so it is never
 * operator-gated. 200 {status:"ok"} when healthy; 503 {status:"degraded"} when the
 * DB can't be reached. The logic lives in lib/health.ts (unit-testable).
 */
export const dynamic = "force-dynamic";

export async function GET() {
  const h = await checkHealth();
  return NextResponse.json(
    { status: h.status, driver: h.driver, checks: h.checks, time: h.time },
    { status: h.ok ? 200 : 503, headers: { "Cache-Control": "no-store" } },
  );
}
