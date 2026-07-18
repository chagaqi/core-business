I have everything I need. Here is the build-ready spec.

---

# Feature spec — "Gifts Available" panel + required gift onboarding, unlocked by risk band

Board id: **UX-86** (`docs/UX-AUDIT-HANDOFF.md:129-136`). Depends on / preserves **UX-05** (`docs/UX-AUDIT-HANDOFF.md:89-93`).

## 0. Ground truth (what the code actually does today)

- **`Gift` shape** (`tideover/lib/types.ts:259-271`): `{ id, merchantId, name, kind: GiftKind, costCents, perceivedValueCents, eligibility: { minLtvCents, minWaitDays, minRiskScore } }`. `GiftKind` = `"early-access" | "founder-note" | "priority-dispatch" | "digital-perk" | "next-order-credit"` (`types.ts:40-45`).
- **Gifts are a separate collection**, linked two ways: each gift carries `merchantId`, and the merchant carries `giftCatalogIds: string[]` (`types.ts:98`). Both drivers only implement **read**: `GiftRepository` = `listByMerchant` + `findById` (`lib/repositories/types.ts:80-82`; json `repositories.ts:158-163`; mongo `repositories.ts:186-191`). **There is no `create`/`update` for gifts anywhere.**
- **The recommend engine** `recommendGift` (`lib/engines/gift.ts:28-79`) gates on: `highValue = ltvCents >= merchant.ltvTiers.high` **AND** (`deepWait = daysInWait >= 45` **OR** `elevatedRisk = riskScore >= 60`), then filters the catalog by all three numeric `eligibility` thresholds, then ROI-ranks and returns **one** best gift (or `null`).
- **Real risk bands** (`lib/engines/refund-risk.ts:24-101`): `RiskBandKey = "at_risk" | "watch" | "standard"` (`types.ts:36`). Thresholds `atRisk: 75, watch: 50` → **standard** = score < 50 (green), **watch** = 50–74 (amber), **at_risk** = ≥75 (red). **"Escalated" is NOT a band** — it is a sentiment flag: `escalated = sentiment === "hostile" || sentiment === "chargeback-threat"` (`refund-risk.ts:104`, mirrored in `app/app/inbox/page.tsx:41-43`), driving `priorityRank` and `DraftReply.priority`.
- **Onboarding creates merchants with an EMPTY catalog**: `createMerchantFromIntake` sets `giftCatalogIds: []` (`lib/onboarding.ts:93`) and never creates gift records. **So every real (non-seed) merchant has zero gifts today** — this feature is what fixes that.
- **`ltvTiers`** = `{ standard: 0, high: 50000, vip: 200000 }` for new merchants (`onboarding.ts:92`); seed merchants vary (`merchants.json:111-115` high=50000; `:246-250` high=60000).
- **Inbox panel today**: right rail renders one `GiftSuggestion` from `view.intel.gift` (single rec) — `inbox/page.tsx:270-277`, component `components/product/GiftSuggestion.tsx`. Sends on a **single** click (`GiftSuggestion.tsx:101` → POST `/api/gift-send`). **`app/app/inbox/page.tsx` is a hot-serialization file (CLAUDE.md).**
- **`/api/gift-send`** (`app/api/gift-send/route.ts:12-24`) sends **any** gift id against any ticket with **no eligibility/authorization check**, and only writes a `gift-sent:<kind>` tag. No cost/budget is recorded; **there is no budget field on `Merchant`**.
- **Eval harness coverage of gifts**: invariants re-derive the exact gate and assert *gift recommended IFF gate passes AND a catalog gift is eligible*, both directions (`evals/invariants.mjs:194-213`); goldens snapshot **only `gift.gift.id`** per fixture (`evals/golden.mjs:58,66`; `gen-goldens.mjs:85`; 55 rows in `evals/golden/goldens.json`). Harness = 52,440 invariants + 55 goldens (CLAUDE.md).

---

## 1. Schema

Extend the existing gift shape rather than replace it, so the engine's eligibility filter (`gift.ts:45-50`) and the invariant re-derivation (`invariants.mjs:200-205`) keep their **structure** frozen (the engine is a high-risk area under ADR-0006 — freeze its logic, only migrate its data).

