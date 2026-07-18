import type { CampaignRow, EnrichedContact, Lead } from "@/lib/prospect/types";
import { scoreCampaign, isFit } from "@/lib/prospect/scoring";
import { buildCaslRecord } from "@/lib/prospect/casl";
import { draftOutreach } from "@/lib/prospect/draft";

/**
 * Pure assembly + list ops for the prospect pipeline. The orchestrator
 * (scripts/prospect-engine.mjs) does the Apify I/O; everything shaped here is pure
 * and tested, so the scoring/compliance/dedup logic can't silently drift.
 */

/**
 * Assemble one fully-processed Lead from a campaign row + its enriched contact, or
 * null if it isn't contactable (no email) or can't stand on the CASL basis. Merges
 * score + compliance record + draft into a single outreach-ready object.
 */
export function buildLead(campaign: CampaignRow, contact: EnrichedContact, now: Date = new Date()): Lead | null {
  if (!isFit(campaign)) return null; // outside the ICP — never draft/emit (matches the live filter)
  if (contact.mx_valid === false) return null; // the enricher flagged the domain undeliverable
  if (contact.confidence === "none") return null; // no real contact was found

  const casl = buildCaslRecord(campaign, contact, now);
  if (!casl) return null; // no email or no publication basis → not contactable

  const score = scoreCampaign(campaign, now);
  const draft = draftOutreach(campaign, contact, score);

  return {
    pid: campaign.pid,
    platform: campaign.platform,
    projectName: campaign.project_name,
    projectUrl: campaign.project_url,
    creatorName: campaign.creator_name,
    email: casl.email,
    contactName: contact.contact_name,
    emailConfidence: contact.confidence,
    score,
    casl,
    draft,
  };
}

/**
 * Merge enricher contacts back onto their campaigns (by pid=id) and build leads.
 * One campaign can yield at most one lead here (the enricher's primary contact);
 * campaigns with no matched/usable contact are dropped.
 */
export function buildLeads(campaigns: CampaignRow[], contacts: EnrichedContact[], now: Date = new Date()): Lead[] {
  const byId = new Map<string, EnrichedContact>();
  for (const c of contacts) {
    const id = c.id ?? "";
    // keep the first usable (has email) contact per id; the enricher emits one primary.
    if (id && c.email && !byId.has(id)) byId.set(id, c);
  }
  const leads: Lead[] = [];
  for (const campaign of campaigns) {
    const contact = byId.get(campaign.pid);
    if (!contact) continue;
    const lead = buildLead(campaign, contact, now);
    if (lead) leads.push(lead);
  }
  return leads;
}

/**
 * Drop leads already contacted, AND collapse intra-batch duplicates. `seen` holds
 * prior pids AND emails from past runs (lowercased by the loader). Either match
 * suppresses — a creator re-running a second campaign shouldn't be re-hit, and the
 * same address surfacing under two pids shouldn't double-send. Keys are lowercased on
 * BOTH sides (the loader lowercases too), so a mixed-case pid can't slip the guard.
 * Emitted leads are added to the working set so two leads sharing an email within one
 * batch don't both survive.
 */
export function dedupeLeads(leads: Lead[], seen: Set<string>): Lead[] {
  const out: Lead[] = [];
  const working = new Set(seen); // clone so intra-batch additions don't mutate the caller's set
  for (const lead of leads) {
    const pidKey = lead.pid.toLowerCase();
    const emailKey = lead.email.toLowerCase();
    if (working.has(pidKey) || working.has(emailKey)) continue;
    working.add(pidKey);
    working.add(emailKey);
    out.push(lead);
  }
  return out;
}

/** Rank by distress score, highest first; fit rows always outrank non-fit. */
export function rankLeads(leads: Lead[]): Lead[] {
  return [...leads].sort((a, b) => {
    if (a.score.fit !== b.score.fit) return a.score.fit ? -1 : 1;
    return b.score.distressScore - a.score.distressScore;
  });
}
