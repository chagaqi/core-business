Verified every load-bearing `file:line` in the spec against the code (read-only). The citations are mostly accurate — but several architectural claims don't hold, and three of them will ship broken behavior.

# BLOCKERS (must fix before build)

**B1 — The "connect template per helpdesk choice" story is false for 4 of 5 options.** Step 4 offers Gorgias / Tidio / Intercom / Email / None (`OnboardingWizard.tsx:48-54`). The API only generates webhook templates for **gorgias + zendesk** (`route.ts:43-46`, `ingest-templates.ts:45,74`), and `ConnectPanel` is a hardcoded gorgias/zendesk toggle that ignores `merchant.helpdesk` and defaults to gorgias (`ConnectPanel.tsx:18,56-59,87`). Zendesk isn't even a selectable helpdesk. So §1.2 / §3-Step4 / §4.2 ("drives which connect template renders," "ConnectPanel for the vendor chosen in step 4") are unimplementable as written — Tidio/Intercom/Email/None users get an irrelevant Gorgias/Zendesk toggle. Building real Tidio/Intercom templates is out of the spec's stated "pure-UI" scope.

**B2 — Email-inbox integration path is dropped from the completion redesign.** For `helpdesk:"email"` the integration is the forwarding-address block (`OnboardingWizard.tsx:223-234`, `result.inboxAddress`), not the webhook ConnectPanel. The §4 completion order lists reward → ConnectPanel → ImportPanel → tz → CTA and never mentions `inboxAddress`. Implemented literally, an Email-inbox merchant loses their actual setup instructions. Spec must keep/place the forwarding block and gate it by helpdesk choice.

**B3 — Writing `presaleTags` at onboarding silently flips "Helpdesk connected" to done.** `setup.ts:110-111`: `helpdeskConnected = (merchant.presaleTags?.length ?? 0) > 0 || tickets.some(non-mock)`. Today onboarding never sets presaleTags, so this only trips on a real inbound. Step 4 + §6.3 make the wizard persist presaleTags, so any merchant who types a tag lands on `/app/setup` showing "Helpdesk connected ✓" before connecting anything — a false "done" on the checklist the spec sells as "computes truth from real data" (§4). Contradicts the invariant documented at `setup.ts:107-109`.

**B4 — Making `logoText` user-optional breaks the "Brand ✓" signal the spec depends on.** `setup.ts:99-102` derives `brandConfigured` from `logoText.trim()`; its own comment says logoText "is the one field onboarding always populates (from the required brand name)." §3-Step1/§6 turn it into optional `logoText?` and replace the `onboarding.ts:84` auto-populate. Blank input → server writes `""` → `brandConfigured=false` → §4.5's "will already show Brand ✓" is false. §6.3 just says "write brand.logoText" with no fallback. Server must default logoText→brandName when blank.

# IMPROVEMENTS (should)

**I1 — Gift step is the real persona-B abandonment risk.** 5 seeded rows × 7 fields, three of them eligibility economics (min LTV / min wait / min risk), plus a ≥3-required gate — the one step in a "confirm, don't author" flow that reads as homework. Collapse the three eligibility fields behind an "Advanced" disclosure so the default action is "accept the seeds."

**I2 — Gift eligibility inputs can be silently dominated by the engine gate.** `gift.ts:31-35` requires `daysInWait>=45` OR `riskScore>=60` before any per-gift filter applies. A row set to "offer after N<45 days" at low risk never fires, with no feedback. Surface the floor or constrain the input.

**I3 — "View a sample customer page" can't use a just-imported order.** §4.5 wants the token from a real imported order, but `/api/import` returns only counts (`ImportPanel.tsx:18-22,78`; `import/route.ts:33`), no status token, and import runs client-side after launch with no path back into the wizard. Infeasible as specified — keep the sample token or extend the import response.

**I4 — Accent swatch previews the raw input, not the rendered result.** The status page runs accent through `readableAccent` (auto-darkens for contrast, `color.ts:104`). A pale pick shows pale in the swatch but renders dark live. §3/§5 say "so the merchant sees the result" — preview the `readableAccent`-adjusted color to actually match.

**I5 — Copy-integrity sweep is incomplete.** §7 fixes `setup.ts:128` and the tone hint but leaves live "voice" claims the deterministic drafter never reads: completion headline "in your voice" (`OnboardingWizard.tsx:209`), setup item title "Brand & voice configured" (`setup.ts:126`), and the wizard JSDoc/intro (`OnboardingWizard.tsx:13-19,270-273`). Same proof-only defect — sweep them.

**I6 — Gift seeds carry demo `id`/`merchantId`.** `gifts.json:1-66` rows include `"id":"gft_…"` and `"merchantId":"mch_lumen0001"`. The repeater must strip both and let `createMany` mint id + set the new merchantId; §3/§6 imply but don't state it — an agent could persist demo ids / a foreign merchantId.

**I7 — Bundle is large and crosses the high-risk repository seam.** Full wizard rewrite (L) + merchant-creation contract + `GiftRepository.createMany` in both drivers (`json/repositories.ts:158`, `mongo/repositories.ts:186`) + 3 UX fixes + copy, all gated behind the 52,440-invariant + 55-golden harness. Changing `giftCatalogIds`, `ltvTiers.high`, and `colors.primary` from hardcoded to user values is engine-adjacent — land `createMany` + the onboarding contract as a separately verified PR *before* the UI rewrite so a seam regression can't hide behind UI churn. (Spec's own Sequence is right; make it two PRs.) Note: `readableAccent`'s auto-contrast means the accent change is golden-safe, but verify the previews still generate.

*(Verified-correct spec claims, for the record: voice/tone are genuinely dead under `DeterministicDrafter` — `reassurance.ts:92-100` never reads `brand.voice/tone`, LlmDrafter is unwired `LlmDrafter.ts:17-24`; `GiftRepository` truly has no writer `types.ts:80-83`; `ltvTiers.high`→gift gate wiring is real `engines/index.ts:73`→`gift.ts:31`; Stepper active=terracotta `Stepper.tsx:15`; slug non-uniqueness `onboarding.ts:62` correctly self-flagged in §5; UX-30/31/32 cites match `UX-AUDIT-HANDOFF.md:188-190`; presaleTag "blank=accept all" real `ingest-route.ts:98-100`.)*

# QUESTIONS FOR DYLAN

**Q1 (B1/B2)** — Only Gorgias is both a selectable option *and* wired. Do you want to (a) show Tidio/Intercom/Email as "we'll help you connect after launch" placeholders, (b) build real Tidio/Intercom webhook templates now (adds scope), or (c) trim the picker to what's actually wired (Gorgias + Email forwarding)?

**Q2 (B3)** — Should typing a presale tag in onboarding count as "Helpdesk connected" on the setup checklist, or should that item stay red until a real ticket lands? Determines whether the checklist keeps telling the truth.

**Q3 (I1)** — Keep the ≥3-gifts-required gate even though a merchant whose backers are all below the high-value LTV threshold will never see any gift fire? Is a required step that may never activate worth the added onboarding friction for the ≤15-min persona?