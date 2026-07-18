import assert from "node:assert/strict";
import { test } from "node:test";
import { scoreCampaign, isFit } from "@/lib/prospect/scoring";
import { buildCaslRecord } from "@/lib/prospect/casl";
import { draftOutreach } from "@/lib/prospect/draft";
import { buildLead, buildLeads, dedupeLeads, rankLeads } from "@/lib/prospect/pipeline";
import type { CampaignRow, EnrichedContact } from "@/lib/prospect/types";

const NOW = new Date("2026-07-18T00:00:00.000Z");

// state_changed_at 2026-05-01 → 78 days before NOW (in the 30–150 wait window).
const HOT: CampaignRow = {
  pid: "ks_hot1", project_name: "Aether Clockwork Miniatures", project_url: "https://kickstarter.com/projects/aetherforge/minis",
  category: "Tabletop Games", category_parent: "Games", state: "successful", backers_count: 1240, comments_count: 312,
  updates_count: 4, state_changed_at: "2026-05-01T00:00:00.000Z", creator_name: "Mara Vinstra", website: "https://aetherforge.example", platform: "kickstarter",
};
// 40 days post-funding, low WISMO pressure, mid size → warm.
const WARM: CampaignRow = {
  pid: "ks_warm1", project_name: "Tidepool Kettle", project_url: "https://kickstarter.com/projects/tidepool/kettle",
  category: "Product Design", state: "successful", backers_count: 340, comments_count: 22, updates_count: 10,
  state_changed_at: "2026-06-08T00:00:00.000Z", website: "https://tidepoolgoods.example", platform: "kickstarter",
};
// digital-only category → never fit.
const DIGITAL: CampaignRow = {
  pid: "ks_d1", project_name: "Neon Drift", project_url: "https://k.com/nd", category: "Video Games", state: "successful",
  backers_count: 900, comments_count: 200, updates_count: 2, state_changed_at: "2026-05-20T00:00:00.000Z", website: "https://neondrift.example",
};

const CONTACT: EnrichedContact = {
  id: "ks_hot1", contact_name: "Mara Vinstra", first_name: "Mara", email: "mara@aetherforge.example",
  email_source: "observed", confidence: "high", mx_valid: true, source_url: "https://aetherforge.example/about", status: "ok",
};

// ── fit ──────────────────────────────────────────────────────────────────────────

test("isFit: funded physical-goods with a site + backers = fit; digital / no-site / unfunded = not", () => {
  assert.equal(isFit(HOT), true);
  assert.equal(isFit(WARM), true);
  assert.equal(isFit(DIGITAL), false, "video games are digital-only");
  assert.equal(isFit({ ...HOT, website: "" }), false, "no site to enrich");
  assert.equal(isFit({ ...HOT, state: "live" }), false, "not yet funded, doesn't owe fulfillment");
  assert.equal(isFit({ ...HOT, backers_count: 12 }), false, "below the backer floor");
  assert.equal(isFit({ ...HOT, state: "live", is_late_pledge: true }), true, "late-pledge still owes fulfillment");
});

// ── scoring ──────────────────────────────────────────────────────────────────────

test("scoreCampaign: a late, high-WISMO, funded campaign scores hot", () => {
  const s = scoreCampaign(HOT, NOW);
  assert.equal(s.fit, true);
  assert.equal(s.waitDays, 78);
  assert.equal(s.tier, "hot");
  assert.ok(s.distressScore >= 90, `expected high score, got ${s.distressScore}`);
  assert.equal(s.wismoPressure, 78);
  assert.ok(s.distressScore <= 100, "score is capped at 100");
});

test("scoreCampaign: a mid-size, low-pressure funded campaign is warm", () => {
  const s = scoreCampaign(WARM, NOW);
  assert.equal(s.tier, "warm");
  assert.ok(s.distressScore >= 35 && s.distressScore < 60, `got ${s.distressScore}`);
});

test("scoreCampaign: a non-fit (digital) campaign is always cold, whatever it scores", () => {
  const s = scoreCampaign(DIGITAL, NOW);
  assert.equal(s.fit, false);
  assert.equal(s.tier, "cold");
});

