import { newId, newInboxToken, newStatusToken } from "@/lib/ids";
import { getRepositories } from "@/lib/repositories";
import { draftReassurance } from "@/lib/engines/reassurance";
import { importBackerRows, type ImportResult } from "@/lib/import";
import { windowToDisclosedBand } from "@/lib/status-board";
import { resolveStageFromBands } from "@/lib/time";
import type { MappedRow } from "@/lib/csv";
import type {
  Customer,
  DayStageKey,
  Gift,
  GiftKind,
  GiftTier,
  Merchant,
  MerchantDisclosedEta,
  Order,
  PlaybookTemplates,
  ProductionStageKey,
  ScriptVariant,
  StageDef,
} from "@/lib/types";

/**
 * Turns onboarding-wizard answers into a live Merchant record + a seeded
 * day-stage playbook, then generates preview scripts so the operator can review
 * the reassurance language before a single reply goes out. This is the
 * "near-frictionless onboarding" payoff: answers in → working playbook out.
 */

/**
 * A merchant-authored goodwill gift, straight from the onboarding wizard. The
 * merchant only picks a TIER (base | mid | full) — the UX-86 lever; the raw
 * risk/wait/LTV eligibility numbers are derived on write, never surfaced.
 */
export interface GiftInput {
  name: string;
  kind: GiftKind;
  tier: GiftTier;
  costCents: number;
  perceivedValueCents: number;
}

export interface IntakeData {
  brandName: string;
  voice: string;
  tone: string[];
  banned: string[];
  signoff: string;
  helpdesk: Merchant["helpdesk"];
  preorderApp: string;
  windowMinDays: number;
  windowMaxDays: number;
  stages: Array<{ key: StageDef["key"]; label: string; from: number; to: number; blurb: string }>;
  /**
   * The merchant's goodwill gift catalog. Optional + tolerant: absent/empty
   * falls back to DEFAULT_GIFTS so legacy callers (and the CSV-import tests)
   * keep working — a real wizard submit always carries an edited catalog.
   */
  gifts?: GiftInput[];
  /**
   * Backer rows staged client-side in the wizard's "Connect your data" step.
   * Optional + tolerant: absent/empty → no import, and the merchant is created
   * exactly as before. When present, they import against the just-created
   * merchant in the SAME call, so onboarding and first-import are atomic.
   */
  importRows?: MappedRow[];
  /**
   * The campaign these backers belong to (e.g. "Deepwater"). A COHORT KEY — it
   * scopes a production status, a disclosed ETA and (next lane) an announcement
   * to exactly the people it is true for. Optional and never guessed: an export
   * with its own campaign column always wins, and a merchant who gives us
   * nothing gets no campaign rather than a wrong one.
   */
  campaignName?: string;
  /** Same, for a single-wave import (e.g. "Kiln load 2"). */
  wave?: string;
  /**
   * The delivery window this merchant PROMISED their buyers, as a human band
   * ("weeks 9–11"). Optional: when it is absent we derive it from the fulfillment
   * window they already gave us, so every order carries a disclosure and the
   * merchant answers no extra question. NEVER a date.
   *
   * This one field un-blanks the evidence pack's best chargeback exhibit for
   * every order a merchant will ever import. It was empty on 48,180 of 48,180.
   */
  promisedWindow?: string;
  /**
   * The merchant's OWN pre-Tideover support numbers. We were not there before we
   * arrived, so we cannot measure them, and a fabricated zero would be a
   * proof-only lie. The merchant reports them; we stamp them
   * `source: "merchant-reported"`. Omitted → they stay unset and every surface
   * keeps saying "Not yet measured", which is true.
   */
  baseline?: {
    medianFrtSec: number;
    wismoPer100Orders: number;
    ticketsPerWeek: number;
    repeatWismoPct: number;
  };
}

