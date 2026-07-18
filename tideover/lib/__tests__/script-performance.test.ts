import assert from "node:assert/strict";
import { test } from "node:test";
import {
  aggregateScriptPerformance,
  computeScriptPerformance,
  SCRIPT_PERF_MIN_N,
} from "@/lib/service";
import type { OutcomeEvent, OutcomeEventKind, ScriptVariant, Sentiment } from "@/lib/types";

function variant(over: Partial<ScriptVariant> & { id: string }): ScriptVariant {
  return {
    merchantId: "mch_t",
    stageKey: "day-7",
    productionStage: null,
    text: "hello {first_name}",
    source: "merchant-default",
    isDefault: true,
    status: "active",
    parentVariantId: null,
    createdAt: "2026-05-24T00:00:00.000Z",
    ...over,
  };
}

function event(
  variantId: string,
  editedRatio: number | undefined,
  kind: OutcomeEventKind = "reply_sent",
): OutcomeEvent {
  return {
    id: `oe_${variantId}_${Math.random().toString(36).slice(2)}`,
    merchantId: "mch_t",
    ticketId: "tkt_t",
    orderId: "ord_t",
    customerId: "cus_t",
    variantId,
    stageKey: "day-7",
    sentimentAtSend: "calm",
    kind,
    observedAt: "2026-06-25T00:00:00.000Z",
    ...(editedRatio === undefined ? {} : { meta: { editedRatio } }),
  };
}

/** a customer_replied event carrying the inbound's inferred sentiment (E2). */
function replied(variantId: string, respondedSentiment: Sentiment): OutcomeEvent {
  return { ...event(variantId, undefined, "customer_replied"), meta: { respondedSentiment } };
}
/** an event of an arbitrary kind with no meta (reopened / csat_up / csat_down). */
function kindEvent(variantId: string, kind: OutcomeEventKind): OutcomeEvent {
  return event(variantId, undefined, kind);
}
/** N copies of a factory result, so tests can cross the SCRIPT_PERF_MIN_N floor. */
function repeat<T>(n: number, make: (i: number) => T): T[] {
  return Array.from({ length: n }, (_, i) => make(i));
}

test("aggregateScriptPerformance counts reply_sent sends and averages editedRatio per variant", () => {
  const variants = [variant({ id: "var_a" }), variant({ id: "var_b" })];
  const events = [
    event("var_a", 0.2),
    event("var_a", 0.4),
    event("var_b", 0.1),
  ];
  const rows = aggregateScriptPerformance(variants, events);
  const a = rows.find((r) => r.variant.id === "var_a")!;
  const b = rows.find((r) => r.variant.id === "var_b")!;
  assert.equal(a.sends, 2);
  assert.equal(a.n, 2);
  assert.ok(Math.abs((a.avgEditedRatio ?? 0) - 0.3) < 1e-9);
  assert.equal(b.sends, 1);
  assert.equal(b.avgEditedRatio, 0.1);
});

test("aggregateScriptPerformance reports null avg (never 0) for a variant with no sends", () => {
  const rows = aggregateScriptPerformance([variant({ id: "var_z" })], []);
  assert.equal(rows[0].sends, 0);
  assert.equal(rows[0].n, 0);
  assert.equal(rows[0].avgEditedRatio, null);
});

test("aggregateScriptPerformance ignores non-reply_sent ledger events", () => {
  const events = [
    event("var_a", 0.5, "reply_sent"),
    event("var_a", 0.9, "customer_replied"),
    event("var_a", 0.9, "reopened"),
  ];
  const rows = aggregateScriptPerformance([variant({ id: "var_a" })], events);
  assert.equal(rows[0].sends, 1); // only the reply_sent counts
  assert.equal(rows[0].avgEditedRatio, 0.5);
});

test("aggregateScriptPerformance counts a missing-editedRatio send but excludes it from the mean", () => {
  const events = [event("var_a", 1), event("var_a", undefined)];
  const rows = aggregateScriptPerformance([variant({ id: "var_a" })], events);
  assert.equal(rows[0].sends, 2); // both sends counted
  assert.equal(rows[0].avgEditedRatio, 1); // mean over the one present ratio, not (1+0)/2
});

test("aggregateScriptPerformance reports null avg when sends exist but no editedRatio present", () => {
  const events = [event("var_a", undefined), event("var_a", undefined)];
  const rows = aggregateScriptPerformance([variant({ id: "var_a" })], events);
  assert.equal(rows[0].sends, 2);
  assert.equal(rows[0].avgEditedRatio, null); // no measured ratio → honest null, not 0
});

