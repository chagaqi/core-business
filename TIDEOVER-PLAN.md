# Build Tideover — the proprietary presale-retention product (2-hour blitz)

## Context
Dylan has a one-week token grant expiring in ~2 hours and wants to build Tideover end-to-end now, "all cylinders." Tideover (per `36-presaleai-90-day-roadmap.md` + `tideover-brand-kit.md`) is a **presale-support layer** for Shopify merchants with 60–120 day fulfillment waits (crowdfunding/BackerKit graduates): it keeps presale buyers calm through the wait so "where's my order?" doesn't become a refund/chargeback.

**Hard design constraint from Dylan:** it must NOT feel like "we handle a slice of your tickets for a price." It has to be **more proprietary, more unique, better-engineered** — the merchant must feel they bought *software*. So we build real product surfaces and a real engine, not just a service wrapper. Two delivery modes both matter, but **ease of integration is the priority**: bolt onto the helpdesk they already run (Gorgias/Tidio/Intercom/email) AND give them Tideover-branded surfaces.

**Decisions (his):** build *everything*; both channels (bolt-on + native), engineered for easy integration + a proprietary feel; **seeded demo data now**, real DB + AI key plugged in later.

## What we reuse (don't rebuild)
- The **Adwield Next.js 14 stack** verbatim: App Router + TypeScript (strict) + Tailwind 3 + Framer Motion 11 + `@calcom/embed-react`, deployed via the local Vercel CLI. Copy `adwield/`'s configs, `app/layout.tsx`, `globals.css`, the `Cal*`/`Nav`/`Hero`/`Footer` component patterns.
- **Tideover design tokens** (from `_tideover-source.html` + `tideover-brand-kit.md`): sea-teal `#0E5366`, terracotta `#D9762F`, sand `#FBF8F2`, ink `#11252A`; Fraunces (display) + Inter/system (body); warm/calm, proof-only voice. Headline "Calm the wait. Keep the sale."
- **Cal booking**: namespace `tidedisco`, calLink `bookthecall/tidedisco`.
- **Landing + VSL content**: already specced in `gtm-assets/v2/v2-sales-page.md`, `v2-vsl-scripts.md`, `v2-content-bank.md`.

## Architecture — one Next.js app at `Core Business/tideover/`
Marketing + app + API in one project (fastest, one Vercel deploy). A clean data layer over **seeded demo JSON** (mock merchant/orders/customers/tickets) behind a repository interface so MongoDB Atlas swaps in later. Engines are **deterministic** (rule + script library) so they run with no AI key; an optional LLM adapter (OpenAI/Anthropic) plugs in later for novel-reply drafting.

**Routes/surfaces:**
- **Marketing** (`/`, `/book`, `/vsl/*`) — the landing page, the Cal `/book` page, the 4 VSLs.
- **Onboarding** (`/onboarding`) — the deep discovery flow: learns the company, products, real timelines, voice, brand assets, and seeds the merchant's playbook + toolbox.
- **Operator Cockpit** (`/app/inbox`) — priority-sorted presale queue; each ticket shows the order's live timeline, the customer's LTV/priority/refund-risk, the engine's stage-aware drafted reply for human approve/edit/send, and a one-click gift suggestion. Logs saves.
- **Merchant Presale-Health Dashboard** (`/app`) — the "this is software" view: refund-risk curve, saves count, WISMO trend, first-response-time, the at-risk queue, leading-indicator metrics, gift activity.
- **Customer Reassurance surface** (`/status/[token]`) — a beautiful merchant-branded preorder-status page (honest confidence-band timeline + production stage + reassurance + chat). The tangible proprietary thing backers see. Plus a **native embeddable chat/ticket widget** for email-only merchants.
- **API** (`/api/*`) — ticket ingest (the bolt-on webhook), draft, approve/send, orders/timeline, social-signal feed, gift catalog. Each external system behind a `ChannelAdapter` interface (GorgiasAdapter / TidioAdapter / IntercomAdapter / EmailAdapter / MockAdapter) so "easy integration" is real engineering, demoed with MockAdapter.

**The 4 proprietary engines** (`lib/engines/`):
1. **Stage-Aware Reassurance Engine** — `{order, daysInWait, productionStage, sentiment}` → matches the day-7/30/60/89 playbook + the real timeline → drafts a reply with an honest confidence band, never a hard date; human-approved.
2. **Refund-Risk / Priority Engine** — real-time per-customer score from LTV + order value + wait-time + stage + sentiment → priority level + queue order + the dashboard risk curve.
3. **Toolbox / Gift Engine** — for top-LTV / longest-wait / highest-risk buyers, recommends low-cost-high-perceived-value gifts (early access, founder note, priority dispatch, digital perk, next-order credit) from a catalog seeded in onboarding.
4. **Social-Signal Monitor** — watches social for order-wait complaints/brand mentions → flags + drafts proactive outreach outside the ticket system (upsell). Demo on a seeded mock feed; live scraping/API is spec.

## Build = parallel workflows (launched on approval, I deploy at the end)
- **WF1 — Foundation + Marketing site:** scaffold `tideover/` (clone Adwield stack, Tideover tokens/fonts), shared design system + components, build landing + `/book` (tidedisco) + the 4 VSL pages from the spec. Proof-only.
- **WF2 — The App (core product):** data model + seeded demo data; the 4 engines; the operator cockpit; the merchant health dashboard; the customer `/status/[token]` page + chat widget; the `ChannelAdapter` bolt-on layer (Mock + the real-adapter stubs) + the ingest/draft/approve API.
- **WF3 — Onboarding + toolbox + GTM content:** the deep discovery onboarding flow + questionnaire; the founding-partner onboarding email/Notion sequence; the toolbox/arsenal gift catalog + rules; the "Presale Anxiety Playbook" lead magnet.
- **WF4 — Upsell + integration specs:** social-signal-monitoring upsell spec; the white-glove VA service spec (trained VAs ~$8/hr, "X inquiries/week" packaging, ops + margin model); the production integration architecture (Gorgias/Intercom/Tidio OAuth + webhooks + Shopify Order API + billing); a master README.
- **WF5 — Verify:** `npm install` + `npm run build`, fix all errors green; sanity-check the engines on seeded data; confirm proof-only throughout.
- **Then I deploy** to Vercel (`tideover/`) and wire `tideover.app`.

## Honest scope (what's real vs spec in 2 hrs)
- **Real, deployable, demo-able on seeded data:** the marketing site, the onboarding flow, the operator cockpit, the merchant dashboard, the customer reassurance page + widget, all 4 engines (deterministic), the `ChannelAdapter` abstraction with MockAdapter.
- **Architected + stubbed (needs creds/infra later):** live Gorgias/Shopify OAuth + webhooks, real LLM drafting, real social scraping, Stripe billing, the VA ops system. All designed so they plug in without rework.

## Verification
- `cd tideover && npm install && npm run build` → green.
- `npm run dev` → walk the demo: onboarding → cockpit (a day-58 at-risk backer, priority-sorted, with a drafted reassurance reply + a gift suggestion) → approve/send → dashboard risk curve updates → the customer `/status/[token]` page renders the timeline. Marketing `/` + `/book` render.
- Deploy: `vercel "…/tideover" --prod --yes`; verify the live URL + the Cal embed.
- Proof-only check: no fabricated metrics anywhere; `[CASE STUDY PLACEHOLDER]` literal; confidence bands, never hard dates.
