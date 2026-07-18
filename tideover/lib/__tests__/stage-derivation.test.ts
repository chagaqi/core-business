import assert from "node:assert/strict";
import { test } from "node:test";
import { computeTimeline, resolveStageFromBands, stageBlurb } from "@/lib/time";
import { stageCeilDayFor } from "@/lib/engines/refund-risk";
import { withLiveStageFor } from "@/lib/repositories/live-stage";
import { measureCohort, isBaselineMeasured } from "@/lib/baseline";
import { normalizeRegion } from "@/lib/csv";
import { recommendGift, deepWaitDaysFor, DEEP_WAIT_DAYS } from "@/lib/engines/gift";
import type { Gift, Merchant, Order, ProductionStatusEntry, StageDef } from "@/lib/types";

const DAY = 86_400_000;

/** The bands a merchant actually writes down: contiguous, INCLUSIVE, human. */
const BANDS: StageDef[] = [
  { key: "sourcing", label: "Sourcing", dayBand: { from: 0, to: 20 }, blurb: "paper is being sourced" },
  { key: "tooling", label: "Tooling", dayBand: { from: 21, to: 62 }, blurb: "the plates are being cut" },
  { key: "production", label: "Press", dayBand: { from: 63, to: 95 }, blurb: "your book is on the press" },
  { key: "dispatch", label: "Dispatch", dayBand: { from: 96, to: 120 }, blurb: "your book is out of the warehouse" },
];

const merchantOf = (over: Partial<Merchant> = {}): Merchant =>
  ({
    id: "mch_t",
    name: "Foldwork Press",
    slug: "foldwork",
    isDemo: false,
    inboxToken: "tok",
    brand: { voice: "", tone: [], banned: [], signoff: "— Nia", logoText: "F", colors: { primary: "#000", bg: "#fff", ink: "#111" } },
    helpdesk: "email",
    preorderApp: "",
    fulfillmentWindowDays: { min: 90, max: 120 },
    stages: BANDS,
    playbook: {
      "day-7": { base: "b", byStage: {} },
      "day-30": { base: "b", byStage: {} },
      "day-60": { base: "b", byStage: {} },
      "day-89": { base: "b", byStage: {} },
    },
    ltvTiers: { standard: 0, high: 50000, vip: 200000 },
    giftCatalogIds: [],
    slaWindows: { amStart: "9:00", pmStart: "15:00", tz: "ET" },
    baseline: { capturedOn: "2026-01-01T00:00:00.000Z", medianFrtSec: 0, wismoPer100Orders: 0, ticketsPerWeek: 0, repeatWismoPct: 0 },
    createdAt: "2026-01-01T00:00:00.000Z",
    ...over,
  }) as Merchant;

const orderWaiting = (days: number, now: Date, over: Partial<Order> = {}): Order =>
  ({
    id: "ord_t",
    merchantId: "mch_t",
    customerId: "cus_t",
    group: "ks-backer",
    orderValueCents: 3800,
    createdAt: new Date(now.getTime() - days * DAY).toISOString(),
    fulfillmentStart: new Date(now.getTime() - days * DAY).toISOString(),
    fulfillmentEnd: new Date(now.getTime() + (120 - days) * DAY).toISOString(),
    productionStage: "sourcing",
    region: "US",
    statusToken: "t",
    preorderEtaSource: "manual",
    ...over,
  }) as Order;

// ─── the band math ──────────────────────────────────────────────────────────

