import assert from "node:assert/strict";
import { test } from "node:test";
import { buildMerchantFromIntake, buildStagePreviews, type IntakeData } from "@/lib/onboarding";

/**
 * The extracted pure builders (SWAN SPRINT P2) — the pre-create preview path
 * must construct exactly what the real create constructs, with no repository
 * reads. These run with no datastore configured on purpose: a builder that
 * grows a DB dependency fails here first.
 */

const INTAKE: IntakeData = {
  brandName: "Ledger & Loom",
  voice: "Plainspoken workshop updates from the maker",
  tone: ["Warm", "Calm", "Straightforward"],
  banned: ["asap"],
  signoff: "— Quinn at Ledger & Loom",
  helpdesk: "email",
  preorderApp: "",
  windowMinDays: 90,
  windowMaxDays: 120,
  stages: [],
  gifts: [],
  importRows: [],
};

test("buildMerchantFromIntake constructs the full merchant + gift ladder without persisting", () => {
  const { merchant, gifts } = buildMerchantFromIntake(INTAKE, null);
  assert.equal(merchant.name, "Ledger & Loom");
  assert.equal(merchant.slug, "ledger-loom");
  assert.equal(merchant.isDemo, false);
  assert.equal(merchant.ownerSub, null);
  assert.equal(merchant.brand.signoff, "— Quinn at Ledger & Loom");
  assert.equal(merchant.fulfillmentWindowDays.min, 90);
  assert.ok(merchant.stages.length > 0, "empty intake stages fall back to defaults");
  assert.ok(gifts.length >= 3, "gift ladder is ensured even from an empty catalog");
  assert.ok(gifts.some((g) => g.tier === "base"), "base-tier gesture always present");
  assert.deepEqual(
    merchant.giftCatalogIds,
    gifts.map((g) => g.id),
    "merchant links its catalog before persistence",
  );
});

test("buildStagePreviews drafts real engine output for every day-stage, purely", () => {
  const { merchant } = buildMerchantFromIntake(INTAKE, null);
  const previews = buildStagePreviews(merchant, new Date("2026-07-25T12:00:00.000Z"));
  assert.equal(previews.length, 4);
  for (const p of previews) {
    assert.ok(p.text.length > 40, `${p.stageKey} preview has substance`);
    assert.ok(p.text.includes("Quinn"), `${p.stageKey} preview carries the merchant sign-off voice`);
    assert.ok(!/\basap\b/i.test(p.text), `${p.stageKey} preview respects the banned list`);
  }
});
