import assert from "node:assert/strict";
import { test } from "node:test";
import { approveSend, getQueue } from "@/lib/service";
import { getSendAdapter } from "@/lib/channel-adapters/registry";
import { ManualAdapter } from "@/lib/channel-adapters/ManualAdapter";
import { getRepositories } from "@/lib/repositories";

const LUMEN = "mch_lumen0001"; // seeded demo merchant (isDemo: true, helpdesk gorgias)

// The real cockpit always posts the operator's approved editor text (seeded
// tickets render their draft live and don't persist one). Proof-safe: no hard date.
const REPLY = "Thanks for your patience — your order is on schedule and moving through production. I'll flag the moment it ships.";

/** First unsent queue row for a merchant (queue rows always carry a real order). */
async function firstUnsent(merchantId: string) {
  const queue = await getQueue(merchantId);
  const row = queue.find((r) => r.ticket.status !== "sent");
  assert.ok(row, "seeded merchant has an unsent ticket");
  return row!;
}

test("getSendAdapter: a real merchant routes to the ManualAdapter, a demo keeps Mock", () => {
  // Real merchant on a real helpdesk channel → honest manual record.
  assert.equal(getSendAdapter("gorgias", false).name, "manual");
  assert.equal(getSendAdapter("email", false).name, "manual");
  // Demo merchant → simulated send, unchanged walk.
  assert.equal(getSendAdapter("gorgias", true).name, "mock");
  // Native mock channel stays on the working MockAdapter either way.
  assert.equal(getSendAdapter("mock", false).name, "mock");
});

test("ManualAdapter.sendReply records a real human action: null externalId + real sentAt", async () => {
  const before = Date.now();
  const res = await new ManualAdapter().sendReply("tkt_whatever", "the approved reply body");
  const after = Date.now();
  assert.equal(res.externalId, null, "no vendor id — the human pastes it themselves");
  const sentMs = new Date(res.sentAt).getTime();
  assert.ok(!Number.isNaN(sentMs), "sentAt is a valid ISO timestamp");
  assert.ok(sentMs >= before && sentMs <= after, "sentAt is the real send instant (now)");
});

test("approveSend marks the ticket sent with a real sentAt + first-response time", async () => {
  const row = await firstUnsent(LUMEN);
  const result = await approveSend(row.ticket.id, REPLY);
  assert.ok("ticket" in result, "ticket" in result ? "" : (result as { error: string }).error);
  assert.equal(result.ticket.status, "sent");
  assert.equal(result.alreadySent, false);
  assert.ok(result.ticket.sent, "carries a sent record");
  const sentMs = new Date(result.ticket.sent!.sentAt).getTime();
  assert.ok(!Number.isNaN(sentMs), "sentAt is a real ISO timestamp");
  assert.ok(result.ticket.sent!.approvedBy.length > 0, "stamped with the operator name");
  assert.ok(
    typeof result.ticket.firstResponseSec === "number" && result.ticket.firstResponseSec >= 0,
    "first-response time is measured from the ticket's own timestamps",
  );
});

test("approveSend appends the customer's status link to the sent reply (PR-02)", async () => {
  const row = await firstUnsent(LUMEN);
  const repos = getRepositories();
  const order = await repos.orders.findById(row.ticket.orderId);
  assert.ok(order, "queue ticket has a resolved order");
  const result = await approveSend(row.ticket.id, REPLY);
  assert.ok("ticket" in result);
  const text = result.ticket.sent!.text;
  assert.match(text, /Track your order anytime:/, "carries the status-link line");
  assert.ok(text.includes(`/status/${order!.statusToken}`), "links the order's own status token");
  // Proof-only: the appended line carries no hard date.
  assert.doesNotMatch(text, /\b\d{4}-\d{2}-\d{2}\b/, "no hard date in the appended line");
});

test("approveSend rejects a second concurrent approve — no double-send (EN-09)", async () => {
  const row = await firstUnsent(LUMEN);
  const id = row.ticket.id;
  const repos = getRepositories();
  const replyCount = async () =>
    (await repos.outcomeEvents.listByMerchant(LUMEN)).filter(
      (e) => e.kind === "reply_sent" && e.ticketId === id,
    ).length;
  const before = await replyCount();

  // Two approvals race the same ticket (double-click / two tabs).
  const [a, b] = await Promise.all([approveSend(id, REPLY), approveSend(id, REPLY)]);
  assert.ok("ticket" in a && "ticket" in b, "both calls resolve without error");

  const results = [a, b] as Array<{ alreadySent: boolean; ticket: { status: string } }>;
  const winners = results.filter((r) => r.alreadySent === false);
  const rejected = results.filter((r) => r.alreadySent === true);
  assert.equal(winners.length, 1, "exactly one call performed the send");
  assert.equal(rejected.length, 1, "the second concurrent approve was rejected as already-sent");
  assert.ok(results.every((r) => r.ticket.status === "sent"));

  // The guard's core guarantee: the race records exactly ONE new reply_sent (the
  // winner), never two — the rejected approve records nothing.
  const after = await replyCount();
  assert.equal(after - before, 1, "the concurrent race adds exactly one reply_sent event");
});

test("approveSend is idempotent — a re-send after delivery reports already-sent", async () => {
  const row = await firstUnsent(LUMEN);
  const id = row.ticket.id;
  const first = await approveSend(id, REPLY);
  assert.ok("ticket" in first && first.alreadySent === false, "first send delivers");
  const second = await approveSend(id, REPLY);
  assert.ok("ticket" in second, "second call resolves");
  assert.equal(second.alreadySent, true, "a re-send is a no-op that reports already-sent");
  assert.equal(second.ticket.status, "sent");
});
