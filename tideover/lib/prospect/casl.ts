import type { CampaignRow, CaslRecord, EnrichedContact } from "@/lib/prospect/types";

/**
 * CASL compliance layer (GTM §7). Dylan sends from Canada, so CASL binds regardless
 * of recipient location. The lane we operate in is implied consent via conspicuous
 * publication: the address was posted in a business context (the creator's own site)
 * with no "no unsolicited email" notice, and the message is relevant to their role.
 *
 * The operational requirement this module enforces: log the SOURCE URL of every
 * address (the due-diligence record), and only accept business-context addresses.
 * A bare guessed/pattern email with no observed source is refused — that's outside
 * the conspicuous-publication basis.
 */

/**
 * Build the compliance record for a contact, or null if it can't stand on the
 * conspicuous-publication basis (no email, or no real source URL — e.g. a pattern-
 * guessed address the enricher never actually observed on a page).
 */
export function buildCaslRecord(
  campaign: CampaignRow,
  contact: EnrichedContact,
  now: Date = new Date(),
): CaslRecord | null {
  const email = contact.email?.trim();
  if (!email) return null;

  // The source URL is the address's due-diligence anchor. Prefer the page the
  // enricher actually found it on; fall back to the creator's own site. A
  // pattern-sourced address with no observed page has no publication basis.
  const sourceUrl = contact.source_url?.trim() || contact.website?.trim() || campaign.website?.trim();
  if (!sourceUrl) return null;
  if (contact.email_source === "pattern" && !contact.source_url?.trim()) return null;

  return {
    email,
    sourceUrl,
    campaignUrl: campaign.project_url,
    consentBasis: "implied-conspicuous-publication",
    capturedAt: now.toISOString(),
  };
}
