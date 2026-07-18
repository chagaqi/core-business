Verification complete. Every load-bearing claim checked against source. Findings below.

---

# Adversarial review — Tideover Merchant-Onboarding Data Checklist

Verified all cited file:lines against `tideover/`. The spec's evidence is mostly accurate, but the centerpiece fix (§C gift catalog) is built on a wrong consumption model and is infeasible against the current repo seam.

## BLOCKERS (must fix before build)

**1. The §C / §D#1 gift-catalog fix is infeasible and mis-specified — there is no write path, and `giftCatalogIds` is not the consumption key.**
- The gift engine's `catalog` comes from `repos.gifts.listByMerchant(merchant.id)` (`service.ts:67,107,424` → `json/repositories.ts:160` filters the `gifts` store by `merchantId`). It does **not** read `merchant.giftCatalogIds`.
- `giftCatalogIds` is **never read by any runtime engine or service** (grep: only `evals/_shared.mjs:49`, `scripts/seed-check.mjs:79`, `gen-seed.mjs` — seed/eval tooling). Row 10/11's implied path (`giftCatalogIds` → `engines/index.ts:73` → `gift.ts:31`) is wrong: `index.ts:73` is `highTierCents: merchant.ltvTiers.high` (the LTV threshold), not the catalog.
- `GiftRepository` (`repositories/types.ts:80-83`) exposes only `listByMerchant` + `findById` — **no `create`.** Both drivers (`json/repositories.ts:158-163`, `mongo/repositories.ts:186-191`) are read-only. `createMerchantFromIntake` only calls `repos.merchants.create`.
- Consequence: an agent that implements §C literally (collect 7 fields, set `giftCatalogIds`) ships a merchant whose gift engine is **still dead**, because no `Gift` rows exist for the new `merchantId`. The real fix = add `create` to `GiftRepository` + both drivers, and have onboarding persist authored gifts keyed by `merchantId`. That is a repository-seam change = high-risk area per CLAUDE.md (Opus/review-gated), and the spec is silent on all of it.

**2. "Editable stage rows" (row 3) must be pinned to the fixed key enum.**
`ProductionStageKey` (`types.ts:18-25`) is a closed 6-value union; `playbook.byStage` (`reassurance.ts:75`) and `stageCeilDayFor` (`refund-risk.ts` via `engines/index.ts:53`) key off it. The spec says "editable stage rows" without stating keys can't be added/renamed. An agent that lets a merchant add a 7th stage or free-text a key silently breaks `byStage` lookup and stage-ceiling risk math. Constrain the UI to relabel / re-band / re-blurb the **6 fixed keys** only.

## IMPROVEMENTS (should)

**3. The spec's own dead-field audit (§E) missed `giftCatalogIds`.** At runtime it is exactly a §E-class write-only field (`types.ts:98`, set at `onboarding.ts:93`, read by no engine). Either wire the engine to resolve it, or drop it and rely on gifts-by-`merchantId`. As-is, populating it in the wizard is theater.

**4. Row 9 "timezone select" is underspecified and has a silent-failure edge case.** `resolveTimeZone` (`sla.ts:70-94`) accepts only 11 short labels (`ET/EST/EDT/CT/MT/PT/CET/CEST/GMT/BST/UTC`) or a raw IANA `Area/City`; anything else **silently falls back to `America/New_York`** (no throw). An agent needs that exact vocabulary to build the select. Non-US/Euro merchants (AEST/JST/IST) get silently-wrong SLA/breach flags, not an error — worth a validation gate. Also pin the time-input format: `amStart/pmStart` are `"H:MM"` 24h strings (`sla.ts:36-39`).

**5. §B "floors to $50 (`csv.ts:49`)" is imprecise.** `DEFAULT_ORDER_VALUE_CENTS = 5000` is a **default applied only when no amount parses** (`parseMoneyToCents`→undefined, used at `import.ts:69,101`). A parsed $10 pledge stays $10 — it is not clamped up. Fix the description so the LTV/gift-gate implications aren't misread (see Q8).

**6. Copy-integrity fix (§E) is required, not optional — confirmed verbatim.** `OnboardingWizard.tsx:504` "these shape the reassurance copy" and `setup.ts:128` "Every reassurance draft is written in this voice." Both are false under the shipping `DeterministicDrafter` (voice/tone unconsumed; `getDrafter()` returns deterministic unless `LLM_PROVIDER` set, `LlmDrafter.ts:40`). This is a merchant-verifiable proof-only/trust violation — treat as a must-fix, not a "should."

**7. Row 4 "setup signal `setup.ts:111`" is wrong.** The helpdesk **dropdown choice does not flip the setup item.** `setup.ts:110-111` flips `helpdesk` on `presaleTags.length > 0` OR a non-`mock` inbound. Selecting a helpdesk in the wizard alone won't turn the checklist green — don't wire the dropdown to that signal.

## QUESTIONS FOR DYLAN

**8. Keep "≥3 gifts REQUIRED" as a hard gate?** It fights both the ≤15-min self-serve budget (≥21 fields to author) and the engine's actual reach. The gate needs `ltv ≥ $500` (highTierCents) AND (wait≥45d OR risk≥60) (`gift.ts:31-33`). Imported KS/BackerKit backers get `ltvCents` = pledge amount (default $50); typical $25–$100 pledges **never clear the $500 gate**, so the gift engine will rarely fire for a new merchant's real backers regardless of how many gifts they author. Demote to REC (seed the 5 defaults, allow skip)? And is $500 the right high-tier default for crowdfunding pledge sizes?

**9. Is onboarding truly merchant self-serve ≤15 min, or Dylan-white-glove?** `setup.ts:83` comment says "the operator (or Dylan onboarding one)." §F adds substantial net-new entry (gift repeater, color picker, SLA windows+tz, 4 baseline numbers, presale tag). If ≤15-min self-serve is the binding constraint, §F exceeds it; if Dylan onboards, the binding constraint is Dylan-hours/merchant. Which persona sets the cut line?

**10. `worstStory` and `preorderApp` — cut or wire?** Both confirmed dead (`worstStory`: `IntakeData:24`, never read in `createMerchantFromIntake`; `preorderApp`: stored `types.ts:93`/`onboarding.ts:88`, no reader anywhere). Cutting is UI-only; wiring `worstStory` to a pressure-test preview is net-new scope. Which?

Note: GAP #5 (order-ref) is **correctly** diagnosed — `status.ts:108` sets `orderRef: order.id` and `Order` (`types.ts:117-150`) has no `merchantOrderRef`; `StatusView.tsx:59` renders the raw `ord_…`. No dispute there.