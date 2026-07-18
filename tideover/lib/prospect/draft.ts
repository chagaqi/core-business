import type { CampaignRow, EnrichedContact, OutreachDraft, ScoredCampaign } from "@/lib/prospect/types";

/**
 * Draft the cold outreach for a scored lead. Proof-only (no fabricated metrics or
 * track record — only Dylan's real operator background), anti-slop, and personalized
 * from the campaign's own signals. It cites the wait stage naturally rather than
 * reciting scraped comment counts, which reads as surveillance.
 *
 * Every draft is a STARTING POINT: the copy standard is "no AI email ships unedited,"
 * so Dylan approves and tunes each in the daily batch. Reply-based CTA (no link) for
 * deliverability + the CASL posture. Pure, no I/O.
 */

/**
 * Scraped fields (project_name, first_name) are untrusted. Strip control chars
 * (Unicode control category), collapse whitespace, and cap length so a hostile or
 * malformed campaign title can't mangle the draft. Not a security boundary (Dylan
 * reviews every send), just hygiene.
 */
function clean(s: string, max: number): string {
  return s
    .replace(/\p{Cc}+/gu, " ")
    .replace(/\s+/g, " ")
    .trim()
    .slice(0, max);
}

/** A natural, non-creepy phrasing of where the campaign is in its wait. */
function waitClause(score: ScoredCampaign): string {
  const d = score.waitDays;
  const pressure = score.wismoPressure >= 3;
  let stage: string;
  if (d === null) stage = "you're into the fulfillment stretch now";
  else if (d < 45) stage = "you're a few weeks into the wait";
  else if (d < 90) stage = "you're a couple months into the wait";
  else if (d < 180) stage = "you're deep into the wait now";
  else stage = "you've been in the wait a good while";
  return pressure
    ? `${stage}, and the where's-my-order questions are starting to outpace the updates`
    : stage;
}

export function draftOutreach(
  campaign: CampaignRow,
  contact: EnrichedContact,
  score: ScoredCampaign,
): OutreachDraft {
  const first = clean(contact.first_name || contact.contact_name?.split(/\s+/)[0] || "there", 40) || "there";
  const brand = clean(campaign.project_name, 80) || "your campaign";

  const subject = `${first} — the stretch after ${brand} funded`;

  const body = [
    `Hi ${first} — saw ${brand} funded, congrats. Heads-up on the part nobody warns you about: the wait between the money landing and the thing shipping. From the campaign, ${waitClause(score)}, which is right where the inbox turns into "any update on my order?" on repeat.`,
    `I ran fulfillment and the where's-my-order comms for a physical-goods brand for years. Answered the day-60 refund email, and the backer threatening a chargeback at 11pm, more times than I can count. The calm answer at day 20 is a different answer than the one at day 80, and getting that wrong is what turns a waiting backer into a dispute.`,
    `I'm doing free 15-minute presale-support teardowns for a few crowdfunding brands mid-fulfillment. I'll show you the two or three points in your wait where backers are most likely to bail, on your actual setup. Want one? Reply and I'll send a couple of times.`,
    `— Dylan`,
  ].join("\n\n");

  return { subject, body };
}
