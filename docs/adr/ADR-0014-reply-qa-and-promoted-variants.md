# ADR-0014 — Reply QA checklist + operator-promoted variants (E4)

**Date:** 2026-07-03 · **Status:** accepted · **Task:** E4 · Builds on ADR-0007/0012/0013 (the outcome loop)

## Context

The outcome loop can now measure a reply (E1) and its aftermath (E2/F4) and show it per variant (E3). E4 closes the human side: (1) a **QA checklist** on the drafted/edited reply so the operator sees, before sending, that it clears the proof-only bar — most importantly the **hard-date gate** the send path already enforces; and (2) **operator-promoted variants** — when an operator meaningfully rewrites a reply, let them save that rewrite as a tracked variant so it competes in the panel. This is the "self-improving playbooks" story made actionable, not just observed.

## Decision

### 1. Reply QA is a CHECKLIST of measured properties, never a fabricated score
Four dimensions, **two auto-scored** (objective, computed from the text), two **guidance** prompts (shown as reminders, never a fabricated pass/fail number — proof-only forbids inventing a "94% quality"):

- **No hard date** — AUTO, and a HARD GATE. Reuses `containsHardDate` (lib/proof.ts). `/api/approve-send` already calls `assertNoHardDate` on the operator's final text, so a hard date is physically un-sendable. E4 surfaces this in the cockpit *before* the send attempt and returns a structured reason on the 4xx so the UI explains the block. **This is the QA claim no human service can copy: the software will not send a hard date.**
- **Personalized** — AUTO. The customer's first name appears in the reply.
- **Acknowledges the wait** — guidance prompt (not auto-scored).
- **Specific to the order** — guidance prompt (references the production stage / timeline).

The checklist reports facts (hard-date present? name present?), so it stays proof-only. The hard-date row is the only one that blocks; the rest inform.

### 2. Operator-promoted variants
When the operator's final text diverges from the draft by more than **PROMOTE_THRESHOLD = 0.30** (`editedRatio`, the existing Levenshtein ratio), the cockpit offers — after a successful send — **"Save this edit as a variant."** On confirm, create a `ScriptVariant`:
`{ source: "operator-promoted", parentVariantId: <the draft's variant>, text: <edited>, stageKey/productionStage: <from the parent>, status: "active", isDefault: false }`.

It immediately enters the Script Performance panel and accrues outcomes like any variant. **Operator-confirmed, never silent** — auto-creating on every big edit would spam the library. Requires a new `scriptVariants.create` on both drivers (json + mongo).

## Proof-only guardrails

- QA is measured properties, not an invented score. No numeric "quality %".
- The hard-date gate is real server-side enforcement (`assertNoHardDate`), not a UI nicety — the UI only mirrors it.
- A promoted variant carries its real provenance (`operator-promoted`, `parentVariantId`); its panel stats obey the same n=20 humility.
- No new fabricated metric, testimonial, or hard date anywhere.

## Out of scope / deferred

- No auto-selection between variants (cut — humans pick; the panel only informs).
- No LLM QA scoring — the two auto dimensions are deterministic string checks.
- Retiring/merging promoted variants (a later curation task).

## Kill-criteria

If operators promote noise (near-duplicate variants), add a similarity guard at promote time — but not before real use shows the noise.