### 1.1 New enum + field on `Gift` (`lib/types.ts`)

```ts
// add near GiftKind (types.ts:40)
export type GiftTier = "base" | "mid" | "full";

// extend Gift (types.ts:259-271) — add one field, keep eligibility:
export interface Gift {
  id: string;
  merchantId: string;
  name: string;
  kind: GiftKind;
  tier: GiftTier;                 // NEW — merchant-facing unlock lever
  costCents: number;
  perceivedValueCents: number;
  eligibility: {                  // kept — engine still reads these
    minLtvCents: number;
    minWaitDays: number;
    minRiskScore: number;
  };
}
```

`tier` is the single lever the merchant configures. `eligibility.minRiskScore` is **derived from `tier`** so the two can never disagree (this is what lets the panel's "unlocked" state equal the engine's "eligible" state with zero drift):

```ts
// lib/engines/gift.ts — new exported constants + helper
export const TIER_MIN_RISK: Record<GiftTier, number> = { base: 0, mid: 50, full: 75 };
// derived at config/seed time, NOT at request time:
// eligibility.minRiskScore = TIER_MIN_RISK[tier]
```

`minLtvCents` comes from a chosen LTV tier (`base` gifts → `ltvTiers.standard` = 0; `mid`/`full` → merchant's `ltvTiers.high`), `minWaitDays` from a per-tier default (`base:7, mid:30, full:45`). These are the derivation defaults; the onboarding UI exposes tier + optional overrides (§3).

### 1.2 Where it lives on the merchant record

Unchanged topology: gifts stay their own collection keyed by `merchantId`; merchant keeps `giftCatalogIds`. No new merchant field is required for the catalog itself. (A `goodwillBudgetCents` merchant field is a **separate open question** — see Q1.)

### 1.3 Seed migration — `scripts/gen-seed.mjs` + data + `seed-check.mjs`

- **`gen-seed.mjs:220-243`** — add `tier` to each of the 5 `giftKinds` and derive `minRisk` from it (single source = tier):

  | kind | tier | derived minRiskScore |
  |---|---|---|
  | early-access | base | 0 |
  | digital-perk | base | 0 |
  | founder-note | mid | 50 |
  | priority-dispatch | mid | 50 |
  | next-order-credit | **full** | **75** |

  Emit `tier` into each gift object (`gen-seed.mjs:233-241`) and set `eligibility.minRiskScore = TIER_MIN_RISK[tier]`.
- **`lib/data/gifts.json`** regenerates from the script (10 rows, 5 per demo merchant).
- **`scripts/seed-check.mjs`** — add to the gift loop (`seed-check.mjs:66`): assert `g.tier ∈ {base,mid,full}`; assert `g.eligibility.minRiskScore === TIER_MIN_RISK[g.tier]`; assert `costCents >= 0`, `perceivedValueCents >= 0`. Add a **per-merchant `>= 3` gifts** check alongside the `giftCatalogIds` FK loop (`seed-check.mjs:79`) so the seed itself honors the onboarding rule.
- **Eval blast radius (must call out in the PR):** re-tiering the seed changes `next-order-credit` from `minRiskScore 65 → 75` and both `mid` gifts from `50/60 → 50`. `priority-dispatch` 60→50 and `next-order-credit` 65→75 **will change which gift is recommended for some fixtures**, so the **55 goldens regenerate** (`npm run` gen-goldens equivalent) and must be committed in the same change. The 52,440 invariants stay structurally valid because `invariants.mjs:200-205` reads `eligibility.*` (now derived) — but **regenerate + re-run `npm run verify` and confirm green** before commit. See §5 for the low-churn alternative (Q7).

---

## 2. The unlock matrix (real band values)

Panel unlock is driven by the customer's **risk band** (`refund-risk.ts` output) with sentiment escalation as an override, exactly matching the derived numeric thresholds so display == sendability:

| Customer state | riskScore | Unlocked tiers |
|---|---|---|
| **standard** (green) | < 50 | `base` |
| **watch** (amber) | 50–74 | `base` + `mid` |
| **at_risk** (red) | ≥ 75 | `base` + `mid` + `full` |
| **escalated** (hostile / chargeback-threat), any score | — | `base` + `mid` + `full` (override → full catalog) |

Secondary gates still apply (they come from the engine's existing filter): a `mid`/`full` gift also requires `ltvCents >= minLtvCents` and `daysInWait >= minWaitDays`. The panel therefore reports **the binding constraint** in this priority order for its lock label: risk band first (the feature's mental model — "Unlocks at high risk"), then LTV ("Unlocks for high-LTV customers"), then wait ("Unlocks after 45 days waiting").

New pure function, colocated with the engine and unit-tested (does **not** touch `recommendGift`):

```ts
// lib/engines/gift.ts
export interface GiftAvailabilityRow {
  gift: Gift;
  unlocked: boolean;
  unlockReason: string | null;   // null when unlocked; else e.g. "Unlocks at high risk"
  tierLabel: string;             // "Available now" | "Unlocks at watch" | "Unlocks at high risk"
}

export function giftAvailability(input: {
  catalog: Gift[];
  ltvCents: number;
  daysInWait: number;
  riskScore: number;
  escalated: boolean;
}): GiftAvailabilityRow[];
```

`unlocked` = all three numeric eligibility thresholds pass, with `escalated` forcing the risk-band check to satisfy `full`. Sort rows: unlocked first, then by `tier` (base→full), then perceived value desc. **Monotonicity guarantee** (worth a new invariant): a higher band's unlocked set ⊇ a lower band's.

---

## 3. Onboarding step

### 3.1 UI (`app/onboarding/OnboardingWizard.tsx`)

Add a **"Goodwill gifts"** step. In `FULL_STEPS` (`OnboardingWizard.tsx:65`) insert after "Support reality" → `["Brand & voice","Current tools","Real timeline","Support reality","Goodwill gifts","Review & generate"]`; in `FAST_STEPS` (`:66`) insert before Review → `["Essentials","Timeline","Goodwill gifts","Review & generate"]`. Add `gifts` state + a `GiftCatalogEditor` sub-component modeled on the existing `TimelineEditor` (`OnboardingWizard.tsx:371-457`).

- **Prefill** the 5-gift suggested catalog (the seed's `giftKinds` list, `gen-seed.mjs:221-227`) with tiers from §1.3 — merchant edits/removes/adds rows.
- Per row: name (text), kind (select over `GiftKind`), **tier** (select `Base / Mid-tier / Full-catalog` with a one-line helper: "Base = every waiting customer · Mid = watch-risk & up · Full = high-risk / escalated"), cost `$`, perceived value `$`. Numeric eligibility is **derived from tier + LTV tier**, not shown as raw fields.
- Add the derived-unlock caption per row ("Unlocks at high risk") so the merchant sees the ladder they're building.
- `ReviewPanel` (`:686-728`) gains a "Gifts" row summarizing count + tier spread.

### 3.2 Validation (client `next()`/`submit()` + server zod)

Hard gate — onboarding **cannot advance past / submit** the gift step unless:
- **≥ 3 gifts** (mirrors UX-86 "cannot complete with fewer than 3").
- Each gift: non-empty name; `costCents >= 0`; `perceivedValueCents >= 0`; `costCents <= COST_CAP` (recommend **$500 / 50000 cents**, Q3); soft-warn (not block) when `perceivedValueCents < costCents` (ROI < 1).
- **Recommend** requiring ≥1 `base` gift so standard-band customers always have something (Q4).

Client: extend `next()` (`OnboardingWizard.tsx:125-133`) with a `step === giftStep` branch and `submit()` (`:146`) pre-check. Server: `/api/onboarding` zod `Body` (`app/api/onboarding/route.ts:16-28`) gains `gifts: z.array(GiftConfig).min(3)` where `GiftConfig = { name: z.string().min(1), kind: GiftKind enum, tier: GiftTier enum, costCents: z.number().int().min(0).max(COST_CAP), perceivedValueCents: z.number().int().min(0) }`.

---

## 4. Ticket-detail panel

Replace the single `GiftSuggestion` card in the inbox right rail (`inbox/page.tsx:270-277` — **hot file, serialize per CLAUDE.md**) with a **"Gifts available"** panel. Extend the existing component `components/product/GiftSuggestion.tsx` (its recommended-gift block becomes the top "Recommended" row; the catalog list becomes the available/locked list).

- **Data**: thread `giftAvailability(...)` output into the view. Cleanest seam: compute it inside `computeTicketIntelligence` (`lib/engines/index.ts:40-78`) and add `availability: GiftAvailabilityRow[]` to `GiftResult`/`TicketIntelligence`. This is **additive** — goldens read only `gift.gift.id` (`golden.mjs:58`), so the snapshot is unaffected by a new field. `escalated` = `escalatedSentiment(ticket.sentiment)` (reuse `inbox/page.tsx:41-43`).
- **Render**: keep the engine's single recommendation as the highlighted "Recommended" row (existing stats: cost / perceived / ROI). Below it, list the rest of the catalog:
  - **Unlocked** gifts → active, with the confirm-to-send control.
  - **Locked** gifts → visibly locked (lock glyph, muted), showing `unlockReason` ("Unlocks at high risk", "Unlocks for high-LTV customers", "Unlocks after 45 days waiting") so reps learn the ladder without a manual.
- **One-click send keeps UX-05**: two-step inline confirm — first click flips the button to `Send this gift? [Confirm] [Cancel]`; only Confirm POSTs to `/api/gift-send`. One caption line: *"Comes from your goodwill budget — you're authorized to send this."* No modal. Preserve current success behavior (`GiftSuggestion.tsx:96-104`: "Gift logged" state + `router.refresh()`), wrapped in `role="status" aria-live="polite"` to pair with UX-03. Anti-slop the copy (`gtm-assets/copy-standard.md`).
- **Server authorization (new, closes a real hole)**: `/api/gift-send` (`route.ts:12-24`) currently trusts any gift id. It must re-resolve the ticket's customer/order, recompute `giftAvailability`, and **reject a locked gift with 403** before writing the tag. Otherwise the panel's lock is cosmetic and a stale/hand-crafted request can spend a comp the rep isn't authorized for. (Q1: whether it also debits a real budget.)

---

## 5. API / repo / test / eval / ADR

### 5.1 Repository seam (both drivers)

`GiftRepository` (`lib/repositories/types.ts:80-82`) gains write methods:
```ts
create(gift: Gift): Promise<Gift>;
createMany(gifts: Gift[]): Promise<Gift[]>;   // onboarding writes the whole catalog atomically-ish
```
- **json** (`lib/repositories/json/repositories.ts:158-163`): push to `store.gifts`, persist via the same store-write path the other collections use.
- **mongo** (`lib/repositories/mongo/repositories.ts:186-191`): `insertOne` / `insertMany` into the `gifts` collection.

### 5.2 Onboarding write path

`IntakeData` (`lib/onboarding.ts:13-25`) gains `gifts: GiftConfig[]`. `createMerchantFromIntake` (`onboarding.ts:57-146`): after `repos.merchants.create`, build `Gift[]` (mint `gft_` ids via `newId`, set `merchantId`, `tier`, derive `eligibility` from tier+LTV), call `repos.gifts.createMany`, and set `merchant.giftCatalogIds` to those ids (replaces the `[]` at `onboarding.ts:93`). `/api/onboarding` passes `parsed.data.gifts` through.

### 5.3 Unit tests (add to `lib/engines/__tests__/engines.test.ts` + a repo/onboarding test)

- `giftAvailability`: each band → exact unlocked tier set; escalation override at low score; LTV-bound and wait-bound lock reasons; empty catalog → `[]`.
- `TIER_MIN_RISK` derivation + tier→eligibility mapping.
- Onboarding gift validation: `<3` rejected; cost/perceived bounds; ROI<1 warns not blocks.
- `/api/gift-send` authorization: locked gift → 403; unlocked → 200 + tag.
- Repo `create`/`createMany` on the json driver; mongo behind the existing `mongo-smoke.mjs` pattern.

### 5.4 Eval harness

- **`recommendGift` logic is untouched** → the engine stays inside ADR-0006. The change is (a) seed **data** re-tiering and (b) an **additive** `availability` field.
- **Goldens regenerate** because re-tiering shifts `minRiskScore` for `priority-dispatch` (60→50) and `next-order-credit` (65→75), changing the recommended gift on some fixtures. Regenerate the 55 goldens and commit them in the same change; re-run `cd tideover && npm run verify && npm test` green.
- **New invariant (recommended):** availability monotonicity — for a fixed customer/order, the unlocked set at a higher band ⊇ the set at a lower band; and every engine-recommended gift is `unlocked` in the panel (no "recommended-but-locked" drift).
- **Low-churn alternative (Q7):** keep the seed's existing numeric `eligibility` untouched and treat `tier` as a **derived view** (`tier = band(minRiskScore)`) used only for panel labels. Then goldens are **byte-stable** and nothing in the engine data moves — but the seed then has no `full`-tier gift (nothing ≥75), so the demo can't show a locked full-tier gift without adding a 6th seed gift, and tier stops being the merchant's canonical lever. I recommend the canonical version (regenerate goldens) and flag this trade for Dylan.

### 5.5 ADR (per `docs/adr/TEMPLATE.md`)

New **ADR-0017 — Merchant-configurable gift tiers + risk-band unlock**:
- **Context**: gift eligibility was fixed per-merchant seed data; onboarding shipped an empty catalog (`onboarding.ts:93`), so real merchants had no goodwill lever. Builds on ADR-0002 (repo seam / proof doctrine) and ADR-0006 (eval harness).
- **Decision** (numbered): (1) add `tier` to `Gift`, derive numeric eligibility from tier; (2) unlock matrix band→tier with escalation override; (3) onboarding required ≥3-gift step + repo write methods; (4) `availability` additive engine output + panel; (5) `/api/gift-send` server-side authorization. State that `recommendGift` logic is frozen and only seed data + goldens move, keeping ADR-0006 green.
- **Proof-only guardrails**: gifts are goodwill, never a fabricated delivery promise; the panel/authorization copy claims no metrics; demo merchants stay `isDemo`-watermarked; no hard dates introduced.
- **Consequences / Alternatives rejected** (tier-as-derived-view vs canonical; replacing numeric eligibility entirely) / **Kill-criteria** (reps ignore the panel or send locked gifts via API).

---

## Open questions for Dylan

1. **Goodwill budget — real or copy?** UX-05's authorization line says "comes from your goodwill budget," but there is **no budget field on `Merchant`** and `/api/gift-send` records no cost. Is the line copy-only for now, or do you want a real `goodwillBudgetCents` cap that `gift-send` debits and blocks against?
2. **Escalation override scope.** Should hostile/chargeback-threat sentiment unlock the **full** catalog **even when LTV/wait gates fail** (i.e. escalation bypasses the LTV and wait secondary gates, not just the risk band)? Recommended: yes for risk band, **keep** the LTV gate (don't hand a $25 credit to a $30 buyer). Confirm.
3. **Cost cap** for onboarding validation — I've defaulted to **$500 (50000 cents)** per gift. Good, higher, or none?
4. **Onboarding: require tier coverage?** Enforce ≥3 gifts only, or also require **≥1 `base`** gift (so standard-band customers always have something)? Recommended: require ≥1 base.
5. **Seed demo merchants** — keep 5 gifts each (re-tiered), or expand so all three tiers are visibly represented (adds a 6th `full` gift for a richer locked-gift demo)?
6. **Post-onboarding editing.** The gifts page (`app/app/gifts/page.tsx`) is read-only. Is editing the catalog after onboarding **in scope** (add write UI there), or defer? UX-86 only names onboarding + ticket view.
7. **Eval trade-off (§5.4).** Go **canonical** (tier drives numeric, regenerate 55 goldens — cleaner, better demo) or **low-churn** (tier as derived label, byte-stable goldens, weaker demo)? Recommended: canonical.
8. **`gift-send` authorization** — confirm you want the server to reject locked gifts (403). It closes a real hole but is a behavior change to a public-ish session route.