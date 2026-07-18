import assert from "node:assert/strict";
import { test } from "node:test";
import { getRepositories } from "@/lib/repositories";
import { entitlementsFor, DEFAULT_ENTITLEMENTS } from "@/lib/entitlements";
import { trialState, isSoftLocked, TRIAL_DAYS } from "@/lib/trial";
import type { Merchant, PlanKey } from "@/lib/types";

const NOW = new Date("2026-07-16T12:00:00.000Z");
const DAY = 24 * 60 * 60 * 1000;
const daysAgo = (n: number) => new Date(NOW.getTime() - n * DAY).toISOString();

/** A real seed merchant, overridden into a trialing (real, non-demo) merchant. */
async function trialingMerchant(overrides: Partial<Merchant> = {}): Promise<Merchant> {
  const repos = getRepositories();
  const base = await repos.merchants.findById("mch_lumen0001");
  assert.ok(base, "seed merchant resolves");
  return {
    ...base!,
    isDemo: false,
    ownerSub: "auth0|trial-tester",
    plan: null,
    subscriptionStatus: null,
    trialRemindersSent: [],
    createdAt: daysAgo(3),
    ...overrides,
  };
}

// ── entitlements ──────────────────────────────────────────────────────────────

test("entitlementsFor: the published ladder maps to the enforced caps", () => {
  const expected: Record<PlanKey, { seatCap: number; orderCap: number }> = {
    starter: { seatCap: 1, orderCap: 1_000 },
    growth: { seatCap: 3, orderCap: 5_000 },
    scale: { seatCap: 10, orderCap: 15_000 },
  };
  for (const plan of Object.keys(expected) as PlanKey[]) {
    const e = entitlementsFor(plan);
    assert.equal(e.seatCap, expected[plan].seatCap, `${plan} seatCap`);
    assert.equal(e.orderCap, expected[plan].orderCap, `${plan} orderCap`);
  }
});

test("entitlementsFor: a null/undefined plan keeps the backward-compatible ceilings", () => {
  // seed/demo/legacy/trialing merchants must behave exactly as before ADR-0022.
  assert.deepEqual(entitlementsFor(null), DEFAULT_ENTITLEMENTS);
  assert.deepEqual(entitlementsFor(undefined), DEFAULT_ENTITLEMENTS);
  assert.equal(DEFAULT_ENTITLEMENTS.seatCap, 10);
  assert.equal(DEFAULT_ENTITLEMENTS.orderCap, 50_000);
});

// ── trial: applicability ────────────────────────────────────────────────────────

test("trialState: demo, legacy (no owner), and on-a-plan merchants are not-applicable", async () => {
  const demo = await trialingMerchant({ isDemo: true });
  const legacy = await trialingMerchant({ ownerSub: null });
  const paid = await trialingMerchant({ plan: "growth" });
  const active = await trialingMerchant({ subscriptionStatus: "active" });
  for (const m of [demo, legacy, paid, active]) {
    const s = trialState(m, NOW);
    assert.equal(s.phase, "not-applicable");
    assert.equal(s.dueReminder, null);
    assert.equal(isSoftLocked(m, NOW), false, "never soft-lock a non-trialing merchant");
  }
});

test("trialState: a canceled subscription soft-locks (expired), never resurrected onto the trial clock", async () => {
  // 3 days since createdAt — the raw clock would say "active" with ~11 days left.
  const canceled = await trialingMerchant({ subscriptionStatus: "canceled", createdAt: daysAgo(3) });
  const s = trialState(canceled, NOW);
  assert.equal(s.phase, "expired", "canceled → expired, not a live trial");
  assert.equal(isSoftLocked(canceled, NOW), true);
  assert.equal(s.dueReminder, null, "no trial reminders for a canceled account");
});

test("trialState: past_due is a paying customer (not-applicable), not soft-locked", async () => {
  const pastDue = await trialingMerchant({ plan: "growth", subscriptionStatus: "past_due" });
  assert.equal(trialState(pastDue, NOW).phase, "not-applicable");
  assert.equal(isSoftLocked(pastDue, NOW), false, "a failed payment retry must not lock a customer out");
});

// ── trial: phases ────────────────────────────────────────────────────────────────

test("trialState: phase follows the derived clock", async () => {
  assert.equal((trialState(await trialingMerchant({ createdAt: daysAgo(3) }), NOW)).phase, "active");
  assert.equal((trialState(await trialingMerchant({ createdAt: daysAgo(TRIAL_DAYS - 1) }), NOW)).phase, "ending-soon");
  assert.equal((trialState(await trialingMerchant({ createdAt: daysAgo(TRIAL_DAYS + 6) }), NOW)).phase, "expired");
});

test("trialState: daysLeft counts down and floors at 0; expired merchants soft-lock", async () => {
  assert.equal(trialState(await trialingMerchant({ createdAt: daysAgo(3) }), NOW).daysLeft, 11);
  assert.equal(trialState(await trialingMerchant({ createdAt: daysAgo(TRIAL_DAYS + 20) }), NOW).daysLeft, 0);
  assert.equal(isSoftLocked(await trialingMerchant({ createdAt: daysAgo(TRIAL_DAYS + 1) }), NOW), true);
});

// ── trial: reminder scheduling (idempotent) ─────────────────────────────────────

test("trialState: the most-urgent unsent reminder is what's due, and sent ones never repeat", async () => {
  // 9 days left → before the midpoint threshold, nothing due yet.
  assert.equal(trialState(await trialingMerchant({ createdAt: daysAgo(5) }), NOW).dueReminder, null);
  // 6 days left, nothing sent → midpoint.
  assert.equal(trialState(await trialingMerchant({ createdAt: daysAgo(8) }), NOW).dueReminder, "midpoint");
  // 1 day left, midpoint already sent → ending (more urgent, unsent).
  assert.equal(
    trialState(await trialingMerchant({ createdAt: daysAgo(13), trialRemindersSent: ["welcome", "midpoint"] }), NOW).dueReminder,
    "ending",
  );
  // expired, nothing sent → ended.
  assert.equal(trialState(await trialingMerchant({ createdAt: daysAgo(TRIAL_DAYS + 3) }), NOW).dueReminder, "ended");
  // expired, everything sent → nothing due (no double-send).
  assert.equal(
    trialState(
      await trialingMerchant({ createdAt: daysAgo(TRIAL_DAYS + 3), trialRemindersSent: ["welcome", "midpoint", "ending", "ended"] }),
      NOW,
    ).dueReminder,
    null,
  );
});
