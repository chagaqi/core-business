# Tideover — Onboarding Redesign + Gift Feature + Service Tiers

**Date:** 2026-07-06 · **Author:** Fable (synthesis of a forensic onboarding audit + 4 design specs, each adversarially critiqued)
**This doc is the entry point.** The full build-ready specs live beside it and are the source of truth for implementation detail:
- `docs/audit-2026-07-06/spec-onboarding-wizard.md` — the 5-step boxed wizard (build-ready, per-step, per-field)
- `docs/audit-2026-07-06/onboarding-data-checklist.md` — every datum the product actually consumes
- `docs/audit-2026-07-06/spec-gift-feature.md` — UX-86 deepened (schema, unlock matrix, ADR outline)
- `docs/audit-2026-07-06/spec-onboarding-tiers.md` — the service-tier packaging matrix
- `docs/audit-2026-07-06/critique-*.md` — the adversarial review of each (the blockers below come from these)
- `docs/audit-2026-07-06/onboarding-findings.json` — 7 forensic findings on the current wizard

**Read the critiques before building.** Each spec is strong but each has 2–5 real blockers the critique caught; those are folded in below. Do not implement a spec without its critique open.

---

## The one thing to understand first: the current wizard *lies*, and half of what it collects is dead

The forensic audit (OB-findings) found the current wizard asks for five things **no engine ever reads**:
- **Voice** (free-text) and **Tone** (chips) — the deterministic drafter never reads them (`reassurance.ts:92-100`); only the un-wired LLM sketch would. Yet the wizard says tone "shapes the reassurance copy" and the setup checklist says "Every reassurance draft is written in this voice." **Both are false** — a merchant-verifiable proof-only violation (OB-02, OB-03, critique-checklist #6).
- **`worstStory`** (the "scariest message") — collected, validated, then **dropped on submit** (never persisted). The tier plan wanted to build Growth's voice-calibration on it; it's vapor (OB-02, critique-tiers B1).
- **`preorderApp`** and **`fulfillmentWindowDays.min`** — asked, never read (OB-05).
- **Helpdesk choice** — stored once, never re-read; the setup screen ignores it (OB-04).

**So the redesign isn't just cosmetic ("glorified Google form" → "5 steps in a box").** It's: ask *only what the product consumes*, stop lying about voice, and turn required steps into *confirmation* (everything pre-filled) so a rushed founder finishes in ≤15 min. That's the whole design thesis of the wizard spec, and it's correct.

---

## Part 1 — The 5-step wizard (spec-onboarding-wizard.md)

**Shape:** one guided flow (no fast/full mode toggle), a fixed card on sand with a **named vertical progress rail**, sticky footer, sessionStorage persistence (fixes UX-30 — refresh currently wipes everything). Steps: **1 Your brand · 2 Your timeline · 3 Goodwill gifts · 4 Connect · 5 Review & launch.** Import + the webhook URL/secret move to the *completion screen* (they need the server-minted merchantId). The reward — the four generated day-stage scripts — shows the instant they launch, before any CSV homework.

**Critique blockers to fold in (critique-wizard.md) — these ship broken if ignored:**
- **B1 · Connect templates only exist for Gorgias.** The picker offers Gorgias/Tidio/Intercom/Email/None but the API only generates Gorgias+Zendesk templates and `ConnectPanel` ignores the choice. → **Decision D-HELP below.** Until decided, wire only Gorgias + email-forwarding; label the rest "connect after launch."
- **B2 · Email-inbox path must survive.** For `helpdesk:"email"` the setup artifact is the forwarding address, not the webhook panel — the completion screen must branch on helpdesk choice and keep the forwarding block, or email merchants lose their instructions.
- **B3 · Don't let a typed presale tag fake "Helpdesk connected."** `setup.ts:110` flips the checklist to done on `presaleTags.length>0`. If the wizard persists a tag, the merchant sees "connected ✓" before connecting anything. → **Decision D-TAG below.**
- **B4 · Keep `logoText` auto-populated from brand name.** The "Brand ✓" setup signal derives from it; making it optional/blank breaks the checklist the completion screen hands into. Default logoText→brandName when blank.
- **Copy-integrity sweep (must-fix, proof-only):** fix every "in your voice" claim, not just the two the spec named — completion headline `OnboardingWizard.tsx:209`, setup item `setup.ts:126`, the JSDoc/intro. (critique-wizard I5.)
- **I4 · Preview the `readableAccent`-adjusted color**, not the raw pick, or the swatch lies about the rendered result.

**Effort:** L (full rewrite of `OnboardingWizard.tsx` — not a hot file, safe single-pass) + M for the API/`onboarding.ts` contract + M for the repository-seam `GiftRepository.createMany` (high-risk — its own verified PR first). Sequence: repo write methods → onboarding contract → UI rewrite. Full per-step/per-field detail in the spec.

---

## Part 2 — The gift feature, UX-86 (spec-gift-feature.md) — **needs a product decision before build**

**The feature as you described it** (≥3 gifts required in onboarding; a "Gifts available" panel in the ticket view; higher risk unlocks higher-value gifts) is fully specced: a `tier` field on Gift (`base`/`mid`/`full`), an unlock matrix mapped to the **real** risk bands (standard <50 → base; watch 50–74 → +mid; at_risk ≥75 or escalated → full), a `giftAvailability()` pure function so the panel's "unlocked" exactly equals the engine's "eligible," server-side authorization on `/api/gift-send` (which today trusts any gift id — a real hole), and the ADR outline.

**But the critiques (critique-gifts.md, critique-checklist.md) caught a product problem underneath it that is yours to decide, not the implementer's:**

> **The gift engine will rarely fire for a real crowdfunding merchant's backers.** The engine only offers a gift when `LTV ≥ $500` AND (wait ≥ 45 days OR risk ≥ 60). But imported KS/BackerKit backers get `ltvCents` = their pledge amount, and typical pledges are **$25–$100** — they **never clear the $500 gate.** So a merchant can dutifully author 3+ gifts and see them almost never appear. Worse, tying gift tiers to LTV (as the spec's first draft did) locks the *cheapest, most emotional* gift — a $5 handwritten founder note — behind the *high-LTV* gate, which is backwards for goodwill.

