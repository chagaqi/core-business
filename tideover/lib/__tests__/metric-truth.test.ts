import assert from "node:assert/strict";
import { test } from "node:test";
import { createMerchantFromIntake } from "@/lib/onboarding";
import { importBackerRows } from "@/lib/import";
import { getRepositories } from "@/lib/repositories";
import { setLiveStageClock } from "@/lib/repositories/live-stage";
import { recordStatus } from "@/lib/status-board";
import { getDashboard, getRankedQueue, getTicketView, summarizeStatusBoard } from "@/lib/service";
import { ingestTicket } from "@/lib/service";
import type { NormalizedTicket } from "@/lib/channel-adapters/ChannelAdapter";
import type { Order, ProductionStatusEntry } from "@/lib/types";

/**
 * THE DASHBOARD MUST NOT ASSERT WHAT IT CANNOT MEASURE.
 *
 * On day 30 of the ten-merchant run every merchant opened the screen that justifies
 * the price and read: deflection 100%, $0 at risk, 0 at-risk customers, "Not yet
 * measured" on all four baseline metrics. The deflection figure was `resolved /
 * tickets` — a reply-completion rate wearing an outcome's name. These tests pin the
 * three properties that make the screen honest:
 *
 *   1. an unmeasured metric says so, and names what would make it real;
 *   2. a metric that IS measured is measured the way it is defined;
 *   3. the queue can always explain its own order.
 */

const DAY = 86_400_000;

async function freshMerchant(name = "Metric Truth") {
  const { merchant } = await createMerchantFromIntake({
    brandName: `${name} ${Math.random().toString(36).slice(2)}`,
    voice: "plain and specific",
    tone: ["Direct"],
    banned: [],
    signoff: "— the workshop",
    helpdesk: "mock",
    preorderApp: "",
    windowMinDays: 90,
    windowMaxDays: 120,
    stages: [],
  });
  return merchant;
}

const entryOf = (e: Partial<ProductionStatusEntry>): ProductionStatusEntry =>
  ({
    id: "pst_x",
    merchantId: "mch_x",
    stageKey: "production",
    headline: "on the line",
    confidenceBand: { minWeeks: 2, maxWeeks: 4 },
    updatedAt: "2026-06-01T00:00:00.000Z",
    updatedBy: "ops",
    source: "manual",
    ...e,
  }) as ProductionStatusEntry;

const orderOf = (o: Partial<Order>): Order =>
  ({
    id: "ord_x",
    merchantId: "mch_x",
    customerId: "cus_x",
    group: "ks-backer",
    orderValueCents: 3800,
    createdAt: "2026-01-01T00:00:00.000Z",
    fulfillmentStart: "2026-01-01T00:00:00.000Z",
    fulfillmentEnd: "2026-05-01T00:00:00.000Z",
    productionStage: "production",
    region: "US",
    statusToken: "t",
    preorderEtaSource: "manual",
    ...o,
  }) as Order;

// ── 1 · deflection is measured, or it is not claimed ─────────────────────────

test("a merchant with no status-page views gets NO deflection number — and is told what would make it real", async () => {
  const merchant = await freshMerchant();
  const now = new Date("2026-06-01T00:00:00.000Z");
  await importBackerRows(
    merchant.id,
    [{ firstName: "Nia", email: `nia_${Math.random().toString(36).slice(2)}@x.com`, orderDate: new Date(now.getTime() - 70 * DAY).toISOString() }],
    now,
  );

  const dash = await getDashboard(merchant.id, now);
  assert.ok(dash);
  // The old field is gone from the view model entirely — there is no `deflectionPct`
  // to accidentally render.
  assert.equal((dash!.live as Record<string, unknown>).deflectionPct, undefined);
  assert.equal(dash!.deflection.rate, null, "no rate is invented from an empty view ledger");
  assert.equal(dash!.deflection.state, "no-views");
  assert.match(dash!.deflection.gap!, /Not yet measured/);
  assert.match(dash!.deflection.gap!, /status link/, "the gap names the next action");
});

test("replying to every ticket does NOT produce a 100% deflection rate", async () => {
  const merchant = await freshMerchant();
  const now = new Date("2026-06-01T00:00:00.000Z");
  const email = `owen_${Math.random().toString(36).slice(2)}@x.com`;
  await importBackerRows(
    merchant.id,
    [{ firstName: "Owen", email, orderDate: new Date(now.getTime() - 70 * DAY).toISOString() }],
    now,
  );

  const inbound: NormalizedTicket = {
    merchantId: merchant.id,
    externalId: `mt_${Math.random().toString(36).slice(2)}`,
    customerEmail: email,
    orderRef: null,
    subject: "where is my order",
    body: "any update?",
    type: "wismo",
    sentiment: "calm",
    createdAt: now.toISOString(),
    channel: "email",
  };
  const res = await ingestTicket(inbound);
  assert.ok("ticket" in res);

  // Resolve it — the old metric would now read 100%.
  const repos = getRepositories();
  await repos.tickets.update(res.ticket.id, { status: "resolved" });

  const dash = await getDashboard(merchant.id, now);
  assert.equal(dash!.deflection.rate, null, "answering a ticket is not deflecting one");
  assert.equal(dash!.deflection.evaluatedViews, 0);
});

// ── 2 · the day-0 baseline is a MEASURED before/after, not a zero ─────────────

