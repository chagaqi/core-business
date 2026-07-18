import { computeDisputeWindow } from "@/lib/evidence";
import type { Order } from "@/lib/types";

/**
 * Dispute-exposure rollup (M3) — the money-at-risk number behind the
 * dispute-prevention ROI story.
 *
 * Sums the merchant's OWN order value that is CURRENTLY exposed to a chargeback
 * dispute, split by payment rail. It invents nothing: the total is real summed
 * GMV, and every window decision is delegated to `computeDisputeWindow`
 * (lib/evidence), which carries the no-hard-date, Visa-13.1 orientation
 * discipline. The result is an ESTIMATE for orientation — never a guarantee and
 * never a fabricated metric.
 *
 * "Currently in the open dispute window" for an order means all of:
 *  - it HAS a disclosedEta (otherwise the window can't be oriented at all), and
 *  - `now` is on/after the ~15-day issuer wait (so a Visa 13.1 is filable), and
 *  - `now` is on/before the effective close = min(120-day window close, 540-day
 *    cap from the transaction).
 *
 * Rail mapping (different remedies, so they are never summed into one bucket):
 *  - kickstarter = group "ks-backer" (pledge; handled via platform/backer
 *    relations, not a card chargeback);
 *  - shopify = group "late-pledge" | "new-preorder" (card order; a Visa 13.1
 *    chargeback path).
 *
 * Pure and deterministic (`now` is injected); zero I/O.
 */

export interface DisputeExposure {
  /** summed orderValueCents of every order currently in the open dispute window. */
  totalCents: number;
  /** subset of totalCents on the Kickstarter rail (group "ks-backer"). */
  kickstarterCents: number;
  /** subset of totalCents on the Shopify rail (group "late-pledge" | "new-preorder"). */
  shopifyCents: number;
  /** count of orders currently in the window (kickstarterCount + shopifyCount). */
  orderCount: number;
  kickstarterCount: number;
  shopifyCount: number;
  /**
   * Orders excluded because they carry no disclosedEta — the window can't be
   * oriented, so they are neither summed nor assumed at-risk. Surfaced so the
   * tile can be honest about coverage.
   */
  unknownCount: number;
}

/** The payment rail an order's dispute remedy runs on. */
function railFor(group: Order["group"]): "kickstarter" | "shopify" {
  return group === "ks-backer" ? "kickstarter" : "shopify";
}

export function computeDisputeExposure(orders: Order[], now: Date = new Date()): DisputeExposure {
  const out: DisputeExposure = {
    totalCents: 0,
    kickstarterCents: 0,
    shopifyCents: 0,
    orderCount: 0,
    kickstarterCount: 0,
    shopifyCount: 0,
    unknownCount: 0,
  };
  const nowMs = now.getTime();

  for (const order of orders) {
    // No disclosed ETA → the 13.1 clock has no anchor; can't orient the window.
    // Count it toward coverage, never toward the money-at-risk sum.
    if (!order.disclosedEta) {
      out.unknownCount += 1;
      continue;
    }

    const w = computeDisputeWindow(order.disclosedEta, order.createdAt, now);
    // A null bound means the disclosed band couldn't be parsed into a day range —
    // no orientation, so the order is not assumed in-window (and not summed). It
    // still has an ETA, so it's uncounted COVERAGE, not zero exposure — fold it
    // into unknownCount rather than dropping it silently.
    if (w.windowOpensEstimate === null || w.effectiveCloseEstimate === null) {
      out.unknownCount += 1;
      continue;
    }

    const opensMs = new Date(w.windowOpensEstimate).getTime();
    const closeMs = new Date(w.effectiveCloseEstimate).getTime();
    // In the OPEN window: past the issuer wait (filable) AND before the effective
    // close (120-day window close or the 540-day cap, whichever is sooner).
    if (nowMs < opensMs || nowMs > closeMs) continue;

    out.totalCents += order.orderValueCents;
    out.orderCount += 1;
    if (railFor(order.group) === "kickstarter") {
      out.kickstarterCents += order.orderValueCents;
      out.kickstarterCount += 1;
    } else {
      out.shopifyCents += order.orderValueCents;
      out.shopifyCount += 1;
    }
  }

  return out;
}