test("aggregateScriptPerformance preserves variant input order (never ranks by performance)", () => {
  const variants = [variant({ id: "var_1" }), variant({ id: "var_2" }), variant({ id: "var_3" })];
  const events = [event("var_2", 0.1), event("var_2", 0.1)]; // var_2 has the most sends
  const rows = aggregateScriptPerformance(variants, events);
  assert.deepEqual(
    rows.map((r) => r.variant.id),
    ["var_1", "var_2", "var_3"],
  );
});

test("computeScriptPerformance rolls up the Lumen seed with the expected send counts", async () => {
  const rows = await computeScriptPerformance("mch_lumen0001");
  const sendsById = new Map(rows.map((r) => [r.variant.id, r.sends]));
  // measured from lib/data/outcome-events.json
  assert.equal(sendsById.get("var_qqw70vxsp4oo"), 8); // day-89 base
  assert.equal(sendsById.get("var_y9209nd050qf"), 5); // day-30 base
  assert.equal(sendsById.get("var_ji82latd7jh5"), 3); // day-7 base
  assert.equal(sendsById.get("var_pjw57v28h0w1"), 0); // day-7 qc — no sends yet
  const total = rows.reduce((s, r) => s + r.sends, 0);
  assert.equal(total, 16); // 16 Lumen reply_sent events in the seed

  // small-sample humility: every seeded variant is below the proof threshold, so
  // the surface shows "collecting data (n=X)" and never a rate.
  assert.ok(rows.every((r) => r.n < SCRIPT_PERF_MIN_N));
});

// ── ADR-0012 (E2) customer-side outcome aggregations ────────────────────────

test("customer-side kinds never inflate sends / editedRatio (only reply_sent does)", () => {
  const events = [
    event("var_a", 0.5, "reply_sent"),
    replied("var_a", "calm"),
    kindEvent("var_a", "reopened"),
    kindEvent("var_a", "csat_up"),
    kindEvent("var_a", "csat_down"),
    kindEvent("var_a", "resolved_quiet"),
  ];
  const rows = aggregateScriptPerformance([variant({ id: "var_a" })], events);
  const a = rows[0];
  assert.equal(a.sends, 1); // only the reply_sent counts — resolved_quiet does not
  assert.equal(a.avgEditedRatio, 0.5);
  assert.equal(a.customerReplies, 1);
  assert.equal(a.reopens, 1);
  assert.equal(a.csatResponses, 2);
  assert.equal(a.resolvedQuiet, 1);
});

test("calm-response rate = calm / all customer_replied once the sample reaches the floor", () => {
  const events = [
    ...repeat(SCRIPT_PERF_MIN_N - 5, () => replied("var_a", "calm")), // 15 calm
    ...repeat(5, () => replied("var_a", "anxious")), // 5 not-calm → 20 total
  ];
  const a = aggregateScriptPerformance([variant({ id: "var_a" })], events)[0];
  assert.equal(a.customerReplies, SCRIPT_PERF_MIN_N); // 20
  assert.ok(Math.abs((a.calmResponseRate ?? 0) - 15 / 20) < 1e-9); // 0.75
});

test("calm-response rate is gated to null below the reply floor (small-N humility)", () => {
  const events = repeat(SCRIPT_PERF_MIN_N - 1, () => replied("var_a", "calm")); // 19, all calm
  const a = aggregateScriptPerformance([variant({ id: "var_a" })], events)[0];
  assert.equal(a.customerReplies, SCRIPT_PERF_MIN_N - 1); // 19 raw count still reported
  assert.equal(a.calmResponseRate, null); // ...but never a rate the sample can't support
});

test("reopen rate = reopened / sends once sends reach the floor, gated below it", () => {
  const withEnoughSends = [
    ...repeat(SCRIPT_PERF_MIN_N, () => event("var_a", 0.1, "reply_sent")), // 20 sends
    ...repeat(5, () => kindEvent("var_a", "reopened")), // 5 reopens
  ];
  const a = aggregateScriptPerformance([variant({ id: "var_a" })], withEnoughSends)[0];
  assert.equal(a.reopens, 5);
  assert.ok(Math.abs((a.reopenRate ?? 0) - 5 / 20) < 1e-9); // 0.25

  const tooFewSends = [
    ...repeat(SCRIPT_PERF_MIN_N - 1, () => event("var_b", 0.1, "reply_sent")), // 19 sends
    ...repeat(5, () => kindEvent("var_b", "reopened")),
  ];
  const b = aggregateScriptPerformance([variant({ id: "var_b" })], tooFewSends)[0];
  assert.equal(b.reopens, 5); // raw count present
  assert.equal(b.reopenRate, null); // rate gated by too-few sends
});

