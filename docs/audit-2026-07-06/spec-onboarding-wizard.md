# Tideover Onboarding Wizard — Redesign Spec

**Status:** build-ready · **Scope:** replace `tideover/app/onboarding/OnboardingWizard.tsx` and its success screen · **Evidence base:** every file:line below was opened in this audit.

---

## 0. Design intent (what "5 steps in a box" has to fix)

The current wizard is a two-mode (`fast`/`full`) chip-stepper that dumps 5 loose forms into one flat panel (`OnboardingWizard.tsx:65-66,281-338`). It reads as a form because: the progress indicator is a thin horizontal chip row (`Stepper.tsx:6-28`), there is no persistent frame, and it collects four fields nothing consumes (voice, tone, `preorderApp`, `worstStory` — proven dead in INPUT 1 §E). The redesign is **one guided flow, no mode toggle**, in a fixed box with a **named vertical rail**, and it asks *only what an engine reads*.

Two personas govern every call: **(A)** self-serve founder, done in ≤15 min; **(B)** rushed founder who abandons anything that feels like homework. The single most important tactic for both: **everything is pre-filled**, so required steps feel like *confirmation*, not *authoring*. The reward (generated day-stage scripts) is shown the instant they launch, before any CSV homework.

---

## 1. Step grouping — decision and defense

| # | Step name | Fields | Tier | Weight |
|---|-----------|--------|------|--------|
| 1 | **Your brand** | brand name · sign-off · banned words · status-page accent · logo text | REQ gate + REC | Light |
| 2 | **Your timeline** | fulfillment window min/max · 6 prefilled production stages | REQ | Medium (prefilled) |
| 3 | **Goodwill gifts** | 5 seeded gifts (≥3 required) · high-value $ threshold | REQ (founder call) | Medium (prefilled) |
| 4 | **Connect** | helpdesk choice · presale tag | REQ config | Very light |
| 5 | **Review & launch** | editable summary of 1–4 | — | Light |

**Why this order, not the strawman (`1 Brand & voice / 2 Timeline / 3 Connect + import / 4 Gifts + branding / 5 Review`):**

1. **Grouped by the merchant's mental model, one model per step.** Brand identity (name, sign-off, banned words, accent, logo) is *how you look and sound* — it belongs together. The strawman splits accent/logo into the gifts step, which welds two unrelated models (retention economics + page colors) into one card. Gifts are *your goodwill economics*; they earn their own step.
2. **Import is deliberately NOT a wizard step.** The connect URL, signing secret, and CSV import all require a `merchantId`/`inboxToken` that is **minted server-side at creation** (`onboarding.ts:71,78`; secret derived from a server-only root, `ingest-templates.ts:47`, `route.ts:40-46`). You cannot render `ConnectPanel`/`ImportPanel` before the merchant exists. So step 4 collects only the *choice* + *presale tag* (pure config, no server artifact); the URL/secret/JSON and the CSV import move to the **completion screen** where `merchantId` exists — exactly where they live today (`OnboardingWizard.tsx:236-240`).
3. **Never block the reward on homework (persona B).** Previews render against a synthetic sample order (`onboarding.ts:107-143`), so the playbook appears with zero backers imported. Import is the "activate real backers" action, correctly a *do-this-next* on `/app/setup`, not a gate. A rushed founder sees their scripts, then chooses to import when their CSV is in hand.
4. **Required gates front-loaded, heaviest-but-prefilled steps in the momentum zone.** Brand-name hard gate is step 1 (as today, `OnboardingWizard.tsx:128`). Timeline and gifts (the two medium steps) sit at 2–3 where commitment is highest; both open pre-filled so the work is editing, not creating. Step 4 is one dropdown — a deliberate breather before launch.

---

## 2. The box / frame (global layout)

A single fixed-width card on the sand background (`#FBF8F2`), centered, `max-w-[860px]`. Reuse the existing `.wrap` / `.panel` shell (`OnboardingWizard.tsx:254,281`).

```
┌─────────────────────────────────────────────────────────────┐
│  [Tideover logo]                          Step 2 of 5        │  ← header
├──────────────────┬──────────────────────────────────────────┤
│  PROGRESS RAIL   │   CARD (current step)                     │
│                  │                                           │
│  ✓ Your brand    │   Your timeline                           │
│  ● Your timeline │   The window and stages we turn into      │
│  ③ Goodwill gifts│   calm day-by-day reassurance.            │
│  ④ Connect       │                                           │
│  ⑤ Review        │   [ fields … ]                            │
│                  │                                           │
├──────────────────┴──────────────────────────────────────────┤
│  ← Back                                    Continue →        │  ← sticky footer
└─────────────────────────────────────────────────────────────┘
```

