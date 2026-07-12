import assert from "node:assert/strict";
import { test } from "node:test";
import {
  computeCohortForecast,
  forecastWindowFor,
  DEFAULT_ENTER_DAY,
  DEFAULT_EXIT_DAY,
  FORECAST_BAND_PCT,
} from "@/lib/forecast";
import type { Order } from "@/lib/types";

/**
 * now is fixed so every crossing decision is deterministic. Orders are built with
 * a `fulfillmentStart` chosen so `fulfillmentStart + enterDay` lands on a known side
 * of the horizon — fulfillmentStart is the wait clock (the same basis as the
 * canonical daysInWait / stage derivation), so the forecast's "day N" matches the
 * product's day N.
 *
 * The window under test is now the MERCHANT'S OWN. `W` is a 60–120 day window, so
 * these read like the old day-60 tests — but the window is an INPUT, and the p10
 * test below proves it actually moves.
 */
const NOW = new Date("2026-07-04T00:00:00.000Z");
const DAY_MS = 86_400_000;

/** a 60–120 day fulfillment window — enter day 60, exit day 120. */
const W = { min: 60, max: 120 };

/** an ISO string `daysAgo` days before NOW (the wait started in the past). */
const waitStartedDaysAgo = (daysAgo: number) =>
  new Date(NOW.getTime() - daysAgo * DAY_MS).toISOString();

function order(over: Partial<Order>): Order {
  const fulfillmentStart = over.fulfillmentStart ?? waitStartedDaysAgo(56);
  return {
    id: "ord_x",
    merchantId: "mch_t",
    customerId: "cus_t",
    group: "ks-backer",
    orderValueCents: 10000,
    // createdAt sits a day before the wait clock; the forecast anchors on
    // fulfillmentStart, so tests drive that.
    createdAt: new Date(new Date(fulfillmentStart).getTime() - DAY_MS).toISOString(),
    fulfillmentStart,
    fulfillmentEnd: waitStartedDaysAgo(-30),
    productionStage: "production",
    region: "US",
    statusToken: "tok",
    preorderEtaSource: "manual",
    ...over,
  };
}

// ── the window is the merchant's, not ours ──────────────────────────────────

test("the window comes from the merchant's own fulfillment window", () => {
  assert.deepEqual(forecastWindowFor({ min: 90, max: 240 }), {
    enterDay: 90,
    exitDay: 240,
    source: "merchant-window",
  });
});

test("a merchant with no usable window falls back to the default, and SAYS it is the default", () => {
  for (const bad of [null, undefined, { min: 0, max: 0 }, { min: 120, max: 60 }]) {
    const w = forecastWindowFor(bad);
    assert.equal(w.enterDay, DEFAULT_ENTER_DAY);
    assert.equal(w.exitDay, DEFAULT_EXIT_DAY);
    assert.equal(w.source, "default", "a borrowed constant must never pass as the merchant's own");
  }
});

test("THE p10 CASE: a 120–240 day merchant forecasts a real cohort, and overdue orders are COUNTED", () => {
  // Under the old hardcoded 60–89 window every one of these backers was already past
  // day 89, so the panel reported an empty cohort to the merchant with the biggest
  // WISMO problem in the set. Against his OWN window, the wave is real.
  const window = { min: 120, max: 240 };
  const entering = order({ id: "ord_soon", fulfillmentStart: waitStartedDaysAgo(117) });
  const inside = order({ id: "ord_inside", fulfillmentStart: waitStartedDaysAgo(177) });
  const past = order({ id: "ord_past", fulfillmentStart: waitStartedDaysAgo(300) });

  const f = computeCohortForecast([entering, inside, past], 150, window, NOW, 7);
  assert.equal(f.windowEnterDay, 120);
  assert.equal(f.windowExitDay, 240);
  assert.equal(f.windowSource, "merchant-window");
  assert.equal(f.enteringWindow, 1, "the order crossing day 120 inside the horizon is the wave");
  assert.deepEqual(f.cohortOrderIds, ["ord_soon"]);
  assert.equal(f.inWindowNow, 1, "the 177-day backer is already inside the window");
  // The point: an overdue backer is COUNTED and surfaced, never silently dropped.
  assert.equal(f.overdueOrders, 1);
});

// ── crossings (same shape as before, with the window as an input) ────────────

