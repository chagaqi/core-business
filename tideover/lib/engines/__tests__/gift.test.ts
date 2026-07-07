import assert from "node:assert/strict";
import { test } from "node:test";
import { giftAvailability, ltvPriorityBoost, recommendGift, unlockedTiers } from "@/lib/engines/gift";
import type { Customer, CustomerGroup, Gift, GiftTier, Order } from "@/lib/types";

// ── fixtures ────────────────────────────────────────────────────────────────
function gift(id: string, tier: GiftTier, pv: number, cost = 0): Gift {
  const kind =
    tier === "base" ? "early-access" : tier === "mid" ? "priority-dispatch" : "next-order-credit";
  return {
    id,
    merchantId: "mch_t",
    name: id,
    kind,
    tier,
    costCents: cost,
    perceivedValueCents: pv,
    eligibility: { minLtvCents: 0, minWaitDays: 0, minRiskScore: 0 },
  };
}
const CATALOG: Gift[] = [gift("g_base", "base", 4000), gift("g_mid", "mid", 6000), gift("g_full", "full", 2500)];

function avail(riskScore: number, escalated: boolean, catalog = CATALOG) {
  const entries = giftAvailability({
    catalog,
    riskScore,
    escalated,
    ltvCents: 0,
    daysInWait: 0,
    orderValueCents: 0,
  });
  return new Set(entries.filter((e) => e.unlocked).map((e) => e.gift.tier));
}

// ── unlock matrix (band-only + escalation override) ─────────────────────────
test("giftAvailability: standard band unlocks base only", () => {
  assert.deepEqual([...avail(10, false)].sort(), ["base"]);
});

test("giftAvailability: watch band unlocks base + mid", () => {
  assert.deepEqual([...avail(60, false)].sort(), ["base", "mid"]);
});

test("giftAvailability: at_risk band unlocks base + mid + full", () => {
  assert.deepEqual([...avail(80, false)].sort(), ["base", "full", "mid"]);
});

test("giftAvailability: escalation forces full unlock even at standard score", () => {
  assert.deepEqual([...avail(5, true)].sort(), ["base", "full", "mid"]);
});

test("giftAvailability: empty catalog → []", () => {
  assert.deepEqual(giftAvailability({ catalog: [], riskScore: 90, escalated: true, ltvCents: 0, daysInWait: 0, orderValueCents: 0 }), []);
});

test("giftAvailability: locked entries carry the binding unlock reason", () => {
  const entries = giftAvailability({ catalog: CATALOG, riskScore: 10, escalated: false, ltvCents: 0, daysInWait: 0, orderValueCents: 0 });
  const mid = entries.find((e) => e.gift.tier === "mid")!;
  const full = entries.find((e) => e.gift.tier === "full")!;
  assert.equal(mid.unlocked, false);
  assert.match(mid.unlockReason, /watch risk/i);
  assert.equal(full.unlocked, false);
  assert.match(full.unlockReason, /high risk|escalation/i);
});

test("unlockedTiers matches the matrix at each boundary", () => {
  assert.deepEqual(unlockedTiers(49, false), ["base"]);
  assert.deepEqual(unlockedTiers(50, false), ["base", "mid"]);
  assert.deepEqual(unlockedTiers(74, false), ["base", "mid"]);
  assert.deepEqual(unlockedTiers(75, false), ["base", "mid", "full"]);
});

// ── recommendGift: best unlocked, but only when a gesture is WARRANTED ────────
// warrant = escalated OR band watch/at_risk (score ≥ 50) OR daysInWait ≥ 45.
test("recommendGift: calm + standard band + short wait → null (not warranted) even though base is available", () => {
  const rec = recommendGift({ riskScore: 10, escalated: false, catalog: CATALOG, daysInWait: 0 });
  assert.equal(rec.gift, null);
  assert.equal(rec.roi, null);
  // availability is unchanged: the base tier is still unlocked — a rep can still choose to send it.
  assert.equal(avail(10, false).has("base"), true);
});

test("recommendGift: deep wait (daysInWait ≥ 45) warrants a gift even at calm standard band → best base", () => {
  const rec = recommendGift({ riskScore: 10, escalated: false, catalog: CATALOG, daysInWait: 45 });
  assert.equal(rec.gift?.tier, "base");
  assert.equal(rec.gift?.id, "g_base");
});

