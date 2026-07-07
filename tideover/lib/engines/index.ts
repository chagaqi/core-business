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
import {
  giftAvailability,
  recommendGift,
  type GiftAvailabilityEntry,
  type GiftResult,
} from "@/lib/engines/gift";

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
  /**
   * UX-86: per-gift availability across the WHOLE catalog (band-only unlock +
   * escalation), so the cockpit "Gifts available" panel can show the ladder — the
   * best-unlocked recommendation (`gift`) plus every other gift, unlocked or
   * locked-with-reason. Additive to the engine output: `risk`/`reassurance`/`gift`
   * are unchanged, so the goldens + invariant sweep stay byte-stable.
   */
  availability: GiftAvailabilityEntry[];
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

  const escalated = isEscalatedSentiment(ticket.sentiment);
  const gift = recommendGift({
    riskScore: risk.riskScore,
    escalated,
    catalog,
    daysInWait: timeline.daysInWait,
  });

  // Full-catalog availability for the ticket gift panel — same band-only unlock
  // model the /api/gift-send server re-derives, so what the panel offers as
  // unlocked is exactly what the server will authorize.
  const availability = giftAvailability({
    catalog,
    riskScore: risk.riskScore,
    escalated,
    ltvCents: customer.ltvCents,
    daysInWait: timeline.daysInWait,
    orderValueCents: order.orderValueCents,
  });

  return { risk, reassurance, gift, availability };
}
