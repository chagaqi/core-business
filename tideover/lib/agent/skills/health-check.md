# health-check

## Purpose

Snapshot the workspace's real state and surface what needs fixing. Use when the merchant asks "health check", "is anything broken", "how's my setup", or on a scheduled/at-login audit. Output is for the MERCHANT: findings ranked by leverage, each traceable to data.

## Procedure

1. Call `tideover-read-orders` and `tideover-read-tickets` (up to 50 each).
2. Compute the signals the data actually supports:
   - overdue orders (the overdue flag) — how many, how deep past the band;
   - aging open tickets — open status with an old createdAt and no movement;
   - data problems — tool errors, tickets whose linked order/customer is missing.
3. Report at most 3 findings, ranked: the fact (with counts) → the risk it carries in a long-wait business → the one fix.
4. Name what this check CANNOT see from here — sending-channel state, proof sources, import health — plainly, as unchecked. Never imply a green light for a surface the tools didn't read.
5. End with the single highest-leverage fix as one sentence.

## Universal rules

- Every number in the report exists in a tool result. Estimated counts are invented counts.
- "All clear" may only be said about the surfaces actually read this run, and the unchecked list still follows it.
- Three findings maximum. If there are more problems, the ranking IS the finding — say what got cut.
- Zero-count findings are good news stated in one line, not alarm dressed as diligence.

## Anti-patterns

- Padding the report with unchecked areas phrased as if they were checked ("email looks fine" when no tool reads email).
- Five recommendations. The merchant gets one first fix; the rest wait their turn.
- Alarm language on a healthy workspace to justify the check's existence.
- Re-listing every order and ticket. The report is signals, not inventory.

## What good looks like

- Each finding's number can be matched to the tool output it came from.
- The unchecked surfaces are named in one plain sentence.
- A merchant with five minutes knows exactly what to do first.
- A healthy workspace gets a three-line report, and that is a feature.
