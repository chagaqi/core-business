# Tideover — demo walkthrough

A guided ~3-minute click-through for showing Tideover to a partner. It proves the
**proprietary-software** story: a real engine that reads each order's timeline, scores
refund risk, drafts day-stage reassurance, and recommends goodwill gifts — bolted onto the
helpdesk a merchant already runs, plus a native branded customer experience.

**Run it:** `cd tideover && npm run dev` → open `http://localhost:3000`.
Everything below works on seeded demo data; no secrets, no setup.

> Primary demo merchant: **Lumen Forge** (a Kickstarter hardware brand, ~120-day waits).
> The dashboard/cockpit default to it. Switch merchants with the control top-right of `/app`.

---

## The path (in order)

### 1. Marketing site — the pitch · `/`
Scroll the landing page: the day-7/30/60/89 buyer arc, the "bolt-on, presale tickets only"
routing diagram, the generic-helpdesk-vs-Tideover table, the founding-partner pilot offer,
and the **proof pledge** with the literal `[CASE STUDY PLACEHOLDER]` (we never fake a refund
stat). Click any CTA →

### 2. Book a teardown · `/book`
The inline Cal.com calendar (namespace `tidedisco`). This is the real booking surface for the
free 15-minute teardown.

### 3. Onboarding — frictionless setup · `/onboarding`
Run the wizard (or flip on the **6-question fast-start**). On submit it **creates a live
merchant and seeds a day-stage playbook**, then shows the **generated day-7/30/60/89 reassurance
scripts** for review.
> Point at: "answers in → a working, on-brand reassurance playbook out, in one pass."

### 4. Refund-risk dashboard — the proof · `/app`
The merchant health view, all **proof-only** (every number is measured against the merchant's
own captured baseline — no invented outcomes):
- **Median first response: ~1h 1m, ↓86% vs the 7h 30m baseline** (green).
- **WISMO / 100 orders: ↓31% vs baseline** (green).
- **Saves logged** (dispute-risk replies + gifts) and **Deflection %**.
- The **refund-risk curve** across customers and the **at-risk queue**.
> Point at: "this is software measuring itself honestly, not a service invoice."

### 5. Operator cockpit — the engine, visible · `/app/inbox`
The top of the queue is the **hero ticket: "Dana" — "LAST WARNING before chargeback"** (a VIP,
overdue, chargeback-threat). Open it:
- **Why it's at risk:** the **factor breakdown** (value exposure / wait pressure / sentiment /
  velocity / stage lag) — the score shows its work. This is what makes it read as a product, not
  a black box.
- **The drafted reassurance** in the merchant's voice with an honest **confidence band** (never
  a hard date), and an **escalated** manager note.
- A one-click **gift suggestion** (priority dispatch) with its reasoning + ROI.
- Edit the draft if you like → **Approve & send**. The ticket flips to *sent* and the
  **first-response time is recorded** (feeding the dashboard).
> Point at: four engines firing on one ticket — risk, reassurance, gift, all deterministic.

### 6. Branded customer experience · `/status/<token>`
Open a customer's order-status page (merchant-branded, no login):
- `http://localhost:3000/status/dflvtbcslipuv80vdkkg17us.bf07a04f58` — *Mara, day-89, "ships in weeks 3–5"*
- `http://localhost:3000/status/aki3gb5k7t5k5f793hgv1clm.a97820bf0a` — *Mara, day-7, "ships in weeks 1–3"*

Show the timeline with the active production stage, the calm **confidence band** (a window,
never a date), the stage-appropriate reassurance message, and the **"ask a question" box**.
Type a question and send it →

### 7. The loop closes · back in `/app/inbox`
That customer question is now a **new ticket in the cockpit** (native channel), already drafted
by the engine. The native surface and the bolt-on inbox are the same pipeline.

### 8. Embeddable widget · `/widget/<token>`
The same status experience as a compact, embeddable iframe (it reports its height to the host
page). The README has the `<iframe>` + Shopify snippet. Use either token above.

### 9. Upsell — social-signal monitor · `/app/social`
Flagged public posts (brand/campaign mentions × wait-anxiety keywords) with a **drafted,
human-approved** proactive outreach line. Framed as a paid add-on, on top of the product.

---

## Engine cheat-sheet (what each one is)
| Surface | Engine | One-liner |
|---|---|---|
| `/app/inbox` draft | **Reassurance** | day-stage script + honest confidence band, merchant voice |
| `/app/inbox` risk + `/app` curve | **Refund-risk** | 0–100 score with a visible factor breakdown |
| `/app/inbox` gift + `/app/gifts` | **Gift** | one-click goodwill, gated on LTV + wait + risk |
| `/app/social` | **Social-signal** | scores + flags public wait-anxiety, drafts outreach |

## Proof-only reminders (say these out loud)
- Every metric is **vs the merchant's own baseline**; no refund-reduction % is claimed until a
  completed-cohort case study exists — that's the literal `[CASE STUDY PLACEHOLDER]`.
- Customer-facing copy uses **confidence bands, never hard dates**.
- External stats on the site are **cited to their source**.

## Reset
Data is in-memory and re-seeds on restart. To regenerate deterministically (stable tokens):
`node scripts/gen-seed.mjs`. Verify anytime with `npm run verify` (+ `npm test`).