/**
 * tier → minRiskScore, the retained eligibility field the ticket gift panel
 * still reads (the ENGINE gates on tier-vs-band now, not this). base = always
 * available, mid = watch-risk & up, full = high-risk / escalated. Exported so
 * the settings surface (lib/settings-route.ts) derives the identical value on
 * a gift edit.
 */
export const TIER_MIN_RISK: Record<GiftTier, number> = { base: 0, mid: 50, full: 75 };

/**
 * THE ZERO-COST BASE LADDER — the fix for the $38 backer.
 *
 * The old model ranked goodwill by what the BUYER was worth: the high-LTV tier
 * sat at $500, and the median Kickstarter pledge is $38, so on a single-pledge
 * campaign the gate could never fire. Half the value model was inert for most of
 * the ICP, and the merchants it was inert for are the solo creators who most need
 * a way to hold a wobbling backer.
 *
 * Gifts are tiered by COST-TO-MERCHANT and PERCEIVED VALUE, not by the buyer's
 * lifetime value — and the BASE tier is deliberately, entirely FREE to send. A
 * digital art book costs a press nothing and is worth something real to the
 * person holding a 92-day wait. That is a gesture a 210-backer ceramicist can
 * make 210 times, and it is the only kind of gesture most of this ICP can afford
 * to make at all.
 *
 * Every merchant gets this ladder on day one (see ensureBaseLadder): a catalog
 * with no base tier is a catalog that cannot fire for a standard-band customer,
 * which is every customer p08 has.
 */
const ZERO_COST_BASE_GIFTS: GiftInput[] = [
  { name: "Digital art book (PDF, the making-of)", kind: "digital-perk", tier: "base", costCents: 0, perceivedValueCents: 2500 },
  { name: "Wallpaper pack + printable guide", kind: "digital-perk", tier: "base", costCents: 0, perceivedValueCents: 1200 },
  { name: "Early digital copy, before anyone else", kind: "early-access", tier: "base", costCents: 0, perceivedValueCents: 4000 },
  { name: "Your name in the credits", kind: "digital-perk", tier: "base", costCents: 0, perceivedValueCents: 2000 },
  { name: "A voice note from the founder", kind: "founder-note", tier: "base", costCents: 0, perceivedValueCents: 3000 },
];

/**
 * The goodwill catalog a new merchant starts from: the free base ladder above,
 * plus the gestures that DO cost something, tiered by that cost. Used as the
 * fallback when intake carries no gift catalog.
 */
const DEFAULT_GIFTS: GiftInput[] = [
  ...ZERO_COST_BASE_GIFTS,
  { name: "Handwritten founder note", kind: "founder-note", tier: "mid", costCents: 500, perceivedValueCents: 3000 },
  { name: "Priority dispatch (first out the door)", kind: "priority-dispatch", tier: "mid", costCents: 1200, perceivedValueCents: 6000 },
  { name: "$25 next-order credit", kind: "next-order-credit", tier: "full", costCents: 2500, perceivedValueCents: 2500 },
];

/**
 * Guarantee a base tier. Availability is tier-vs-risk-band (UX-86): a calm,
 * standard-band customer unlocks the BASE tier and nothing else. So a catalog
 * with no base gift is a catalog that can never fire for them — and p08's 210
 * backers produced exactly one risk band across all fourteen of her tickets. If
 * the merchant's own catalog carries no free gesture, the zero-cost ladder is
 * appended so there is always something real to give.
 */
export function ensureBaseLadder(gifts: GiftInput[]): GiftInput[] {
  if (gifts.some((g) => g.tier === "base")) return gifts;
  return [...gifts, ...ZERO_COST_BASE_GIFTS];
}

