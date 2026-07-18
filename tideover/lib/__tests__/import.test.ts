import assert from "node:assert/strict";
import { test } from "node:test";
import { importBackerRows } from "@/lib/import";
import { createMerchantFromIntake } from "@/lib/onboarding";
import { getRepositories } from "@/lib/repositories";
import { setLiveStageClock } from "@/lib/repositories/live-stage";
import type { MappedRow } from "@/lib/csv";

/** A fresh, real merchant to import against (exercises the full repo seam). */
async function freshMerchant() {
  const { merchant } = await createMerchantFromIntake({
    brandName: `Import Test ${Math.random().toString(36).slice(2)}`,
    voice: "warm and direct",
    tone: ["Warm"],
    banned: [],
    signoff: "— the team",
    helpdesk: "mock",
    preorderApp: "",
    windowMinDays: 90,
    windowMaxDays: 120,
    stages: [],
  });
  return merchant;
}

test("importBackerRows dedupes a repeated email and creates the right counts", async () => {
  const merchant = await freshMerchant();
  const rows: MappedRow[] = [
    { firstName: "Ann", email: "ann@example.com", orderValueCents: 5900 },
    { firstName: "Ann-again", email: "ANN@example.com" }, // same email (case-insensitive) → reuse
    { firstName: "Ben", email: "ben@example.com", disclosedEtaValue: "weeks 9–11" },
    { firstName: "NoEmail", email: "" }, // skipped: no email
  ];

  const result = await importBackerRows(merchant.id, rows);
  assert.equal(result.customersCreated, 2); // ann + ben (the repeat reused ann)
  assert.equal(result.ordersCreated, 3); // 2 for ann, 1 for ben
  assert.equal(result.skipped, 1); // the emailless row

  const repos = getRepositories();

  // Ann is a single deduped customer carrying BOTH orders.
  const ann = await repos.customers.findByEmail(merchant.id, "ann@example.com");
  assert.ok(ann, "the deduped customer must exist");
  assert.equal(ann.orderIds.length, 2);
  const annOrders = await repos.orders.listByCustomer(ann.id);
  assert.equal(annOrders.length, 2);
  assert.ok(annOrders.every((o) => o.group === "ks-backer")); // KS import default
  // The row carried no delivery estimate — no export in this market does — so the
  // MERCHANT'S OWN promised window (90–120 days, from onboarding) is the
  // disclosure. Still nothing synthesized: it is the band they published, and it
  // is the exhibit the evidence pack could not produce for a single order before.
  assert.ok(
    annOrders.every((o) => o.disclosedEta?.value === "weeks 13–17"),
    "the merchant's promised window is stamped as the disclosure",
  );
  assert.ok(annOrders.every((o) => o.disclosedEta?.source === "campaign-page"));
  assert.equal(result.disclosedEtaStamped, 3, "every imported order carries a disclosure");

  // Ben's order captured the disclosed ETA (source present), nothing invented.
  const ben = await repos.customers.findByEmail(merchant.id, "ben@example.com");
  assert.ok(ben);
  const benOrders = await repos.orders.listByCustomer(ben.id);
  assert.equal(benOrders.length, 1);
  assert.equal(benOrders[0].disclosedEta?.value, "weeks 9–11");
  assert.equal(benOrders[0].disclosedEta?.source, "campaign-page");
  assert.equal(benOrders[0].preorderEtaSource, "manual");
});

test("a created order gets a resolvable signed status token", async () => {
  const merchant = await freshMerchant();
  await importBackerRows(merchant.id, [{ firstName: "Cid", email: "cid@example.com" }]);

  const repos = getRepositories();
  const cid = await repos.customers.findByEmail(merchant.id, "cid@example.com");
  assert.ok(cid);
  const [order] = await repos.orders.listByCustomer(cid.id);
  assert.ok(order.statusToken.includes("."), "token is <raw>.<hmac>");

  // The lookup key (the raw prefix) resolves back to this exact order — so
  // /status/<token> renders it.
  const lookupKey = order.statusToken.split(".")[0];
  const found = await repos.orders.findByToken(lookupKey);
  assert.equal(found?.id, order.id);
});

test("re-importing the same file (with source ids) does NOT duplicate orders", async () => {
  const merchant = await freshMerchant();
  const rows: MappedRow[] = [
    { firstName: "Dee", email: "dee@example.com", sourceKey: "KS-1001" },
    { firstName: "Eli", email: "eli@example.com", sourceKey: "KS-1002" },
  ];

  const first = await importBackerRows(merchant.id, rows);
  assert.equal(first.ordersCreated, 2);

  // The merchant clicks Import again on the same export.
  const second = await importBackerRows(merchant.id, rows);
  assert.equal(second.ordersCreated, 0, "no new orders on re-import");
  assert.equal(second.skipped, 2, "both rows recognized as already imported");

  const repos = getRepositories();
  const dee = await repos.customers.findByEmail(merchant.id, "dee@example.com");
  assert.ok(dee);
  assert.equal(dee.orderIds.length, 1, "still a single order, not doubled");
  const deeOrders = await repos.orders.listByCustomer(dee.id);
  assert.equal(deeOrders.length, 1);
  assert.equal(deeOrders[0].importKey, `${merchant.id}:KS-1001`);
});

