import assert from "node:assert/strict";
import { test } from "node:test";
import { assembleMerchantExport } from "@/lib/export";
import { getRepositories } from "@/lib/repositories";

/**
 * "Export everything" (task G6). The default (json) driver is deterministic in
 * tests, so we assert the assembler's counts against the repositories' own
 * per-merchant reads (the source of truth), plus strict merchant-scoping and
 * secret-stripping — the two properties the "no lock-in" proof depends on.
 */
const LUMEN = "mch_lumen0001";
const ATELIER = "mch_atelier02";

test("assembles a seeded merchant's collections with counts matching the repositories", async () => {
  const repos = getRepositories();
  const [orders, customers, tickets, gifts, social, variants, events, updates] = await Promise.all([
    repos.orders.listByMerchant(LUMEN),
    repos.customers.listByMerchant(LUMEN),
    repos.tickets.list({ merchantId: LUMEN }),
    repos.gifts.listByMerchant(LUMEN),
    repos.social.listByMerchant(LUMEN),
    repos.scriptVariants.listByMerchant(LUMEN),
    repos.outcomeEvents.listByMerchant(LUMEN),
    repos.merchantUpdates.listByMerchant(LUMEN),
  ]);

  const exp = await assembleMerchantExport(LUMEN, new Date("2026-07-04T00:00:00.000Z"));
  assert.ok(exp);
  assert.equal(exp.exportedFor.merchantId, LUMEN);
  assert.equal(exp.exportedFor.slug, "lumen-forge");
  assert.equal(exp.generatedAt, "2026-07-04T00:00:00.000Z");

  assert.equal(exp.collections.orders.length, orders.length);
  assert.equal(exp.collections.customers.length, customers.length);
  assert.equal(exp.collections.tickets.length, tickets.length);
  assert.equal(exp.collections.gifts.length, gifts.length);
  assert.equal(exp.collections.socialSignals.length, social.length);
  assert.equal(exp.collections.scriptVariants.length, variants.length);
  assert.equal(exp.collections.outcomeEvents.length, events.length);
  assert.equal(exp.collections.updates.length, updates.length);

  // Non-trivial data present, and status views aggregated across this merchant's
  // orders (there is no per-merchant status-view read).
  assert.ok(orders.length > 0 && tickets.length > 0);
  assert.ok(exp.collections.statusViews.length > 0);

  // The comm log — a sent reply — survives in the exported tickets.
  assert.ok(exp.collections.tickets.some((t) => t.sent));
});

test("scopes strictly to one merchant — no other merchant's rows leak", async () => {
  const exp = await assembleMerchantExport(LUMEN);
  assert.ok(exp);

  const allRows: Array<{ merchantId: string }> = [
    ...exp.collections.orders,
    ...exp.collections.customers,
    ...exp.collections.tickets,
    ...exp.collections.gifts,
    ...exp.collections.socialSignals,
    ...exp.collections.scriptVariants,
    ...exp.collections.outcomeEvents,
    ...exp.collections.updates,
    ...exp.collections.statusViews,
  ];

  assert.ok(allRows.length > 0);
  for (const row of allRows) {
    assert.equal(row.merchantId, LUMEN);
  }
  assert.ok(!allRows.some((r) => r.merchantId === ATELIER));
  assert.equal(exp.merchant.id, LUMEN);
});

test("strips the inboxToken from the merchant and the statusToken from every order", async () => {
  const exp = await assembleMerchantExport(LUMEN);
  assert.ok(exp);

  // The strip is meaningful: the raw records DO carry these live capabilities.
  const raw = await getRepositories().merchants.findById(LUMEN);
  assert.ok(raw?.inboxToken, "raw merchant should carry an inboxToken");

  assert.ok(!("inboxToken" in exp.merchant));
  assert.ok(exp.collections.orders.length > 0);
  for (const order of exp.collections.orders) {
    assert.ok(!("statusToken" in order));
  }
});

test("does NOT leak the status capability token via statusViews (a view's token IS the order's statusToken)", async () => {
  const exp = await assembleMerchantExport(LUMEN);
  assert.ok(exp);
  assert.ok(exp.collections.statusViews.length > 0, "there are status views to check");

  // The raw view log DOES carry the live token — prove the strip is meaningful —
  // and it equals the order's signed statusToken (the public /status capability).
  const orders = await getRepositories().orders.listByMerchant(LUMEN);
  const liveTokens = new Set(orders.map((o) => o.statusToken));
  const rawViews = (await Promise.all(orders.map((o) => getRepositories().statusViews.listByOrder(o.id)))).flat();
  assert.ok(rawViews.some((v) => liveTokens.has(v.token)), "raw views carry a live status token");

  // No exported view carries a token at all, and none matches a live statusToken.
  for (const v of exp.collections.statusViews) {
    assert.ok(!("token" in v), "exported status view has no token key");
    assert.ok(!liveTokens.has((v as { token?: string }).token ?? ""), "no live token leaks");
  }
});

test("returns null for an unknown merchant", async () => {
  assert.equal(await assembleMerchantExport("mch_does_not_exist"), null);
});
