import { newId } from "@/lib/ids";
import { getRepositories } from "@/lib/repositories";
import { computeTimeline } from "@/lib/time";
import {
  computeTicketIntelligence,
  scoreRefundRisk,
  stageCeilDayFor,
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

/** Ingest a normalized inbound ticket: match order/customer, persist, auto-draft. */
export async function ingestTicket(n: NormalizedTicket): Promise<{ ticket: Ticket } | { error: string }> {
  const repos = getRepositories();
  const merchant = await repos.merchants.findById(n.merchantId);
  if (!merchant) return { error: "unknown merchant" };

  let customer = await repos.customers.findByEmail(n.merchantId, n.customerEmail);
  let order: Order | null = n.orderRef ? await repos.orders.findById(n.orderRef) : null;
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
    },
    tags: ["presale", `presale:${n.type}`].concat(
      n.sentiment === "chargeback-threat" ? ["presale:dispute-risk"] : [],
    ),
  };
  await repos.tickets.create(ticket);
  await repos.customers.update(customer.id, {
    ticketCount: customer.ticketCount + 1,
    lastSentiment: n.sentiment,
  });
  return { ticket };
}

export async function regenerateDraft(ticketId: string): Promise<Ticket | null> {
  const repos = getRepositories();
  const view = await getTicketView(ticketId);
  if (!view) return null;
  const draft = intelToDraft(view.intel);
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
    sent: { text, approvedBy: process.env.DEMO_OPERATOR_NAME ?? "Chaga", sentAt, externalId },
    firstResponseSec,
  });
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