test("bands are INCLUSIVE — the boundary day no longer falls through to stage one", () => {
  // p01 authored 0-20 and 21-62. The old half-open read matched d >= from && d < to,
  // so day 20 matched NO band, fell through, and returned stages[0]. 28 of her 420
  // backers — waiting 52 to 82 days — were told the paper for their book was still
  // being sourced. Every one of these is a boundary.
  assert.equal(resolveStageFromBands(BANDS, 0), "sourcing");
  assert.equal(resolveStageFromBands(BANDS, 20), "sourcing", "the CLOSING day of a band belongs to that band");
  assert.equal(resolveStageFromBands(BANDS, 21), "tooling", "the OPENING day of the next band");
  assert.equal(resolveStageFromBands(BANDS, 62), "tooling");
  assert.equal(resolveStageFromBands(BANDS, 63), "production");
  assert.equal(resolveStageFromBands(BANDS, 95), "production");
  assert.equal(resolveStageFromBands(BANDS, 96), "dispatch");
  assert.equal(resolveStageFromBands(BANDS, 120), "dispatch");

  // Not one wait between 0 and the last ceiling resolves to a stage the merchant's
  // own plan does not put it in.
  for (let d = 0; d <= 120; d++) {
    const key = resolveStageFromBands(BANDS, d);
    const band = BANDS.find((s) => s.key === key)!;
    assert.ok(d >= band.dayBand.from && d <= band.dayBand.to, `day ${d} resolved to ${key}, whose band is ${band.dayBand.from}-${band.dayBand.to}`);
  }
});

test("PAST EVERY BAND IS 'OVERRUN' — never a clamp to dispatch", () => {
  // The overrun clamp took the band with the highest ceiling, which is always the
  // last stage, which is always some flavour of "it shipped". Our ICP is merchants
  // who blew their window, so the MODAL customer is past the last band — and
  // ~4,758 of p10's 9,000 backers were told their CNC machine was "out of your
  // regional warehouse" when not one unit had been built.
  assert.equal(resolveStageFromBands(BANDS, 121), "overrun");
  assert.equal(resolveStageFromBands(BANDS, 186), "overrun");
  assert.equal(resolveStageFromBands(BANDS, 900), "overrun");
  for (const d of [121, 150, 186, 240, 400]) {
    assert.notEqual(resolveStageFromBands(BANDS, d), "dispatch", `day ${d} must never be told it dispatched`);
  }
  // Negative / zero-band edge cases never crash and never claim.
  assert.equal(resolveStageFromBands(BANDS, -5), "sourcing");
  assert.equal(resolveStageFromBands([], 40), "overrun");
});

test("an overrun order claims NOTHING: no stage blurb, no 'done' ticks, and it reads overdue", () => {
  const now = new Date("2026-06-01T00:00:00.000Z");
  const merchant = merchantOf();
  const order = orderWaiting(186, now, { productionStage: "overrun" });
  const t = computeTimeline(order, merchant, now);

  assert.equal(t.productionStage, "overrun");
  assert.equal(t.overdue, true, "past the plan entirely is overdue by definition");
  assert.ok(!/ships in/i.test(t.confidenceBand), "no computed ship band off a plan that has run out");

  // THE STATUS-PAGE LIE: marking every stage done through Dispatch is a written
  // statement that an unbuilt order has shipped. Every stage is "unknown" instead.
  assert.ok(t.stages.every((s) => s.state === "unknown"), "no stage is marked done or active");
  assert.equal(t.stages.filter((s) => s.state === "done").length, 0);

  // And the blurb the reply merges is an admission, not a fabricated fact. The old
  // fallback was the literal string "in production".
  const blurb = stageBlurb(merchant, "overrun");
  assert.ok(!/warehouse|dispatch|shipped|in production/i.test(blurb), `overrun blurb must claim nothing: ${blurb}`);
  assert.match(blurb, /can't confirm|won't claim/i);
});

test("the merchant's current status becomes the blurb — their words outrank a band they typed months ago", () => {
  const merchant = merchantOf({
    productionStatus: {
      stageKey: "tooling",
      headline: "we re-cut the joint-housing mould; that is the stage that moved",
      confidenceBand: { minWeeks: 5, maxWeeks: 8 },
      updatedAt: "2026-06-01T00:00:00.000Z",
      updatedBy: "sam",
    },
  });
  assert.equal(stageBlurb(merchant, "tooling"), "we re-cut the joint-housing mould; that is the stage that moved");
  // A stage the status does NOT speak for still uses the merchant's authored blurb.
  assert.equal(stageBlurb(merchant, "production"), "your book is on the press");
});