This isn't a bug to fix silently — it's a **product-shape decision (D-GIFT below).** The mechanics are ready either way; I need your intent.

**Build-staging (once decided) — critique-gifts I4, 4 verified-green PRs:** (a) schema + seed re-tier + golden regen; (b) repo write methods + onboarding write path; (c) the panel; (d) the `/api/gift-send` 403 authorization (ship this one *first* — it's an independent security fix). The panel touches the hot inbox file — serialize. Full schema/matrix/test/ADR detail in the spec; **8 open sub-questions** are listed at its end (I've pulled the load-bearing ones into "Decisions" below; the rest have my recommended defaults in the spec).

---

## Part 3 — Service tiers (spec-onboarding-tiers.md) — answers "what happens at higher-ticket vs lower"

**The answer:** the *product* onboarding is the same self-serve wizard for everyone. What scales with price is **how many setup steps Dylan does for you, how much live calibration you get, and how fast he answers** — all proof-only-safe (promises about Dylan's effort/availability, never a customer outcome).

| | **Starter $299** | **Growth $499** | **Scale $749** | **Founding-Partner** (free/disc.) |
|---|---|---|---|---|
| Identity | Self-serve, unattended | One guided hour where it counts | Done-*with*-you | Full white-glove concierge |
| Setup | Wizard + docs, async support | + 45-min kickoff + voice-calibration pass | + Dylan wires webhook, imports, seeds gifts, brands page, trains | + sits in the cockpit, weekly calls |
| Dylan-hours | ~0 scheduled | ~2–3 | ~5–7 | ~10–15 over a 4-wk pilot |
| Cap | unlimited | ~2–3/wk | ~1/wk | **2–3 concurrent, max** |

The counterintuitive shape (touch rises with price, then **inverts** for the free founding rung) is the standard "do things that don't scale" early playbook — the founding rung's ROI is *learning + a case study*, not margin. The binding constraint is **Dylan's calendar**, and onboarding hours land concentrated at signup — so the model only works if volume funnels to self-serve Starter and DFY is reserved + scheduled.

**Critique blockers (critique-tiers.md) — the DFY tiers describe machinery that doesn't exist yet:**
- **No branding editor, no gift-catalog editor, no `byStage` authoring surface** exist. So "Dylan seeds the gift catalog / brands the status page / hand-writes stage overrides" = **hand-editing the Mongo store per merchant**, fragile to any reseed. → **Decision D-DFY below:** either accept manual DB edits for the first few Scale merchants, or scope a minimal operator-settings surface first.
- **DFY import inverts the privacy promise.** ImportPanel's trust story is "raw file parsed in your browser, never leaves your machine." Scale's "send me the export and I'll import it" means the raw CSV *does* leave their machine and land on Dylan's — a **data-exposure decision (Fable/Dylan-owned per charter)** that needs an explicit consent/handling story before it ships.
- **No combined capacity ceiling.** The per-tier caps summed can exceed a solo founder's sellable hours in a bad week. Needs a single monthly onboarding-hours budget + a triage rule for when Scale+Growth+pilot collide.

The tier packaging is **customer-facing copy + business model — entirely your call.** The spec gives a recommendation and lists every lever (names, cadences, where gift-DFY sits) as options. Nothing here changes a price.

---

## Decisions needed from you (these gate the onboarding/gift build)

**D-GIFT — the important one.** The gift engine rarely fires for real crowdfunding backers because of the $500 LTV gate vs $25–100 pledges. What's your intent?
- **(a)** Gifts are a **goodwill lever driven by risk/wait, not LTV** — decouple LTV from tiering, lower or remove the high-LTV gate, so a $5 founder note *can* go to any anxious backer. (My lean — it matches the emotional-goodwill intent and actually fires for your ICP.)
- **(b)** Keep LTV gating but **lower the default high-tier threshold** to something crowdfunding-real (e.g. $150) and surface it in onboarding so the merchant sets it.
- **(c)** Keep as-is (gifts are a VIP-only lever) and accept they rarely fire — mostly a demo/high-value flourish.

**D-HELP — helpdesk scope** (also PR-12 in pilot doc): only Gorgias is wired. **(a)** trim the picker to Gorgias + email-forwarding, label the rest "coming soon" (my lean); **(b)** invest in Tidio/Intercom templates now (adds real scope).

**D-TAG — checklist truth:** should typing a presale tag in onboarding count as "Helpdesk connected," or stay red until a real ticket lands? (My lean: **stay red** — the checklist should compute truth from real data, which is its whole value.)

**D-DFY — DFY delivery for Scale:** for the first Scale merchants, are you OK **hand-editing the data store** (fragile, re-seed can clobber), or must a minimal **operator brand/gift editor** be in scope first? And do you accept the **raw-CSV-leaves-their-machine** exception for DFY import, with a disclosed handling story?

**D-TIERS — packaging:** accept the recommended tier shape (Starter self-serve / Growth voice-calibration / Scale done-with-you / Founding concierge)? Any lever changes (names, cadence, gift-DFY placement)? Prices stay held regardless.

**D-3GIFT — the required-gift gate:** keep "≥3 gifts required to finish onboarding" even though (per D-GIFT) they may rarely fire, and it adds friction to the ≤15-min self-serve path? (My lean: **keep it but pre-fill all 5** so it's confirm-not-author, and require ≥1 base gift so standard-band customers always have something — friction stays near zero because the merchant just clicks through the seeded rows.)

---

## What I'll do without waiting (no decision needed)

- The wizard's structural rebuild (5-step box, rail, sessionStorage, editable review, completion→setup hand-off), the dead-field cut (voice/tone/preorderApp/worstStory — unless you say wire worstStory), the copy-integrity sweep (stop the voice lie), and UX-30/31/32 fixes — all decision-free and specced.
- The `/api/gift-send` 403 authorization fix — independent security hardening, ships regardless of D-GIFT.

Once you answer D-GIFT / D-HELP / D-TAG / D-DFY / D-TIERS / D-3GIFT, the rest is execution against the specs.
