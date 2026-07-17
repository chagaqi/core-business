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

/**
 * The stage an order is ACTUALLY in, resolved at READ time (lib/time.ts
 * resolveStageFromBands + lib/repositories/live-stage.ts). It is the merchant's
 * authored stages PLUS one terminal state they never author:
 *
 *   "overrun" — the order is past EVERY band the merchant authored. The plan has
 *   run out. We do NOT know what is physically happening, and the old behavior
 *   (clamp to the highest band = "dispatch") is what told ~4,758 backers their
 *   unbuilt machine had left the warehouse. Past the last band means OVERDUE and
 *   UNKNOWN — never "dispatched". The only thing that can speak for an overrun
 *   order is the merchant's own current status (lib/status-board.ts).
 *
 * `Order.productionStage` carries this type because the read seam resolves it.
 * `StageDef.key` and `ScriptVariant.productionStage` stay ProductionStageKey —
 * a merchant authors real stages, never the overrun sentinel.
 */
export type ResolvedStageKey = ProductionStageKey | "overrun";

/** The terminal, out-of-plan stage. See ResolvedStageKey. */
export const OVERRUN_STAGE = "overrun" as const;

/**
 * Where a read-time-resolved `Order.productionStage` came from. Projected onto
 * the order by the read seam, NEVER persisted (the wrapper strips it on write) —
 * so a surface can say WHY it is claiming a stage, and the evidence pack can
 * prove the claim was not invented.
 *
 *   "status-board" — the merchant's own current status said so (most specific
 *                    scoped status wins). The strongest source: a human typed it.
 *   "band"         — derived from days-in-wait against the merchant's own bands.
 *   "overrun"      — past every band, with no status on file. We claim nothing.
 */
export type StageSource = "status-board" | "band" | "overrun";

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
  /** stage-specific override copy, keyed by the RESOLVED production stage (so a
   *  merchant can author dedicated copy for the "overrun" case if they want to). */
  byStage: Partial<Record<ResolvedStageKey, string>>;
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

/** A pending teammate invite (seats): claimed by a verified-email login. */
export interface TeamInvite {
  email: string;
  invitedAt: string;
}

// ─── the production status board ────────────────────────────────────────────
/**
 * The cohort a merchant-authored fact applies to. EVERY field is optional and
 * every present field must MATCH the order for the fact to apply. An empty scope
 * ({} or absent) is merchant-wide and always applies.
 *
 * This is the object p04 (48% EU, one rolled container), p08 (one kiln cohort of
 * three) and p09 (two campaigns, 640 shared backers) needed and did not have: a
 * way to say a true thing to exactly the people it is true for.
 */
export interface StatusScope {
  /** matches Order.campaignName exactly (case-insensitive). */
  campaignName?: string;
  /** matches Order.wave exactly (case-insensitive). */
  wave?: string;
  /** matches Order.region exactly (case-insensitive), e.g. "EU". */
  region?: string;
}

/**
 * A confidence band in WEEKS. Never a date, never a single number presented as a
 * commitment — the proof-only doctrine in its narrowest form (ADR-0002). The
 * merchant types two integers; every surface renders them as a relative window.
 */
export interface WeeksBand {
  minWeeks: number;
  maxWeeks: number;
}

/**
 * THE MERCHANT'S CURRENT PRODUCTION STATUS — the one place the founder/ops lead
 * says what is physically happening right now, and the thing every reply reads.
 *
 * Why this exists: production stage used to be a snapshot frozen at CSV import,
 * so by day 30 a third of replies stated the wrong physical fact about the
 * customer's own order, in the merchant's voice, over their signature. Deriving
 * the stage from the wait (lib/time.ts) fixes the arithmetic. THIS fixes the
 * truth: the bands are a plan, and the plan is exactly what these merchants blew.
 * When a human says "the tooling re-cut is done, we're loading the first run",
 * that sentence outranks every band in the system.
 *
 * Append-only: each update is a new ProductionStatusEntry. The history is the
 * evidence — "what did you tell this backer, and when" is the exhibit a card
 * network asks for, and it is the exhibit we could not produce for anyone.
 */
export interface ProductionStatus {
  /** which of the merchant's stages this status corresponds to (or "overrun"). */
  stageKey: ResolvedStageKey;
  /** what is physically happening now, in the merchant's own words. Customer-facing. */
  headline: string;
  /** optional longer detail (the "why", the mechanism). Customer-facing. */
  detail?: string;
  /** the current confidence band, in weeks. NEVER a date. */
  confidenceBand: WeeksBand;
  /** who this status applies to. Absent/empty = every waiting order. */
  scope?: StatusScope;
  updatedAt: string;
  /** the operator who posted it (session email / name) — accountability, not PII-in-public. */
  updatedBy: string;
}

