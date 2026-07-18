import type { CampaignRow, ScoredCampaign, Tier } from "@/lib/prospect/types";

/**
 * Distress/fit scoring for a scraped crowdfunding campaign. The engine ranks
 * VISIBLY-LATE funded campaigns first — the creators who need Tideover now and will
 * actually reply (GTM §4). No estimated-delivery date exists in the scraper output,
 * so the wait clock is anchored on `state_changed_at` (the funded date) for funded
 * campaigns. Pure functions, injectable `now`, so the sweep + tests are deterministic.
 */

const DAY_MS = 86_400_000;

function daysSince(iso: string | undefined, now: Date): number | null {
  if (!iso) return null;
  const t = new Date(iso).getTime();
  if (Number.isNaN(t)) return null;
  return Math.max(0, Math.round((now.getTime() - t) / DAY_MS));
}

// Clearly-digital categories with no physical-fulfillment wait — excluded from the
// ICP. Tabletop/board games, product design, tech/hardware, comics, publishing,
// fashion, food, art all KEEP (they ship physical goods and run long waits). Video
// games, software/apps, music, film, podcasts, journalism, performance do not.
const DIGITAL_CATEGORY = /video game|software|mobile app|web app|saas|music|album|film|documentary|podcast|journalism|dance|theater|theatre|webcomic/i;

// Hosts that are marketplaces, socials, fundraising aggregators, or link shims — NOT
// a business site the enricher can crawl for a contact. A crowdfunding creator's
// "website" is very often one of these (verified on the live scrape: Gumroad product
// links, Fundrazr, ArtStation, Patreon). We need their OWN domain.
const NON_BUSINESS_HOST =
  /(^|\.)(gumroad\.com|fundrazr\.com|kickstarter\.com|indiegogo\.com|gamefound\.com|backerkit\.com|patreon\.com|artstation\.com|myminifactory\.com|etsy\.com|amazon\.[a-z.]+|facebook\.com|instagram\.com|twitter\.com|x\.com|tiktok\.com|youtube\.com|youtu\.be|discord\.(gg|com)|linktr\.ee|bit\.ly|linkedin\.com|threads\.net|bsky\.app|reddit\.com|notion\.site|substack\.com|carrd\.co|tumblr\.com)$/i;

/**
 * The best enrichable business domain for a campaign, or null. Picks the first URL
 * across `website` + `websites_all` whose host is a real own-domain — skipping the
 * marketplace / social / aggregator hosts the enricher can't pull a contact from.
 * This is the field the enricher should actually receive, not the raw `website`.
 */
export function bestEnrichableSite(row: CampaignRow): string | null {
  const urls = [row.website, ...(row.websites_all ?? [])].filter(
    (u): u is string => typeof u === "string" && u.trim().length > 0,
  );
  for (const u of urls) {
    let host: string;
    try {
      host = new URL(u.trim()).hostname.replace(/^www\./i, "");
    } catch {
      continue; // not a parseable absolute URL
    }
    if (!NON_BUSINESS_HOST.test(host)) return u.trim();
  }
  return null;
}

// States that mean a campaign is NOT yet owing fulfillment. Everything else —
// successful, funded, ended, late_pledge, or an unlabeled row from a scrape already
// filtered to funded (searchState) — counts as owing. Platform-robust: Kickstarter
// labels a funded campaign "successful", Gamefound uses a different value, so a rigid
// `state === "successful"` was dropping real funded Gamefound leads (verified).
const NON_FUNDED_STATE = /^(live|upcoming|started|failed|canceled|cancelled|suspended|draft)$/i;

/**
 * ICP fit: a funded (or late-pledge) campaign that owes physical fulfillment, has a
 * real enrichable creator domain (not a marketplace/social link), and cleared a
 * backer floor. Digital-only categories are excluded. Human review + the actor's
 * `category` targeting do the fine sorting; this is the coarse gate.
 */
export function isFit(row: CampaignRow): boolean {
  const funded = !NON_FUNDED_STATE.test(row.state ?? "") || row.is_late_pledge === true;
  const backers = row.backers_count ?? 0;
  const digital = DIGITAL_CATEGORY.test(`${row.category ?? ""} ${row.category_parent ?? ""}`);
  return funded && bestEnrichableSite(row) !== null && backers >= 100 && !digital;
}

/** The citable lateness signal, phrased as a clause the draft drops in. */
export function buildTrigger(row: CampaignRow, waitDays: number | null): string {
  const comments = row.comments_count ?? 0;
  const updates = row.updates_count ?? 0;
  const parts: string[] = [];
  if (waitDays !== null) parts.push(`funded about ${waitDays} days ago`);
  if (comments > 0) {
    parts.push(
      updates > 0
        ? `${comments} backer comments against ${updates} update${updates === 1 ? "" : "s"}`
        : `${comments} backer comments and no updates posted yet`,
    );
  }
  return parts.join(", ");
}

/**
 * Score a campaign 0–100 across three components:
 *  - WISMO pressure: comments / max(updates,1). Many questions, few updates = a
 *    creator going quiet under load = the exact pain Tideover removes. (up to 50)
 *  - Wait window: peaks 30–150 days post-funding (mid-fulfillment, the ICP moment);
 *    <30 is too early, >300 is likely delivered. (up to 30)
 *  - Scale: bigger backer counts carry more support load. (up to 20)
 * Non-fit rows are always tier "cold" regardless of score.
 */
export function scoreCampaign(row: CampaignRow, now: Date = new Date()): ScoredCampaign {
  const comments = row.comments_count ?? 0;
  const updates = row.updates_count ?? 0;
  const wismoPressure = comments / Math.max(updates, 1);
  const waitDays = daysSince(row.state_changed_at, now);
  const fit = isFit(row);
  const reasons: string[] = [];

  let score = 0;

  const wismoPts = Math.min(50, wismoPressure * 5); // a 10:1 comments:updates ratio caps it
  score += wismoPts;
  if (wismoPressure >= 3) reasons.push(`${comments} comments vs ${updates} updates`);

  if (waitDays !== null) {
    if (waitDays >= 30 && waitDays <= 150) {
      score += 30;
      reasons.push(`~${waitDays} days into fulfillment`);
    } else if (waitDays > 150 && waitDays <= 300) {
      score += 15;
      reasons.push(`~${waitDays} days post-funding`);
    }
  }

  const backers = row.backers_count ?? 0;
  if (backers >= 500) {
    score += 20;
    reasons.push(`${backers.toLocaleString("en-US")} backers`);
  } else if (backers >= 100) {
    score += 10;
  }

  score = Math.max(0, Math.min(100, Math.round(score)));
  const tier: Tier = !fit ? "cold" : score >= 60 ? "hot" : score >= 35 ? "warm" : "cold";

  return {
    distressScore: score,
    tier,
    waitDays,
    wismoPressure: Math.round(wismoPressure * 10) / 10,
    fit,
    reasons,
    trigger: buildTrigger(row, waitDays),
  };
}
