import type { Customer, Gift, GiftTier, Order } from "@/lib/types";
import { bandForScore } from "@/lib/engines/risk-bands";

/**
 * ENGINE 3 — Gift Recommendation (Dylan unlock model, UX-86 / D-GIFT).
 *
 * Gifts carry a TIER (base | mid | full). Availability is unlocked purely by the
 * customer's refund-risk BAND plus escalation — lifetime value is NO LONGER a
 * gate:
 *
 *   standard              → base
 *   watch                 → base + mid
 *   at_risk OR escalated  → base + mid + full   (escalated = hostile / chargeback-threat)
 *
 * LTV instead feeds a PRIORITY boost only (ltvPriorityBoost, applied to
 * priorityRank in refund-risk.ts) so a high-LTV customer is worked sooner. It
 * NEVER moves the honest refund-risk score/band — that stays a pure refund
 * predictor driving the dashboard at-risk count + GMV-in-dispute.
 */

/**
 * Crowdfunding pledges are NOT lifetime value (data-provenance audit): a backer
 * pledge earns no LTV priority boost. Every current seed group is crowdfunding,
 * so the boost is 0 for all present data by design — it activates only for a
 * future Shopify-sourced (repeat-purchase) order carrying a non-crowdfunding
 * group.
 */
const CROWDFUNDING_GROUPS: ReadonlySet<Order["group"]> = new Set([
  "ks-backer",
  "late-pledge",
  "new-preorder",
]);

/**
 * A wait this long (days) is itself a warrant for a proactive goodwill gesture,
 * even on an otherwise calm, standard-band ticket — the "deep wait" arm of the
 * recommendGift warrant (see below).
 */
export const DEEP_WAIT_DAYS = 45;

/**
 * The deep-wait threshold for a SPECIFIC merchant: the point at which a wait is
 * long enough, BY THEIR OWN PLAN, to warrant a gesture. Two-thirds of the window
 * they promised, floored at the global DEEP_WAIT_DAYS so a merchant with a very
 * short window never becomes trigger-happy.
 *
 * Why it is relative: the fixed 45 days was set against a 60-day window, and this
 * ICP runs 60-240. On a 200-day campaign, "45 days in" is a customer who is
 * exactly where they were told they would be — the gate is permanently open, and
 * a gate that is always open is not a gate. Callers that pass nothing keep the
 * old constant, so no existing engine output moves.
 */
export function deepWaitDaysFor(fulfillmentWindowMaxDays: number): number {
  const relative = Math.round(Math.max(0, fulfillmentWindowMaxDays) * (2 / 3));
  return Math.max(DEEP_WAIT_DAYS, relative);
}

/** Tiers unlocked for a customer at this refund-risk score + escalation state. */
export function unlockedTiers(riskScore: number, escalated: boolean): GiftTier[] {
  const band = bandForScore(riskScore);
  if (escalated || band === "at_risk") return ["base", "mid", "full"];
  if (band === "watch") return ["base", "mid"];
  return ["base"];
}

/** The binding constraint for a tier — the plain-language reason a gift is (un)available. */
function tierUnlockReason(tier: GiftTier, unlocked: boolean): string {
  if (tier === "base") return "Available at any risk level";
  if (tier === "mid") return unlocked ? "Unlocked at watch risk or higher" : "Unlocks at watch risk or higher";
  return unlocked ? "Unlocked at high risk or on escalation" : "Unlocks at high risk or on escalation";
}

export interface GiftAvailabilityInput {
  catalog: Gift[];
  riskScore: number;
  escalated: boolean;
  /**
   * Priority-only inputs (feed the LTV boost + panel display). They do NOT gate
   * availability — carried so the ticket gift panel can render the full picture
   * and a future Shopify-sourced boost can activate without a signature change.
   */
  ltvCents: number;
  daysInWait: number;
  orderValueCents: number;
}

export interface GiftAvailabilityEntry {
  gift: Gift;
  unlocked: boolean;
  /** names the binding constraint (e.g. "Unlocks at high risk"). */
  unlockReason: string;
}

/**
 * Per-gift availability for the whole catalog — a gift is unlocked iff its tier
 * is unlocked for the customer's band (escalation → full). Consumed by the
 * ticket gift panel (separate batch). Order preserves the catalog's order.
 */
export function giftAvailability(input: GiftAvailabilityInput): GiftAvailabilityEntry[] {
  const { catalog, riskScore, escalated } = input;
  const unlocked = new Set(unlockedTiers(riskScore, escalated));
  return catalog.map((gift) => {
    const isUnlocked = unlocked.has(gift.tier);
    return { gift, unlocked: isUnlocked, unlockReason: tierUnlockReason(gift.tier, isUnlocked) };
  });
}