test("importBackerRows throws on an unknown merchant", async () => {
  await assert.rejects(
    () => importBackerRows("mch_does_not_exist", [{ firstName: "X", email: "x@example.com" }]),
    /unknown merchant/,
  );
});

const DAY = 86_400_000;

test("imported order anchors dates to the parsed pledge date, not import time", async () => {
  const merchant = await freshMerchant();
  const now = new Date("2026-06-01T00:00:00.000Z");
  const pledged = new Date(now.getTime() - 92 * DAY).toISOString();

  await importBackerRows(
    merchant.id,
    [
      {
        firstName: "Fay",
        email: "fay@example.com",
        orderValueCents: 6000,
        orderDate: pledged,
        disclosedEtaValue: "weeks 9–11",
      },
    ],
    now,
  );

  const repos = getRepositories();
  const fay = await repos.customers.findByEmail(merchant.id, "fay@example.com");
  assert.ok(fay);
  const [o] = await repos.orders.listByCustomer(fay.id);
  assert.equal(o.fulfillmentStart, pledged, "start is the pledge date, not now()");
  assert.equal(o.createdAt, pledged);
  // fulfillmentEnd stays computed = fulfillmentStart + windowMax (120 here)
  assert.equal(o.fulfillmentEnd, new Date(new Date(pledged).getTime() + 120 * DAY).toISOString());
  // the ETA was disclosed at purchase — disclosedAt tracks the pledge date
  assert.equal(o.disclosedEta?.disclosedAt, pledged);
});

test("productionStage is DERIVED LIVE from the wait vs the merchant's own bands — inclusive, and never clamped to dispatch", async () => {
  const merchant = await freshMerchant();
  const now = new Date("2026-06-01T00:00:00.000Z");
  const iso = (daysAgo: number) => new Date(now.getTime() - daysAgo * DAY).toISOString();

  await importBackerRows(
    merchant.id,
    [
      { firstName: "S", email: "s@x.com", orderDate: iso(5) }, //   sourcing   [0,12]
      { firstName: "B", email: "b@x.com", orderDate: iso(32) }, //  BOUNDARY day — tooling [12,32]
      { firstName: "P", email: "p@x.com", orderDate: iso(50) }, //  production [32,72]
      { firstName: "F", email: "f@x.com", orderDate: iso(92) }, //  freight    [84,104]
      { firstName: "D", email: "d@x.com", orderDate: iso(110) }, // dispatch   [104,118]
      { firstName: "O", email: "o@x.com", orderDate: iso(240) }, // PAST EVERY BAND
    ],
    now,
  );

  const repos = getRepositories();
  // Reads resolve the stage against the CLOCK, not against import time — that is
  // the whole point. Pin it to the import instant so the assertions are about the
  // band math and not about how long this test file took to run.
  setLiveStageClock(() => now);
  try {
    const orderOf = async (email: string) => {
      const c = await repos.customers.findByEmail(merchant.id, email);
      assert.ok(c);
      const [o] = await repos.orders.listByCustomer(c.id);
      return o;
    };
    assert.equal((await orderOf("s@x.com")).productionStage, "sourcing");
    // The boundary bug: merchants author bands inclusively (12-32), the old read
    // was half-open, so a wait landing exactly on `to` matched nothing and fell
    // through to stages[0]. 28 of p01's backers, 52-82 days in, were told the
    // paper for their book was still being sourced.
    assert.equal((await orderOf("b@x.com")).productionStage, "tooling", "boundary day does NOT fall through to stage[0]");
    assert.equal((await orderOf("p@x.com")).productionStage, "production");
    assert.equal((await orderOf("f@x.com")).productionStage, "freight");
    assert.equal((await orderOf("d@x.com")).productionStage, "dispatch");

    // The overrun clamp: past every band, the old code jumped to the stage with
    // the highest ceiling — always dispatch, always "it shipped". ~4,758 of p10's
    // 9,000 backers were told their unbuilt CNC machine had left the warehouse.
    const overrun = await orderOf("o@x.com");
    assert.equal(overrun.productionStage, "overrun", "past every band is OVERDUE + UNKNOWN, never dispatch");
    assert.equal(overrun.stageSource, "overrun");
    assert.notEqual(overrun.productionStage, "dispatch");
  } finally {
    setLiveStageClock(null);
  }
});