/**
 * An append-only row in the status board's history. `merchantId` + everything in
 * ProductionStatus. Never edited, never deleted: the newest entry FOR A GIVEN
 * SCOPE is that scope's current status (lib/status-board.ts).
 */
export interface ProductionStatusEntry extends ProductionStatus {
  id: string;
  merchantId: string;
  /**
   * How this status arrived. "manual" = a human typed it in the app. The rest are
   * the import seam (lib/status-board.ts IMPORT SEAM): a status pulled from a
   * source the ops team ALREADY maintains, so keeping the board current is not
   * additional work. Nothing but "manual" is wired yet — the seam is the point.
   */
  source: ProductionStatusSource;
  /** free-form provenance for a non-manual source (sheet id, message id, board card url). */
  sourceRef?: string;
}

export type ProductionStatusSource =
  | "manual"
  | "sheet"
  | "email-digest"
  | "board"
  | "shipping-feed"
  | "api";

/**
 * The delivery window the merchant PROMISED — the disclosure that makes the
 * strongest chargeback exhibit there is ("we told you weeks 9–11 on the day you
 * paid, and you accepted it"). No export in this market carries a delivery-date
 * column, so this can never come from the CSV for most merchants: the merchant's
 * own promised window IS the disclosure, and it lives here. Import stamps it onto
 * every order (Order.disclosedEta); the status board's history records every
 * later re-disclosure.
 */
export interface MerchantDisclosedEta {
  /** the human band shown to the buyer, e.g. "weeks 9–11". NEVER a date. */
  value: string;
  source: "campaign-page" | "checkout" | "update";
  /** who it was promised to. Absent = the merchant's default, applies to everyone. */
  scope?: StatusScope;
}

/**
 * MEASURED day-0 facts about the merchant's own imported cohort. Unlike the four
 * support metrics (which only the merchant can report — we were not there before
 * we arrived), every number here is computed from their real order file at
 * capture time. It is the "before" picture that actually exists on day 0, and it
 * is what a renewal conversation is argued against.
 */
export interface BaselineCohort {
  /** orders on file at capture. */
  orders: number;
  /** orders still inside their fulfillment window at capture. */
  ordersInWait: number;
  /** orders already PAST their fulfillment window at capture. */
  ordersOverdue: number;
  /** median days-in-wait across the cohort at capture. */
  medianWaitDays: number;
  /** longest wait in the cohort at capture. */
  maxWaitDays: number;
  /** total order value on file, in cents. */
  grossCents: number;
  measuredAt: string;
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
  /**
   * Auth0 user (`sub` claim) who owns this merchant — the tenancy key
   * (ADR-0020). Nullable/absent: demo + seed merchants and merchants created
   * under the legacy password mode carry no owner. In auth0 mode every
   * operator surface resolves its merchant through this field, one merchant
   * per user (v1).
   */
  ownerSub?: string | null;
  /**
   * Auth0 subs of teammates attached to this merchant via an accepted invite
   * (seats). A session matches a merchant when sub === ownerSub OR
   * memberSubs includes it — the tenant seam (lib/repositories/tenant-scope.ts)
   * enforces both. Absent = [] (pre-seats records). Members share the
   * workspace; only the owner manages seats (/api/team). Per-plan seat-count
   * enforcement is deferred to billing; the hard cap is TEAM_SEAT_CAP.
   */
  memberSubs?: string[];
  /**
   * Display emails for attached members, keyed by sub — recorded when an
   * invite is claimed (lib/team.ts) so the seats UI can show WHO holds each
   * seat instead of a raw Auth0 sub. Purely presentational: tenancy and
   * authorization read memberSubs only, never this map. Absent = {} (members
   * attached before this field simply have no recorded email).
   */
  memberEmails?: Record<string, string>;
  /**
   * Outstanding teammate invites, by email. Claimed at login through
   * /api/auth/tenant: a session whose VERIFIED email matches moves from here
   * into memberSubs (lib/team.ts). No outbound email is sent — the owner
   * shares the sign-in link themselves. Absent = [].
   */
  pendingInvites?: TeamInvite[];
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
    /**
     * Provenance of the four numbers above. They describe the merchant's support
     * desk BEFORE Tideover existed, so the merchant is the only possible source —
     * we cannot measure a period we were not present for, and a fabricated zero
     * would be a proof-only lie. Absent on legacy records (which are all-zero and
     * therefore "not captured"; see lib/baseline.ts isBaselineMeasured).
     */
    source?: "merchant-reported";
    /** MEASURED from the merchant's own order file at capture (lib/baseline.ts). */
    cohort?: BaselineCohort;
  };
  /**
   * The merchant's CURRENT merchant-wide production status — the newest UNSCOPED
   * status-board entry, denormalized here so any surface holding a Merchant can
   * render it without a second read. Scoped statuses (campaign / wave / region)
   * live ONLY in the append-only history and are resolved per-order by
   * lib/status-board.ts getCurrentStatus(). Absent = the merchant has not posted
   * a status yet, and the bands are all we have.
   */
  productionStatus?: ProductionStatus;
  /**
   * The delivery windows this merchant promised, most-specific-scope wins. Import
   * stamps the resolved value onto every order as `disclosedEta` so the evidence
   * pack can produce its best exhibit for EVERY order, not zero of them. Seeded at
   * onboarding from the merchant's own fulfillment window, so it costs the
   * merchant no extra work; a per-campaign/wave override is an extra row here.
   */
  disclosedEtas?: MerchantDisclosedEta[];
  createdAt: string;
  /**
   * BILLING (ADR-0022). The paid plan, or null while trialing / on a legacy or
   * demo record. WRITTEN ONLY BY STRIPE (the checkout webhook) — the client never
   * asserts its own plan, the same trust boundary as ingest. `entitlementsFor`
   * (lib/entitlements.ts) maps it to the enforced seat/order caps; a null plan
   * keeps the backward-compatible technical ceilings, so nothing today regresses.
   */
  plan?: PlanKey | null;
  /** Subscription lifecycle, also Stripe-written. null = never subscribed (trialing or legacy). */
  subscriptionStatus?: SubscriptionStatus | null;
  /** Stripe customer id, set at first checkout. Absent on trialing/legacy/demo records. */
  stripeCustomerId?: string | null;
  /**
   * Which trial-lifecycle reminders have already been emailed to this merchant,
   * so the daily cron (lib/trial.ts, /api/cron/trial-reminders) never double-sends.
   * Absent = none sent yet.
   */
  trialRemindersSent?: TrialReminderKey[];
}

