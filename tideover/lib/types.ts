/**
 * Tideover domain model — the single source of truth for every entity.
 *
 * Conventions:
 *  - ids are prefixed nanoids: mch_ ord_ cus_ tkt_ gft_ sig_ drf_ sv_ var_ oe_ upd_
 *  - dates are ISO 8601 strings
 *  - money is integer CENTS (never floats)
 *  - enums are string-literal unions
 *
 * Nothing in the app reads JSON directly — surfaces/engines/api go through the
 * repository layer (lib/repositories), so MongoDB Atlas swaps in behind the same
 * interfaces with no call-site changes.
 */

// ─── enums ──────────────────────────────────────────────────────────────
// "manual" is not an inbound channel — it's the honest SEND strategy for a real
// merchant with no write-back integration yet (the operator copies the reply and
// pastes it into their own helpdesk). Inbound never arrives as "manual".
export type Channel = "mock" | "gorgias" | "tidio" | "intercom" | "email" | "manual";

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

/**
 * Unlock tier (UX-86, Dylan D-GIFT model). A gift is available iff its tier is
 * unlocked for the customer's refund-risk band (standard→base, watch→base+mid,
 * at_risk|escalated→base+mid+full). LTV is no longer a gate — it feeds priority.
 */
export type GiftTier = "base" | "mid" | "full";

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
  /** seeded demo merchant — its events must never count toward real proof stats */
  isDemo: boolean;
  /**
   * Stable, unguessable per-merchant token — the local-part of the merchant's
   * inbound address `<inboxToken>@in.tideover.app` (ADR-0008). The address IS
   * the routing key + capability: Resend inbound resolves the recipient's
   * local-part back to this merchant. Rotating it revokes the old address.
   */
  inboxToken: string;
  brand: MerchantBrand;
  helpdesk: Channel;
  preorderApp: string;
  fulfillmentWindowDays: { min: number; max: number };
  stages: StageDef[];
  playbook: PlaybookTemplates;
  ltvTiers: Record<LtvTierKey, number>; // threshold in cents
  giftCatalogIds: string[];
  /**
   * Ingest drop-at-edge filter: a tagged webhook payload is discarded unless at
   * least one tag matches. undefined (the seed default) = accept everything.
   */
  presaleTags?: string[];
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
  /**
   * The delivery estimate disclosed to the buyer at purchase — a human band
   * (e.g. "weeks 9–11"), NOT a hard date. Distinct from the internal
   * fulfillment window; drives the dispute-window computation (Visa 13.1 runs
   * from expected delivery). Optional so existing call sites are unaffected.
   */
  disclosedEta?: {
    value: string;
    source: "campaign-page" | "checkout" | "update";
    disclosedAt: string;
  };
  /** native crowdfunding label, pure display (e.g. "Aurora Lantern — Kickstarter"). */
  campaignName?: string;
  /** native fulfillment-wave label, pure display (e.g. "Wave 2 — EU hub"). */
  wave?: string;
  /** CSV-import provenance (ADR-0010): the source row's own id, namespaced by
   *  merchant. Set only on imported orders; lets a re-import dedupe orders so a
   *  double-click can't duplicate a merchant's backer list. */
  importKey?: string;
}

/**
 * Append-only status-page view log (ADR-0005). One row per successful
 * /status/[token] render or /api/status/[token] hit, written fire-and-forget.
 * Dispute evidence ("notified on X, viewed on Y") — metadata, never customer
 * PII: the IP is truncated to its first two octets or omitted.
 */
export interface StatusView {
  id: string;
  orderId: string;
  merchantId: string;
  token: string;
  viewedAt: string;
  /** first two octets of the request IP only, or omitted — never the full IP. */
  ipPrefix?: string;
  userAgent?: string;
}

