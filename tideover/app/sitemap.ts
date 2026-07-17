import type { MetadataRoute } from "next";

/**
 * The machine-readable sitemap Google crawls. Lists ONLY the public, indexable
 * marketing surfaces — never the token-gated customer pages (/status, /widget),
 * the auth-gated app (/app), the signup funnel, or the noindexed /vsl pages.
 * The GTM plan's SEO pillars (docs/gtm-campaign, §9) get added here as the blog
 * route lands; for now this is the standing marketing set.
 *
 * `||` (not `??`) on the base so an empty APP_URL falls back too — an empty env
 * value once crashed `new URL("")` at build time (2026-07-16).
 */
const BASE = (process.env.APP_URL || "https://www.tideover.app").replace(/\/$/, "");

const ROUTES: { path: string; changeFrequency: MetadataRoute.Sitemap[number]["changeFrequency"]; priority: number }[] = [
  { path: "/", changeFrequency: "weekly", priority: 1.0 },
  { path: "/how-it-works", changeFrequency: "monthly", priority: 0.8 },
  { path: "/who-its-for", changeFrequency: "monthly", priority: 0.8 },
  { path: "/pricing", changeFrequency: "monthly", priority: 0.9 },
  { path: "/case-study", changeFrequency: "monthly", priority: 0.6 },
  { path: "/security", changeFrequency: "monthly", priority: 0.5 },
  { path: "/procurement", changeFrequency: "monthly", priority: 0.5 },
  { path: "/privacy", changeFrequency: "yearly", priority: 0.3 },
  { path: "/terms", changeFrequency: "yearly", priority: 0.3 },
  { path: "/book", changeFrequency: "monthly", priority: 0.7 },
];

export default function sitemap(): MetadataRoute.Sitemap {
  return ROUTES.map(({ path, changeFrequency, priority }) => ({
    url: `${BASE}${path}`,
    changeFrequency,
    priority,
  }));
}
