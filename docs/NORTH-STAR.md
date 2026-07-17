# NORTH STAR — from here to finished

**2026-07-16. The guiding light for Opus.** The torch pass (`docs/TORCH-PASS-TO-OPUS.md`) is the context: what this is, why it wins, how it can die. This document is the track: from tonight's position to a **finished product that reads like a funded startup, with the GTM engine executing**. It was written after a six-lane gap sweep (five repo/live audits + a completeness critic, ~50 findings, every one carrying file:line evidence — raw reports in `docs/gap-sweep-2026-07-16/`). When this document and any other list disagree on sequence, this document wins. When it disagrees on *facts*, verify against the code and fix whichever is wrong — that discipline is the product.

---

## 1. WHAT "FINISHED" MEANS

Two tests, both must pass:

**The funded-startup test.** A skeptical merchant googles us, clicks around for four minutes, signs up without talking to anyone, and at no point hits a dead end, a lie, or a surface that whispers "one guy's demo": they find a blog with real answers, a working trial with a visible clock, a checkout that takes their card, an app with no blank flashes, replies to their tickets that never garble, and a status page their backers actually receive.

**The executing-GTM test.** The daily loop from `docs/gtm-campaign/GTM-CAMPAIGN-2026-07.md` is actually running: prospects flow in scored, outreach ships approved, content publishes weekly, the nurture sequence fires itself, and every number on the scoreboard is measured, not asserted.

Tonight, neither passes. The product is demo-complete, gate-green (57,614 invariants + 55 goldens + 490 tests), live on real auth — and **a stranger cannot give us money**, the campaign's Day-1 actions have no plumbing, and the engine can still ship the literal string "as as" to an angry customer.

## 2. THE TRACK

Six phases. Each has an acceptance gate — the phase is done when the gate passes, not when the code exists. Disjoint-file lanes may run in parallel; hot files stay serialized (CONTRIBUTING.md). High-risk areas (billing, auth, migrations, engine) follow the charter: no improvising, ambiguity stops and surfaces.

### P0 — LAND IT + STOP THE LIES (days, some already in flight)

The cheap, urgent truth-fixes and the go-live rituals.

- **Dylan:** TEST1 walkthrough on app.tideover.app · D9 golden review (30 min) · the word **"merge it"** (main is ~45 commits behind production).
- **Fix the floor garble (P1, hot file — one serialized change):** `lib/engines/reassurance.ts:88-90` hardcodes "as soon as it's ready…"; `stripBanned` mangles it to "as as it's ready" for any merchant banning "soon". The sprint's word-boundary lint covers ONLY the LLM path; the deterministic floor — the default drafter and the safety net under every LLM draft — ships unchecked (`lib/drafting/safe-floor.ts:164`). Fix: run the engine's merged text through `bannedPhraseIn` inside safeFloor; collision → escalation reply, never a mangled strip. Add a "banned word collides with engine phrasing" case to the eval so 57k invariants actually cover it (today 'soon' is in no seed fixture — the harness never exercises the collision).
- **Un-lie the pricing FAQ (P1):** `app/pricing/page.tsx:52-53` promises self-serve plan changes and billing settlement that have zero code behind them. Soften the copy today; build to it in P1. The proof-only doctrine applies to our own FAQ before it applies to any AI draft.
- **Un-lie the wizard picker (P2):** `components/product/DataSourcePicker.tsx` says Gorgias/Zendesk are "coming soon" and omits Help Scout — while the same wizard's ConnectPanel offers live credential UIs for all three (ADR-0021 shipped). Recategorize; name Help Scout.
- **Wire what's built but unreachable:** the wizard collects none of `campaignName`/`promisedWindow`/the four baseline questions despite complete backend plumbing (`lib/onboarding.ts:74,86,229`, `lib/baseline.ts:242` — `recordReportedBaseline` has zero callers); `backfillDisclosedEta` (`lib/import.ts:413`) also has zero callers — add the wizard step + a settings action.
- **Instrument before traffic (P1):** privacy-friendly analytics (Plausible or Vercel Analytics) in `app/layout.tsx` + Sentry free tier wired into `app/error.tsx` — the GTM plan drives traffic at a site that currently cannot see visitors or errors. Plus `app/sitemap.ts` + `app/robots.ts` (~30 min, independent of the blog).

**Gate:** merged, deployed, smoke 11/11; a merchant banning "soon" gets a clean reply; the wizard asks what the merchant promised backers; no public copy claims an unbuilt capability.

