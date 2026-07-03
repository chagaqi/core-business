import { NextResponse } from "next/server";
import { timingSafeEqual } from "crypto";
import { getRepositories } from "@/lib/repositories";
import { sweepResolvedQuiet } from "@/lib/outcome-sweep";

/**
 * GET /api/cron/sweep-outcomes — the daily scheduled job (ADR-0013, task F4).
 * Vercel Cron hits this at 08:00 UTC (see vercel.json). It runs the
 * `resolved_quiet` sweep for every merchant: the one outcome kind E2 could not
 * emit synchronously (it is the absence of a later event), so it needs a
 * time-based recompute rather than an ingest hook.
 *
 * PUBLIC path, secret-authed — like /api/ingest it is NOT behind the operator
 * cookie gate (middleware's matcher does not list /api/cron). It authenticates on
 * its own bearer secret instead:
 *
 *   Vercel attaches `Authorization: Bearer <CRON_SECRET>` automatically when
 *   CRON_SECRET is set in project env. In production we FAIL CLOSED — a missing
 *   secret OR a mismatched header is 401, so the sweep never runs unauthenticated
 *   in prod (mirrors the ingest posture, ADR-0011). In demo/dev it runs
 *   unauthenticated so the sweep is testable against the seed.
 *
 * The sweep is a full recompute (not incremental) and idempotent by construction,
 * so a missed run self-heals on the next; per-event recording is best-effort
 * (log-and-continue) so one bad write never sinks the whole pass.
 */
export const dynamic = "force-dynamic";

const BEARER_PREFIX = "Bearer ";

/** Constant-time compare of the request's bearer token against CRON_SECRET. */
function bearerMatches(header: string | null, secret: string): boolean {
  if (!header || !header.startsWith(BEARER_PREFIX)) return false;
  const provided = Buffer.from(header.slice(BEARER_PREFIX.length));
  const expected = Buffer.from(secret);
  if (provided.length !== expected.length) return false; // timingSafeEqual throws on mismatch
  try {
    return timingSafeEqual(provided, expected);
  } catch {
    return false;
  }
}

/** Auth posture: fail closed in production, open in demo/dev (see route doc). */
function cronAuthorized(req: Request): boolean {
  const secret = process.env.CRON_SECRET;
  if (process.env.NODE_ENV === "production") {
    // An unset secret means the header is unverifiable → refuse rather than run
    // unauthenticated. A set secret must match the attached bearer exactly.
    if (!secret) return false;
    return bearerMatches(req.headers.get("authorization"), secret);
  }
  // demo/dev: allow unauthenticated so the hosted demo + local tests can drive it.
  return true;
}

export async function GET(req: Request): Promise<Response> {
  if (!cronAuthorized(req)) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  const repos = getRepositories();
  const now = new Date();
  const merchants = await repos.merchants.list();

  let emitted = 0;
  for (const merchant of merchants) {
    const events = await repos.outcomeEvents.listByMerchant(merchant.id);
    const toEmit = sweepResolvedQuiet(events, now);
    for (const event of toEmit) {
      try {
        await repos.outcomeEvents.record(event);
        emitted += 1;
      } catch (err) {
        // Best-effort per event: log and keep sweeping (the next daily run retries).
        console.log(
          JSON.stringify({
            event: "cron.sweep-outcomes.record-failed",
            merchantId: merchant.id,
            orderId: event.orderId,
            variantId: event.variantId,
            error: err instanceof Error ? err.message : String(err),
          }),
        );
      }
    }
  }

  return NextResponse.json({ swept: merchants.length, emitted });
}
