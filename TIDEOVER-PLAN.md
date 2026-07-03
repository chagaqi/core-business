# TIDEOVER — Hardened Build Plan & Engineering Spec

> Tideover is a presale-retention **product** for Shopify merchants with 60–120 day
> fulfillment waits (Kickstarter / Indiegogo / BackerKit graduates). It reads each
> order's real production timeline and drafts calm, day-stage reassurance — **bolted
> onto the merchant's existing helpdesk** (Gorgias / Tidio / Intercom / email) **and**
> as a native Tideover-branded surface. The moat is the day-by-day reassurance
> playbooks + outcome data, not the LLM.
>
> This document is the execution-ready spec for the `tideover/` Next.js app. The app
> in this repo is **built and runnable on seeded demo data today** (`tideover/`), with
> a clean seam (the repository + adapter + drafter interfaces) for the production swap
> (MongoDB Atlas, real helpdesk OAuth/webhooks, Shopify/Stripe, optional LLM drafting).

---

## 0. Non-negotiable constraints (and how they're met)

| Constraint | How it's satisfied |
|---|---|
| Feels like proprietary **software**, not "we handle a slice of your tickets" | Real product surfaces: branded customer reassurance experience (`/status/[token]` + embeddable widget), a refund-risk **dashboard** with a visible **engine factor breakdown** (the score shows its work), a **gift engine** surface, an operator cockpit. Deterministic engines do the reasoning. |
| **Both modes**: bolt-on AND native | `ChannelAdapter` interface with Mock (native, fully working) + Gorgias/Tidio/Intercom/Email adapters (documented OAuth/webhook contracts). Native surface = `/status` + widget + `/app`. |
| **Ease of integration / frictionless onboarding** | `/onboarding` wizard turns answers → a live merchant + a seeded day-stage playbook + preview scripts in one pass; a 6-question fast-start; email-only "delegate/alias" route needs no password. |
| **Reuse the Adwield stack verbatim** | Next.js 14 App Router, TS strict, Tailwind 3, Framer Motion 11, `@calcom/embed-react`; same tsconfig/postcss/next configs, `next/font/google`, `useReducedMotion` reveal, two-layer Cal theming, `@/*` alias. |
| Tideover tokens | sea-teal `#0E5366`, terracotta `#D9762F`, sand `#FBF8F2`, ink `#11252A`; Fraunces + Inter; Cal namespace `tidedisco` / `bookthecall/tidedisco`. |
| **Seeded demo now**, Mongo later | All data behind the `Repositories` interface; JSON driver today, `DATA_DRIVER=mongo` swap documented (`lib/repositories/mongo`). |
| **Deterministic engines**, optional LLM later | 4 pure engines (rules + script library), no API key. `ReplyDrafter` seam: `DeterministicDrafter` default, `LlmDrafter` env-gated stub. |
| **Proof-only** | No fabricated metrics/testimonials/ratings/logos. Confidence **bands**, never hard dates (`assertNoHardDate`). Literal `[CASE STUDY PLACEHOLDER]`. External stats cited to source. Enforced by `scripts/proof-lint.mjs` at build. |

---

## 1. File tree (`tideover/`)

