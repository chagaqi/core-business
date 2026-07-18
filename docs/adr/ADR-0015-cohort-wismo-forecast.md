# ADR-0015 — Cohort WISMO forecast (C7): a demand estimate, not an outcome claim

**Date:** 2026-07-04 · **Status:** accepted · **Task:** C7 · Builds on ADR-0002 (proof-only), ADR-0005 (timeline)

## Context

A 60–120 day wait means WISMO ("where is my order?") tickets don't arrive evenly — they spike as a cohort crosses into the anxious late-wait window (day 60–89). A merchant who can see "212 orders enter that window next week" can staff and prepare; a generic helpdesk can't compute this because it doesn't model the production timeline. This is exactly the "proprietary software, not a service" differentiator.

The tension: Tideover is **proof-only — measured, never projected** (ADR-0002). A forecast is a projection. So the decision is *what* we're allowed to project and how.

## Decision

1. **Forecast DEMAND (workload), never a RESULT.** We project how many WISMO tickets a merchant will likely receive — an operational planning number — from two inputs that are both real: (a) the deterministic fact that a given order crosses `daysInWait = 60` on `createdAt + 60d` (no estimation — it's arithmetic on real order dates), and (b) the merchant's **own measured baseline** WISMO rate (`Merchant.baseline.wismoPer100Orders`, ADR captured at onboarding). We never project a Tideover *outcome* ("we'll cut your tickets by X") — that stays forbidden.

2. **The math is the merchant's own history applied to their own upcoming cohort.** `expected ≈ (orders entering the day-60–89 window in the period) × (baseline WISMO per 100 orders / 100)`. Nothing invented; both factors trace to stored data.

3. **Method shown, always — and labelled an ESTIMATE.** The panel prints the arithmetic ("N orders cross into day 60–89 in the next 7 days × your baseline Y/100 = ~Z expected"), shows the count as a **range** (not false-precision point), and carries an "estimate for planning, not a guarantee" label. The transparency IS the proof-only guard: the merchant can check every input.

4. **Pure lib + non-hot surface.** `lib/forecast.ts` (deterministic, `now` injectable) computes it; a dedicated `/app/forecast` page renders it (NOT the hot dashboard file). No engine change → goldens/invariants untouched. No schema/seed change (reads existing orders + baseline).

## Proof-only guardrails

- Both inputs are measured (order dates + the merchant's own baseline), never fabricated.
- Output is framed as expected *inbound volume* (demand), never a Tideover efficacy claim or a hard date.
- Shown as a range with the method exposed; SAMPLE DATA watermark already gates the demo.
- If baseline is absent/zero, show the cohort count only and say the rate is uncalibrated — never invent a rate.

## Alternatives rejected

- **A point estimate ("expect 47 tickets")** — false precision; a range is honest.
- **Projecting a post-Tideover reduction** — a forbidden outcome projection; out of scope.
- **Rendering on the dashboard (hot file)** — a dedicated page avoids the hot-file contention and gives the method room.

## Kill-criteria

If real WISMO arrival diverges wildly from baseline×cohort (the baseline rate isn't stable across cohorts), widen the band or drop the number to a qualitative "heavy week ahead" — but not before real data shows the drift.
