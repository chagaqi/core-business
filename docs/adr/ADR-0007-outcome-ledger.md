# ADR-0007 — Outcome ledger Phase 0: script variants + append-only outcome events

**Date:** 2026-07-03 · **Status:** accepted · **Task:** E1 · Foundation for the "self-improving" story (E2/E3/E4)

## Context

Dylan's headline ask is a "self-improving algorithm for handling customers." The honest, proof-only version (per the self-improving lens in the research digest) is NOT model retraining — it's **outcome-measured playbooks**: every playbook template becomes a tracked variant, every sent reply is stamped with which variant produced it, and outcomes accrue against that variant so the UI can one day show "this day-60 script has a 72% calm-response rate over 41 sends" — measured, never invented. Phase 0 lays the data foundation only.

The reassurance engine selects a template via `merchant.playbook[stageKey].byStage[productionStage] ?? .base` (reassurance.ts). That selection identity IS the variant.

## Decision (Phase 0 scope — deliberately minimal)

1. **`ScriptVariant`** — `{ id: 'var_…', merchantId, stageKey, productionStage | null (null = the stage's base), text, source: 'library'|'merchant-default'|'operator-promoted', isDefault: boolean, status: 'active'|'retired', parentVariantId?: string|null, createdAt }`. A migration wraps every existing playbook `base` + `byStage[x]` string as an `isDefault: true`, `source: 'merchant-default'` variant. **Deterministic, stable ids** (derived from merchantId+stageKey+stage) so re-seeding is idempotent.

2. **`OutcomeEvent`** — append-only `{ id: 'oe_…', merchantId, ticketId, orderId, customerId, variantId, stageKey, sentimentAtSend, kind, observedAt, meta? }`. Phase 0 emits exactly one kind: **`reply_sent`** (with `meta.editedRatio`). The other kinds (customer_replied, reopened, csat_up/down, refund_requested, chargeback, resolved_quiet) are defined in the enum for E2 but NOT emitted yet. Never edited, never deleted.

3. **Stamping.** `draftReassurance` returns a pure-metadata `variantKey = "<stageKey>:<productionStage|base>"` (NO change to draft text — goldens/invariants must stay green). At draft time the service resolves `variantKey` → the merchant's variant id and stamps `DraftReply.variantId`. At **approve-send**, the service computes `editedRatio` = normalized char-distance between the drafted text and the approved text, and emits a `reply_sent` OutcomeEvent carrying `variantId` + `editedRatio`.

4. **`isDemo` lineage.** Demo merchants' outcome events must never count toward any real proof stat (proof-only). Events inherit the merchant's `isDemo`; any future stat rollup filters on it. Seed emits a handful of clearly-DEMO events so E3's panel has something to render.

5. **Repositories.** `ScriptVariantRepository` + `OutcomeEventRepository` added to the `Repositories` interface; implemented in BOTH json and mongo drivers with matching semantics. Mongo: unique index on variant `id`; `outcome_events` indexed `{ merchantId, variantId, kind, observedAt }` (non-unique, append-only).

## Explicitly OUT of scope (cut list / later phases)

- **No selection policy** (epsilon/Thompson/bandit) — cut for the sprint; slots need months to reach n. Default variant is always chosen.
- **No Script Performance panel** — that's E3 (renders these stats). Phase 0 only makes the data exist + accrue.
- **No auto-promote / save-edit-as-variant** — E4.
- **editedRatio only**; no reopen/refund/chargeback attribution — E2.

## Proof-only guardrails

editedRatio is a measured fact about the operator's own edit; no fabricated outcome. "Self-improving" stays out of any customer-facing copy — it exists only as measured numbers with n-badges once E3 lands. Draft text is unchanged by this work, so `assertNoHardDate` and the 52,440-assertion OS4 sweep must remain green.

## Migration & kill-criteria

`gen-seed.mjs` + `seed-check.mjs` migrate in the same change (variants derived from each merchant's playbook; stable ids; a few DEMO outcome events; new `script-variants.json` + `outcome-events.json` seed files registered in the pipeline). If the variant-key scheme ever needs to distinguish sentiment-specific variants, extend the key — not the identity model — later.
