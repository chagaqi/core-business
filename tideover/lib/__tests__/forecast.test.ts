import assert from "node:assert/strict";
import { test } from "node:test";
import { computeCohortForecast, FORECAST_BAND_PCT } from "@/lib/forecast";
import type { Order } from "@/lib/types";

/**
 * now is fixed so every crossing decision is deterministic. Orders are built with
 * a `fulfillmentStart` chosen so `fulfillmentStart + 60d` lands on a known side of
 * the horizon — fulfillmentStart is the wait clock (the same basis as the
 * canonical daysInWait / dayStageFor), so the forecast's "day 60" matches the
 * product's day 60.
 */
const NOW = new Date("2026-07-04T00:00:00.000Z");
const DAY_MS = 86_400_000;

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

test("an order crossing day-60 inside the horizon counts", () => {
  // wait started 57 days ago → crosses day 60 in 3 days, inside the 7-day horizon.
  const f = computeCohortForecast([order({ id: "ord_a", fulfillmentStart: waitStartedDaysAgo(57) })], 150, NOW, 7);
  assert.equal(f.enteringWindow, 1);
  assert.deepEqual(f.cohortOrderIds, ["ord_a"]);
});

test("an order already past day 89 does not count", () => {
  // wait started 100 days ago → crossed day 60 forty days ago, past day 89 too.
  const f = computeCohortForecast([order({ id: "ord_old", fulfillmentStart: waitStartedDaysAgo(100) })], 150, NOW, 7);
  assert.equal(f.enteringWindow, 0);
  assert.deepEqual(f.cohortOrderIds, []);
});

test("an order still far from day 60 does not count", () => {
  // wait started 10 days ago → crosses day 60 in 50 days, well beyond the horizon.
  const f = computeCohortForecast([order({ id: "ord_young", fulfillmentStart: waitStartedDaysAgo(10) })], 150, NOW, 7);
  assert.equal(f.enteringWindow, 0);
});

test("an order that crossed day 60 in the recent past (before now) does not count", () => {
  // wait started 65 days ago → crossed day 60 five days ago; not entering during [now, now+7).
  const f = computeCohortForecast([order({ id: "ord_in", fulfillmentStart: waitStartedDaysAgo(65) })], 150, NOW, 7);
  assert.equal(f.enteringWindow, 0);
});

test("expected = cohort × rate, rendered as a band that brackets the point", () => {
  // 4 orders all crossing day 60 within the horizon; baseline 150/100 = 1.5.
  const orders = [56, 57, 58, 59].map((d, i) => order({ id: `ord_${i}`, fulfillmentStart: waitStartedDaysAgo(d) }));
  const f = computeCohortForecast(orders, 150, NOW, 7);
  assert.equal(f.enteringWindow, 4);
  assert.equal(f.ratePerOrder, 1.5);
  assert.equal(f.expectedMid, 6); // 4 × 1.5
  assert.equal(f.expectedLow, Math.floor(6 * (1 - FORECAST_BAND_PCT))); // floor(4.5) = 4
  assert.equal(f.expectedHigh, Math.ceil(6 * (1 + FORECAST_BAND_PCT))); // ceil(7.5) = 8
  assert.ok(f.expectedLow! <= f.expectedMid! && f.expectedMid! <= f.expectedHigh!);
});

test("null baseline → expected is null but the cohort count is still shown", () => {
  const orders = [56, 58].map((d, i) => order({ id: `ord_${i}`, fulfillmentStart: waitStartedDaysAgo(d) }));
  const f = computeCohortForecast(orders, null, NOW, 7);
  assert.equal(f.enteringWindow, 2);
  assert.equal(f.baselineWismoPer100, null);
  assert.equal(f.ratePerOrder, null);
  assert.equal(f.expectedMid, null);
  assert.equal(f.expectedLow, null);
  assert.equal(f.expectedHigh, null);
});

test("zero baseline is treated as uncalibrated (no invented rate)", () => {
  const f = computeCohortForecast([order({ id: "ord_a", fulfillmentStart: waitStartedDaysAgo(57) })], 0, NOW, 7);
  assert.equal(f.enteringWindow, 1);
  assert.equal(f.expectedMid, null);
  assert.equal(f.expectedLow, null);
  assert.equal(f.expectedHigh, null);
});

test("empty order list → zeros", () => {
  const f = computeCohortForecast([], 150, NOW, 7);
  assert.equal(f.enteringWindow, 0);
  assert.deepEqual(f.cohortOrderIds, []);
  assert.equal(f.expectedMid, 0);
  assert.equal(f.expectedLow, 0);
  assert.equal(f.expectedHigh, 0);
});

test("a wider horizon catches a later-crossing order the 7-day window misses", () => {
  // wait started 45 days ago → crosses day 60 in 15 days: outside a 7-day horizon,
  // inside a 20-day one. Confirms the horizon bound is real, not hardcoded.
  const o = order({ id: "ord_later", fulfillmentStart: waitStartedDaysAgo(45) });
  assert.equal(computeCohortForecast([o], 150, NOW, 7).enteringWindow, 0);
  assert.equal(computeCohortForecast([o], 150, NOW, 20).enteringWindow, 1);
});
