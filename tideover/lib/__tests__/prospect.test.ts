import assert from "node:assert/strict";
import { test } from "node:test";
import { scoreCampaign, isFit, bestEnrichableSite } from "@/lib/prospect/scoring";
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
const WARM: CampaignRow = {
  pid: "ks_warm1", project_name: "Tidepool Kettle", project_url: "https://kickstarter.com/projects/tidepool/kettle",
  category: "Product Design", state: "successful", backers_count: 340, comments_count: 22, updates_count: 10,
  state_changed_at: "2026-06-08T00:00:00.000Z", website: "https://tidepoolgoods.example", platform: "kickstarter",
};
const DIGITAL: CampaignRow = {
  pid: "ks_d1", project_name: "Neon Drift", project_url: "https://k.com/nd", category: "Video Games", state: "successful",
  backers_count: 900, comments_count: 200, updates_count: 2, state_changed_at: "2026-05-20T00:00:00.000Z", website: "https://neondrift.example",
};

const CONTACT: EnrichedContact = {
  id: "ks_hot1", contact_name: "Mara Vinstra", first_name: "Mara", email: "mara@aetherforge.example",
  email_source: "observed", confidence: "high", mx_valid: true, source_url: "https://aetherforge.example/about", status: "ok",
};

// ── enrichable site + fit ─────────────────────────────────────────────────────────

test("bestEnrichableSite: picks a real own-domain, skips marketplace/social/aggregator links", () => {
  assert.equal(bestEnrichableSite(HOT), "https://aetherforge.example");
  assert.equal(
    bestEnrichableSite({ ...HOT, website: "https://foo.gumroad.com/l/x", websites_all: ["https://foo.gumroad.com/l/x", "https://realstudio.example"] }),
    "https://realstudio.example",
    "falls through the marketplace link to the real site",
  );
  assert.equal(bestEnrichableSite({ ...HOT, website: "https://patreon.com/x", websites_all: ["https://instagram.com/y"] }), null);
  assert.equal(bestEnrichableSite({ ...HOT, website: "", websites_all: [] }), null);
  assert.equal(bestEnrichableSite({ ...HOT, website: "not a url", websites_all: [] }), null, "unparseable is skipped");
});

test("isFit: funded physical-goods with an ENRICHABLE domain + backers = fit; else not", () => {
  assert.equal(isFit(HOT), true);
  assert.equal(isFit(WARM), true);
  assert.equal(isFit(DIGITAL), false, "video games are digital-only");
  assert.equal(isFit({ ...HOT, website: "https://foo.gumroad.com/l/x", websites_all: [] }), false, "marketplace link isn't enrichable");
  assert.equal(isFit({ ...HOT, website: "", websites_all: [] }), false, "no site");
  assert.equal(isFit({ ...HOT, state: "live" }), false, "not yet funded");
  assert.equal(isFit({ ...HOT, backers_count: 12 }), false, "below the backer floor");
  assert.equal(isFit({ ...HOT, state: "live", is_late_pledge: true }), true, "late-pledge still owes fulfillment");
});

// ── scoring ──────────────────────────────────────────────────────────────────────

test("scoreCampaign: a late, high-WISMO, funded campaign scores hot (capped at 100)", () => {
  const s = scoreCampaign(HOT, NOW);
  assert.equal(s.fit, true);
  assert.equal(s.waitDays, 78);
  assert.equal(s.tier, "hot");
  assert.ok(s.distressScore >= 90 && s.distressScore <= 100, `got ${s.distressScore}`);
  assert.equal(s.wismoPressure, 78);
});

test("scoreCampaign: a mid-size, low-pressure funded campaign is warm", () => {
  const s = scoreCampaign(WARM, NOW);
  assert.equal(s.tier, "warm");
  assert.ok(s.distressScore >= 35 && s.distressScore < 60, `got ${s.distressScore}`);
});

test("scoreCampaign: a non-fit (digital) campaign is always cold", () => {
  assert.equal(scoreCampaign(DIGITAL, NOW).tier, "cold");
});

test("scoreCampaign: wait-window shaping — too-early and likely-delivered get no wait bonus", () => {
  const tooEarly = scoreCampaign({ ...HOT, state_changed_at: NOW.toISOString() }, NOW);
  const delivered = scoreCampaign({ ...HOT, state_changed_at: "2025-01-01T00:00:00.000Z" }, NOW);
  const mid = scoreCampaign(HOT, NOW);
  assert.ok(mid.distressScore > tooEarly.distressScore);
  assert.ok(mid.distressScore > delivered.distressScore);
});

// ── CASL ─────────────────────────────────────────────────────────────────────────

test("buildCaslRecord: an observed business email with a real source page gets a record", () => {
  const r = buildCaslRecord(HOT, CONTACT, NOW);
  assert.ok(r);
  assert.equal(r.email, "mara@aetherforge.example");
  assert.equal(r.sourceUrl, "https://aetherforge.example/about");
  assert.equal(r.consentBasis, "implied-conspicuous-publication");
});