const DEFAULT_STAGES: IntakeData["stages"] = [
  { key: "sourcing", label: "Sourcing", from: 0, to: 12, blurb: "components are being sourced" },
  { key: "tooling", label: "Tooling & sampling", from: 12, to: 32, blurb: "tooling and the first samples are underway" },
  { key: "production", label: "Production run", from: 32, to: 72, blurb: "your unit is on the production line" },
  { key: "qc", label: "QC & inspection", from: 72, to: 84, blurb: "your unit is going through quality control" },
  { key: "freight", label: "Freight", from: 84, to: 104, blurb: "your batch is in transit to the warehouse" },
  { key: "dispatch", label: "Pick, pack & dispatch", from: 104, to: 118, blurb: "your order is being packed for dispatch" },
];

/**
 * The four seeded day-stage templates — the DETERMINISTIC FLOOR.
 *
 * This is what ships whenever the LLM is blocked, rate-limited, or unconfigured.
 * It is the failure mode under degradation, so it must be the SAFEST thing in the
 * product. It was the most dangerous:
 *
 *   - day-89 asserted "Your tracking is generating" — a fabricated physical fact,
 *     about a package that does not exist, sent over the merchant's signature to
 *     the customer most likely to already be talking to their bank. The engine
 *     holds no tracking data of any kind. It could not have been true.
 *   - day-30 asserted "Nothing has slipped", which is factually false for the
 *     entire ICP — a merchant only buys Tideover because something slipped.
 *   - day-7 asserted "on schedule", which is both an unverifiable claim and a
 *     banned phrase for two of the ten merchants we modelled.
 *
 * Every one of those is a claim the product cannot support. They are removed, and
 * nothing is added in their place: the floor now says only what the engine can
 * actually prove — the stage (derived live, or the merchant's own current status)
 * and the confidence band. A blank space is safe. An invented fact is not.
 *
 * STILL OPEN, and it belongs to the drafting lane: these templates are ticket-TYPE
 * blind, so the day-89 copy fires at a calm address-change the same way it fires
 * at a refund demand. Type-aware templates are theirs; this file is mine, so hand
 * the copy to me.
 */
function buildPlaybook(brand: string, signoff: string): PlaybookTemplates {
  return {
    "day-7": {
      base: `Hey {first_name} — totally get that waiting on something you've already paid for can feel like a long time. Here's exactly where your ${brand} order is: {stage_blurb}. Current window is {eta_band}, and I'll message you the moment it moves forward.`,
      byStage: {},
    },
    "day-30": {
      base: `Hi {first_name} — a month in, and I want you to have a real update, not a brush-off. Right now {stage_blurb}, and the current window is {eta_band}. That's where it actually is; if it moves, you'll hear it from me. ${signoff}`.replace(signoff, "").trim(),
      byStage: {},
    },
    "day-60": {
      base: `Totally fair to feel that at the two-month mark, {first_name} — you've been patient and I appreciate it. Here's where things stand: {stage_blurb}. Current window is {eta_band}. The moment there's tracking to send, you'll have it. Want me to flag your order for priority dispatch?`,
      byStage: {},
    },
    "day-89": {
      base: `{first_name} — you've waited longer than anyone should have to, and I won't give you a canned line. Where things actually stand: {stage_blurb}. Timing, as straight as I can put it: {eta_band}. I'm not going to invent a tracking number I don't have, and I'd rather sort this out with you directly than have it routed to your bank — I'm on it personally.`,
      byStage: {},
    },
  };
}

/**
 * The merchant's default disclosed ETA: what they typed, or the band implied by
 * the fulfillment window they already gave us. Merchant-wide (no scope), so it
 * applies to every order; a per-campaign/wave override is an extra row on
 * `Merchant.disclosedEtas` and wins by scope specificity at import.
 *
 * `source: "campaign-page"` because that is where a crowdfunding buyer read it —
 * the estimated-delivery line on the campaign they backed.
 */
function buildDefaultDisclosure(intake: IntakeData): MerchantDisclosedEta {
  const value =
    intake.promisedWindow?.trim() ||
    windowToDisclosedBand({ min: intake.windowMinDays, max: intake.windowMaxDays });
  return { value, source: "campaign-page" };
}

