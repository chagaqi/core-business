# ADR-0002 — The Repositories seam, one domain model, and the proof-only doctrine

**Date:** 2026-07-01 · **Status:** accepted · **Backfilled 2026-07-04 (OS3)** — records the two disciplines every later ADR assumes.

## Context

ADR-0001 chose seeded-demo-first with a real DB later, and a "feels like real software" bar. Two disciplines make that safe and credible, and every subsequent ADR leans on them: a **storage seam** so the data driver can change without touching call sites, and a **proof-only doctrine** so a trust-first product never ships a fabricated claim.

## Decision

### A. One domain model, one storage seam

1. **`lib/types.ts` is the single source of truth** for every entity (merchant, order, customer, ticket, draft, gift, signal, script variant, outcome event, …). ids are prefixed nanoids, dates are ISO strings, money is integer **cents**, enums are string-literal unions.

2. **Nothing reads JSON (or Mongo) directly.** All surfaces/engines/API go through `lib/repositories` — a `Repositories` interface with a **json** driver (demo/test) and a **mongo** driver (production, ADR-0003). The two drivers must return identical shapes; the mongo driver strips `_id` via projection. `DATA_DRIVER` selects at boot. This is what let production flip to Atlas with no call-site churn.

3. **Seed is generated + checked.** `gen-seed.mjs` produces the demo data; `seed-check.mjs` validates every foreign key + signed token and is part of `npm run verify`. Schema changes migrate both in the same commit.

### B. Proof-only doctrine (non-negotiable across every surface)

1. **No fabricated proof** — never an invented metric, testimonial, rating, logo, or result. A real case study is the literal token `[CASE STUDY PLACEHOLDER]` until real data exists.
2. **Confidence bands, never hard dates** — a customer is told "weeks 9–11", never a calendar date. Enforced in code: `containsHardDate`/`assertNoHardDate` (`lib/proof.ts`) gate every customer-facing reply and merchant update, and the send path physically refuses a hard date (ADR-0014).
3. **Measured, never projected** — outcome stats are counts/ratios of real events with small-N humility (ADR-0007/0012), never a promised improvement.
4. **Demo data is watermarked** — every demo surface carries a SAMPLE DATA marker so a screenshot can't circulate as a real merchant's data (U3).
5. **Automatable checks are automated** — `proof-lint` + the eval harness (ADR-0006) fail the build on a violation, so the doctrine is enforced, not merely intended.

## Consequences

- A trust-first brand can make claims it can defend, and the guardrails are code, not culture.
- The seam makes Mongo (ADR-0003), CSV import (ADR-0010), and webhook ingest (ADR-0011) additive.
- Every later ADR cites one or both of these — they are the substrate.

## Alternatives rejected

- **Read JSON/Mongo directly where convenient** — would couple surfaces to a driver and make the DB swap a rewrite.
- **"Aspirational" marketing metrics with a disclaimer** — rejected outright; the whole moat is that Tideover's reassurance is trustworthy, so a single fabricated number is disqualifying.
