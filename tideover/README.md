# Tideover

Presale-retention **product** for Shopify merchants with 60–120 day fulfillment waits
(Kickstarter / Indiegogo / BackerKit graduates). Tideover reads each order's real production
timeline and drafts calm, **day-stage** reassurance (day 7 / 30 / 60 / 89) — **bolted onto the
merchant's existing helpdesk** (Gorgias / Tidio / Intercom / email) **and** as a native
Tideover-branded surface. The moat is the reassurance playbooks + outcome data, not the LLM.

Built on the Adwield stack: **Next.js 14 (App Router) · TypeScript strict · Tailwind 3 ·
Framer Motion 11 · @calcom/embed-react**, deployable on Vercel. Runs fully on **seeded demo
data** today; MongoDB Atlas / real helpdesk OAuth / Shopify / Stripe / optional LLM drafting
swap in behind clean interfaces.

## Quickstart

```bash
cd tideover
npm install
npm run dev            # http://localhost:3000
```

No environment variables are required for the demo (see `.env.example` for the production knobs).

## Scripts

| Script | What |
|---|---|
| `npm run dev` / `build` / `start` / `lint` | standard Next.js |
| `npm run seed-check` | validates seed FK integrity + status-token signatures + volume floor |
| `npm run proof-lint` | fails on fabricated metrics/testimonials/ratings/logos/hard-date claims |
| `npm test` | unit tests for the 4 engines + band/proof helpers |
| `npm run verify` | `seed-check && proof-lint && lint && build` |
| `node scripts/gen-seed.mjs` | regenerate the deterministic seed JSON (stable tokens) |

## Architecture

- **`lib/types.ts`** — domain model (money in cents, ISO dates, prefixed-nanoid ids).
- **`lib/repositories/`** — `Repositories` interface; JSON driver today, Mongo skeleton
  (`mongo/README.md`) behind `DATA_DRIVER`. Nothing reads JSON directly.
- **`lib/engines/`** — 4 pure, deterministic, unit-tested engines (reassurance, refund-risk,
  gift, social-signal) + `computeTicketIntelligence`. `DEFAULT_PROFILE` holds per-beachhead
  calibration.
- **`lib/drafting/`** — `ReplyDrafter` seam: `DeterministicDrafter` (default, no key),
  `LlmDrafter` (env-gated stub; still human-approved, still `assertNoHardDate`).
- **`lib/channel-adapters/`** — `ChannelAdapter` for both modes: `MockAdapter` (native, full) +
  Gorgias/Tidio/Intercom/Email stubs with documented OAuth/webhook contracts.
- **`lib/service.ts` / `status.ts` / `onboarding.ts`** — orchestration shared by API routes and
  server components (one source of truth, incl. the `/status` PII boundary).
- **`app/api/*`** — zod-validated route handlers (ingest → draft → approve-send, status, gifts,
  social, onboarding, widget-submit).

## Demo walkthrough (≈3 min)

1. **`/`** — marketing site. Click any CTA → **`/book`** (inline Cal.com, namespace `tidedisco`).
2. **`/onboarding`** — run the wizard (or 6-question fast-start). On submit it builds a real
   merchant + seeds a day-stage playbook and shows the **generated day-7/30/60/89 scripts**.
3. **`/app`** — the merchant **refund-risk dashboard**: live metrics vs the captured baseline,
   the risk curve, the at-risk queue. Switch merchants with the top control.
4. **`/app/inbox`** — the **operator cockpit**. Pick an at-risk ticket: see the engine's
   **factor breakdown** (why the score), the drafted reassurance (honest confidence band), and a
   one-click **gift** suggestion. Edit the draft → **Approve & send** (first-response time is
   recorded; the ticket flips to sent).
5. **`/status/<token>`** — open that order's **branded customer reassurance page**: timeline with
   the active stage and a confidence **band** (never a hard date). Ask a question in the box →
6. **`/app/inbox`** — your question is now a new ticket in the cockpit (native channel).
7. **`/app/social`** — the **social-signal monitor** (upsell): flagged posts + drafted, human-
   approved outreach.

**Sample status links** (valid signed tokens from the seed):

```
/status/dflvtbcslipuv80vdkkg17us.bf07a04f58
/status/aki3gb5k7t5k5f793hgv1clm.a97820bf0a
```

Regenerate the seed any time with `node scripts/gen-seed.mjs` (tokens stay stable for the same
`STATUS_TOKEN_SECRET`).

## Embeddable widget

The native widget renders at `/widget/<token>` and reports its height to the host page:

```html
<iframe
  src="https://your-tideover-domain/widget/ORDER_STATUS_TOKEN"
  style="width:100%;border:0"
  title="Order status"></iframe>
<script>
  window.addEventListener("message", (e) => {
    if (e.data?.type === "tideover-widget-height") {
      document.querySelector("iframe[title='Order status']").style.height = e.data.height + "px";
    }
  });
</script>
```

On Shopify, inject the same iframe via a theme app extension / script tag, passing the order's
`tideover.eta_band` metafield-derived status token.

## Deploy (Vercel)

`vercel.json` is included and correct. **No secrets are needed for the seeded demo.**

### One-time setup (≈2 min)
1. Vercel → **Add New… → Project** → import `chagaqi/core-business`.
2. **Set Root Directory = `tideover`** (this app is a subdirectory of the repo — the build
   fails without this). Framework preset auto-detects as **Next.js**.
3. Leave env vars empty for the demo → **Deploy**. Every push to the branch redeploys; PR #1
   gets a Vercel preview URL automatically.

### Known demo caveat — ephemeral state on serverless
The demo's data lives in an **in-memory store** seeded from `lib/data/*.json`
(`lib/repositories/json/store.ts`). On Vercel's serverless runtime that store resets on cold
starts and isn't shared across function instances, so **write actions don't persist durably**:
an approved reply (`approve-send`) or an onboarding-created merchant is visible within the same
warm instance/session but may not survive a cold start or land on a different lambda.

- **Read surfaces are always fully populated** (re-seeded per instance), so the dashboard,
  cockpit, status pages, and marketing always look complete — fine for a live walkthrough done
  in one sitting.
- For **durable** writes, set `DATA_DRIVER=mongo` + `MONGODB_URI` (skeleton in
  `lib/repositories/mongo/`) — that's the production path; no call sites change.

### Production env vars
`DATA_DRIVER=mongo` + `MONGODB_URI`/`MONGODB_DB`; a strong `STATUS_TOKEN_SECRET` (**changing it
invalidates the seeded demo tokens — regenerate with `node scripts/gen-seed.mjs`**); per-helpdesk
OAuth/webhook secrets (`GORGIAS_WEBHOOK_SECRET`, `INTERCOM_CLIENT_SECRET`, …); and optionally
`LLM_PROVIDER`/`LLM_API_KEY` to enable novel-reply drafting (still human-approved).

> Note: this repo can't be deployed from the build environment itself (no Vercel
> account/token wired here). The steps above are the full path; connect a Vercel project to the
> repo and it deploys as-is.

## Proof-only

No fabricated metrics, testimonials, ratings, or logos anywhere. Customer replies use honest
confidence **bands**, never hard delivery dates (`lib/proof.ts#assertNoHardDate`). Real proof is
a literal `[CASE STUDY PLACEHOLDER]` until a completed-cohort case study exists. External stats
are cited to their source. `npm run proof-lint` guards this at build time.
