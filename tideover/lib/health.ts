import { getRepositories } from "@/lib/repositories";

/**
 * Liveness + reachability + config probe (task F6, deepened by EN-29). Pure of
 * any `next/*` import so it is unit-testable; the /api/health route is a thin
 * wrapper.
 *
 * Two independent sub-checks feed the overall status:
 *   - db: a trivial read exercises the configured driver end-to-end (the mongo
 *     driver connects on first call), raced against a timeout so a wedged
 *     connection can't hang the probe — the mongo connect alone can stall ~8s
 *     on a bad host, longer than a monitor's patience.
 *   - secrets: in live mode (NODE_ENV=production OR the explicit DEMO_MODE=false
 *     override, ADR-0017's two real-mode signals — checked permissively so
 *     neither convention is missed), several routes fail closed/silently the
 *     moment their secret is unset: AUTH_SECRET (session signing, lib/session.ts),
 *     APP_PASSWORD (login), WEBHOOK_ROOT_SECRET (ingest signature, ADR-0011 —
 *     unset means every helpdesk webhook 401s), CRON_SECRET (daily sweep,
 *     ADR-0013 — unset means the cron 401s and silently never runs). Before this
 *     check, that failure mode was invisible: the routes 401/no-op correctly, but
 *     health still reported 200. This does not name which secret is missing
 *     (env var names only would leak here, not values, but the aggregate is
 *     enough for a monitor to page on and keeps the response shape simple).
 *   - Cron *staleness* (last-run recency) would need a new persisted
 *     last-run timestamp — out of scope here (Cluster C does not touch the
 *     repository seam); presence of CRON_SECRET is the cheap proxy this adds.
 *
 * Leaks nothing sensitive: up/down + driver name + which sub-check category
 * failed, never a secret value or a business count.
 */
export interface HealthResult {
  ok: boolean;
  status: "ok" | "degraded";
  driver: string;
  checks: { db: "ok" | "unreachable"; secrets: "ok" | "missing" };
  time: string;
}

const PROBE_TIMEOUT_MS = 5000;

/** Live/production posture by either of the codebase's two existing signals. */
function isLiveMode(): boolean {
  return process.env.NODE_ENV === "production" || process.env.DEMO_MODE === "false";
}

/** Secrets a live deploy needs for auth, ingest, and the daily cron to work at
 *  all. Not required in demo/dev, where these routes intentionally run open. */
const REQUIRED_LIVE_SECRETS = ["AUTH_SECRET", "APP_PASSWORD", "WEBHOOK_ROOT_SECRET", "CRON_SECRET"] as const;

function secretsPresent(): boolean {
  if (!isLiveMode()) return true;
  return REQUIRED_LIVE_SECRETS.every((name) => Boolean(process.env[name]));
}

export async function checkHealth(now: Date = new Date()): Promise<HealthResult> {
  const driver = process.env.DATA_DRIVER ?? "json";
  let dbOk = false;
  let timer: ReturnType<typeof setTimeout> | undefined;
  try {
    await Promise.race([
      getRepositories()
        .merchants.list()
        .then(() => {
          dbOk = true;
        }),
      new Promise((_, reject) => {
        timer = setTimeout(() => reject(new Error("probe timeout")), PROBE_TIMEOUT_MS);
      }),
    ]);
  } catch {
    dbOk = false;
  } finally {
    if (timer) clearTimeout(timer);
  }

  const secretsOk = secretsPresent();
  const ok = dbOk && secretsOk;

  return {
    ok,
    status: ok ? "ok" : "degraded",
    driver,
    checks: { db: dbOk ? "ok" : "unreachable", secrets: secretsOk ? "ok" : "missing" },
    time: now.toISOString(),
  };
}
