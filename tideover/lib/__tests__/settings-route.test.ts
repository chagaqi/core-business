import assert from "node:assert/strict";
import { test } from "node:test";
import { createMerchantFromIntake, type IntakeData } from "@/lib/onboarding";
import { jsonRepositories } from "@/lib/repositories/json/repositories";
import { mongoRepositories } from "@/lib/repositories/mongo/repositories";
import { activeCatalog } from "@/lib/gift-catalog";
import { __setTenantSessionResolverForTests, type TenantSession } from "@/lib/tenant";
import { handleSettingsPATCH } from "@/lib/settings-route";
import type { Gift } from "@/lib/types";

/**
 * PATCH /api/settings — the self-serve surface for everything the onboarding
 * wizard wrote. Round-trips run on the JSON driver through the REAL handler;
 * the Mongo driver implements the identical repository interface (including
 * the new gifts.update) so the route core is driver-agnostic by construction,
 * and a shape test below pins that symmetry.
 */

const rand = () => Math.random().toString(36).slice(2);

function intake(over: Partial<IntakeData> = {}): IntakeData {
  return {
    brandName: `Settings Co ${rand()}`,
    voice: "warm and direct",
    tone: ["Warm"],
    banned: ["cheap"],
    signoff: "— the team",
    helpdesk: "mock",
    preorderApp: "",
    windowMinDays: 90,
    windowMaxDays: 120,
    stages: [],
    ...over,
  };
}

function asSession(session: TenantSession | null): void {
  __setTenantSessionResolverForTests(session ? async () => session : async () => null);
}

function resetSession(): void {
  __setTenantSessionResolverForTests(null);
}

function patch(body: unknown): Request {
  return new Request("http://test.local/api/settings", {
    method: "PATCH",
    headers: { "content-type": "application/json" },
    body: JSON.stringify(body),
  });
}

const giftPayload = (g: Gift) => ({
  id: g.id,
  name: g.name,
  kind: g.kind,
  tier: g.tier,
  costCents: g.costCents,
  perceivedValueCents: g.perceivedValueCents,
});

async function activeGiftsOf(merchantId: string): Promise<Gift[]> {
  const m = (await jsonRepositories.merchants.findById(merchantId))!;
  return activeCatalog(m, await jsonRepositories.gifts.listByMerchant(merchantId));
}

test("owner round-trip: signoff + window + gift add/edit/retire all persist", async () => {
  const ownerSub = `auth0|owner-${rand()}`;
  const { merchant } = await createMerchantFromIntake(intake(), { ownerSub });

  try {
    asSession({ sub: ownerSub, email: `o-${rand()}@example.com`, emailVerified: true });

    // ── brand: new signoff + banned words ────────────────────────────────
    const brandRes = await handleSettingsPATCH(
      patch({
        section: "brand",
        signoff: "— Dana, founder",
        voice: "calm and specific",
        tone: ["Warm", "Concise"],
        banned: ["unfortunately", "ASAP"],
      }),
    );
    assert.equal(brandRes.status, 200);

    // ── window: widen to 100–140 ─────────────────────────────────────────
    const windowRes = await handleSettingsPATCH(
      patch({ section: "window", windowMinDays: 100, windowMaxDays: 140 }),
    );
    assert.equal(windowRes.status, 200);

    // ── gifts: keep 3 (edit one), retire 2, add 1 new ────────────────────
    const before = await activeGiftsOf(merchant.id);
    assert.equal(before.length, 5, "default catalog arrives with 5 gifts");
    const keepBase = before.find((g) => g.tier === "base")!;
    const keepOthers = before.filter((g) => g.id !== keepBase.id).slice(0, 2);
    const retired = before.filter(
      (g) => g.id !== keepBase.id && !keepOthers.some((k) => k.id === g.id),
    );
    assert.equal(retired.length, 2);

    const giftsRes = await handleSettingsPATCH(
      patch({
        section: "gifts",
        gifts: [
          { ...giftPayload(keepBase), name: "Signed art print" }, // edit in place
          { ...giftPayload(keepOthers[0]), tier: "full" }, // tier change refreshes eligibility
          giftPayload(keepOthers[1]),
          {
            name: "Handwritten thank-you card",
            kind: "founder-note",
            tier: "base",
            costCents: 300,
            perceivedValueCents: 2000,
          },
        ],
      }),
    );
    assert.equal(giftsRes.status, 200);
    const view = (await giftsRes.json()) as {
      gifts: Array<{ id: string; name: string }>;
      brand: { signoff: string };
    };
    assert.equal(view.gifts.length, 4, "response carries the new active catalog");

    // ── read back the MERCHANT: all three sections landed ────────────────
    const stored = (await jsonRepositories.merchants.findById(merchant.id))!;
    assert.equal(stored.brand.signoff, "— Dana, founder");
    assert.deepEqual(stored.brand.banned, ["unfortunately", "ASAP"]);
    assert.deepEqual(stored.brand.tone, ["Warm", "Concise"]);
    assert.deepEqual(stored.fulfillmentWindowDays, { min: 100, max: 140 });
    assert.equal(stored.giftCatalogIds.length, 4);
    for (const r of retired) {
      assert.ok(!stored.giftCatalogIds.includes(r.id), "retired gift left the active catalog");
      const record = await jsonRepositories.gifts.findById(r.id);
      assert.ok(record, "retired gift RECORD is kept (history stays resolvable)");
    }

    const after = await activeGiftsOf(merchant.id);
    assert.equal(after.length, 4);
    const edited = after.find((g) => g.id === keepBase.id)!;
    assert.equal(edited.name, "Signed art print");
    const promoted = after.find((g) => g.id === keepOthers[0].id)!;
    assert.equal(promoted.tier, "full");
    assert.equal(
      promoted.eligibility.minRiskScore,
      75,
      "tier change refreshes the derived minRiskScore",
    );
    const added = after.find((g) => g.name === "Handwritten thank-you card")!;
    assert.ok(added.id.startsWith("gft"), "new gift got a minted id");
    assert.equal(added.merchantId, merchant.id);
  } finally {
    resetSession();
  }
});