- **Progress rail (desktop, left column ~200px):** vertical list of the 5 named steps. Done = teal disc + `✓`; active = ink label + filled marker; upcoming = muted number in a bordered disc. This is the existing `Stepper` state logic (`Stepper.tsx:8-19`) rotated to vertical and restyled. Completed steps are **clickable** to jump back (data is preserved). Accent-only rule respected: the active marker uses teal, **not** terracotta — terracotta is reserved for the single forward action (D1). *(Today the active chip is terracotta, `Stepper.tsx:15` — change to teal so terracotta stays action-only per the design system.)*
- **Card:** one step's fields, each `<Field>` (`Field.tsx:9-25`) with a `label` + one-line `hint`. Card owns a title (Fraunces display) + one-sentence subhead.
- **Sticky footer:** `Back` (`variant="quiet"`, disabled on step 1) left; primary `Continue →` right, becoming `Launch Tideover` on step 5. Reuse `Button` (`Button.tsx:19-59`). Footer is `position: sticky; bottom: 0` inside the card so it never scrolls away on long steps (timeline, gifts).
- **Header:** logo + a plain `Step N of 5` counter (no marketing copy). Remove the `6-question fast-start` toggle entirely (`OnboardingWizard.tsx:257-265`) — one flow.

**State persistence (UX-30, `UX-AUDIT-HANDOFF.md:188`):** all form state + `currentStep` serialize to `sessionStorage` under `tideover:onboarding:v1` on every change (debounced ~250ms), hydrate on mount (SSR-guarded `typeof window`), and **clear on successful launch**. This makes "Back never loses data" true across step nav *and* refresh/close — today it's pure `useState` (`OnboardingWizard.tsx:78-109`) so a refresh wipes everything.

---

## 3. Per-step spec

### Step 1 — Your brand
*Subhead:* "How you look and sound to a customer who's waiting."

| Field | Control | Prefill | Validation | Defer/skip |
|-------|---------|---------|-----------|------------|
| Brand name (`name`) | text | empty | **Required, trim > 0. Hard gate** (`OnboardingWizard.tsx:113,128`). Consumed everywhere: `reassurance.ts:93`, `status.ts:99`, slug `onboarding.ts:62`. | none — blocks Continue |
| Sign-off (`brand.signoff`) | text | `— {brand name}` shown as placeholder | optional; blank → server default `— {brandName}` (`onboarding.ts:83`) | silent |
| Banned words (`brand.banned[]`) | text, comma list | empty | optional; split/trim/filter (`OnboardingWizard.tsx:162-165`). Applied by `stripBanned` `reassurance.ts:99` | silent no-op |
| Status-page accent (`brand.colors.primary`) | native color picker + hex text + **live swatch preview** | `#0E5366` (sea-teal) | any hex is safe — text auto-contrasts via `readableAccent` (`color.ts:104`). No validation needed. **New field; today hardcoded `onboarding.ts:85`.** | keep default = skip |
| Logo text (`brand.logoText`) | text | brand name (auto) | optional override; header renders first letter as the mark (`StatusView.tsx:46-48`) | defer, silent |

*Microcopy (anti-slop, no em-dashes):* Brand name hint → "What customers know you as." Accent hint → "Your status page picks up this color. Text stays readable automatically." Banned hint → "Words to keep out of every reply. Comma-separated."

**CUT from this step:** `voice` textarea and `tone` chips (`OnboardingWizard.tsx:497-506`). Neither is mechanically consumed — only the un-executed LLM sketch would read them (`LlmDrafter.ts:27`, INPUT 1 §E). Keeping them makes the wizard lie: it currently says tone "shape[s] the reassurance copy" (`OnboardingWizard.tsx:504`) and the setup checklist repeats "Every reassurance draft is written in this voice" (`setup.ts:128`) — both false under the deterministic drafter (`DeterministicDrafter.ts`, INPUT 1). **Fix both copy strings** as part of this work (see §7).

### Step 2 — Your timeline
*Subhead:* "The range and the stages. We turn these into confidence bands, never hard dates."

Reuse `TimelineEditor` (`OnboardingWizard.tsx:371-457`) largely as-is — it is the good part.

