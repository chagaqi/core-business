import assert from "node:assert/strict";
import { test } from "node:test";
import { sweepResolvedQuiet, RESOLVED_QUIET_WINDOW_MS } from "@/lib/outcome-sweep";
import type { OutcomeEvent, OutcomeEventKind } from "@/lib/types";

const NOW = new Date("2026-07-20T00:00:00.000Z");
const daysBefore = (n: number): string =>
  new Date(NOW.getTime() - n * 86400000).toISOString();

let _seq = 0;
function event(over: Partial<OutcomeEvent> & { kind: OutcomeEventKind }): OutcomeEvent {
  _seq += 1;
  return {
    id: `oe_${_seq}`,
    merchantId: "mch_1",
    ticketId: "tkt_1",
    orderId: "ord_1",
    customerId: "cus_1",
    variantId: "var_a",
    stageKey: "day-30",
    sentimentAtSend: "anxious",
    observedAt: daysBefore(10),
    ...over,
  };
}

test("emits a resolved_quiet for a reply past the 7-day window with no comeback", () => {
  const events = [event({ kind: "reply_sent", observedAt: daysBefore(10) })];
  const out = sweepResolvedQuiet(events, NOW);
  assert.equal(out.length, 1);
  assert.equal(out[0].kind, "resolved_quiet");
  assert.equal(out[0].observedAt, NOW.toISOString());
});

test("does NOT emit when a customer_replied followed the send", () => {
  const events = [
    event({ kind: "reply_sent", observedAt: daysBefore(10) }),
    event({ kind: "customer_replied", observedAt: daysBefore(8), meta: { respondedSentiment: "calm" } }),
  ];
  assert.deepEqual(sweepResolvedQuiet(events, NOW), []);
});

test("does NOT emit when a reopened followed the send", () => {
  const events = [
    event({ kind: "reply_sent", observedAt: daysBefore(10) }),
    event({ kind: "reopened", observedAt: daysBefore(9) }),
  ];
  assert.deepEqual(sweepResolvedQuiet(events, NOW), []);
});

test("a comeback BEFORE the send does not block a later quiet send", () => {
  // An inbound that predates the send is not a comeback to it.
  const events = [
    event({ kind: "customer_replied", observedAt: daysBefore(20), meta: { respondedSentiment: "anxious" } }),
    event({ kind: "reply_sent", observedAt: daysBefore(10) }),
  ];
  const out = sweepResolvedQuiet(events, NOW);
  assert.equal(out.length, 1);
  assert.equal(out[0].kind, "resolved_quiet");
});

test("does NOT emit for a reply still inside the window", () => {
  const events = [event({ kind: "reply_sent", observedAt: daysBefore(3) })];
  assert.deepEqual(sweepResolvedQuiet(events, NOW), []);
});

test("window boundary is exclusive: exactly 7 days old does not yet settle", () => {
  const exactly7 = new Date(NOW.getTime() - RESOLVED_QUIET_WINDOW_MS).toISOString();
  const events = [event({ kind: "reply_sent", observedAt: exactly7 })];
  assert.deepEqual(sweepResolvedQuiet(events, NOW), []);
});

test("does NOT double-emit when a resolved_quiet already exists for that order+variant", () => {
  const events = [
    event({ kind: "reply_sent", observedAt: daysBefore(10) }),
    event({ kind: "resolved_quiet", observedAt: daysBefore(3) }),
  ];
  assert.deepEqual(sweepResolvedQuiet(events, NOW), []);
});

test("re-running the sweep on its own output is idempotent (emits 0 the second pass)", () => {
  const events = [event({ kind: "reply_sent", observedAt: daysBefore(10) })];
  const first = sweepResolvedQuiet(events, NOW);
  assert.equal(first.length, 1);
  // Feed the emitted event back in (as the route would after recording it).
  const settled: OutcomeEvent[] = [...events, { ...first[0], id: "oe_new" }];
  assert.deepEqual(sweepResolvedQuiet(settled, NOW), []);
});

test("two quiet sends of the SAME variant on one order settle it once, not twice", () => {
  const events = [
    event({ kind: "reply_sent", observedAt: daysBefore(12), variantId: "var_a" }),
    event({ kind: "reply_sent", observedAt: daysBefore(10), variantId: "var_a" }),
  ];
  const out = sweepResolvedQuiet(events, NOW);
  assert.equal(out.length, 1);
  assert.equal(out[0].variantId, "var_a");
});

test("attributes the resolved_quiet to the right variant / stage / order", () => {
  const events = [
    event({
      kind: "reply_sent",
      observedAt: daysBefore(10),
      orderId: "ord_9",
      variantId: "var_z",
      stageKey: "day-89",
      ticketId: "tkt_9",
      customerId: "cus_9",
      sentimentAtSend: "chargeback-threat",
    }),
  ];
  const out = sweepResolvedQuiet(events, NOW);
  assert.equal(out.length, 1);
  const q = out[0];
  assert.equal(q.orderId, "ord_9");
  assert.equal(q.variantId, "var_z");
  assert.equal(q.stageKey, "day-89");
  assert.equal(q.ticketId, "tkt_9");
  assert.equal(q.customerId, "cus_9");
  assert.equal(q.sentimentAtSend, "chargeback-threat");
  assert.equal(q.merchantId, "mch_1");
});

test("distinct quiet variants on one order each settle (attributed independently)", () => {
  const events = [
    event({ kind: "reply_sent", observedAt: daysBefore(12), variantId: "var_a", orderId: "ord_1" }),
    event({ kind: "reply_sent", observedAt: daysBefore(11), variantId: "var_b", orderId: "ord_1" }),
  ];
  const out = sweepResolvedQuiet(events, NOW);
  assert.equal(out.length, 2);
  assert.deepEqual(
    out.map((e) => e.variantId).sort(),
    ["var_a", "var_b"],
  );
});

test("a prior settle for one variant does NOT suppress a different variant on the same order (cross-run)", () => {
  // Simulates two daily sweeps: var_a settled on an earlier run (its resolved_quiet
  // is now persisted in `events`), var_b matures on this run. var_a's settle must
  // not count as a comeback against var_b — each variant settles independently.
  const events = [
    event({ kind: "reply_sent", observedAt: daysBefore(12), variantId: "var_a", orderId: "ord_1" }),
    event({ kind: "resolved_quiet", observedAt: daysBefore(4), variantId: "var_a", orderId: "ord_1" }),
    event({ kind: "reply_sent", observedAt: daysBefore(11), variantId: "var_b", orderId: "ord_1" }),
  ];
  const out = sweepResolvedQuiet(events, NOW);
  assert.equal(out.length, 1); // only var_b (var_a already settled last run)
  assert.equal(out[0].variantId, "var_b");
});
