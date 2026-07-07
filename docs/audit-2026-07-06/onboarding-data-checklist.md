# Tideover Merchant-Onboarding Data Checklist — derived from what the product actually consumes

Evidence base: every row cites the file:line I opened. "Consumed by" = a real engine/surface that reads the datum. Deterministic drafter (the shipping default, `DeterministicDrafter.ts:11-25`) is the consumer that matters; the LLM path (`LlmDrafter.ts:25-30`) is an un-executed sketch, so anything only it would read is marked *not mechanically consumed*.

Day-0 tiers: **REQ** = product can't deliver core value without it · **REC** = cheap, high-trust, degrades silently if skipped · **DEFER** = progressive-disclosure, collect when the consuming feature is reached.

---

## A. Merchant-level data the product consumes

| # | Field | Consumed by (file:line) | In wizard today? | Tier | Question / UI to collect |
|---|-------|-------------------------|------------------|------|--------------------------|
| 1 | **Brand name** (`name`) | `reassurance.ts:93` (`{brand}`→`merchant.name`); `status.ts:99`; `social-signal.ts:48`; slug at `onboarding.ts:62` | Yes — `brandName`, hard gate `OnboardingWizard.tsx:113,128` | **REQ** | "What do your customers know you as?" — single text input, required. |
| 2 | **Fulfillment window min/max** (`fulfillmentWindowDays`) | confidence band via `computeTimeline` (`reassurance.ts:71,88-90` → `eta_band`); `import.ts:38-39` (`fulfillmentEnd`); risk `waitPressure` `refund-risk.ts:78` | Yes — `windowMin/windowMax`, `TimelineEditor` | **REQ** | Two number inputs "earliest / latest days from order". Label as a range, never a promise (`OnboardingWizard.tsx:389`). |
| 3 | **Production stages** (`stages[]`: key, label, `dayBand.from/to`, blurb) | `stage_blurb` in every draft (`reassurance.ts:96`, `status.ts:113`); risk `stageLag`/`stageCeilDay` (`refund-risk.ts:82,129`); timeline stages | Yes — `TimelineEditor`, prefilled 6 defaults (`OnboardingWizard.tsx:56-63`) | **REQ** (defaults OK, must fit) | Editable stage rows: label + day band + one-line blurb ("what's happening now"). Keep the 6 prefills. |
| 4 | **Helpdesk** (`helpdesk` Channel) | ingest path + `ConnectPanel`; setup signal `setup.ts:111` | Yes — select `OnboardingWizard.tsx:48-54` | **REQ** | Dropdown: Gorgias / Tidio / Intercom / Email inbox / None-yet. Drives which connect template renders. |
| 5 | **Banned words** (`brand.banned[]`) | `reassurance.ts:99` `stripBanned` on every draft | Yes — comma input | **REC** | "Words to keep out of every reply" — comma list. Empty = no-op. |
| 6 | **Sign-off** (`brand.signoff`) | appended to every draft `reassurance.ts:100`; `ReassuranceCard` via `status.ts:99`; `social-signal.ts:48` | Yes — text input | **REC** | "How you close a message." Defaults to `— {brandName}` if blank (`onboarding.ts:83`). |
| 7 | **Status-page accent** (`brand.colors.primary`) | `StatusView.tsx:28,42,66,68,74` (header, progress, band, tint); contrast-safe variant `readableAccent` `color.ts:104` | **No** — hardcoded `#0E5366` `onboarding.ts:85` | **REC** | Color picker → primary hex. System already contrast-corrects text use (`color.ts:104`), so any brand color is safe. **GAP today.** |
| 8 | **Logo mark / text** (`brand.logoText`) | status header initial + wordmark `StatusView.tsx:46-48`; brand-configured signal `setup.ts:102` | **No** — auto = brandName `onboarding.ts:84` | DEFER | Optional override; default to brand name. (Header renders first letter as the mark.) |
| 9 | **SLA support windows** (`slaWindows.amStart/pmStart/tz`) | SLA timers/targets in cockpit `sla.ts:35-42,177-207`; tz drives DST-correct math `sla.ts:89-94` | **No** — hardcoded `9:00/15:00/ET` `onboarding.ts:94` | **REC** (REQ if non-ET) | Two time inputs + timezone select. Wrong tz = wrong SLA/breach flags. **GAP today.** |
| 10 | **Gift catalog** (`Gift[]` + `giftCatalogIds`) | gift engine `gift.ts:31,45-49,57-63` | **No** — set to `[]` `onboarding.ts:93` → engine can never recommend | **REQ** (founder call 2026-07-06, ≥3) | Dedicated repeater — see §C. **GAP today.** |
| 11 | **LTV high-tier threshold** (`ltvTiers.high`) | gift gate `highTierCents` `engines/index.ts:73` → `gift.ts:31` | **No** — hardcoded `{0,50000,200000}` `onboarding.ts:92` | DEFER | Expose next to gift catalog: "A customer counts as high-value above $___." |
| 12 | **Baseline metrics** (`baseline.*`) | baseline report `baseline.ts:74-108`; `wismoPer100Orders` calibrates WISMO forecast `forecast.ts:107-109` | **No** — all zeroed `onboarding.ts:95-101` | DEFER | 4 optional numbers: median first-response, WISMO/100 orders, tickets/week, repeat-WISMO %. Zeros = empty baseline + uncalibrated forecast (shows count only). |
| 13 | **Presale tag filter** (`presaleTags[]`) | ingest drop-at-edge `ingest-route.ts:100`; setup signal `setup.ts:111` | **No** | DEFER (in connect step) | On the helpdesk-connect screen: "Which tag marks a presale ticket?" (default = accept all). |
| 14 | **Preorder/crowdfunding app** (`preorderApp`) | **Nothing** — stored `onboarding.ts:88`, never read downstream | Yes — text input | **CUT** (see §E) | — |
| 15 | **Voice** (`brand.voice`) | *Not mechanically consumed* — only LLM sketch `LlmDrafter.ts:27` | Yes — textarea | DEFER | Keep as raw material for hand-tuning playbook / future LLM; not wired to deterministic drafts. |
| 16 | **Tone chips** (`brand.tone[]`) | *Not mechanically consumed* — deterministic engine ignores; LLM sketch only | Yes — chips | DEFER | Same as voice. Displayed in review only (`OnboardingWizard.tsx:712`). |
| 17 | **Playbook templates** (`playbook`) | core of every draft `reassurance.ts:74-75` | **No** — generated from name+signoff `onboarding.ts:36-55`, shown as read-only previews | DEFER (hot file) | Wizard shows generated day-7/30/60/89 previews for review; edits happen later in cockpit (`reassurance.ts` is a serialization-locked hot file). |
| — | `inboxToken`, `slug`, `isDemo`, `createdAt` | minted/derived server-side `onboarding.ts:62,78,74,102` | n/a | AUTO | Not asked. |

