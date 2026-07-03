import { NextResponse } from "next/server";
import { getRepositories } from "@/lib/repositories";
import { computeTimeline } from "@/lib/time";
import { recommendGift, scoreRefundRisk, stageCeilDayFor } from "@/lib/engines";
import { ticketsLast7dFor } from "@/lib/service";

/** GET /api/gift-catalog/[customerId] — recommended gift for a customer. */
export async function GET(_req: Request, { params }: { params: { customerId: string } }) {
  const repos = getRepositories();
  const customer = await repos.customers.findById(params.customerId);
  if (!customer) return NextResponse.json({ error: "customer not found" }, { status: 404 });
  const merchant = await repos.merchants.findById(customer.merchantId);
  if (!merchant) return NextResponse.json({ error: "merchant not found" }, { status: 404 });

  const orders = await repos.orders.listByCustomer(customer.id);
  const order = orders.sort((a, b) => a.fulfillmentStart.localeCompare(b.fulfillmentStart))[0];
  if (!order) return NextResponse.json({ error: "no orders" }, { status: 404 });

  const timeline = computeTimeline(order, merchant);
  const catalog = await repos.gifts.listByMerchant(merchant.id);
  const ticketsLast7d = await ticketsLast7dFor(merchant.id, customer.id);
  const risk = scoreRefundRisk({
    order,
    customer,
    daysInWait: timeline.daysInWait,
    fulfillmentWindowMaxDays: merchant.fulfillmentWindowDays.max,
    stageCeilDay: stageCeilDayFor(merchant.stages, order.productionStage),
    sentiment: customer.lastSentiment,
    ticketsLast7d,
  });

  const rec = recommendGift({
    customer,
    order,
    daysInWait: timeline.daysInWait,
    riskScore: risk.riskScore,
    highTierCents: merchant.ltvTiers.high,
    catalog,
  });

  return NextResponse.json({
    customerId: customer.id,
    riskScore: risk.riskScore,
    recommendedGift: rec.gift,
    reasoning: rec.reasoning,
    sendUrl: rec.gift ? "/api/gift-send" : null,
  });
}
