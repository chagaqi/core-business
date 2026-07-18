import type { Sentiment } from "@/lib/types";

/**
 * QUEUE RANKING — relative to the merchant's OWN live distribution.
 *
 * WHY THIS EXISTS. The refund-risk engine produces an ABSOLUTE score (0–100) and
 * an absolute band (standard / watch / at_risk). Absolute thresholds are the right
 * shape for one ticket and the wrong shape for a QUEUE, because a queue is only
 * ever read relatively: the operator wants the worst thing they have, not the
 * things that clear a fixed bar. Both ends of the ten-merchant run broke on this:
 *
 *   - p10 (the crisis merchant, 9,000 backers, six-month slip). Every ticket was
 *     angry, so every ticket scored high: ZERO `standard` tickets, a risk floor of
 *     56. "Sort by risk" stopped being triage, and his THIRD chargeback threat —
 *     the customer who wrote "I have read the rule and I am building a case" —
 *     ranked 5th of 8, below tickets from people who were merely furious.
 *   - p08 (210 backers, one kiln). All fourteen tickets landed in ONE band. The
 *     queue had no signal at all, and nothing told the operator what it had
 *     ordered on, so the order looked arbitrary — which it effectively was.
 *
 * THE RULE. Three things decide a row's place, in this order:
 *
 *   1. INTENT CLASS. A customer who says they will dispute the charge is not a
 *      more-intense version of a customer who is angry — it is a different event,
 *      with money and a card network attached. It outranks every score. This is
 *      what fixes p10: a chargeback threat can never again sit below a ticket that
 *      merely scored higher.
 *   2. RISK, READ RELATIVELY. Within a class, the higher score wins — and the row
 *      carries its PERCENTILE within the merchant's live cohort, so "risk 74" is
 *      reported as what it actually is on that desk today (top of the queue at
 *      p08, unremarkable at p10) instead of as a number against a fixed bar that
 *      means something different for every merchant.
 *   3. A DECLARED TIEBREAK. When the scores carry no information — p08's flat
 *      cohort, or any tie — the order falls to wait, then money, then arrival.
 *      The queue SAYS SO (`QueueDistribution.basis === "tiebreak"`), and each row
 *      says why it is where it is (`rankReason`). An operator must always be able
 *      to answer "why is this on top?", and the answer must be true.
 *
 * Pure and deterministic: no I/O, no clock, total ordering (ties fall through to
 * the ticket id), so the same queue always sorts the same way.
 */

/** How the queue's ORDER was actually decided. Surfaced, never inferred. */
export type QueueOrderingBasis = "risk" | "tiebreak";

/**
 * A cohort whose risk scores span fewer than this many points carries no ordering
 * information — the engine is telling us these tickets are the same. Below it the
 * queue declares itself ordered on the tiebreak rather than pretending the score
 * discriminated. (p08's fourteen tickets spanned one band; p10's spanned 33.)
 */
export const FLAT_SPREAD = 5;

/** The minimum live rows needed before a percentile means anything. */
export const PERCENTILE_MIN_N = 2;

/** The minimal row shape the ranking needs. A QueueRow satisfies it structurally. */
export interface RankableRow {
  ticketId: string;
  createdAt: string;
  sentiment: Sentiment;
  /** false for a row that has already been answered — it is not "live" work. */
  live: boolean;
  riskScore: number;
  daysInWait: number;
  orderValueCents: number;
  /** the engine's plain-language top factor. */
  topDriver: string;
}

/** The measured shape of the merchant's LIVE queue — the thing risk is read against. */
export interface QueueDistribution {
  /** live (unanswered) rows the distribution was measured over. */
  cohortSize: number;
  min: number;
  max: number;
  median: number;
  /** max − min. Zero means the engine drew no distinction at all. */
  spread: number;
  /** the scores carry no ordering information (spread < FLAT_SPREAD). */
  flat: boolean;
  /** what the queue was ordered on, given the above. */
  basis: QueueOrderingBasis;
}

/**
 * The relative facts stamped on one row.
 *
 * NOTE the name. The refund-risk engine already publishes a `priorityRank` — its
 * own absolute rank, `(escalated?0:1000) + (1000 − score) − ltvBoost`, pinned by
 * the eval invariants. This is a DIFFERENT quantity (a position in one merchant's
 * queue at one moment), so it gets a DIFFERENT name. Quietly reusing `priorityRank`
 * for a new meaning is exactly how the sim's `draft.riskScore` came to disagree
 * with the cockpit's score by a fixed +4 and made every export contradict the UI.
 */
export interface RowRanking {
  /** 1 = top of this merchant's queue, as ordered by compareRows. */
  queueRank: number;
  /**
   * Percentile rank of this row's score within the LIVE cohort (0–100): the share
   * scoring below it, plus half the ties. Null below PERCENTILE_MIN_N live rows —
   * a percentile over one ticket is not a measurement. A flat cohort correctly
   * lands everyone near 50, which is the truthful reading: nothing separates them.
   */
  riskPercentile: number | null;
  /** the engine's top factor, carried onto the row (it used to be thrown away). */
  topDriver: string;
  /** why this row sits where it sits. The answer to "why is this on top?". */
  rankReason: string;
}

/**
 * INTENT CLASS. Lower ranks first.
 *  0 — the customer has said they will dispute the charge. A money event.
 *  1 — hostile. Angry, but has not reached for the card network.
 *  2 — everyone else (anxious / calm), ordered on risk.
 */
