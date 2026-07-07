I've verified the spec's claims against the codebase. All cited file:line references are accurate (gift shape, engine gate, risk bands, empty-catalog onboarding, gift-send hole, eval structure). The derivation math and a few integration seams are where it breaks down. Findings below.

---

## BLOCKERS (must fix before build)

**B1 — Eval blast-radius is materially understated; the tier→eligibility derivation silently changes more than minRiskScore.** The spec (§1.3) tells the implementer only "priority-dispatch 60→50 and next-order-credit 65→75" shift. But deriving `minLtvCents` from tier (base→0, mid/full→`ltvTiers.high`) and `minWaitDays` from per-tier defaults changes **minWait and minLtv on nearly every gift**. Concrete deltas vs current `gifts.json`/`gen-seed.mjs:221-227`:
- early-access: minWait 30→7, minRisk 40→0
- digital-perk: minRisk 30→0
- founder-note: **minLtv 0→50000/60000**, minWait 45→30
- priority-dispatch: minLtv 50000→50000/60000, minWait 45→30, minRisk 60→50
- next-order-credit: minLtv 60000→**50000** (lumen loosens!), minWait 60→45, minRisk 65→75

Also "both mid gifts from 50/60→50" is wrong — founder-note is already 50 (no change). The golden churn is broad, not "some fixtures," and the derivation embeds a **product regression** (see B2). The blast-radius note must be corrected before an agent regenerates goldens, or it will rubber-stamp a semantic change as a "clean data migration."

**B2 — Tying `minLtvCents` to tier locks cheap emotional gifts behind the high-LTV gate.** founder-note (cost $5, `gen-seed.mjs:223`) is mid-tier → derived `minLtvCents = ltvTiers.high`. A handwritten note — exactly the goodwill you want to send an anxious *low-LTV* customer — becomes unavailable to standard-band buyers. This directly fights §3.2/Q4's own goal ("≥1 base gift so standard-band customers always have something") and the goodwill intent. The LTV derivation needs rethinking (decouple LTV from tier, or make LTV a per-gift lever) — not just documenting.

**B3 — Multi-gift send state + tag scheme is underspecified and latently broken.** `/api/gift-send` writes `gift-sent:<kind>` (`route.ts:22`) — keyed by KIND, not gift id. The panel's "already sent" check is `tags.some(t => t.startsWith("gift-sent:"))` (`inbox/page.tsx:276`) — **whole-panel**. The current `GiftSuggestion` tracks one `sent` boolean for one gift (`GiftSuggestion.tsx:39,96-104`). Turning it into a list of independently-sendable rows is a rewrite, not an "extend," and the spec never says: does sending one gift lock the whole panel? How are two gifts of the *same kind* distinguished (they can't be, under the current tag)? Can a rep send a second gift? An implementing agent will guess wrong here.

---

## IMPROVEMENTS (should)

**I1 — Panel breaks the engine's "only surface a gift when it helps" doctrine.** After re-tiering, base gifts (minRisk 0, minWait 7, minLtv 0) are `unlocked` on virtually every open ticket (presale customers are always past day 7). The panel will show a live "Send this gift? Confirm" control on calm, on-time, low-value tickets — the opposite of `recommendGift`'s deliberate gate (`gift.ts:35`, comment lines 8-10) and off-strategy for a margin-protection product. Consider gating the *active-send* affordance (not just display) on the engine gate, or visually de-emphasizing base sends the engine wouldn't recommend.

**I2 — The §2 unlock matrix headline (band-only) contradicts the actual function (band + LTV + wait).** The merchant-facing onboarding helper "Mid = watch-risk & up · Full = high-risk / escalated" (§3.1) omits the LTV/wait secondary gates entirely, so the merchant builds a mental model that's false for low-LTV/early-wait customers. The taught ladder must state the secondary gates or it mis-sells the behavior.

