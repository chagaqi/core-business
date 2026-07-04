import assert from "node:assert/strict";
import { test } from "node:test";
import { computeDisputeExposure } from "@/lib/dispute-exposure";
import type { Order } from "@/lib/types";

/**
 * now is fixed so every window decision is deterministic. Bands are chosen so the
 * ~15-day issuer wait and the ~120-day 13.1 close land on known sides of `now`.
 */
const NOW = new Date("2026-06-01T00:00:00.000Z");

/** disclosed 2026-04-01 with a "weeks 2–4" band → expected delivery 2026-04-29;
 *  window opens ~2026-05-14, closes ~2026-08-27 → NOW (2026-06-01) is inside. */
const IN_WINDOW: NonNullable<Order["disclosedEta"]> = {
  value: "weeks 2–4",
  source: "campaign-page",
  disclosedAt: "2026-04-01T00:00:00.000Z",
};

function order(over: Partial<Order>): Order {
  return {
    id: "ord_x",
    merchantId: "mch_t",
    customerId: "cus_t",
    group: "ks-backer",
    orderValueCents: 10000,
    createdAt: "2026-03-31T00:00:00.000Z",
    fulfillmentStart: "2026-04-01T00:00:00.000Z",
    fulfillmentEnd: "2026-07-01T00:00:00.000Z",
    productionStage: "production",
    region: "US",
    statusToken: "tok",
    preorderEtaSource: "manual",
    ...over,
  };
}

test("an order currently inside the dispute window is counted", () => {
  const e = computeDisputeExposure(
    [order({ group: "ks-backer", orderValueCents: 10000, disclosedEta: IN_WINDOW })],
    NOW,
  );
  assert.equal(e.orderCount, 1);
  assert.equal(e.totalCents, 10000);
  assert.equal(e.kickstarterCents, 10000);
  assert.equal(e.shopifyCents, 0);
  assert.equal(e.unknownCount, 0);
});

test("an order before the issuer-wait (13.1 not yet filable) is not counted", () => {
  // disclosed 2026-05-20 → expected 2026-06-17 → opens ~2026-07-02, after NOW.
  const e = computeDisputeExposure(
    [
      order({
        disclosedEta: { value: "weeks 2–4", source: "checkout", disclosedAt: "2026-05-20T00:00:00.000Z" },
      }),
    ],
    NOW,
  );
  assert.equal(e.orderCount, 0);
  assert.equal(e.totalCents, 0);
  assert.equal(e.unknownCount, 0);
});

test("an order past the window close is not counted", () => {
  // disclosed & transacted 2025-01-01 → expected 2025-01-29, closes ~2025-05-29,
  // long before NOW (2026-06-01).
  const e = computeDisputeExposure(
    [
      order({
        createdAt: "2025-01-01T00:00:00.000Z",
        disclosedEta: { value: "weeks 2–4", source: "update", disclosedAt: "2025-01-01T00:00:00.000Z" },
      }),
    ],
    NOW,
  );
  assert.equal(e.orderCount, 0);
  assert.equal(e.totalCents, 0);
});

test("rail split: ks-backer → kickstarter; late-pledge / new-preorder → shopify", () => {
  const e = computeDisputeExposure(
    [
      order({ id: "ord_a", group: "ks-backer", orderValueCents: 10000, disclosedEta: IN_WINDOW }),
      order({ id: "ord_b", group: "late-pledge", orderValueCents: 20000, disclosedEta: IN_WINDOW }),
      order({ id: "ord_c", group: "new-preorder", orderValueCents: 5000, disclosedEta: IN_WINDOW }),
    ],
    NOW,
  );
  assert.equal(e.orderCount, 3);
  assert.equal(e.totalCents, 35000);
  assert.equal(e.kickstarterCents, 10000);
  assert.equal(e.kickstarterCount, 1);
  assert.equal(e.shopifyCents, 25000);
  assert.equal(e.shopifyCount, 2);
});

test("an order with no disclosed ETA is excluded from sums and counted as unknown", () => {
  const e = computeDisputeExposure(
    [
      order({ group: "ks-backer", orderValueCents: 9999, disclosedEta: undefined }),
      order({ group: "late-pledge", orderValueCents: 20000, disclosedEta: IN_WINDOW }),
    ],
    NOW,
  );
  assert.equal(e.unknownCount, 1);
  assert.equal(e.orderCount, 1);
  assert.equal(e.totalCents, 20000);
  assert.equal(e.shopifyCents, 20000);
  assert.equal(e.kickstarterCents, 0);
});

test("empty order list → all zeros", () => {
  const e = computeDisputeExposure([], NOW);
  assert.deepEqual(e, {
    totalCents: 0,
    kickstarterCents: 0,
    shopifyCents: 0,
    orderCount: 0,
    kickstarterCount: 0,
    shopifyCount: 0,
    unknownCount: 0,
  });
});
