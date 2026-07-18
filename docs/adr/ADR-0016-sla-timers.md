# ADR-0016 — SLA first-response timers + attainment (C5)

**Date:** 2026-07-04 · **Status:** accepted · **Task:** C5 · Builds on ADR-0002 (proof-only), ADR-0004 (Merchant schema)

## Context

A buyer's support lead evaluates any support layer on the controls they'd demand internally — chief among them SLA timers with breach flags and an attainment number (the research digest, goal 10: objection preemption). Tideover already stores `Merchant.slaWindows` (am/pm support-window start times + tz) and `Ticket.firstResponseSec`, so the timer is a computed fact, not a new promise. This is a completeness/credibility feature, not core wait-reassurance — so it must be transparent and honest, never a fabricated SLA number.

## Decision

1. **First-response SLA target = the next support window after the ticket arrived.** Using `slaWindows.{amStart,pmStart,tz}`, the target for a ticket created at time T is the next `amStart`/`pmStart` occurrence strictly after T in the merchant's timezone. A ticket that arrives before the morning window is due that morning; one arriving mid-afternoon is due next morning. **Timezone is resolved with native `Intl.DateTimeFormat({timeZone})`** (DST-correct, no date library, no fragile fixed offsets); the `ET`/`CET` labels map to IANA zones (`America/New_York`, `Europe/Berlin`).

2. **Escalated tickets get a tighter target.** `Ticket.priority === "escalated"` (chargeback-threat / hostile) → target = the sooner of the next window OR `createdAt + ESCALATED_TARGET_HOURS (2h)`, matching how real teams tier SLAs by priority. This is a transparent default, shown, not hidden.

3. **Per-ticket chip (cockpit).** For an OPEN ticket: a countdown to its target — neutral with time to spare, **amber** within `NEAR_BREACH_MIN (60m)`, **red** once past target. A ticket already answered (`firstResponseSec != null`) shows met/missed against its target, not a live countdown.

4. **Attainment tile (dashboard).** Over answered tickets, `attainment = met / answered`, where "met" = `firstResponseSec ≤ (target − createdAt)`. Shown with the denominator (n) and the same small-sample honesty the rest of the product uses; below a small n it reads "collecting" rather than a headline %. No projection, no fabricated target.

5. **Pure lib + the two hot surfaces.** `lib/sla.ts` (pure, `now` injectable, Intl-based) computes target/state/attainment; the inbox chip + dashboard tile render it. This is the sole in-flight hot-file task. No engine change (goldens/invariants untouched); no schema/seed change (`slaWindows` already exists).

## Proof-only guardrails

Every SLA figure is computed from real timestamps + the merchant's own configured windows — never invented. The target basis + the escalated/near-breach thresholds are shown, so a reviewer can check the math. Attainment carries its n; no headline rate on a tiny sample. Relative/clock times only, no fabricated "we hit X% SLA" claim.

## Alternatives rejected

- **Fixed elapsed-hours SLA (e.g. "4h")** — ignores the merchant's real support windows, and would breach at 2am; the window model is both more honest and what the schema already encodes.
- **A date library (luxon/dayjs)** — a new dependency; `Intl` handles tz + DST natively.

## Kill-criteria

If real merchants run windows the two-slot am/pm model can't express (24/7, weekend rules), generalize `slaWindows` then — not before a merchant needs it.
