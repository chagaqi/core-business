import { verifyStatusToken } from "@/lib/ids";
import { getRepositories } from "@/lib/repositories";
import { computeTimeline, stageBlurb } from "@/lib/time";
import { dayStageFor } from "@/lib/engines/reassurance";
import type { CustomerGroup, DayStageKey, OrderTimeline } from "@/lib/types";

/**
 * The single source of truth for the customer-facing status view. Used by BOTH
 * the /status/[token] page (server component) and GET /api/status/[token], so
 * the PII boundary is defined exactly once: only first name + order timeline +
 * reassurance leave this function. Never email, LTV, risk, or other orders.
 */
export interface PublicStatus {
  firstName: string;
  merchant: { name: string; logoText: string; colors: { primary: string; bg: string; ink: string }; signoff: string };
  orderRef: string;
  group: CustomerGroup;
  region: string;
  timeline: OrderTimeline;
  stageKey: DayStageKey;
  stageBlurb: string;
}

export async function getPublicStatus(token: string): Promise<PublicStatus | null> {
  const key = verifyStatusToken(token);
  if (!key) return null;

  const repos = getRepositories();
  const order = await repos.orders.findByToken(key);
  if (!order) return null;
  const [merchant, customer] = await Promise.all([
    repos.merchants.findById(order.merchantId),
    repos.customers.findById(order.customerId),
  ]);
  if (!merchant || !customer) return null;

  const timeline = computeTimeline(order, merchant);
  const stage = dayStageFor(timeline.daysInWait);

  return {
    firstName: customer.firstName,
    merchant: {
      name: merchant.name,
      logoText: merchant.brand.logoText,
      colors: merchant.brand.colors,
      signoff: merchant.brand.signoff,
    },
    orderRef: order.id,
    group: order.group,
    region: order.region,
    timeline,
    stageKey: stage.key,
    stageBlurb: stageBlurb(merchant, order.productionStage),
  };
}