test("buildCaslRecord: refuses without email, without an observed source, or from a non-published derivation", () => {
  assert.equal(buildCaslRecord(HOT, { ...CONTACT, email: "" }, NOW), null, "no email");
  assert.equal(buildCaslRecord(HOT, { ...CONTACT, source_url: "" }, NOW), null, "no observed source (no fabricated homepage fallback)");
  assert.equal(buildCaslRecord(HOT, { ...CONTACT, email_source: "pattern" }, NOW), null, "guessed address");
  assert.equal(buildCaslRecord(HOT, { ...CONTACT, email_source: "Pattern" }, NOW), null, "case/label variant can't bypass");
  assert.equal(buildCaslRecord(HOT, { ...CONTACT, email_source: undefined }, NOW), null, "unknown derivation refused");
  assert.ok(buildCaslRecord(HOT, { ...CONTACT, email_source: "social" }, NOW), "a social-profile source is accepted");
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

test("draftOutreach: sanitizes untrusted names, falls back with no first name", () => {
  const d = draftOutreach(WARM, { email: "hi@x.example" }, scoreCampaign(WARM, NOW));
  assert.ok(d.subject.includes("there"));
  assert.ok(d.body.includes("Tidepool Kettle"));
  const messy = draftOutreach({ ...WARM, project_name: "Bad\n\tName" }, CONTACT, scoreCampaign(WARM, NOW));
  assert.equal(/[\n\t]/.test(messy.subject), false, "no raw whitespace control chars leak into the subject");
});

// ── pipeline ─────────────────────────────────────────────────────────────────────

test("buildLead: gates fit + deliverability + CASL; composes score + draft", () => {
  const lead = buildLead(HOT, CONTACT, NOW);
  assert.ok(lead);
  assert.equal(lead.pid, "ks_hot1");
  assert.equal(lead.score.tier, "hot");
  assert.equal(lead.email, "mara@aetherforge.example");
  assert.equal(buildLead(HOT, { id: "ks_hot1", email: "x@y.example" }, NOW), null, "no observed source → no lead");
  assert.equal(buildLead(DIGITAL, { ...CONTACT, id: "ks_d1" }, NOW), null, "non-fit → no lead");
  assert.equal(buildLead(HOT, { ...CONTACT, mx_valid: false }, NOW), null, "undeliverable → no lead");
  assert.equal(buildLead(HOT, { ...CONTACT, confidence: "none" }, NOW), null, "no real contact → no lead");
});

test("buildLeads: merges contacts to campaigns by pid, drops unmatched + non-fit", () => {
  const leads = buildLeads([HOT, WARM, DIGITAL], [CONTACT], NOW);
  assert.equal(leads.length, 1, "only HOT had a matched, fit, contactable lead");
  assert.equal(leads[0].pid, "ks_hot1");
});

test("dedupeLeads: suppresses by pid OR email case-insensitively; a mixed-case pid still matches a lowercased seen key", () => {
  const contact: EnrichedContact = { id: "KS_HOT1", email: "m@a.example", email_source: "observed", confidence: "high", mx_valid: true, source_url: "https://a.example/x" };
  const leads = buildLeads([{ ...HOT, pid: "KS_HOT1" }], [contact], NOW);
  assert.equal(leads.length, 1);
  assert.equal(dedupeLeads(leads, new Set(["ks_hot1"])).length, 0, "lowercased seen pid suppresses the mixed-case lead");
  assert.equal(dedupeLeads(leads, new Set(["m@a.example"])).length, 0, "email suppressed too");
});

test("dedupeLeads: collapses two same-email leads within one batch", () => {
  const c1: EnrichedContact = { id: "ks_hot1", email: "same@x.example", email_source: "observed", confidence: "high", mx_valid: true, source_url: "https://x.example/a" };
  const c2: EnrichedContact = { id: "ks_warm1", email: "SAME@x.example", email_source: "observed", confidence: "high", mx_valid: true, source_url: "https://y.example/a" };
  const leads = buildLeads([HOT, WARM], [c1, c2], NOW);
  assert.equal(leads.length, 2, "both built");
  assert.equal(dedupeLeads(leads, new Set()).length, 1, "same email (case-insensitive) collapses to one within the batch");
});

test("rankLeads: fit leads by distress score descending; nothing non-fit is ever emitted", () => {
  const warmContact: EnrichedContact = { id: "ks_warm1", email: "hello@tidepoolgoods.example", email_source: "observed", confidence: "medium", mx_valid: true, source_url: "https://tidepoolgoods.example/c" };
  const ranked = rankLeads(buildLeads([WARM, HOT], [CONTACT, warmContact], NOW));
  assert.equal(ranked.length, 2);
  assert.equal(ranked[0].pid, "ks_hot1", "hotter first");
  assert.ok(ranked.every((l) => l.score.fit), "all emitted leads are fit");
});