| Field | Prefill | Validation (UX-32) |
|-------|---------|--------------------|
| Window earliest / latest (days) (`fulfillmentWindowDays.min/max`) | 90 / 120 | `min ≥ 0`; **`max ≥ min`** or inline error "Latest must be on or after earliest," Continue disabled. Consumed by `computeTimeline` → `eta_band` (`reassurance.ts:71,88-90`), `import.ts:38-39`, risk `refund-risk.ts:78`. |
| 6 production stages (label · day from/to · blurb) | the 6 defaults (`OnboardingWizard.tsx:56-63`) | each stage **`from ≤ to`** or inline error, Continue disabled. Warn (not block) if a band falls outside `[0, max]`. Label + blurb consumed by `stage_blurb` on every draft (`reassurance.ts:96`, `status.ts:113`) and risk `refund-risk.ts:82,129`. |

Today the editor accepts `min>max` and `from>to` silently (`UX-AUDIT-HANDOFF.md:190`) — add the inline validation above and gate the footer button.

*Microcopy:* keep the existing, tighten: "Prefilled with sensible defaults. Adjust day bands and wording to match your reality. These are day ranges from order date, never calendar dates." (`OnboardingWizard.tsx:409-412`).

### Step 3 — Goodwill gifts (founder decision: ≥3 required, 2026-07-06)
*Subhead:* "Small gestures the cockpit can offer a high-value customer who's waited a long time. Start from ours and edit."

A repeater seeded with the **5 proven defaults** (`lib/data/gifts.json:1-66`) so the ≥3 gate is satisfied on arrival — the merchant edits, never authors from scratch. This step exists because today `giftCatalogIds: []` (`onboarding.ts:93`) leaves the gift engine dead on every onboarded merchant.

Per gift row (`Gift` shape `types.ts:259-271`, `GiftKind` `types.ts:40-45`):

| Field | Control | Seed example | Consumed by |
|-------|---------|--------------|-------------|
| Name | text | "Handwritten founder note" | cockpit reco `gift.ts:74` |
| Kind | select (5 enum values) | `founder-note` | `types.ts:40-45` |
| What it costs you | money, 0 allowed | $5.00 | ROI rank, `cost=0`→∞ `gift.ts:57` |
| What it's worth to them | money | $30.00 | primary rank key `gift.ts:59-60` |
| Only above $ LTV | money, 0 = any | $0 | filter `gift.ts:47` |
| Only after N days waiting | number | 45 | filter `gift.ts:48` |
| Only at risk ≥ (0–100) | number, clamp 0–100 | 50 | filter `gift.ts:49` |

**Plus, on this step:** high-value threshold (`ltvTiers.high`) — "A customer counts as high-value above $___." Prefill $500 (`onboarding.ts:92` current `50000` cents). Consumed by the gift gate `highTierCents` (`engines/index.ts:73` → `gift.ts:31`). It belongs here because it's the switch that decides *who* any gift can reach.

**Validation:** minimum **3 gift rows**; "Remove" is disabled (or blocked with an inline note) when 3 remain: "Keep at least three so the cockpit has options across value tiers." Each row: name non-empty, money ≥ 0, risk 0–100. `Add gift` appends a blank row defaulting `kind: digital-perk`, cost/value 0.

*Proof-only guard:* the step's helper copy promises **no** retention lift or refund reduction — only mechanics ("the cockpit can offer these"). The engine only fires for high-value + (deep-wait OR elevated-risk) customers (`gift.ts:31-35`); say that plainly, claim nothing measured.

### Step 4 — Connect
*Subhead:* "Where your support already lives. Tideover bolts on. Full setup takes 2 minutes right after launch."

| Field | Control | Prefill | Validation | Notes |
|-------|---------|---------|-----------|-------|
| Helpdesk (`helpdesk`) | select: Gorgias / Tidio / Intercom / Email inbox / None yet (`OnboardingWizard.tsx:48-54`) | Gorgias | has default, always valid | drives which connect template renders on completion + setup signal `setup.ts:111` |
| Presale tag (`presaleTags[]`) | text | empty | optional; blank = accept all (`ingest-route.ts:100`, INPUT 1 row 13) | "Which tag marks a presale ticket? Leave blank to accept all." **New field.** |

No URL/secret/JSON here — those need the created merchant and render on the completion screen (`ConnectPanel`, `ingest-templates.ts:45-97`). A one-line preview sets expectation: "After you launch we'll show you one rule to paste. No password, no app install."

### Step 5 — Review & launch
*Subhead:* "Everything we'll use to build your playbook. Edit anything, then launch."

