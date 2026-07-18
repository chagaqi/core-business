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

// The only email-derivation methods that support a conspicuous-publication basis:
// the address was seen ON a page (observed) or on a linked social profile (social).
// Anything else — a pattern-guessed address, an unknown/blank method — has no
// publication basis and is refused. Matched case-insensitively and exactly (an
// allowlist, so no "Pattern"/"guess"/undefined slips through, unlike the old
// exact-"pattern" denylist).
const PUBLISHED_SOURCE = /^(observed|social)$/i;

/**
 * Build the compliance record for a contact, or null if it can't stand on the
 * conspicuous-publication basis. Requirements (all must hold):
 *  - a non-empty email,
 *  - an ACTUAL observed source URL — the page the enricher found the address on. We
 *    do NOT fall back to the campaign/homepage URL, because that isn't where THIS
 *    address was published; a fabricated source is worse than none for the record,
 *  - an email_source on the published allowlist (observed | social). A guessed
 *    (pattern) or unknown derivation is refused outright.
 */
export function buildCaslRecord(
  campaign: CampaignRow,
  contact: EnrichedContact,
  now: Date = new Date(),
): CaslRecord | null {
  const email = contact.email?.trim();
  if (!email) return null;

  const sourceUrl = contact.source_url?.trim();
  if (!sourceUrl) return null; // no observed page → no publication basis

  if (!PUBLISHED_SOURCE.test(contact.email_source ?? "")) return null; // pattern/unknown → refuse

  return {
    email,
    sourceUrl,
    campaignUrl: campaign.project_url,
    consentBasis: "implied-conspicuous-publication",
    capturedAt: now.toISOString(),
  };
}
