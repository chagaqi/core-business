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
  /** readable capture date, e.g. "May 29, 2026". */
  capturedOn: string;
  /** raw ISO capture stamp, for a <time dateTime> attribute. */
  capturedOnIso: string;
  metrics: BaselineMetric[];
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
  return {
    merchantName: merchant.name,
    isDemo: merchant.isDemo,
    capturedOn: formatCaptureDate(b.capturedOn),
    capturedOnIso: b.capturedOn,
    metrics: [
      {
        key: "medianFrt",
        label: "Median first-response time",
        value: formatSeconds(b.medianFrtSec),
        gloss: "Half of first replies to a waiting customer took longer than this.",
      },
      {
        key: "wismoPer100",
        label: "WISMO tickets per 100 orders",
        value: `${b.wismoPer100Orders} per 100 orders`,
        gloss: "“Where is my order?” tickets raised for every 100 orders placed.",
      },
      {
        key: "ticketsPerWeek",
        label: "Support tickets per week",
        value: `${b.ticketsPerWeek} / week`,
        gloss: "Total support tickets the team handled in an average week.",
      },
      {
        key: "repeatWismo",
        label: "Repeat-WISMO rate",
        value: `${b.repeatWismoPct}%`,
        gloss: "Share of WISMO askers who came back to ask about the same order again.",
      },
    ],
  };
}
