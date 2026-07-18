import { getRepositories } from "@/lib/repositories";
import { daysBetween } from "@/lib/time";
import type { BaselineCohort, Merchant, Order } from "@/lib/types";

/**
 * Day-0 Baseline assembler (M4).
 *
 * A pure RENDER of the merchant's OWN pre-Tideover support numbers
 * (Merchant.baseline) into human-readable display copy. It invents nothing and
 * projects nothing: these are the starting-point measurements captured before
 * Tideover touched anything, so every later result can be reported as a change
 * against THESE numbers.
 *
 * Proof-only doctrine: there is NO projected improvement here, NO "we'll cut
 * this by X%", NO fabricated outcome, NO hard date. The whole value of the
 * artifact is that it is the honest before-picture. Everything below is a pure,
 * deterministic transform of the raw baseline — trivially unit-testable, no I/O.
 */

const SEC_PER_MIN = 60;
const MIN_PER_HOUR = 60;

/**
 * Humanize a duration in seconds as "7h 30m" (hours + minutes).
 *
 * Rounds to the nearest whole minute via total-minutes so a 59-second overflow
 * carries cleanly into the next unit (e.g. 3599s → "1h", never "0h 60m"). When
 * the whole hours drop out, the "h" is omitted ("30m"); when the minutes drop
 * out, the "m" is omitted ("7h"). Non-finite or negative input clamps to 0.
 */
export function formatSeconds(sec: number): string {
  const safe = Number.isFinite(sec) && sec > 0 ? sec : 0;
  const totalMinutes = Math.round(safe / SEC_PER_MIN);
  const hours = Math.floor(totalMinutes / MIN_PER_HOUR);
  const minutes = totalMinutes % MIN_PER_HOUR;
  if (hours > 0 && minutes > 0) return `${hours}h ${minutes}m`;
  if (hours > 0) return `${hours}h`;
  return `${minutes}m`;
}

/** Readable calendar date for the capture stamp, e.g. "May 29, 2026" (UTC). */
export function formatCaptureDate(iso: string): string {
  return new Intl.DateTimeFormat("en-US", { dateStyle: "long", timeZone: "UTC" }).format(
    new Date(iso),
  );
}

export type BaselineMetricKey =
  /** the four the MERCHANT reports about their pre-Tideover desk. */
  | "medianFrt"
  | "wismoPer100"
  | "ticketsPerWeek"
  | "repeatWismo"
  /** the five WE measure from the merchant's own order file at import. */
  | "cohortOrders"
  | "cohortOverdue"
  | "cohortMedianWait"
  | "cohortMaxWait"
  | "cohortGross";

export interface BaselineMetric {
  key: BaselineMetricKey;
  /** short column heading, e.g. "Median first-response time". */
  label: string;
  /** the humanized number, e.g. "7h 30m" / "150 per 100 orders". */
  value: string;
  /** one-line plain-English gloss: what this number means, no outcome claim. */
  gloss: string;
}

export interface FormattedBaseline {
  merchantName: string;
  /** merchant.isDemo — drives the SAMPLE DATA watermark on the report. */
  isDemo: boolean;
  /**
   * Whether a real baseline has actually been captured. A freshly-onboarded
   * merchant starts with an all-zero baseline (onboarding seeds zeros until an
   * export is measured); showing those zeros as a MEASUREMENT would be a
   * proof-only lie ("0s first response"). When false, every metric value reads
   * "Not yet measured" instead of a fabricated zero.
   */
  measured: boolean;
  /** readable capture date, e.g. "May 29, 2026". */
  capturedOn: string;
  /** raw ISO capture stamp, for a <time dateTime> attribute. */
  capturedOnIso: string;
  metrics: BaselineMetric[];
  /**
   * The day-0 cohort we MEASURED from the merchant's own order file at import
   * (lib/baseline.ts measureCohort), or null when no import has landed. Kept
   * separate from `metrics` because the provenance is different and a report must
   * never blur the two: `metrics` is what the merchant TOLD us about the desk we
   * never saw; this is what we COUNTED in the file they gave us.
   */
  cohort: BaselineMetric[] | null;
  /** whether a cohort measurement exists at all (an import has landed). */
  cohortMeasured: boolean;
}

/** Sentinel text shown for every metric when no baseline has been captured yet. */
const NOT_YET_MEASURED = "Not yet measured";

/**
 * A baseline is "measured" once any of the four numbers is non-zero. The
 * all-zero starting state is the unset sentinel, not a real reading of zero.
 * Exported so the dashboard view model shares one definition of "measured"
 * (a fresh merchant must never surface a fabricated "baseline 0s").
 */
export function isBaselineMeasured(b: Merchant["baseline"]): boolean {
  return (
    b.medianFrtSec > 0 ||
    b.wismoPer100Orders > 0 ||
    b.ticketsPerWeek > 0 ||
    b.repeatWismoPct > 0
  );
}

