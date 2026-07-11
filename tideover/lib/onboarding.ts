import { newId, newInboxToken, newStatusToken } from "@/lib/ids";
import { getRepositories } from "@/lib/repositories";
import { draftReassurance } from "@/lib/engines/reassurance";
import { importBackerRows, type ImportResult } from "@/lib/import";
import type { MappedRow } from "@/lib/csv";
import type {
  Customer,
  DayStageKey,
  Gift,
  GiftKind,
  GiftTier,
  Merchant,
  Order,
  PlaybookTemplates,
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
 * The five suggested goodwill gifts a new merchant starts from (mirrors the demo
 * seed catalog: 2 base, 2 mid, 1 full — so the >=3-gifts / >=1-base gate is met
 * on arrival). Used as the fallback when intake carries no gift catalog.
 */
const DEFAULT_GIFTS: GiftInput[] = [
  { name: "Early access to the next drop", kind: "early-access", tier: "base", costCents: 0, perceivedValueCents: 4000 },
  { name: "Handwritten founder note", kind: "founder-note", tier: "mid", costCents: 500, perceivedValueCents: 3000 },
  { name: "Priority dispatch (first out the door)", kind: "priority-dispatch", tier: "mid", costCents: 1200, perceivedValueCents: 6000 },
  { name: "Digital perk pack (wallpapers + guide)", kind: "digital-perk", tier: "base", costCents: 0, perceivedValueCents: 2000 },
  { name: "$25 next-order credit", kind: "next-order-credit", tier: "full", costCents: 2500, perceivedValueCents: 2500 },
];

const DEFAULT_STAGES: IntakeData["stages"] = [
  { key: "sourcing", label: "Sourcing", from: 0, to: 12, blurb: "components are being sourced" },
  { key: "tooling", label: "Tooling & sampling", from: 12, to: 32, blurb: "tooling and the first samples are underway" },
  { key: "production", label: "Production run", from: 32, to: 72, blurb: "your unit is on the production line" },
  { key: "qc", label: "QC & inspection", from: 72, to: 84, blurb: "your unit is going through quality control" },
  { key: "freight", label: "Freight", from: 84, to: 104, blurb: "your batch is in transit to the warehouse" },
  { key: "dispatch", label: "Pick, pack & dispatch", from: 104, to: 118, blurb: "your order is being packed for dispatch" },
];

function buildPlaybook(brand: string, signoff: string): PlaybookTemplates {
  return {
    "day-7": {
      base: `Hey {first_name} — totally get that waiting on something you've already paid for can feel like a long time. Quick reassurance: your ${brand} order is confirmed and on schedule — {stage_blurb}. Current window is {eta_band}, and I'll message you the moment it moves forward. You're in good hands.`,
      byStage: {},
    },
    "day-30": {
      base: `Hi {first_name} — a month in, and I want you to have a real update, not a brush-off. Right now {stage_blurb}, and you're still tracking {eta_band}. Nothing has slipped. I'll keep you posted as it moves. ${signoff}`.replace(signoff, "").trim(),
      byStage: {},
    },
    "day-60": {
      base: `Totally fair to feel that at the two-month mark, {first_name} — you've been patient and I appreciate it. Here's where things stand: {stage_blurb}. Current ship window is {eta_band}, and I'll send tracking the moment it generates. Want me to flag it for priority dispatch?`,
      byStage: {},
    },
    "day-89": {
      base: `{first_name} — you've waited longer than anyone should have to, and I won't give you a canned line. Where things actually stand: {stage_blurb}. Your tracking is generating and I'll have it to you {eta_band}. I'd rather see this through for you than have it routed to your bank — I'm on it personally.`,
      byStage: {},
    },
  };
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
      medianFrtSec: 0,
      wismoPer100Orders: 0,
      ticketsPerWeek: 0,
      repeatWismoPct: 0,
    },
    createdAt: new Date().toISOString(),
  };

  // Build the merchant's goodwill gift catalog (UX-86). A real merchant used to
  // ship with giftCatalogIds:[] and no gifts; now the wizard's edited catalog
  // (or the suggested default) becomes real Gift records. Tier is the merchant
  // lever; the retained eligibility numbers are derived here from tier.
  const giftInputs = intake.gifts && intake.gifts.length > 0 ? intake.gifts : DEFAULT_GIFTS;
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

  await repos.merchants.create(merchant);
  await repos.gifts.createMany(gifts);

  // Atomic import (D-onboarding revamp): if the wizard staged the merchant's
  // backer rows, import them NOW against the just-created merchant so onboarding
  // and first-import are ONE call — no "finish onboarding, then separately go
  // connect your data". Absent/empty → null and the merchant is created exactly
  // as before. Runs through the existing importBackerRows path unchanged.
  const importRows = intake.importRows ?? [];
  const imported: ImportResult | null =
    importRows.length > 0 ? await importBackerRows(merchant.id, importRows) : null;

  // generate preview scripts against sample orders at each day-stage
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
  const sampleDays: Record<DayStageKey, { wait: number; stage: StageDef["key"] }> = {
    "day-7": { wait: 5, stage: "sourcing" },
    "day-30": { wait: 24, stage: "tooling" },
    "day-60": { wait: 50, stage: "production" },
    "day-89": { wait: 82, stage: "qc" },
  };
  const now = new Date();
  const previews = (Object.keys(sampleDays) as DayStageKey[]).map((stageKey) => {
    const { wait, stage } = sampleDays[stageKey];
    const order: Order = {
      id: "ord_preview",
      merchantId: merchant.id,
      customerId: sampleCustomer.id,
      group: "new-preorder",
      orderValueCents: 30000,
      createdAt: new Date(now.getTime() - (wait + 1) * 86400000).toISOString(),
      fulfillmentStart: new Date(now.getTime() - wait * 86400000).toISOString(),
      fulfillmentEnd: new Date(now.getTime() - (wait - total) * 86400000).toISOString(),
      productionStage: stage,
      region: "US",
      statusToken: newStatusToken(),
      preorderEtaSource: "manual",
    };
    const r = draftReassurance({ order, merchant, firstName: "Dana", sentiment: "anxious", now });
    return { stageKey, text: r.draftText };
  });

  return { merchant, previews, imported };
}
