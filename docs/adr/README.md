# Architecture Decision Records — Tideover

Every non-trivial decision (a new dependency, an engine change, an integration, a pricing or data-exposure choice) is recorded here as a short ADR before the code lands. They are the "why", so a reviewer — or a future maintainer — can reconstruct the reasoning without archaeology. New ADRs use the next number; supersede rather than edit an accepted one.

**Conventions:** `ADR-NNNN-slug.md`, each headed `# ADR-NNNN — Title` with a `**Date · Status · Task**` line. Status is `accepted` unless `superseded by ADR-XXXX`. Use [`TEMPLATE.md`](./TEMPLATE.md).

## The two substrate decisions

| # | Decision | What it fixes |
|---|----------|---------------|
| [0001](./ADR-0001-app-architecture.md) | One Next.js app, deterministic engines, seeded-demo-first | The build shape: software (not a service), demoable offline, DB/LLM plug in later |
| [0002](./ADR-0002-repository-seam-and-proof-doctrine.md) | Repositories seam + one domain model + **proof-only doctrine** | The disciplines every later ADR assumes: storage swap without rewrites; never a fabricated claim |

## By area

**Persistence & auth**
| # | Decision |
|---|----------|
| [0003](./ADR-0003-mongo-driver.md) | MongoDB via the official driver, behind the existing Repositories seam |
| [0004](./ADR-0004-app-auth.md) | Operator auth: env-gated demo mode + shared-password HMAC-cookie session |
| [0017](./ADR-0017-real-vs-demo-subdomain-split.md) | Real vs demo split by request host: app.tideover.app = auth + live store; everywhere else = open seeded demo |
| [0020](./ADR-0020-auth0-user-accounts.md) | Auth0 user accounts + per-merchant tenancy (ownerSub), env-gated, fail-closed on partial config; password mode stays the fallback |

**Engine & proof**
| # | Decision |
|---|----------|
| [0005](./ADR-0005-order-schema-evidence.md) | disclosed-ETA + status-view logging + campaign/wave labels (dispute evidence) |
| [0006](./ADR-0006-eval-harness.md) | Engine eval harness: invariant sweep (authoritative) + golden regression (review-gated) |
| [0007](./ADR-0007-outcome-ledger.md) | Outcome ledger Phase 0: script variants + append-only outcome events |
| [0012](./ADR-0012-outcome-instrumentation.md) | Outcome instrumentation (E2): CSAT tap + reply/reopen attribution + richer panel |
| [0014](./ADR-0014-reply-qa-and-promoted-variants.md) | Reply QA checklist (hard-date gate) + operator-promoted variants (E4) |
| [0015](./ADR-0015-cohort-wismo-forecast.md) | Cohort WISMO forecast: per-wave inbound projection from the merchant's own history |
| [0016](./ADR-0016-sla-timers.md) | SLA timers on the queue: first-response + resolution clocks, breach surfacing |
| [0018](./ADR-0018-llm-drafting-layer.md) | LLM drafting layer: per-tenant context (no training, no per-user agents), Haiku-class stateless calls, deterministic floor + QA gate |

**Integration ladder (the "easy integration" wedge)**
| # | Decision |
|---|----------|
| [0008](./ADR-0008-email-forward-ingest.md) | Email-forward ingest via Resend inbound (Rung 1, the zero-trust wedge) |
| [0009](./ADR-0009-update-pipeline.md) | Update pipeline: one workshop update → status-page feed + Kickstarter draft |
| [0010](./ADR-0010-csv-import.md) | CSV import (Rung 0): backer list → customers + orders, parsed client-side |
| [0011](./ADR-0011-webhook-ingest.md) | Per-merchant helpdesk webhook ingest (Rung 2, the API path, tag-routed) |
| [0021](./ADR-0021-per-vendor-webhook-auth.md) | Per-vendor webhook auth (Gorgias bearer · Help Scout's own HMAC-SHA1 · Zendesk) + ingest health: a dead helpdesk is an alarm, never a quiet queue |
| [0019](./ADR-0019-site-analysis-autofill.md) | Site-analysis autofill: deterministic /api/analyze, SSRF-guarded, gift candidates from the merchant's own reward tiers |

**Ops**
| # | Decision |
|---|----------|
| [0013](./ADR-0013-scheduled-jobs.md) | Scheduled jobs (F4): Vercel Cron + the resolved_quiet sweep |

**Billing & entitlements**
| # | Decision |
|---|----------|
| [0022](./ADR-0022-billing-and-entitlements.md) | *(proposed)* Stripe Checkout + Billing Portal + webhook; a `plan` on the merchant written only by Stripe; the published ladder becomes enforced seat/order entitlements; 14-day no-card trial soft-locks at expiry. Blocked on Dylan's tier + keys sign-off |

## Reading order for a newcomer
0001 → 0002 (the substrate) → 0006 (how engine changes are gated) → then whichever area you're touching.
