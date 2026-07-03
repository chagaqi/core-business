import { newId } from "@/lib/ids";
import { getRepositories, type Repositories } from "@/lib/repositories";
import { computeTimeline } from "@/lib/time";
import {
  computeTicketIntelligence,
  scoreRefundRisk,
  stageCeilDayFor,
  type ReassuranceResult,
  type TicketIntelligence,
} from "@/lib/engines";
import { getDrafter } from "@/lib/drafting/LlmDrafter";
import { getSendAdapter } from "@/lib/channel-adapters/registry";
import type { NormalizedTicket } from "@/lib/channel-adapters/ChannelAdapter";
import type {
  Customer,
  DraftReply,
  Merchant,
  Order,
  OrderTimeline,
  OutcomeEvent,
  ProductionStageKey,
  ScriptVariant,
  Ticket,
} from "@/lib/types";

/**
 * Service layer — the high-level operations the API routes and server-rendered
 * surfaces both call. Keeps engine + repository orchestration in one place so a
 * route handler and a React Server Component never drift.
 */

export async function ticketsLast7dFor(merchantId: string, customerId: string): Promise<number> {
  const repos = getRepositories();
  const cutoff = Date.now() - 7 * 86400000;
  const tickets = await repos.tickets.list({ merchantId, customerId });
  return tickets.filter((t) => new Date(t.createdAt).getTime() >= cutoff).length;
}

export interface TicketView {
  ticket: Ticket;
  order: Order;
  customer: Customer;
  merchant: Merchant;
  timeline: OrderTimeline;
  intel: TicketIntelligence;
}

export async function getTicketView(ticketId: string, now: Date = new Date()): Promise<TicketView | null> {
  const repos = getRepositories();
  const ticket = await repos.tickets.findById(ticketId);
  if (!ticket) return null;
  const [order, customer, merchant] = await Promise.all([
    repos.orders.findById(ticket.orderId),
    repos.customers.findById(ticket.customerId),
    repos.merchants.findById(ticket.merchantId),
  ]);
  if (!order || !customer || !merchant) return null;
  const catalog = await repos.gifts.listByMerchant(merchant.id);
  const ticketsLast7d = await ticketsLast7dFor(merchant.id, customer.id);
  const intel = computeTicketIntelligence({
    ticket,
    order,
    customer,
    merchant,
    catalog,
    ticketsLast7d,
    now,
  });
  const timeline = computeTimeline(order, merchant, now);
  return { ticket, order, customer, merchant, timeline, intel };
}

function intelToDraft(intel: TicketIntelligence): DraftReply {
  return {
    id: newId("drf"),
    text: intel.reassurance.draftText,
    confidenceBand: intel.reassurance.confidenceBand,
    priority: intel.reassurance.priority,
    draftedBy: "deterministic",
    riskScore: intel.risk.riskScore,
    recommendedGiftId: intel.gift.gift?.id ?? null,
    createdAt: new Date().toISOString(),
  };
}

/** Mongo raises code 11000 on a unique-index violation; other drivers don't. */
function isDuplicateKeyError(err: unknown): boolean {
  return typeof err === "object" && err !== null && "code" in err && err.code === 11000;
}

/**
 * Outcome ledger (ADR-0007): resolve the reassurance engine's variant identity
 * ("<stageKey>:<productionStage|base>") to the merchant's seeded variant id, so
 * a draft can be stamped with the template that produced it. Returns undefined
 * if no variant matches (pre-ledger data) — attribution is then skipped.
 */
async function resolveVariantId(
  repos: Repositories,
  merchantId: string,
  reassurance: Pick<ReassuranceResult, "variantKey" | "stageKey">,
): Promise<string | undefined> {
  const sep = reassurance.variantKey.indexOf(":");
  const stagePart = sep >= 0 ? reassurance.variantKey.slice(sep + 1) : "base";
  const productionStage: ProductionStageKey | null =
    stagePart === "base" ? null : (stagePart as ProductionStageKey);
  const variant = await repos.scriptVariants.findByKey(merchantId, reassurance.stageKey, productionStage);
  return variant?.id;
}

