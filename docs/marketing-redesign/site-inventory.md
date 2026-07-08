**1) Company one-liner**
Swan (getswan.com) sells an AI "GTM Engineer" agent platform — describe a sales/marketing workflow in plain English, it builds and runs autonomous agents that research/qualify/enrich leads, monitor buying-intent signals, and trigger outreach across HubSpot/Salesforce/Apollo/ZoomInfo/LinkedIn/Slack. Sold to B2B revenue teams (RevOps, sales, demand gen, CROs) as a headcount-replacement tool. 3 founders, zero employees, ~200 customers in 2025, raised $6M (Feb 2025, led by Link Ventures).

**2) URL inventory**

*Core pages*
- `/` — homepage, hero + agent pitch
- `/about` — founder/company story
- `/pricing` — credit-based tiered pricing
- `/compare` — comparison hub
- `/compare/clay-vs-apollo`, `/compare/clay-vs-zoominfo` — competitor-comparison landing pages (SEO)

*Product-feature / segment pages (persona-based, all same template pattern)*
- `/roles/revops-automation`, `/roles/demand-gen`, `/roles/sales`, `/roles/gtm-engineer`, `/roles/cro`, `/roles/sdr` — 6 role-targeted landers
- `/use-cases/signal-based-outbound`, `/use-cases/sales-workflow-automation`, `/use-cases/automated-lead-qualification`, `/use-cases/contact-data-enrichment`, `/use-cases/ai-abm-targeting`, `/use-cases/ai-powered-cold-outreach`, `/use-cases/intent-based-prospecting` — 7 use-case landers
- `/solutions/website-visitor-identification` — 1 solution lander (footer-only, not in main nav)

*Proof / customers*
- No dedicated customer-logos, case-study, or testimonials page found in nav/footer/sitemap — proof lives inline on homepage/role/use-case pages (not separately crawled here) and via the funding-raise blog post as a credibility signal.

*Resources / blog*
- `/blog` — index
- 8 posts found: `ai-didnt-fail-the-shortcut-seekers-did`, `ai-token-margin-pricing-mistake`, `ai-tourists-freemium-marketing-strategy`, `content-ai-framework-issue`, `swan-raises-6m-to-build-the-first-autonomous-business` (funding/PR post), `the-human-first-ai-video-playbook`, `the-rise-and-fall-of-ai-sdrs`, `your-ai-is-getting-dumber-every-day` — thought-leadership + one company-news post, no gated ebooks/webinars found.

*Company / legal*
- `/about`
- `/legal/privacy-policy`
- `/legal/terms-of-service`

*Signup / onboarding surfaces*
- `https://agent.getswan.com` — used for both "Login" and "Free Trial" nav CTAs (app subdomain, self-serve trial entry, not marketing-site pages)

**3) Nav structure**
Roles (dropdown: RevOps, Demand Gen, Sales, GTM Engineer, CRO, AI SDR) → Use Cases (dropdown: 7 use-case links above) → Blog → Pricing → About → Login → Free Trial (both → agent.getswan.com)

**Footer structure**
Column of use-case links (7) + solutions link (website-visitor-identification) + role links (5, no SDR) + Pricing/About/Blog/Compare + legal (Privacy Policy, Terms of Service)

**4) Could not fetch / gaps**
- Sitemap tool reported "33 URLs" but only enumerated 31 — 2 unlisted, likely truncation, not a block.
- No `/security`, `/procurement`, `/trust`, `/customers`, or `/case-studies` page exists on the site at all (not blocked — genuinely absent); Swan's proof strategy leans on the funding blog post + inline homepage claims rather than a dedicated trust surface.
- Did not fetch individual role/use-case/compare page bodies (only inventoried via nav/footer/sitemap) — downstream agents analyzing on-page copy patterns will need to fetch those directly.
- robots.txt confirmed fully open (no disallow rules), so nothing is fetch-blocked.