```
tideover/
├── package.json  tsconfig.json  tailwind.config.ts  postcss.config.mjs
├── next.config.mjs  .eslintrc.json  .gitignore  .env.example  vercel.json  README.md
├── app/
│   ├── layout.tsx            # Fraunces + Inter via next/font; metadata
│   ├── globals.css           # warm light theme tokens, .wrap/.panel/.btn, reduced-motion
│   ├── page.tsx              # marketing landing (ported from _tideover-source.html)
│   ├── book/{page.tsx,BookPage.tsx}            # Cal embed (tidedisco)
│   ├── vsl/{layout.tsx, cold-loom, landing-vsl, partner-demo, playbook-promo}/page.tsx
│   ├── onboarding/{page.tsx, OnboardingWizard.tsx}
│   ├── status/[token]/{page.tsx, StatusView.tsx}  # branded customer reassurance
│   ├── widget/[token]/page.tsx                     # embeddable iframe variant
│   ├── app/                  # product (demo-auth)
│   │   ├── layout.tsx  page.tsx(dashboard)  inbox/  customers/  gifts/  social/
│   └── api/
│       ├── ticket-ingest/  draft/  approve-send/  onboarding/
│       ├── orders/[orderId]/timeline/  status/[token]/
│       ├── social-signal-feed/  gift-catalog/[customerId]/  gift-send/  widget-submit/
├── lib/
│   ├── types.ts  ids.ts  time.ts  proof.ts  service.ts  status.ts  onboarding.ts  auth.ts
│   ├── engines/{reassurance,refund-risk,gift,social-signal,index}.ts  __tests__/engines.test.ts
│   ├── drafting/{ReplyDrafter,DeterministicDrafter,LlmDrafter}.ts
│   ├── channel-adapters/{ChannelAdapter,MockAdapter,Gorgias,Tidio,Intercom,Email,registry}.ts
│   ├── repositories/{index.ts, types.ts, json/{store,repositories}.ts, mongo/README.md}
│   └── data/{merchants,orders,customers,tickets,gifts,social-feed}.json  seed.ts
├── components/
│   ├── ui/{Reveal,Button,Badge,Field,Stepper,Logo}.tsx
│   ├── booking/{BookCal,CalButton}.tsx
│   ├── marketing/*  product/*  status/*  vsl/*
└── scripts/{gen-seed.mjs, seed-check.mjs, proof-lint.mjs, alias-hooks.mjs, register-hooks.mjs}
```

---

## 2. Data schema + seed (`lib/types.ts`, `lib/data/*`)

Conventions: prefixed nanoid ids (`mch_ ord_ cus_ tkt_ gft_ sig_ drf_`); ISO date strings;
**money in integer cents**; string-literal enums. Nothing reads JSON directly — everything
goes through `Repositories`.

- **Merchant** — brand{voice,tone[],banned[],signoff,logoText,colors}, helpdesk(channel),
  preorderApp, fulfillmentWindowDays{min,max}, `stages: StageDef[]`, `playbook:
  Record<'day-7'|'day-30'|'day-60'|'day-89', {byStage, base}>`, ltvTiers{standard,high,vip}
  (cents), giftCatalogIds[], slaWindows{amStart,pmStart,tz}, **baseline**{capturedOn,
  medianFrtSec, wismoPer100Orders, ticketsPerWeek, repeatWismoPct}.
- **Order** — merchantId, customerId, group(ks-backer|late-pledge|new-preorder),
  orderValueCents, createdAt, fulfillmentStart, fulfillmentEnd, productionStage
  (sourcing→tooling→production→qc→freight→dispatch), region, **statusToken** (signed,
  unique), preorderEtaSource(metafield|preorder-app|manual). Computed: `OrderTimeline`.
- **Customer** — email, firstName, ltvCents, orderIds[], ticketCount, lastSentiment.
- **Ticket** — orderId, channel, externalId, subject, body, type(wismo|refund|deposit|other),
  sentiment(calm|anxious|hostile|chargeback-threat), createdAt, firstResponseSec, status
  (open|drafted|approved|sent|resolved), `draft?: DraftReply`, `sent?: SentReply`, tags[].
- **Gift** — name, kind, costCents, perceivedValueCents, eligibility{minLtvCents,minWaitDays,minRiskScore}.
- **SocialSignal** — platform, author, text, postedAt, mentionsBrand, mentionsCampaign;
  computed `ScoredSignal` adds signalScore/flagged/matchedKeywords/suggestedOutreach.

**Seed** (deterministic, `scripts/gen-seed.mjs` → committed JSON): 2 merchants (Lumen Forge —
KS hardware on Gorgias; Atelier Noord — made-to-order on email), 30 customers, 41 orders
spread across all 4 day-stages + all groups/stages + regions/LTV tiers, 42 tickets (Lumen
Forge ≥30/wk → meets the measurable-baseline floor; covers all types + sentiments incl.
chargeback-threat), 10 gifts, 16 social signals. **Status tokens are HMAC-signed** with the
dev-fallback secret so seeded `/status` links verify out of the box. `scripts/seed-check.mjs`
asserts FK integrity + token uniqueness/signature + the volume floor.

**Mongo swap:** implement `Repositories` against Atlas (collections 1:1 with types; index
`slug`, `statusTokenKey`, `{merchantId,email}`, ticket `merchantId/status/createdAt`), return it
from `getRepositories()` when `DATA_DRIVER=mongo`. Seed shape == production document shape.

