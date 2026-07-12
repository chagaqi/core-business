import { daysBetween } from "@/lib/time";
import type { Order } from "@/lib/types";

/**
 * Cohort WISMO forecast (C7, ADR-0015) — a DEMAND estimate, never an outcome.
 *
 * A long wait means WISMO ("where is my order?") tickets don't arrive evenly: they
 * spike as a cohort crosses into the window the merchant themselves promised
 * delivery in, because that is the week the buyer starts expecting a parcel. This
 * projects how many of those tickets a merchant will likely receive next week so
 * they can STAFF for the wave — the differentiator a generic helpdesk can't
 * compute, because it doesn't model the production timeline.
 *
 * THE WINDOW IS THE MERCHANT'S OWN, NOT OURS.
 * This used to be hardcoded to days 60–89. Our merchants run 60, 90, 120, 180,
 * 240-day windows: in the ten-merchant run NINE OF TEN forecast an empty cohort,
 * because their backers cross day 60 months before anyone expects a parcel — or
 * crossed it before the file was even imported. A window that is right for one
 * merchant and wrong for nine is not a measurement, it is a constant. So the
 * window is derived from `Merchant.fulfillmentWindowDays` — the window the
 * merchant published and the buyer accepted:
 *
 *   enter = the merchant's own window MIN — the first day a buyer could
 *           reasonably expect the thing to arrive;
 *   exit  = the merchant's own window MAX — past this they are not "anxious",
 *           they are OVERDUE, and they are already in the queue, not in a
 *           forecast (they are counted and surfaced separately).
 *
 * PROOF-ONLY discipline (ADR-0002, ADR-0015): every input is measured —
 *  (a) the deterministic fact that a given order crosses its enter-day on
 *      `fulfillmentStart + enterDay` — the same wait clock as the canonical
 *      daysInWait (pure arithmetic on real order dates, no estimation);
 *  (b) the merchant's own promised window; and
 *  (c) the merchant's OWN baseline WISMO rate (`baseline.wismoPer100Orders`),
 *      which only the merchant can report about the desk we were not there for.
 * We forecast inbound VOLUME (workload), never a Tideover efficacy claim and never
 * a hard date. Without (c) the forecast is UNCALIBRATED: the cohort count is still
 * a fact and is shown, but no ticket-load figure is sized. We never borrow a
 * benchmark rate to fill the hole.
 *
 * Pure and deterministic (`now` is injected); zero I/O.
 */

const DAY_MS = 86_400_000;

/**
 * Fallback window, used ONLY when a merchant has no usable fulfillment window on
 * file. Marked `windowSource: "default"` so the surface can say the window is not
 * theirs yet, rather than passing our constant off as their promise.
 */
export const DEFAULT_ENTER_DAY = 60;
export const DEFAULT_EXIT_DAY = 89;

/**
 * Uncertainty band applied around the point estimate. The point (cohort × rate)
 * is expanded ±25% and rounded OUT to integer ticket counts (floor low / ceil
 * high) so the surface renders a defensible range, never a false-precise point.
 */
export const FORECAST_BAND_PCT = 0.25;

export type ForecastWindowSource = "merchant-window" | "default";

export interface ForecastWindow {
  enterDay: number;
  exitDay: number;
  source: ForecastWindowSource;
}

/**
 * The anxious window for THIS merchant: the window they promised. Falls back to
 * the legacy 60–89 constant only when the merchant carries no usable window, and
 * says which of the two it used.
 */
export function forecastWindowFor(
  windowDays: { min: number; max: number } | null | undefined,
): ForecastWindow {
  const min = windowDays?.min;
  const max = windowDays?.max;
  const usable =
    typeof min === "number" &&
    typeof max === "number" &&
    Number.isFinite(min) &&
    Number.isFinite(max) &&
    min > 0 &&
    max > min;
  if (!usable) {
    return { enterDay: DEFAULT_ENTER_DAY, exitDay: DEFAULT_EXIT_DAY, source: "default" };
  }
  return { enterDay: Math.round(min), exitDay: Math.round(max), source: "merchant-window" };
}