test("reopen rate is capped at 1 — never renders a nonsensical >100% (ADR-0012 fix)", () => {
  // Defense-in-depth: even if more reopened events than sends slipped through
  // (they shouldn't — reopens dedupe per reply at emit time), the panel caps at 100%.
  const events = [
    ...repeat(SCRIPT_PERF_MIN_N, () => event("var_a", 0.1, "reply_sent")), // 20 sends
    ...repeat(25, () => kindEvent("var_a", "reopened")), // 25 reopens > 20 sends
  ];
  const a = aggregateScriptPerformance([variant({ id: "var_a" })], events)[0];
  assert.equal(a.reopens, 25); // raw count is honest
  assert.equal(a.reopenRate, 1); // ...but the rate never exceeds 1
});

test("csat = up / (up + down) once the sample reaches the floor, gated below it", () => {
  const enough = [
    ...repeat(15, () => kindEvent("var_a", "csat_up")),
    ...repeat(5, () => kindEvent("var_a", "csat_down")), // 20 responses
  ];
  const a = aggregateScriptPerformance([variant({ id: "var_a" })], enough)[0];
  assert.equal(a.csatResponses, 20);
  assert.ok(Math.abs((a.csatRate ?? 0) - 15 / 20) < 1e-9); // 0.75

  const tooFew = [
    ...repeat(10, () => kindEvent("var_b", "csat_up")),
    ...repeat(9, () => kindEvent("var_b", "csat_down")), // 19 responses
  ];
  const b = aggregateScriptPerformance([variant({ id: "var_b" })], tooFew)[0];
  assert.equal(b.csatResponses, 19); // raw count present
  assert.equal(b.csatRate, null); // rate gated below the floor
});

test("a variant with no customer-side events reports zero counts and null rates", () => {
  const a = aggregateScriptPerformance([variant({ id: "var_a" })], [])[0];
  assert.equal(a.customerReplies, 0);
  assert.equal(a.calmResponseRate, null);
  assert.equal(a.reopens, 0);
  assert.equal(a.reopenRate, null);
  assert.equal(a.csatResponses, 0);
  assert.equal(a.csatRate, null);
  assert.equal(a.resolvedQuiet, 0);
  assert.equal(a.quietResolutionRate, null);
});

// ── ADR-0013 (F4) quiet-resolution aggregation ──────────────────────────────

test("quiet-resolution rate = resolved_quiet / sends once sends reach the floor, gated below it", () => {
  const enough = [
    ...repeat(SCRIPT_PERF_MIN_N, () => event("var_a", 0.1, "reply_sent")), // 20 sends
    ...repeat(6, () => kindEvent("var_a", "resolved_quiet")), // 6 settled quiet
  ];
  const a = aggregateScriptPerformance([variant({ id: "var_a" })], enough)[0];
  assert.equal(a.resolvedQuiet, 6);
  assert.ok(Math.abs((a.quietResolutionRate ?? 0) - 6 / 20) < 1e-9); // 0.30

  const tooFew = [
    ...repeat(SCRIPT_PERF_MIN_N - 1, () => event("var_b", 0.1, "reply_sent")), // 19 sends
    ...repeat(6, () => kindEvent("var_b", "resolved_quiet")),
  ];
  const b = aggregateScriptPerformance([variant({ id: "var_b" })], tooFew)[0];
  assert.equal(b.resolvedQuiet, 6); // raw count present
  assert.equal(b.quietResolutionRate, null); // rate gated by too-few sends (small-N humility)
});

test("quiet-resolution rate is capped at 1 — resolved_quiet <= sends by construction, but never renders >100%", () => {
  const events = [
    ...repeat(SCRIPT_PERF_MIN_N, () => event("var_a", 0.1, "reply_sent")), // 20 sends
    ...repeat(25, () => kindEvent("var_a", "resolved_quiet")), // impossible surplus, defended anyway
  ];
  const a = aggregateScriptPerformance([variant({ id: "var_a" })], events)[0];
  assert.equal(a.resolvedQuiet, 25); // raw count honest
  assert.equal(a.quietResolutionRate, 1); // ...but the rate never exceeds 1
});
