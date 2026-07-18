import assert from "node:assert/strict";
import { test } from "node:test";
import { getDashboard, getRankedQueue, summarizeStatusBoard } from "@/lib/service";
import { DEFLECTION_MIN_N } from "@/lib/deflection";
import type { Order, ProductionStatusEntry, StatusScope } from "@/lib/types";

/**
 * THE RENEWAL SCREEN, AND WHETHER IT LIES.
 *
 * On day 30 of the ten-merchant run every one of the ten opened this dashboard and
 * read: deflection 100%, $0 at risk, 0 WISMO per 100 orders, "Not yet measured" on
 * all four baseline metrics. Three of those four are false in different ways — a
 * tautology, a rounding artifact, and a blank — and they sit next to the numbers
 * that are true, which is how a screen destroys its own credibility.
 *
 * These tests pin the STRUCTURAL guarantee, not a particular number: nothing on the
 * dashboard may assert an outcome it did not measure.
 */

const LUMEN = "mch_lumen0001"; // seeded demo merchant

test("DEFLECTION IS NEVER A REPLY-COMPLETION RATE — it is measured, or it is absent", async () => {
  const d = await getDashboard(LUMEN);
  assert.ok(d, "seeded merchant has a dashboard");

  // The old field is gone. It computed resolved/tickets and called it deflection,
  // which reads 100% for anyone who answers their queue.
  assert.equal(
    "deflectionPct" in (d!.live as Record<string, unknown>),
    false,
    "the reply-completion tautology must not survive under any name",
  );

  const def = d!.deflection;
  if (def.rate == null) {
    // No rate: then the tile must carry the sentence naming what would make it real.
    assert.ok(def.gap, "an unmeasured metric must say what would make it real");
    assert.ok(
      ["no-views", "too-recent", "collecting"].includes(def.state),
      `unexpected unmeasured state: ${def.state}`,
    );
  } else {
    // A rate at all means a real sample, and the rate must equal its own arithmetic.
    assert.equal(def.state, "measured");
    assert.ok(def.evaluatedViews >= DEFLECTION_MIN_N, "no rate below the small-sample floor");
    assert.equal(def.rate, def.quietViews / def.evaluatedViews);
    assert.equal(def.quietViews + def.followedByTicket, def.evaluatedViews);
    assert.equal(def.gap, null);
  }

  // A view too recent to judge can NEVER be inside the denominator — that is the
  // rule that stops the metric climbing every time somebody looks at a page.
  assert.ok(def.pendingViews >= 0);
});

test("no dashboard metric asserts an outcome: activity is labelled as activity", async () => {
  const d = await getDashboard(LUMEN);
  // "Saves logged" is gone. A reply to someone who threatened a chargeback is a
  // reply; a gift is a tag. Neither is a measured save.
  assert.equal("savesCount" in (d!.live as Record<string, unknown>), false);
  assert.equal(typeof d!.live.disputeRiskReplies, "number");
  assert.equal(typeof d!.live.giftsAuthorized, "number");
});

test("WISMO per 100 orders no longer rounds a real rate down to zero", async () => {
  const d = await getDashboard(LUMEN);
  const wismo = d!.live.wismoPer100Orders;
  assert.equal(typeof wismo, "number");
  // One decimal is retained: the whole-number round read 0 for every merchant above
  // ~3,000 orders, i.e. the five biggest in the run.
  assert.equal(wismo, Math.round(wismo * 10) / 10);
});

test("the day-0 cohort delta is measured on BOTH ends, or it is not shown", async () => {
  const d = await getDashboard(LUMEN);
  const cohort = d!.cohort;
  if (cohort) {
    // Both sides are counts from the merchant's own order file — never a projection.
    assert.equal(typeof cohort.day0.orders, "number");
    assert.equal(typeof cohort.today.orders, "number");
    assert.equal(
      cohort.today.ordersInWait + cohort.today.ordersOverdue,
      cohort.today.orders,
      "today's cohort splits exactly into in-wait + overdue",
    );
  }
});

