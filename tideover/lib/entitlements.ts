import type { PlanKey } from "@/lib/types";

/**
 * Plan → entitlements (ADR-0022). The published ladder becomes the ENFORCED
 * seat + order caps. Before this, both caps were flat and plan-blind — a $299
 * Starter got the $749 Scale allowances free (gap sweep, revenue-path lane).
 *
 * This module is the single source of truth for the caps. The SEAT cap IS enforced
 * from here (lib/team-route.ts imports entitlementsFor). The ORDER cap is displayed
 * (BillingPanel) but NOT yet hard-enforced at import: over-cap is a
 * soft-overage-then-contact posture per ADR-0022 decision #5, so lib/import.ts
 * still applies only the flat technical ceiling (IMPORT_ROW_CAP). Wiring the soft
 * order-cap signal is a tracked follow-up — do not add a hard block without the
 * grace-margin design.
 */

export interface Entitlements {
  /** teammate seats included in the plan (owner + members). */
  seatCap: number;
  /** presale orders allowed in the wait window (the published "up to N"). */
  orderCap: number;
  /** display label for the plan. */
  label: string;
}

/** The three published paid tiers, verbatim from the /pricing ladder (Dylan: ship as published). */
const LADDER: Record<PlanKey, Entitlements> = {
  starter: { seatCap: 1, orderCap: 1_000, label: "Starter" },
  growth: { seatCap: 3, orderCap: 5_000, label: "Growth" },
  scale: { seatCap: 10, orderCap: 15_000, label: "Scale" },
};

/**
 * The fallback for a merchant with NO plan — trialing (no plan chosen yet),
 * legacy, or demo/seed. Deliberately the pre-ADR-0022 flat ceilings (TEAM_SEAT_CAP
 * = 10, IMPORT_ROW_CAP = 50_000) so that seeding, the demo, the eval, and every
 * existing merchant behave EXACTLY as before this change. A trialing merchant gets
 * full access; the gate at trial-end is the soft-lock (lib/trial.ts), not a cap.
 */
export const DEFAULT_ENTITLEMENTS: Entitlements = { seatCap: 10, orderCap: 50_000, label: "—" };

/** Resolve a merchant's entitlements. A null/absent plan → the backward-compatible default. */
export function entitlementsFor(plan: PlanKey | null | undefined): Entitlements {
  return plan ? LADDER[plan] : DEFAULT_ENTITLEMENTS;
}

/** The published monthly price (USD) per tier — for display + the eventual Stripe price map. */
export const PLAN_MONTHLY_USD: Record<PlanKey, number> = { starter: 299, growth: 499, scale: 749 };
