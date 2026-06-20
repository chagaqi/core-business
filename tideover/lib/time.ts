import type { Merchant, Order, OrderTimeline, ProductionStageKey, StageDef } from "@/lib/types";

/**
 * Time + confidence-band math. The confidence band is the single most
 * load-bearing piece of proof-only discipline: it is ALWAYS a relative window
 * ("ships in weeks 9–11" / "9–14 days"), NEVER a calendar date.
 *
 * Pure functions, no I/O. `now` is injectable so engines + tests are
 * deterministic regardless of wall clock.
 */

const DAY_MS = 86_400_000;

export function daysBetween(a: string, b: string): number {
  return Math.round((new Date(b).getTime() - new Date(a).getTime()) / DAY_MS);
}

export function daysInWait(order: Order, now: Date = new Date()): number {
  return Math.max(0, daysBetween(order.fulfillmentStart, now.toISOString()));
}

const STAGE_ORDER: ProductionStageKey[] = [
  "sourcing",
  "tooling",
  "production",
  "qc",
  "freight",
  "dispatch",
];

export function stageIndex(key: ProductionStageKey): number {
  return STAGE_ORDER.indexOf(key);
}

/** variance margin (in days) applied to the upper bound of every band. */
export function bandVariance(totalDays: number): number {
  return Math.max(5, Math.round(totalDays * 0.12));
}

/**
 * Format a day-count window as a calm, human band. Prefers weeks once the
 * window is large enough; falls back to days. Never emits a date.
 */
export function formatBand(loDays: number, hiDays: number): string {
  const lo = Math.max(0, Math.round(loDays));
  const hi = Math.max(lo, Math.round(hiDays));
  if (lo === 0 && hi <= 2) return "in the next day or two";
  if (hi >= 14) {
    const loW = Math.max(1, Math.round(lo / 7));
    const hiW = Math.max(loW, Math.round(hi / 7));
    return loW === hiW ? `in about ${loW} weeks` : `in weeks ${loW}–${hiW}`;
  }
  return `in ${lo}–${hi} days`;
}

/**
 * Compute the full timeline view for an order: days in wait, the honest
 * confidence band, remaining upper bound, overdue flag, and per-stage state.
 */
export function computeTimeline(
  order: Order,
  merchant: Merchant,
  now: Date = new Date(),
): OrderTimeline {
  const total = Math.max(1, daysBetween(order.fulfillmentStart, order.fulfillmentEnd));
  const elapsed = daysInWait(order, now);
  const variance = bandVariance(total);

  const stageDef =
    merchant.stages.find((s) => s.key === order.productionStage) ?? merchant.stages[0];

  // remaining lower bound: whichever is later — the current stage ceiling or the
  // fulfillment-window remainder — clamped at zero.
  const stageRemaining = Math.max(0, stageDef.dayBand.to - elapsed);
  const windowRemaining = Math.max(0, total - elapsed);
  const remainingLo = Math.max(0, Math.min(stageRemaining || windowRemaining, windowRemaining));
  const remainingHi = remainingLo + variance;
  const overdue = elapsed > total;

  const confidenceBand = overdue
    ? "running a little longer than planned — see the update below"
    : `ships ${formatBand(remainingLo, remainingHi)}`;

  const currentIdx = stageIndex(order.productionStage);
  const stages: OrderTimeline["stages"] = merchant.stages.map((s) => {
    const idx = stageIndex(s.key);
    const state: "done" | "active" | "upcoming" =
      idx < currentIdx ? "done" : idx === currentIdx ? "active" : "upcoming";
    return { ...s, state };
  });

  return {
    orderId: order.id,
    customerId: order.customerId,
    daysInWait: elapsed,
    confidenceBand,
    daysRemainingUpper: overdue ? variance : remainingHi,
    productionStage: order.productionStage,
    overdue,
    stages,
  };
}

export function stageBlurb(merchant: Merchant, key: ProductionStageKey): string {
  const def: StageDef | undefined = merchant.stages.find((s) => s.key === key);
  return def?.blurb ?? "in production";
}
