import assert from "node:assert/strict";
import { test } from "node:test";
import {
  FLAT_SPREAD,
  compareRows,
  escalationClass,
  measureQueue,
  percentileRank,
  rankQueue,
  type RankableRow,
} from "@/lib/queue-rank";
import type { Sentiment } from "@/lib/types";

/**
 * The two shapes that broke the queue in the ten-merchant run:
 *
 *  - p10, Foundry One. 9,000 backers, a six-month hardware slip, three live
 *    chargeback threats. EVERY ticket scored high (zero `standard`, floor 56), so
 *    "sort by risk" stopped discriminating and his THIRD chargeback threat — the
 *    customer who wrote "I have read the rule and I am building a case" — ranked
 *    5th of 8, below people who were merely furious.
 *  - p08, Marrow & Mould. 210 backers, one kiln, fourteen tickets in ONE band. The
 *    queue produced no signal at all and said nothing about what it had ordered on.
 */

let seq = 0;
function row(over: Partial<RankableRow> & { riskScore: number; sentiment: Sentiment }): RankableRow {
  seq += 1;
  return {
    ticketId: `tkt_${String(seq).padStart(3, "0")}`,
    createdAt: new Date(Date.UTC(2026, 6, 1, 0, seq)).toISOString(),
    live: true,
    daysInWait: 100,
    orderValueCents: 97_400,
    topDriver: "frustrated tone",
    ...over,
  };
}

// ── p10: the crisis cohort ───────────────────────────────────────────────────

/**
 * Eight tickets, all angry, scores 56–89 (his real floor and ceiling). Three of
 * them said the word that costs money. The third one scored 74 — LOWER than four
 * hostile tickets — which is exactly how it ended up 5th of 8.
 */
const p10 = () => [
  row({ riskScore: 89, sentiment: "chargeback-threat" }), // threat #1
  row({ riskScore: 85, sentiment: "hostile" }),
  row({ riskScore: 84, sentiment: "chargeback-threat" }), // threat #2
  row({ riskScore: 83, sentiment: "hostile" }),
  row({ riskScore: 81, sentiment: "hostile" }),
  row({ riskScore: 78, sentiment: "hostile" }),
  row({ riskScore: 74, sentiment: "chargeback-threat" }), // threat #3 — "I am building a case"
  row({ riskScore: 56, sentiment: "anxious" }),
];

test("p10: a stated chargeback threat outranks every score — the worst ticket is first", () => {
  const { rows, distribution } = rankQueue(p10(), (r) => r);

  assert.equal(rows[0].sentiment, "chargeback-threat", "rank 1 is a stated chargeback threat");
  assert.equal(rows[0].queueRank, 1);
  // All three threats occupy the top three seats — the third one can no longer be
  // buried under tickets that merely scored higher.
  const threatRanks = rows
    .filter((r) => r.sentiment === "chargeback-threat")
    .map((r) => r.queueRank)
    .sort((a, b) => a - b);
  assert.deepEqual(threatRanks, [1, 2, 3], "every chargeback threat is in the top three");

  // The specific regression: the 74-scoring threat used to rank 5th of 8.
  const buriedThreat = rows.find((r) => r.riskScore === 74)!;
  assert.equal(buriedThreat.queueRank, 3, "the 'I am building a case' ticket ranks 3rd, not 5th");

  // The queue is NOT flat here (56–89), so it reports itself as risk-ordered.
  assert.equal(distribution.basis, "risk");
  assert.equal(distribution.min, 56);
  assert.equal(distribution.max, 89);
  assert.equal(distribution.spread, 33);
});

test("p10: the top row explains itself, in the merchant's own distribution", () => {
  const { rows } = rankQueue(p10(), (r) => r);
  assert.match(rows[0].rankReason, /dispute the charge/, "the reason names the intent");
  assert.match(rows[0].rankReason, /above \d+% of your live queue/, "and its place in the cohort");
  assert.equal(rows[0].riskPercentile, 94, "89 is the top score of 8 live rows");
});

