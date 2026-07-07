import type { Customer, Gift, Merchant, Order, Ticket } from "@/lib/types";
import { computeTimeline } from "@/lib/time";
import { draftReassurance, type ReassuranceResult } from "@/lib/engines/reassurance";
import {
  DEFAULT_PROFILE,
  isEscalatedSentiment,
  scoreRefundRisk,
  stageCeilDayFor,
  type RiskProfile,
  type RiskResult,
} from "@/lib/engines/refund-risk";
import { recommendGift, type GiftResult } from "@/lib/engines/gift";

export * from "@/lib/engines/reassurance";
export * from "@/lib/engines/refund-risk";
export * from "@/lib/engines/gift";
export * from "@/lib/engines/risk-bands";
export * from "@/lib/engines/social-signal";

/**
 * Composition layer: run all three per-ticket engines together. This is what the
 * ingest pipeline + cockpit call — one entry point producing the full
 * "intelligence" for a ticket (risk + draft + gift), all deterministic.
 */
export interface TicketIntelligence {
  risk: RiskResult;
  reassurance: ReassuranceResult;
  gift: GiftResult;
}

export interface IntelInput {
  ticket: Ticket;
  order: Order;
  customer: Customer;
  merchant: Merchant;
  catalog: Gift[];
  ticketsLast7d: number;
  profile?: RiskProfile;
  now?: Date;
}

export function computeTicketIntelligence(input: IntelInput): TicketIntelligence {
  const { ticket, order, customer, merchant, catalog, ticketsLast7d } = input;
  const profile = input.profile ?? DEFAULT_PROFILE;
  const now = input.now ?? new Date();

  const timeline = computeTimeline(order, merchant, now);

  const risk = scoreRefundRisk(
    {
      order,
      customer,
      daysInWait: timeline.daysInWait,
      fulfillmentWindowMaxDays: merchant.fulfillmentWindowDays.max,
      stageCeilDay: stageCeilDayFor(merchant.stages, order.productionStage),
      sentiment: ticket.sentiment,
      ticketsLast7d,
    },
    profile,
  );

  const reassurance = draftReassurance({
    order,
    merchant,
    firstName: customer.firstName,
    sentiment: ticket.sentiment,
    now,
  });

  const gift = recommendGift({
    riskScore: risk.riskScore,
    escalated: isEscalatedSentiment(ticket.sentiment),
    catalog,
    daysInWait: timeline.daysInWait,
  });

  return { risk, reassurance, gift };
}
