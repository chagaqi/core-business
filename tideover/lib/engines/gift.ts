import type { Customer, Gift, Order } from "@/lib/types";

/**
 * ENGINE 3 — Gift Recommendation.
 *
 * Recommends a single, one-click goodwill gift when a high-value customer is
 * deep in the wait or elevated risk. Deterministic gate + eligibility filter +
 * ROI ranking. Returns null (with reasoning) when no gift is warranted — the
 * cockpit only ever surfaces a gift when it actually helps, so the operator
 * trusts the suggestion.
 */

export interface GiftInput {
  customer: Customer;
  order: Order;
  daysInWait: number;
  riskScore: number;
  highTierCents: number;
  catalog: Gift[];
}

export interface GiftResult {
  gift: Gift | null;
  reasoning: string;
  roi: number | null;
}

export function recommendGift(input: GiftInput): GiftResult {
  const { customer, daysInWait, riskScore, highTierCents, catalog } = input;

  const highValue = customer.ltvCents >= highTierCents;
  const deepWait = daysInWait >= 45;
  const elevatedRisk = riskScore >= 60;

  if (!highValue || !(deepWait || elevatedRisk)) {
    return {
      gift: null,
      reasoning: highValue
        ? "High-value customer, but not yet deep enough in the wait or elevated in risk to warrant a gift."
        : "Customer is below the high-value tier; reassurance alone is the right move here.",
      roi: null,
    };
  }

  const eligible = catalog.filter(
    (g) =>
      g.eligibility.minLtvCents <= customer.ltvCents &&
      g.eligibility.minWaitDays <= daysInWait &&
      g.eligibility.minRiskScore <= riskScore,
  );

  if (eligible.length === 0) {
    return { gift: null, reasoning: "No catalog gift matches this customer's eligibility.", roi: null };
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
  const why = [
    highValue ? "high lifetime value" : null,
    deepWait ? `${daysInWait} days into the wait` : null,
    elevatedRisk ? `elevated refund risk (${riskScore})` : null,
  ]
    .filter(Boolean)
    .join(" + ");

  return {
    gift: best.g,
    reasoning: `Recommended on ${why}. Highest perceived value at lowest cost.`,
    roi: best.roi === Infinity ? null : Math.round(best.roi * 100) / 100,
  };
}