test("an order crossing the enter-day inside the horizon counts", () => {
  const f = computeCohortForecast(
    [order({ id: "ord_a", fulfillmentStart: waitStartedDaysAgo(57) })],
    150,
    W,
    NOW,
    7,
  );
  assert.equal(f.enteringWindow, 1);
  assert.deepEqual(f.cohortOrderIds, ["ord_a"]);
});

test("an order already past the exit day is overdue, not entering", () => {
  const f = computeCohortForecast(
    [order({ id: "ord_old", fulfillmentStart: waitStartedDaysAgo(200) })],
    150,
    W,
    NOW,
    7,
  );
  assert.equal(f.enteringWindow, 0);
  assert.equal(f.overdueOrders, 1);
  assert.deepEqual(f.cohortOrderIds, []);
});

test("an order still far from the enter day does not count", () => {
  const f = computeCohortForecast(
    [order({ id: "ord_young", fulfillmentStart: waitStartedDaysAgo(10) })],
    150,
    W,
    NOW,
    7,
  );
  assert.equal(f.enteringWindow, 0);
});

test("an order that crossed the enter day in the recent past is INSIDE the window, not entering", () => {
  const f = computeCohortForecast(
    [order({ id: "ord_in", fulfillmentStart: waitStartedDaysAgo(65) })],
    150,
    W,
    NOW,
    7,
  );
  assert.equal(f.enteringWindow, 0);
  assert.equal(f.inWindowNow, 1);
});

// ── sizing ──────────────────────────────────────────────────────────────────

test("expected = cohort × rate, rendered as a band that brackets the point", () => {
  const orders = [56, 57, 58, 59].map((d, i) =>
    order({ id: `ord_${i}`, fulfillmentStart: waitStartedDaysAgo(d) }),
  );
  const f = computeCohortForecast(orders, 150, W, NOW, 7);
  assert.equal(f.enteringWindow, 4);
  assert.equal(f.ratePerOrder, 1.5);
  assert.equal(f.calibrated, true);
  assert.equal(f.uncalibratedReason, null);
  assert.equal(f.expectedMid, 6); // 4 × 1.5
  assert.equal(f.expectedLow, Math.floor(6 * (1 - FORECAST_BAND_PCT))); // floor(4.5) = 4
  assert.equal(f.expectedHigh, Math.ceil(6 * (1 + FORECAST_BAND_PCT))); // ceil(7.5) = 8
  assert.ok(f.expectedLow! <= f.expectedMid! && f.expectedMid! <= f.expectedHigh!);
});

test("null baseline → UNCALIBRATED: no sized figure, but the cohort count is still a fact", () => {
  const orders = [56, 58].map((d, i) =>
    order({ id: `ord_${i}`, fulfillmentStart: waitStartedDaysAgo(d) }),
  );
  const f = computeCohortForecast(orders, null, W, NOW, 7);
  assert.equal(f.enteringWindow, 2);
  assert.equal(f.calibrated, false);
  assert.ok(f.uncalibratedReason, "an uncalibrated forecast must say WHY it is uncalibrated");
  assert.equal(f.baselineWismoPer100, null);
  assert.equal(f.ratePerOrder, null);
  assert.equal(f.expectedMid, null);
  assert.equal(f.expectedLow, null);
  assert.equal(f.expectedHigh, null);
});

test("zero baseline is treated as uncalibrated (no invented rate)", () => {
  const f = computeCohortForecast(
    [order({ id: "ord_a", fulfillmentStart: waitStartedDaysAgo(57) })],
    0,
    W,
    NOW,
    7,
  );
  assert.equal(f.enteringWindow, 1);
  assert.equal(f.calibrated, false);
  assert.equal(f.expectedMid, null);
});

test("empty order list → zeros", () => {
  const f = computeCohortForecast([], 150, W, NOW, 7);
  assert.equal(f.enteringWindow, 0);
  assert.deepEqual(f.cohortOrderIds, []);
  assert.equal(f.overdueOrders, 0);
  assert.equal(f.expectedMid, 0);
});

test("a wider horizon catches a later-crossing order the 7-day window misses", () => {
  const o = order({ id: "ord_later", fulfillmentStart: waitStartedDaysAgo(45) });
  assert.equal(computeCohortForecast([o], 150, W, NOW, 7).enteringWindow, 0);
  assert.equal(computeCohortForecast([o], 150, W, NOW, 20).enteringWindow, 1);
});