/** The three published paid tiers (ADR-0022). "Beyond Scale" is custom/manual, not a key. */
export type PlanKey = "starter" | "growth" | "scale";

/** Stripe subscription lifecycle, mapped from the webhook. */
export type SubscriptionStatus = "trialing" | "active" | "past_due" | "canceled";

/** Trial-lifecycle email milestones (lib/trial.ts). `welcome` fires at signup; the rest on the cron. */
export type TrialReminderKey = "welcome" | "midpoint" | "ending" | "ended";

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
  /**
   * THE ORDER'S PRODUCTION STAGE — DERIVED, NOT FROZEN.
   *
   * What is PERSISTED is a snapshot taken at import: a hint, useful for
   * provenance and for a source that genuinely knows a per-order stage. It is
   * NOT the truth, because it goes stale the day after it is written.
   *
   * What every READER gets is the LIVE stage, resolved on the way out of the
   * repository (lib/repositories/live-stage.ts) from, in order:
   *   1. the merchant's current status board, if a status scopes to this order;
   *   2. the merchant's own day-bands vs this order's real days-in-wait
   *      (INCLUSIVE bounds — merchants author 0-20, 21-62, and a wait landing
   *      exactly on a boundary used to match nothing and fall through to
   *      stages[0], telling 28 of p01's long-waiting backers "paper sourced");
   *   3. "overrun" when the wait is past every band — NEVER a clamp to the last
   *      stage, which is what told half of p10's file their machine had shipped.
   *
   * So: write the snapshot, read the truth. `stageSource` says which rule fired.
   */
  productionStage: ResolvedStageKey;
  /**
   * PROJECTED ONLY — set by the read seam, never persisted (the seam strips it
   * from every write). Says where the live `productionStage` above came from.
   */
  stageSource?: StageSource;
  /**
   * Shipping region, from the source row's own country column (KS, Gamefound and
   * Shopify exports all carry one; we used to read it and hardcode "US" anyway,
   * which is why p04 — 48% EU, one rolled EU container — could not say the one
   * true thing she needed to say). "unknown" when the export carried no country:
   * a missing fact, never a fabricated "US".
   */
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
  /**
   * The campaign this order belongs to (e.g. "Deepwater"). Set at import from the
   * source row, or from the merchant's campaign name when the export carries one
   * campaign. A COHORT KEY, not decoration: it is what scopes a status, a
   * disclosed ETA and (next lane) an announcement to the people it is true for.
   */
  campaignName?: string;
  /** the fulfillment wave / batch / kiln-load this order is in (e.g. "Wave 2 — EU hub"). A cohort key. */
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
  productionStage: ResolvedStageKey;
  overdue: boolean;
  /**
   * "unknown" is the OVERRUN case: the wait is past every band the merchant
   * authored, so their plan can no longer say which stages are finished. We show
   * the ladder without claiming a position on it — because the alternative
   * (marking every stage done, up to and including Dispatch) is a written
   * statement that an unbuilt order has shipped.
   */
  stages: Array<StageDef & { state: "done" | "active" | "upcoming" | "unknown" }>;
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
