import assert from "node:assert/strict";
import { test } from "node:test";
import { dayStageFor, draftReassurance } from "@/lib/engines/reassurance";
import { scoreRefundRisk, DEFAULT_PROFILE } from "@/lib/engines/refund-risk";
import { recommendGift } from "@/lib/engines/gift";
import { scoreSignal } from "@/lib/engines/social-signal";
import { containsHardDate } from "@/lib/proof";
import { formatBand } from "@/lib/time";
import type { Customer, Gift, Merchant, Order, SocialSignal } from "@/lib/types";

const STAGES = [
  { key: "sourcing" as const, label: "Sourcing", dayBand: { from: 0, to: 12 }, blurb: "sourcing" },
  { key: "production" as const, label: "Production", dayBand: { from: 32, to: 72 }, blurb: "on the line" },
  { key: "dispatch" as const, label: "Dispatch", dayBand: { from: 104, to: 118 }, blurb: "packing" },
];

const merchant: Merchant = {
  id: "mch_t",
  name: "Testco",
  slug: "testco",
  brand: { voice: "warm", tone: ["warm"], banned: ["unfortunately"], signoff: "— Testco", logoText: "Testco", colors: { primary: "#0E5366", bg: "#FBF8F2", ink: "#11252A" } },
  helpdesk: "mock",
  preorderApp: "PreProduct",
  fulfillmentWindowDays: { min: 90, max: 120 },
  stages: STAGES,
  playbook: {
    "day-7": { base: "Hey {first_name}, your {brand} order is {stage_blurb}, {eta_band}. {next_window}.", byStage: {} },
    "day-30": { base: "Hi {first_name}, {stage_blurb}, {eta_band}.", byStage: {} },
    "day-60": { base: "Fair to feel that {first_name}. {stage_blurb}, {eta_band}.", byStage: {} },
    "day-89": { base: "{first_name}, honest status: {stage_blurb}, {eta_band}.", byStage: {} },
  },
  ltvTiers: { standard: 0, high: 50000, vip: 200000 },
  giftCatalogIds: [],
  slaWindows: { amStart: "9:00", pmStart: "15:00", tz: "ET" },
  baseline: { capturedOn: "2026-05-01T00:00:00.000Z", medianFrtSec: 27000, wismoPer100Orders: 41, ticketsPerWeek: 38, repeatWismoPct: 62 },
  createdAt: "2026-05-01T00:00:00.000Z",
};

const NOW = new Date("2026-06-20T00:00:00.000Z");
function orderDaysAgo(start: number, total = 110, stage: Order["productionStage"] = "production"): Order {
  return {
    id: "ord_t",
    merchantId: "mch_t",
    customerId: "cus_t",
    group: "ks-backer",
    orderValueCents: 30000,
    createdAt: new Date(NOW.getTime() - (start + 1) * 86400000).toISOString(),
    fulfillmentStart: new Date(NOW.getTime() - start * 86400000).toISOString(),
    fulfillmentEnd: new Date(NOW.getTime() - (start - total) * 86400000).toISOString(),
    productionStage: stage,
    region: "US",
    statusToken: "x.y",
    preorderEtaSource: "manual",
  };
}
const customer: Customer = { id: "cus_t", merchantId: "mch_t", email: "a@b.com", firstName: "Dana", ltvCents: 60000, orderIds: ["ord_t"], ticketCount: 1, lastSentiment: "anxious" };

test("dayStageFor buckets correctly", () => {
  assert.equal(dayStageFor(5).key, "day-7");
  assert.equal(dayStageFor(20).key, "day-30");
  assert.equal(dayStageFor(50).key, "day-60");
  assert.equal(dayStageFor(80).key, "day-89");
  assert.equal(dayStageFor(130).overdue, true);
});

test("formatBand never emits a hard date and prefers weeks when large", () => {
  assert.match(formatBand(63, 70), /weeks/);
  assert.match(formatBand(3, 6), /days/);
  assert.equal(containsHardDate(formatBand(63, 70)), false);
});

test("reassurance draft merges fields, applies signoff, no hard date", () => {
  const r = draftReassurance({ order: orderDaysAgo(50), merchant, firstName: "Dana", sentiment: "anxious", now: NOW });
  assert.match(r.draftText, /Dana/);
  assert.match(r.draftText, /Testco/);
  assert.match(r.draftText, /— Testco$/);
  assert.equal(containsHardDate(r.draftText), false);
  assert.equal(r.stageKey, "day-60");
});

test("reassurance escalates hostile sentiment", () => {
  const r = draftReassurance({ order: orderDaysAgo(80), merchant, firstName: "Dana", sentiment: "chargeback-threat", now: NOW });
  assert.equal(r.priority, "escalated");
  assert.ok(r.managerNote);
});

test("refund-risk: chargeback threat scores higher than calm", () => {
  const base = { order: orderDaysAgo(50), customer, daysInWait: 50, fulfillmentWindowMaxDays: 120, stageCeilDay: 72, ticketsLast7d: 1 };
  const calm = scoreRefundRisk({ ...base, sentiment: "calm" }, DEFAULT_PROFILE);
  const cb = scoreRefundRisk({ ...base, sentiment: "chargeback-threat" }, DEFAULT_PROFILE);
  assert.ok(cb.riskScore > calm.riskScore);
  assert.ok(["watch", "at_risk"].includes(cb.band));
  assert.equal(calm.band, "standard");
  assert.ok(cb.priorityRank < calm.priorityRank);
});

test("gift gate: recommends for high-LTV deep-wait, declines for low-LTV", () => {
  const catalog: Gift[] = [
    { id: "gft_a", merchantId: "mch_t", name: "Priority dispatch", kind: "priority-dispatch", costCents: 1200, perceivedValueCents: 6000, eligibility: { minLtvCents: 50000, minWaitDays: 45, minRiskScore: 50 } },
    { id: "gft_b", merchantId: "mch_t", name: "Founder note", kind: "founder-note", costCents: 500, perceivedValueCents: 3000, eligibility: { minLtvCents: 0, minWaitDays: 45, minRiskScore: 50 } },
  ];
  const yes = recommendGift({ customer, order: orderDaysAgo(50), daysInWait: 50, riskScore: 70, highTierCents: 50000, catalog });
  assert.ok(yes.gift);
  assert.equal(yes.gift?.id, "gft_a");
  const lowLtv = { ...customer, ltvCents: 1000 };
  const no = recommendGift({ customer: lowLtv, order: orderDaysAgo(50), daysInWait: 50, riskScore: 70, highTierCents: 50000, catalog });
  assert.equal(no.gift, null);
});

test("social-signal flags negative brand mention, ignores noise", () => {
  const neg: SocialSignal = { id: "sig_a", merchantId: "mch_t", platform: "reddit", author: "u/x", text: "where is my Testco order, considering a refund, feels like a scam", postedAt: NOW.toISOString(), mentionsBrand: true, mentionsCampaign: true };
  const noise: SocialSignal = { id: "sig_b", merchantId: "mch_t", platform: "twitter", author: "@y", text: "great weather today", postedAt: NOW.toISOString(), mentionsBrand: false, mentionsCampaign: false };
  assert.equal(scoreSignal(neg, merchant).flagged, true);
  assert.equal(scoreSignal(noise, merchant).flagged, false);
});
