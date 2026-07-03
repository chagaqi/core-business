# ADR-0012 — Outcome instrumentation (E2): CSAT tap, reply/reopen attribution, richer panel

**Date:** 2026-07-03 · **Status:** accepted · **Task:** E2 · Completes the outcome loop E1 opened

## Context

E1 records `reply_sent` + `editedRatio`. E3 shows edit-rate per variant. The self-improving story needs the *customer-side* outcomes too — did the reply land? The enum (ADR-0007) already defines `customer_replied`, `reopened`, `csat_up`, `csat_down`; E2 makes them fire and surfaces them, staying proof-only (measured, never invented).

## Decision

1. **One-tap CSAT on the status page** (the single feedback primitive — binary thumbs, not CES, per the research). After the reassurance card, a "Did this update help? 👍 / 👎" tap → `POST /api/csat/[token]` (public, no login — the status token authenticates). It records `csat_up`/`csat_down`, **attributed to the variant of the order's most recent `reply_sent`** (so it feeds the panel). Idempotent per token: a re-tap updates, it does not stack. Nothing is stored beyond the event (no PII beyond what the ledger already holds).

2. **Reply attribution + reopen, in `ingestTicket`.** When a new inbound lands on an order that had a `reply_sent` within the **attribution window (7 days)**, emit `customer_replied` with the inbound's inferred sentiment in `meta.respondedSentiment`, attributed to that reply's variant. If the matched ticket was already `sent`/`resolved`, also emit `reopened`. Best-effort (log-and-swallow), never blocks ingest — mirrors the ledger's existing failure posture.

3. **`OutcomeEventMeta` gains `respondedSentiment?: Sentiment`** (optional; existing events unaffected). No other schema change; `outcome_events` already stores every kind.

4. **Panel (extend `computeScriptPerformance` + `/app/scripts`).** Per variant, in addition to sends + edit-rate:
   - **Calm-response rate** = `customer_replied` with calm sentiment / all `customer_replied`.
   - **Reopen rate** = `reopened` / sends.
   - **CSAT** = `csat_up` / (`csat_up` + `csat_down`).
   Each keeps **small-N humility**: below the existing `SCRIPT_PERF_MIN_N` (20) show "collecting data (n=X)", never a rate. Never the word "winner"; never sort by performance. SAMPLE DATA watermark already gates demo screenshots.

5. **Seed** a handful of DEMO `customer_replied` + `csat_*` events (isDemo lineage, deterministic) so the panel shows the richer columns in the demo — clearly demo-only, never mixed into a real stat.

## Proof-only guardrails

Every number is a measured event count/ratio, never invented. Rates stay hidden under n=20 (small samples are noise). No "winner"/verdict language. CSAT is the customer's own tap. The demo events carry the merchant's `isDemo` flag so a real rollup can exclude them.

## Out of scope

- `resolved_quiet` (the no-inbound-for-7-days window-closer) needs a scheduled job (task F4) — deferred here; E2 wires the event kinds it can emit synchronously.
- No selection policy / bandit (cut). Refund/chargeback attribution (manual entry, later).

## Kill-criteria

If attribution proves noisy at real volume (a customer_replied that isn't really about the wait), scope it by ticket type — but not before real traffic shows the noise.