---

## 3. The four engines (`lib/engines/*`) — pure, deterministic, unit-tested

Calibration in `DEFAULT_PROFILE` (crowdfunding-hardware beachhead), documented as
per-beachhead tunable. `computeTicketIntelligence()` composes risk+reassurance+gift for the
ingest pipeline and cockpit.

### Engine 1 — Stage-Aware Reassurance (`reassurance.ts`)
- **Input** `{order, merchant, firstName, sentiment, now?}`.
- **Day-stage bucket**: ≤7→day-7, 8–30→day-30, 31–60→day-60, 61–89→day-89, ≥90→day-89+overdue.
- **Confidence band (`time.ts#computeTimeline`)** — never a date:
  `remainingLo = clamp(min(stageCeil−elapsed, windowRemaining), 0, windowRemaining)`;
  `remainingHi = remainingLo + variance` where `variance = max(5, round(totalDays*0.12))`;
  `formatBand` → "in weeks 9–11" / "in 9–14 days". `overdue` → honest "running a little longer".
- **Template** = `playbook[stage].byStage[productionStage] ?? .base`, merge
  `{first_name}{brand}{eta_band}{stage_blurb}{next_window}`, strip merchant `banned` words,
  append `signoff`, `assertNoHardDate`.
- **Output** `{draftText, confidenceBand, priority(normal|escalated), stageKey, overdue, managerNote}`.
  Escalates hostile / chargeback-threat.

### Engine 2 — Refund-Risk / Priority (`refund-risk.ts`)
- Sub-scores ∈ [0,1]: `valueExposure=value/highTicket`, `waitPressure=daysInWait/windowMax`,
  `sentiment={calm .05, anxious .45, hostile .8, chargeback-threat 1.0}`,
  `velocity=ticketsLast7d/cap(4)`, `stageLag=overdue?1:clamp((daysInWait−stageCeil)/variance)`.
- `risk = 100·Σ(weight·factor)`; weights `{value .20, wait .20, sentiment .35, velocity .15,
  stage .10}`. Bands `≥75 at_risk(red)`, `50–74 watch(amber)`, `<50 standard(green)`.
- **Returns the factor breakdown + `topDriver`** so the dashboard explains *why* (software, not
  black box). `priorityRank` floats escalated sentiments to the top, then by score.

### Engine 3 — Gift Recommendation (`gift.ts`)
- **Gate**: only if `ltv ≥ highTier AND (daysInWait ≥ 45 OR riskScore ≥ 60)`.
- **Filter** eligibility, **rank** by perceivedValue DESC → cost ASC → ROI DESC.
- **Output** `{gift|null, reasoning, roi}`. Null returns a reason (so the cockpit only shows a
  gift when it helps). One-click send via `/api/gift-send` (logged, never auto-fired).

### Engine 4 — Social-Signal Scoring (`social-signal.ts`) — upsell
- `relevance = .6·mentionsBrand + .4·mentionsCampaign`; `negativity = clamp(negKeywordHits/3)`;
  `signalScore = 100·(.5·relevance + .5·negativity)`; `flagged = relevance>0 && negativity>0 &&
  score≥40`. Drafts a public-safe outreach line for flagged posts (draft only, human-approved).

`npm test` covers all four engines + the band/proof helpers (7 tests, green).

---

## 4. ChannelAdapter + ingest→draft→approve→send

```ts
interface ChannelAdapter {
  name: Channel;
  listTickets(merchantId, range?): Promise<Ticket[]>;
  sendReply(ticketId, text): Promise<{externalId; sentAt}>;
  normalizeInbound(raw): NormalizedTicket;
  verifyWebhook(req): Promise<boolean>;        // HMAC-SHA256 per vendor
  authStartUrl?(merchantId): string;           // OAuth begin (stub)
  authCallback?(code): Promise<OAuthTokens>;   // OAuth exchange (stub)
}
```
- **MockAdapter** (full): reads/writes via repositories; powers the native surface + widget +
  the demo's end-to-end send. `inferType`/`inferSentiment` classify inbound text.
