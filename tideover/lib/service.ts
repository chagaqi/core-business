import { newId } from "@/lib/ids";
import { getRepositories, type Repositories } from "@/lib/repositories";
import { resolveDatastoreModeFromRequest } from "@/lib/request-mode";
import { computeTimeline } from "@/lib/time";
import {
  computeTicketIntelligence,
  scoreRefundRisk,
  stageCeilDayFor,
  type ReassuranceResult,
  type TicketIntelligence,
} from "@/lib/engines";
import { getDrafter } from "@/lib/drafting/LlmDrafter";
import { activeCatalog } from "@/lib/gift-catalog";
import { getSendAdapter } from "@/lib/channel-adapters/registry";
import { computeDisputeExposure, type DisputeExposure } from "@/lib/dispute-exposure";
import { computeSlaAttainment, ticketSlaState, type SlaAttainment } from "@/lib/sla";
import { formatEscalationTag, isEscalationTag, isFlagged } from "@/lib/escalation";
import { isBaselineMeasured, measureCohort } from "@/lib/baseline";
import { containsHardDate } from "@/lib/proof";
import { computeSetupChecklist, type SetupChecklist } from "@/lib/setup";
import { measureQueue, rankQueue, type QueueDistribution, type RowRanking } from "@/lib/queue-rank";
import { deflectionGap, measureDeflection, type DeflectionMeasure } from "@/lib/deflection";
import { currentBoard, formatWeeksBand, scopeApplies } from "@/lib/status-board";
import type { BaselineCohort, ProductionStatusEntry } from "@/lib/types";
import {
  embeddedBandPhrase,
  generateAlternates,
  type DraftAlternates,
} from "@/lib/draft-alternates";
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
  const catalog = activeCatalog(merchant, await repos.gifts.listByMerchant(merchant.id));
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

/**
 * C2 — the three toggleable drafts {standard, brief, de-escalate} for one ticket.
 *
 * Reuses getTicketView (unchanged shape) for the standard draft, then CALLS the
 * reassurance engine a second time via computeTicketIntelligence with the ticket's
 * sentiment overridden to the highest-distress path — the engine's own most-
 * reassuring output — for the de-escalate view. The engine is never modified; only
 * its input sentiment changes, so the goldens/invariants stay byte-stable.
 * `brief` is a deterministic proof-preserving shortening of the standard draft
 * (see lib/draft-alternates). Returns null when the ticket can't be resolved.
 */
export async function getDraftAlternates(
  ticketId: string,
  now: Date = new Date(),
): Promise<DraftAlternates | null> {
  const view = await getTicketView(ticketId, now);
  if (!view) return null;
  const { ticket, order, customer, merchant, timeline } = view;
  const standard = view.intel.reassurance.draftText;

  // De-escalate: recompute the engine with sentiment overridden to the calmest/
  // highest-reassurance path. This CALLS the engine with a different input — it
  // does not change engine logic. draftText is currently sentiment-invariant, so
  // this commonly equals `standard`; that is acceptable and honest.
  const repos = getRepositories();
  const catalog = activeCatalog(merchant, await repos.gifts.listByMerchant(merchant.id));
  const ticketsLast7d = await ticketsLast7dFor(merchant.id, customer.id);
  const deEscalateIntel = computeTicketIntelligence({
    ticket: { ...ticket, sentiment: "chargeback-threat" },
    order,
    customer,
    merchant,
    catalog,
    ticketsLast7d,
    now,
  });
  const deEscalate = deEscalateIntel.reassurance.draftText;

  const bandPhrase = embeddedBandPhrase(timeline.confidenceBand, timeline.overdue);
  return generateAlternates({ standard, deEscalate, bandPhrase, signoff: merchant.brand.signoff });
}

/**
 * "Previously told" (C3): the customer's MOST RECENT prior SENT reply, or null.
 * Surfaced ABOVE a new draft so the operator keeps it consistent and never walks
 * back a promise already made — the proof doctrine extended across messages.
 *
 * Pure orchestration over repos.tickets.list({merchantId, customerId}), so it
 * behaves identically on the JSON and Mongo drivers. It returns the merchant's
 * OWN earlier message verbatim (the sent text + the confidence band that reply
 * quoted, when one was stamped on its draft) — never a fabricated summary, never
 * a new date. `currentTicketId` is excluded so the ticket being handled never
 * quotes itself; `now` bounds the search to replies already sent (a reply dated
 * after the evaluation instant is not something they were "previously told").
 */
export interface PriorSentReply {
  ticketId: string;
  text: string;
  sentAt: string;
  band: string | null;
}