export interface CohortForecast {
  /** length of the forward window this forecast covers (default 7 days). */
  horizonDays: number;
  /** the merchant's own window bounds, echoed for the surface's method copy. */
  windowEnterDay: number;
  windowExitDay: number;
  /** whether those bounds are the merchant's own, or our fallback constant. */
  windowSource: ForecastWindowSource;
  /** count of orders that cross INTO the merchant's window within the horizon. */
  enteringWindow: number;
  /** the ids behind `enteringWindow`, so the surface can show its work. */
  cohortOrderIds: string[];
  /** orders sitting INSIDE the window right now (already anxious, not entering). */
  inWindowNow: number;
  /**
   * Orders already PAST the merchant's own window at `now`. These people are not
   * a forecast — they are overdue, and the reason a merchant with a blown window
   * used to see an empty forecast panel and conclude the product had nothing to
   * say to them. Counted so the surface can name them instead of silently
   * dropping the merchant's whole problem out of the frame.
   */
  overdueOrders: number;
  /** the merchant's own baseline rate, echoed back (null/0 = uncalibrated). */
  baselineWismoPer100: number | null;
  /** baselineWismoPer100 / 100 — expected WISMO tickets per waiting order. */
  ratePerOrder: number | null;
  /** false until the merchant's own baseline WISMO rate exists. */
  calibrated: boolean;
  /** why there is no sized figure, or null once calibrated. */
  uncalibratedReason: string | null;
  /** point estimate = enteringWindow × ratePerOrder (null when uncalibrated). */
  expectedMid: number | null;
  /** ±FORECAST_BAND_PCT band around expectedMid, rounded out to integers. */
  expectedLow: number | null;
  expectedHigh: number | null;
  /** the band fraction used, exposed so the surface can label it. */
  bandPct: number;
}

/**
 * For the coming `horizonDays`, count the orders that CROSS INTO the merchant's own
 * promised window during it, and size the expected inbound WISMO load from the
 * merchant's own baseline rate.
 *
 * An order counts when its enter-day crossing (`fulfillmentStart + enterDay`) falls
 * inside the half-open window `[now, now + horizonDays)` AND it hasn't already aged
 * past the exit day by `now`.
 *
 * `expected*` is null when the baseline rate is null or ≤ 0 — the cohort count is
 * still returned, but we never invent a rate to size a number.
 */
export function computeCohortForecast(
  orders: Order[],
  baselineWismoPer100: number | null,
  windowDays: { min: number; max: number } | null,
  now: Date = new Date(),
  horizonDays = 7,
): CohortForecast {
  const win = forecastWindowFor(windowDays);
  const nowMs = now.getTime();
  const horizonEndMs = nowMs + horizonDays * DAY_MS;

  const cohortOrderIds: string[] = [];
  let inWindowNow = 0;
  let overdueOrders = 0;

  for (const order of orders) {
    // Anchor on fulfillmentStart — the SAME basis as the canonical daysInWait
    // (lib/time) and the stage derivation, so the day this panel forecasts is the
    // exact day the cockpit shows for that order.
    const waitStartMs = new Date(order.fulfillmentStart).getTime();
    if (Number.isNaN(waitStartMs)) continue;
    // Deterministic crossings — pure arithmetic on the real order date.
    const crossIntoMs = waitStartMs + win.enterDay * DAY_MS;
    const crossOutMs = waitStartMs + win.exitDay * DAY_MS;

    if (crossOutMs <= nowMs) {
      overdueOrders += 1;
      continue;
    }
    if (crossIntoMs <= nowMs) {
      inWindowNow += 1;
      continue;
    }
    if (crossIntoMs < horizonEndMs) cohortOrderIds.push(order.id);
  }
  const enteringWindow = cohortOrderIds.length;

  const calibrated = baselineWismoPer100 != null && baselineWismoPer100 > 0;
  const ratePerOrder = calibrated ? baselineWismoPer100! / 100 : null;
  const expectedMid = ratePerOrder == null ? null : enteringWindow * ratePerOrder;
  const expectedLow = expectedMid == null ? null : Math.floor(expectedMid * (1 - FORECAST_BAND_PCT));
  const expectedHigh = expectedMid == null ? null : Math.ceil(expectedMid * (1 + FORECAST_BAND_PCT));

  return {
    horizonDays,
    windowEnterDay: win.enterDay,
    windowExitDay: win.exitDay,
    windowSource: win.source,
    enteringWindow,
    cohortOrderIds,
    inWindowNow,
    overdueOrders,
    baselineWismoPer100: baselineWismoPer100 ?? null,
    ratePerOrder,
    calibrated,
    uncalibratedReason: calibrated
      ? null
      : "No baseline WISMO rate on file yet — that number describes your support desk before Tideover arrived, so only you can report it. Until you do, this panel shows the cohort count (a measured fact) and sizes no ticket load.",
    expectedMid,
    expectedLow,
    expectedHigh,
    bandPct: FORECAST_BAND_PCT,
  };
}

/**
 * Days from `now` until an order crosses into the merchant's own window — the
 * surface's "crosses in ~N days" microcopy. Reuses lib/time's rounded day
 * arithmetic (never a hard date). Negative values are clamped to 0.
 */
export function daysUntilWindow(order: Order, enterDay: number, now: Date = new Date()): number {
  const elapsed = daysBetween(order.fulfillmentStart, now.toISOString());
  return Math.max(0, enterDay - elapsed);
}