export function escalationClass(sentiment: Sentiment): 0 | 1 | 2 {
  if (sentiment === "chargeback-threat") return 0;
  if (sentiment === "hostile") return 1;
  return 2;
}

const CLASS_REASON: Record<0 | 1, string> = {
  0: "said they will dispute the charge",
  1: "hostile tone",
};

/** Lower median on an even count — matches lib/baseline's median. */
function medianOf(sorted: number[]): number {
  if (sorted.length === 0) return 0;
  return sorted[Math.floor((sorted.length - 1) / 2)];
}

/**
 * Measure the LIVE queue: the distribution every row's risk is reported against.
 * Answered rows are excluded — they are not work, and letting them into the
 * denominator would let a merchant flatter their own queue by clearing it.
 */
export function measureQueue(rows: RankableRow[]): QueueDistribution {
  const scores = rows.filter((r) => r.live).map((r) => r.riskScore).sort((a, b) => a - b);
  const cohortSize = scores.length;
  if (cohortSize === 0) {
    return { cohortSize: 0, min: 0, max: 0, median: 0, spread: 0, flat: true, basis: "tiebreak" };
  }
  const min = scores[0];
  const max = scores[cohortSize - 1];
  const spread = max - min;
  const flat = spread < FLAT_SPREAD;
  return {
    cohortSize,
    min,
    max,
    median: medianOf(scores),
    spread,
    flat,
    basis: flat ? "tiebreak" : "risk",
  };
}

/**
 * Percentile rank of `score` within `sorted` (ascending): below + half the ties.
 * Null below PERCENTILE_MIN_N — one ticket has no distribution to sit in.
 */
export function percentileRank(score: number, sorted: number[]): number | null {
  const n = sorted.length;
  if (n < PERCENTILE_MIN_N) return null;
  let below = 0;
  let equal = 0;
  for (const s of sorted) {
    if (s < score) below += 1;
    else if (s === score) equal += 1;
  }
  return Math.round(((below + equal / 2) / n) * 100);
}

/**
 * The total order. Intent class, then risk, then the declared tiebreak ladder
 * (longest wait, then most money, then earliest arrival), then the ticket id so
 * the sort is total and stable across drivers.
 */
export function compareRows(a: RankableRow, b: RankableRow): number {
  const ca = escalationClass(a.sentiment);
  const cb = escalationClass(b.sentiment);
  if (ca !== cb) return ca - cb;
  if (a.riskScore !== b.riskScore) return b.riskScore - a.riskScore;
  if (a.daysInWait !== b.daysInWait) return b.daysInWait - a.daysInWait;
  if (a.orderValueCents !== b.orderValueCents) return b.orderValueCents - a.orderValueCents;
  const ta = new Date(a.createdAt).getTime();
  const tb = new Date(b.createdAt).getTime();
  if (ta !== tb) return ta - tb;
  return a.ticketId < b.ticketId ? -1 : a.ticketId > b.ticketId ? 1 : 0;
}

/**
 * WHY IS THIS ON TOP. One sentence, built only from measured facts: the intent
 * class, the row's percentile in the live cohort, and — when the scores are flat —
 * the tiebreak that actually decided it. Never asserts an outcome, never claims a
 * prediction; it explains an ordering.
 */
export function rankReasonFor(
  row: RankableRow,
  dist: QueueDistribution,
  percentile: number | null,
): string {
  const cls = escalationClass(row.sentiment);
  const lead = cls === 2 ? null : CLASS_REASON[cls];

  let relative: string;
  if (dist.cohortSize < PERCENTILE_MIN_N || percentile == null) {
    relative = `risk ${row.riskScore} · ${row.topDriver}`;
  } else if (dist.flat) {
    // The scores are the same, so they did NOT order this queue. Say what did.
    relative = `every live ticket scores ${dist.min}–${dist.max}, so this is ordered on wait: ${row.daysInWait} days`;
  } else {
    relative = `risk ${row.riskScore} · ${row.topDriver} · above ${percentile}% of your live queue`;
  }
  return lead ? `${lead} — ${relative}` : relative;
}

export interface RankedQueue<T> {
  rows: Array<T & RowRanking>;
  distribution: QueueDistribution;
}

/**
 * Rank a merchant's queue. Returns the rows in queue order, each carrying its
 * relative facts, plus the distribution they were measured against.
 *
 * `toRankable` maps the caller's row onto the minimal shape, so lib/service can
 * hand its QueueRow straight through without this module knowing about repositories.
 */
export function rankQueue<T>(
  rows: T[],
  toRankable: (row: T) => RankableRow,
): RankedQueue<T> {
  const rankables = rows.map(toRankable);
  const distribution = measureQueue(rankables);
  const liveScores = rankables
    .filter((r) => r.live)
    .map((r) => r.riskScore)
    .sort((a, b) => a - b);

  const paired = rows.map((row, i) => ({ row, rankable: rankables[i] }));
  paired.sort((a, b) => compareRows(a.rankable, b.rankable));

  return {
    rows: paired.map(({ row, rankable }, i) => {
      const riskPercentile = percentileRank(rankable.riskScore, liveScores);
      return {
        ...row,
        queueRank: i + 1,
        riskPercentile,
        topDriver: rankable.topDriver,
        rankReason: rankReasonFor(rankable, distribution, riskPercentile),
      };
    }),
    distribution,
  };
}