Rebuild `ReviewPanel` (`OnboardingWizard.tsx:686-728`) as an **editable summary**: each group is a row with its values and an **Edit** link that jumps to that step (rail state preserved, sessionStorage intact). Rows: Brand (name, sign-off, banned, accent swatch, logo) · Timeline (window + stage count) · Gifts (N gifts, high-value threshold) · Connect (helpdesk, presale tag). Drop the dead rows the current panel shows (Voice, Tone, Preorder app — `OnboardingWizard.tsx:711-715`).

One proof-line above the button: "We'll generate your day 7, 30, 60, and 89 scripts from these answers. Each uses a confidence band, never a hard date." (mirrors `onboarding.ts:118-123` sample stages).

Primary button: `Launch Tideover` (terracotta, the one action). Disabled only if a gate fails (should never happen if steps gated correctly, but re-validate brand name + ≥3 gifts + `max≥min` before POST, jumping to the offending step on failure — as `submit()` already does for brand name `OnboardingWizard.tsx:147-151`).

---

## 4. Completion moment (what launches, what they see first)

On `Launch` → `POST /api/onboarding` (extended contract, §6) → server creates the `Merchant` + `Gift[]` records + previews. Then the completion screen (reuse `OnboardingWizard.tsx:198-249`), in this vertical order:

