import type { Customer, Order, RiskBandKey, RiskColor, Sentiment } from "@/lib/types";
import { bandVariance, daysBetween } from "@/lib/time";

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
  thresholds: { atRisk: 75, watch: 50 },
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
  const { order, daysInWait, fulfillmentWindowMaxDays, stageCeilDay, sentiment, ticketsLast7d } = input;
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

  const band: RiskBandKey =
    riskScore >= profile.thresholds.atRisk
      ? "at_risk"
      : riskScore >= profile.thresholds.watch
        ? "watch"
        : "standard";

  const color: RiskColor = band === "at_risk" ? "red" : band === "watch" ? "amber" : "green";

  // priorityRank: escalated sentiments float to the very top, then by score.
  const escalated = sentiment === "hostile" || sentiment === "chargeback-threat";
  const priorityRank = (escalated ? 0 : 1000) + (1000 - riskScore);

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

export function stageCeilDayFor(stages: { key: string; dayBand: { to: number } }[], stageKey: string): number {
  return stages.find((s) => s.key === stageKey)?.dayBand.to ?? 0;
}
