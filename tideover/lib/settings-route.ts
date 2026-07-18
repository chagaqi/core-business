import { z } from "zod";
import { newId } from "@/lib/ids";
import { getRepositories } from "@/lib/repositories";
import { getTenantSession } from "@/lib/tenant";
import { activeCatalog } from "@/lib/gift-catalog";
import { GiftInputSchema } from "@/lib/onboarding-schema";
import { TIER_MIN_RISK } from "@/lib/onboarding";
import type { Gift, Merchant, StageDef } from "@/lib/types";

/**
 * Injectable core for PATCH /api/settings — the self-serve editing surface for
 * everything the onboarding wizard wrote: brand voice (signoff/voice/tone/
 * banned words), the fulfillment wait window, production-stage labels + day
 * bands, and the goodwill gift catalog. Lives in lib/ (not the route file) so
 * the handler is unit-testable without the Next runtime, and uses the
 * Web-standard Response — same discipline as lib/team-route.ts.
 *
 * Authorization mirrors /api/team exactly:
 *   1. the merchant resolves from the SESSION sub only
 *      (findByMemberOrOwnerSub — no merchant id is accepted from the client,
 *      so a foreign workspace can't even be named; null → 404);
 *   2. writes require ownerSub === session sub — members get 403 (the UI
 *      renders read-only for them);
 *   3. demo/sample merchants are never writable. Structurally they can't even
 *      resolve here (no ownerSub/memberSubs), and the explicit isDemo guard is
 *      defense in depth: the demo merchant's banned words / stage bands are
 *      inputs the eval harness assumes, so no route may blank them.
 *
 * The engine reads every one of these fields live (stage bands → timelines,
 * banned words → stripBanned, gifts → recommendations), so each section is
 * validated before a byte is written. Sections save independently — one PATCH
 * per section, never a giant everything-form.
 */

function json(status: number, body: unknown): Response {
  return Response.json(body, { status });
}

// ── request schemas (one per section, discriminated on `section`) ────────────
// NOTE: cross-field rules (window max>=min, stage overlap/order, gift counts)
// are handler-level checks with explicit messages — zod's discriminatedUnion
// only accepts plain ZodObject options, so no .refine here.

const BrandBody = z.object({
  section: z.literal("brand"),
  signoff: z.string().trim().min(1).max(80),
  voice: z.string().trim().max(300),
  tone: z.array(z.string().trim().min(1).max(30)).max(8),
  banned: z.array(z.string().trim().min(1).max(40)).max(50),
});

const WindowBody = z.object({
  section: z.literal("window"),
  windowMinDays: z.number().int().min(1).max(730),
  windowMaxDays: z.number().int().min(1).max(730),
});

const StagePatchSchema = z.object({
  key: z.enum(["sourcing", "tooling", "production", "qc", "freight", "dispatch"]),
  label: z.string().trim().min(1).max(60),
  blurb: z.string().trim().min(1).max(200),
  from: z.number().int().min(0).max(1000),
  to: z.number().int().min(0).max(1000),
});

const StagesBody = z.object({
  section: z.literal("stages"),
  stages: z.array(StagePatchSchema).min(1).max(12),
});

/** Existing gift = has an id (edit in place); no id = a new gift to mint. */
const GiftPatchSchema = GiftInputSchema.extend({
  id: z.string().trim().min(1).optional(),
});

const GiftsBody = z.object({
  section: z.literal("gifts"),
  // The FULL desired active catalog: present = active (edited or added),
  // absent = retired. Bounded so a bad client can't grow it without limit.
  gifts: z.array(GiftPatchSchema).max(20),
});

const SettingsBody = z.discriminatedUnion("section", [
  BrandBody,
  WindowBody,
  StagesBody,
  GiftsBody,
]);

export type SettingsPatchBody = z.infer<typeof SettingsBody>;

// ── response projection ──────────────────────────────────────────────────────

