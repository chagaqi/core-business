# ADR-0013 — Scheduled jobs (F4): Vercel Cron + the resolved_quiet sweep

**Date:** 2026-07-03 · **Status:** accepted · **Task:** F4 · Depends on E1/E2 (ADR-0007, ADR-0012)

## Context

E2 wired every outcome kind except `resolved_quiet` — "the reply settled it: no reply, no reopen for 7 days after a send." That one can't be emitted at ingest time (it's the *absence* of a later event), so it needs a periodic sweep. This is the first scheduled job; the same runner is where F5 (nightly Atlas backup) and U6 (stage-transition outbound queue) will hang.

## Decision

1. **Vercel Cron** (new dependency — a `crons` entry in `vercel.json`, no new package). One daily job hits `GET /api/cron/sweep-outcomes`.

2. **Auth — fail closed.** The endpoint requires `Authorization: Bearer <CRON_SECRET>`. Vercel attaches this header automatically when `CRON_SECRET` is set in project env. In production the route **401s if `CRON_SECRET` is unset** (never runs unauthenticated), mirroring the ingest posture (ADR-0011). In demo/dev it may run unauthenticated so the sweep is testable.

3. **The `resolved_quiet` sweep (pure core + thin route).** For each `reply_sent` older than the **7-day window** whose order has **no** `customer_replied`, `reopened`, or existing `resolved_quiet` recorded after it, emit one `resolved_quiet` attributed to that reply's variant/stage. Idempotent: the "no existing resolved_quiet for this order+variant" guard means re-running the sweep never double-counts (same guarantee as E2's reopen dedupe). Best-effort per event — one failure logs and the sweep continues.

4. **Panel.** `resolved_quiet` folds into the Script Performance panel as a **quiet-resolution rate = resolved_quiet / sends**, under the same `SCRIPT_PERF_MIN_N` humility (null below n=20), no "winner". It reads as a positive settle signal, the mirror of reopen rate.

5. **Seed.** A few DEMO `resolved_quiet` events (isDemo lineage, deterministic) so the panel shows the column immediately; the live sweep keeps it current and never double-emits the seeded ones (the idempotency guard covers seed + sweep uniformly).

## Proof-only guardrails

`resolved_quiet` is a *measured absence* (no comeback in 7 days), never an invented "resolved" claim. The rate stays hidden under n=20. No verdict language. Demo events carry `isDemo` so they can't pollute a real rollup.

## Out of scope / deferred

- F5 nightly Atlas backup, U6 stage-transition queue — same runner, later.
- No ret[ry] queue / dead-letter; a missed daily run self-heals on the next (the sweep is a full recompute, not incremental).

## Kill-criteria

If the 7-day quiet window proves wrong at real volume (e.g. buyers who are quiet but not actually reassured), tune the window or add a CSAT-confirmation gate — not before real traffic shows it.