### P1 — TAKE MONEY (the biggest single gap; ~1-2 weeks; ADR first)

Zero payment infrastructure exists: no Stripe SDK, no STRIPE_* env, no checkout/webhook route, no `plan` field on Merchant, no trial clock, no cancellation path, no invoices (`package.json`, `.env.example`, `lib/types.ts:257-352` all verified). The published $299/$499/$749 ladder is decorative, and the caps are plan-blind — a $299 customer gets 10 seats (`lib/team.ts:20`) and 50k imports (`lib/csv.ts:85`), the $749 allowances, free.

Build, in order: **ADR-0022 billing architecture** (Stripe Checkout + customer portal + webhook; the tier ladder is a **Fable/Dylan decision — never improvise pricing**) → `plan` on Merchant, captured at checkout → trial clock derived from `createdAt` + 14d with a countdown surface and a defined expiry behavior → per-plan seat/import caps threaded through `lib/team-route.ts:81` and `lib/import.ts:117` → cancellation + the terms gap (terms currently promise "cancel any time" with no object to cancel, and say nothing about refunds on prepaid annual — `app/terms/page.tsx:35-44`). Invoices/receipts come free with the portal.

**Gate:** a stranger completes signup → trial → card → paid plan in Stripe test mode end-to-end; caps enforce per plan; the FAQ copy is true again.

### P2 — THE SEND SEAM + THE GTM PLUMBING (parallel lanes; the campaign's prerequisites)

The torch pass already argues Step 1 (the `Deliverer` seam + status-link push at import + cohort sends + unsubscribe) is *the win* — unchanged, build it. This phase adds the five verified blockers between the GTM plan and its own Week 1:

1. **Blog infra**: `app/blog/[slug]` (MDX or file-based) — the 10 SEO pillars have nowhere to publish (`Footer.tsx` defers it in a comment; no route exists). Pillar #1 (chargeback-evidence guide) publishes the week the route lands.
2. **The funnel plumbing**: `app/api/playbook-lead/route.ts:7-18` stores a row and does nothing else, and `resend` isn't even installed. Install it; captures create contacts in a List-A audience on a dedicated marketing subdomain; build the 6-email Automation (§9.2 of the campaign doc). Never mix List A/List B/transactional lanes.
3. **The Template Pack**: the flagship magnet + pillar #2 in one build. Ungated library page + gated pack behind the existing capture.
4. **The CASL source-log**: a `leads` collection (or sheet) with mandatory `sourceUrl` + `discoveredAt` — must exist before the first address is contacted.
5. **The prospect engine**: the scrapers specced in campaign §4/§5b (webrobots dump filter, Apify discover, Shopify `/products.json` scan, Woo plugin dorks, contact discovery) as `scripts/` + a KPI tracking surface (reply rate, spam/domain, pilots — the ≥0.30% spam pause rule needs somewhere to be checked daily).

**Gate:** a new import pushes status links to real inboxes with unsubscribe; a test opt-in receives email 1 within a minute; pillar #1 is live and indexed; the prospect engine produces a scored 200-row list with source URLs.

### P3 — GTM IGNITION (starts the day Dylan buys the domains; runs forever)

- **Dylan unblocks:** G5 purchases (3 domains + 6 mailboxes + Smartlead — the 14-day warmup clock is the critical path) · the X handle + Premium Basic · the CASL lawyer consult · begins the §4 daily calendar.
- **The AI layer runs**: morning prospect run, drafts, F5Bot triage, X conversions of the 40-post bank, the weekly pillar loop, the digest.
- **Testimonial machinery from pilot #1 (P1-severity, currently nonexistent):** every PR motion (Product Hunt, Show HN, BackerKit, Stonemaier) is gated on a real testimonial, and nothing captures one. Build the ask-script + consent/quote-release + storage, triggered off pilot completion or a qualifying CSAT. Proof-only needs proof *collected*, from day one.
- **Q4 is a demand event, not just an SEO horizon**: November campaigns miss holiday ship dates and the ICP's pain peaks. Prep in September: a seasonal magnet ("will your campaign make its holiday ship date?"), a surge outbound list, and the pillar posts ranking by then.

**Gate:** first sends Week 3 at 5/mailbox/day; 3–5 pilots in motion by day 45; every pilot instrumented (editedRatio logging — the number the whole value model swings on).