/**
 * Normalized character edit distance in [0,1]; 0 = identical. Levenshtein over
 * the drafted vs the approved reply divided by the longer length. This is the
 * outcome ledger's `editedRatio` (ADR-0007) — a measured fact about the
 * operator's own edit, never a fabricated outcome.
 */
export function editedRatio(drafted: string, approved: string): number {
  if (drafted === approved) return 0;
  const maxLen = Math.max(drafted.length, approved.length);
  if (maxLen === 0) return 0;
  const ratio = levenshtein(drafted, approved) / maxLen;
  return ratio < 0 ? 0 : ratio > 1 ? 1 : ratio;
}

function levenshtein(a: string, b: string): number {
  const m = a.length;
  const n = b.length;
  if (m === 0) return n;
  if (n === 0) return m;
  let prev = new Array<number>(n + 1);
  let curr = new Array<number>(n + 1);
  for (let j = 0; j <= n; j++) prev[j] = j;
  for (let i = 1; i <= m; i++) {
    curr[0] = i;
    const ai = a.charCodeAt(i - 1);
    for (let j = 1; j <= n; j++) {
      const cost = ai === b.charCodeAt(j - 1) ? 0 : 1;
      const del = prev[j] + 1;
      const ins = curr[j - 1] + 1;
      const sub = prev[j - 1] + cost;
      curr[j] = del < ins ? (del < sub ? del : sub) : ins < sub ? ins : sub;
    }
    const tmp = prev;
    prev = curr;
    curr = tmp;
  }
  return prev[n];
}

/**
 * Outcome ledger (ADR-0007): record ONE reply_sent event for an approved send,
 * attributed to the variant that produced the draft, carrying meta.editedRatio.
 * Best-effort — the send has already succeeded, so a ledger failure is logged
 * and swallowed, never blocking the send (mirrors the ADR-0005 view log).
 * The demo cockpit renders drafts live without persisting them, so the variant +
 * baseline draft are recovered by recomputing the engine when the ticket has no
 * persisted draft.
 */
async function recordReplySent(repos: Repositories, ticket: Ticket, sentText: string): Promise<void> {
  try {
    const view = await getTicketView(ticket.id);
    const reassurance = view?.intel.reassurance;
    const draftedText = ticket.draft?.text ?? reassurance?.draftText;
    const variantId =
      ticket.draft?.variantId ??
      (reassurance ? await resolveVariantId(repos, ticket.merchantId, reassurance) : undefined);
    if (variantId === undefined || draftedText === undefined) return; // cannot attribute — skip.

    // stageKey must agree with variantId (they describe the same variant), so
    // source it from the resolved variant — not the send-time recompute, which
    // could drift to a later day-stage if the ticket sat drafted across a
    // boundary before being sent.
    const stageKey = (await repos.scriptVariants.getById(variantId))?.stageKey ?? reassurance?.stageKey;
    if (!stageKey) return;

    await repos.outcomeEvents.record({
      merchantId: ticket.merchantId,
      ticketId: ticket.id,
      orderId: ticket.orderId,
      customerId: ticket.customerId,
      variantId,
      stageKey,
      sentimentAtSend: ticket.sentiment,
      kind: "reply_sent",
      observedAt: new Date().toISOString(),
      meta: { editedRatio: editedRatio(draftedText, sentText) },
    });
  } catch (err) {
    console.log(
      JSON.stringify({
        event: "outcome-event.record-failed",
        ticketId: ticket.id,
        error: err instanceof Error ? err.message : String(err),
      }),
    );
  }
}

/** Reply-attribution window (ADR-0012): an inbound this long after a reply_sent
 *  still counts as a response to that reply. Seven days mirrors the ledger's
 *  other windows and Visa's dispute clock granularity. */
const REPLY_ATTRIBUTION_WINDOW_MS = 7 * 86400000;

