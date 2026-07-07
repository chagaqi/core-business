import assert from "node:assert/strict";
import { test } from "node:test";
import { createMerchantFromIntake, type GiftInput, type IntakeData } from "@/lib/onboarding";
import { OnboardingBodySchema } from "@/lib/onboarding-schema";
import { getRepositories } from "@/lib/repositories";
import { jsonRepositories } from "@/lib/repositories/json/repositories";
import { newId } from "@/lib/ids";
import type { Gift } from "@/lib/types";

/**
 * UX-86 onboarding gift path — the repo write seam (gifts.createMany), the
 * createMerchantFromIntake write path (real merchants now ship with a catalog),
 * and the server-side gate (>=3 gifts AND >=1 base).
 */

const rand = () => Math.random().toString(36).slice(2);

function gift(merchantId: string, tier: Gift["tier"], kind: Gift["kind"]): Gift {
  return {
    id: newId("gft"),
    merchantId,
    name: `${kind} (${tier})`,
    kind,
    tier,
    costCents: 500,
    perceivedValueCents: 3000,
    eligibility: { minLtvCents: 0, minWaitDays: 0, minRiskScore: 0 },
  };
}

/** A minimal, valid intake (matches the import-test shape) with an optional gift catalog. */
function intake(over: Partial<IntakeData> = {}): IntakeData {
  return {
    brandName: `Gift Co ${rand()}`,
    voice: "warm and direct",
    tone: ["Warm"],
    banned: [],
    signoff: "— the team",
    helpdesk: "mock",
    preorderApp: "",
    windowMinDays: 90,
    windowMaxDays: 120,
    stages: [],
    ...over,
  };
}

test("gifts.createMany (json driver) inserts the whole catalog and lists it back", async () => {
  const merchantId = `mch_test_${rand()}`;
  const catalog = [
    gift(merchantId, "base", "digital-perk"),
    gift(merchantId, "mid", "founder-note"),
    gift(merchantId, "full", "next-order-credit"),
  ];

  const returned = await jsonRepositories.gifts.createMany(catalog);
  assert.equal(returned.length, 3, "returns the inserted gifts in order");
  assert.equal(returned[0].id, catalog[0].id);

  const listed = await jsonRepositories.gifts.listByMerchant(merchantId);
  assert.equal(listed.length, 3);
  assert.deepEqual([...listed.map((g) => g.tier)].sort(), ["base", "full", "mid"]);

  const one = await jsonRepositories.gifts.findById(catalog[1].id);
  assert.equal(one?.id, catalog[1].id);

  // empty input is a no-op (mirrors the mongo driver, which can't insertMany []).
  const none = await jsonRepositories.gifts.createMany([]);
  assert.equal(none.length, 0);
  assert.equal((await jsonRepositories.gifts.listByMerchant(merchantId)).length, 3);
});

test("createMany inserts copies — mutating a returned gift does not corrupt the store", async () => {
  const merchantId = `mch_test_${rand()}`;
  const g = gift(merchantId, "base", "digital-perk");
  const [returned] = await jsonRepositories.gifts.createMany([g]);
  returned.name = "MUTATED";
  const [stored] = await jsonRepositories.gifts.listByMerchant(merchantId);
  assert.notEqual(stored.name, "MUTATED");
});

