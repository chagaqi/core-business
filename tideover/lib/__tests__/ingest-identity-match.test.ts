import assert from "node:assert/strict";
import { test } from "node:test";
import { ingestTicket, getQueue } from "@/lib/service";
import { getRepositories } from "@/lib/repositories";
import type { NormalizedTicket } from "@/lib/channel-adapters/ChannelAdapter";

/**
 * Ingest identity-match hardening (DATA-PROVENANCE-HANDOFF).
 *
 * The bug: when an inbound ticket's customer/order can't be matched (unknown
 * sender email, no order_ref), ingest USED TO attach the ticket to the merchant's
 * OLDEST open order AND that order's customer — so risk/gift/reassurance then ran
 * against the WRONG person's LTV/order/value. These tests pin the corrected
 * behavior: an unmatched ticket is tied to a placeholder customer keyed by the
 * REAL sender, left order-less + flagged, and kept out of the order-derived
 * intelligence — while a MATCHED ticket is unchanged.
 */

function normalized(over: Partial<NormalizedTicket> = {}): NormalizedTicket {
  return {
    merchantId: "will-be-overwritten",
    externalId: `idm_${Date.now()}_${Math.random().toString(36).slice(2)}`,
    customerEmail: "never-seeded@nowhere.test",
    orderRef: null,
    subject: "where is my order",
    body: "any update?",
    type: "wismo",
    sentiment: "calm",
    createdAt: new Date().toISOString(),
    channel: "email",
    ...over,
  };
}

test("unmatched inbound: never borrows a stranger's order/customer", async () => {
  const repos = getRepositories();
  const merchant = (await repos.merchants.list())[0];

  // The order the OLD buggy fallback would have grabbed (oldest by fulfillmentStart).
  const merchantOrders = await repos.orders.listByMerchant(merchant.id);
  const oldest = [...merchantOrders].sort((a, b) =>
    a.fulfillmentStart.localeCompare(b.fulfillmentStart),
  )[0];
  assert.ok(oldest, "seeded merchant must have at least one order to prove non-attachment");

  const email = `unmatched_${Date.now()}@nowhere.test`;
  const res = await ingestTicket(normalized({ merchantId: merchant.id, customerEmail: email }));
  assert.ok("ticket" in res, "an unmatched inbound is still ingested, not errored");
  const { ticket } = res;

  // (1) no order borrowed — order-less, and specifically NOT the oldest order.
  assert.equal(ticket.orderId, "", "unmatched ticket must be order-less");
  assert.notEqual(ticket.orderId, oldest.id, "must not attach the merchant's oldest order");
  // (2) tied to the REAL sender via a placeholder customer, not a stranger.
  const sender = await repos.customers.findById(ticket.customerId);
  assert.equal(sender?.email, email, "ticket customer is the real sender");
  assert.notEqual(sender?.id, oldest.customerId, "must not attach the oldest order's customer");
  assert.equal(sender?.ltvCents, 0, "placeholder sender carries no fabricated LTV");
  // (3) flagged for manual match and given no order-derived draft/intelligence.
  assert.ok(ticket.tags.includes("presale:unmatched"), "flagged needs-manual-match");
  assert.ok(!ticket.draft, "no order → no order-derived draft (degrade to no factors)");
  assert.equal(ticket.status, "open");

  // (4) kept OUT of the order-derived cockpit: the queue skips an order-less ticket.
  const queue = await getQueue(merchant.id);
  assert.ok(!queue.some((r) => r.ticket.id === ticket.id), "unmatched ticket is not in the risk queue");
});

test("unmatched inbound: re-contact from the same sender reuses one placeholder customer", async () => {
  const repos = getRepositories();
  const merchant = (await repos.merchants.list())[0];
  const email = `repeat_${Date.now()}@nowhere.test`;

  const a = await ingestTicket(normalized({ merchantId: merchant.id, customerEmail: email }));
  const b = await ingestTicket(normalized({ merchantId: merchant.id, customerEmail: email }));
  assert.ok("ticket" in a && "ticket" in b);
  assert.equal(a.ticket.customerId, b.ticket.customerId, "same sender → one placeholder customer");

  const matches = (await repos.customers.listByMerchant(merchant.id)).filter((c) => c.email === email);
  assert.equal(matches.length, 1, "no duplicate placeholder customers for the same sender");
  assert.equal(matches[0].ticketCount, 2, "ticketCount accrues to the real sender");
});

test("matched inbound is unchanged: a real backer keeps their own order + a draft", async () => {
  const repos = getRepositories();
  const merchant = (await repos.merchants.list())[0];

  // Derive the backer from an ACTUAL order so the customer<->order link is real
  // (robust to any seed drift between customer.orderIds and order.customerId).
  const someOrder = (await repos.orders.listByMerchant(merchant.id))[0];
  assert.ok(someOrder, "seed must include at least one order for this merchant");
  const backer = await repos.customers.findById(someOrder.customerId);
  assert.ok(backer, "the order's customer must exist");

  const res = await ingestTicket(normalized({ merchantId: merchant.id, customerEmail: backer.email }));
  assert.ok("ticket" in res);
  const { ticket } = res;

  const matchedCustomer = await repos.customers.findById(ticket.customerId);
  assert.equal(matchedCustomer?.email, backer.email, "matched to the real backer, by email");
  assert.notEqual(ticket.orderId, "", "matched ticket carries a real order");
  const attached = await repos.orders.findById(ticket.orderId);
  assert.equal(attached?.customerId, ticket.customerId, "attached order belongs to the same customer");
  assert.ok(ticket.draft, "matched ingest still auto-drafts");
  assert.equal(ticket.status, "drafted");
  assert.ok(!ticket.tags.includes("presale:unmatched"), "matched ticket is not flagged unmatched");
});