/**
 * Outcome ledger (ADR-0012, E2): the CUSTOMER-side half of the loop. When a new
 * inbound lands on an order that had a reply_sent within the 7-day attribution
 * window, emit a `customer_replied` (carrying the inbound's inferred sentiment in
 * meta.respondedSentiment), attributed to that reply's variant so it folds into
 * the panel. If the ticket that reply was sent on is already sent/resolved, also
 * emit `reopened`. Best-effort — the ticket is already persisted, so a ledger
 * failure is logged and swallowed, never blocking ingest (mirrors recordReplySent).
 */
async function recordReplyAttribution(repos: Repositories, ticket: Ticket): Promise<void> {
  try {
    const events = await repos.outcomeEvents.listByMerchant(ticket.merchantId);
    const inboundMs = new Date(ticket.createdAt).getTime();
    // Most recent reply_sent for THIS order whose age at the inbound is within
    // the window (and not in the future — an inbound can't answer a later reply).
    const reply = events
      .filter((e) => e.kind === "reply_sent" && e.orderId === ticket.orderId)
      .filter((e) => {
        const gap = inboundMs - new Date(e.observedAt).getTime();
        return gap >= 0 && gap <= REPLY_ATTRIBUTION_WINDOW_MS;
      })
      .sort((a, b) => new Date(b.observedAt).getTime() - new Date(a.observedAt).getTime())[0];
    if (!reply) return; // no reply to attribute a response to — nothing to record.

    // Attribution mirrors the reply's identity (same variant/stage), stamped onto
    // the NEW inbound ticket; the response's own sentiment rides in meta.
    const base = {
      merchantId: ticket.merchantId,
      ticketId: ticket.id,
      orderId: ticket.orderId,
      customerId: ticket.customerId,
      variantId: reply.variantId,
      stageKey: reply.stageKey,
      sentimentAtSend: reply.sentimentAtSend,
      observedAt: ticket.createdAt,
    };
    await repos.outcomeEvents.record({
      ...base,
      kind: "customer_replied",
      meta: { respondedSentiment: ticket.sentiment },
    });

    // Reopen: the reply landed on a ticket that was already closed out, and here's
    // the customer back again — a measured signal the reply didn't fully settle it.
    // Count it AT MOST ONCE per reply: a customer who writes back three times to one
    // resolved thread reopened it once, not three times. Without this, reopens could
    // exceed sends and the panel's reopen rate would read over 100%.
    const alreadyReopened = events.some(
      (e) => e.kind === "reopened" && e.orderId === ticket.orderId && e.variantId === reply.variantId,
    );
    const priorTicket = await repos.tickets.findById(reply.ticketId);
    if (
      !alreadyReopened &&
      priorTicket &&
      (priorTicket.status === "sent" || priorTicket.status === "resolved")
    ) {
      await repos.outcomeEvents.record({ ...base, kind: "reopened" });
    }
  } catch (err) {
    console.log(
      JSON.stringify({
        event: "outcome-event.attribution-failed",
        ticketId: ticket.id,
        error: err instanceof Error ? err.message : String(err),
      }),
    );
  }
}

/**
 * Ingest a normalized inbound ticket: dedupe, match order/customer, persist,
 * auto-draft. Vendor retries redeliver the same event, so a ticket already
 * ingested for (merchantId, channel, externalId) is returned as-is — no new
 * ticket, no re-draft. A truly-concurrent redelivery that races the pre-lookup
 * is caught by the DB unique index and de-duped via the 11000 handler below.
 */