// ─── the day-0 cohort measurement (the write path that never existed) ───────

/**
 * THE BASELINE WRITE PATH.
 *
 * `Merchant.baseline` was seeded all-zeros at onboarding and there was not ONE
 * other write site in the entire repository. So `isBaselineMeasured` was false
 * forever, the day-0 report was an unreachable surface, the WISMO forecast was
 * null for 10 of 10 merchants, and the dashboard's deflection figure was
 * arithmetic against nothing. On day 30 the merchant opened the screen that is
 * supposed to prove the product worked and read "Not yet measured" on all four
 * metrics. That is not a missing feature — that is the churn mechanism.
 *
 * The baseline is TWO things, and conflating them is what made it unfillable:
 *
 *  1. THE FOUR SUPPORT NUMBERS (median first-response time, WISMO per 100 orders,
 *     tickets per week, repeat-WISMO rate). These describe the merchant's desk
 *     BEFORE Tideover existed. We were not there. We cannot measure a period we
 *     did not observe, and writing a zero would be a fabricated measurement — the
 *     exact thing ADR-0002 forbids. So the merchant reports them (four questions,
 *     at onboarding), and they are stamped `source: "merchant-reported"`. If the
 *     merchant skips them they stay unset and every surface keeps saying "Not yet
 *     measured", which is true.
 *
 *  2. THE COHORT (below). This we CAN measure, and it is real the moment the file
 *     lands: how many orders, how many still inside their window, how many already
 *     past it, the median and worst wait, the gross under management. It is
 *     computed from the merchant's own order file, it is captured at import, and
 *     it is the "before" picture a renewal argument is actually made against
 *     ("you came in with 4,758 backers past their window; here is where they are
 *     now"). It never claims an outcome and it never projects one.
 */

/** Median of a numeric list (lower median on an even count). 0 on empty. */
function median(values: number[]): number {
  if (values.length === 0) return 0;
  const sorted = [...values].sort((a, b) => a - b);
  const mid = Math.floor((sorted.length - 1) / 2);
  return sorted[mid];
}

/**
 * MEASURE the merchant's cohort as it stands right now. Pure — takes the orders,
 * returns the numbers. Nothing here is reported, assumed, or projected: every
 * figure is a count or a median over the merchant's own rows.
 */
export function measureCohort(orders: Order[], now: Date = new Date()): BaselineCohort {
  const nowIso = now.toISOString();
  const waits: number[] = [];
  let ordersInWait = 0;
  let ordersOverdue = 0;
  let grossCents = 0;
  let maxWaitDays = 0;

  for (const o of orders) {
    const wait = Math.max(0, daysBetween(o.fulfillmentStart, nowIso));
    waits.push(wait);
    if (wait > maxWaitDays) maxWaitDays = wait;
    grossCents += o.orderValueCents;
    // "Overdue" is the merchant's OWN window, not our opinion of it.
    if (nowIso > o.fulfillmentEnd) ordersOverdue += 1;
    else ordersInWait += 1;
  }

  return {
    orders: orders.length,
    ordersInWait,
    ordersOverdue,
    medianWaitDays: median(waits),
    maxWaitDays,
    grossCents,
    measuredAt: nowIso,
  };
}

/**
 * Capture the day-0 baseline for a merchant: measure their cohort from the order
 * file that just landed and persist it. Called at the END of an import, so the
 * "before" picture exists the moment there is anything to picture. Idempotent by
 * construction (it recomputes from live orders); safe to call again.
 *
 * Never touches the four merchant-reported support numbers — those are the
 * merchant's, not ours.
 */
export async function captureCohortBaseline(
  merchantId: string,
  now: Date = new Date(),
): Promise<BaselineCohort | null> {
  const repos = getRepositories();
  const merchant = await repos.merchants.findById(merchantId);
  if (!merchant) return null;

  const orders = await repos.orders.listByMerchant(merchantId);
  if (orders.length === 0) return null;

  const cohort = measureCohort(orders, now);
  await repos.merchants.update(merchantId, {
    baseline: {
      ...merchant.baseline,
      // The capture stamp is the day the picture was actually taken.
      capturedOn: cohort.measuredAt,
      cohort,
    },
  });
  return cohort;
}

/**
 * Re-measure the cohort against TODAY. The merchant's day-0 capture is immutable
 * evidence, so this returns the current reading WITHOUT overwriting it — the
 * caller (a report, the dashboard) diffs the two. Returns null when there is no
 * baseline to compare against yet.
 */
