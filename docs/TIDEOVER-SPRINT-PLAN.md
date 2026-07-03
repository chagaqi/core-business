# Tideover Finalization Sprint — Master Plan

**Window:** 2026-07-02 → 2026-07-05 (3 build days; Fable capacity through ~07-07)
**Command center:** `mission-control/tideover-hq.html` (open in browser). That file's `TASKS` array is the canonical task board; this doc is the rationale and rules.
**Evidence base:** `docs/research/2026-07-02-enrichment-digest.md` — 8 expert lenses + 2 adversarial critics, all claims cited. Non-trivial decisions below trace to it.

## Mission

Finish Tideover to the quality where cold outreach converts: live persistence, a hardened zero-trust integration wedge, money artifacts (evidence pack, baseline report), a demo that reads as insider software, honest pricing, and Dylan trained on the domain. Everything proof-only.

## Definition of Done (the sprint acceptance test)

The sprint ends by outcome, not by clock:

1. The 10-minute DEMO.md path runs clean on **live persistence** (Mongo), recorded as a walkthrough.
2. Security floor: `/app` auth exists (env-gated), ingest verifies HMAC on **raw bytes before parsing**, mock channel is env-gated, `/privacy` + `/terms` live.
3. The email-forward pilot mechanic works end-to-end on a real inbox (one forwarding rule in, drafted reply out).
4. Evidence Pack renders for a seeded order; day-0 Baseline Report generates.
5. Cold-outreach kit ready: honest ABOUT (no Chaga persona anywhere), WISMO Teardown template, 10 diagnostic openers, first email draft.
6. `verify` + `test` + `eval` + `smoke` all green on prod; every cut item logged as a truthful backlog.
7. Training docs Dylan can read in an evening (CX lingo, crowdfunding 101, pricing/pitching, managed-tier runbook).

## The one rule that prevents wasted days

**Research before build (the ADR gate):** any new dependency, engine/scoring change, integration, or pricing/data-exposure decision gets a 1-page ADR in `docs/adr/` (context, 2–3 options, cited evidence, decision, kill-criteria), adversarially reviewed before code. Everything else is just a PR. The enrichment digest pre-loads the evidence for most of them.

## Sequencing (why this order)

**Phase 0 — unblock (Day 1 AM):**
- Dylan's purchase/decision block runs FIRST because DNS propagation, Stripe verification, and provider approval are wall-clock delays (see Needs-Dylan panel in HQ).
- Persona fix (Chaga → Dylan-honest) blocks every outreach asset downstream.
- Mongo wiring precedes ALL new write features. The current JSON driver is in-memory; on Vercel serverless every write evaporates on cold start. The outcome ledger, CSAT, live ingest, update feed, and checklist are unbuildable without it.
- Ingest hardening (raw-body HMAC verify first, env-gate the `channel==='mock'` auth bypass) and `/app` auth precede any live ingest. Otherwise the first real forwarded ticket puts customer PII on an open URL.
- Eval harness + CI gates land before Day 2–3 agents churn the engine and cockpit files. Gates built after the churn protect nothing.

**Phase 1 — the wedge + money artifacts (Day 2):** email-forward ingest live; CSV import capturing `disclosedEta`; Evidence Pack; dispute-window tile; unified Update Pipeline; outcome ledger Phase 0 (stamping + stats, NO selection policy).

**Phase 2 — demo UX (Day 3 AM):** keyboard triage + approve-and-advance; revenue-at-risk hero tile + insider metric row; QA scorecard lite; status-page wait UX; sample-data watermark.

**Phase 3 — sales surfaces LAST (Day 3 PM):** `/security`, `/pricing`, FAQ, procurement packet, training docs. Copy that describes behavior ships only after the behavior merges. Proof-only means marketing cannot precede the feature by one commit.

## Hot-file serialization (merge-conflict prevention)

