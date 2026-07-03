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

/** Request context for the view log — captured at the call site from headers. */
export interface ViewMeta {
  ipPrefix?: string;
  userAgent?: string;
}

/**
 * Derive view-log metadata from request headers, PII-minimized: only the first
 * two octets of the client IP (never the full address) and a truncated UA.
 * Accepts anything header-like (Request.headers or next/headers' headers()).
 */
export function viewMetaFromHeaders(h: { get(name: string): string | null }): ViewMeta {
  const firstIp = (h.get("x-forwarded-for") ?? "").split(",")[0]?.trim() ?? "";
  const octets = firstIp.match(/^(\d{1,3})\.(\d{1,3})\./);
  const ipPrefix = octets ? `${octets[1]}.${octets[2]}` : undefined;
  const ua = h.get("user-agent");
  const userAgent = ua ? ua.slice(0, 200) : undefined;
  return { ipPrefix, userAgent };
}

export async function getPublicStatus(
  token: string,
  viewMeta?: ViewMeta,
): Promise<PublicStatus | null> {
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

  // Fire-and-forget view log (ADR-0005). Only reached AFTER the token verifies
  // and the order/merchant/customer resolve — never for an invalid/expired
  // token. A logging failure must never break or alter the customer render, so
  // the promise is voided and any rejection swallowed.
  if (viewMeta) {
    const view: Parameters<typeof repos.statusViews.record>[0] = {
      orderId: order.id,
      merchantId: order.merchantId,
      token: order.statusToken,
      viewedAt: new Date().toISOString(),
    };
    if (viewMeta.ipPrefix) view.ipPrefix = viewMeta.ipPrefix;
    if (viewMeta.userAgent) view.userAgent = viewMeta.userAgent;
    void repos.statusViews.record(view).catch(() => {});
  }

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
