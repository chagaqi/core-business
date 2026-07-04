import { daysBetween } from "@/lib/time";
import type { Order } from "@/lib/types";

/**
 * Cohort WISMO forecast (C7, ADR-0015) — a DEMAND estimate, never an outcome.
 *
 * A 60–120 day wait means WISMO ("where is my order?") tickets don't arrive
 * evenly: they spike as a cohort crosses into the anxious late-wait window
 * (day 60–89). This projects how many of those tickets a merchant will likely
 * receive next week so they can STAFF for the wave — the differentiator a
 * generic helpdesk can't compute, because it doesn't model the production
 * timeline.
 *
 * PROOF-ONLY discipline (ADR-0002, ADR-0015): both inputs are measured, never
 * fabricated —
 *  (a) the deterministic fact that a given order crosses day 60 on
 *      `fulfillmentStart + 60d` — the same wait clock as the canonical daysInWait
 *      (pure arithmetic on real order dates, no estimation), and
 *  (b) the merchant's OWN baseline WISMO rate (`baseline.wismoPer100Orders`).
 * We forecast inbound VOLUME (workload), never a Tideover efficacy claim and
 * never a hard date. The result is shown as a RANGE with the method exposed, so
 * every input is checkable. If the baseline rate is absent/zero we surface the
 * cohort COUNT only and never invent a rate.
 *
 * Pure and deterministic (`now` is injected); zero I/O. Reuses lib/time's day
 * math — it does not reinvent daysInWait / day-stage derivation.
 */

const DAY_MS = 86_400_000;

/** The anxious late-wait window, in days since the order was placed. */
export const WINDOW_ENTER_DAY = 60;
export const WINDOW_EXIT_DAY = 89;

/**
 * Uncertainty band applied around the point estimate. The point (cohort × rate)
 * is expanded ±25% and rounded OUT to integer ticket counts (floor low / ceil
 * high) so the surface renders a defensible range, never a false-precise point.
 */
export const FORECAST_BAND_PCT = 0.25;

export interface CohortForecast {
  /** length of the forward window this forecast covers (default 7 days). */
  horizonDays: number;
  /** window bounds echoed for the surface's "day 60–89" method copy. */
  windowEnterDay: number;
  windowExitDay: number;
  /** count of orders that cross into the day-60–89 window within the horizon. */
  enteringWindow: number;
  /** the ids behind `enteringWindow`, so the surface can show its work. */
  cohortOrderIds: string[];
  /** the merchant's own baseline rate, echoed back (null/0 = uncalibrated). */
  baselineWismoPer100: number | null;
  /** baselineWismoPer100 / 100 — expected WISMO tickets per waiting order. */
  ratePerOrder: number | null;
  /** point estimate = enteringWindow × ratePerOrder (null when uncalibrated). */
  expectedMid: number | null;
  /** ±FORECAST_BAND_PCT band around expectedMid, rounded out to integers. */
  expectedLow: number | null;
  expectedHigh: number | null;
  /** the band fraction used, exposed so the surface can label it. */
  bandPct: number;
}

/**
 * For the coming `horizonDays`, count the orders that CROSS INTO the day-60–89
 * anxious window during it, and size the expected inbound WISMO load from the
 * merchant's own baseline rate.
 *
 * An order counts when its day-60 crossing (`fulfillmentStart + 60d`) falls inside
 * the half-open window `[now, now + horizonDays)` AND it hasn't already aged past
 * day 89 by `now` (the second clause is implied whenever the crossing is ≥ now,
 * but is kept explicit so the "still inside the window" intent is legible).
 *
 * `expected*` is null when the baseline rate is null or ≤ 0 — the cohort count
 * is still returned, but we never invent a rate to size a number.
 */
export function computeCohortForecast(
  orders: Order[],
  baselineWismoPer100: number | null,
  now: Date = new Date(),
  horizonDays = 7,
): CohortForecast {
  const nowMs = now.getTime();
  const horizonEndMs = nowMs + horizonDays * DAY_MS;

  const cohortOrderIds: string[] = [];
  for (const order of orders) {
    // Anchor on fulfillmentStart — the SAME basis as the canonical daysInWait
    // (lib/time) and dayStageFor (the engine), so the "day 60" this panel
    // forecasts is the exact day 60 the cockpit shows for that order. Anchoring
    // on createdAt would drift the two clocks apart and break the "check every
    // input" promise.
    const waitStartMs = new Date(order.fulfillmentStart).getTime();
    if (Number.isNaN(waitStartMs)) continue;
    // Deterministic crossings — pure arithmetic on the real order date.
    const crossIntoMs = waitStartMs + WINDOW_ENTER_DAY * DAY_MS; // daysInWait passes 60
    const crossOutMs = waitStartMs + WINDOW_EXIT_DAY * DAY_MS; // passes 89, leaves the window
    const entersDuringHorizon = crossIntoMs >= nowMs && crossIntoMs < horizonEndMs;
    const stillInsideWindow = crossOutMs > nowMs;
    if (entersDuringHorizon && stillInsideWindow) {
      cohortOrderIds.push(order.id);
    }
  }
  const enteringWindow = cohortOrderIds.length;

  const calibrated = baselineWismoPer100 != null && baselineWismoPer100 > 0;
  const ratePerOrder = calibrated ? baselineWismoPer100! / 100 : null;
  const expectedMid = ratePerOrder == null ? null : enteringWindow * ratePerOrder;
  const expectedLow = expectedMid == null ? null : Math.floor(expectedMid * (1 - FORECAST_BAND_PCT));
  const expectedHigh = expectedMid == null ? null : Math.ceil(expectedMid * (1 + FORECAST_BAND_PCT));

  return {
    horizonDays,
    windowEnterDay: WINDOW_ENTER_DAY,
    windowExitDay: WINDOW_EXIT_DAY,
    enteringWindow,
    cohortOrderIds,
    baselineWismoPer100: baselineWismoPer100 ?? null,
    ratePerOrder,
    expectedMid,
    expectedLow,
    expectedHigh,
    bandPct: FORECAST_BAND_PCT,
  };
}

/**
 * Days from `now` until an order crosses into the day-60 window — a small helper
 * for the surface's "crosses in ~N days" microcopy. Reuses lib/time's rounded
 * day arithmetic (never a hard date). Negative values are clamped to 0.
 */
export function daysUntilWindow(order: Order, now: Date = new Date()): number {
  // Anchored on fulfillmentStart to match computeCohortForecast + the canonical
  // daysInWait, so the per-order "crosses in N days" agrees with the cohort count.
  const daysInWait = daysBetween(order.fulfillmentStart, now.toISOString());
  return Math.max(0, WINDOW_ENTER_DAY - daysInWait);
}