test("the day-0 cohort is measured at import, and the dashboard compares it to today", async () => {
  const merchant = await freshMerchant();
  const importedAt = new Date("2026-06-01T00:00:00.000Z");
  await importBackerRows(
    merchant.id,
    [
      { firstName: "A", email: `a_${Math.random().toString(36).slice(2)}@x.com`, orderDate: new Date(importedAt.getTime() - 100 * DAY).toISOString() },
      { firstName: "B", email: `b_${Math.random().toString(36).slice(2)}@x.com`, orderDate: new Date(importedAt.getTime() - 10 * DAY).toISOString() },
    ],
    importedAt,
  );

  // Sixty days later, the same computation over the same file.
  const later = new Date(importedAt.getTime() + 60 * DAY);
  const dash = await getDashboard(merchant.id, later);
  assert.ok(dash!.cohort, "an imported merchant HAS a day-0 picture");
  assert.equal(dash!.cohort!.day0.orders, 2);
  assert.equal(dash!.cohort!.today.orders, 2);
  assert.ok(
    dash!.cohort!.today.medianWaitDays > dash!.cohort!.day0.medianWaitDays,
    "both ends are counted, so the delta between them is a fact",
  );
});

// ── 3 · the status board's coverage count is the count of replies it will change ──

test("coverage is RESOLVED per order — a merchant-wide status does not claim the backers a campaign status owns", () => {
  const orders = [
    ...Array.from({ length: 3 }, (_, i) => orderOf({ id: `o_eu_${i}`, region: "EU", campaignName: "Deepwater" })),
    ...Array.from({ length: 5 }, (_, i) => orderOf({ id: `o_us_${i}`, region: "US", campaignName: "Deepwater" })),
    ...Array.from({ length: 2 }, (_, i) => orderOf({ id: `o_sm_${i}`, region: "EU", campaignName: "Saltmarsh" })),
  ];
  const entries = [
    entryOf({ id: "pst_all", updatedAt: "2026-06-01T00:00:00.000Z" }),
    entryOf({ id: "pst_eu", scope: { region: "EU" }, updatedAt: "2026-06-02T00:00:00.000Z" }),
  ];

  const s = summarizeStatusBoard(entries, orders);
  assert.equal(s.totalOrders, 10);
  assert.equal(s.ordersCovered, 10, "every order is spoken for by exactly one status");
  assert.equal(s.ordersUncovered, 0);

  const eu = s.scopes.find((x) => x.entry.id === "pst_eu")!;
  const all = s.scopes.find((x) => x.entry.id === "pst_all")!;
  assert.equal(eu.ordersCovered, 5, "the 5 EU orders resolve to the EU status");
  assert.equal(all.ordersCovered, 5, "and the merchant-wide status covers only the other 5");
  assert.equal(eu.ordersCovered + all.ordersCovered, s.totalOrders, "no order is counted twice");
  assert.match(eu.bandPhrase, /weeks/, "the band renders as a relative window, never a date");
});

test("no status posted: the board covers nobody and says so", () => {
  const s = summarizeStatusBoard([], [orderOf({ id: "o1" }), orderOf({ id: "o2" })]);
  assert.equal(s.ordersCovered, 0);
  assert.equal(s.ordersUncovered, 2);
  assert.equal(s.lastUpdatedAt, null);
  assert.deepEqual(s.scopes, []);
});

// ── 4 · a status posted from /app/status reaches the drafting layer ───────────

test("a status posted on the board is what the next draft describes (through the real service seam)", async () => {
  const merchant = await freshMerchant();
  const now = new Date("2026-06-01T00:00:00.000Z");
  const email = `dana_${Math.random().toString(36).slice(2)}@x.com`;
  setLiveStageClock(() => now);
  try {
    await importBackerRows(
      merchant.id,
      [{ firstName: "Dana", email, orderDate: new Date(now.getTime() - 50 * DAY).toISOString() }],
      now,
    );
    const res = await ingestTicket({
      merchantId: merchant.id,
      externalId: `mt_${Math.random().toString(36).slice(2)}`,
      customerEmail: email,
      orderRef: null,
      subject: "any news?",
      body: "any news?",
      type: "wismo",
      sentiment: "calm",
      createdAt: now.toISOString(),
      channel: "email",
    });
    assert.ok("ticket" in res);

    const before = await getTicketView(res.ticket.id, now);
    assert.ok(before);
    assert.notEqual(
      before!.order.stageSource,
      "status-board",
      "with no status posted, the stage comes from the merchant's day-bands",
    );

    // The founder posts what is ACTUALLY happening. This is the /app/status write.
    await recordStatus(
      {
        merchantId: merchant.id,
        stageKey: "freight",
        headline: "the container is booked and the pallets are at the port",
        confidenceBand: { minWeeks: 3, maxWeeks: 5 },
        updatedBy: "ops@x.com",
      },
      now,
    );

    const after = await getTicketView(res.ticket.id, now);
    assert.equal(after!.order.productionStage, "freight", "the drafting layer reads the board");
    assert.equal(after!.order.stageSource, "status-board", "and knows WHY it is claiming that stage");
    assert.notEqual(
      after!.intel.reassurance.draftText,
      before!.intel.reassurance.draftText,
      "the reply itself changes — the board is not decoration",
    );
  } finally {
    setLiveStageClock(null);
  }
});

// ── 5 · the queue can explain itself ─────────────────────────────────────────

test("every queue row carries its rank, its driver, and the reason it is where it is", async () => {
  const ranked = await getRankedQueue("mch_lumen0001");
  assert.ok(ranked.rows.length > 0, "the seeded merchant has a queue");
  ranked.rows.forEach((r, i) => {
    assert.equal(r.queueRank, i + 1, "queueRank is the row's place in the queue");
    assert.ok(r.topDriver.length > 0, "the engine's top driver is on the row, not thrown away");
    assert.ok(r.rankReason.length > 0, "and the row can answer 'why is this here?'");
  });
  assert.ok(
    ranked.distribution.cohortSize >= 0 &&
      ["risk", "tiebreak"].includes(ranked.distribution.basis),
    "the queue reports what it ordered on",
  );
});