export async function getPreviouslyTold(
  merchantId: string,
  customerId: string,
  currentTicketId: string,
  now: Date = new Date(),
): Promise<PriorSentReply | null> {
  const repos = getRepositories();
  const nowMs = now.getTime();
  const prior = (await repos.tickets.list({ merchantId, customerId }))
    .filter(
      (t) =>
        // A delivered reply is anything with sent.text — its ticket may since have
        // moved to "resolved", but the customer was still told it, so it still
        // counts. Keying on sent.text (not status) keeps the strip correct once
        // real tickets get resolved.
        t.id !== currentTicketId &&
        !!t.sent?.text &&
        new Date(t.sent.sentAt).getTime() <= nowMs,
    )
    .sort((a, b) => new Date(b.sent!.sentAt).getTime() - new Date(a.sent!.sentAt).getTime())[0];
  if (!prior || !prior.sent) return null;
  return {
    ticketId: prior.id,
    text: prior.sent.text,
    sentAt: prior.sent.sentAt,
    band: prior.draft?.confidenceBand ?? null,
  };
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
 *
 * Returns the {variantId, editedRatio} it recorded so the caller (approveSend)
 * can offer the E4 operator-promoted-variant flow (variantId = the parent, and
 * editedRatio measured against PROMOTE_THRESHOLD). Returns null when the reply
 * could not be attributed (nothing recorded) or on a swallowed failure.
 */
async function recordReplySent(
  repos: Repositories,
  ticket: Ticket,
  sentText: string,
): Promise<{ variantId: string; editedRatio: number } | null> {
  // Phase 1 — resolve attribution. This is genuinely best-effort: if we can't
  // identify the variant/draft that produced the reply, the send is simply
  // un-attributable and we skip (return null). A missing attribution is not a lost
  // proof metric, so a failure resolving it stays swallowed (returns null).
  let attribution: { variantId: string; stageKey: OutcomeEvent["stageKey"]; ratio: number };
  try {
    const view = await getTicketView(ticket.id);
    const reassurance = view?.intel.reassurance;
    const draftedText = ticket.draft?.text ?? reassurance?.draftText;
    const variantId =
      ticket.draft?.variantId ??
      (reassurance ? await resolveVariantId(repos, ticket.merchantId, reassurance) : undefined);
    if (variantId === undefined || draftedText === undefined) return null; // cannot attribute — skip.

    // stageKey must agree with variantId (they describe the same variant), so
    // source it from the resolved variant — not the send-time recompute, which
    // could drift to a later day-stage if the ticket sat drafted across a
    // boundary before being sent.
    const stageKey = (await repos.scriptVariants.getById(variantId))?.stageKey ?? reassurance?.stageKey;
    if (!stageKey) return null;

    attribution = { variantId, stageKey, ratio: editedRatio(draftedText, sentText) };
  } catch (err) {
    console.log(
      JSON.stringify({
        event: "outcome-event.attribution-failed",
        ticketId: ticket.id,
        error: err instanceof Error ? err.message : String(err),
      }),
    );
    return null;
  }

  // Phase 2 — the reply_sent write. This IS the core proof metric (deflection /
  // edit rate). EN-13: never SILENTLY discard a failure here — the old code caught
  // it, logged, and returned null, indistinguishable from an un-attributable skip,
  // so every dashboard silently undercounted. Retry once; if it still fails, THROW
  // so approveSend surfaces a "send completed but ledger unrecorded" warning. The
  // send itself already succeeded and is atomically claimed — this path never
  // un-sends or blocks it.
  let lastErr: unknown;
  for (let attempt = 1; attempt <= 2; attempt += 1) {
    try {
      await repos.outcomeEvents.record({
        merchantId: ticket.merchantId,
        ticketId: ticket.id,
        orderId: ticket.orderId,
        customerId: ticket.customerId,
        variantId: attribution.variantId,
        stageKey: attribution.stageKey,
        sentimentAtSend: ticket.sentiment,
        kind: "reply_sent",
        observedAt: new Date().toISOString(),
        meta: { editedRatio: attribution.ratio },
      });
      return { variantId: attribution.variantId, editedRatio: attribution.ratio };
    } catch (err) {
      lastErr = err;
      console.log(
        JSON.stringify({
          event: "outcome-event.record-failed",
          ticketId: ticket.id,
          attempt,
          willRetry: attempt < 2,
          error: err instanceof Error ? err.message : String(err),
        }),
      );
    }
  }
  // Both attempts failed — surface it instead of returning a clean null the caller
  // can't tell apart from a legitimate skip.
  throw lastErr instanceof Error ? lastErr : new Error(String(lastErr));
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
  // EN-36 — bound the ACK-path ledger scan. Attribution is per-ORDER: a
  // customer_replied / reopened is only ever attributed to a reply_sent on the
  // SAME order. An order-less (unmatched) inbound has nothing to attribute, so
  // skip the whole outcome-ledger read for it — otherwise every unmatched inbound
  // would scan the merchant's entire event ledger for a match that can't exist.
  // (A matched inbound still reads the ledger; a true per-inbound DB bound there
  // needs an order-scoped/indexed query on the repo, owned by the repository seam.)
  if (!ticket.orderId) return;
  try {
    const events = await repos.outcomeEvents.listByMerchant(ticket.merchantId);
    const inboundMs = new Date(ticket.createdAt).getTime();
    // Single pass over the ledger (rows arrive observedAt-ascending on both
    // drivers): find the most recent in-window reply_sent for THIS order, and note
    // which variants were already reopened on it — one scan instead of the prior
    // three filter/sort/some passes over the full collection. The reply selection
    // is identical: newest observedAt, with the smallest id winning a tie (strict
    // `>` keeps the first-seen, i.e. lowest-id, row among equal timestamps).
    let reply: OutcomeEvent | null = null;
    const reopenedVariantsForOrder = new Set<string>();
    for (const e of events) {
      if (e.orderId !== ticket.orderId) continue;
      if (e.kind === "reopened") {
        reopenedVariantsForOrder.add(e.variantId);
        continue;
      }
      if (e.kind !== "reply_sent") continue;
      const gap = inboundMs - new Date(e.observedAt).getTime();
      // In-window (and not in the future — an inbound can't answer a later reply).
      if (gap < 0 || gap > REPLY_ATTRIBUTION_WINDOW_MS) continue;
      if (reply === null || new Date(e.observedAt).getTime() > new Date(reply.observedAt).getTime()) {
        reply = e;
      }
    }
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
    // exceed sends and the panel's reopen rate would read over 100%. (Equivalent to
    // the prior `events.some(...)`, now read from the single-pass set above.)
    const alreadyReopened = reopenedVariantsForOrder.has(reply.variantId);
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
  opts?: {
    /**
     * Shorter LLM-draft deadline for latency-sensitive callers — the buyer-facing
     * widget (/api/widget-submit) passes INGEST_DRAFT_TIMEOUT_MS so a slow
     * provider can't hold the buyer's HTTP response for the full 8s default.
     * The deterministic fallback ignores it.
     */
    draftTimeoutMs?: number;
  },
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
  // An order_ref matched but the sender email isn't a known customer: attach the
  // cited order's OWN customer (its legitimate owner) — a real match, never a
  // stranger. This keeps the matched path below. (Unchanged behavior.)
  if (order && !customer) customer = await repos.customers.findById(order.customerId);

  // Nothing matched. The old fallback silently attached the ticket to the
  // merchant's OLDEST open order AND that order's customer, so risk/gift/
  // reassurance then ran against the WRONG person's LTV/order/value
  // (DATA-PROVENANCE-HANDOFF: unmatched-ticket mis-attribution). Never borrow a
  // stranger's order. Instead associate the ticket with a lightweight placeholder
  // customer keyed by the REAL sender's email (created once, reused on re-contact
  // so ticketCount accrues to the right person), leave it order-less, and flag it
  // needs-manual-match. With no order the per-ticket engines have nothing to
  // score, so the ticket is intentionally kept OUT of the order-derived cockpit —
  // getQueue / getTicketView already skip a ticket whose order doesn't resolve —
  // degrading to NO order-based factors, never wrong ones.
  if (!order) {
    customer =
      customer ??
      (await repos.customers.create({
        id: newId("cus"),
        merchantId: merchant.id,
        email: n.customerEmail,
        firstName: n.customerEmail.split("@")[0]?.trim() || "there",
        ltvCents: 0,
        orderIds: [],
        ticketCount: 0,
        lastSentiment: "calm",
      }));
  }
  // Only reachable if a matched order references a missing customer (corrupt/orphan
  // order); the placeholder branch above always yields a customer otherwise.
  if (!customer) return { error: "could not resolve a customer" };

  // Only a MATCHED order yields an order-derived draft: drafting/scoring reads the
  // order's timeline, value and stage, so running it on anything but the buyer's
  // real order is exactly the bug. Everything inside this guard is the ORIGINAL
  // matched-path logic, unchanged; an unmatched ticket simply carries no draft.
  let draft: DraftReply | undefined;
  if (order) {
    const drafter = getDrafter(
      opts?.draftTimeoutMs !== undefined ? { timeoutMs: opts.draftTimeoutMs } : undefined,
    );
    // subject/body ride along so the LLM drafter (ADR-0018) can ground the reply
    // in what the buyer actually wrote. `type` rides along because the floor is
    // TYPE-AWARE now (lib/drafting/safe-floor.ts): the reassurance engine answers
    // "where is my order" and nothing else, so a refund/deposit/other ticket must
    // not be answered with a production blurb that ignores what was asked.
    const drafted = await drafter.draft({
      ticket: { sentiment: n.sentiment, subject: n.subject, body: n.body, type: n.type } as Ticket,
      order,
      customer,
      merchant,
    });

    const catalog = activeCatalog(merchant, await repos.gifts.listByMerchant(merchant.id));
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
    draft = {
      ...intelToDraft(intel),
      text: drafted.text,
      confidenceBand: drafted.confidenceBand,
      priority: drafted.priority,
      draftedBy: drafted.draftedBy,
      ...(variantId ? { variantId } : {}),
    };
  }

  const ticket: Ticket = {
    id: newId("tkt"),
    merchantId: merchant.id,
    customerId: customer.id,
    // "" = no order. getQueue / getTicketView resolve this to null and skip the
    // ticket, so the cockpit never shows a fabricated order/LTV for an unmatched one.
    orderId: order ? order.id : "",
    channel: n.channel,
    externalId: n.externalId,
    subject: n.subject,
    body: n.body,
    type: n.type,
    sentiment: n.sentiment,
    createdAt: n.createdAt,
    firstResponseSec: null,
    status: order ? "drafted" : "open",
    ...(draft ? { draft } : {}),
    tags: ["presale", `presale:${n.type}`]
      .concat(n.sentiment === "chargeback-threat" ? ["presale:dispute-risk"] : [])
      .concat(order ? [] : ["presale:unmatched"]),
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

/**
 * Operator-promoted variants (ADR-0014, E4): the threshold, on `editedRatio`,
 * above which a send's edit is meaningful enough that the cockpit offers to save
 * it as a tracked variant. Operator-confirmed on the client — never auto-created.
 */
export const PROMOTE_THRESHOLD = 0.3;

/** Base origin for customer-facing links. Tied to the request's DATASTORE mode
 *  (ADR-0017): a real merchant's order + statusToken live only in tideover_live,
 *  served only on the real host — so in real mode the link MUST point there, not
 *  at the global APP_URL/demo default (else the backer gets a dead link resolved
 *  against the demo store). Mirrors lib/ingest-templates so both surfaces agree. */
function appUrl(): string {
  if (resolveDatastoreModeFromRequest() === "real") {
    return `https://${(process.env.REAL_APP_HOST ?? "app.tideover.app").replace(/\/$/, "")}`;
  }
  return (process.env.APP_URL ?? "https://www.tideover.app").replace(/\/$/, "");
}

/**
 * PR-02 — the customer's status link, appended to the approved reply at SEND
 * TIME in the SERVICE layer (never inside the reassurance engine, so the eval
 * harness's goldens/invariants stay byte-stable). Proof-only safe: the line
 * carries no date and no metric, only the order's opaque status token. Returns
 * the text unchanged when the ticket has no resolved order — there's nothing to
 * link to (an unmatched ticket).
 */
function withStatusLink(text: string, order: Order | null): string {
  if (!order) return text;
  return `${text.trimEnd()}\n\nTrack your order anytime: ${appUrl()}/status/${order.statusToken}`;
}

/** Statuses a ticket can be sent FROM — every state except an already-sent one.
 *  Used as the compare-and-set guard so a send is claimed exactly once. */
const SENDABLE_STATUSES: Ticket["status"][] = ["open", "drafted", "approved", "resolved"];

/**
 * Send result carries the two E4 facts the cockpit needs after a send:
 * `editedRatio` (the measured operator edit) and `canPromote` (that edit cleared
 * PROMOTE_THRESHOLD AND the reply was attributable to a parent variant, so a
 * promotion has a real provenance to carry). Both derive from the same
 * recordReplySent attribution — no re-computation, no fabricated number.
 * `alreadySent` is true when this call did NOT perform the send (the ticket was
 * already delivered, or a concurrent approve won the race) — the cockpit still
 * copies the stored reply and shows the confirmation, but records nothing.
 */
export async function approveSend(
  ticketId: string,
  approvedText?: string,
  channelOverride?: Ticket["channel"],
): Promise<
  | { ticket: Ticket; editedRatio: number; canPromote: boolean; alreadySent: boolean }
  | { error: string }
> {
  const repos = getRepositories();
  const ticket = await repos.tickets.findById(ticketId);
  if (!ticket) return { error: "ticket not found" };
  // Tenant gate (ADR-0020): the TICKETS repository is not tenant-scoped, so a
  // caller-supplied ticketId can resolve a foreign tenant's ticket. Resolve the
  // ticket's merchant through the SCOPED merchants seam BEFORE any read of the
  // ticket's contents (including the already-sent fast path below) or any
  // mutation. Under a scoped request a foreign merchant resolves to null —
  // indistinguishable from "does not exist" (mirrors getTicketView). Demo and
  // unscoped requests resolve their merchants exactly as before.
  const merchant = await repos.merchants.findById(ticket.merchantId);
  if (!merchant) return { error: "ticket not found" };
  // Idempotent fast path: an already-sent ticket must not re-send or emit a
  // second reply_sent event. Return the STORED reply so a double-click / retry
  // still copies the same text and shows the confirmation.
  if (ticket.status === "sent") {
    return { ticket, editedRatio: 0, canPromote: false, alreadySent: true };
  }
  const baseText = approvedText ?? ticket.draft?.text;
  if (!baseText) return { error: "no draft to send" };

  const order = ticket.orderId ? await repos.orders.findById(ticket.orderId) : null;
  // A real merchant routes to the ManualAdapter (a true record of the human
  // paste); a demo merchant keeps the simulated MockAdapter send so the seeded
  // walk is unchanged.
  const isDemo = merchant.isDemo || merchant.helpdesk === "mock";
  const channel = channelOverride ?? ticket.channel;
  const adapter = getSendAdapter(channel, isDemo);
  const { externalId, sentAt } = await adapter.sendReply(ticketId, baseText);

  // The delivered reply = the operator's approved text PLUS the customer's status
  // link. The link is appended here, after the edit is captured, so the outcome
  // ledger below measures only the operator's edit — not the appended link.
  const sentText = withStatusLink(baseText, order);
  const firstResponseSec = Math.max(
    0,
    Math.round((new Date(sentAt).getTime() - new Date(ticket.createdAt).getTime()) / 1000),
  );

  // EN-09/PR-10 — atomic claim: transition to "sent" ONLY if the ticket hasn't
  // already been sent. A second concurrent approve (double-click / two tabs)
  // finds status === "sent" here, gets null, and is rejected — no double-send.
  const updated = await repos.tickets.compareAndSetStatus(ticketId, SENDABLE_STATUSES, {
    status: "sent",
    sent: { text: sentText, approvedBy: process.env.DEMO_OPERATOR_NAME ?? "Dylan", sentAt, externalId },
    firstResponseSec,
  });
  if (!updated) {
    // Lost the race: another approve already claimed this ticket. Return its
    // stored reply as an already-sent result; do NOT record a second outcome.
    const current = await repos.tickets.findById(ticketId);
    return current
      ? { ticket: current, editedRatio: 0, canPromote: false, alreadySent: true }
      : { error: "ticket not found" };
  }

  // Outcome ledger (ADR-0007): the WINNER stamps exactly one reply_sent event
  // attributed to the draft's variant, meta.editedRatio measuring the operator's
  // edit (against the base text, link excluded). Awaited so a same-request read
  // observes it.
  let attribution: { variantId: string; editedRatio: number } | null = null;
  try {
    attribution = await recordReplySent(repos, ticket, baseText);
  } catch (err) {
    // EN-13: the send is delivered and atomically claimed (status=sent) — we do
    // NOT undo it. But the reply_sent write failed even after a retry, so this send
    // will undercount in the proof metrics. Surface it loudly rather than returning
    // a clean success as though it were recorded. `attribution` stays null, so we
    // never fabricate an editedRatio / promotion offer for an unrecorded send.
    console.error(
      JSON.stringify({
        event: "approve-send.ledger-unrecorded",
        ticketId,
        merchantId: ticket.merchantId,
        error: err instanceof Error ? err.message : String(err),
      }),
    );
  }

  return {
    ticket: updated,
    editedRatio: attribution?.editedRatio ?? 0,
    // Offer the promote flow only when the edit is meaningful AND the reply had a
    // real parent variant to promote from (attribution !== null).
    canPromote: attribution != null && attribution.editedRatio > PROMOTE_THRESHOLD,
    alreadySent: false,
  };
}

/**
 * Operator-promoted variant (ADR-0014, E4): save the operator's edited reply as a
 * new, tracked ScriptVariant so it competes in the Script Performance panel. The
 * new variant inherits its parent's slot (stageKey + productionStage) and carries
 * real provenance (source "operator-promoted", parentVariantId). Operator-
 * confirmed via the cockpit — this fn is only reached after an explicit save.
 *
 * The parent is resolved exactly as the send-time attribution does: the draft's
 * stamped variantId, or the engine recompute for the demo's live-rendered drafts.
 * Guard: promotion requires a parent (no parent → nothing to descend from).
 * Proof-only: a promoted variant is customer-facing template copy, so it is
 * rejected if it contains a hard delivery date (mirrors assertNoHardDate).
 */
export async function promoteVariant(
  ticketId: string,
  text: string,
): Promise<{ variant: ScriptVariant } | { error: string }> {
  const repos = getRepositories();
  const trimmed = text.trim();
  if (!trimmed) return { error: "empty variant text" };
  if (containsHardDate(trimmed)) {
    return { error: "variant text contains a hard delivery date — use a confidence band instead" };
  }
  const ticket = await repos.tickets.findById(ticketId);
  if (!ticket) return { error: "ticket not found" };

  // Tenant gate (ADR-0020): getTicketView resolves the ticket's merchant
  // through the SCOPED merchants seam, so a scoped request on a foreign
  // tenant's ticket gets null here. Stop BEFORE deriving a parent from
  // ticket.draft — a foreign ticket must never seed a variant.
  const view = await getTicketView(ticketId);
  if (!view) return { error: "ticket not found" };
  const reassurance = view.intel.reassurance;
  const parentVariantId =
    ticket.draft?.variantId ??
    (reassurance ? await resolveVariantId(repos, ticket.merchantId, reassurance) : undefined);
  if (!parentVariantId) return { error: "no parent variant to promote from" };
  const parent = await repos.scriptVariants.getById(parentVariantId);
  if (!parent) return { error: "parent variant not found" };

  const variant: ScriptVariant = {
    id: newId("var"),
    merchantId: ticket.merchantId,
    stageKey: parent.stageKey,
    productionStage: parent.productionStage,
    text: trimmed,
    source: "operator-promoted",
    isDefault: false,
    status: "active",
    parentVariantId: parent.id,
    createdAt: new Date().toISOString(),
  };
  const created = await repos.scriptVariants.create(variant);
  return { variant: created };
}

/**
 * Escalate self-flag (UX-10 / EN-25): persist an operator's follow-up flag on the
 * ticket by writing an `escalated-by:{operator}:{iso}` tag through the repository
 * seam — no new schema field, works on both drivers, survives a refresh. This is
 * a self-flag, NOT a manager notification: nothing is dispatched to anyone.
 *
 * Idempotent + re-stampable: any prior escalation tag is dropped before the new
 * one is written, so re-escalating simply refreshes the operator/instant/reason
 * (never accumulating duplicate flags). `undo` clears the flag entirely.
 */
export async function escalateTicket(
  ticketId: string,
  operator: string,
  opts: { reason?: string; undo?: boolean } = {},
): Promise<{ ticket: Ticket; escalated: boolean } | { error: string }> {
  const repos = getRepositories();
  const ticket = await repos.tickets.findById(ticketId);
  if (!ticket) return { error: "ticket not found" };
  // Tenant gate (ADR-0020): the tickets repository is not tenant-scoped —
  // resolve the ticket's merchant through the SCOPED merchants seam before the
  // tags mutation below. Foreign merchant → null → "not found", never a write.
  const merchant = await repos.merchants.findById(ticket.merchantId);
  if (!merchant) return { error: "ticket not found" };

  // Drop any existing escalation flag first, so re-flagging re-stamps rather than
  // piling on a second tag, and undo removes it cleanly.
  const withoutFlag = ticket.tags.filter((t) => !isEscalationTag(t));
  if (opts.undo) {
    const updated = await repos.tickets.update(ticketId, { tags: withoutFlag });
    return { ticket: updated, escalated: false };
  }
  const tags = [...withoutFlag, formatEscalationTag(operator, new Date(), opts.reason)];
  const updated = await repos.tickets.update(ticketId, { tags });
  return { ticket: updated, escalated: true };
}

/**
 * Operator queue: every ticket with a resolvable order, carrying its risk AND its
 * position in the merchant's OWN live distribution (lib/queue-rank).
 *
 * TWO RANKS, TWO NAMES, ON PURPOSE.
 *  - `priorityRank` is the ENGINE's absolute rank, unchanged and unmoved (the eval
 *    invariants pin its formula). It is kept on the row so an export, an evidence
 *    pack and this queue can never disagree about what the engine said.
 *  - `queueRank` is the row's PLACE IN THIS QUEUE (1 = top), which is a fact about
 *    the cohort, not about the ticket. It is what the rows are sorted by.
 *
 * They are different quantities and they now have different names. The queue is no
 * longer ordered on the engine's absolute rank alone, because an absolute bar is
 * the wrong instrument for a queue: on p10's crisis desk every ticket scored high
 * (zero `standard` tickets, a risk floor of 56), so "sort by risk" ranked his THIRD
 * chargeback threat — the one who wrote "I am building a case" — 5th of 8. The
 * order is now: intent class (a stated chargeback outranks everything), then risk,
 * then the declared tiebreak; and every row carries `rankReason`, the answer to
 * "why is this on top?".
 */
export interface QueueRow extends RowRanking {
  ticket: Ticket;
  customer: Customer;
  order: Order;
  riskScore: number;
  band: string;
  color: string;
  daysInWait: number;
  /** the REFUND-RISK ENGINE's own absolute priority rank. Unchanged meaning. */
  priorityRank: number;
}

/** The queue plus the live distribution its ranking was measured against. */
export interface RankedQueueView {
  rows: QueueRow[];
  distribution: QueueDistribution;
}

export async function getQueue(merchantId: string, now: Date = new Date()): Promise<QueueRow[]> {
  return (await getRankedQueue(merchantId, now)).rows;
}

export async function getRankedQueue(
  merchantId: string,
  now: Date = new Date(),
): Promise<RankedQueueView> {
  const repos = getRepositories();
  const merchant = await repos.merchants.findById(merchantId);
  if (!merchant) return { rows: [], distribution: measureQueue([]) };
  const tickets = await repos.tickets.list({ merchantId });

  // EN-08 — batch the per-ticket joins instead of 1+3N serial round-trips. The old
  // loop did, per ticket, an orders.findById + a customers.findById + a
  // ticketsLast7dFor (its own tickets.list) — 3N sequential reads over ALL of the
  // merchant's historical tickets, and this is reused by ~4 daily pages. Fetch the
  // merchant's orders + customers ONCE and index by id, and fold each customer's
  // 7-day ticket count out of the ticket list already in hand. A ticket's order and
  // customer always belong to THIS merchant (ingest scopes both, and refuses a
  // cross-merchant order), so the by-merchant lists are the exact universe the
  // per-row findById resolved against — the produced rows and their final sort are
  // byte-for-byte unchanged. (Resolved/sent rows are intentionally KEPT: the inbox
  // deep-link, the dashboard risk curve, and the customers page all read the full
  // queue; dropping them is a behavior change owned by those surfaces, not here.)
  const [orders, customers] = await Promise.all([
    repos.orders.listByMerchant(merchantId),
    repos.customers.listByMerchant(merchantId),
  ]);
  const ordersById = new Map(orders.map((o) => [o.id, o]));
  const customersById = new Map(customers.map((c) => [c.id, c]));

  // ticketsLast7d per customer, folded from `tickets` in a single pass — the same
  // predicate ticketsLast7dFor applies (this merchant's tickets for the customer,
  // created within the last 7 days), without a round-trip per row.
  const cutoff = Date.now() - 7 * 86400000;
  const last7dByCustomer = new Map<string, number>();
  for (const t of tickets) {
    if (new Date(t.createdAt).getTime() >= cutoff) {
      last7dByCustomer.set(t.customerId, (last7dByCustomer.get(t.customerId) ?? 0) + 1);
    }
  }

  // The engine's per-ticket facts. Ranking happens AFTER the whole cohort exists —
  // a row's place is a fact about the queue, not about the ticket alone.
  type BaseRow = Omit<QueueRow, keyof RowRanking> & { topDriverRaw: string };
  const base: BaseRow[] = [];
  for (const ticket of tickets) {
    // An order-less (unmatched) ticket resolves to no order and is skipped — the
    // exact drop the original findById("") → null produced, now with no round-trip.
    const order = ordersById.get(ticket.orderId);
    const customer = customersById.get(ticket.customerId);
    if (!order || !customer) continue;
    const timeline = computeTimeline(order, merchant, now);
    const ticketsLast7d = last7dByCustomer.get(customer.id) ?? 0;
    const risk = scoreRefundRisk({
      order,
      customer,
      daysInWait: timeline.daysInWait,
      fulfillmentWindowMaxDays: merchant.fulfillmentWindowDays.max,
      stageCeilDay: stageCeilDayFor(merchant.stages, order.productionStage),
      sentiment: ticket.sentiment,
      ticketsLast7d,
    });
    base.push({
      ticket,
      customer,
      order,
      riskScore: risk.riskScore,
      band: risk.band,
      color: risk.color,
      daysInWait: timeline.daysInWait,
      // The engine's own absolute rank, carried through unchanged — the exports and
      // the cockpit must never disagree about what the engine said.
      priorityRank: risk.priorityRank,
      // The engine computed this and the queue used to throw it away, which is why
      // an operator could never answer "why is this one on top?".
      topDriverRaw: risk.topDriver,
    });
  }

  const ranked = rankQueue(base, (r) => ({
    ticketId: r.ticket.id,
    createdAt: r.ticket.createdAt,
    sentiment: r.ticket.sentiment,
    // "Live" = still the operator's work. An answered ticket must not dilute the
    // distribution its unanswered siblings are ranked against.
    live: r.ticket.status !== "sent",
    riskScore: r.riskScore,
    daysInWait: r.daysInWait,
    orderValueCents: r.order.orderValueCents,
    topDriver: r.topDriverRaw,
  }));

  return {
    rows: ranked.rows.map(({ topDriverRaw: _drop, ...row }) => row),
    distribution: ranked.distribution,
  };
}

/** Merchant refund-risk dashboard view model — all proof-only (deltas vs baseline). */
export interface DashboardView {
  merchant: Merchant;
  /**
   * The merchant's own day-0 baseline. medianFrtSec / wismoPer100Orders are
   * widened to `number | null`: a freshly-onboarded merchant carries an all-zero
   * baseline (the unset sentinel), and surfacing that as "baseline 0s" would be a
   * proof-only lie. getDashboard nulls those two when the baseline is unmeasured,
   * so the dashboard renders no baseline sublabel/delta instead of a fabricated 0.
   */
  baseline: Omit<Merchant["baseline"], "medianFrtSec" | "wismoPer100Orders"> & {
    medianFrtSec: number | null;
    wismoPer100Orders: number | null;
  };
  /**
   * The day-0 cohort MEASURED from the merchant's own order file, and the SAME
   * measurement taken today. This is the only before/after on the dashboard where
   * both ends are counted rather than reported — so it is the only place a delta
   * can be stated as a fact. Null until an import has landed (no day-0 picture).
   */
  cohort: { day0: BaselineCohort; today: BaselineCohort } | null;
  live: {
    medianFrtSec: number | null;
    /** WISMO tickets per 100 orders, to one decimal — it used to round to 0 for
     *  every merchant above ~3,000 orders, i.e. the five biggest in the run. */
    wismoPer100Orders: number;
    sentCount: number;
    /**
     * Replies sent to tickets that threatened a chargeback. An ACTIVITY count.
     * It was called `savesCount` and displayed as "Saves logged", which asserts an
     * outcome — that the customer was saved — that nothing in the product measures.
     * A reply is a reply.
     */
    disputeRiskReplies: number;
    /** gifts authorized. Also activity: nothing here proves one was received. */
    giftsAuthorized: number;
  };
  /**
   * DEFLECTION, measured or absent. Never `resolved / tickets` again — see
   * lib/deflection. `gap` is the sentence the tile shows when there is no rate,
   * and it names what would make it real.
   */
  deflection: DeflectionMeasure & { gap: string | null };
  riskCurve: Array<{ label: string; risk: number; color: string }>;
  atRisk: QueueRow[];
  /** the live queue's own risk distribution — what its ranking was measured against. */
  queueDistribution: QueueDistribution;
  /** the merchant's current production status + who it reaches. */
  statusBoard: StatusBoardSummary;
  ordersInWindow: number;
  /**
   * UX-09 live status strip: counts of the operator's OPEN work (status !==
   * "sent"), derived by running the existing SLA state over each open ticket —
   * measured state only, nothing fabricated. `waiting` matches the inbox queue
   * length so "Answer your queue (N)" and the strip agree.
   */
  queueStatus: {
    waiting: number;
    /** open tickets whose first-response SLA is already breached. */
    overdue: number;
    /** open tickets within the near-breach amber window. */
    dueSoon: number;
    /** open tickets carrying an operator escalation self-flag. */
    flagged: number;
  };
  /** C5: first-response SLA attainment over answered tickets, measured against
   *  the merchant's own configured support windows (ADR-0016). Rate is gated to
   *  null below the small-n floor — no headline % on a tiny sample. */
  slaAttainment: SlaAttainment;
  /** M3: merchant's own summed GMV currently exposed to a chargeback dispute,
   *  split by payment rail. An ESTIMATE for orientation (Visa 13.1), never a
   *  guarantee — see lib/dispute-exposure. */
  disputeExposure: DisputeExposure;
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

  const [tickets, orders, ranked, statuses] = await Promise.all([
    repos.tickets.list({ merchantId }),
    repos.orders.listByMerchant(merchantId),
    getRankedQueue(merchantId, now),
    repos.productionStatuses.listByMerchant(merchantId),
  ]);
  const queue = ranked.rows;

  const sent = tickets.filter((t) => t.status === "sent" && t.firstResponseSec != null);
  const medianFrtSec = median(sent.map((t) => t.firstResponseSec as number));
  const wismo = tickets.filter((t) => t.type === "wismo").length;
  // One decimal: at 3,000+ orders the old whole-number rounding read 0 for every
  // large merchant, so the tile said "0 WISMO per 100 orders" next to a queue full
  // of them.
  const wismoPer100Orders = orders.length ? Math.round((wismo / orders.length) * 1000) / 10 : 0;

  // ACTIVITY, named as activity. A reply to someone who threatened a chargeback is
  // a reply; a gift authorized is a tag. Neither is a proven save, and the tile no
  // longer says it is.
  const disputeRiskReplies = tickets.filter(
    (t) => t.tags.includes("presale:dispute-risk") && t.status === "sent",
  ).length;
  const giftsAuthorized = tickets.filter((t) =>
    t.tags.some((x) => x.startsWith("gift-sent:")),
  ).length;

  // DEFLECTION — the real one. Views that were followed by silence from that order.
  const views = await readStatusViews(repos, merchantId, orders);
  const deflectionMeasure = measureDeflection(views, tickets, now);
  const deflection = { ...deflectionMeasure, gap: deflectionGap(deflectionMeasure) };

  // The curve is the LIVE queue's shape — plotting customers you already answered
  // is not "this period", it's a scrapbook.
  const riskCurve = queue
    .filter((r) => r.ticket.status !== "sent")
    .slice(0, 24)
    .map((r) => ({ label: r.customer.firstName, risk: r.riskScore, color: r.color }))
    .sort((a, b) => b.risk - a.risk);

  // UX-08 + UX-09: the operator's OPEN work — a sent ticket is handled and drops
  // out, so both the at-risk table and the status strip shrink toward 0 as the
  // queue is cleared (matching the inbox's own status !== "sent" definition).
  const openRows = queue.filter((r) => r.ticket.status !== "sent");
  let overdue = 0;
  let dueSoon = 0;
  let flagged = 0;
  for (const r of openRows) {
    const st = ticketSlaState(r.ticket, merchant.slaWindows, now);
    if (!st.answered) {
      if (st.state === "breach") overdue += 1;
      else if (st.state === "amber") dueSoon += 1;
    }
    if (isFlagged(r.ticket.tags)) flagged += 1;
  }

  // Proof-only: a fresh merchant's all-zero baseline is the unset sentinel, not a
  // real reading of zero — null those two metrics so the dashboard shows no
  // "baseline 0s" sublabel/delta. A measured (e.g. demo) baseline is unchanged.
  const baselineMeasured = isBaselineMeasured(merchant.baseline);

  // The day-0 cohort we counted from their own file, re-measured against today.
  // Both ends are counts, so the delta between them is a fact — the only honest
  // before/after this product can currently put in front of a renewal.
  const day0 = merchant.baseline.cohort ?? null;
  const cohort = day0 ? { day0, today: measureCohort(orders, now) } : null;

  return {
    merchant,
    baseline: {
      ...merchant.baseline,
      medianFrtSec: baselineMeasured ? merchant.baseline.medianFrtSec : null,
      wismoPer100Orders: baselineMeasured ? merchant.baseline.wismoPer100Orders : null,
    },
    cohort,
    live: {
      medianFrtSec,
      wismoPer100Orders,
      sentCount: sent.length,
      disputeRiskReplies,
      giftsAuthorized,
    },
    deflection,
    riskCurve,
    atRisk: openRows.filter((r) => r.band !== "standard"),
    queueDistribution: ranked.distribution,
    statusBoard: summarizeStatusBoard(statuses, orders),
    ordersInWindow: orders.length,
    queueStatus: { waiting: openRows.length, overdue, dueSoon, flagged },
    // M3: reuse the orders already loaded above — no extra I/O. Pure rollup.
    disputeExposure: computeDisputeExposure(orders, now),
    // C5: fold SLA attainment from the tickets already loaded — pure, no extra I/O.
    slaAttainment: computeSlaAttainment(tickets, merchant.slaWindows),
  };
}

// ─── the status board, as the dashboard + /app/status read it ────────────────

/**
 * One scoped status, plus the thing the merchant actually needs to know before
 * they post: HOW MANY of their customers this sentence speaks for. A status with
 * no cohort attached to it is a note to self.
 */
export interface StatusBoardScopeRow {
  entry: ProductionStatusEntry;
  /** orders this status is the resolved, most-specific status for. */
  ordersCovered: number;
  /** the band rendered exactly as a reply will quote it. Never a date. */
  bandPhrase: string;
}

export interface StatusBoardSummary {
  /** the newest status per distinct scope — the board an operator manages. */
  scopes: StatusBoardScopeRow[];
  /** total entries in the append-only history (the evidence trail). */
  historyCount: number;
  /** the newest entry of any scope, or null if the board is empty. */
  lastUpdatedAt: string | null;
  /** orders that ANY status on the board speaks for. */
  ordersCovered: number;
  /** orders no status reaches — the bands are all they have. */
  ordersUncovered: number;
  totalOrders: number;
}

/**
 * Fold the append-only history into the board an operator manages, and attach the
 * cohort each line actually reaches. Pure — takes the entries and the orders.
 *
 * "ordersCovered" is per-order RESOLVED coverage, not per-scope matching: an order
 * is counted for the ONE status that speaks for it (the most specific), exactly as
 * the drafting layer will resolve it. Otherwise a merchant-wide status would claim
 * to cover backers whose campaign-scoped status actually overrides it, and the "the
 * next N replies will say this" line — the whole point of the surface — would be a
 * number nobody could reconcile.
 */
export function summarizeStatusBoard(
  entries: ProductionStatusEntry[],
  orders: Order[],
): StatusBoardSummary {
  const board = currentBoard(entries);
  const coveredByEntry = new Map<string, number>();
  let ordersCovered = 0;

  for (const order of orders) {
    // The most specific board entry that applies — the same rule
    // lib/status-board.resolveStatusFor applies for a draft, so the count on the
    // screen is the count of replies that will carry that sentence.
    let best: ProductionStatusEntry | null = null;
    let bestScore = -1;
    for (const e of board) {
      if (!scopeApplies(e.scope, order)) continue;
      const score =
        (e.scope?.campaignName ? 4 : 0) + (e.scope?.wave ? 2 : 0) + (e.scope?.region ? 1 : 0);
      if (score > bestScore) {
        best = e;
        bestScore = score;
      }
    }
    if (best) {
      coveredByEntry.set(best.id, (coveredByEntry.get(best.id) ?? 0) + 1);
      ordersCovered += 1;
    }
  }

  let lastUpdatedAt: string | null = null;
  for (const e of entries) {
    if (!lastUpdatedAt || e.updatedAt > lastUpdatedAt) lastUpdatedAt = e.updatedAt;
  }

  return {
    scopes: board.map((entry) => ({
      entry,
      ordersCovered: coveredByEntry.get(entry.id) ?? 0,
      bandPhrase: formatWeeksBand(entry.confidenceBand),
    })),
    historyCount: entries.length,
    lastUpdatedAt,
    ordersCovered,
    ordersUncovered: Math.max(0, orders.length - ordersCovered),
    totalOrders: orders.length,
  };
}

/**
 * The merchant's status-view ledger.
 *
 * The repository seam exposes views per ORDER (StatusViewRepository.listByOrder),
 * so a merchant-wide read is currently a fan-out — the same shape lib/export.ts and
 * getSetupChecklist already use. It is bounded by the order count and every driver
 * resolves it, but on a large merchant it is N reads for one dashboard, so this
 * prefers a merchant-scoped `listByMerchant` the moment the repository seam grows
 * one (owned by the repositories lane) and falls back until then. Kept in ONE place
 * so that swap is a single-line change.
 */
async function readStatusViews(
  repos: Repositories,
  merchantId: string,
  orders: Order[],
): Promise<Array<{ orderId: string; viewedAt: string }>> {
  const seam = repos.statusViews as typeof repos.statusViews & {
    listByMerchant?: (id: string) => Promise<Array<{ orderId: string; viewedAt: string }>>;
  };
  if (typeof seam.listByMerchant === "function") return seam.listByMerchant(merchantId);
  const perOrder = await Promise.all(orders.map((o) => repos.statusViews.listByOrder(o.id)));
  return perOrder.flat();
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

  // ── ADR-0013 (F4) quiet-resolution fact ────────────────────────────────────
  /** count of kind==='resolved_quiet' events attributed to this variant (the
   *  scheduled sweep's output: sends that got no comeback for 7 days). */
  resolvedQuiet: number;
  /** resolved_quiet / sends — null below the sends threshold. The positive mirror
   *  of reopen rate: the share of sends that settled the wait quietly. */
  quietResolutionRate: number | null;
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
  resolvedQuiet: number;
}
const emptyStats = (): VariantStats => ({
  sends: 0,
  ratios: [],
  customerReplies: 0,
  calmReplies: 0,
  reopens: 0,
  csatUp: 0,
  csatDown: 0,
  resolvedQuiet: 0,
});

/**
 * Pure aggregation: fold the ledger's events by variantId onto the merchant's
 * variants. Deterministic — variants keep their input order, never ranked by
 * performance. Folds the E1 send facts (kind==='reply_sent': `sends` +
 * meta.editedRatio) plus the E2 customer-side outcomes (customer_replied /
 * reopened / csat_up / csat_down) and the F4 quiet-resolution count
 * (resolved_quiet, from the scheduled sweep). A send with no editedRatio is still counted in
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
      case "resolved_quiet":
        s.resolvedQuiet += 1;
        break;
      default:
        break; // refund_requested / chargeback: not surfaced here.
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
      resolvedQuiet: s.resolvedQuiet,
      // resolved_quiet <= sends by construction (one per settled send), so the cap
      // is a no-op here — kept only as the same defensive ceiling as reopenRate.
      quietResolutionRate:
        s.sends >= SCRIPT_PERF_MIN_N ? Math.min(1, s.resolvedQuiet / s.sends) : null,
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

/**
 * Setup checklist (task U4): the thin I/O wrapper around the pure
 * `computeSetupChecklist`. Loads the merchant + its orders/tickets/updates/
 * statusViews, then derives the five "you're N of 5 set up" items from that real
 * state. Nothing is persisted and no flag is stored — the list is recomputed from
 * what actually exists, so it can never drift from reality.
 *
 * StatusViews are keyed by order (there is no listByMerchant on the repo), so the
 * views are gathered across the merchant's orders. The read is bounded by the
 * merchant's order count and only powers a status page, so it stays cheap; the
 * JSON driver resolves each call in-memory. Returns null for an unknown merchant.
 */
export async function getSetupChecklist(merchantId: string): Promise<SetupChecklist | null> {
  const repos = getRepositories();
  const merchant = await repos.merchants.findById(merchantId);
  if (!merchant) return null;

  const [orders, tickets, updates] = await Promise.all([
    repos.orders.listByMerchant(merchantId),
    repos.tickets.list({ merchantId }),
    repos.merchantUpdates.listByMerchant(merchantId),
  ]);
  const statusViews = (
    await Promise.all(orders.map((o) => repos.statusViews.listByOrder(o.id)))
  ).flat();

  return computeSetupChecklist({ merchant, orders, tickets, updates, statusViews });
}