- **Gorgias / Tidio / Intercom / Email** (stubs): throw `NotImplementedError` for live I/O but
  implement `normalizeInbound` + `verifyWebhook` (real HMAC for Gorgias `X-Gorgias-Signature`,
  Intercom `X-Hub-Signature`; shared-secret for Tidio/Email) and document the OAuth redirect
  URIs + field maps inline. Email adapter documents the no-password delegate/forwarding-alias model.
- `registry.getAdapter(channel)` resolves; `getSendAdapter` routes demo sends through Mock even
  when a ticket's source is a stubbed helpdesk, so the full flow demos without vendor creds.

**API contract** (App Router route handlers, zod-validated):
1. `POST /api/ticket-ingest` — verify → normalize → match order → persist → run engines → attach
   draft+risk+gift (status `drafted`). 2. `POST /api/draft` — (re)generate. 3. `POST
   /api/approve-send` — `assertNoHardDate` → `adapter.sendReply` → status `sent`, record
   firstResponseSec. **No novel auto-send**; only pre-approved holding templates may auto-send
   (documented). 4. `GET /api/orders/[id]/timeline`. 5. `GET /api/status/[token]` (PII-scoped via
   `getPublicStatus`, rate-limited). 6. `GET /api/social-signal-feed`. 7. `GET
   /api/gift-catalog/[customerId]`. 8. `POST /api/gift-send`. 9. `POST /api/widget-submit`
   (→ ingest). 10. `POST /api/onboarding`.

**Token security:** `statusToken = nanoid(24).hmac(10)` via `STATUS_TOKEN_SECRET`; opaque, no PII,
per-order, verified before lookup; status/widget routes rate-limited. Operator `/app/*` uses
demo-auth (cookie `getDemoOperator`); **production = NextAuth/Clerk + per-merchant RBAC** (flagged §9).

---

## 5. Surfaces

- **Operator cockpit `/app/inbox`** — 3-pane: priority queue (Engine 2 sort, risk badges,
  group/stage tags) · ticket detail (order, daysInWait, stage, LTV, sentiment, **FactorBreakdown**) ·
  DraftRail (editable draft, confidence-band chip, manager note, ApprovalBar: Regenerate /
  Approve&send / Escalate) + GiftSuggestion (one-click send).
- **Merchant refund-risk dashboard `/app`** — MetricTiles (median FRT vs baseline, WISMO/100
  orders, saves, deflection, orders-in-window) **proof-only labeled**; RiskCurve; at-risk table.
  Merchant switcher (`?merchant=`).
- **Customer status `/status/[token]`** — merchant-branded; ConfidenceBand, OrderTimeline
  (done/active/upcoming stages, relative bands only), stage-aware ReassuranceCard, AskBox →
  `/api/widget-submit`. **Embeddable `/widget/[token]`**: minimal chrome + `postMessage` height
  (host `<iframe>` + Shopify script-tag snippet in README). PII boundary enforced once in
  `getPublicStatus` (first name + timeline only).
- **Onboarding `/onboarding`** — Stepper wizard (brand+voice → tools → real timeline → groups →
  review) → `POST /api/onboarding` builds a merchant + seeds the playbook + returns preview
  scripts. 6-question fast-start.
- **Gift engine `/app/gifts`**, **social monitor `/app/social`** (upsell), **customers `/app/customers`**.

---

## 6. Marketing site + /book + 4 VSL pages

- **`/`** ports `_tideover-source.html` section-for-section (Nav, Hero "Calm the wait. Keep the
  sale.", LongWait 4-stage arc + cited stakes, HowItWorks 4 features + routing diagram +
  comparison table, Pilot dark section + value ladder, HonestFit, Operator war-story +
  ProofPledge + literal `[CASE STUDY PLACEHOLDER]`, FAQ, FinalCTA "The tide always comes in.",
  Footer). Framer reveals via shared `Reveal`. CTAs → `/book`.
- **`/book`** — context rail + inline `<BookCal/>` (namespace `tidedisco`, `cal-brand #0E5366`,
  light theme).
- **`/vsl/*`** — shared layout; VslPlayer (placeholder, no fake view counts) + full transcripts
  from `v2-vsl-scripts.md` + EmailCapture + CTA; honest-proof box on landing-vsl + partner-demo.

---

## 7. Upsell + integration specs

