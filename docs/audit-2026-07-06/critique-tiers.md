Citations verified against code (all accurate for the existing self-serve floor: `buildPlaybook` `onboarding.ts:36–55`, previews `:125–143`, `giftCatalogIds:[]` `:93`, color defaults `:85`, checklist `setup.ts:96–174`, quiet-webhook `:56–79`, `worstStory` `OnboardingWizard.tsx:570–579`, connect/import `:223–240`). The problems are all in the **new DFY work the spec layers on top** — that machinery mostly doesn't exist.

# Adversarial review — Tideover onboarding tiers

## BLOCKERS (must fix before build)

1. **`worstStory` is discarded — Growth's headline deliverable has no input.** The wizard collects it (`OnboardingWizard.tsx:570–579`) and the API validates it (`api/onboarding/route.ts:27`), but `createMerchantFromIntake` never persists it (`lib/onboarding.ts:57–146` has no reference to it). It's dropped on submit. Growth's "voice-calibration pass … using their real scariest message (the `worstStory` field)" assumes Dylan can retrieve it later — he can't. The wizard hint even promises "so we can pressure-test the tone," which nothing does. Persist it, or Growth's core input is vapor.

2. **DFY branding has no product surface — the branding row is fiction at every tier.** Colors are hardcoded (`lib/onboarding.ts:85`), the wizard never captures them, and there is no merchant-update API (no `PATCH/PUT` route under `app/api`). "Logo" is just the brand-name text (`logoText`, `:84`); no image upload. So Starter's "self-serve branding via docs" points at nothing editable, and Scale's "DFY branding pass — sets colors/logo" is a by-hand data-store edit, fragile to re-seed. Build a brand editor or rewrite this row honestly.

3. **DFY gift-catalog seeding has no surface.** `app/app/gifts/page.tsx` is read-only; there is no catalog-create API, and new merchants get `giftCatalogIds: []` (`lib/onboarding.ts:93`). "Dylan seeds catalog + goodwill thresholds tied to LTV tiers" (Scale) = manual DB edit with zero tooling. Underspecified: how.

4. **"Hand-written stage overrides (`byStage`)" can't be authored during setup.** `buildPlaybook` always emits empty `byStage` (`onboarding.ts:40–52`). The *only* authoring path is `promoteVariant(ticketId, text)` (`api/variants/promote/route.ts`), which needs an existing live ticket to edit-and-promote; the scripts page (`app/app/scripts/page.tsx`) is analytics-only. During the 2-week Scale setup, before real tickets flow, there is nothing to promote from — Dylan cannot pre-write overrides. Mechanism and timeline are out of sync.

5. **Scale "Dylan imports for you" breaks the product's core privacy promise.** ImportPanel's whole trust story is "raw file parsed in-browser, never leaves your machine" (`ImportPanel.tsx:11,98`). Scale's "send the export, Dylan cleans, imports" means the raw CSV leaves the merchant's machine and lands on Dylan's — inverting the guarantee shown to that same customer. This is a data-exposure decision (Fable-owned per charter). Needs an explicit consent/handling story before it ships.

## IMPROVEMENTS (should)

- **No combined capacity ceiling.** The guardrail lists per-tier maxes (2–3 founding ≈20–40h, ~1 Scale/wk ≈20–28h, 2–3 Growth/wk ≈16–36h) as independent; summed they exceed a solo founder's sellable hours in a bad week — and ignore that onboarding is one of several jobs (build/sell/support existing). Give a single monthly onboarding-hours budget plus a triage rule for when Scale+Growth+pilot land in the same week.
- **Webhook self-serve is the weak floor.** ConnectPanel setup (paste ingest URL + signing secret + JSON body into a Gorgias HTTP integration / Zendesk trigger, `ConnectPanel.tsx`) is developer-grade — the spec itself concedes it needs a 30–45-min screenshare at Growth. Expecting Starter to self-serve it via docs risks stuck merchants and blows the 0.25–0.5h reactive budget. The simple email-forwarding path (`inboxAddress`, `OnboardingWizard.tsx:223–234`) is the real self-serve floor; the matrix conflates the two ingest paths.
- **SLAs become concurrency promises.** "next-business-day / 1-day / same-business-day" are proof-only-safe (footnote ¹ is correct), but they're commitments to *every* active customer at once. Five Starters landing mid-Scale-onboarding can break the async SLA. Consider "target" language or a concurrent-setup cap.
- **Fast-start erases two paid-tier inputs.** The 3-step fast path (`FAST_STEPS:66`) skips both custom production stages (falls back to `DEFAULT_STAGES`) and the worstStory step. Growth/Scale buyers who took fast-start arrive with neither the tuned timeline nor the scary-message those tiers are sold on.
- **Downgrade/lapse undefined.** DFY artifacts live in the merchant record so they persist, but whether Dylan keeps maintaining branding/catalog/overrides after a Scale→Growth downgrade or a lapse is unspecified. Bundled onboarding = service tracks current tier; state what happens to prior DFY work.

## QUESTIONS FOR DYLAN

- DFY import (Scale) requires the merchant's raw CSV to leave their machine and reach yours — accept that exception to the "never leaves your machine" promise, and how disclosed/handled?
- No editor exists for brand colors, gift catalog, or `byStage`. For the DFY tiers, are you OK hand-editing the data store per merchant (fragile; re-seed can clobber), or must a minimal operator-settings surface be in scope first?
- Are $299/$499/$749 the actual held numbers, and is onboarding definitely bundled (no separate setup fee)? The matrix depends on both.
- What's your real *combined* monthly onboarding-hours ceiling across all tiers, and which tier yields first when a week overloads?
- Is the "scheduled start date" stagger for Scale/founding a manual calendar discipline, or does it need a product booking surface? (A `/book` page exists — should tiers gate it?)