export async function ingestTicket(
  n: NormalizedTicket,
): Promise<{ ticket: Ticket; duplicate?: boolean } | { error: string }> {
  const repos = getRepositories();
  const merchant = await repos.merchants.findById(n.merchantId);
  if (!merchant) return { error: "unknown merchant" };

  if (n.externalId) {
    const existing = await repos.tickets.findByExternalId(n.merchantId, n.channel, n.externalId);
    if (existing) return { ticket: existing, duplicate: true };
  }

  let customer = await repos.customers.findByEmail(n.merchantId, n.customerEmail);
  // Scope the order_ref lookup to THIS merchant — a payload citing another
  // merchant's order id must never attach that order (cross-merchant data leak).
  let order: Order | null = n.orderRef ? await repos.orders.findById(n.orderRef) : null;
  if (order && order.merchantId !== n.merchantId) order = null;
  if (!order && customer) {
    const orders = await repos.orders.listByCustomer(customer.id);
    order = orders[0] ?? null;
  }
  if (!order || !customer) {
    // demo fallback: attach to the merchant's most-waited open order so the
    // native widget always lands somewhere sensible.
    const orders = await repos.orders.listByMerchant(n.merchantId);
    order = order ?? orders.sort((a, b) => a.fulfillmentStart.localeCompare(b.fulfillmentStart))[0] ?? null;
    customer = customer ?? (order ? await repos.customers.findById(order.customerId) : null);
  }
  if (!order || !customer) return { error: "could not match an order" };

  const drafter = getDrafter();
  const drafted = await drafter.draft({ ticket: { sentiment: n.sentiment } as Ticket, order, customer, merchant });

  const catalog = await repos.gifts.listByMerchant(merchant.id);
  const ticketsLast7d = await ticketsLast7dFor(merchant.id, customer.id);
  const intel = computeTicketIntelligence({
    ticket: { sentiment: n.sentiment } as Ticket,
    order,
    customer,
    merchant,
    catalog,
    ticketsLast7d,
  });

  // Outcome ledger (ADR-0007): stamp the draft with the variant that produced it.
  const variantId = await resolveVariantId(repos, merchant.id, intel.reassurance);

  const ticket: Ticket = {
    id: newId("tkt"),
    merchantId: merchant.id,
    customerId: customer.id,
    orderId: order.id,
    channel: n.channel,
    externalId: n.externalId,
    subject: n.subject,
    body: n.body,
    type: n.type,
    sentiment: n.sentiment,
    createdAt: n.createdAt,
    firstResponseSec: null,
    status: "drafted",
    draft: {
      ...intelToDraft(intel),
      text: drafted.text,
      confidenceBand: drafted.confidenceBand,
      priority: drafted.priority,
      draftedBy: drafted.draftedBy,
      ...(variantId ? { variantId } : {}),
    },
    tags: ["presale", `presale:${n.type}`].concat(
      n.sentiment === "chargeback-threat" ? ["presale:dispute-risk"] : [],
    ),
  };
  try {
    await repos.tickets.create(ticket);
  } catch (err) {
    // Truly-concurrent redelivery can slip past the pre-lookup above; the mongo
    // driver's unique (merchantId, channel, externalId) index is the backstop.
    // A duplicate-key error means another delivery won the race — return the
    // winner as the dedupe result instead of double-creating. The single-process
    // JSON driver has no such constraint and never throws this, so this stays a
    // no-op path there.
    if (n.externalId && isDuplicateKeyError(err)) {
      const existing = await repos.tickets.findByExternalId(n.merchantId, n.channel, n.externalId);
      if (existing) return { ticket: existing, duplicate: true };
    }
    throw err;
  }
  await repos.customers.update(customer.id, {
    ticketCount: customer.ticketCount + 1,
    lastSentiment: n.sentiment,
  });
  // Outcome ledger (ADR-0012, E2): attribute a customer_replied (+ reopened) to a
  // recent reply on this order. Best-effort — never blocks the ingest result.
  await recordReplyAttribution(repos, ticket);
  return { ticket };
}

export async function regenerateDraft(ticketId: string): Promise<Ticket | null> {
  const repos = getRepositories();
  const view = await getTicketView(ticketId);
  if (!view) return null;
  const draft = intelToDraft(view.intel);
  // Outcome ledger (ADR-0007): carry variant attribution onto the persisted draft.
  const variantId = await resolveVariantId(repos, view.merchant.id, view.intel.reassurance);
  if (variantId) draft.variantId = variantId;
  return repos.tickets.update(ticketId, { draft, status: "drafted" });
}

