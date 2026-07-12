import assert from "node:assert/strict";
import { test } from "node:test";
import {
  DEFLECTION_MIN_N,
  DEFLECTION_WINDOW_DAYS,
  deflectionGap,
  measureDeflection,
} from "@/lib/deflection";

/**
 * The metric that read 100% for all ten merchants, was labelled "Deflection", and
 * was actually `resolved / tickets` — the share of tickets that got a reply.
 *
 * These pin the replacement: deflection is a status-page view that was followed by
 * silence from that order, it is never inferred, and it is NOT SHOWN AT ALL until
 * it has been measured over a real sample.
 */

const DAY = 86_400_000;
const NOW = new Date("2026-07-12T00:00:00.000Z");
const daysAgo = (d: number) => new Date(NOW.getTime() - d * DAY).toISOString();

const view = (orderId: string, d: number) => ({ orderId, viewedAt: daysAgo(d) });
const ticket = (orderId: string, d: number) => ({ orderId, createdAt: daysAgo(d) });

/** N judged views on distinct orders, none followed by a ticket. */
const quietViews = (n: number, startDay = 30) =>
  Array.from({ length: n }, (_, i) => view(`ord_${i}`, startDay - (i % 10)));

test("no views at all: not measured — never a fabricated 0%", () => {
  const m = measureDeflection([], [ticket("ord_1", 3)], NOW);
  assert.equal(m.state, "no-views");
  assert.equal(m.rate, null, "no rate is invented from an empty ledger");
  assert.equal(m.evaluatedViews, 0);
  assert.match(deflectionGap(m)!, /Nobody has opened a status page/);
  assert.match(deflectionGap(m)!, /status link reaches customers who have NOT written in/);
});

test("a view too recent to judge is never counted as a deflection", () => {
  // Viewed an hour ago. The ticket it may not have prevented has not had its window.
  const m = measureDeflection([view("ord_1", 0)], [], NOW);
  assert.equal(m.state, "too-recent");
  assert.equal(m.pendingViews, 1);
  assert.equal(m.evaluatedViews, 0, "it is excluded from the denominator, not counted as quiet");
  assert.equal(m.rate, null);
  assert.match(deflectionGap(m)!, /too recent to judge/);
});

test("a view followed by a ticket from that order, inside the window, is not deflected", () => {
  const m = measureDeflection(
    [view("ord_1", 20)],
    [ticket("ord_1", 16)], // wrote in 4 days after looking
    NOW,
  );
  assert.equal(m.evaluatedViews, 1);
  assert.equal(m.followedByTicket, 1);
  assert.equal(m.quietViews, 0);
});

test("a ticket that predates the view does not count against it", () => {
  // They complained, got the link in the reply, then looked. The page did not fail
  // to prevent a ticket that already existed.
  const m = measureDeflection([view("ord_1", 20)], [ticket("ord_1", 25)], NOW);
  assert.equal(m.quietViews, 1);
  assert.equal(m.followedByTicket, 0);
});

test("a ticket from a DIFFERENT order says nothing about this view", () => {
  const m = measureDeflection([view("ord_1", 20)], [ticket("ord_2", 18)], NOW);
  assert.equal(m.quietViews, 1, "another customer's ticket is not this customer's question");
});

test("a ticket outside the window does not count against the view", () => {
  const m = measureDeflection(
    [view("ord_1", 30)],
    [ticket("ord_1", 30 - DEFLECTION_WINDOW_DAYS - 1)], // 8 days after the view
    NOW,
  );
  assert.equal(m.quietViews, 1);
});

test("below the small-sample floor there are counts but no rate", () => {
  const m = measureDeflection(quietViews(DEFLECTION_MIN_N - 1), [], NOW);
  assert.equal(m.evaluatedViews, DEFLECTION_MIN_N - 1);
  assert.equal(m.quietViews, DEFLECTION_MIN_N - 1);
  assert.equal(m.state, "collecting");
  assert.equal(m.rate, null, "a rate over a tiny sample is not a measurement");
  assert.match(deflectionGap(m)!, /A rate needs 20 judged views/);
});

test("a real sample yields a real rate, and the gap sentence disappears", () => {
  const views = quietViews(DEFLECTION_MIN_N);
  // Four of the twenty wrote in anyway.
  const tickets = [0, 1, 2, 3].map((i) => ticket(`ord_${i}`, 30 - (i % 10) - 2));
  const m = measureDeflection(views, tickets, NOW);
  assert.equal(m.state, "measured");
  assert.equal(m.evaluatedViews, 20);
  assert.equal(m.followedByTicket, 4);
  assert.equal(m.quietViews, 16);
  assert.equal(m.rate, 0.8);
  assert.equal(deflectionGap(m), null, "a measured rate needs no excuse");
});

test("an order-less (unmatched) ticket cannot be blamed on any status page", () => {
  const m = measureDeflection([view("ord_1", 20)], [{ orderId: "", createdAt: daysAgo(19) }], NOW);
  assert.equal(m.quietViews, 1);
  assert.equal(m.followedByTicket, 0);
});

test("recent and judged views coexist: only the judged ones are in the denominator", () => {
  const m = measureDeflection([...quietViews(20), view("ord_new", 1)], [], NOW);
  assert.equal(m.evaluatedViews, 20);
  assert.equal(m.pendingViews, 1);
  assert.equal(m.rate, 1);
  assert.equal(m.viewedOrders, 21);
});
