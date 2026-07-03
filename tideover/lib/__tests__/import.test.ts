import assert from "node:assert/strict";
import { test } from "node:test";
import { importBackerRows } from "@/lib/import";
import { createMerchantFromIntake } from "@/lib/onboarding";
import { getRepositories } from "@/lib/repositories";
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
  assert.ok(annOrders.every((o) => o.disclosedEta === undefined)); // never synthesized

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
