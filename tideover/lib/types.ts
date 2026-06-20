/**
 * Tideover domain model — the single source of truth for every entity.
 *
 * Conventions:
 *  - ids are prefixed nanoids: mch_ ord_ cus_ tkt_ gft_ sig_ drf_
 *  - dates are ISO 8601 strings
 *  - money is integer CENTS (never floats)
 *  - enums are string-literal unions
 *
 * Nothing in the app reads JSON directly — surfaces/engines/api go through the
 * repository layer (lib/repositories), so MongoDB Atlas swaps in behind the same
 * interfaces with no call-site changes.
 */

// ─── enums ──────────────────────────────────────────────────────────────
export type Channel = "mock" | "gorgias" | "tidio" | "intercom" | "email";

export type ProductionStageKey =
  | "sourcing"
  | "tooling"
  | "production"
  | "qc"
  | "freight"
  | "dispatch";

export type CustomerGroup = "ks-backer" | "late-pledge" | "new-preorder";

export type Sentiment = "calm" | "anxious" | "hostile" | "chargeback-threat";

export type TicketType = "wismo" | "refund" | "deposit" | "other";

export type TicketStatus = "open" | "drafted" | "approved" | "sent" | "resolved";

export type DayStageKey = "day-7" | "day-30" | "day-60" | "day-89";

export type RiskBandKey = "at_risk" | "watch" | "standard";

export type RiskColor = "red" | "amber" | "green";

export type GiftKind =
  | "early-access"
  | "founder-note"
  | "priority-dispatch"
  | "digital-perk"
  | "next-order-credit";

export type DraftedBy = "deterministic" | "llm";

export type LtvTierKey = "standard" | "high" | "vip";

// ─── merchant ───────────────────────────────────────────────────────────
export interface StageDef {
  key: ProductionStageKey;
  label: string;
  /** day band from order placement, e.g. {from:30,to:70} */
  dayBand: { from: number; to: number };
  blurb: string;
}

export interface PlaybookStage {
  /** stage-specific override copy, keyed by production stage */
  byStage: Partial<Record<ProductionStageKey, string>>;
  /** fallback used when no stage-specific copy exists */
  base: string;
}

export type PlaybookTemplates = Record<DayStageKey, PlaybookStage>;

export interface MerchantBrand {
  voice: string;
  tone: string[];
  banned: string[];
  signoff: string;
  logoText: string;
  colors: { primary: string; bg: string; ink: string };
}

export interface Merchant {
  id: string;
  name: string;
  slug: string;
  brand: MerchantBrand;
  helpdesk: Channel;
  preorderApp: string;
  fulfillmentWindowDays: { min: number; max: number };
  stages: StageDef[];
  playbook: PlaybookTemplates;
  ltvTiers: Record<LtvTierKey, number>; // threshold in cents
  giftCatalogIds: string[];
  slaWindows: { amStart: string; pmStart: string; tz: string };
  /** baseline metrics captured day-one (proof-only deltas measured against this) */
  baseline: {
    capturedOn: string;
    medianFrtSec: number;
    wismoPer100Orders: number;
    ticketsPerWeek: number;
    repeatWismoPct: number;
  };
  createdAt: string;
}

// ─── order ──────────────────────────────────────────────────────────────
export interface Order {
  id: string;
  merchantId: string;
  customerId: string;
  group: CustomerGroup;
  orderValueCents: number;
  createdAt: string;
  fulfillmentStart: string;
  fulfillmentEnd: string;
  productionStage: ProductionStageKey;
  region: string;
  /** signed, opaque, unique per order — powers /status/[token] */
  statusToken: string;
  preorderEtaSource: "metafield" | "preorder-app" | "manual";
}

/** computed timeline view (never persisted) */
export interface OrderTimeline {
  orderId: string;
  customerId: string;
  daysInWait: number;
  confidenceBand: string;
  daysRemainingUpper: number;
  productionStage: ProductionStageKey;
  overdue: boolean;
  stages: Array<StageDef & { state: "done" | "active" | "upcoming" }>;
}

// ─── customer ───────────────────────────────────────────────────────────
export interface Customer {
  id: string;
  merchantId: string;
  email: string;
  firstName: string;
  ltvCents: number;
  orderIds: string[];
  ticketCount: number;
  lastSentiment: Sentiment;
}

// ─── ticket + draft ─────────────────────────────────────────────────────
export interface DraftReply {
  id: string;
  text: string;
  confidenceBand: string;
  priority: "normal" | "escalated";
  draftedBy: DraftedBy;
  riskScore: number;
  recommendedGiftId: string | null;
  createdAt: string;
}

export interface SentReply {
  text: string;
  approvedBy: string;
  sentAt: string;
  externalId: string;
}

export interface Ticket {
  id: string;
  merchantId: string;
  customerId: string;
  orderId: string;
  channel: Channel;
  externalId: string | null;
  subject: string;
  body: string;
  type: TicketType;
  sentiment: Sentiment;
  createdAt: string;
  firstResponseSec: number | null;
  status: TicketStatus;
  draft?: DraftReply;
  sent?: SentReply;
  tags: string[];
}

// ─── gift ───────────────────────────────────────────────────────────────
export interface Gift {
  id: string;
  merchantId: string;
  name: string;
  kind: GiftKind;
  costCents: number;
  perceivedValueCents: number;
  eligibility: {
    minLtvCents: number;
    minWaitDays: number;
    minRiskScore: number;
  };
}

// ─── social signal ──────────────────────────────────────────────────────
export interface SocialSignal {
  id: string;
  merchantId: string;
  platform: "twitter" | "reddit" | "instagram";
  author: string;
  text: string;
  postedAt: string;
  mentionsBrand: boolean;
  mentionsCampaign: boolean;
}

/** computed scoring view for the social monitor surface */
export interface ScoredSignal extends SocialSignal {
  signalScore: number;
  flagged: boolean;
  matchedKeywords: string[];
  suggestedOutreach: string | null;
}
