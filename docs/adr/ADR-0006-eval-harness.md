# ADR-0006 — Engine eval harness: invariant sweep (authoritative) + golden regression (review-gated)

**Date:** 2026-07-03 · **Status:** accepted · **Task:** OS4 · Implements sprint goal 11 ("validate before build")

## Context

Every tick touches or depends on the deterministic engines (reassurance, refund-risk, gift, social-signal). Unit tests (7) cover specific cases; nothing yet proves the proof-only invariants hold across the whole input space, and nothing catches an unintended output change on a known ticket. The engines are pure with an injectable `now`, so both are cheap to build.

## Decision

Two layers, wired into `npm run eval`, which joins the `verify` chain and CI:

**1. Invariant sweep (`evals/invariants.mjs`) — AUTHORITATIVE, no human review needed.** Sweep the cross-product of `daysInWait` 0–150 × every `productionStage` × every sentiment × representative order/customer shapes (a few thousand pure calls, runs in ms). For every produced draft/score assert the properties that must hold for ALL inputs:
- `assertNoHardDate` passes on every drafted reply (no calendar date ever).
- No unresolved `{merge_field}` / `{{token}}` remains in any draft.
- No banned word (from the merchant brand config) survives.
- Confidence band `lo <= hi`; band text matches the "never a date" format.
- Escalation happens **iff** sentiment is hostile or chargeback-threat.
- Refund-risk score ∈ [0,100]; priority rank within valid set.
- Gift gate honored (recommended iff the LTV/wait/risk gate passes).
These are properties, not snapshots, so they are correct by construction — a passing sweep is authoritative today.

**2. Golden regression (`evals/golden/*.json` + `evals/golden.mjs`) — REGRESSION gate, spec-status pending D9 review.** ~40–60 fixtures generated from the existing seed via `evals/gen-goldens.mjs`, snapshotting current engine output (stageKey, overdue, priority, riskBand, topDriver, gift decision, must-contain / must-not-contain draft phrases). Any future change that alters a golden fails `eval` — forcing a deliberate regenerate + review rather than a silent behavior drift.

## The critical rule (from the enrichment digest's risk note)

`gen-goldens` snapshots CURRENT output, so committing it blindly enshrines today's behavior — including any current bug — as "the spec." Therefore: each golden's expected block carries `"reviewed": false` until **Dylan reviews them once (task D9)** and they flip to `true`. Until reviewed, goldens still function as a regression tripwire (catch unintended changes) but are NOT claimed as verified-correct. A golden diff in any PR requires an explicit `playbook-change`/`engine-change` acknowledgement + regeneration — never an auto-snapshot to make a red test green.

## Options considered

- LLM-judge evals — rejected: engines are deterministic; properties + snapshots are exact and free. (Enrichment digest flagged this as a scope trap.)
- Only unit tests — rejected: don't cover the input space or catch regressions on real tickets.

## Kill-criteria

If the invariant sweep gets slow enough to bother the inner loop (>2s), sample the space deterministically instead of full cross-product. If goldens churn every unrelated PR, tighten what they assert to the stable, meaningful fields only.
