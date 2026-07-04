import { getRepositories } from "@/lib/repositories";

/**
 * Liveness + data-driver reachability probe (task F6). Pure of any `next/*`
 * import so it is unit-testable; the /api/health route is a thin wrapper.
 *
 * A trivial read exercises the configured driver end-to-end (the mongo driver
 * connects on first call), raced against a timeout so a wedged connection can't
 * hang the probe — the mongo connect alone can stall ~8s on a bad host, longer
 * than a monitor's patience. Leaks nothing sensitive: up/down + driver name only.
 */
export interface HealthResult {
  ok: boolean;
  status: "ok" | "degraded";
  driver: string;
  checks: { db: "ok" | "unreachable" };
  time: string;
}

const PROBE_TIMEOUT_MS = 5000;

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

  return {
    ok: dbOk,
    status: dbOk ? "ok" : "degraded",
    driver,
    checks: { db: dbOk ? "ok" : "unreachable" },
    time: now.toISOString(),
  };
}