---

## B. Backer CSV import — order-level data the product consumes

Import lives on the success screen (`ImportPanel`), parsed **client-side** (`csv.ts`), only `MappedRow[]` is POSTed. **Day-0 REQ**: at least one order must exist (`setup.ts:105`).

| Datum → field | Consumed by (file:line) | CSV columns detected | Tier |
|---------------|-------------------------|----------------------|------|
| Email → `Customer.email` | dedupe key `import.ts:61`; evidence pack `evidence.ts:240` | email / email address / backer email `csv.ts:124,142` | **REQ** (row skipped without it `import.ts:53-57`) |
| Name → `Customer.firstName` | greeting on every draft + status page `reassurance.ts` / `StatusView.tsx:56` | backer name / first name / name `csv.ts:123,139` | **REQ** |
| Pledge amount → `orderValueCents` / `ltvCents` | risk `valueExposure` `refund-risk.ts:77`; gift high-value gate `gift.ts:31`; evidence | pledge amount / order total / total `csv.ts:127,143` | REC (floors to $50 `csv.ts:49`) |
| Reward tier → `Order.group` | status label `StatusView.tsx:13-17`; reassurance tuning | reward title / pledge level / tier `csv.ts:125,141` | DEFER (defaults `ks-backer` `import.ts:98`) |
| Estimated delivery → `disclosedEta.value` | **chargeback evidence window** `evidence.ts:91-126,248-253` (Visa 13.1 clock) | estimated delivery / est. ship date `csv.ts:128,144` | DEFER but high-value — captured only if column present `import.ts:113` |
| Backer/order id → `importKey` | re-import dedupe `import.ts:79-92` | backer number / order id / order number `csv.ts:135,145` | REC (prevents double-import dupes) |

**Note — order defaults the merchant can't yet set at import:** `productionStage` hardcodes `"production"` (`import.ts:105`), `region` hardcodes `"US"` (`import.ts:106`). Consumed by reassurance/risk/status but not collectable — flag for the redesign if per-wave staging matters.

---

## C. Gift catalog spec (founder decision 2026-07-06 — **≥3 gifts REQUIRED**)

Gift shape (`types.ts:259-271`), consumed by `gift.ts`. Currently the wizard collects **none** (`onboarding.ts:93` sets `giftCatalogIds: []`), so the gift engine is dead on every onboarded merchant. Add a repeater collecting, per gift:

