import assert from "node:assert/strict";
import { test } from "node:test";
import { createMerchantFromIntake } from "@/lib/onboarding";
import { importBackerRows } from "@/lib/import";
import { getRepositories } from "@/lib/repositories";
import { setLiveStageClock } from "@/lib/repositories/live-stage";
import { draftReassurance } from "@/lib/engines/reassurance";
import {
  InvalidStatusError,
  currentBoard,
  formatWeeksBand,
  getCurrentStatus,
  recordStatus,
  resolveDisclosedEta,
  resolveStatusFor,
  scopeSpecificity,
  statusHistoryForOrder,
  windowToDisclosedBand,
} from "@/lib/status-board";
import type { Order, ProductionStatusEntry } from "@/lib/types";

const DAY = 86_400_000;

async function freshMerchant(name = "Status Board") {
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

/** A bare order fixture for the pure scope resolvers. */
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

// ─── scope resolution (pure) ────────────────────────────────────────────────

test("the most specific status that APPLIES wins; a status scoped to a cohort the order is not in never reaches it", () => {
  const euOrder = orderOf({ region: "EU", campaignName: "Deepwater" });
  const usOrder = orderOf({ region: "US", campaignName: "Deepwater" });
  const saltmarsh = orderOf({ region: "EU", campaignName: "Saltmarsh" });

  const entries = [
    entryOf({ id: "pst_all", headline: "everything is moving", updatedAt: "2026-06-01T00:00:00.000Z" }),
    entryOf({ id: "pst_eu", headline: "the EU container rolled at origin", scope: { region: "EU" }, updatedAt: "2026-06-02T00:00:00.000Z" }),
    entryOf({ id: "pst_dw", headline: "Deepwater tooling re-cut", scope: { campaignName: "Deepwater" }, updatedAt: "2026-06-03T00:00:00.000Z" }),
  ];

  // p04's whole problem: the EU container rolled, US backers are fine. Campaign
  // (4) outranks region (1), so a Deepwater EU backer hears about Deepwater.
  assert.equal(resolveStatusFor(entries, euOrder)?.id, "pst_dw");
  assert.equal(resolveStatusFor(entries, usOrder)?.id, "pst_dw");
  // A Saltmarsh backer is NOT in the Deepwater cohort — the campaign status does
  // not reach them. They get the EU one. This is the "don't panic the people who
  // are fine" case, and it is the thing five of ten personas needed.
  assert.equal(resolveStatusFor(entries, saltmarsh)?.id, "pst_eu");
  // An order in no named cohort still hears the merchant-wide status.
  assert.equal(resolveStatusFor(entries, orderOf({ region: "CA" }))?.id, "pst_all");
  // And a merchant who has posted nothing reaches nobody.
  assert.equal(resolveStatusFor([], euOrder), null);
});

test("specificity ranks campaign > wave > region > merchant-wide, and ties break on recency", () => {
  assert.equal(scopeSpecificity(undefined), 0);
  assert.equal(scopeSpecificity({ region: "EU" }), 1);
  assert.equal(scopeSpecificity({ wave: "2" }), 2);
  assert.equal(scopeSpecificity({ campaignName: "Deepwater" }), 4);
  assert.ok(scopeSpecificity({ campaignName: "D", wave: "2", region: "EU" }) > scopeSpecificity({ campaignName: "D" }));

  const order = orderOf({ region: "EU" });
  const older = entryOf({ id: "pst_old", scope: { region: "EU" }, updatedAt: "2026-06-01T00:00:00.000Z" });
  const newer = entryOf({ id: "pst_new", scope: { region: "EU" }, updatedAt: "2026-06-09T00:00:00.000Z" });
  assert.equal(resolveStatusFor([older, newer], order)?.id, "pst_new");
  assert.equal(resolveStatusFor([newer, older], order)?.id, "pst_new", "order of the history must not matter");
});

test("currentBoard folds the append-only history down to the newest entry per scope", () => {
  const board = currentBoard([
    entryOf({ id: "a", updatedAt: "2026-06-01T00:00:00.000Z" }),
    entryOf({ id: "b", updatedAt: "2026-06-05T00:00:00.000Z" }),
    entryOf({ id: "c", scope: { region: "EU" }, updatedAt: "2026-06-02T00:00:00.000Z" }),
  ]);
  assert.equal(board.length, 2, "one current status per distinct scope");
  assert.ok(board.some((e) => e.id === "b"), "the newer merchant-wide entry supersedes the older");
  assert.ok(!board.some((e) => e.id === "a"));
});

test("formatWeeksBand is always a relative window, never a date", () => {
  assert.equal(formatWeeksBand({ minWeeks: 2, maxWeeks: 4 }), "in weeks 2–4");
  assert.equal(formatWeeksBand({ minWeeks: 3, maxWeeks: 3 }), "in about 3 weeks");
  assert.ok(!/\d{4}|january|monday/i.test(formatWeeksBand({ minWeeks: 1, maxWeeks: 12 })));
});

// ─── writes ─────────────────────────────────────────────────────────────────

test("a status carrying a hard date is REFUSED at the door — never on read, inside a draft", async () => {
  const merchant = await freshMerchant();
  await assert.rejects(
    () =>
      recordStatus({
        merchantId: merchant.id,
        stageKey: "production",
        headline: "the run finishes March 14 and ships that week",
        confidenceBand: { minWeeks: 2, maxWeeks: 4 },
        updatedBy: "ops@x.com",
      }),
    InvalidStatusError,
    "a hard date in the headline must be refused",
  );
  await assert.rejects(
    () =>
      recordStatus({
        merchantId: merchant.id,
        stageKey: "production",
        headline: "the run is on the line",
        detail: "the container books on April 3 and sails that week",
        confidenceBand: { minWeeks: 2, maxWeeks: 4 },
        updatedBy: "ops@x.com",
      }),
    InvalidStatusError,
  );
  // An inverted band is refused too — the band is customer-facing arithmetic.
  await assert.rejects(
    () =>
      recordStatus({
        merchantId: merchant.id,
        stageKey: "production",
        headline: "on the line",
        confidenceBand: { minWeeks: 9, maxWeeks: 2 },
        updatedBy: "ops@x.com",
      }),
    InvalidStatusError,
  );
  // Nothing was written.
  const repos = getRepositories();
  assert.equal((await repos.productionStatuses.listByMerchant(merchant.id)).length, 0);
});

test("the board is append-only: an update never destroys what the customer was previously told", async () => {
  const merchant = await freshMerchant();
  await recordStatus(
    {
      merchantId: merchant.id,
      stageKey: "tooling",
      headline: "the injection moulds are being cut",
      confidenceBand: { minWeeks: 6, maxWeeks: 9 },
      updatedBy: "priya@lumen",
    },
    new Date("2026-06-01T00:00:00.000Z"),
  );
  await recordStatus(
    {
      merchantId: merchant.id,
      stageKey: "production",
      headline: "the moulds are done and the first run is loading",
      confidenceBand: { minWeeks: 2, maxWeeks: 4 },
      updatedBy: "priya@lumen",
    },
    new Date("2026-06-20T00:00:00.000Z"),
  );

  const repos = getRepositories();
  const history = await repos.productionStatuses.listByMerchant(merchant.id);
  assert.equal(history.length, 2, "the first statement is still on file");
  assert.equal(history[0].headline, "the injection moulds are being cut", "oldest first");
  assert.equal(history[1].stageKey, "production");

  // The merchant record carries the CURRENT merchant-wide status, denormalized.
  const stored = await repos.merchants.findById(merchant.id);
  assert.equal(stored?.productionStatus?.stageKey, "production");
  assert.equal(stored?.productionStatus?.updatedBy, "priya@lumen");

  // And "what did you tell this backer, and when" is answerable — the exhibit the
  // evidence pack could not produce for a single customer.
  const trail = statusHistoryForOrder(history, orderOf({}));
  assert.deepEqual(
    trail.map((e) => e.stageKey),
    ["tooling", "production"],
  );
});

// ─── the accessor, end to end ───────────────────────────────────────────────

test("getCurrentStatus resolves the merchant's own words for ONE order, through the real repos", async () => {
  const merchant = await freshMerchant();
  // Anchored to REAL now, not a fixed date: productionStage is resolved LIVE
  // against wall-clock time (lib/repositories/live-stage.ts), so a hardcoded
  // anchor silently ages — on 2026-08-08 these "60-day-old" orders had drifted
  // past every band and the assertion below flipped band → overrun. The offsets
  // are what this test is about; the epoch never was.
  const now = new Date();
  await importBackerRows(
    merchant.id,
    [
      { firstName: "Eva", email: "eva@eu.com", orderDate: new Date(now.getTime() - 60 * DAY).toISOString(), region: "EU" },
      { firstName: "Uma", email: "uma@us.com", orderDate: new Date(now.getTime() - 60 * DAY).toISOString(), region: "US" },
    ],
    now,
  );

  await recordStatus(
    {
      merchantId: merchant.id,
      stageKey: "freight",
      headline: "the EU container rolled at origin and is rebooked on the next sailing",
      confidenceBand: { minWeeks: 3, maxWeeks: 6 },
      scope: { region: "EU" },
      updatedBy: "teodora@brasslight",
    },
    now,
  );

  const repos = getRepositories();
  const orderFor = async (email: string) => {
    const c = await repos.customers.findByEmail(merchant.id, email);
    assert.ok(c);
    const [o] = await repos.orders.listByCustomer(c.id);
    return o;
  };

  const eva = await orderFor("eva@eu.com");
  const uma = await orderFor("uma@us.com");

  const evaStatus = await getCurrentStatus(merchant.id, eva);
  assert.equal(evaStatus?.headline, "the EU container rolled at origin and is rebooked on the next sailing");
  // The US backer is fine, and hears nothing about a container that is not theirs.
  assert.equal(await getCurrentStatus(merchant.id, uma), null);

  // And the EU order's LIVE stage is the merchant's word, not the band's guess.
  assert.equal(eva.productionStage, "freight");
  assert.equal(eva.stageSource, "status-board");
  assert.equal(uma.stageSource, "band");
});

test("A STATUS-BOARD UPDATE CHANGES WHAT THE NEXT DRAFT SAYS", async () => {
  const merchant = await freshMerchant();
  const now = new Date("2026-06-01T00:00:00.000Z");
  await importBackerRows(
    merchant.id,
    [{ firstName: "Owen", email: "owen@x.com", orderDate: new Date(now.getTime() - 50 * DAY).toISOString() }],
    now,
  );

  const repos = getRepositories();
  const draftNow = async () => {
    setLiveStageClock(() => now);
    try {
      const c = await repos.customers.findByEmail(merchant.id, "owen@x.com");
      assert.ok(c);
      const [order] = await repos.orders.listByCustomer(c.id);
      const m = await repos.merchants.findById(merchant.id);
      assert.ok(m);
      return {
        stage: order.productionStage,
        text: draftReassurance({ order, merchant: m, firstName: "Owen", sentiment: "anxious", now }).draftText,
      };
    } finally {
      setLiveStageClock(null);
    }
  };

  // Day 50 → the merchant's own bands put this order in "production".
  const before = await draftNow();
  assert.equal(before.stage, "production");
  assert.match(before.text, /production line/i);

  // The founder posts what is ACTUALLY happening: the run stopped, they are back
  // in tooling. A human said so today; the band is a plan someone typed months ago.
  await recordStatus(
    {
      merchantId: merchant.id,
      stageKey: "tooling",
      headline: "we pulled the run and re-cut the joint-housing mould — that is the stage that moved",
      confidenceBand: { minWeeks: 5, maxWeeks: 8 },
      updatedBy: "sam@x.com",
    },
    now,
  );

  const after = await draftNow();
  assert.equal(after.stage, "tooling", "the status board outranks the band");
  assert.match(after.text, /re-cut the joint-housing mould/i, "the merchant's own words are in the reply");
  assert.notEqual(after.text, before.text, "a status-board update changes what the next draft says");
});

// ─── the disclosed ETA ──────────────────────────────────────────────────────

test("the merchant's promised window becomes the disclosure — and a per-cohort override wins", () => {
  assert.equal(windowToDisclosedBand({ min: 90, max: 120 }), "weeks 13–17");
  assert.equal(windowToDisclosedBand({ min: 60, max: 60 }), "about 9 weeks");

  const merchant = {
    disclosedEtas: [
      { value: "weeks 13–17", source: "campaign-page" as const },
      { value: "weeks 20–24", source: "campaign-page" as const, scope: { campaignName: "Deepwater" } },
    ],
  };
  assert.equal(resolveDisclosedEta(merchant, {})?.value, "weeks 13–17");
  assert.equal(resolveDisclosedEta(merchant, { campaignName: "Deepwater" })?.value, "weeks 20–24");
  assert.equal(resolveDisclosedEta(merchant, { campaignName: "Saltmarsh" })?.value, "weeks 13–17");
  assert.equal(resolveDisclosedEta({ disclosedEtas: [] }, {}), null, "never invented");
});
