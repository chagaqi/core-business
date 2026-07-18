import type { Customer, Order, RiskBandKey, RiskColor, Sentiment } from "@/lib/types";
import { bandVariance, daysBetween } from "@/lib/time";
import { RISK_BAND_THRESHOLDS, bandForScore } from "@/lib/engines/risk-bands";
import { ltvPriorityBoost } from "@/lib/engines/gift";

/** Escalating sentiments float a ticket to the top of the queue AND unlock the
 *  full gift tier. Single definition reused by the queue + the gift engine. */
export function isEscalatedSentiment(sentiment: Sentiment): boolean {
  return sentiment === "hostile" || sentiment === "chargeback-threat";
}

/**
 * ENGINE 2 — Refund-Risk / Priority.
 *
 * Deterministic, explainable score (0–100) per order/customer. Returns the
 * per-factor breakdown so the dashboard can show WHY a customer is at risk —
 * a black box would read as a service guess; the breakdown reads as software.
 *
 * Calibration lives in RiskProfile and is documented as per-beachhead tunable.
 * The defaults below are calibrated for the crowdfunding-hardware beachhead.
 */

export interface RiskProfile {
  weights: { value: number; wait: number; sentiment: number; velocity: number; stage: number };
  /** order value (cents) treated as full value-exposure */
  highTicketCents: number;
  /** tickets/week from one customer treated as max velocity */
  ticketVelocityCap: number;
  thresholds: { atRisk: number; watch: number };
}

export const DEFAULT_PROFILE: RiskProfile = {
  weights: { value: 0.2, wait: 0.2, sentiment: 0.35, velocity: 0.15, stage: 0.1 },
  highTicketCents: 40000,
  ticketVelocityCap: 4,
  thresholds: { atRisk: RISK_BAND_THRESHOLDS.atRisk, watch: RISK_BAND_THRESHOLDS.watch },
};

const SENTIMENT_SCORE: Record<Sentiment, number> = {
  calm: 0.05,
  anxious: 0.45,
  hostile: 0.8,
  "chargeback-threat": 1.0,
};

const clamp01 = (n: number) => Math.max(0, Math.min(1, n));

export interface RiskInput {
  order: Order;
  customer: Customer;
  daysInWait: number;
  fulfillmentWindowMaxDays: number;
  stageCeilDay: number;
  sentiment: Sentiment;
  ticketsLast7d: number;
}

export interface RiskFactors {
  valueExposure: number;
  waitPressure: number;
  sentiment: number;
  velocity: number;
  stageLag: number;
}

export interface RiskResult {
  riskScore: number;
  band: RiskBandKey;
  color: RiskColor;
  /** lower number = higher priority in the queue */
  priorityRank: number;
  factors: RiskFactors;
  /** plain-language top driver, for the dashboard tooltip */
  topDriver: string;
}

export function scoreRefundRisk(input: RiskInput, profile: RiskProfile = DEFAULT_PROFILE): RiskResult {
  const { order, customer, daysInWait, fulfillmentWindowMaxDays, stageCeilDay, sentiment, ticketsLast7d } = input;
  const w = profile.weights;

  const total = Math.max(1, daysBetween(order.fulfillmentStart, order.fulfillmentEnd));
  const variance = bandVariance(total);

  const factors: RiskFactors = {
    valueExposure: clamp01(order.orderValueCents / profile.highTicketCents),
    waitPressure: clamp01(daysInWait / Math.max(1, fulfillmentWindowMaxDays)),
    sentiment: SENTIMENT_SCORE[sentiment],
    velocity: clamp01(ticketsLast7d / profile.ticketVelocityCap),
    stageLag:
      daysInWait > total ? 1 : clamp01((daysInWait - stageCeilDay) / Math.max(1, variance)),
  };

  const raw =
    w.value * factors.valueExposure +
    w.wait * factors.waitPressure +
    w.sentiment * factors.sentiment +
    w.velocity * factors.velocity +
    w.stage * factors.stageLag;

  const riskScore = Math.round(100 * raw);

  const band: RiskBandKey = bandForScore(riskScore, profile.thresholds);

  const color: RiskColor = band === "at_risk" ? "red" : band === "watch" ? "amber" : "green";

  // priorityRank: escalated sentiments float to the very top, then by score, then
  // the LTV priority boost pulls higher-lifetime-value customers slightly sooner.
  // The boost touches PRIORITY ONLY — never riskScore/band (the honest predictor)
  // — and is 0 for crowdfunding pledges, so it never reorders current seed data.
  const escalated = isEscalatedSentiment(sentiment);
  const priorityRank = (escalated ? 0 : 1000) + (1000 - riskScore) - ltvPriorityBoost(order, customer);

  const labels: Record<keyof RiskFactors, string> = {
    valueExposure: "high order value at stake",
    waitPressure: "long time already waiting",
    sentiment: "frustrated tone",
    velocity: "asking repeatedly",
    stageLag: "running behind its stage",
  };
  const weighted = (Object.keys(factors) as Array<keyof RiskFactors>).map((k) => ({
    k,
    v: factors[k] * (w as Record<string, number>)[k === "valueExposure" ? "value" : k === "waitPressure" ? "wait" : k],
  }));
  const top = weighted.sort((a, b) => b.v - a.v)[0];

  return { riskScore, band, color, priorityRank, factors, topDriver: labels[top.k] };
}

/** sort helper for the operator queue: lowest priorityRank first, oldest first. */
export function byPriority<T extends { priorityRank: number; createdAt: string }>(a: T, b: T): number {
  if (a.priorityRank !== b.priorityRank) return a.priorityRank - b.priorityRank;
  return new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
}

/**
 * The day the order's current stage is planned to END — the anchor `stagePressure`
 * measures overrun against.
 *
 * The stage key may be "overrun" (lib/types ResolvedStageKey): the order is past
 * EVERY band the merchant authored, so no band owns it. Stage pressure is then
 * measured from the LAST band's ceiling — how far past the merchant's own plan
 * this customer is — which grows smoothly the longer they wait.
 *
 * The old `?? 0` fallback would have measured them from day zero, pinning the
 * factor at its maximum the instant an order crossed the final band. That is a
 * cliff, not a measurement, and it would have flattened exactly the population
 * Tideover exists for: our ICP is merchants who blew their window, so the MODAL
 * customer is past the last band, and a factor that reads 1.0 for all of them
 * discriminates between none of them. (p10 already saw this: zero `standard`
 * tickets, a risk floor of 56, and his third chargeback threat ranked 5th of 8.)
 *
 * Unchanged for every authored stage, so no engine output moves.
 */
export function stageCeilDayFor(stages: { key: string; dayBand: { to: number } }[], stageKey: string): number {
  const hit = stages.find((s) => s.key === stageKey);
  if (hit) return hit.dayBand.to;
  if (stages.length === 0) return 0;
  return stages.reduce((a, b) => (b.dayBand.to > a.dayBand.to ? b : a)).dayBand.to;
}
