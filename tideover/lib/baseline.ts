import type { Merchant } from "@/lib/types";

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

export type BaselineMetricKey = "medianFrt" | "wismoPer100" | "ticketsPerWeek" | "repeatWismo";

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