export async function approveSend(
  ticketId: string,
  approvedText?: string,
  channelOverride?: Ticket["channel"],
): Promise<{ ticket: Ticket } | { error: string }> {
  const repos = getRepositories();
  const ticket = await repos.tickets.findById(ticketId);
  if (!ticket) return { error: "ticket not found" };
  // Idempotent: an already-sent ticket must not re-send or emit a second
  // reply_sent event on a retry (that would double-count the outcome ledger).
  if (ticket.status === "sent") return { ticket };
  const text = approvedText ?? ticket.draft?.text;
  if (!text) return { error: "no draft to send" };

  const channel = channelOverride ?? ticket.channel;
  const adapter = getSendAdapter(channel);
  const { externalId, sentAt } = await adapter.sendReply(ticketId, text);

  const firstResponseSec = Math.max(
    0,
    Math.round((new Date(sentAt).getTime() - new Date(ticket.createdAt).getTime()) / 1000),
  );

  const updated = await repos.tickets.update(ticketId, {
    status: "sent",
    sent: { text, approvedBy: process.env.DEMO_OPERATOR_NAME ?? "Dylan", sentAt, externalId },
    firstResponseSec,
  });

  // Outcome ledger (ADR-0007): stamp a reply_sent event attributed to the draft's
  // variant, with meta.editedRatio measuring the operator's edit. Awaited so a
  // same-request read observes it, but non-blocking on failure (see helper).
  await recordReplySent(repos, ticket, text);

  return { ticket: updated };
}

/** Operator queue: every open/drafted ticket with computed risk, sorted. */
export interface QueueRow {
  ticket: Ticket;
  customer: Customer;
  order: Order;
  riskScore: number;
  band: string;
  color: string;
  daysInWait: number;
  priorityRank: number;
}

export async function getQueue(merchantId: string, now: Date = new Date()): Promise<QueueRow[]> {
  const repos = getRepositories();
  const merchant = await repos.merchants.findById(merchantId);
  if (!merchant) return [];
  const tickets = await repos.tickets.list({ merchantId });
  const rows: QueueRow[] = [];
  for (const ticket of tickets) {
    const [order, customer] = await Promise.all([
      repos.orders.findById(ticket.orderId),
      repos.customers.findById(ticket.customerId),
    ]);
    if (!order || !customer) continue;
    const timeline = computeTimeline(order, merchant, now);
    const ticketsLast7d = await ticketsLast7dFor(merchantId, customer.id);
    const risk = scoreRefundRisk({
      order,
      customer,
      daysInWait: timeline.daysInWait,
      fulfillmentWindowMaxDays: merchant.fulfillmentWindowDays.max,
      stageCeilDay: stageCeilDayFor(merchant.stages, order.productionStage),
      sentiment: ticket.sentiment,
      ticketsLast7d,
    });
    rows.push({
      ticket,
      customer,
      order,
      riskScore: risk.riskScore,
      band: risk.band,
      color: risk.color,
      daysInWait: timeline.daysInWait,
      priorityRank: risk.priorityRank,
    });
  }
  return rows.sort(
    (a, b) =>
      a.priorityRank - b.priorityRank ||
      new Date(a.ticket.createdAt).getTime() - new Date(b.ticket.createdAt).getTime(),
  );
}

/** Merchant refund-risk dashboard view model — all proof-only (deltas vs baseline). */
export interface DashboardView {
  merchant: Merchant;
  baseline: Merchant["baseline"];
  live: {
    medianFrtSec: number | null;
    wismoPer100Orders: number;
    sentCount: number;
    savesCount: number;
    deflectionPct: number | null;
  };
  riskCurve: Array<{ label: string; risk: number; color: string }>;
  atRisk: QueueRow[];
  ordersInWindow: number;
}

function median(nums: number[]): number | null {
  if (nums.length === 0) return null;
  const s = [...nums].sort((a, b) => a - b);
  const mid = Math.floor(s.length / 2);
  return s.length % 2 ? s[mid] : Math.round((s[mid - 1] + s[mid]) / 2);
}

