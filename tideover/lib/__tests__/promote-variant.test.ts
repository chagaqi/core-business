import assert from "node:assert/strict";
import { test } from "node:test";
import {
  computeScriptPerformance,
  getQueue,
  PROMOTE_THRESHOLD,
  promoteVariant,
} from "@/lib/service";
import type { ScriptVariant } from "@/lib/types";

const LUMEN = "mch_lumen0001";

test("PROMOTE_THRESHOLD is 0.30 (ADR-0014)", () => {
  assert.equal(PROMOTE_THRESHOLD, 0.3);
});

test("promoteVariant creates an operator-promoted variant inheriting the parent's slot", async () => {
  const queue = await getQueue(LUMEN);
  assert.ok(queue.length > 0, "seeded Lumen has an open queue");
  const ticketId = queue[0].ticket.id;

  const before = await computeScriptPerformance(LUMEN);
  const text =
    "Hey there — a wholly operator-rewritten reassurance reply. Your order is on schedule and in production; I'll ping you the moment it moves to the next stage.";
  const result = await promoteVariant(ticketId, text);
  assert.ok("variant" in result, "variant" in result ? "" : (result as { error: string }).error);
  const v: ScriptVariant = result.variant;

  // real provenance, not a fabricated default
  assert.equal(v.source, "operator-promoted");
  assert.equal(v.isDefault, false);
  assert.equal(v.status, "active");
  assert.equal(v.text, text);
  assert.ok(v.parentVariantId, "carries a parent variant id");

  // inherits the parent variant's slot (stageKey + productionStage)
  const parent = before.find((r) => r.variant.id === v.parentVariantId);
  assert.ok(parent, "parent is one of the merchant's existing variants");
  assert.equal(v.stageKey, parent!.variant.stageKey);
  assert.equal(v.productionStage, parent!.variant.productionStage);

  // it now competes in the Script Performance panel
  const after = await computeScriptPerformance(LUMEN);
  assert.equal(after.length, before.length + 1);
  assert.ok(after.some((r) => r.variant.id === v.id));
});

test("promoteVariant rejects a hard delivery date (proof-only)", async () => {
  const queue = await getQueue(LUMEN);
  const result = await promoteVariant(queue[0].ticket.id, "Your order ships on 2026-07-14.");
  assert.ok("error" in result);
});

test("promoteVariant rejects blank text", async () => {
  const queue = await getQueue(LUMEN);
  const result = await promoteVariant(queue[0].ticket.id, "   ");
  assert.ok("error" in result);
});

test("promoteVariant errors on an unknown ticket (no parent to promote from)", async () => {
  const result = await promoteVariant("tkt_does_not_exist", "A perfectly valid reply body.");
  assert.ok("error" in result);
});
