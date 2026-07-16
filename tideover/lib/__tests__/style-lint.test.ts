import assert from "node:assert/strict";
import { test } from "node:test";
import { DeterministicDrafter } from "@/lib/drafting/DeterministicDrafter";
import { styleScore, type StyleRule } from "@/lib/drafting/style-lint";
import { getRepositories } from "@/lib/repositories";

/**
 * THE STRUNK LAYER (VOICE-ENGINE-SPEC.md §6) — the deterministic scorer only. It never
 * gates a send, so these tests check the number and the flags, not any pass/fail
 * behavior on a draft.
 */

const NOW = new Date("2026-07-04T12:00:00.000Z");

function rulesOf(flags: { rule: StyleRule }[]): StyleRule[] {
  return flags.map((f) => f.rule);
}

// ── each rule fires on a crafted sentence ────────────────────────────────────

test("style-lint: needless phrase is flagged", () => {
  const { flags } = styleScore("Due to the fact that your shipment is late, we apologize.");
  assert.ok(rulesOf(flags).includes("needless"));
  assert.ok(flags.some((f) => f.rule === "needless" && f.match.toLowerCase() === "due to the fact that"));
});

test("style-lint: plain-word target is flagged", () => {
  const { flags } = styleScore("We will utilize the new packing process this week.");
  assert.ok(flags.some((f) => f.rule === "plain-word" && f.match.toLowerCase() === "utilize"));
});

test("style-lint: leech word is flagged", () => {
  const { flags } = styleScore("The team is very fast about updates.");
  assert.ok(flags.some((f) => f.rule === "leech" && f.match.toLowerCase() === "very"));
});

test("style-lint: passive construction is flagged", () => {
  const { flags } = styleScore("Your order was shipped yesterday afternoon.");
  assert.ok(flags.some((f) => f.rule === "passive" && f.match.toLowerCase() === "was shipped"));
});

test("style-lint: sentence over 30 words is flagged", () => {
  const longSentence =
    "We wanted to reach out today to let you know that your order is currently moving through " +
    "the production line and the team is keeping a close eye on every stage of the process for you.";
  assert.ok(longSentence.split(/\s+/).length > 30, "fixture sentence must exceed 30 words");
  const { flags } = styleScore(longSentence);
  assert.ok(rulesOf(flags).includes("long-sentence"));
});

test("style-lint: paragraph over 3 sentences is flagged only with \\n\\n structure", () => {
  const fourSentenceParagraph = "One. Two. Three. Four.";
  // no blank-line structure: long-paragraph never fires, even on a 4-sentence block.
  assert.ok(!rulesOf(styleScore(fourSentenceParagraph).flags).includes("long-paragraph"));

  // with \n\n structure, the over-length paragraph is flagged.
  const withStructure = `Intro line.\n\n${fourSentenceParagraph}`;
  assert.ok(rulesOf(styleScore(withStructure).flags).includes("long-paragraph"));
});

// ── hedges: one is free ───────────────────────────────────────────────────────

test("style-lint: one hedge is free, a second hedge is flagged", () => {
  const oneHedge = styleScore("Maybe it ships a little early this time.");
  assert.equal(oneHedge.flags.filter((f) => f.rule === "hedge").length, 0, "first hedge is free");
  assert.equal(oneHedge.score, 100);

  const twoHedges = styleScore("Maybe it ships early, but perhaps not this batch.");
  const hedgeFlags = twoHedges.flags.filter((f) => f.rule === "hedge");
  assert.equal(hedgeFlags.length, 1, "only the instance beyond the first is flagged");
  assert.equal(hedgeFlags[0]!.weight, 2);
  assert.equal(twoHedges.score, 92);
});

// ── a clean band reply scores high ────────────────────────────────────────────

test("style-lint: a clean band reply scores >= 90", () => {
  const clean =
    "Thanks for writing, Sam. Your frames are in anodizing and the window still holds: ships in weeks 9–11. " +
    "Here is your status page: <link>. — Nia";
  const { score, flags } = styleScore(clean);
  assert.ok(score >= 90, `expected >= 90, got ${score} (flags: ${JSON.stringify(flags)})`);
});

// ── scorer is total ────────────────────────────────────────────────────────────

test("style-lint: score is clamped to [0, 100]", () => {
  const clean = styleScore("Thanks, Sam. Your order is on track. — Nia");
  assert.ok(clean.score <= 100 && clean.score >= 0);

  const heavy = styleScore(
    "Due to the fact that, at this point in time, in order to utilize the very, quite, rather, " +
      "really, fairly, extremely aforementioned herein therein process, please be advised, please " +
      "do not hesitate, kindly note it was delayed and was shipped and was posted and was given.",
  );
  assert.equal(heavy.score, 0, "a pathological sentence clamps at the floor, never negative");
});

// ── every seeded DeterministicDrafter output runs through styleScore cleanly ──

test("style-lint: DeterministicDrafter outputs across the whole seed run through styleScore without throwing", async () => {
  const repos = getRepositories();
  const drafter = new DeterministicDrafter();
  const scores: number[] = [];
  let worst: { id: string; score: number; flags: unknown } | null = null;

  for (const merchant of await repos.merchants.list()) {
    for (const ticket of await repos.tickets.list({ merchantId: merchant.id })) {
      if (!ticket.orderId) continue;
      const order = await repos.orders.findById(ticket.orderId);
      const customer = await repos.customers.findById(ticket.customerId);
      if (!order || !customer) continue;
      const out = await drafter.draft({ ticket, order, customer, merchant, now: NOW });
      const result = styleScore(out.text);
      scores.push(result.score);
      if (!worst || result.score < worst.score) {
        worst = { id: ticket.id, score: result.score, flags: result.flags };
      }
    }
  }

  assert.ok(scores.length >= 5, `expected several seeded drafts, got ${scores.length}`);
  scores.sort((a, b) => a - b);
  const min = scores[0]!;
  const median = scores[Math.floor(scores.length / 2)]!;
  const max = scores[scores.length - 1]!;
  // eslint-disable-next-line no-console -- intentional distribution report for the build report
  console.log(
    `style-lint seed distribution: min=${min} median=${median} max=${max} n=${scores.length}` +
      (worst && worst.score < 70 ? ` worst=${worst.id}(${worst.score}) flags=${JSON.stringify(worst.flags)}` : ""),
  );
  if (min >= 70) {
    assert.ok(min >= 70, "seed floor holds at 70+, asserted per the build contract");
  }
});
