import assert from "node:assert/strict";
import { test } from "node:test";
import { approveSend, getQueue, ingestTicket } from "@/lib/service";
import { compareRows } from "@/lib/queue-rank";
import { getRepositories } from "@/lib/repositories";
import type { NormalizedTicket } from "@/lib/channel-adapters/ChannelAdapter";

/**
 * Cluster B — service-layer robustness (EN-08 / EN-13 / EN-36).
 *
 * These pin the perf + reliability contracts of lib/service.ts against the JSON
 * driver by counting the repository round-trips each operation makes (the repo
 * methods are the module-level singletons getRepositories() hands back, so a test
 * can wrap them to count calls, then restore). The mongo driver implements the
 * identical interface, so the same guarantees hold on the prod path.
 */

const LUMEN = "mch_lumen0001"; // seeded demo merchant

// Proof-safe operator reply (no hard date), matching the real cockpit post.
const REPLY =
  "Thanks for your patience — your order is on schedule and moving through production. I'll flag the moment it ships.";

/** First unsent queue row for a merchant (queue rows always carry a real order). */
async function firstUnsent(merchantId: string) {
  const queue = await getQueue(merchantId);
  const row = queue.find((r) => r.ticket.status !== "sent");
  assert.ok(row, "seeded merchant has an unsent ticket");
  return row!;
}

