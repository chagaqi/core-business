# Tideover — Pilot-Readiness Audit (can a real merchant actually use this?)

**Date:** 2026-07-06 · **Author:** Fable (synthesis of a verified multi-agent audit that traced a real DEMO_MODE=false merchant end-to-end through the code)
**Full findings:** `docs/audit-2026-07-06/pilot-findings.json` (21 confirmed, 0 refuted). Task ids PR-01…

## The verdict (read this first)

**Tideover is demo-complete but not yet sellable.** Every surface renders beautifully on seed data, but the audit that traced a *real paying merchant* (DEMO_MODE=false, real Mongo, real backers) through the actual code found the **core loop is broken in three places where the product touches the real world** — plus three infrastructure landmines. A pilot merchant onboarded today would hit these in the first hour.

This is not a criticism of the build — a proof-only demo of this depth is exactly the right thing to have built first. It's the punch-list that converts "impressive demo" into "a merchant can pay for it." **None of it is huge; all of it is specific.**

### The 6 blockers between here and a live pilot

| # | Blocker | What actually happens | Fix effort |
|---|---------|----------------------|-----------|
| **PR-01** | **Approved replies go nowhere.** | The operator clicks "Approve & send", the cockpit says "Reply sent." — but for a real channel the send either silently no-ops through the MockAdapter or throws `NotImplementedError`. Write-back to the helpdesk was deliberately cut, and **no supported alternative exists** (no copy-to-clipboard, no outbound). The customer never receives the reply. | **Product decision + M** |
| **PR-02** | **Customers can never receive their status link.** | `/status/<token>` is the emotional core, but nothing ever *delivers* the link to a backer — no outbound email (Resend isn't wired for this), no operator "copy link" affordance. The status page, widget, and CSAT are unreachable in the real workflow. | **Product decision + M** |
| **PR-03** | **CSV import corrupts the wait clock.** | Import resets every backer's `fulfillmentStart` to *now* and hardcodes `productionStage="production"`. So a backer who's been waiting 80 days shows as day 0 — and the drafts are wrong for *exactly* the long-wait customers the product exists to serve. | **M** |
| **PR-04** | **Can't import the target customer.** | CSV import hard-rejects any file over 2000 rows (`IMPORT_ROW_CAP`), but the crowdfunding ICP ships **5k–50k backers**. A normal BackerKit export can't be imported at all. | **S–M (chunk it)** |
| **PR-05** | **Operator auth fails open.** | The gate is `if (DEMO_MODE !== "false") allow`. Any mistype/omission (unset, "true", "False", trailing space) serves the entire cockpit + every merchant's PII + export **unauthenticated**. `DATA_DRIVER=mongo` is set independently, so "real data + auth off" is a one-keystroke deploy mistake with no guardrail. | **S** |
| **PR-06** | **Unmatched webhook ticket corrupts data.** | When an inbound ticket's order can't be matched, it silently attaches to *another* customer's most-waited open order and reassigns the ticket to that customer. **Not** gated by DEMO_MODE — it happens on real data, unconditionally. | **M** |

**PR-01 and PR-02 are the ones that need YOU** — they're not bugs, they're an unfinished product decision (how does a reply/link actually reach the customer now that write-back is cut?). The other four are engineering fixes. See "Decisions needed" at the bottom.

---

## The definitive go-live env checklist (verify in Vercel before any pilot)

Derived from every `process.env` read in the code vs `.env.example`. **Two independent switches (`DEMO_MODE` + `DATA_DRIVER`) both must be right or the app runs in a silently-broken hybrid.** `.env.example` is stale and missing over half of these (PR-18).

| Var | Correct value for a real pilot | What breaks if wrong/missing |
|-----|-------------------------------|------------------------------|
| `DEMO_MODE` | `false` (exact string) | Anything else = cockpit + PII served **unauthenticated** (PR-05). Unset = demo mode on real data. |
| `DATA_DRIVER` | `mongo` | Default is the **ephemeral in-memory JSON store** — a live pilot's data silently vanishes on redeploy/restart (PR-05 data-loss twin). |
| `MONGODB_URI` | the Atlas connection string | No persistence; app can't read/write. Missing from `.env.example` (PR-18). |
| `APP_PASSWORD` | a strong secret (enforce min length) | The one shared credential for the whole cockpit. Undocumented in README (PR / eng-P1-env). |
| `AUTH_SECRET` | a long random string | Session cookies can't be signed/verified → operator locked out. Undocumented (PR / eng-P1-env). |
| `WEBHOOK_ROOT_SECRET` | a long random string | **Total silent ingest lockout** — every webhook rejected, indistinguishable from "not connected yet" (PR-08). |
| `CRON_SECRET` | a long random string | The daily outcome sweep **silently never runs** on any deployed build (PR-15) → resolved_quiet attribution + forecast rot with no error. |
| `STATUS_TOKEN_SECRET` | a long random string | Falls back to a **repo-visible hardcoded literal** (`dev-only-change-me`) → status tokens forgeable (PR-16). |
| `APP_URL` | `https://www.tideover.app` | Two conflicting defaults across the code (PR-19); wrong value breaks generated links. |

**Ship two guardrails with this (both small, both in the eng doc):** (1) a boot-time assertion that refuses to serve when `DATA_DRIVER=mongo` unless `DEMO_MODE==="false"` (couples the two switches so they can't disagree); (2) a `RELEASE.md` smoke step that curls an operator route on prod and asserts **401** (today's smoke only checks public pages — it would not catch PR-05).

---

## P2 — real-merchant risks, first 24 hours (fix before scaling past the pilot)

Full text + evidence in the JSON. Grouped:

**Ingest / webhook**
- **PR-08** · `WEBHOOK_ROOT_SECRET` absent = silent total ingest lockout, looks identical to "not connected." → fail *loud*: health check + setup-screen signal.
- **PR-12** · Live ingest requires a body-HMAC the shipped Gorgias/Zendesk setup instructions **can't produce**, and onboarding copy falsely says unsigned is accepted — so the documented connect path ingests **zero** tickets in prod. → reconcile the HMAC requirement with what the vendor UIs can actually send (this is the make-or-break for the webhook wedge).
- **PR-17** *(P3)* · No in-product signal when ingest silently drops/rejects a ticket.

**CSV import**
- **PR-09** · Re-importing the same backer CSV silently **duplicates every order** when the export has no id column → inflates every order-derived proof number. → dedupe on (merchant, email, source-ref) with a unique index.
- **PR-13** · Import isn't transactional and hides partial-failure counts on mid-loop errors → merchant can't tell what imported.

**Send / operator**
- **PR-10** · No atomic double-send guard — two concurrent approvals (two tabs, retry) both send for real once delivery is wired. → guard before PR-01 ships delivery.
- **PR-11** · No per-merchant tenancy: one shared password, and every operator page lists **all** merchants unfiltered. Fine while single-merchant; becomes PR-01-severity the instant a second pilot (or a demo seed) shares the DB. → **operational rule for now: never seed demo merchants into the pilot's Mongo DB;** build session→merchant binding before merchant #2.

**Status links / tokens**
- **PR-14** · No self-serve way to revoke/rotate a leaked `/status/[token]` link.
- **PR-16** · `STATUS_TOKEN_SECRET` hardcoded fallback (also in the env table).

**Config hygiene (P3, batch)**
- **PR-18** `.env.example` stale · **PR-19** `APP_URL` dual defaults · **PR-20** unreachable "accept unsigned in demo" branch contradicts its comment · **PR-21** widget-submit has no rate-limit/size-cap.

---

## Decisions needed from you (these gate the build)

1. **How does an approved reply reach the customer now that write-back is cut? (PR-01)** Options: (a) **copy-to-clipboard** — the cockpit shows "Approved — paste this into {helpdesk}", the rep pastes it back (honest, zero new infra, fits the "bolt-on" story); (b) **wire outbound email via Resend** for the email-channel merchants (real send, needs the sending domain you flagged); (c) both, by channel. My lean: **(a) for v1** — it's truthful, shippable tomorrow, and matches "we draft, you send." Confirm.
2. **How does a customer get their status link? (PR-02)** Same shape: (a) the reply draft *includes* the status link so it rides along with the WISMO answer the rep sends (elegant — one action delivers both); (b) outbound email. My lean: **(a)** — fold the status link into the drafted reply. Confirm.
3. **Helpdesk scope for the pilot (PR-12 + wizard-B1):** only **Gorgias** is actually wired; Tidio/Intercom aren't. Trim the connect picker to **Gorgias + email-forwarding** for now, or invest in more? My lean: **trim to what works**, label the rest "coming soon."

Everything else here is an engineering fix with a clear proposal — no decision required.
