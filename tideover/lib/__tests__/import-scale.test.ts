import assert from "node:assert/strict";
import { test } from "node:test";
import { importBackerRows, IMPORT_CHUNK_SIZE, IMPORT_ROW_CAP } from "@/lib/import";
import { createMerchantFromIntake } from "@/lib/onboarding";
import { getRepositories } from "@/lib/repositories";
import { jsonRepositories } from "@/lib/repositories/json/repositories";
import type { MappedRow } from "@/lib/csv";

/**
 * Scale + resume behavior of the chunked importer (ICP campaigns ship 5k–50k
 * backers): batches stay ≤ IMPORT_CHUNK_SIZE through the repo seam, the email +
 * importKey dedupe maps span the WHOLE import (not per-chunk), a mid-import
 * failure reports created-so-far + failed-at, and a RE-RUN of the same file is
 * idempotent — already-persisted rows are skipped and any order left unlinked
 * by the failure is re-linked, never duplicated.
 */

/** A fresh, real merchant to import against (exercises the full repo seam). */
async function freshMerchant() {
  const { merchant } = await createMerchantFromIntake({
    brandName: `Import Scale ${Math.random().toString(36).slice(2)}`,
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

/**
 * Synthetic export rows, generated in-test. `emailCycle` (default: unique
 * emails) wraps emails onto earlier backers so repeat customers land in
 * DIFFERENT chunks — the cross-chunk email-dedupe case.
 */
function syntheticRows(n: number, emailCycle: number = n): MappedRow[] {
  return Array.from({ length: n }, (_, i) => ({
    firstName: `Backer${i}`,
    email: `backer${i % emailCycle}@example.com`,
    orderValueCents: 5000 + (i % 90) * 100,
    sourceKey: `KS-${100000 + i}`,
    orderDate: "2026-03-01T00:00:00.000Z",
  }));
}

test("10,000 rows import in ≤500-row chunks, email-dedupe spans chunks, re-run creates zero duplicates", async () => {
  const merchant = await freshMerchant();
  // 10k orders across 9k backers: rows i and i+9000 share an email, and land
  // 18 chunks apart — the dedupe map must span the whole import.
  const rows = syntheticRows(10_000, 9_000);

  // Observe the real write batches crossing the repo seam.
  const batchSizes: number[] = [];
  const realCreateMany = jsonRepositories.orders.createMany;
  jsonRepositories.orders.createMany = async (os) => {
    batchSizes.push(os.length);
    return realCreateMany(os);
  };
  try {
    const first = await importBackerRows(merchant.id, rows);
    assert.equal(first.customersCreated, 9_000);
    assert.equal(first.ordersCreated, 10_000);
    assert.equal(first.skipped, 0);
    assert.equal(first.failedAtChunk, null);
    assert.equal(first.chunksPersisted, Math.ceil(10_000 / IMPORT_CHUNK_SIZE));
    assert.ok(
      batchSizes.every((n) => n > 0 && n <= IMPORT_CHUNK_SIZE),
      `every write batch ≤ ${IMPORT_CHUNK_SIZE} (got ${Math.max(...batchSizes)})`,
    );
    assert.equal(batchSizes.reduce((a, b) => a + b, 0), 10_000);

    // The merchant clicks Import again on the same export: nothing duplicates.
    const second = await importBackerRows(merchant.id, rows);
    assert.equal(second.customersCreated, 0);
    assert.equal(second.ordersCreated, 0);
    assert.equal(second.skipped, 10_000);
  } finally {
    jsonRepositories.orders.createMany = realCreateMany;
  }

  const repos = getRepositories();
  const orders = await repos.orders.listByMerchant(merchant.id);
  assert.equal(orders.length, 10_000);
  assert.equal(new Set(orders.map((o) => o.importKey)).size, 10_000, "importKeys unique");

  // A repeat backer (rows 0 and 9000) is ONE customer with BOTH orders and
  // an LTV accumulated across chunks.
  const repeat = await repos.customers.findByEmail(merchant.id, "backer0@example.com");
  assert.ok(repeat);
  assert.equal(repeat.orderIds.length, 2);
  assert.equal(repeat.ltvCents, 5000 + (0 % 90) * 100 + 5000 + (9000 % 90) * 100);
});

test("a chunk failure reports created-so-far + failed-at, and a re-run resumes idempotently", async () => {
  const merchant = await freshMerchant();
  const rows = syntheticRows(1_250); // 3 chunks: 500 / 500 / 250

  const real = jsonRepositories.orders.createMany;
  let calls = 0;
  jsonRepositories.orders.createMany = async (os) => {
    calls += 1;
    if (calls === 2) {
      // The driver dies MIDWAY through chunk 2: an ordered-insert prefix of
      // 200 orders lands, then the write fails.
      await real(os.slice(0, 200));
      throw new Error("simulated driver failure");
    }
    return real(os);
  };
  let first;
  try {
    first = await importBackerRows(merchant.id, rows);
  } finally {
    jsonRepositories.orders.createMany = real;
  }
  // Deterministic partial-failure report: chunk 1 landed, chunk 2 failed.
  assert.equal(first.failedAtChunk, 2);
  assert.equal(first.chunksPersisted, 1);
  assert.equal(first.ordersCreated, 500);
  assert.equal(first.customersCreated, 500);

  // RE-RUN of the same file: the 700 persisted orders (500 + the 200-row
  // partial prefix) are skipped, the remaining 550 are created — and the 200
  // orphans (order inserted, customer link never patched) are re-linked.
  const rerun = await importBackerRows(merchant.id, rows);
  assert.equal(rerun.failedAtChunk, null);
  assert.equal(rerun.ordersCreated, 550);
  assert.equal(rerun.skipped, 700);

  const repos = getRepositories();
  const orders = await repos.orders.listByMerchant(merchant.id);
  assert.equal(orders.length, 1_250, "no duplicates after the resume");
  assert.equal(new Set(orders.map((o) => o.importKey)).size, 1_250);
  const customers = await repos.customers.listByMerchant(merchant.id);
  assert.equal(customers.length, 1_250);
  // Every order is linked onto its customer exactly once, LTV counted once.
  const byId = new Map(customers.map((c) => [c.id, c]));
  for (const o of orders) {
    const c = byId.get(o.customerId);
    assert.ok(c, "every order's customer exists");
    assert.deepEqual(c.orderIds, [o.id]);
    assert.equal(c.ltvCents, o.orderValueCents);
  }
});

test("a failure between the order insert and the customer link is repaired on re-run (no double LTV)", async () => {
  const merchant = await freshMerchant();
  const rows = syntheticRows(10); // one chunk

  const realUpdate = jsonRepositories.customers.update;
  jsonRepositories.customers.update = async () => {
    throw new Error("simulated failure before the link patch");
  };
  let first;
  try {
    first = await importBackerRows(merchant.id, rows);
  } finally {
    jsonRepositories.customers.update = realUpdate;
  }
  // The chunk did not fully persist, so nothing is counted — but the orders
  // and customers DID land, unlinked.
  assert.equal(first.failedAtChunk, 1);
  assert.equal(first.ordersCreated, 0);

  const rerun = await importBackerRows(merchant.id, rows);
  assert.equal(rerun.ordersCreated, 0, "no new orders — everything already persisted");
  assert.equal(rerun.skipped, 10);

  const repos = getRepositories();
  const orders = await repos.orders.listByMerchant(merchant.id);
  assert.equal(orders.length, 10);
  for (const o of orders) {
    const c = await repos.customers.findById(o.customerId);
    assert.ok(c);
    assert.deepEqual(c.orderIds, [o.id], "orphaned order re-linked exactly once");
    assert.equal(c.ltvCents, o.orderValueCents, "LTV accumulated once, never doubled");
  }

  // A THIRD run changes nothing (the repair itself is idempotent).
  const third = await importBackerRows(merchant.id, rows);
  assert.equal(third.ordersCreated, 0);
  const after = await repos.orders.listByMerchant(merchant.id);
  assert.equal(after.length, 10);
  const c0 = await repos.customers.findByEmail(merchant.id, "backer0@example.com");
  assert.ok(c0);
  assert.equal(c0.orderIds.length, 1);
});

test("an import beyond the 50,000-row cap is refused with a clear error", async () => {
  const merchant = await freshMerchant();
  const rows = syntheticRows(IMPORT_ROW_CAP + 1);
  await assert.rejects(() => importBackerRows(merchant.id, rows), /50,000-row cap/);
  // Nothing was written before the refusal.
  const repos = getRepositories();
  assert.equal((await repos.orders.listByMerchant(merchant.id)).length, 0);
});