/**
 * LTV → priority boost, in percentage points added to a customer's queue
 * priority — NEVER to the refund-risk score/band. 2 points per WHOLE multiple of
 * (ltvCents / orderValueCents), capped at 20. Zero for crowdfunding pledges, a
 * non-positive order value, or a ratio < 1.
 */
export function ltvPriorityBoost(order: Order, customer: Customer): number {
  if (CROWDFUNDING_GROUPS.has(order.group)) return 0;
  const orderValue = order.orderValueCents;
  if (orderValue <= 0) return 0;
  const ratio = customer.ltvCents / orderValue;
  if (ratio < 1) return 0;
  return Math.min(20, 2 * Math.floor(ratio));
}

export interface GiftInput {
  riskScore: number;
  escalated: boolean;
  catalog: Gift[];
  /**
   * Days the customer has been waiting — feeds the deep-wait arm of the warrant
   * below. NOT an availability gate (giftAvailability ignores it); it only lets a
   * long wait warrant a PROACTIVE recommendation on an otherwise calm ticket.
   */
  daysInWait: number;
  /**
   * The deep-wait threshold to use. Omit for the global DEEP_WAIT_DAYS (existing
   * callers are byte-stable); pass deepWaitDaysFor(merchant.fulfillmentWindowDays.max)
   * to make it relative to the window the merchant actually promised.
   */
  deepWaitDays?: number;
}

export interface GiftResult {
  gift: Gift | null;
  reasoning: string;
  roi: number | null;
}

/**
 * The single best UNLOCKED gift to PROACTIVELY recommend for this customer, or
 * null. Availability (giftAvailability) stays band-only so a rep can always
 * choose to send a base gift — but a proactive recommendation must be WARRANTED:
 * a goodwill gesture is only volunteered when the situation calls for one.
 *
 *   WARRANT = escalated sentiment
 *          OR refund-risk band is watch/at_risk (riskScore ≥ RISK_BAND watch=50)
 *          OR daysInWait ≥ DEEP_WAIT_DAYS (deep wait).
 *
 * A calm, standard-band, not-deep-wait customer is NOT warranted → null (even
 * though the base tier is still available to send). When warranted, ranking is
 * unchanged: highest perceived value, then lowest cost, then ROI. Also null when
 * nothing is unlocked at all (empty catalog / no unlocked tier).
 *
 * NOTHING HERE LOOKS AT WHAT THE BUYER IS WORTH. The warrant is risk and wait;
 * the ranking is perceived value and cost-to-merchant. That matters because the
 * median pledge in this market is $38: a ladder gated on a $500 lifetime-value
 * threshold can never fire for the customers a solo creator most needs to hold,
 * and the base tier is deliberately free to send so the gesture is always
 * affordable (see lib/onboarding.ts ZERO_COST_BASE_GIFTS).
 */
export function recommendGift(input: GiftInput): GiftResult {
  const { riskScore, escalated, catalog, daysInWait } = input;
  const deepWait = input.deepWaitDays ?? DEEP_WAIT_DAYS;
  const unlocked = new Set(unlockedTiers(riskScore, escalated));
  const eligible = catalog.filter((g) => unlocked.has(g.tier));

  if (eligible.length === 0) {
    return {
      gift: null,
      reasoning:
        catalog.length === 0
          ? "No gift catalog configured for this merchant."
          : "No gift tier is unlocked at this customer's risk level.",
      roi: null,
    };
  }

  const band = bandForScore(riskScore);
  const warranted = escalated || band !== "standard" || daysInWait >= deepWait;
  if (!warranted) {
    return {
      gift: null,
      reasoning:
        "No goodwill gesture warranted — calm customer, standard refund-risk, within the normal wait window.",
      roi: null,
    };
  }

  const ranked = eligible
    .map((g) => ({ g, roi: g.costCents === 0 ? Infinity : g.perceivedValueCents / g.costCents }))
    .sort((a, b) => {
      if (b.g.perceivedValueCents !== a.g.perceivedValueCents)
        return b.g.perceivedValueCents - a.g.perceivedValueCents;
      if (a.g.costCents !== b.g.costCents) return a.g.costCents - b.g.costCents;
      return b.roi - a.roi;
    });

  const best = ranked[0];
  const why = escalated
    ? "escalated (hostile / chargeback-threat)"
    : band === "at_risk"
      ? "high refund-risk"
      : band === "watch"
        ? "elevated refund-risk"
        : "long-waiting"; // standard band reaches here only via the deep-wait warrant
  return {
    gift: best.g,
    reasoning: `Best unlocked goodwill gift for a ${why} customer — highest perceived value at lowest cost.`,
    roi: best.roi === Infinity ? null : Math.round(best.roi * 100) / 100,
  };
}