/** The client-facing settings snapshot — exactly what the page pre-fills. */
export function settingsView(merchant: Merchant, gifts: Gift[]) {
  return {
    brand: {
      voice: merchant.brand.voice,
      tone: merchant.brand.tone,
      banned: merchant.brand.banned,
      signoff: merchant.brand.signoff,
    },
    window: {
      min: merchant.fulfillmentWindowDays.min,
      max: merchant.fulfillmentWindowDays.max,
    },
    stages: merchant.stages.map((s) => ({
      key: s.key,
      label: s.label,
      from: s.dayBand.from,
      to: s.dayBand.to,
      blurb: s.blurb,
    })),
    gifts: activeCatalog(merchant, gifts).map((g) => ({
      id: g.id,
      name: g.name,
      kind: g.kind,
      tier: g.tier,
      costCents: g.costCents,
      perceivedValueCents: g.perceivedValueCents,
    })),
  };
}

export type SettingsView = ReturnType<typeof settingsView>;

// ── authorization (mirrors lib/team-route.ts resolveOwner) ──────────────────

/** Session → own merchant → owner + not-demo. Returns a ready error Response on any miss. */
async function resolveOwner(): Promise<Merchant | Response> {
  const session = await getTenantSession();
  if (!session) return json(401, { error: "sign in required to change settings" });
  const merchant = await getRepositories().merchants.findByMemberOrOwnerSub(session.sub);
  if (!merchant) return json(404, { error: "no workspace for this account" });
  if (merchant.ownerSub !== session.sub) {
    return json(403, { error: "only the workspace owner can change settings" });
  }
  if (merchant.isDemo) {
    return json(403, { error: "this is a sample workspace — its settings are read-only" });
  }
  return merchant;
}

// ── section handlers ─────────────────────────────────────────────────────────

/** Trim + drop duplicates, case-insensitively, preserving first occurrence. */
function dedupe(words: string[]): string[] {
  const seen = new Set<string>();
  const out: string[] = [];
  for (const w of words) {
    const key = w.toLowerCase();
    if (seen.has(key)) continue;
    seen.add(key);
    out.push(w);
  }
  return out;
}

async function applyBrand(
  merchant: Merchant,
  body: z.infer<typeof BrandBody>,
): Promise<Merchant> {
  // Whole-object patch so the JSON driver's shallow merge and Mongo's top-level
  // $set agree; logoText + colors are carried over untouched.
  return getRepositories().merchants.update(merchant.id, {
    brand: {
      ...merchant.brand,
      voice: body.voice,
      tone: dedupe(body.tone),
      banned: dedupe(body.banned),
      signoff: body.signoff,
    },
  });
}

async function applyWindow(
  merchant: Merchant,
  body: z.infer<typeof WindowBody>,
): Promise<Merchant | Response> {
  if (body.windowMaxDays < body.windowMinDays) {
    return json(400, { error: "the max wait must be at least the min wait" });
  }
  return getRepositories().merchants.update(merchant.id, {
    fulfillmentWindowDays: { min: body.windowMinDays, max: body.windowMaxDays },
  });
}

async function applyStages(
  merchant: Merchant,
  body: z.infer<typeof StagesBody>,
): Promise<Merchant | Response> {
  // Keys are FIXED: same keys, same order as the merchant's current stages.
  // The engine and playbook byStage overrides key off them, so a settings save
  // may reword/re-band a stage but never add, drop, or reorder one.
  const currentKeys = merchant.stages.map((s) => s.key);
  const submittedKeys = body.stages.map((s) => s.key);
  if (
    currentKeys.length !== submittedKeys.length ||
    currentKeys.some((k, i) => k !== submittedKeys[i])
  ) {
    return json(400, {
      error: "stage keys are fixed — edit labels, blurbs and day bands only",
    });
  }
  for (const s of body.stages) {
    if (s.from >= s.to) {
      return json(400, { error: `"${s.label}": the start day must be before the end day` });
    }
  }
  for (let i = 1; i < body.stages.length; i++) {
    if (body.stages[i].from < body.stages[i - 1].to) {
      return json(400, {
        error: `"${body.stages[i].label}" overlaps "${body.stages[i - 1].label}" — stage day bands must stay in order without overlapping`,
      });
    }
  }
  const stages: StageDef[] = body.stages.map((s) => ({
    key: s.key,
    label: s.label,
    dayBand: { from: s.from, to: s.to },
    blurb: s.blurb,
  }));
  return getRepositories().merchants.update(merchant.id, { stages });
}

