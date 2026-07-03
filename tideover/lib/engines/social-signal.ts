import type { Merchant, ScoredSignal, SocialSignal } from "@/lib/types";

/**
 * ENGINE 4 — Social-Signal Scoring (upsell surface).
 *
 * Deterministic, no AI. Scores a public post for relevance (brand/campaign
 * mention) × negativity (wait-anxiety keywords). Flags the dangerous ones and
 * drafts a public-safe proactive outreach line. Drafts only — never auto-posts.
 */

const NEG_KEYWORDS = [
  "delay",
  "refund",
  "scam",
  "chargeback",
  "where is",
  "ripped off",
  "ripoff",
  "never shipped",
  "feeling ripped",
  "worried",
  "burned",
];

const clamp01 = (n: number) => Math.max(0, Math.min(1, n));

export interface SocialScoreConfig {
  flagThreshold: number;
}

export const DEFAULT_SOCIAL_CONFIG: SocialScoreConfig = { flagThreshold: 40 };

export function scoreSignal(
  post: SocialSignal,
  merchant: Merchant,
  config: SocialScoreConfig = DEFAULT_SOCIAL_CONFIG,
): ScoredSignal {
  const text = post.text.toLowerCase();
  const relevance = (post.mentionsBrand ? 0.6 : 0) + (post.mentionsCampaign ? 0.4 : 0);

  const matchedKeywords = NEG_KEYWORDS.filter((k) => text.includes(k));
  const negativity = clamp01(matchedKeywords.length / 3);

  const signalScore = Math.round(100 * (0.5 * relevance + 0.5 * negativity));
  const flagged = relevance > 0 && negativity > 0 && signalScore >= config.flagThreshold;

  const suggestedOutreach = flagged
    ? `Hey — saw your note and I don't want you left wondering. Your ${merchant.name} order is in production and tracking to its window; happy to pull your exact status if you DM your order number. We're on it. ${merchant.brand.signoff}`
    : null;

  return { ...post, signalScore, flagged, matchedKeywords, suggestedOutreach };
}

export function scoreFeed(
  posts: SocialSignal[],
  merchant: Merchant,
  config?: SocialScoreConfig,
): ScoredSignal[] {
  return posts
    .map((p) => scoreSignal(p, merchant, config))
    .sort((a, b) => Number(b.flagged) - Number(a.flagged) || b.signalScore - a.signalScore);
}