function normalized(over: Partial<NormalizedTicket> = {}): NormalizedTicket {
  return {
    merchantId: LUMEN,
    externalId: `svc_${Date.now()}_${Math.random().toString(36).slice(2)}`,
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

// ── EN-08 · getQueue batches its joins (no 1+3N per-ticket round-trips) ───────

test("getQueue batches per-ticket joins — zero findById round-trips, one list each (EN-08)", async () => {
  const repos = getRepositories();
  const orig = {
    orderFind: repos.orders.findById,
    custFind: repos.customers.findById,
    orderList: repos.orders.listByMerchant,
    custList: repos.customers.listByMerchant,
    ticketList: repos.tickets.list,
  };
  let orderFindCalls = 0;
  let custFindCalls = 0;
  let orderListCalls = 0;
  let custListCalls = 0;
  let ticketListCalls = 0;
  repos.orders.findById = async (id) => {
    orderFindCalls += 1;
    return orig.orderFind(id);
  };
  repos.customers.findById = async (id) => {
    custFindCalls += 1;
    return orig.custFind(id);
  };
  repos.orders.listByMerchant = async (m) => {
    orderListCalls += 1;
    return orig.orderList(m);
  };
  repos.customers.listByMerchant = async (m) => {
    custListCalls += 1;
    return orig.custList(m);
  };
  repos.tickets.list = async (f) => {
    ticketListCalls += 1;
    return orig.ticketList(f);
  };
  try {
    const queue = await getQueue(LUMEN);
    assert.ok(queue.length > 0, "seeded Lumen queue is non-empty");
    // The N+1 is gone: no per-row order/customer findById, and no per-row
    // ticketsLast7dFor (which was itself a tickets.list). The ticket list is read
    // once for the queue, orders + customers once each, and joined via a Map.
    assert.equal(orderFindCalls, 0, "orders.findById is never called per ticket");
    assert.equal(custFindCalls, 0, "customers.findById is never called per ticket");
    assert.equal(orderListCalls, 1, "orders fetched in one batched list");
    assert.equal(custListCalls, 1, "customers fetched in one batched list");
    assert.equal(ticketListCalls, 1, "tickets listed exactly once (no per-row 7-day re-list)");
  } finally {
    repos.orders.findById = orig.orderFind;
    repos.customers.findById = orig.custFind;
    repos.orders.listByMerchant = orig.orderList;
    repos.customers.listByMerchant = orig.custList;
    repos.tickets.list = orig.ticketList;
  }
});

test("getQueue rows join the correct order+customer and stay priority-sorted (EN-08 output preserved)", async () => {
  const queue = await getQueue(LUMEN);
  assert.ok(queue.length > 0, "seeded Lumen queue is non-empty");
  for (const r of queue) {
    assert.equal(r.order.id, r.ticket.orderId, "row order matches the ticket's orderId");
    assert.equal(r.customer.id, r.ticket.customerId, "row customer matches the ticket's customerId");
    assert.equal(r.order.merchantId, LUMEN, "joined order belongs to the merchant (no cross-merchant leak)");
  }
  // Documented contract order (lib/queue-rank): intent class, then risk, then the
  // declared tiebreak — with queueRank stamped as the row's place in that order.
  // The ENGINE's priorityRank is still carried on every row with its original
  // meaning, so an export can never disagree with the cockpit about what the
  // engine said; it is simply no longer the sort key.
  for (let i = 1; i < queue.length; i += 1) {
    const a = queue[i - 1];
    const b = queue[i];
    assert.equal(a.queueRank, i, "queueRank is the row's 1-based place in the queue");
    assert.ok(compareRows(rankableOf(a), rankableOf(b)) <= 0, "queue stays in compareRows order");
    assert.equal(typeof a.priorityRank, "number", "the engine's own rank is still carried");
  }
});

/** Project a QueueRow onto the shape lib/queue-rank orders it by. */
function rankableOf(r: Awaited<ReturnType<typeof getQueue>>[number]) {
  return {
    ticketId: r.ticket.id,
    createdAt: r.ticket.createdAt,
    sentiment: r.ticket.sentiment,
    live: r.ticket.status !== "sent",
    riskScore: r.riskScore,
    daysInWait: r.daysInWait,
    orderValueCents: r.order.orderValueCents,
    topDriver: r.topDriver,
  };
}

// ── EN-13 · a failed reply_sent ledger write is retried + surfaced, not swallowed ──

test("approveSend still delivers, but attributes nothing, when the ledger write keeps failing (EN-13)", async () => {
  const row = await firstUnsent(LUMEN);
  const repos = getRepositories();
  const origRecord = repos.outcomeEvents.record;
  let replySentAttempts = 0;
  repos.outcomeEvents.record = async (e) => {
    if (e.kind === "reply_sent") {
      replySentAttempts += 1;
      throw new Error("simulated ledger outage");
    }
    return origRecord(e);
  };
  try {
    const result = await approveSend(row.ticket.id, REPLY);
    assert.ok("ticket" in result, "a ledger outage must NOT fail the send itself");
    assert.equal(result.ticket.status, "sent", "the atomic send guard still marked it sent");
    assert.equal(result.alreadySent, false);
    // No fabricated attribution for a send whose proof event never landed.
    assert.equal(result.editedRatio, 0, "no fabricated editedRatio for an unrecorded send");
    assert.equal(result.canPromote, false, "no promote offer without a recorded parent");
    // The write was retried once (two attempts) before the failure was surfaced —
    // the old code swallowed it on the first failure.
    assert.equal(replySentAttempts, 2, "the reply_sent write is retried once, not swallowed on first failure");
  } finally {
    repos.outcomeEvents.record = origRecord;
  }
});

test("approveSend records exactly one reply_sent via the retry when the first write fails transiently (EN-13)", async () => {
  const row = await firstUnsent(LUMEN);
  const id = row.ticket.id;
  const repos = getRepositories();
  const origRecord = repos.outcomeEvents.record;
  let replySentAttempts = 0;
  repos.outcomeEvents.record = async (e) => {
    if (e.kind === "reply_sent") {
      replySentAttempts += 1;
      if (replySentAttempts === 1) throw new Error("transient ledger blip");
    }
    return origRecord(e);
  };
  const replySentCount = async () =>
    (await repos.outcomeEvents.listByMerchant(LUMEN)).filter(
      (ev) => ev.kind === "reply_sent" && ev.ticketId === id,
    ).length;
  try {
    const before = await replySentCount();
    const result = await approveSend(id, REPLY);
    assert.ok("ticket" in result, "ticket" in result ? "" : (result as { error: string }).error);
    assert.equal(result.ticket.status, "sent");
    assert.equal(replySentAttempts, 2, "first attempt failed, the retry ran");
    const after = await replySentCount();
    assert.equal(after - before, 1, "exactly one reply_sent event is persisted after the retry (no double-count)");
  } finally {
    repos.outcomeEvents.record = origRecord;
  }
});

// ── EN-36 · the ACK-path outcome-ledger read is bounded ──────────────────────

test("ingest of an unmatched (order-less) inbound never scans the outcome ledger (EN-36)", async () => {
  const repos = getRepositories();
  const origList = repos.outcomeEvents.listByMerchant;
  let ledgerReads = 0;
  repos.outcomeEvents.listByMerchant = async (m) => {
    ledgerReads += 1;
    return origList(m);
  };
  try {
    const email = `unmatched_${Date.now()}@nowhere.test`;
    const res = await ingestTicket(normalized({ customerEmail: email }));
    assert.ok("ticket" in res, "an unmatched inbound is still ingested, not errored");
    assert.equal(res.ticket.orderId, "", "unmatched inbound is order-less");
    assert.equal(ledgerReads, 0, "an order-less inbound cannot attribute — it must not scan the full ledger");
  } finally {
    repos.outcomeEvents.listByMerchant = origList;
  }
});

test("ingest of a MATCHED inbound still attributes, reading the ledger exactly once (EN-36)", async () => {
  const repos = getRepositories();
  // Derive a real backer from an ACTUAL order so the customer<->order match is real.
  const someOrder = (await repos.orders.listByMerchant(LUMEN))[0];
  assert.ok(someOrder, "seed must include at least one Lumen order");
  const backer = await repos.customers.findById(someOrder.customerId);
  assert.ok(backer, "the order's customer must exist");

  const origList = repos.outcomeEvents.listByMerchant;
  let ledgerReads = 0;
  repos.outcomeEvents.listByMerchant = async (m) => {
    ledgerReads += 1;
    return origList(m);
  };
  try {
    const res = await ingestTicket(normalized({ customerEmail: backer!.email }));
    assert.ok("ticket" in res, "ticket" in res ? "" : (res as { error: string }).error);
    assert.notEqual(res.ticket.orderId, "", "matched inbound carries a real order");
    assert.equal(ledgerReads, 1, "matched inbound reads the ledger once (single pass, not several)");
  } finally {
    repos.outcomeEvents.listByMerchant = origList;
  }
});