test("stageCeilDayFor measures overrun from the LAST band, not from day zero", () => {
  assert.equal(stageCeilDayFor(BANDS, "tooling"), 62, "authored stages are unchanged");
  assert.equal(stageCeilDayFor(BANDS, "dispatch"), 120);
  // A 0 anchor would pin stage pressure at its maximum the instant an order crossed
  // the last band — flattening the exact population Tideover exists for.
  assert.equal(stageCeilDayFor(BANDS, "overrun"), 120);
  assert.equal(stageCeilDayFor([], "overrun"), 0);
});

// ─── the read seam ──────────────────────────────────────────────────────────

test("the read seam resolves the LIVE stage and strips nothing from the stored snapshot", () => {
  const now = new Date("2026-06-01T00:00:00.000Z");
  const merchant = merchantOf();
  // The stored snapshot says "sourcing" — it was stamped the day the CSV landed.
  const stored = orderWaiting(70, now, { productionStage: "sourcing" });

  const live = withLiveStageFor(stored, merchant, [], now);
  assert.equal(live.productionStage, "production", "70 days in is the press, not sourcing");
  assert.equal(live.stageSource, "band");
  assert.equal(stored.productionStage, "sourcing", "the stored order object is never mutated");

  // A status that scopes to the order outranks the band.
  const status: ProductionStatusEntry = {
    id: "pst_1",
    merchantId: "mch_t",
    stageKey: "tooling",
    headline: "the plates cracked; we are re-cutting",
    confidenceBand: { minWeeks: 4, maxWeeks: 7 },
    updatedAt: "2026-05-30T00:00:00.000Z",
    updatedBy: "nia",
    source: "manual",
  };
  const withStatus = withLiveStageFor(stored, merchant, [status], now);
  assert.equal(withStatus.productionStage, "tooling");
  assert.equal(withStatus.stageSource, "status-board");

  // A status scoped to a cohort this order is NOT in never reaches it.
  const euOnly: ProductionStatusEntry = { ...status, id: "pst_2", scope: { region: "EU" } };
  assert.equal(withLiveStageFor(stored, merchant, [euOnly], now).productionStage, "production");
});

// ─── the day-0 baseline ─────────────────────────────────────────────────────

test("measureCohort counts the merchant's real starting state — nothing reported, nothing projected", () => {
  const now = new Date("2026-06-01T00:00:00.000Z");
  const orders = [
    orderWaiting(10, now, { id: "a", orderValueCents: 3800 }),
    orderWaiting(70, now, { id: "b", orderValueCents: 3800 }),
    // Past its own fulfillmentEnd: overdue at capture.
    { ...orderWaiting(200, now, { id: "c", orderValueCents: 97400 }), fulfillmentEnd: new Date(now.getTime() - 80 * DAY).toISOString() },
  ] as Order[];

  const cohort = measureCohort(orders, now);
  assert.equal(cohort.orders, 3);
  assert.equal(cohort.ordersOverdue, 1, "measured against the merchant's OWN window");
  assert.equal(cohort.ordersInWait, 2);
  assert.equal(cohort.medianWaitDays, 70);
  assert.equal(cohort.maxWaitDays, 200);
  assert.equal(cohort.grossCents, 3800 + 3800 + 97400);
  assert.equal(cohort.measuredAt, now.toISOString());
  assert.deepEqual(measureCohort([], now).orders, 0);
});

test("a zero baseline is NOT a measurement — the four reported numbers stay 'not captured' until the merchant gives them", () => {
  const zero = { capturedOn: "2026-01-01T00:00:00.000Z", medianFrtSec: 0, wismoPer100Orders: 0, ticketsPerWeek: 0, repeatWismoPct: 0 };
  assert.equal(isBaselineMeasured(zero), false, "an all-zero baseline is the unset sentinel, never '0s first response'");
  assert.equal(isBaselineMeasured({ ...zero, ticketsPerWeek: 40 }), true);
});

// ─── region ─────────────────────────────────────────────────────────────────