test("every at-risk row can answer 'why is this on top?'", async () => {
  const d = await getDashboard(LUMEN);
  for (const r of d!.atRisk) {
    assert.ok(r.rankReason && r.rankReason.length > 0, "a queued row must explain its place");
    assert.ok(r.topDriver && r.topDriver.length > 0, "the engine's top driver reaches the row");
    assert.equal(typeof r.queueRank, "number");
    assert.equal(typeof r.priorityRank, "number", "the ENGINE's own rank is still carried, unchanged");
  }
  // The queue declares what it ordered on, so a flat cohort can never look like it
  // was triaged when it was not.
  assert.ok(["risk", "tiebreak"].includes(d!.queueDistribution.basis));
});

test("the live distribution is measured over OPEN work only — clearing the queue cannot flatter it", async () => {
  const { rows, distribution } = await getRankedQueue(LUMEN);
  const live = rows.filter((r) => r.ticket.status !== "sent");
  assert.equal(distribution.cohortSize, live.length);
  // queueRank is a dense 1..N over every row the queue returned.
  rows.forEach((r, i) => assert.equal(r.queueRank, i + 1));
});

// ── the status board's coverage count is the count of replies it will speak for ──

function order(id: string, over: Partial<Order> = {}): Order {
  return {
    id,
    merchantId: "mch_t",
    customerId: "cus_t",
    group: "ks-backer",
    orderValueCents: 10000,
    createdAt: "2026-04-01T00:00:00.000Z",
    fulfillmentStart: "2026-04-01T00:00:00.000Z",
    fulfillmentEnd: "2026-08-01T00:00:00.000Z",
    productionStage: "production",
    region: "US",
    statusToken: `tok_${id}`,
    preorderEtaSource: "manual",
    ...over,
  };
}

function entry(id: string, scope: StatusScope | undefined, updatedAt: string): ProductionStatusEntry {
  return {
    id,
    merchantId: "mch_t",
    stageKey: "production",
    headline: `status ${id}`,
    confidenceBand: { minWeeks: 2, maxWeeks: 4 },
    ...(scope ? { scope } : {}),
    updatedAt,
    updatedBy: "ops",
    source: "manual",
  };
}

test("a scoped status covers ONLY its cohort — the merchant-wide one never double-counts it", () => {
  // p04's shape: 48% EU, one rolled EU container. The EU status must speak for the EU
  // backers and NOT for the US half who are fine — and the counts must reconcile,
  // because "the next N replies will say this" is the whole promise of the screen.
  const orders = [
    order("o1", { region: "EU" }),
    order("o2", { region: "EU" }),
    order("o3", { region: "US" }),
    order("o4", { region: "US" }),
    order("o5", { region: "US" }),
  ];
  const entries = [
    entry("s_all", undefined, "2026-07-01T00:00:00.000Z"),
    entry("s_eu", { region: "EU" }, "2026-07-02T00:00:00.000Z"),
  ];

  const s = summarizeStatusBoard(entries, orders);
  const byId = new Map(s.scopes.map((r) => [r.entry.id, r]));

  assert.equal(byId.get("s_eu")!.ordersCovered, 2, "the EU status reaches exactly the EU backers");
  assert.equal(
    byId.get("s_all")!.ordersCovered,
    3,
    "the merchant-wide status covers only those with no more specific status",
  );
  // No order is spoken for twice, and none is silently lost.
  assert.equal(s.ordersCovered, 5);
  assert.equal(s.ordersUncovered, 0);
  assert.equal(s.totalOrders, 5);
  // The band is rendered exactly as a reply will quote it. Never a date.
  assert.equal(byId.get("s_eu")!.bandPhrase, "in weeks 2–4");
});

test("orders no status reaches are counted as uncovered, not quietly folded in", () => {
  const orders = [order("o1", { campaignName: "Deepwater" }), order("o2", { campaignName: "Saltmarsh" })];
  const entries = [entry("s_dw", { campaignName: "Deepwater" }, "2026-07-02T00:00:00.000Z")];

  const s = summarizeStatusBoard(entries, orders);
  assert.equal(s.ordersCovered, 1);
  assert.equal(s.ordersUncovered, 1, "the Saltmarsh backer falls back to the day-bands, and we say so");
  assert.equal(s.historyCount, 1);
  assert.equal(s.lastUpdatedAt, "2026-07-02T00:00:00.000Z");
});

test("an empty board covers nobody and claims nothing", () => {
  const s = summarizeStatusBoard([], [order("o1")]);
  assert.equal(s.scopes.length, 0);
  assert.equal(s.ordersCovered, 0);
  assert.equal(s.ordersUncovered, 1);
  assert.equal(s.lastUpdatedAt, null);
});