test("the stage MOVES as the customer waits — the frozen snapshot is a hint, never the truth", async () => {
  const merchant = await freshMerchant();
  const pledged = new Date("2026-01-01T00:00:00.000Z");
  await importBackerRows(
    merchant.id,
    [{ firstName: "Mo", email: "mo@x.com", orderDate: pledged.toISOString() }],
    // Imported on day 3 of their wait: the snapshot stamped on disk says "sourcing".
    new Date("2026-01-04T00:00:00.000Z"),
  );

  const repos = getRepositories();
  const stageAt = async (iso: string) => {
    setLiveStageClock(() => new Date(iso));
    try {
      const c = await repos.customers.findByEmail(merchant.id, "mo@x.com");
      assert.ok(c);
      const [o] = await repos.orders.listByCustomer(c.id);
      return o.productionStage;
    } finally {
      setLiveStageClock(null);
    }
  };

  // Same order, same stored row. The stage the customer is TOLD advances with
  // their actual wait. Before this, every draft and every status page described
  // where the order was on the day the merchant uploaded a CSV, forever.
  assert.equal(await stageAt("2026-01-04T00:00:00.000Z"), "sourcing"); // day 3
  assert.equal(await stageAt("2026-02-01T00:00:00.000Z"), "tooling"); //  day 31
  assert.equal(await stageAt("2026-03-01T00:00:00.000Z"), "production"); // day 59
  assert.equal(await stageAt("2026-04-15T00:00:00.000Z"), "freight"); //  day 104 → dispatch band opens at 104
});

test("a row with no parseable date falls back to import time and is counted", async () => {
  const merchant = await freshMerchant();
  const now = new Date("2026-06-01T00:00:00.000Z");
  const res = await importBackerRows(
    merchant.id,
    [
      { firstName: "G", email: "g@x.com", orderDate: "2026-05-01T00:00:00.000Z" },
      { firstName: "H", email: "h@x.com" }, // no date → fallback to now(), counted
    ],
    now,
  );
  assert.equal(res.datelessRows, 1);

  const repos = getRepositories();
  const h = await repos.customers.findByEmail(merchant.id, "h@x.com");
  assert.ok(h);
  const [ho] = await repos.orders.listByCustomer(h.id);
  assert.equal(ho.fulfillmentStart, now.toISOString());
});

test("LTV accumulates pledge value across a backer's orders", async () => {
  const merchant = await freshMerchant();
  await importBackerRows(merchant.id, [
    { firstName: "Ivy", email: "ivy@x.com", orderValueCents: 6000, sourceKey: "A1" },
    { firstName: "Ivy", email: "ivy@x.com", orderValueCents: 4000, sourceKey: "A2" },
  ]);

  const repos = getRepositories();
  const ivy = await repos.customers.findByEmail(merchant.id, "ivy@x.com");
  assert.ok(ivy);
  assert.equal(ivy.orderIds.length, 2);
  assert.equal(ivy.ltvCents, 10000, "6000 seed + 4000 second pledge, not just the first");
});

test("unparseable-money rows default to the floor and are counted", async () => {
  const merchant = await freshMerchant();
  const res = await importBackerRows(merchant.id, [
    { firstName: "J", email: "j@x.com", orderValueCents: 6000 },
    { firstName: "K", email: "k@x.com" }, // no amount → floor, counted
  ]);
  assert.equal(res.unparseableMoneyRows, 1);

  const repos = getRepositories();
  const k = await repos.customers.findByEmail(merchant.id, "k@x.com");
  assert.ok(k);
  assert.equal(k.ltvCents, 5000); // DEFAULT_ORDER_VALUE_CENTS floor
});

test("re-importing an id-less export does NOT duplicate (synthesized dedupe key)", async () => {
  const merchant = await freshMerchant();
  const now = new Date("2026-06-01T00:00:00.000Z");
  const rows: MappedRow[] = [
    // no sourceKey/id column at all
    { firstName: "Lee", email: "lee@x.com", orderValueCents: 6000, orderDate: "2026-03-01T00:00:00.000Z" },
  ];

  const first = await importBackerRows(merchant.id, rows, now);
  assert.equal(first.ordersCreated, 1);

  const second = await importBackerRows(merchant.id, rows, now);
  assert.equal(second.ordersCreated, 0, "no id column, but the synthesized key dedupes");
  assert.equal(second.skipped, 1);

  const repos = getRepositories();
  const lee = await repos.customers.findByEmail(merchant.id, "lee@x.com");
  assert.ok(lee);
  assert.equal(lee.orderIds.length, 1);
});