async function applyGifts(
  merchant: Merchant,
  body: z.infer<typeof GiftsBody>,
): Promise<Merchant | Response> {
  // The engine assumes a workable catalog: >=3 active gifts, >=1 always-
  // available Base gift — the same gate onboarding enforces (UX-86).
  if (body.gifts.length < 3) {
    return json(400, { error: "keep at least 3 active gifts" });
  }
  if (!body.gifts.some((g) => g.tier === "base")) {
    return json(400, { error: "keep at least one Base gift (available to every waiting customer)" });
  }
  const ids = body.gifts.flatMap((g) => (g.id ? [g.id] : []));
  if (new Set(ids).size !== ids.length) {
    return json(400, { error: "a gift appears twice" });
  }
  const repos = getRepositories();
  // Per-merchant lookup, so a foreign merchant's gift id is simply unknown here.
  const existing = new Map(
    (await repos.gifts.listByMerchant(merchant.id)).map((g) => [g.id, g]),
  );
  for (const id of ids) {
    if (!existing.has(id)) return json(400, { error: "unknown gift id" });
  }

  const created: Gift[] = [];
  const finalIds: string[] = [];
  for (const g of body.gifts) {
    if (g.id) {
      const current = existing.get(g.id)!;
      await repos.gifts.update(g.id, {
        name: g.name,
        kind: g.kind,
        tier: g.tier,
        costCents: g.costCents,
        perceivedValueCents: g.perceivedValueCents,
        // Keep the retained eligibility numbers, refresh the tier-derived one
        // exactly the way onboarding derives it.
        eligibility: { ...current.eligibility, minRiskScore: TIER_MIN_RISK[g.tier] },
      });
      finalIds.push(g.id);
    } else {
      const gift: Gift = {
        id: newId("gft"),
        merchantId: merchant.id,
        name: g.name,
        kind: g.kind,
        tier: g.tier,
        costCents: g.costCents,
        perceivedValueCents: g.perceivedValueCents,
        eligibility: { minLtvCents: 0, minWaitDays: 0, minRiskScore: TIER_MIN_RISK[g.tier] },
      };
      created.push(gift);
      finalIds.push(gift.id);
    }
  }
  await repos.gifts.createMany(created);
  // Retire-by-omission: ids not in finalIds fall out of the active catalog.
  // Their records stay so past drafts' recommendedGiftId keeps resolving.
  return repos.merchants.update(merchant.id, { giftCatalogIds: finalIds });
}

// ── the handler ──────────────────────────────────────────────────────────────

/** PATCH /api/settings — save ONE section of merchant settings (owner only). */
export async function handleSettingsPATCH(req: Request): Promise<Response> {
  const resolved = await resolveOwner();
  if (resolved instanceof Response) return resolved;
  const merchant = resolved;

  const parsed = SettingsBody.safeParse(await req.json().catch(() => null));
  if (!parsed.success) {
    const issue = parsed.error.issues[0];
    return json(400, {
      error: issue ? `${issue.path.join(".") || "request"}: ${issue.message}` : "invalid request",
    });
  }

  const body = parsed.data;
  let result: Merchant | Response;
  switch (body.section) {
    case "brand":
      result = await applyBrand(merchant, body);
      break;
    case "window":
      result = await applyWindow(merchant, body);
      break;
    case "stages":
      result = await applyStages(merchant, body);
      break;
    case "gifts":
      result = await applyGifts(merchant, body);
      break;
  }
  if (result instanceof Response) return result;

  const gifts = await getRepositories().gifts.listByMerchant(result.id);
  return json(200, settingsView(result, gifts));
}