1. **The reward, first:** "Your playbook is live" + the four generated day-stage scripts (`result.previews`, `onboarding.ts:125-143`). This is the payoff both personas came for.
2. **Connect (do-this-next #1):** `ConnectPanel` with the per-merchant ingest URL + signing secret + copy-paste JSON for the vendor chosen in step 4 (`ConnectPanel.tsx:56-129`, artifacts from `ingest-templates.ts`).
3. **Import (do-this-next #2):** `ImportPanel` for the backer CSV (`ImportPanel.tsx:35-172`). Add UX-31 fixes here: an **expected-columns hint above the picker** and route the "unrecognized headers" case to the **terracotta warning** treatment instead of success styling (`ImportPanel.tsx:24-28,116-121`; `UX-AUDIT-HANDOFF.md:189`).
4. **Deferred, optional nudge (progressive disclosure):** a single collapsed "Not on Eastern time?" control writing `slaWindows` (`amStart/pmStart/tz`) — wrong tz = wrong breach flags (`sla.ts:89-94`), but it degrades to the ET default (`onboarding.ts:94`) so it must not gate launch. Baseline metrics (`baseline.*`, `onboarding.ts:95-101`) stay fully deferred to the cockpit — zeros just leave the baseline report empty and the WISMO forecast uncalibrated (`forecast.ts:107-109`), no user-visible break.
5. **Primary hand-off CTA:** change today's `See your cockpit` (`OnboardingWizard.tsx:243`) to **`Finish setup →` linking `/app/setup?merchant={id}`**. That page is the derived N-of-5 checklist (`app/app/setup/page.tsx`, `setup.ts:96-174`) and is the natural continuation: it will already show **Brand ✓** (logoText populated, `setup.ts:102`) and the remaining derived steps (import, helpdesk, first-reply, status-visible) as live "do this next" items reading real state. Keep the secondary `View a sample customer page` ghost link (`OnboardingWizard.tsx:244-246`) but source the token from a just-imported order if one exists, else the sample (`OnboardingWizard.tsx:115`).

Net: the wizard hands the merchant *into* the existing setup checklist rather than dead-ending on a success page. No fabricated "you're all set" — `/app/setup` computes truth from real data (`setup.ts:6-11`).

---

## 5. Error / edge states

- **POST fails** (`route.ts:30-35` 400, or network): keep 100% of form state (sessionStorage still holds it), show terracotta error, re-enable `Launch` (existing pattern `OnboardingWizard.tsx:190-194`). Never wipe.
- **Slug collision:** slug is derived from brand name with no uniqueness enforcement (`onboarding.ts:62`). Two merchants named the same collide. **Flag for build:** server should suffix/dedupe on create or return a 409 the wizard surfaces as "That brand name is taken." (Out of the pure-UI scope, but the redesign must not assume uniqueness.)
- **Gifts < 3:** inline block on step 3, Continue disabled, message names the reason.
- **`max < min` / stage `from > to`:** inline, Continue disabled (§3 step 2).
- **CSV, no email rows:** existing error (`ImportPanel.tsx:56-58`); unknown format → terracotta warning (UX-31).
- **Accent contrast:** none needed — `readableAccent` guarantees legibility (`color.ts:104`); show the live swatch so the merchant sees the result.
- **Refresh / accidental close mid-wizard:** sessionStorage restores state + step (UX-30).
- **Back on step 1:** disabled (`OnboardingWizard.tsx:327`).

---

## 6. Data-contract changes (API + repository seam)

The wizard change is inert without these. **The repository seam is a high-risk area (CLAUDE.md) — serialize these edits and verify each.**

1. **`GiftRepository` has no writer** — only `listByMerchant`/`findById` (`repositories/types.ts:80-83`). Add `createMany(gifts): Promise<Gift[]>` to the interface and implement in **both** drivers (`json/repositories.ts:158`, `mongo/repositories.ts:186`). This is the seam-critical change.
2. **Extend `IntakeData`** (`onboarding.ts:13-25`) + the Zod `Body` (`route.ts:16-28`) with: `gifts: Gift-input[]`, `ltvHigh: number`, `accentColor: string`, `logoText?: string`, `presaleTags: string[]`. **Drop** `voice`, `tone`, `preorderApp`, `worstStory` from the collected set (leave server defaults so old clients don't break, but the wizard stops sending them).
3. **`createMerchantFromIntake`** (`onboarding.ts:57-104`): write `brand.colors.primary = accentColor` (replace hardcode `:85`), `brand.logoText`, `presaleTags`, `ltvTiers.high = ltvHigh` (replace `:92`); create the gift records via `createMany` and set `giftCatalogIds` to their ids (replace `[]` `:93`).
4. Leave `slaWindows`/`baseline` as server defaults (`onboarding.ts:94-101`); the completion-screen tz control (optional) patches `slaWindows` via the existing merchant-update path.

---

## 7. Copy-integrity fixes (ship with this)

- `setup.ts:128` — "Every reassurance draft is written in this voice." **False** under the deterministic drafter. Rewrite: "Your sign-off and banned-word rules, captured in onboarding."
- `OnboardingWizard.tsx:504` "these shape the reassurance copy" — removed with the tone chips.

---

## 8. Mobile behavior

- **Rail collapses** to a top strip: `Step 2 of 5 · Your timeline` + a 5-segment progress bar (reuse the segmented-bar pattern from `app/app/setup/page.tsx:103-111`). No vertical rail on `<768px`.
- **Single-column card**, full-width `<Field>` inputs (already fluid, `Field.tsx:7`).
- **Sticky footer** pinned to viewport bottom with safe-area padding; Back/Continue stay reachable one-thumb.
- **Gift repeater** rows stack vertically; money/number inputs get `inputmode="numeric"`. Timeline stage rows stack (label full-width, day-from/day-to on one line) — the current flex-wrap already degrades acceptably (`OnboardingWizard.tsx:416-442`).
- Color picker falls back to native `<input type="color">` (mobile-native UI) + hex text field.

---

## 9. Implementation plan (components + effort)

**New components**
- `ProgressRail.tsx` — vertical named rail, clickable done-steps, teal markers (generalizes `Stepper`). **S**
- `GiftRepeater.tsx` — seeded rows, add/remove with ≥3 floor, per-row validation. **M**
- `AccentField.tsx` — color input + hex + live swatch (uses `readableAccent`). **S**

**Changed**
- `OnboardingWizard.tsx` — full rewrite to boxed frame + rail + sticky footer + sessionStorage; drop `fast`/`full` dual mode; drop dead fields; wire new steps. Not on the serialization-locked hot-file list (that's inbox/DraftRail/ApprovalBar/app page/reassurance.ts, CLAUDE.md) — safe to rewrite in one pass. **L**
- `route.ts` + `onboarding.ts` — extended contract + gift/accent/logo/presaleTags/ltvHigh wiring. **M** (high-risk: touches merchant creation)
- `GiftRepository` interface + json + mongo drivers — `createMany`. **M** (high-risk: repository seam, serialize + verify)
- `TimelineEditor` — UX-32 inline validation + footer gating. **S**
- `ImportPanel` — UX-31 expected-columns hint + warning treatment. **S**
- `setup.ts:128` + completion screen (SLA tz nudge, CTA → `/app/setup`). **S**

**Per-step build effort:** Step 1 **S** · Step 2 **S** (mostly reuse) · Step 3 **M** (new repeater + seam) · Step 4 **S** · Step 5 **M** (editable summary + jump-to-edit) · Frame/rail/sessionStorage **M**.

**Verification gate (CLAUDE.md / CONTRIBUTING):** `cd tideover && npm run verify && npm test` must stay green — the gift-catalog + intake changes touch engine-adjacent config, so the eval harness (52,440 invariants + 55 goldens) and proof-lint must pass before this ships.

**Sequence:** repository `createMany` first (isolated, verify) → API/`onboarding.ts` contract (verify previews still generate) → wizard UI rewrite last (depends on both). Serialize the two backend edits; the UI is a single non-shared file.