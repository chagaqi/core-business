import assert from "node:assert/strict";
import { test } from "node:test";
import { checkHealth } from "@/lib/health";

const LIVE_SECRET_VARS = ["AUTH_SECRET", "APP_PASSWORD", "WEBHOOK_ROOT_SECRET", "CRON_SECRET"] as const;

/** Snapshot + restore the mode/secret env vars a test perturbs, so tests never
 *  leak state into each other (these are process-global, not per-test). */
function withEnv(vars: Record<string, string | undefined>, fn: () => Promise<void>) {
  const prev: Record<string, string | undefined> = {};
  for (const key of Object.keys(vars)) prev[key] = process.env[key];
  for (const [key, val] of Object.entries(vars)) {
    if (val === undefined) delete process.env[key];
    else process.env[key] = val;
  }
  return fn().finally(() => {
    for (const [key, val] of Object.entries(prev)) {
      if (val === undefined) delete process.env[key];
      else process.env[key] = val;
    }
  });
}

// The default (json) driver is always reachable in tests, and neither NODE_ENV
// nor DEMO_MODE is "live" by default, so a healthy probe is the contract we can
// assert deterministically: ok, status "ok", both sub-checks "ok", and a shape
// that leaks nothing sensitive.
test("checkHealth reports ok when the data driver is reachable and not in live mode", async () => {
  await withEnv({ NODE_ENV: undefined, DEMO_MODE: undefined, ...Object.fromEntries(LIVE_SECRET_VARS.map((v) => [v, undefined])) }, async () => {
    const h = await checkHealth(new Date("2026-07-04T00:00:00.000Z"));
    assert.equal(h.ok, true);
    assert.equal(h.status, "ok");
    assert.equal(h.checks.db, "ok");
    assert.equal(h.checks.secrets, "ok");
    assert.equal(h.driver, "json"); // DATA_DRIVER unset in tests → json
    assert.equal(h.time, "2026-07-04T00:00:00.000Z");
    // Nothing sensitive: no secret values, no PII, no business counts.
    assert.deepEqual(Object.keys(h).sort(), ["checks", "driver", "ok", "status", "time"]);
    assert.deepEqual(Object.keys(h.checks).sort(), ["db", "secrets"]);
  });
});

test("checkHealth degrades when live mode is missing a required secret (EN-29)", async () => {
  await withEnv(
    { DEMO_MODE: "false", AUTH_SECRET: undefined, APP_PASSWORD: "x", WEBHOOK_ROOT_SECRET: "x", CRON_SECRET: "x" },
    async () => {
      const h = await checkHealth();
      assert.equal(h.checks.db, "ok"); // db reachability is unaffected
      assert.equal(h.checks.secrets, "missing");
      assert.equal(h.status, "degraded");
      assert.equal(h.ok, false);
    },
  );
});

test("checkHealth is ok in live mode once every required secret is set (EN-29)", async () => {
  await withEnv(
    { DEMO_MODE: "false", AUTH_SECRET: "a", APP_PASSWORD: "b", WEBHOOK_ROOT_SECRET: "c", CRON_SECRET: "d" },
    async () => {
      const h = await checkHealth();
      assert.equal(h.checks.secrets, "ok");
      assert.equal(h.status, "ok");
      assert.equal(h.ok, true);
    },
  );
});