// ── p08: the flat cohort ─────────────────────────────────────────────────────

/**
 * Fourteen calm/anxious tickets, all inside one band. The score cannot order them.
 * The queue must still be usefully ordered — and must SAY what it ordered on.
 */
const p08 = () =>
  [46, 39, 51, 44, 33, 47, 41, 52, 36, 45, 40, 49, 38, 43].map((d, i) =>
    row({
      riskScore: 42 + (i % 2), // 42/43 — a one-point spread, i.e. no signal
      sentiment: i % 3 === 0 ? "anxious" : "calm",
      daysInWait: d,
      orderValueCents: 4_000 + i * 100,
    }),
  );

test("p08: a flat cohort still orders usefully — and declares the tiebreak it used", () => {
  const { rows, distribution } = rankQueue(p08(), (r) => r);

  assert.ok(distribution.spread < FLAT_SPREAD, "the scores carry no ordering information");
  assert.equal(distribution.flat, true);
  assert.equal(distribution.basis, "tiebreak", "the queue says it ordered on the tiebreak");
  assert.equal(distribution.cohortSize, 14);

  // Within the same score, longest wait first — a real, defensible order.
  const top = rows[0];
  assert.equal(top.riskScore, 43, "the (barely) higher score still leads");
  const sameScore = rows.filter((r) => r.riskScore === 43);
  for (let i = 1; i < sameScore.length; i += 1) {
    assert.ok(
      sameScore[i - 1].daysInWait >= sameScore[i].daysInWait,
      "tied scores fall back to longest wait first",
    );
  }
  // And the row says so, instead of pretending the score decided it.
  assert.match(top.rankReason, /ordered on wait/, "the row names the tiebreak that decided it");
  assert.match(top.rankReason, /every live ticket scores 42–43/);
});

// ── the primitives ───────────────────────────────────────────────────────────

test("an answered ticket never dilutes the live distribution", () => {
  const rows = [
    row({ riskScore: 90, sentiment: "calm", live: false }), // already handled
    row({ riskScore: 40, sentiment: "calm" }),
    row({ riskScore: 44, sentiment: "calm" }),
  ];
  const dist = measureQueue(rows);
  assert.equal(dist.cohortSize, 2, "only the live rows are measured");
  assert.equal(dist.max, 44, "the answered 90 is not in the distribution");
});

test("percentile is null on a cohort too small to have one", () => {
  assert.equal(percentileRank(50, [50]), null);
  assert.equal(percentileRank(50, []), null);
  assert.equal(percentileRank(60, [40, 60]), 75); // 1 below + half of 1 tie, of 2
});

test("intent class: a chargeback threat is its own event, not a louder hostile", () => {
  assert.equal(escalationClass("chargeback-threat"), 0);
  assert.equal(escalationClass("hostile"), 1);
  assert.equal(escalationClass("anxious"), 2);
  assert.equal(escalationClass("calm"), 2);
});

test("the order is total and deterministic — identical rows fall through to the ticket id", () => {
  const a = row({ riskScore: 50, sentiment: "calm", ticketId: "tkt_a", createdAt: "2026-07-01T00:00:00.000Z" });
  const b = row({ riskScore: 50, sentiment: "calm", ticketId: "tkt_b", createdAt: "2026-07-01T00:00:00.000Z" });
  assert.ok(compareRows(a, b) < 0);
  assert.ok(compareRows(b, a) > 0);
  assert.equal(compareRows(a, a), 0);

  // Ranking is stable regardless of input order.
  const one = rankQueue([a, b], (r) => r).rows.map((r) => r.ticketId);
  const two = rankQueue([b, a], (r) => r).rows.map((r) => r.ticketId);
  assert.deepEqual(one, two);
});

test("an empty queue measures as empty, never as a flat zero-risk cohort with rows", () => {
  const dist = measureQueue([]);
  assert.equal(dist.cohortSize, 0);
  assert.equal(rankQueue([], (r: RankableRow) => r).rows.length, 0);
});
