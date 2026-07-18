import assert from "node:assert/strict";
import { afterEach, beforeEach, test } from "node:test";
import { cronAuthorized } from "@/lib/cron-auth";
import { GET } from "@/app/api/cron/trial-reminders/route";

const ENV = ["NODE_ENV", "CRON_SECRET"] as const;
const saved: Record<string, string | undefined> = {};
beforeEach(() => {
  for (const k of ENV) saved[k] = process.env[k];
});
afterEach(() => {
  for (const k of ENV) {
    if (saved[k] === undefined) delete process.env[k];
    else process.env[k] = saved[k];
  }
});

function reqWith(auth?: string): Request {
  return new Request("https://app.tideover.app/api/cron/trial-reminders", {
    headers: auth ? { authorization: auth } : {},
  });
}

// ── cron auth (shared, fail-closed) ──────────────────────────────────────────

test("cronAuthorized: production requires the exact bearer; dev is open", () => {
  process.env.NODE_ENV = "production";
  delete process.env.CRON_SECRET;
  assert.equal(cronAuthorized(reqWith("Bearer x")), false, "prod + no secret → refuse");

  process.env.CRON_SECRET = "s3cr3t";
  assert.equal(cronAuthorized(reqWith("Bearer s3cr3t")), true, "prod + matching bearer → allow");
  assert.equal(cronAuthorized(reqWith("Bearer wrong")), false, "prod + wrong bearer → refuse");
  assert.equal(cronAuthorized(reqWith()), false, "prod + no header → refuse");

  process.env.NODE_ENV = "test";
  assert.equal(cronAuthorized(reqWith()), true, "dev/test → open");
});

// ── the route ────────────────────────────────────────────────────────────────

test("trial-reminders route: fails closed in prod without a secret", async () => {
  process.env.NODE_ENV = "production";
  delete process.env.CRON_SECRET;
  const res = await GET(reqWith());
  assert.equal(res.status, 401);
});

test("trial-reminders route: authorized run over the seed is a clean no-op (demo merchants aren't trialing)", async () => {
  process.env.NODE_ENV = "test"; // open
  const res = await GET(reqWith());
  assert.equal(res.status, 200);
  const body = (await res.json()) as { merchants: number; sent: number; skipped: number };
  assert.ok(body.merchants >= 1, "iterated the seed merchants");
  assert.equal(body.sent, 0, "no seeded merchant is a real trialing account");
  assert.equal(body.skipped, 0, "and none had a due reminder to skip");
});