/**
 * A merchant "workshop update" (ADR-0009, task U2). ONE short broadcast the
 * merchant writes ("here's what's happening") that fans out to every waiting
 * backer's status page AND becomes a copy-to-Kickstarter draft. Merchant-level,
 * never per-order — so a single post reaches every customer in the wait.
 *
 * Append-only in practice: `hidden` soft-retracts a post without deleting it
 * (the public feed excludes hidden ones). Text is proof-linted on save — a
 * workshop update must never promise a hard ship date. The optional `imageUrl`
 * is an externally-hosted URL the merchant supplies (no upload pipeline);
 * surfaces render it with max-width:100%, never store it as a blob.
 */
export interface MerchantUpdate {
  id: string;
  merchantId: string;
  text: string;
  imageUrl?: string;
  hidden?: boolean;
  createdAt: string;
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
  /**
   * Outcome-ledger attribution (ADR-0007): the ScriptVariant that produced this
   * draft. Stamped at draft time; a reply_sent OutcomeEvent carries it on send.
   * Optional so pre-ledger drafts and legacy call sites remain valid.
   */
  variantId?: string;
}

export interface SentReply {
  text: string;
  approvedBy: string;
  sentAt: string;
  // null when the delivery carried no external id — e.g. the ManualAdapter, where
  // the operator pastes the reply into their own helpdesk and no vendor assigns one.
  externalId: string | null;
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
  /** unlock tier — availability is gated on this + the customer's risk band. */
  tier: GiftTier;
  costCents: number;
  perceivedValueCents: number;
  /**
   * Retained for the ticket gift panel + future tuning. The ENGINE no longer
   * gates on these (LTV gate dropped, UX-86): availability is tier-vs-band.
   */
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

// ─── outcome ledger (ADR-0007, task E1) ──────────────────────────────────
export type ScriptVariantSource = "library" | "merchant-default" | "operator-promoted";
export type ScriptVariantStatus = "active" | "retired";

/**
 * A tracked playbook template — the unit outcomes accrue against (the data
 * foundation for the "self-improving playbooks" story). Phase 0 migrates every
 * merchant playbook `base` + `byStage[x]` string into an isDefault variant so a
 * sent reply can be attributed to the exact template that produced it.
 * `productionStage` is the byStage override key this variant represents, or null
 * for the day-stage's base copy.
 */
export interface ScriptVariant {
  id: string;
  merchantId: string;
  stageKey: DayStageKey;
  productionStage: ProductionStageKey | null;
  text: string;
  source: ScriptVariantSource;
  isDefault: boolean;
  status: ScriptVariantStatus;
  parentVariantId?: string | null;
  createdAt: string;
}

/**
 * Outcome-event kinds. Phase 0 (ADR-0007) emits ONLY `reply_sent`; the rest are
 * defined for E2's attribution work but are never written yet (see the cut list).
 */
export type OutcomeEventKind =
  | "reply_sent"
  | "customer_replied"
  | "reopened"
  | "csat_up"
  | "csat_down"
  | "refund_requested"
  | "chargeback"
  | "resolved_quiet";

export interface OutcomeEventMeta {
  /** normalized [0,1] char-distance between the drafted reply and the sent reply. */
  editedRatio?: number;
  /**
   * The inferred sentiment of a customer's inbound reply that landed within the
   * attribution window (ADR-0012, E2). Carried ONLY on `customer_replied` events
   * so the panel can fold a calm-response rate. A measured fact (the channel's
   * own sentiment inference), never an invented outcome.
   */
  respondedSentiment?: Sentiment;
}

/**
 * Append-only outcome ledger row (ADR-0007). One `reply_sent` per approved send,
 * stamped with the variant that produced the draft. Never edited, never deleted.
 * isDemo lineage is inherited via merchantId → merchant.isDemo at rollup time
 * (E3), so demo events never count toward any real proof stat.
 */
export interface OutcomeEvent {
  id: string;
  merchantId: string;
  ticketId: string;
  orderId: string;
  customerId: string;
  variantId: string;
  stageKey: DayStageKey;
  sentimentAtSend: Sentiment;
  kind: OutcomeEventKind;
  observedAt: string;
  meta?: OutcomeEventMeta;
}
