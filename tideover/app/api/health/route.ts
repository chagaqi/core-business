import { NextResponse } from "next/server";
import { checkHealth } from "@/lib/health";

/**
 * GET /api/health — liveness + data-driver reachability + live-config depth
 * (task F6, deepened by EN-29).
 *
 * PUBLIC and unauthenticated on purpose: an external uptime monitor
 * (UptimeRobot / Cronitor / BetterStack) pings it as a dead-man switch — see
 * RELEASE.md "Uptime monitoring". Not in middleware.ts's matcher, so it is never
 * operator-gated. 200 {status:"ok"} when healthy; 503 {status:"degraded"} when the
 * DB can't be reached OR (in live mode) a required secret is unset — auth,
 * ingest signing, and the daily cron all fail closed/silently without one, which
 * used to be invisible to this endpoint. The logic lives in lib/health.ts
 * (unit-testable); this route stays a thin pass-through.
 */
export const dynamic = "force-dynamic";

export async function GET() {
  const h = await checkHealth();
  return NextResponse.json(
    { status: h.status, driver: h.driver, checks: h.checks, time: h.time },
    { status: h.ok ? 200 : 503, headers: { "Cache-Control": "no-store" } },
  );
}