/**
 * SEED THE SCRIPT VARIANTS — the wire that reconnects the whole measurement spine.
 *
 * `createMerchantFromIntake` seeded NO ScriptVariants, so `resolveVariantId`
 * returned undefined, so `recordReplySent` never fired, so the outcome ledger,
 * Script Performance, CSAT attribution, reopen rate and the promote-variant flow
 * were all permanently, silently empty for every real merchant — six shipped
 * features, dead in production. The ten-merchant run only produced a ledger
 * because the harness hand-seeded variants the product never creates.
 *
 * The variant identity is the reassurance engine's own template selection key
 * (ADR-0007): `stageKey` + the `byStage` override it resolved, or null for the
 * day-stage's base copy. So the seed mirrors exactly what the engine will look
 * up: one variant per day-stage base, plus one per authored stage override.
 */
export function buildScriptVariants(
  merchantId: string,
  playbook: PlaybookTemplates,
  now: Date = new Date(),
): ScriptVariant[] {
  const createdAt = now.toISOString();
  const variants: ScriptVariant[] = [];
  for (const stageKey of Object.keys(playbook) as DayStageKey[]) {
    const stage = playbook[stageKey];
    variants.push({
      id: newId("var"),
      merchantId,
      stageKey,
      productionStage: null,
      text: stage.base,
      source: "merchant-default",
      isDefault: true,
      status: "active",
      createdAt,
    });
    for (const [ps, text] of Object.entries(stage.byStage)) {
      if (!text) continue;
      variants.push({
        id: newId("var"),
        merchantId,
        stageKey,
        productionStage: ps as ProductionStageKey,
        text,
        source: "merchant-default",
        isDefault: true,
        status: "active",
        createdAt,
      });
    }
  }
  return variants;
}

/**
 * Thrown when the owning user already has a merchant (ADR-0020: one merchant
 * per user, v1). The API layer maps this to a 409 + an "already onboarded"
 * redirect signal instead of creating a duplicate.
 */
export class AlreadyOnboardedError extends Error {
  readonly merchantId: string;
  constructor(merchantId: string) {
    super("already onboarded");
    this.name = "AlreadyOnboardedError";
    this.merchantId = merchantId;
  }
}

/**
 * Build the Merchant + gift catalog from intake WITHOUT persisting anything.
 * Extracted from createMerchantFromIntake (SWAN SPRINT P2) so the pre-create
 * preview endpoint (/api/onboarding/preview) runs the EXACT construction the
 * real create runs — zero drift between what a merchant is shown and what they
 * get. Pure apart from id generation.
 */
