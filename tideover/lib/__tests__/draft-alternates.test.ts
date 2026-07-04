import assert from "node:assert/strict";
import { test } from "node:test";
import {
  embeddedBandPhrase,
  generateAlternates,
  shortenToBrief,
  OVERDUE_ETA_PHRASE,
} from "@/lib/draft-alternates";
import { containsHardDate } from "@/lib/proof";
import { getDraftAlternates, getTicketView } from "@/lib/service";
import { getRepositories } from "@/lib/repositories";

// Fixed evaluation instant so every seed order's days-in-wait (and therefore its
// day-stage + confidence band) is deterministic regardless of wall clock.
const NOW = new Date("2026-07-04T12:00:00.000Z");
const MERCHANT = "mch_lumen0001";

const SIGNOFF = "— The Lumen Forge crew";
const BAND = "in weeks 9–11";
// A synthetic day-7 standard draft (greeting · stage sentence · band sentence ·
// closing) so the shortener's drop-the-middle behaviour is exercised deterministically.
const SYNTH_STANDARD =
  "Hey Sam — totally get that waiting on something you've already paid for can feel like a long time. " +
  "Quick reassurance: your Lumen Forge order is confirmed and on schedule — your unit is on the production line. " +
  `Current window is ${BAND}, and I'll message you the moment it moves to the next stage so you don't have to ask. ` +
  "You're in good hands." +
  `\n\n${SIGNOFF}`;

// ── pure shortener ──────────────────────────────────────────────────────────

test("brief keeps greeting + band sentence + sign-off, drops the middle", () => {
  const brief = shortenToBrief(SYNTH_STANDARD, { bandPhrase: BAND, signoff: SIGNOFF });
  assert.ok(brief.startsWith("Hey Sam —"), "keeps the greeting");
  assert.ok(brief.endsWith(SIGNOFF), "keeps the sign-off verbatim");
  assert.ok(brief.includes(BAND), "never drops the confidence band");
  assert.ok(!brief.includes("Quick reassurance"), "drops the middle stage sentence");
  assert.ok(!brief.includes("good hands"), "drops the trailing elaboration");
  assert.ok(brief.length < SYNTH_STANDARD.length, "brief is strictly shorter");
  assert.equal(containsHardDate(brief), false, "brief introduces no hard date");
});

test("shortener falls back to standard when the band phrase is absent", () => {
  const out = shortenToBrief(SYNTH_STANDARD, { bandPhrase: "not in the text", signoff: SIGNOFF });
  assert.equal(out, SYNTH_STANDARD);
});

test("shortener falls back to standard when the sign-off can't be isolated", () => {
  const noSignoff = "Hi there. Current window is in weeks 9–11, and I'll keep you posted. Thanks.";
  const out = shortenToBrief(noSignoff, { bandPhrase: BAND, signoff: SIGNOFF });
  assert.equal(out, noSignoff);
});

test("embeddedBandPhrase mirrors the engine's eta_band resolution", () => {
  assert.equal(embeddedBandPhrase("ships in weeks 9–11", false), "in weeks 9–11");
  assert.equal(embeddedBandPhrase("running a little longer than planned — see the update below", true), OVERDUE_ETA_PHRASE);
});

test("generateAlternates passes standard/deEscalate through and shortens brief", () => {
  const alts = generateAlternates({
    standard: SYNTH_STANDARD,
    deEscalate: SYNTH_STANDARD,
    bandPhrase: BAND,
    signoff: SIGNOFF,
  });
  assert.equal(alts.standard, SYNTH_STANDARD);
  assert.equal(alts.deEscalate, SYNTH_STANDARD);
  assert.ok(alts.brief.length < SYNTH_STANDARD.length);
  assert.ok(alts.brief.includes(BAND));
});

// ── service wrapper over real seed data ─────────────────────────────────────

test("getDraftAlternates: standard === engine draft; brief keeps the band, adds no hard date, and is ≤ standard", async () => {
  const repos = getRepositories();
  const tickets = (await repos.tickets.list({ merchantId: MERCHANT })).filter(
    (t) => t.status !== "sent",
  );
  assert.ok(tickets.length > 0, "seed has open Lumen Forge tickets");

  let anyStrictlyShorter = false;
  for (const t of tickets) {
    const alts = await getDraftAlternates(t.id, NOW);
    const view = await getTicketView(t.id, NOW);
    assert.ok(alts && view, `resolves ${t.id}`);

    // standard is byte-identical to what ships today.
    assert.equal(alts!.standard, view!.intel.reassurance.draftText, `standard === engine draft (${t.id})`);

    // brief preserves the embedded confidence band substring.
    const bandPhrase = embeddedBandPhrase(view!.timeline.confidenceBand, view!.timeline.overdue);
    assert.ok(alts!.brief.includes(bandPhrase), `brief keeps the band (${t.id})`);

    // brief is never longer than standard.
    assert.ok(alts!.brief.length <= alts!.standard.length, `brief ≤ standard (${t.id})`);
    if (alts!.brief.length < alts!.standard.length) anyStrictlyShorter = true;

    // de-escalate is produced without error (a non-empty engine draft).
    assert.equal(typeof alts!.deEscalate, "string");
    assert.ok(alts!.deEscalate.length > 0, `deEscalate produced (${t.id})`);

    // proof-only: all three views are free of hard dates.
    assert.equal(containsHardDate(alts!.standard), false, `standard no hard date (${t.id})`);
    assert.equal(containsHardDate(alts!.brief), false, `brief no hard date (${t.id})`);
    assert.equal(containsHardDate(alts!.deEscalate), false, `deEscalate no hard date (${t.id})`);
  }

  // Prove the shortener actually shortens on real drafts (not just falls back).
  assert.ok(anyStrictlyShorter, "at least one ticket's brief is strictly shorter than its standard");
});

test("getDraftAlternates returns null for an unknown ticket", async () => {
  assert.equal(await getDraftAlternates("tkt_does_not_exist", NOW), null);
});
