import assert from "node:assert/strict";
import { test } from "node:test";
import { checkHealth } from "@/lib/health";

// The default (json) driver is always reachable in tests, so a healthy probe is
// the contract we can assert deterministically: ok, status "ok", db "ok", and a
// shape that leaks nothing sensitive.
test("checkHealth reports ok when the data driver is reachable", async () => {
  const h = await checkHealth(new Date("2026-07-04T00:00:00.000Z"));
  assert.equal(h.ok, true);
  assert.equal(h.status, "ok");
  assert.equal(h.checks.db, "ok");
  assert.equal(h.driver, "json"); // DATA_DRIVER unset in tests → json
  assert.equal(h.time, "2026-07-04T00:00:00.000Z");
  // Nothing sensitive: no secrets, no PII, no business counts.
  assert.deepEqual(Object.keys(h).sort(), ["checks", "driver", "ok", "status", "time"]);
});
