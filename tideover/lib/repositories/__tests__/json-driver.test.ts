import assert from "node:assert/strict";
import { test } from "node:test";
import { jsonRepositories as repos } from "@/lib/repositories/json/repositories";
import { newId } from "@/lib/ids";
import type { Customer } from "@/lib/types";

/**
 * JSON-driver correctness for the data-layer hardening (EN-11/16, EN-24). These
 * assert the driver-agnostic CONTRACT the Mongo driver already meets (its
 * findWhere sorts { createdAt: 1, id: 1 }; its unique (merchantId, email) index
 * enforces dedup), so demo (JSON) and prod (Mongo) can't diverge on list order
 * or customer duplication.
 */

/** Non-decreasing by (createdAt ?? "", then id) — the cross-driver list order. */
function assertOrdered(rows: Array<{ id: string; createdAt?: string }>, label: string): void {
  for (let i = 1; i < rows.length; i++) {
    const a = rows[i - 1];
    const b = rows[i];
    const ac = a.createdAt ?? "";
    const bc = b.createdAt ?? "";
    const ok = ac < bc || (ac === bc && a.id <= b.id);
    assert.ok(
      ok,
      `${label} out of (createdAt,id) order at index ${i}: ${a.createdAt}/${a.id} then ${b.createdAt}/${b.id}`,
    );
  }
}

test("list methods return the deterministic cross-driver order (createdAt then id)", async () => {
  const merchants = await repos.merchants.list();
  assert.ok(merchants.length >= 1, "seed has at least one merchant");
  assertOrdered(merchants, "merchants.list");

  for (const m of merchants) {
    // createdAt-bearing collections: sort by createdAt then id.
    assertOrdered(await repos.orders.listByMerchant(m.id), "orders.listByMerchant");
    assertOrdered(await repos.tickets.list({ merchantId: m.id }), "tickets.list");
    assertOrdered(await repos.scriptVariants.listByMerchant(m.id), "scriptVariants.listByMerchant");
    // createdAt-less collections: fall through to id order.
    assertOrdered(await repos.customers.listByMerchant(m.id), "customers.listByMerchant");
    assertOrdered(await repos.gifts.listByMerchant(m.id), "gifts.listByMerchant");
    assertOrdered(await repos.social.listByMerchant(m.id), "social.listByMerchant");
  }
});

test("createdAt-less collections (customers) sort by id ascending", async () => {
  const [m] = await repos.merchants.list();
  const ids = (await repos.customers.listByMerchant(m.id)).map((c) => c.id);
  assert.ok(ids.length > 1, "merchant has multiple customers to order");
  assert.deepEqual(ids, [...ids].sort(), "customer list must be id-ascending");
});

test("orders.listByCustomer is deterministically ordered", async () => {
  const [m] = await repos.merchants.list();
  const customers = await repos.customers.listByMerchant(m.id);
  const withOrders = (
    await Promise.all(
      customers.map(async (c) => ({ id: c.id, orders: await repos.orders.listByCustomer(c.id) })),
    )
  ).find((x) => x.orders.length > 1);
  if (withOrders) assertOrdered(withOrders.orders, "orders.listByCustomer");
});

test("customer create enforces (merchantId, case-insensitive email) uniqueness via a code-11000 error", async () => {
  const merchantId = newId("mch");
  const email = `Dedup-${Math.random().toString(36).slice(2)}@Example.com`;
  const base: Omit<Customer, "id"> = {
    merchantId,
    email,
    firstName: "Dee",
    ltvCents: 0,
    orderIds: [],
    ticketCount: 0,
    lastSentiment: "calm",
  };

  const first = await repos.customers.create({ ...base, id: newId("cus") });
  assert.ok(first);

  // Same email, different case → must collide exactly like the Mongo unique
  // (merchantId, email) index with case-insensitive collation.
  await assert.rejects(
    () => repos.customers.create({ ...base, id: newId("cus"), email: email.toLowerCase() }),
    (err: unknown) =>
      typeof err === "object" && err !== null && (err as { code?: number }).code === 11000,
    "duplicate customer create must throw a code-11000 error",
  );

  // Uniqueness is per-merchant: the same email under a different merchant is fine.
  const other = await repos.customers.create({
    ...base,
    id: newId("cus"),
    merchantId: newId("mch"),
  });
  assert.ok(other, "same email under a different merchant is allowed");
});
