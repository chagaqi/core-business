import { newId, newStatusToken } from "@/lib/ids";
import { getRepositories } from "@/lib/repositories";
import { draftReassurance } from "@/lib/engines/reassurance";
import type { Customer, DayStageKey, Merchant, Order, PlaybookTemplates, StageDef } from "@/lib/types";

/**
 * Turns onboarding-wizard answers into a live Merchant record + a seeded
 * day-stage playbook, then generates preview scripts so the operator can review
 * the reassurance language before a single reply goes out. This is the
 * "near-frictionless onboarding" payoff: answers in → working playbook out.
 */

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
  worstStory?: string;
}

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
      base: `{first_name} — you've waited longer than anyone should have to, and I won't give you a canned line. The honest status: {stage_blurb}. Your tracking is generating and I'll have it to you {eta_band}. I'd rather see this through for you than have it routed to your bank — I'm on it personally.`,
      byStage: {},
    },
  };
}

export async function createMerchantFromIntake(intake: IntakeData): Promise<{
  merchant: Merchant;
  previews: Array<{ stageKey: DayStageKey; text: string }>;
}> {
  const repos = getRepositories();
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
  await repos.merchants.create(merchant);

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

  return { merchant, previews };
}
