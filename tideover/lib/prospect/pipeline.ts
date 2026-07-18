import type { CampaignRow, EnrichedContact, Lead } from "@/lib/prospect/types";
import { scoreCampaign } from "@/lib/prospect/scoring";
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
 * Drop leads already contacted. `seen` holds prior pids AND emails (either match
 * suppresses — a creator re-running a second campaign shouldn't be re-hit, and the
 * same address surfacing under two pids shouldn't double-send).
 */
export function dedupeLeads(leads: Lead[], seen: Set<string>): Lead[] {
  const out: Lead[] = [];
  for (const lead of leads) {
    if (seen.has(lead.pid) || seen.has(lead.email.toLowerCase())) continue;
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