test("recommendGift: warranted just under deep-wait boundary is still null", () => {
  assert.equal(recommendGift({ riskScore: 10, escalated: false, catalog: CATALOG, daysInWait: 44 }).gift, null);
});

test("recommendGift: watch/at_risk band warrants → highest perceived value among unlocked (mid)", () => {
  assert.equal(recommendGift({ riskScore: 60, escalated: false, catalog: CATALOG, daysInWait: 0 }).gift?.id, "g_mid");
  assert.equal(recommendGift({ riskScore: 90, escalated: false, catalog: CATALOG, daysInWait: 0 }).gift?.id, "g_mid");
});

test("recommendGift: escalation warrants (and unlocks) → best of full unlock (mid)", () => {
  assert.equal(recommendGift({ riskScore: 5, escalated: true, catalog: CATALOG, daysInWait: 0 }).gift?.id, "g_mid");
});

test("recommendGift: empty catalog → null", () => {
  const rec = recommendGift({ riskScore: 90, escalated: true, catalog: [], daysInWait: 60 });
  assert.equal(rec.gift, null);
  assert.equal(rec.roi, null);
});

test("recommendGift: no unlocked tier in catalog → null (even when warranted)", () => {
  const midOnly = [gift("g_mid", "mid", 6000)];
  assert.equal(recommendGift({ riskScore: 10, escalated: false, catalog: midOnly, daysInWait: 90 }).gift, null);
});

// ── ltvPriorityBoost ────────────────────────────────────────────────────────
function order(group: CustomerGroup, orderValueCents: number): Order {
  return {
    id: "ord_t",
    merchantId: "mch_t",
    customerId: "cus_t",
    group,
    orderValueCents,
    createdAt: "2026-01-01T00:00:00.000Z",
    fulfillmentStart: "2026-01-01T00:00:00.000Z",
    fulfillmentEnd: "2026-04-01T00:00:00.000Z",
    productionStage: "production",
    region: "US",
    statusToken: "x.y",
    preorderEtaSource: "manual",
  };
}
function customerWithLtv(ltvCents: number): Customer {
  return { id: "cus_t", merchantId: "mch_t", email: "a@b.com", firstName: "Dana", ltvCents, orderIds: ["ord_t"], ticketCount: 0, lastSentiment: "calm" };
}
// A future Shopify-sourced repeat order carries a non-crowdfunding group not yet
// in the CustomerGroup union — the only shape that earns an LTV boost. Cast to
// exercise the path the data-provenance audit reserves for real lifetime value.
const SHOPIFY_GROUP = "shopify" as unknown as CustomerGroup;

test("ltvPriorityBoost: crowdfunding pledges never earn a boost (all current data → 0)", () => {
  for (const g of ["ks-backer", "late-pledge", "new-preorder"] as CustomerGroup[]) {
    assert.equal(ltvPriorityBoost(order(g, 10000), customerWithLtv(1_000_000)), 0);
  }
});

test("ltvPriorityBoost: 2 points per whole LTV/order multiple (ratio ≥ 1)", () => {
  assert.equal(ltvPriorityBoost(order(SHOPIFY_GROUP, 10000), customerWithLtv(10000)), 2); // ratio 1 → 2
  assert.equal(ltvPriorityBoost(order(SHOPIFY_GROUP, 10000), customerWithLtv(35000)), 6); // ratio 3.5 → floor 3 → 6
});

test("ltvPriorityBoost: capped at 20", () => {
  assert.equal(ltvPriorityBoost(order(SHOPIFY_GROUP, 10000), customerWithLtv(500000)), 20); // ratio 50 → 100 → cap 20
});

test("ltvPriorityBoost: ratio < 1 or non-positive order value → 0", () => {
  assert.equal(ltvPriorityBoost(order(SHOPIFY_GROUP, 10000), customerWithLtv(5000)), 0); // ratio 0.5
  assert.equal(ltvPriorityBoost(order(SHOPIFY_GROUP, 0), customerWithLtv(5000)), 0); // no order value
});