test("region comes from the file's own country column — and is NEVER rounded to US", () => {
  // p04: 48% of her file is EU, one container rolled at origin, and the one thing
  // she needed was an EU-only statement. region was hardcoded "US" at import even
  // though the export carried the country.
  assert.equal(normalizeRegion("Germany"), "EU");
  assert.equal(normalizeRegion("DE"), "EU");
  assert.equal(normalizeRegion("netherlands"), "EU");
  assert.equal(normalizeRegion("Norway"), "EU", "EEA clears customs with the EU container");
  assert.equal(normalizeRegion("United States"), "US");
  assert.equal(normalizeRegion("GB"), "GB", "the UK ships separately from the EU");
  assert.equal(normalizeRegion("Canada"), "CA");
  assert.equal(normalizeRegion("Japan"), "JP");
  // An unrecognized country is the merchant's own data, kept verbatim — not guessed.
  assert.equal(normalizeRegion("Kosovo"), "KOSOVO");
  // A missing column is a missing FACT. The importer records "unknown".
  assert.equal(normalizeRegion(""), undefined);
  assert.equal(normalizeRegion(undefined), undefined);
});

// ─── gifts that work for a $38 backer ───────────────────────────────────────

const FREE_BASE: Gift = {
  id: "gft_free",
  merchantId: "mch_t",
  name: "Digital art book (PDF)",
  kind: "digital-perk",
  tier: "base",
  costCents: 0,
  perceivedValueCents: 2500,
  eligibility: { minLtvCents: 0, minWaitDays: 0, minRiskScore: 0 },
};
const PAID_FULL: Gift = { ...FREE_BASE, id: "gft_full", name: "$25 credit", kind: "next-order-credit", tier: "full", costCents: 2500, perceivedValueCents: 2500, eligibility: { minLtvCents: 0, minWaitDays: 0, minRiskScore: 75 } };

test("a $38 backer on a calm, standard-band ticket still gets a real gift — the ladder is not gated on what they are worth", () => {
  // The median Kickstarter pledge is $38 and the old high-value tier sat at $500,
  // so on a single-pledge campaign the gate could NEVER fire. p01's entire file is
  // single $38 pledges; p08's 210 backers produced ONE risk band across 14 tickets.
  const calm = recommendGift({ riskScore: 20, escalated: false, catalog: [FREE_BASE, PAID_FULL], daysInWait: 92 });
  assert.ok(calm.gift, "a long wait alone warrants a gesture");
  assert.equal(calm.gift?.id, "gft_free", "and the gesture available to a standard-band customer is the FREE one");
  assert.equal(calm.gift?.costCents, 0, "it costs the merchant nothing, so they can make it 210 times");

  // Nothing in the decision looked at order value or LTV.
  const rich = recommendGift({ riskScore: 20, escalated: false, catalog: [FREE_BASE, PAID_FULL], daysInWait: 92 });
  assert.equal(rich.gift?.id, calm.gift?.id);

  // A catalog with NO free base gift cannot reach this customer at all — which is
  // exactly why onboarding guarantees one (lib/onboarding.ts ensureBaseLadder).
  const noBase = recommendGift({ riskScore: 20, escalated: false, catalog: [PAID_FULL], daysInWait: 92 });
  assert.equal(noBase.gift, null);
});

test("the deep-wait warrant can be made relative to the merchant's own window", () => {
  // A fixed 45 days was set against a 60-day window; this ICP runs 60-240. On a
  // 200-day campaign, "45 days in" is a customer who is exactly where they were
  // told they would be — the gate is permanently open, and a gate that is always
  // open is not a gate.
  assert.equal(deepWaitDaysFor(60), DEEP_WAIT_DAYS, "never trigger-happier than the floor");
  assert.equal(deepWaitDaysFor(240), 160);

  const catalog = [FREE_BASE];
  const calm = { riskScore: 20, escalated: false, catalog };
  // Default (no deepWaitDays passed): the existing constant, byte-stable.
  assert.ok(recommendGift({ ...calm, daysInWait: 50 }).gift, "45-day default still fires at 50");
  // Relative to a 240-day window, a 50-day wait is not yet a warrant.
  assert.equal(recommendGift({ ...calm, daysInWait: 50, deepWaitDays: deepWaitDaysFor(240) }).gift, null);
  assert.ok(recommendGift({ ...calm, daysInWait: 170, deepWaitDays: deepWaitDaysFor(240) }).gift);
});
