import { getRepositories } from "@/lib/repositories";
import type {
  Customer,
  Gift,
  Merchant,
  MerchantUpdate,
  Order,
  OutcomeEvent,
  ScriptVariant,
  SocialSignal,
  StatusView,
  Ticket,
} from "@/lib/types";

/**
 * "Export everything" (task G6) — the pure, testable core behind
 * GET /api/export. It makes "no lock-in" demonstrable: one call assembles ALL
 * of a single merchant's real data into one open JSON object the operator can
 * download. Pure of any `next/*` import so it is unit-testable; the route is a
 * thin wrapper (mirrors lib/health.ts).
 *
 * SCOPED to exactly one merchant — every collection is fetched via its
 * per-merchant read, so no other merchant's rows can appear. Read-only: pure
 * orchestration over getRepositories() (works on both the json and mongo
 * drivers), no schema or seed change.
 *
 * PROOF-ONLY / SECURITY: the payload carries the merchant's REAL data and
 * nothing fabricated, and it must carry NO live capability secrets — a data
 * snapshot is not a bundle of keys:
 *   - the merchant's `inboxToken` is stripped (it is the local-part of the
 *     merchant's inbound address `<inboxToken>@in.tideover.app`, ADR-0008 — a
 *     live routing capability, not portable data);
 *   - every order's signed `statusToken` is stripped (each is a per-order
 *     capability that powers /status/[token]; a snapshot shouldn't ship live
 *     tokens).
 */

/** Merchant record safe to export — the live inbound-address capability removed. */
export type ExportedMerchant = Omit<Merchant, "inboxToken">;

/** Order record safe to export — the signed per-order status capability removed. */
export type ExportedOrder = Omit<Order, "statusToken">;

/**
 * StatusView safe to export. A StatusView's `token` IS the order's signed
 * statusToken — the same live per-order capability that powers the PUBLIC
 * /status/[token] page — so it must be stripped here too, or it re-enters the
 * export the order-level strip removed. `orderId` stays (already merchant-scoped)
 * so the "notified on X, viewed on Y" evidence log is still useful.
 */
export type ExportedStatusView = Omit<StatusView, "token">;

export interface MerchantExportCollections {
  orders: ExportedOrder[];
  customers: Customer[];
  /** Full tickets, including each `sent` reply — the merchant's comm log. */
  tickets: Ticket[];
  gifts: Gift[];
  socialSignals: SocialSignal[];
  scriptVariants: ScriptVariant[];
  outcomeEvents: OutcomeEvent[];
  updates: MerchantUpdate[];
  statusViews: ExportedStatusView[];
}

export interface MerchantExport {
  exportedFor: { merchantId: string; name: string; slug: string };
  generatedAt: string;
  /** The merchant's own record, with the inboxToken capability stripped. */
  merchant: ExportedMerchant;
  collections: MerchantExportCollections;
}

/**
 * Gather everything Tideover holds for one merchant into a single open object.
 * Returns `null` if the merchant does not exist. `now` is injectable so the
 * generated timestamp is deterministic in tests.
 */
export async function assembleMerchantExport(
  merchantId: string,
  now: Date = new Date(),
): Promise<MerchantExport | null> {
  const repos = getRepositories();
  const merchant = await repos.merchants.findById(merchantId);
  if (!merchant) return null;

  const [orders, customers, tickets, gifts, socialSignals, scriptVariants, outcomeEvents, updates] =
    await Promise.all([
      repos.orders.listByMerchant(merchantId),
      repos.customers.listByMerchant(merchantId),
      repos.tickets.list({ merchantId }),
      repos.gifts.listByMerchant(merchantId),
      repos.social.listByMerchant(merchantId),
      repos.scriptVariants.listByMerchant(merchantId),
      repos.outcomeEvents.listByMerchant(merchantId),
      repos.merchantUpdates.listByMerchant(merchantId),
    ]);

  // Status views have no per-merchant read; they are aggregated across THIS
  // merchant's orders only, which keeps the export strictly merchant-scoped.
  const statusViewsByOrder = await Promise.all(
    orders.map((o) => repos.statusViews.listByOrder(o.id)),
  );
  // Strip the live status-capability token from each view (it equals the order's
  // statusToken, which powers the PUBLIC status page).
  const statusViews: ExportedStatusView[] = statusViewsByOrder
    .flat()
    .map(({ token: _token, ...rest }) => rest);

  // Strip live capability secrets — never portable data.
  const { inboxToken: _inboxToken, ...safeMerchant } = merchant;
  const safeOrders: ExportedOrder[] = orders.map(({ statusToken: _statusToken, ...rest }) => rest);

  return {
    exportedFor: { merchantId: merchant.id, name: merchant.name, slug: merchant.slug },
    generatedAt: now.toISOString(),
    merchant: safeMerchant,
    collections: {
      orders: safeOrders,
      customers,
      tickets,
      gifts,
      socialSignals,
      scriptVariants,
      outcomeEvents,
      updates,
      statusViews,
    },
  };
}