test("scoreCampaign: wait-window shaping — too-early and likely-delivered get no wait bonus", () => {
  const tooEarly = scoreCampaign({ ...HOT, state_changed_at: NOW.toISOString() }, NOW);
  const delivered = scoreCampaign({ ...HOT, state_changed_at: "2025-01-01T00:00:00.000Z" }, NOW);
  const mid = scoreCampaign(HOT, NOW);
  assert.ok(mid.distressScore > tooEarly.distressScore, "mid-wait scores above just-funded");
  assert.ok(mid.distressScore > delivered.distressScore, "mid-wait scores above likely-delivered");
});

// ── CASL ─────────────────────────────────────────────────────────────────────────

test("buildCaslRecord: an observed business email gets a record with its source URL", () => {
  const r = buildCaslRecord(HOT, CONTACT, NOW);
  assert.ok(r);
  assert.equal(r.email, "mara@aetherforge.example");
  assert.equal(r.sourceUrl, "https://aetherforge.example/about");
  assert.equal(r.consentBasis, "implied-conspicuous-publication");
});

test("buildCaslRecord: no email, or a pattern-guessed address with no observed source, is refused", () => {
  assert.equal(buildCaslRecord(HOT, { ...CONTACT, email: "" }, NOW), null);
  assert.equal(buildCaslRecord(HOT, { email: "guess@x.example", email_source: "pattern", source_url: "" }, NOW), null);
});

// ── draft ────────────────────────────────────────────────────────────────────────

test("draftOutreach: personalized, signed, proof-only (no fabricated metric, no calendar date)", () => {
  const d = draftOutreach(HOT, CONTACT, scoreCampaign(HOT, NOW));
  assert.ok(d.subject.includes("Mara") && d.subject.includes("Aether Clockwork Miniatures"));
  assert.ok(d.body.includes("Mara") && d.body.includes("Aether Clockwork Miniatures"));
  assert.ok(d.body.trim().endsWith("— Dylan"));
  assert.equal(/\d{4}|january|february|march|april|june|july|august|september|october|november|december/i.test(d.body), false, "no calendar date");
  assert.equal(/\d+%/.test(d.body), false, "no fabricated percentage claim");
});

test("draftOutreach: falls back gracefully when the contact has no first name", () => {
  const d = draftOutreach(WARM, { email: "hi@x.example" }, scoreCampaign(WARM, NOW));
  assert.ok(d.subject.includes("there"));
  assert.ok(d.body.includes("Tidepool Kettle"));
});

// ── pipeline ─────────────────────────────────────────────────────────────────────

test("buildLead: composes score + casl + draft; drops a contact with no email", () => {
  const lead = buildLead(HOT, CONTACT, NOW);
  assert.ok(lead);
  assert.equal(lead.pid, "ks_hot1");
  assert.equal(lead.score.tier, "hot");
  assert.equal(lead.email, "mara@aetherforge.example");
  assert.equal(buildLead(HOT, { id: "ks_hot1" }, NOW), null, "no email → no lead");
});

test("buildLeads: merges contacts to campaigns by pid, drops the unmatched", () => {
  const leads = buildLeads([HOT, WARM], [CONTACT], NOW);
  assert.equal(leads.length, 1, "only HOT had a matched contact");
  assert.equal(leads[0].pid, "ks_hot1");
});

test("dedupeLeads: suppresses a lead whose pid OR email was already contacted", () => {
  const warmContact: EnrichedContact = { id: "ks_warm1", first_name: "Ben", email: "hello@tidepoolgoods.example", email_source: "observed", source_url: "https://tidepoolgoods.example/c" };
  const leads = buildLeads([HOT, WARM], [CONTACT, warmContact], NOW);
  assert.equal(leads.length, 2);
  assert.equal(dedupeLeads(leads, new Set(["ks_hot1"])).length, 1, "pid suppressed");
  assert.equal(dedupeLeads(leads, new Set(["hello@tidepoolgoods.example"])).length, 1, "email suppressed");
});

test("rankLeads: fit-first, then distress score descending", () => {
  const warmContact: EnrichedContact = { id: "ks_warm1", email: "hello@tidepoolgoods.example", email_source: "observed", source_url: "https://tidepoolgoods.example/c" };
  const digitalContact: EnrichedContact = { id: "ks_d1", email: "team@neondrift.example", email_source: "observed", source_url: "https://neondrift.example/a" };
  const ranked = rankLeads(buildLeads([WARM, DIGITAL, HOT], [CONTACT, warmContact, digitalContact], NOW));
  assert.equal(ranked[0].pid, "ks_hot1", "hottest fit first");
  assert.equal(ranked[ranked.length - 1].score.fit, false, "non-fit ranks last");
});