export async function recomputeCohort(
  merchantId: string,
  now: Date = new Date(),
): Promise<{ baseline: BaselineCohort | null; current: BaselineCohort } | null> {
  const repos = getRepositories();
  const merchant = await repos.merchants.findById(merchantId);
  if (!merchant) return null;
  const orders = await repos.orders.listByMerchant(merchantId);
  return { baseline: merchant.baseline.cohort ?? null, current: measureCohort(orders, now) };
}

/**
 * Record the four support numbers the merchant reports about their own
 * pre-Tideover desk. Stamped `merchant-reported` so no surface can ever pass them
 * off as something we measured. A zero stays a zero — it is a real answer — but a
 * merchant who skips the questions never gets a fabricated one.
 */
export async function recordReportedBaseline(
  merchantId: string,
  reported: {
    medianFrtSec: number;
    wismoPer100Orders: number;
    ticketsPerWeek: number;
    repeatWismoPct: number;
  },
  now: Date = new Date(),
): Promise<Merchant | null> {
  const repos = getRepositories();
  const merchant = await repos.merchants.findById(merchantId);
  if (!merchant) return null;
  const safe = (n: number) => (Number.isFinite(n) && n > 0 ? n : 0);
  return repos.merchants.update(merchantId, {
    baseline: {
      ...merchant.baseline,
      capturedOn: merchant.baseline.cohort?.measuredAt ?? now.toISOString(),
      medianFrtSec: safe(reported.medianFrtSec),
      wismoPer100Orders: safe(reported.wismoPer100Orders),
      ticketsPerWeek: safe(reported.ticketsPerWeek),
      repeatWismoPct: safe(reported.repeatWismoPct),
      source: "merchant-reported",
    },
  });
}

/** Human copy for the measured cohort block. Counts and medians only — no claims. */
export function formatCohort(cohort: BaselineCohort): BaselineMetric[] {
  const dollars = (cents: number) =>
    `$${Math.round(cents / 100).toLocaleString("en-US")}`;
  return [
    {
      key: "cohortOrders",
      label: "Orders on file at day 0",
      value: `${cohort.orders.toLocaleString("en-US")} orders`,
      gloss: "Every order in your own import, counted the day it landed.",
    },
    {
      key: "cohortOverdue",
      label: "Already past your window at day 0",
      value: `${cohort.ordersOverdue.toLocaleString("en-US")} of ${cohort.orders.toLocaleString("en-US")}`,
      gloss: "Orders that had already passed the fulfillment window you set, before we did anything.",
    },
    {
      key: "cohortMedianWait",
      label: "Median wait at day 0",
      value: `${cohort.medianWaitDays} days`,
      gloss: "Half your customers had been waiting longer than this when you arrived.",
    },
    {
      key: "cohortMaxWait",
      label: "Longest wait at day 0",
      value: `${cohort.maxWaitDays} days`,
      gloss: "The customer who had been waiting the longest on the day you imported.",
    },
    {
      key: "cohortGross",
      label: "Order value under management",
      value: dollars(cohort.grossCents),
      gloss: "Total value of the orders in the wait, from your own file.",
    },
  ];
}

/**
 * Assemble the four baseline metrics into display-ready copy. Pure: takes only
 * the merchant's name, demo flag, and raw baseline block, so it is decoupled
 * from the repository layer and cheap to unit-test on a fixture.
 */
export function formatBaseline(
  merchant: Pick<Merchant, "name" | "isDemo" | "baseline">,
): FormattedBaseline {
  const b = merchant.baseline;
  const measured = isBaselineMeasured(b);
  return {
    merchantName: merchant.name,
    isDemo: merchant.isDemo,
    measured,
    capturedOn: formatCaptureDate(b.capturedOn),
    capturedOnIso: b.capturedOn,
    cohort: b.cohort ? formatCohort(b.cohort) : null,
    cohortMeasured: Boolean(b.cohort),
    metrics: [
      {
        key: "medianFrt",
        label: "Median first-response time",
        value: measured ? formatSeconds(b.medianFrtSec) : NOT_YET_MEASURED,
        gloss: "Half of first replies to a waiting customer took longer than this.",
      },
      {
        key: "wismoPer100",
        label: "WISMO tickets per 100 orders",
        value: measured ? `${b.wismoPer100Orders} per 100 orders` : NOT_YET_MEASURED,
        gloss: "“Where is my order?” tickets raised for every 100 orders placed.",
      },
      {
        key: "ticketsPerWeek",
        label: "Support tickets per week",
        value: measured ? `${b.ticketsPerWeek} / week` : NOT_YET_MEASURED,
        gloss: "Total support tickets the team handled in an average week.",
      },
      {
        key: "repeatWismo",
        label: "Repeat-WISMO rate",
        value: measured ? `${b.repeatWismoPct}%` : NOT_YET_MEASURED,
        gloss: "Share of WISMO askers who came back to ask about the same order again.",
      },
    ],
  };
}