export async function getDashboard(merchantId: string, now: Date = new Date()): Promise<DashboardView | null> {
  const repos = getRepositories();
  const merchant = await repos.merchants.findById(merchantId);
  if (!merchant) return null;

  const [tickets, orders, queue] = await Promise.all([
    repos.tickets.list({ merchantId }),
    repos.orders.listByMerchant(merchantId),
    getQueue(merchantId, now),
  ]);

  const sent = tickets.filter((t) => t.status === "sent" && t.firstResponseSec != null);
  const medianFrtSec = median(sent.map((t) => t.firstResponseSec as number));
  const wismo = tickets.filter((t) => t.type === "wismo").length;
  const wismoPer100Orders = orders.length ? Math.round((wismo / orders.length) * 100) : 0;

  // a "save": a dispute-risk ticket that got an approved reply, or a gift sent.
  const savesCount = tickets.filter(
    (t) =>
      (t.tags.includes("presale:dispute-risk") && t.status === "sent") ||
      t.tags.some((x) => x.startsWith("gift-sent:")),
  ).length;

  const resolved = tickets.filter((t) => t.status === "sent" || t.status === "resolved").length;
  const deflectionPct = tickets.length ? Math.round((resolved / tickets.length) * 100) : null;

  const riskCurve = queue
    .slice(0, 24)
    .map((r) => ({ label: r.customer.firstName, risk: r.riskScore, color: r.color }))
    .sort((a, b) => b.risk - a.risk);

  return {
    merchant,
    baseline: merchant.baseline,
    live: {
      medianFrtSec,
      wismoPer100Orders,
      sentCount: sent.length,
      savesCount,
      deflectionPct,
    },
    riskCurve,
    atRisk: queue.filter((r) => r.band !== "standard"),
    ordersInWindow: orders.length,
  };
}

/**
 * Script Performance (ADR-0007, task E3): the "measured, not invented" surface.
 * One row per script variant, carrying only facts folded out of the reply_sent
 * outcome ledger — it INVENTS NOTHING.
 */
export interface ScriptPerformanceRow {
  variant: ScriptVariant;
  /** count of kind==='reply_sent' events attributed to this variant. */
  sends: number;
  /** mean of meta.editedRatio over those sends, or null when the variant has none. */
  avgEditedRatio: number | null;
  /** sample size == sends; surfaces gate any rate on this vs SCRIPT_PERF_MIN_N. */
  n: number;

  // ── ADR-0012 (E2) customer-side outcome facts ──────────────────────────────
  // Each RATE below is gated to null unless its OWN sample reaches
  // SCRIPT_PERF_MIN_N, so a small, noisy sample can never surface a rate. The
  // raw counts are always present so the surface can show "collecting data (n=X)".
  /** count of kind==='customer_replied' events attributed to this variant. */
  customerReplies: number;
  /** calm respondedSentiment / all customer_replied — null below the reply threshold. */
  calmResponseRate: number | null;
  /** count of kind==='reopened' events attributed to this variant. */
  reopens: number;
  /** reopened / sends — null below the sends threshold. */
  reopenRate: number | null;
  /** csat_up + csat_down count attributed to this variant. */
  csatResponses: number;
  /** csat_up / (csat_up + csat_down) — null below the csat threshold. */
  csatRate: number | null;
}

/**
 * Minimum sends before an edit-rate is trustworthy enough to show. Below it the
 * surface renders "collecting data (n=X)" instead of a rate — small-sample
 * humility is a proof-only discipline, never a UI nicety. The rollup itself
 * never suppresses; it reports the raw stat and the caller applies the floor.
 */
export const SCRIPT_PERF_MIN_N = 20;

