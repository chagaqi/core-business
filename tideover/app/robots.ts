import type { MetadataRoute } from "next";

/**
 * robots.txt. Everything public is crawlable; the private + non-content surfaces
 * are disallowed: the auth-gated app, the API, the auth routes, the login page,
 * the noindexed VSL pages, and — most important — the token-gated customer pages
 * (/status, /widget), which carry a signed per-order token and must never be
 * crawled or indexed. Points crawlers at the sitemap.
 *
 * `||` (not `??`) on the base so an empty APP_URL falls back too.
 */
const BASE = (process.env.APP_URL || "https://www.tideover.app").replace(/\/$/, "");

export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: "*",
      allow: "/",
      disallow: ["/app", "/api", "/auth", "/login", "/status", "/widget", "/vsl"],
    },
    sitemap: `${BASE}/sitemap.xml`,
    host: BASE,
  };
}
