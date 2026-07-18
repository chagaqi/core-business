/**
 * Types for the Tideover prospect engine (GTM outbound). The scraping is done by
 * Dylan's Apify actors (ScrapersDelight kickstarter/indiegogo/gamefound scrapers +
 * local-business-enricher); this module + lib/prospect/* is the Tideover-side layer
 * that scores, dedups, CASL-logs, and drafts outreach on top of their output.
 *
 * Field names mirror the actors' real output schema (verified 2026-07-18). Only the
 * fields the pipeline actually reads are typed; the actors emit more.
 */

export type Platform = "kickstarter" | "indiegogo" | "gamefound";

/**
 * One campaign row from a crowdfunding scraper (the three share one schema).
 * `state="successful"` = funded and now owes fulfillment — the ICP. There is NO
 * estimated-delivery field in the output, so `state_changed_at` (the funded/ended
 * date) is our fulfillment-clock start.
 */
export interface CampaignRow {
  pid: string;
  project_name: string;
  project_url: string;
  blurb?: string;
  category?: string;
  category_parent?: string;
  state?: string;
  is_late_pledge?: boolean;
  backers_count?: number;
  comments_count?: number;
  updates_count?: number;
  percent_funded?: number;
  usd_pledged?: number;
  /** funded/ended date — the fulfillment-clock start (no delivery-estimate exists). */
  state_changed_at?: string;
  deadline?: string;
  launched_at?: string;
  creator_name?: string;
  /** the creator's OWN homepage — the field that feeds the enricher, NOT project_url. */
  website?: string;
  websites_all?: string[];
  socials?: Record<string, string>;
  location_country?: string;
  platform?: Platform;
}

/** One enriched contact from the local-business-enricher, keyed back by `id`=pid. */
export interface EnrichedContact {
  id?: string;
  contact_name?: string;
  first_name?: string;
  last_name?: string;
  role?: string;
  email?: string;
  email_source?: string;
  confidence?: "high" | "medium" | "low" | "none";
  mx_valid?: boolean;
  /** the page the address was found on — the CASL due-diligence record. */
  source_url?: string;
  status?: string;
  website?: string;
  company?: string;
}

export type Tier = "hot" | "warm" | "cold";

export interface ScoredCampaign {
  /** 0–100 distress/fit score; higher = more likely to need Tideover now and reply. */
  distressScore: number;
  tier: Tier;
  /** days since funded (state_changed_at), or null if unknown. */
  waitDays: number | null;
  /** comments_count / max(updates_count, 1) — the core WISMO-pressure ratio. */
  wismoPressure: number;
  fit: boolean;
  reasons: string[];
  /** the specific, citable lateness signal for personalization (2%→4% reply lever). */
  trigger: string;
}

/**
 * CASL compliance record (GTM §7). Implied consent via conspicuous publication:
 * the address was published in a business context on the creator's own site. We log
 * the source URL per address — that's the due-diligence record.
 */
export interface CaslRecord {
  email: string;
  sourceUrl: string;
  campaignUrl: string;
  consentBasis: "implied-conspicuous-publication";
  capturedAt: string;
}

export interface OutreachDraft {
  subject: string;
  body: string;
}

/** A fully-processed lead: campaign + contact + score + compliance + draft. */
export interface Lead {
  pid: string;
  platform: Platform | undefined;
  projectName: string;
  projectUrl: string;
  creatorName: string | undefined;
  email: string;
  contactName: string | undefined;
  emailConfidence: EnrichedContact["confidence"];
  score: ScoredCampaign;
  casl: CaslRecord;
  draft: OutreachDraft;
}