interface VariantStats {
  sends: number;
  ratios: number[];
  customerReplies: number;
  calmReplies: number;
  reopens: number;
  csatUp: number;
  csatDown: number;
}
const emptyStats = (): VariantStats => ({
  sends: 0,
  ratios: [],
  customerReplies: 0,
  calmReplies: 0,
  reopens: 0,
  csatUp: 0,
  csatDown: 0,
});

/**
 * Pure aggregation: fold the ledger's events by variantId onto the merchant's
 * variants. Deterministic — variants keep their input order, never ranked by
 * performance. Folds the E1 send facts (kind==='reply_sent': `sends` +
 * meta.editedRatio) plus the E2 customer-side outcomes (customer_replied /
 * reopened / csat_up / csat_down). A send with no editedRatio is still counted in
 * `sends` but EXCLUDED from the mean — a missing measurement must not bias a
 * variant's edit-rate downward (proof-only discipline even off the seed path).
 *
 * Every RATE is gated to null unless its own sample reaches SCRIPT_PERF_MIN_N, so
 * a small sample can never surface a rate; the raw counts always accompany it so
 * the caller can render "collecting data (n=X)". Exported so the rollup is
 * unit-testable with synthetic data.
 */
export function aggregateScriptPerformance(
  variants: ScriptVariant[],
  events: OutcomeEvent[],
): ScriptPerformanceRow[] {
  const statsByVariant = new Map<string, VariantStats>();
  const statsFor = (variantId: string): VariantStats => {
    let s = statsByVariant.get(variantId);
    if (!s) {
      s = emptyStats();
      statsByVariant.set(variantId, s);
    }
    return s;
  };
  for (const e of events) {
    const s = statsFor(e.variantId);
    switch (e.kind) {
      case "reply_sent":
        s.sends += 1;
        if (typeof e.meta?.editedRatio === "number") s.ratios.push(e.meta.editedRatio);
        break;
      case "customer_replied":
        s.customerReplies += 1;
        if (e.meta?.respondedSentiment === "calm") s.calmReplies += 1;
        break;
      case "reopened":
        s.reopens += 1;
        break;
      case "csat_up":
        s.csatUp += 1;
        break;
      case "csat_down":
        s.csatDown += 1;
        break;
      default:
        break; // refund_requested / chargeback / resolved_quiet: not surfaced here.
    }
  }
  return variants.map((variant) => {
    const s = statsByVariant.get(variant.id) ?? emptyStats();
    const avgEditedRatio =
      s.ratios.length === 0 ? null : s.ratios.reduce((a, b) => a + b, 0) / s.ratios.length;
    const csatResponses = s.csatUp + s.csatDown;
    return {
      variant,
      sends: s.sends,
      avgEditedRatio,
      n: s.sends,
      customerReplies: s.customerReplies,
      calmResponseRate:
        s.customerReplies >= SCRIPT_PERF_MIN_N ? s.calmReplies / s.customerReplies : null,
      reopens: s.reopens,
      // Capped at 1: reopens are deduped per reply at emit time, but a defensive
      // ceiling guarantees the panel can never render a nonsensical >100% rate.
      reopenRate: s.sends >= SCRIPT_PERF_MIN_N ? Math.min(1, s.reopens / s.sends) : null,
      csatResponses,
      csatRate: csatResponses >= SCRIPT_PERF_MIN_N ? s.csatUp / csatResponses : null,
    };
  });
}

/**
 * Per-variant send stats for a merchant, measured from the outcome ledger. Reads
 * the merchant's variants + its reply_sent events and rolls them up (see
 * `aggregateScriptPerformance`). Read-only — no schema change, no attribution
 * write. Demo lineage is not laundered here: the surface renders a SAMPLE DATA
 * watermark for isDemo merchants so a seeded stat never reads as a real one.
 */
export async function computeScriptPerformance(merchantId: string): Promise<ScriptPerformanceRow[]> {
  const repos = getRepositories();
  const [variants, events] = await Promise.all([
    repos.scriptVariants.listByMerchant(merchantId),
    repos.outcomeEvents.listByMerchant(merchantId),
  ]);
  return aggregateScriptPerformance(variants, events);
}