**I3 — Ship the `/api/gift-send` 403 authorization as its own change first.** It's an independent, lower-risk security fix (the hole is real — `route.ts:12-24` trusts any gift id, no merchant-ownership check even today). Bundling it into an ~18-item feature delays it and enlarges the blast radius. Note: it's *more feasible than the spec implies* — `getTicketView(ticketId)` (`service.ts:57-80`) already reconstructs order/customer/merchant/intel, so if `availability` lives in `computeTicketIntelligence` the route just checks `intel.availability.find(...)?.unlocked`. Spec's "re-resolve customer/order, recompute" overstates the work.

**I4 — Stage the build; it can't stay verify-green as one commit.** ~18 items across schema, engine, seed, two repo drivers, onboarding UI+API, hot inbox file, public route, tests, 55-golden regen, ADR. Split: (a) schema+seed+eval regen, (b) repo write methods + onboarding write path, (c) panel, (d) server auth — each `npm run verify` green independently.

**I5 — kind and tier are independently editable (§3.1) → footgun.** A merchant can set kind=next-order-credit ($25 credit) at tier=base and hand it to every day-7 customer; the $500 cost cap (2500 < 50000) doesn't stop it. If tier is "the single lever," it needs a guardrail or a cost-vs-tier sanity warning.

**I6 — Underspecified for the implementer:** (a) `COST_CAP` constant location (shared client-validation + server zod — where?); (b) `giftStep` index differs by mode (full=4, fast=2) so the `next()` branch must resolve it dynamically via `steps.indexOf`, not a constant; (c) existing `createMerchantFromIntake` callers/tests break when `IntakeData` gains required `gifts` (`onboarding.ts:13-25`) — enumerate them; (d) inbox panel empty-state when a merchant has zero gifts is unspecified; (e) monotonicity invariant must hold `escalated` fixed (it's an independent axis that jumps the set to full).

**I7 — `engines/index.ts` is a shared seam, not on the hot-file list but high blast-radius.** Adding `availability` to `computeTicketIntelligence` (`index.ts:40-78`) touches every cockpit read + the eval harness path. Additive is fine (goldens read only `gift.gift.id`), but flag it alongside the hot inbox file for serialization.

---

## QUESTIONS FOR DYLAN

*(The spec's own Q1–Q8 stand; these are the ones I'd escalate hardest or add.)*

**QD1 — Q1 (goodwill budget) is not really optional.** The send caption "Comes from your goodwill budget — you're authorized to send this" asserts a budget that has no field on `Merchant` and no spend ledger (`route.ts` records no cost). Under proof-only, shipping copy that references a non-existent budget is a fabricated claim (even rep-facing). Resolve *before* build: real `goodwillBudgetCents` cap that `gift-send` debits/blocks, or change the copy. Don't leave as open.

**QD2 — Is B2 intended?** Do you actually want cheap goodwill (founder-note, digital perk) gated behind high LTV once it's mid-tier? Or should LTV be decoupled from tier so a $5 note can go to any anxious standard-band customer?

**QD3 — Is I1 intended?** Should the panel invite sending goodwill on calm/on-time/low-value tickets (base unlocked everywhere), or stay conservative like the current engine and only offer active sends when a gift "actually helps"?

**QD4 — Onboarding never collects LTV tiers.** mid/full `minLtvCents` derives from the hardcoded default `ltvTiers.high = 50000` (`onboarding.ts:92`) the merchant never saw or set. Is a $500-LTV gate on an unconfigured default acceptable, or does the gift step also need to surface/adjust the LTV threshold?

**QD5 — Fast-onboarding friction.** The ≥3-gift hard gate lands in FAST_STEPS too (`OnboardingWizard.tsx:66`). Prefill satisfies it on defaults (early-access + digital-perk are base, so ≥1-base passes), so a merchant *can* click through — confirm you're OK adding gift-economics thinking to the ≤15-min self-serve path, relying on prefill to keep it fast.