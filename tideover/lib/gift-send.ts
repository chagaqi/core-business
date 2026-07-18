import { getRepositories } from "@/lib/repositories";
import { computeTimeline } from "@/lib/time";
import {
  giftAvailability,
  isEscalatedSentiment,
  scoreRefundRisk,
  stageCeilDayFor,
} from "@/lib/engines";
import { ticketsLast7dFor } from "@/lib/service";
import { activeCatalog } from "@/lib/gift-catalog";

/**
 * Server-side gift-send authorization (UX-86). The one-click gift button posts a
 * ticketId + giftId; this re-resolves the ticket's order/customer/merchant,
 * recomputes the gift availability from scratch, and REFUSES to log a gift that
 * is locked (wrong tier for the customer's risk band) or foreign (belongs to a
 * different merchant). A trusting client is never taken at its word — the tag is
 * written only after the server re-derives the gift is genuinely unlocked.
 */
export type GiftSendResult =
  | { ok: true; ticketId: string; gift: string }
  | { ok: false; status: 403 | 404; error: string; reason?: string };

export async function authorizeGiftSend(ticketId: string, giftId: string): Promise<GiftSendResult> {
  const repos = getRepositories();
  const [ticket, gift] = await Promise.all([
    repos.tickets.findById(ticketId),
    repos.gifts.findById(giftId),
  ]);
  if (!ticket || !gift) return { ok: false, status: 404, error: "ticket or gift not found" };

  // A gift from another merchant's catalog can never be sent on this ticket.
  if (gift.merchantId !== ticket.merchantId)
    return { ok: false, status: 403, error: "gift is not in this merchant's catalog" };

  const [order, customer, merchant] = await Promise.all([
    repos.orders.findById(ticket.orderId),
    repos.customers.findById(ticket.customerId),
    repos.merchants.findById(ticket.merchantId),
  ]);
  if (!order || !customer || !merchant)
    return { ok: false, status: 404, error: "ticket context not found" };

  const timeline = computeTimeline(order, merchant);
  // Active catalog only: a RETIRED gift (record kept, id removed from
  // giftCatalogIds) fails the availability lookup below → 403, same as foreign.
  const catalog = activeCatalog(merchant, await repos.gifts.listByMerchant(merchant.id));
  const ticketsLast7d = await ticketsLast7dFor(merchant.id, customer.id);
  const risk = scoreRefundRisk({
    order,
    customer,
    daysInWait: timeline.daysInWait,
    fulfillmentWindowMaxDays: merchant.fulfillmentWindowDays.max,
    stageCeilDay: stageCeilDayFor(merchant.stages, order.productionStage),
    sentiment: ticket.sentiment,
    ticketsLast7d,
  });

  const availability = giftAvailability({
    catalog,
    riskScore: risk.riskScore,
    escalated: isEscalatedSentiment(ticket.sentiment),
    ltvCents: customer.ltvCents,
    daysInWait: timeline.daysInWait,
    orderValueCents: order.orderValueCents,
  });
  const entry = availability.find((a) => a.gift.id === gift.id);
  if (!entry || !entry.unlocked)
    return {
      ok: false,
      status: 403,
      error: "gift is locked for this customer",
      reason: entry?.unlockReason ?? "gift not in catalog",
    };

  const tags = Array.from(new Set([...ticket.tags, `gift-sent:${gift.kind}`]));
  await repos.tickets.update(ticket.id, { tags });
  return { ok: true, ticketId: ticket.id, gift: gift.name };
}
