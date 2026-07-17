import type { PlanKey } from "@/lib/types";

/**
 * Stripe price ids per plan × interval (ADR-0022). These are non-secret
 * references (they appear client-side in Checkout), so the TEST-mode ids created
 * by scripts/create-stripe-products.mjs (2026-07-17) live here as the default.
 * LIVE mode overrides each via a STRIPE_PRICE_<PLAN>_<INTERVAL> env var — set
 * those in Vercel when flipping to live keys, and code + env never disagree.
 */

export type Interval = "month" | "year";

const TEST_PRICES: Record<PlanKey, Record<Interval, string>> = {
  starter: { month: "price_1TuCF2ABePN0fM5yKQ1zJVEF", year: "price_1TuCF2ABePN0fM5yvzFVfktA" },
  growth: { month: "price_1TuCF2ABePN0fM5y1QMHF9HM", year: "price_1TuCF3ABePN0fM5yr4x2kRu2" },
  scale: { month: "price_1TuCF3ABePN0fM5yChj44tAI", year: "price_1TuCF3ABePN0fM5yRFHUwR0F" },
};

function envKey(plan: PlanKey, interval: Interval): string {
  return `STRIPE_PRICE_${plan.toUpperCase()}_${interval === "month" ? "MONTHLY" : "ANNUAL"}`;
}

/** The Stripe price id to sell for a plan + interval — env (live) first, test default otherwise. */
export function priceIdFor(plan: PlanKey, interval: Interval): string {
  return process.env[envKey(plan, interval)] || TEST_PRICES[plan][interval];
}

/** Reverse lookup for the webhook: which plan a Stripe price id sells, or null if unknown. */
export function planForPriceId(priceId: string): PlanKey | null {
  for (const plan of Object.keys(TEST_PRICES) as PlanKey[]) {
    for (const interval of ["month", "year"] as Interval[]) {
      if (priceIdFor(plan, interval) === priceId) return plan;
    }
  }
  return null;
}