export function buildMerchantFromIntake(
  intake: IntakeData,
  ownerSub: string | null = null,
): { merchant: Merchant; gifts: Gift[] } {
  const slug = intake.brandName.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");
  const stages: StageDef[] = (intake.stages.length ? intake.stages : DEFAULT_STAGES).map((s) => ({
    key: s.key,
    label: s.label,
    dayBand: { from: s.from, to: s.to },
    blurb: s.blurb,
  }));

  const merchant: Merchant = {
    id: newId("mch"),
    name: intake.brandName,
    slug,
    // intake = a real merchant; only seeded demo data sets isDemo true
    isDemo: false,
    // ADR-0008: mint the merchant's inbound address up front so onboarding can
    // hand them the one forwarding rule that IS the integration.
    inboxToken: newInboxToken(),
    // ADR-0020: the tenancy key. Session-derived in auth0 mode; null elsewhere.
    ownerSub,
    // Seats: a fresh merchant starts with no teammates and no open invites.
    memberSubs: [],
    pendingInvites: [],
    brand: {
      voice: intake.voice,
      tone: intake.tone,
      banned: intake.banned,
      signoff: intake.signoff || `— ${intake.brandName}`,
      logoText: intake.brandName,
      colors: { primary: "#0E5366", bg: "#FBF8F2", ink: "#11252A" },
    },
    helpdesk: intake.helpdesk,
    preorderApp: intake.preorderApp,
    fulfillmentWindowDays: { min: intake.windowMinDays, max: intake.windowMaxDays },
    stages,
    playbook: buildPlaybook(intake.brandName, intake.signoff || `— ${intake.brandName}`),
    ltvTiers: { standard: 0, high: 50000, vip: 200000 },
    // populated below from the intake gift catalog (UX-86) — no longer empty.
    giftCatalogIds: [],
    slaWindows: { amStart: "9:00", pmStart: "15:00", tz: "ET" },
    baseline: {
      capturedOn: new Date().toISOString(),
      // The merchant's OWN pre-Tideover numbers, when they gave them. Absent →
      // zeros, which isBaselineMeasured reads as "not captured" and every surface
      // renders as "Not yet measured". A zero is never shown as a measurement.
      medianFrtSec: intake.baseline?.medianFrtSec ?? 0,
      wismoPer100Orders: intake.baseline?.wismoPer100Orders ?? 0,
      ticketsPerWeek: intake.baseline?.ticketsPerWeek ?? 0,
      repeatWismoPct: intake.baseline?.repeatWismoPct ?? 0,
      ...(intake.baseline ? { source: "merchant-reported" as const } : {}),
      // `cohort` is MEASURED by the import below (lib/baseline.ts) — never here.
    },
    // The merchant's promised delivery window becomes the disclosure stamped on
    // every order at import. Taken from the window they already gave us unless
    // they typed their own, so this costs them nothing and the evidence pack
    // stops shipping with `hasDisclosedEta: false` for every order they own.
    disclosedEtas: [buildDefaultDisclosure(intake)],
    createdAt: new Date().toISOString(),
  };

  // Build the merchant's goodwill gift catalog (UX-86). A real merchant used to
  // ship with giftCatalogIds:[] and no gifts; now the wizard's edited catalog
  // (or the suggested default) becomes real Gift records. Tier is the merchant
  // lever; the retained eligibility numbers are derived here from tier.
  // ensureBaseLadder: whatever the merchant picked, they leave onboarding with at
  // least one gesture that costs them nothing and is available to a calm,
  // standard-band, $38 backer — the customer the old LTV gate could never reach.
  const giftInputs = ensureBaseLadder(
    intake.gifts && intake.gifts.length > 0 ? intake.gifts : DEFAULT_GIFTS,
  );
  const gifts: Gift[] = giftInputs.map((g) => ({
    id: newId("gft"),
    merchantId: merchant.id,
    name: g.name,
    kind: g.kind,
    tier: g.tier,
    costCents: g.costCents,
    perceivedValueCents: g.perceivedValueCents,
    eligibility: {
      minLtvCents: 0,
      minWaitDays: 0,
      minRiskScore: TIER_MIN_RISK[g.tier],
    },
  }));
  // Link the merchant to its catalog before persisting so the stored record
  // (not just the returned object) carries the ids.
  merchant.giftCatalogIds = gifts.map((g) => g.id);

  return { merchant, gifts };
}

/**
 * Generate the per-day-stage preview replies for a merchant — pure on the
 * merchant object (in-memory sample customer + orders through draftReassurance,
 * no repository reads), so it serves both the real create and the pre-create
 * preview endpoint.
 */
