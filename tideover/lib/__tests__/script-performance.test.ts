import assert from "node:assert/strict";
import { test } from "node:test";
import {
  aggregateScriptPerformance,
  computeScriptPerformance,
  SCRIPT_PERF_MIN_N,
} from "@/lib/service";
import type { OutcomeEvent, OutcomeEventKind, ScriptVariant } from "@/lib/types";

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
