import { OVERRUN_STAGE } from "@/lib/types";
import type {
  Merchant,
  Order,
  OrderTimeline,
  ProductionStatus,
  ResolvedStageKey,
  StageDef,
} from "@/lib/types";

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

const STAGE_ORDER: ResolvedStageKey[] = [
  "sourcing",
  "tooling",
  "production",
  "qc",
  "freight",
  "dispatch",
  // Terminal and out-of-plan: past every band the merchant authored. It sorts
  // LAST so a timeline never marks it "upcoming", but it is not a stage anyone
  // ships from — see resolveStageFromBands.
  OVERRUN_STAGE,
];

export function stageIndex(key: ResolvedStageKey): number {
  return STAGE_ORDER.indexOf(key);
}

/**
 * DERIVE the order's production stage from how long the customer has ACTUALLY
 * been waiting, against the merchant's own day-bands. This is the single
 * highest-leverage function in the data spine, and it replaces a value that was
 * stamped once at CSV import and never moved again.
 *
 * Two rules, both of which the frozen version got wrong:
 *
 *  1. BANDS ARE INCLUSIVE. Merchants author them the way humans write ranges —
 *     "0-20, 21-62, 63-95". The old read was half-open [from, to), so a wait
 *     landing exactly on a boundary matched NO band, fell through to stages[0],
 *     and told 28 of p01's backers (waiting 52-82 days) that paper was still
 *     being sourced. Bands are read as [from, to] and the FIRST match wins, so
 *     a merchant who authors overlapping bands gets the earlier (more
 *     conservative) stage rather than a fallthrough.
 *
 *  2. PAST EVERY BAND IS NOT "DISPATCH". The old code clamped an overrun wait to
 *     the band with the highest ceiling — always the last stage, always some
 *     flavour of "shipped". Our ICP is merchants who blew their window, so the
 *     MODAL customer is past the last band, so the modal customer was told their
 *     order had left the warehouse. ~4,758 of p10's 9,000 backers got that
 *     sentence about a machine that did not exist yet, and one of them was
 *     already building a case. Past the last band returns OVERRUN_STAGE: overdue,
 *     unknown, and claiming nothing. What fills that silence is the merchant's
 *     own status board (lib/status-board.ts), not an inference.
 *
 * Pure. No I/O. `elapsedDays` is the caller's days-in-wait.
 */