test("stages: reword + re-band round-trips; fixed keys, inverted and overlapping bands reject", async () => {
  const ownerSub = `auth0|owner-${rand()}`;
  const { merchant } = await createMerchantFromIntake(intake(), { ownerSub });

  try {
    asSession({ sub: ownerSub, email: `o-${rand()}@example.com`, emailVerified: true });
    const rows = merchant.stages.map((s) => ({
      key: s.key,
      label: s.label,
      blurb: s.blurb,
      from: s.dayBand.from,
      to: s.dayBand.to,
    }));

    // Valid: reword one stage and shift every band.
    const edited = rows.map((r, i) => ({
      ...r,
      label: r.key === "production" ? "On the line" : r.label,
      blurb: r.key === "production" ? "your unit is moving down the line" : r.blurb,
      from: i * 20,
      to: i * 20 + 18,
    }));
    const ok = await handleSettingsPATCH(patch({ section: "stages", stages: edited }));
    assert.equal(ok.status, 200);
    const stored = (await jsonRepositories.merchants.findById(merchant.id))!;
    const production = stored.stages.find((s) => s.key === "production")!;
    assert.equal(production.label, "On the line");
    assert.deepEqual(stored.stages.map((s) => s.dayBand.from), [0, 20, 40, 60, 80, 100]);

    // Reordered keys reject.
    const swapped = [...edited];
    [swapped[0], swapped[1]] = [swapped[1], swapped[0]];
    assert.equal(
      (await handleSettingsPATCH(patch({ section: "stages", stages: swapped }))).status,
      400,
    );

    // from >= to rejects.
    const inverted = edited.map((r, i) => (i === 2 ? { ...r, from: 50, to: 45 } : r));
    assert.equal(
      (await handleSettingsPATCH(patch({ section: "stages", stages: inverted }))).status,
      400,
    );

    // Overlapping adjacent bands reject.
    const overlapping = edited.map((r, i) => (i === 1 ? { ...r, from: 10 } : r));
    assert.equal(
      (await handleSettingsPATCH(patch({ section: "stages", stages: overlapping }))).status,
      400,
    );

    // None of the rejects mutated the store.
    const still = (await jsonRepositories.merchants.findById(merchant.id))!;
    assert.deepEqual(still.stages, stored.stages);
  } finally {
    resetSession();
  }
});

test("window validation: min > max and non-integer days reject without writing", async () => {
  const ownerSub = `auth0|owner-${rand()}`;
  const { merchant } = await createMerchantFromIntake(intake(), { ownerSub });

  try {
    asSession({ sub: ownerSub, email: `o-${rand()}@example.com`, emailVerified: true });
    const inverted = await handleSettingsPATCH(
      patch({ section: "window", windowMinDays: 120, windowMaxDays: 90 }),
    );
    assert.equal(inverted.status, 400);
    const body = (await inverted.json()) as { error: string };
    assert.match(body.error, /at least/i, "rejection says why");

    assert.equal(
      (await handleSettingsPATCH(patch({ section: "window", windowMinDays: 10.5, windowMaxDays: 90 })))
        .status,
      400,
    );
    assert.equal(
      (await handleSettingsPATCH(patch({ section: "window", windowMinDays: 0, windowMaxDays: 90 })))
        .status,
      400,
    );

    const stored = (await jsonRepositories.merchants.findById(merchant.id))!;
    assert.deepEqual(stored.fulfillmentWindowDays, { min: 90, max: 120 }, "nothing written");
  } finally {
    resetSession();
  }
});