`app/app/inbox/page.tsx`, `DraftRail.tsx`, `ApprovalBar.tsx`, `app/app/page.tsx`, and `lib/engines/reassurance.ts` are touched by 4+ workstreams. All changes to these files go through ONE owner-agent in one ordered queue. Parallel lanes take isolated surfaces only (pricing page, legal pages, evidence-pack route, email worker, FAQ, training docs). Every schema PR migrates `gen-seed.mjs`/`seed-check.mjs` in the same diff or the shared verify chain blocks all lanes.

## Standing cut list (agreed now so agents never start them)

| Cut | Why |
|---|---|
| Bandit/epsilon/Thompson selection + replay script | No customers; slots need months to reach n≥20. Ship ledger + stamping + stats panel only. Selection is post-first-cohort. |
| Bespoke ZendeskAdapter + write-back credential vault | Canonical push schema + merchant-templated webhooks cover the Zendesk read path. Write-back is post-first-revenue. |
| Tidio/Intercom adapters | Webhooks plan-gated (Tidio Plus+) or need a per-workspace dev app (Intercom). Email rung serves those merchants. |
| Homepage voice-scraping | No deterministic algorithm exists. Replaced by "paste two past support replies". |
| KS comment scraper / recently-funded scraper | KS ToS prohibits scraping. Manual paste-a-URL; outreach timing = manual browsing. |
| Gorgias macro import/export | Requires API-key rung; "Gorgias format" isn't portable. Markdown export only. |
| Wave entity CRUD | Label strings on orders suffice. |
| Cmd+K palette | Polish, not flow. J/K/Enter/Cmd+Enter is the demo moment. |
| Real WFM (forecast+schedule+occupancy) | Enterprise scope. The cohort forecast panel is the whole requirement. |
| Shopify public app / helpdesk OAuth apps | App review takes weeks; PII redaction rules. Custom-app instructions post-revenue. |
| SOC 2 / enterprise questionnaires | $25–50K. Qualify out; the /security data-map is the honest answer. |
| NPS anywhere; CES 1–7 scale | NPS is brand-level, meaningless mid-wait. One binary thumbs tap won. |
| Per-seat, per-resolution, or performance-fee pricing | Recreates the competitor mechanics we sell against; performance fees violate proof-only pre-case-study. |
| PH hire before 2 signed managed clients | Salary obligation vs $750 budget = insolvency. Dylan-as-first-agent bridges; recordings become SOPs. |
| Photo upload pipeline | Text + external image URL only. |
| Claude GitHub Action lane, Dev Console page | Post-sprint. gh CLI output piped to notes is Dylan's dev view this week. |

## Rituals

- **Verify chain:** `cd tideover && npm run verify && npm test` before every push. `npm run eval` joins the chain once the golden harness lands. Golden-fixture diffs require explicit approval; regenerating snapshots to make a red test green is forbidden.
- **Release:** verify green → PR/branch push → CI green → deploy → `smoke.mjs` on prod → CHANGELOG entry → one-line note in `mission-control/NOTES-FOR-CLAUDE.md`.
- **Branching:** keep building on the open PR branch until PR #1 merges; then short-lived feature branches into main. Never push directly to main.
- **Autonomous loop:** an hourly cron picks the highest-priority unblocked task from the HQ board, executes with full gates, updates the board, and logs. It stops only on Needs-Dylan blockers.
- **Dylan's cadence:** decisions/purchases front-loaded Day 1; then two short daily blocks (approve PRs, answer `decision` items, review golden fixtures once). Notes go in `mission-control/NOTES-FOR-CLAUDE.md`.

## Proof-only doctrine (unchanged, enforced)

No fabricated metrics/testimonials/clients/results. Confidence bands, never hard dates (`assertNoHardDate` at draft AND send). Literal `[CASE STUDY PLACEHOLDER]`. Third-party benchmarks live in cited popovers, never in the same visual register as merchant data. Demo surfaces carry a persistent "Sample data" watermark. "Self-improving" appears in copy only as measured numbers with n-badges, never as the word "learning".