test("createMerchantFromIntake persists the intake catalog with tier-derived eligibility + links", async () => {
  const gifts: GiftInput[] = [
    { name: "Perk pack", kind: "digital-perk", tier: "base", costCents: 0, perceivedValueCents: 2000 },
    { name: "Founder note", kind: "founder-note", tier: "mid", costCents: 500, perceivedValueCents: 3000 },
    { name: "$25 credit", kind: "next-order-credit", tier: "full", costCents: 2500, perceivedValueCents: 2500 },
  ];
  const { merchant } = await createMerchantFromIntake(intake({ gifts }));
  const repos = getRepositories();

  const catalog = await repos.gifts.listByMerchant(merchant.id);
  assert.equal(catalog.length, 3, "N gift records persisted");
  assert.equal(merchant.giftCatalogIds.length, 3);
  assert.deepEqual([...merchant.giftCatalogIds].sort(), catalog.map((g) => g.id).sort());
  assert.ok(catalog.every((g) => g.id.startsWith("gft_") && g.merchantId === merchant.id));

  const byTier = Object.fromEntries(catalog.map((g) => [g.tier, g]));
  assert.equal(byTier.base.eligibility.minRiskScore, 0, "base → 0");
  assert.equal(byTier.mid.eligibility.minRiskScore, 50, "mid → 50");
  assert.equal(byTier.full.eligibility.minRiskScore, 75, "full → 75");

  // the STORED merchant (not just the returned object) carries the link.
  const stored = await repos.merchants.findById(merchant.id);
  assert.deepEqual(stored?.giftCatalogIds, merchant.giftCatalogIds);
});

test("createMerchantFromIntake falls back to the suggested catalog when gifts are omitted", async () => {
  const { merchant } = await createMerchantFromIntake(intake()); // no gifts field
  const repos = getRepositories();
  const catalog = await repos.gifts.listByMerchant(merchant.id);
  assert.equal(catalog.length, 5, "the 5 suggested gifts");
  assert.equal(merchant.giftCatalogIds.length, 5);
  assert.ok(catalog.some((g) => g.tier === "base"), "default catalog carries a base gift");
});

test("createMerchantFromIntake treats an empty gift array like an omitted one (fallback)", async () => {
  const { merchant } = await createMerchantFromIntake(intake({ gifts: [] }));
  const repos = getRepositories();
  assert.equal((await repos.gifts.listByMerchant(merchant.id)).length, 5);
});

// ── server-side gate (zod) ───────────────────────────────────────────────────

const okGifts = [
  { name: "Perk pack", kind: "digital-perk", tier: "base", costCents: 0, perceivedValueCents: 2000 },
  { name: "Founder note", kind: "founder-note", tier: "mid", costCents: 500, perceivedValueCents: 3000 },
  { name: "$25 credit", kind: "next-order-credit", tier: "full", costCents: 2500, perceivedValueCents: 2500 },
];

test("onboarding zod rejects a catalog with fewer than 3 gifts", () => {
  const r = OnboardingBodySchema.safeParse({ brandName: "X", gifts: okGifts.slice(0, 2) });
  assert.equal(r.success, false);
});

test("onboarding zod rejects a base-less catalog", () => {
  const baseLess = [
    { name: "Founder note", kind: "founder-note", tier: "mid", costCents: 500, perceivedValueCents: 3000 },
    { name: "Priority dispatch", kind: "priority-dispatch", tier: "mid", costCents: 1200, perceivedValueCents: 6000 },
    { name: "$25 credit", kind: "next-order-credit", tier: "full", costCents: 2500, perceivedValueCents: 2500 },
  ];
  const r = OnboardingBodySchema.safeParse({ brandName: "X", gifts: baseLess });
  assert.equal(r.success, false);
});

test("onboarding zod rejects a gift cost above the $500 cap", () => {
  const overCap = [{ ...okGifts[0], costCents: 60000 }, okGifts[1], okGifts[2]];
  const r = OnboardingBodySchema.safeParse({ brandName: "X", gifts: overCap });
  assert.equal(r.success, false);
});

test("onboarding zod accepts a valid catalog, and an omitted catalog (tolerant → [])", () => {
  const valid = OnboardingBodySchema.safeParse({ brandName: "X", gifts: okGifts });
  assert.equal(valid.success, true);

  const omitted = OnboardingBodySchema.safeParse({ brandName: "X" });
  assert.equal(omitted.success, true);
  assert.deepEqual(omitted.success ? omitted.data.gifts : null, [], "omitted → [] (fallback happens downstream)");
});