| Gift field | Consumed by (file:line) | UI to collect |
|-----------|-------------------------|---------------|
| `name` | shown in cockpit recommendation `gift.ts:74` | Text — "Gift name" (e.g. "Handwritten founder note") |
| `kind` (enum: early-access / founder-note / priority-dispatch / digital-perk / next-order-credit) | `types.ts:40-45` | Select from the 5 kinds |
| `costCents` | ROI ranking, `cost=0`→ROI∞ `gift.ts:57` | Money — "What it costs you" (0 allowed) |
| `perceivedValueCents` | primary ranking key `gift.ts:59-60` | Money — "What it's worth to the customer" |
| `eligibility.minLtvCents` | filter `gift.ts:47` | Money — "Only for customers above $___ LTV" (0 = any) |
| `eligibility.minWaitDays` | filter `gift.ts:48` | Number — "Only after ___ days waiting" |
| `eligibility.minRiskScore` | filter `gift.ts:49` | Number 0-100 — "Only at risk score ≥ ___" |

Seed the repeater with the 5 proven defaults from `gifts.json` (early-access $0/val$40, founder-note $5/val$30, priority-dispatch $12/val$60, digital-perk $0/val$20, $25 credit) so the merchant edits rather than authors from scratch. Engine only fires for high-value + (deep-wait OR elevated-risk) customers (`gift.ts:31-35`), so ≥3 spanning tiers is the practical minimum.

---

## D. Data the product needs but the wizard never collects (GAPS to add)

1. **Gift catalog** (§C) — REQ, blocks the entire gift engine.
2. **Status-page accent + logo** (rows 7-8) — every real merchant ships with Tideover's teal.
3. **SLA windows + timezone** (row 9) — every merchant gets ET 9-3; non-ET merchants get wrong breach flags.
4. **Baseline metrics** (row 12) — zeros leave the baseline report empty and the WISMO forecast uncalibrated.
5. **Order-number (UX-26)** — `StatusView.tsx:59` shows the raw internal id `ord_…` as the customer's "Order" tag. **No `merchantOrderRef` field exists on `Order`.** Add a field captured on ingest (Shopify order name / KS backer #), or drop the Tag — never show internal ids. Handoff: `docs/UX-AUDIT-HANDOFF.md:194`.
6. **LTV high-tier threshold** (row 11) — pair with gift catalog.
7. **Presale tag** (row 13) — belongs in the helpdesk-connect step.

---

## E. Wizard collects it, **nothing consumes it** (CUT candidates)

| Field | Evidence it's a dead-end |
|-------|--------------------------|
| **`worstStory`** ("the message that scares you most") | Collected `OnboardingWizard.tsx:178` → POSTed → parsed `route.ts:27` → typed on `IntakeData` `onboarding.ts:24` → **never read** by `createMerchantFromIntake`. Pure discard. Either wire it (e.g. pressure-test preview against it) or cut. |
| **`preorderApp`** | Stored on merchant `onboarding.ts:88` / `types.ts:93`; **no engine or surface reads it.** Write-only. Cut or repurpose as the `disclosedEta` source hint. |
| **`voice`** | Stored `onboarding.ts:80`; only the un-executed LLM sketch `LlmDrafter.ts:27` would use it. Keep only if positioned as hand-tuning input, not "shapes your replies." |
| **`tone[]`** | Stored `onboarding.ts:81`; deterministic engine ignores it; review-panel display only. Same call as voice. |

**Copy-integrity flag:** the wizard tells merchants tone/voice "shape the reassurance copy" (`OnboardingWizard.tsx:504`) and "Every reassurance draft is written in this voice" (`setup.ts:128`). With the deterministic default that is **not true** — the playbook is templated from brand name + sign-off only. Fix the copy or wire the fields.

---

## F. Day-0 vs defer — the redesigned flow at a glance

**Screen 1 — Essentials (REQ, hard-gate on brand name):** brand name · fulfillment window min/max · production stages (prefilled) · helpdesk choice.
**Screen 2 — Voice & trust (REC):** banned words · sign-off · status-page accent + logo. *(Voice/tone here only if kept and honestly labeled.)*
**Screen 3 — Goodwill gifts (REQ ≥3):** the §C repeater seeded with 5 defaults + high-tier $ threshold.
**Screen 4 — Connect & import:** helpdesk webhook/forwarding (`ingest-templates.ts:45-97`) + presale tag + backer CSV.
**Success / defer-until-needed:** review generated day-7/30/60/89 previews (edit later in cockpit) · SLA windows+tz · baseline metrics.
**Do not collect until a consuming feature ships:** escalation contact, refund-policy stance, notification prefs — **no field consumes any of these today** (`grep` clean across `lib/`; email is explicitly "future, not active in pilot" `security-content.ts:108`). Add them only alongside the routing/notification feature that reads them, or they become new §E dead-ends.