test("gift validation: <3 gifts, no base gift, foreign gift id, duplicate id all reject", async () => {
  const ownerA = `auth0|ownerA-${rand()}`;
  const ownerB = `auth0|ownerB-${rand()}`;
  const { merchant: a } = await createMerchantFromIntake(intake(), { ownerSub: ownerA });
  const { merchant: b } = await createMerchantFromIntake(intake(), { ownerSub: ownerB });

  try {
    asSession({ sub: ownerA, email: `a-${rand()}@example.com`, emailVerified: true });
    const mine = await activeGiftsOf(a.id);
    const foreign = (await activeGiftsOf(b.id))[0];

    // Fewer than 3 active gifts.
    const two = await handleSettingsPATCH(
      patch({ section: "gifts", gifts: mine.slice(0, 2).map(giftPayload) }),
    );
    assert.equal(two.status, 400);
    assert.match(((await two.json()) as { error: string }).error, /at least 3/i);

    // No base gift.
    const noBase = mine.slice(0, 3).map((g) => ({ ...giftPayload(g), tier: "mid" as const }));
    const baseless = await handleSettingsPATCH(patch({ section: "gifts", gifts: noBase }));
    assert.equal(baseless.status, 400);
    assert.match(((await baseless.json()) as { error: string }).error, /base/i);

    // A foreign merchant's gift id is unknown here — scoped by construction.
    const withForeign = [...mine.slice(0, 2).map(giftPayload), giftPayload(foreign)];
    const smuggled = await handleSettingsPATCH(patch({ section: "gifts", gifts: withForeign }));
    assert.equal(smuggled.status, 400);
    const foreignAfter = (await jsonRepositories.gifts.findById(foreign.id))!;
    assert.equal(foreignAfter.name, foreign.name, "foreign gift untouched");

    // The same gift twice.
    const doubled = [giftPayload(mine[0]), giftPayload(mine[0]), giftPayload(mine[1])];
    assert.equal(
      (await handleSettingsPATCH(patch({ section: "gifts", gifts: doubled }))).status,
      400,
    );

    // None of the rejects changed the catalog.
    const stillA = (await jsonRepositories.merchants.findById(a.id))!;
    assert.deepEqual([...stillA.giftCatalogIds].sort(), mine.map((g) => g.id).sort());
  } finally {
    resetSession();
  }
});

test("authz: member write 403, no session 401, no workspace 404, demo 403 — and nothing mutates", async () => {
  const ownerSub = `auth0|owner-${rand()}`;
  const memberSub = `auth0|member-${rand()}`;
  const { merchant } = await createMerchantFromIntake(intake(), { ownerSub });
  await jsonRepositories.merchants.update(merchant.id, { memberSubs: [memberSub] });
  const brandBody = {
    section: "brand",
    signoff: "— intruder",
    voice: "",
    tone: [],
    banned: [],
  };

  // The seeded demo merchant's banned words are eval inputs — pin them now and
  // verify NOTHING in this test (or any session) can blank them.
  const demo = (await jsonRepositories.merchants.list()).find((m) => m.isDemo);
  const demoBannedBefore = demo ? [...demo.brand.banned] : null;

  try {
    // A MEMBER may read the page but never write settings.
    asSession({ sub: memberSub, email: `m-${rand()}@example.com`, emailVerified: true });
    const asMember = await handleSettingsPATCH(patch(brandBody));
    assert.equal(asMember.status, 403);

    // No session at all → 401.
    asSession(null);
    assert.equal((await handleSettingsPATCH(patch(brandBody))).status, 401);

    // A logged-in user with no workspace → 404.
    asSession({ sub: `auth0|nobody-${rand()}`, email: "n@b.co", emailVerified: true });
    assert.equal((await handleSettingsPATCH(patch(brandBody))).status, 404);

    // Demo guard (defense in depth): even a merchant that somehow carries BOTH
    // an owner and isDemo is refused — sample settings are read-only.
    const demoOwner = `auth0|demo-owner-${rand()}`;
    const { merchant: pseudoDemo } = await createMerchantFromIntake(intake(), {
      ownerSub: demoOwner,
    });
    await jsonRepositories.merchants.update(pseudoDemo.id, { isDemo: true });
    asSession({ sub: demoOwner, email: `d-${rand()}@example.com`, emailVerified: true });
    const asDemo = await handleSettingsPATCH(patch(brandBody));
    assert.equal(asDemo.status, 403);
    assert.match(((await asDemo.json()) as { error: string }).error, /read-only/i);

    // Nothing mutated by any of the above.
    const stored = (await jsonRepositories.merchants.findById(merchant.id))!;
    assert.equal(stored.brand.signoff, "— the team");
    if (demo && demoBannedBefore) {
      const demoAfter = (await jsonRepositories.merchants.findById(demo.id))!;
      assert.deepEqual(
        demoAfter.brand.banned,
        demoBannedBefore,
        "the demo merchant's banned-word defaults are untouched",
      );
    }
  } finally {
    resetSession();
  }
});

test("driver symmetry: both drivers expose the identical GiftRepository surface (incl. update)", () => {
  const jsonKeys = Object.keys(jsonRepositories.gifts).sort();
  const mongoKeys = Object.keys(mongoRepositories.gifts).sort();
  assert.deepEqual(mongoKeys, jsonKeys);
  assert.equal(typeof mongoRepositories.gifts.update, "function");
});