export function buildStagePreviews(
  merchant: Merchant,
  now: Date = new Date(),
): Array<{ stageKey: DayStageKey; text: string }> {
  const sampleCustomer: Customer = {
    id: "cus_preview",
    merchantId: merchant.id,
    email: "preview@example.com",
    firstName: "Dana",
    ltvCents: 60000,
    orderIds: [],
    ticketCount: 0,
    lastSentiment: "anxious",
  };
  const total = merchant.fulfillmentWindowDays.max;
  // The preview's production stage is DERIVED from the sample wait against the
  // merchant's OWN bands — the same resolution every real order gets at read time.
  // It used to be hardcoded (day-60 → "production", always), so the preview could
  // show a merchant a stage their own plan says is impossible at that wait, and
  // the first thing they ever saw the product do was contradict them.
  const sampleWaits: Record<DayStageKey, number> = {
    "day-7": 5,
    "day-30": 24,
    "day-60": 50,
    "day-89": 82,
  };
  return (Object.keys(sampleWaits) as DayStageKey[]).map((stageKey) => {
    const wait = sampleWaits[stageKey];
    const order: Order = {
      id: "ord_preview",
      merchantId: merchant.id,
      customerId: sampleCustomer.id,
      group: "new-preorder",
      orderValueCents: 30000,
      createdAt: new Date(now.getTime() - (wait + 1) * 86400000).toISOString(),
      fulfillmentStart: new Date(now.getTime() - wait * 86400000).toISOString(),
      fulfillmentEnd: new Date(now.getTime() - (wait - total) * 86400000).toISOString(),
      productionStage: resolveStageFromBands(merchant.stages, wait),
      region: "US",
      statusToken: newStatusToken(),
      preorderEtaSource: "manual",
    };
    const r = draftReassurance({ order, merchant, firstName: "Dana", sentiment: "anxious", now });
    return { stageKey, text: r.draftText };
  });
}

export async function createMerchantFromIntake(
  intake: IntakeData,
  opts: {
    /**
     * Auth0 user (`sub`) the new merchant belongs to (ADR-0020). Stamped from
     * the SESSION by the API layer — never from the client body. null/absent =
     * ownerless (demo sandbox, legacy password mode): exactly the pre-Auth0
     * behavior.
     */
    ownerSub?: string | null;
  } = {},
): Promise<{
  merchant: Merchant;
  previews: Array<{ stageKey: DayStageKey; text: string }>;
  /** Counts from the atomic backer import, or null when no rows were staged. */
  imported: ImportResult | null;
}> {
  const repos = getRepositories();
  const ownerSub = opts.ownerSub ?? null;
  if (ownerSub) {
    // Member-or-owner: an attached teammate is "already onboarded" too — one
    // merchant per user holds across both roles (their 409 routes them to /app).
    const existing = await repos.merchants.findByMemberOrOwnerSub(ownerSub);
    if (existing) throw new AlreadyOnboardedError(existing.id);
  }
  const { merchant, gifts } = buildMerchantFromIntake(intake, ownerSub);

  await repos.merchants.create(merchant);
  await repos.gifts.createMany(gifts);

  // Seed the outcome ledger's script variants (ADR-0007). Without this every
  // reply a real merchant ever sends is unattributable and six shipped features
  // stay empty forever. Persisted BEFORE any ticket can arrive.
  for (const variant of buildScriptVariants(merchant.id, merchant.playbook)) {
    await repos.scriptVariants.create(variant);
  }

  // Atomic import (D-onboarding revamp): if the wizard staged the merchant's
  // backer rows, import them NOW against the just-created merchant so onboarding
  // and first-import are ONE call — no "finish onboarding, then separately go
  // connect your data". Absent/empty → null and the merchant is created exactly
  // as before. The import stamps the cohort keys + the disclosed ETA and MEASURES
  // the day-0 baseline, so a merchant who finishes the wizard already has a real
  // before-picture instead of "Not yet measured".
  const importRows = intake.importRows ?? [];
  const imported: ImportResult | null =
    importRows.length > 0
      ? await importBackerRows(merchant.id, importRows, new Date(), {
          defaultCampaignName: intake.campaignName?.trim() || undefined,
          defaultWave: intake.wave?.trim() || undefined,
        })
      : null;

  const previews = buildStagePreviews(merchant);

  return { merchant, previews, imported };
}