export function resolveStageFromBands(stages: StageDef[], elapsedDays: number): ResolvedStageKey {
  if (stages.length === 0) return OVERRUN_STAGE;
  const d = Math.max(0, elapsedDays);
  // INCLUSIVE on both ends — the way the merchant wrote them down.
  for (const s of stages) {
    if (d >= s.dayBand.from && d <= s.dayBand.to) return s.key;
  }
  // Before the first band opens (a merchant whose plan starts at day 3, say):
  // the order has not entered the plan yet, so the first stage is the truthful
  // answer — nothing has happened, and the first stage is "nothing has happened".
  const earliest = stages.reduce((a, b) => (b.dayBand.from < a.dayBand.from ? b : a));
  if (d < earliest.dayBand.from) return earliest.key;
  // Inside the plan's span but between two bands the merchant left a gap in:
  // take the LAST band that has already opened. Still their own plan, never a
  // jump forward.
  const opened = stages.filter((s) => d >= s.dayBand.from);
  const latestOpen = opened.reduce<StageDef | null>(
    (a, b) => (a === null || b.dayBand.from > a.dayBand.from ? b : a),
    null,
  );
  const latestCeiling = stages.reduce((a, b) => (b.dayBand.to > a.dayBand.to ? b : a));
  if (d > latestCeiling.dayBand.to) return OVERRUN_STAGE;
  return latestOpen ? latestOpen.key : earliest.key;
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
 * Compute the full timeline view for an order: days in wait, the
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

  // OVERRUN: past every band the merchant authored. There is no stage def to
  // read a ceiling from, and inventing one is how the old clamp shipped
  // "dispatched" to people holding nothing. An overrun order is overdue by
  // definition — the plan is spent — so it takes the overdue band, not a
  // computed one.
  const overrun = order.productionStage === OVERRUN_STAGE;
  const stageDef = overrun
    ? null
    : (merchant.stages.find((s) => s.key === order.productionStage) ?? merchant.stages[0]);

  // remaining lower bound: whichever is later — the current stage ceiling or the
  // fulfillment-window remainder — clamped at zero.
  const stageRemaining = stageDef ? Math.max(0, stageDef.dayBand.to - elapsed) : 0;
  const windowRemaining = Math.max(0, total - elapsed);
  const remainingLo = Math.max(0, Math.min(stageRemaining || windowRemaining, windowRemaining));
  const remainingHi = remainingLo + variance;
  const overdue = overrun || elapsed > total;

  const confidenceBand = overdue
    ? "running a little longer than planned — see the update below"
    : `ships ${formatBand(remainingLo, remainingHi)}`;

  const currentIdx = stageIndex(order.productionStage);
  const stages: OrderTimeline["stages"] = merchant.stages.map((s) => {
    const idx = stageIndex(s.key);
    // Overrun → every stage is "unknown". Not "done" (that would mark Dispatch
    // complete on an order that has never been built), not "upcoming" (that
    // would claim nothing has started). The merchant's plan has run out; only
    // the merchant's own status board can speak now.
    const state: OrderTimeline["stages"][number]["state"] = overrun
      ? "unknown"
      : idx < currentIdx
        ? "done"
        : idx === currentIdx
          ? "active"
          : "upcoming";
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

/**
 * What is physically happening, as a clause the playbook can merge into a
 * sentence ("Right now {stage_blurb}").
 *
 * Precedence, and it is the whole point of the status board:
 *
 *  1. THE MERCHANT'S OWN CURRENT WORDS. If the merchant has posted a current
 *     status for this stage, that headline is the blurb. A human typed it today;
 *     a band is a plan someone typed months ago. The human wins. (Scoped statuses
 *     resolve per-order in lib/status-board.ts and are applied at the read seam,
 *     which stamps the resolved stage onto the order; this merchant-wide fast
 *     path covers the common single-cohort case with no extra read.)
 *  2. The merchant's authored blurb for the stage.
 *  3. OVERRUN with nothing posted: say we do not know, and say it plainly. The
 *     old fallback was the literal string "in production" — a fabricated physical
 *     fact, handed to a customer, in the merchant's voice. Never again.
 *
 * A status headline is proof-linted on WRITE (lib/status-board.ts), so it can
 * never carry a hard date into a draft.
 */
export function stageBlurb(merchant: Merchant, key: ResolvedStageKey): string {
  const current: ProductionStatus | undefined = merchant.productionStatus;
  if (current && current.stageKey === key && current.headline.trim()) {
    return current.headline.trim();
  }
  const def: StageDef | undefined = merchant.stages.find((s) => s.key === key);
  if (def) return def.blurb;
  return "past the window we planned for — I won't claim a stage I can't confirm, and I'd rather tell you that than guess";
}

/**
 * Coarse relative freshness stamp for a past ISO timestamp — "just now", "3
 * hours ago", "2 days ago", "5 weeks ago". Used on the workshop feed, where an
 * exact clock time would add noise, not reassurance. Never a hard date. `now` is
 * injectable so it stays deterministic in tests. Clamps future timestamps to
 * "just now" rather than rendering a negative age.
 */
export function timeAgo(iso: string, now: Date = new Date()): string {
  const then = new Date(iso).getTime();
  if (Number.isNaN(then)) return "";
  const mins = Math.floor(Math.max(0, now.getTime() - then) / 60_000);
  if (mins < 1) return "just now";
  if (mins < 60) return `${mins} minute${mins === 1 ? "" : "s"} ago`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours} hour${hours === 1 ? "" : "s"} ago`;
  const days = Math.floor(hours / 24);
  if (days < 7) return `${days} day${days === 1 ? "" : "s"} ago`;
  if (days < 30) {
    const weeks = Math.floor(days / 7);
    return `${weeks} week${weeks === 1 ? "" : "s"} ago`;
  }
  const months = Math.floor(days / 30);
  return `${months} month${months === 1 ? "" : "s"} ago`;
}