- **Social-signal monitoring** — Engine 4 + `/app/social` live on seed; paid add-on; production
  source = social-listening API webhook → ingest. Drafts only; human-approved.
- **White-glove VA service** (concierge **on top of** the product, not the product):
  - Buy trained VAs ≈ **$8/hr**. Package as **"X presale inquiries/week"** (e.g. 50/wk ≈ $400/mo,
    100/wk ≈ $750/mo). Bill the equivalent of **$15–25/hr**.
  - **Capacity math:** avg handle time ~6 min/presale ticket (templated + engine-drafted) →
    ~10 tickets/VA-hr → a $8/hr VA hour costs $0.80/ticket. At ~50 inquiries/wk ≈ 5 VA-hrs ≈
    **$40 cost → $400 price**; after QA, tooling, Tideover seat, and operator review, hold
    **40–50% gross margin** as the planning number.
  - SLA = twice-daily windows; dispute-threats fast-laned; novel replies human-approved; VAs
    operate **inside Tideover** (cockpit + engine drafts), which is what makes $8/hr labor look
    like $25/hr support — the product is the leverage.
- **Production OAuth/webhooks/Shopify/Stripe** (documented; no live creds in demo):
  - Shopify embedded app: OAuth, **Order API read**; preorder ETA via **metafield**
    `tideover.eta_band` with preorder-app fallbacks (PreProduct / Pre-Order Now / Timesact).
  - Helpdesk OAuth redirect URIs `{APP}/api/oauth/{vendor}/callback`; webhook HMAC verify + key
    rotation (per-adapter contract in code).
  - Stripe: 3 Payment Links ($199/$299/$499); tax + billing-entity flags called out as
    pre-launch decisions; charge via link on conversion (no card during pilot).

---

## 8. Build sequence + verification

**A (foundation)** scaffold from Adwield · types · repositories+JSON · seed+seed-check ·
time/ids/proof. → gate `npm run seed-check`. **B (parallel)** B1 engines+tests+drafting ·
B2 adapters+API · B3 marketing+book+VSL · B4 product surfaces · B5 status+widget+onboarding.
**C (integration)** CTAs · demo-auth · proof-lint allowlist · README · `.env.example` · `vercel.json`.

**Verify:** `npm run verify` = `seed-check && proof-lint && lint && build`, plus `npm test`
(engines). **Demo walkthrough** (README): `/` → `/book` (Cal) → `/onboarding` (build merchant +
preview scripts) → `/app` (risk curve) → `/app/inbox` (pick at-risk ticket → engine draft +
gift → edit → approve-send → FRT recorded) → open that order's `/status/[token]` (branded
timeline + band, no date) → `/widget/[token]` (ask → ticket back in cockpit) → `/app/social`
(flagged posts + drafted outreach). **Deploy:** Vercel, framework preset, no secrets for demo.

---

## 9. Risks / flagged

- **Demo-auth ≠ real auth** — production needs NextAuth/Clerk + per-merchant RBAC (`lib/auth.ts`
  is the seam).
- **Mongo driver is a skeleton** — the repository boundary is the insurance; swap is one factory.
- **Helpdesk adapters are stubs** — live OAuth/webhooks need vendor creds (out of demo scope);
  contracts are coded.
- **Confidence-band variance (12%)** — a documented per-beachhead calibration default; revisit
  with real fulfillment-variance data.
- **Preorder ETA source** — assumes a `tideover.eta_band` metafield; if a partner's preorder app
  only exposes ETA via its own API, wire that adapter before relying on the timeline.
- **Service-vs-product framing** — mitigated by real software surfaces + visible engine factor
  breakdowns + native branded experience; the VA upsell is framed as concierge *on top of* the
  product, never the product itself.
- **Proof-only** is enforced by `proof-lint` (heuristic) — keep it a review gate, not the only
  guard, before any public asset ships. No refund-% claim until a completed-cohort case study
  exists (literal `[CASE STUDY PLACEHOLDER]` until then).

---

*Legacy note: this file previously held a 2-hour blitz outline. It has been replaced by the
hardened, file-by-file spec above, which matches the implemented `tideover/` app. The 90-day
go-to-market sequencing (gate trigger, pricing rungs, KILL/SCALE rules) lives in
`36-presaleai-90-day-roadmap.md`.*