### P4 — THE LEARNING PRODUCT (torch pass §9A/§9B — after real pilots exist)

LRN1 (edit-distance capture first — pilots make it meaningful), DEC1 (strategy step + promises ledger), voice-engine Phase 2 (the few-shot bank — Dylan's voice is the input), Help Scout INT1 (the one integration; 2–4 weeks honest sizing). Sequence inside this phase by what the pilots' edit data says, not by the plan's guess.

### P5 — THE FUNDED-LOOK LAYER (each item small; batch them between bigger lanes)

Self-serve demo sandbox (the only demo today is a static screenshot + book-a-call — a prospect who won't book has no path; read-only sample-data cockpit, zero signup) · loading skeletons for the 12 uncovered app routes · per-page OG images (pricing + case-study minimum) · `app/manifest.ts` + apple-touch-icon · footer social row (once handles exist) · help-center seed (one FAQ page beats none) · public uptime page decision (15-min free-tier win or documented no) · log drain for the structured events (`style_score`, `llm_lint_reject` currently die in Vercel's short console retention) · a11y statement · cookie-gate the Cal.com embed · constant-time compare in `lib/ids.ts:69` (timingSafeEqual exists in 3 sibling files; apply it) · rate-limit `api/csat/[token]` + both ingest webhooks (an unthrottled CSAT flood can corrupt the proof-only metrics surface) · delete or wire the three orphaned API routes (gift-catalog, social-signal-feed, orders/timeline — implemented, zero callers).

### P6 — SCALE PLAYS (post-traction, in whatever order evidence demands)

Tideover MCP (build after the 2026-07-28 spec revision; design is done — torch §9C) · gifts delivery + the window-pass packaging (D8) · partnerships decision: BackerKit/pledge-manager/agency motion — an old roadmap floated rev-share and the current plan dropped it silently; decide it explicitly · merchant community (Discord) decision · currency/i18n (`en-US`/USD hardcoded against a global ICP) · Zendesk clone of the Help Scout seam when two prospects sit on it.

## 3. THE STANDING RULES (unchanged, non-negotiable)

The verify gate before every commit (`npm run verify && npm test`) · hot-file serialization · proof-only everywhere, including our own marketing copy (P0 exists because we broke this) · never the word "honest" in customer-facing text · no fabricated founder imagery · billing/pricing/legal/data-exposure decisions belong to Fable+Dylan, never improvised by a build lane · escalation ladder per CLAUDE.md · **ops debts now on record:** a secrets-rotation runbook (one rotation already happened in production with no runbook — today), Auth0-tenant + Vercel-env config backups (only Mongo is backed up; the Vercel creds live on one machine), one restore drill, GDPR transfer language for the DeepSeek (PRC) subprocessor **before any EU-exposed paying merchant** — fold the last one into the T3b/CASL legal consult.

## 4. THE DYLAN REGISTER (everything only he can do, in order)

1. TEST1 walkthrough · D9 goldens · **"merge it"**.
2. Stripe keys + the tier-ladder confirmation for ADR-0022.
3. G5 purchases (starts the warmup clock — nothing in P3 moves without it) · the X handle.
4. The CASL consult (add GDPR-transfer question) · counsel pass on terms refund language.
5. D9-GTM: the $20K/mo-in-90-days recalibration conversation (the cited math says 1–5 customers from outbound alone; the goal needs channels or time).
6. Voice Phase 2's few-shot bank — his voice, cannot be delegated.
7. The testimonial asks, personally, at each pilot's first win.

## 5. THE SCOREBOARD (measured or not reported)

`editedRatio` / send-as-is rate · real deflection (`lib/deflection.ts`) · stage correctness · time-to-customer (not clipboard) · pilots started · reply rate ≥3% by day 45 · spam <0.10%/domain · trial→paid conversion (exists after P1) · chargeback outcomes with `disclosedEta` present. The flattering numbers stay banned (torch §5).

---

**Pointers:** `docs/TORCH-PASS-TO-OPUS.md` (context + the moat + the traps) · `docs/gtm-campaign/GTM-CAMPAIGN-2026-07.md` (the daily engine) · `docs/gap-sweep-2026-07-16/` (raw audit evidence, file:line) · `mission-control/tideover-hq.html` (the live board) · `CLAUDE.md` + `tideover/CONTRIBUTING.md` (how work moves).

**The one-sentence version:** make it true, make it paid, make it known — in that order, and never trade the first for the other two.
