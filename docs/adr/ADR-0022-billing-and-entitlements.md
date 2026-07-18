# ADR-0022 — Take money: Stripe Checkout, a plan on the merchant, and entitlements that are actually enforced

**Date:** 2026-07-16 · **Status:** accepted (Dylan signed off 2026-07-16; the trial-expiry + reminder-email system builds now, the Stripe payment half stays gated on keys) · **Task:** NS1 / NORTH-STAR P1

## Context

A stranger cannot give Tideover money today. The gap sweep (`docs/gap-sweep-2026-07-16/audit-revenue-path.json`) traced the whole chain and every link past the login wall is missing:

- **No payment code exists.** No `stripe` dependency (`package.json`), no `STRIPE_*` env (`.env.example`), no checkout route, no webhook receiver. Dylan activated a Stripe account in early July; zero code followed.
- **No plan lives anywhere.** `Merchant` (`lib/types.ts:257-352`) has no `plan`/`tier` field; onboarding never asks which plan. The published $299/$499/$749 ladder is decorative.
- **No trial clock.** The 14-day no-card trial promised on `/pricing`, Home, and `/terms` has no start, no expiry, no lockout — `Merchant.createdAt` is never read for it.
- **The caps are plan-blind.** `TEAM_SEAT_CAP = 10` (`lib/team.ts:20`) and `IMPORT_ROW_CAP = 50_000` (`lib/csv.ts:85`) apply flat to every merchant, so a $299 Starter gets the $749 Scale allowances for free — a revenue leak, not just a UX gap.
- **The copy claimed a system that isn't built.** The pricing FAQ promised self-serve plan changes "take effect immediately, and we settle the billing difference" — a proof-only violation in our own copy, corrected this session (commit `c11719c`). Terms still say "cancel at any time" with no subscription object to cancel and no refund policy on a prepaid annual term.

The published ladder is already committed on the public site, so it is **not** the open question:

| Plan | Monthly | Annual | Seats | Order cap (in the wait window) |
|---|---|---|---|---|
| Starter | $299 | $2,990 | 1 | 1,000 |
| Growth *(Recommended)* | $499 | $4,990 | 3 | 5,000 |
| Scale | $749 | $7,490 | 10 | 15,000 |
| Beyond Scale | custom | — | custom | custom |

What is open is the **mechanics**: how billing is collected, how the trial ends, what happens at the cap, and the refund posture on prepaid annual. This ADR proposes those, for sign-off.

## Decision (proposed)

### 1. Stripe Checkout + Billing Portal + webhooks — never a hand-rolled billing UI

Ride the vendor, exactly as the send-path and helpdesk ADRs ride theirs. Stripe hosts Checkout (card capture — **we never touch card data**, PCI scope stays on Stripe, which is why entering payment details is forbidden to us anyway) and the Billing Portal (upgrade/downgrade, cancel, invoices, receipts — all free, none hand-built). We own only: a Checkout-session create route, a signed webhook receiver, and the entitlement lookups.

### 2. `plan` + `subscriptionStatus` on the merchant, sourced from Stripe, never from the client

Add to `Merchant`: `plan: "starter" | "growth" | "scale" | null` and `subscriptionStatus: "trialing" | "active" | "past_due" | "canceled" | null`, plus `stripeCustomerId`. **The webhook is the only writer** of these fields — the client never asserts its own plan (the same trust boundary as ingest: verify at the door, never trust the caller). Onboarding does not ask for a plan; Checkout does, and the webhook records it.

### 3. The 14-day no-card trial is a derived clock, and it ends soft

`trialEndsAt = merchant.createdAt + 14d` (the field already exists). Surface a countdown in `/app`. At expiry, with **no card on file** (the trial takes none, matching the FAQ): **soft-lock** — the cockpit goes read-only behind a "pick a plan" gate, data is never deleted and nothing auto-bills. A merchant returns to full function the moment they pick a plan. *(Recommended over a hard lock or a silent downgrade; see Decisions-for-Dylan.)*

### 4. Entitlements enforced at the two choke points that already exist

A single `lib/entitlements.ts` maps `plan → { seatCap, orderCap }` from the table above. The two flat caps become per-plan lookups:

- `TEAM_SEAT_CAP` → `entitlementsFor(merchant.plan).seatCap` at `lib/team-route.ts:81` and the team page.
- `IMPORT_ROW_CAP` → the plan's `orderCap` at `lib/import.ts:117` and `lib/onboarding-schema.ts`. The 50,000 flat value stays as a **technical hard ceiling** (serverless body limits) above the plan cap.

### 5. Over-cap and cancellation stay on-brand: never cut a merchant off mid-wait

- **Over cap:** soft overage + a contact, never a hard mid-wait stop — the pricing FAQ already promises exactly this ("Nothing hard-stops mid-wait… we reach out about the next tier"), and it is the right posture for a product whose whole pitch is *not* abandoning a merchant during the crunch. The cap gates *new* imports past a grace margin, not the running queue.
- **Cancellation:** Stripe Billing Portal cancels; the subscription runs to the paid-through date, then lapses to soft-lock (§3). No data deletion on cancel (`/terms` already promises export any time).

### 6. The webhook mirrors the ingest-auth discipline

`/api/stripe/webhook` verifies the Stripe signature over the **raw body before any parse** (the exact pattern `lib/ingest-auth.ts` established), is idempotent on Stripe's event id, and fails closed. Events handled: `checkout.session.completed`, `customer.subscription.updated|deleted`, `invoice.paid|payment_failed`.

### Proof-only holds here too

Billing shows Stripe's real numbers and nothing else — no "you saved $X," no projected ROI on an invoice. The evidence pack and the dashboard keep their measured-only discipline; money is the one place a fabricated number is also fraud.

## Decisions for Dylan — RESOLVED 2026-07-16

1. **Ladder → enforced entitlements: SHIP AS PUBLISHED.** ("ship as is we can always tweak it later.") The table's prices/seats/order caps become the enforced entitlements, verbatim.
2. **Trial-expiry: BUILD IT — soft-lock + a full reminder-email lifecycle** ("lets actually create the trial expiry though thats important. we need reminder emails etc all that saas type stuff"). Welcome on signup, a mid-trial nudge, an ending-soon warning, and a trial-ended email; soft-lock (read-only, data kept, no auto-bill) at expiry. **This is the build starting now** — it needs no Stripe (the trial is no-card).
3. **Refund posture: STANDARD NO-REFUNDS, except any guarantee we make in the sale** ("refund make it standard no refunds apart from any guarantees we make in sales"). So: no mid-term refund on a prepaid term; the advertised first-cycle guarantee stands. `/terms` gets a matching refund/cancellation clause (flag for a counsel skim before publish).
4. **Stripe keys: NOT present.** Verified from code + `.env.example` (I did not open `.env.local`, per policy): there is no Stripe code and no `STRIPE_*` in the documented template, so nothing consumes a key even if one is pasted in. The **payment/Checkout half stays gated** until Dylan sets `STRIPE_SECRET_KEY`, `STRIPE_WEBHOOK_SECRET`, `STRIPE_PUBLISHABLE_KEY` and the price IDs (and either creates the Products/Prices or authorizes API creation — a credentialed action needing his explicit go).
5. **Over-cap: soft-overage-then-contact** (recommended, matches the FAQ). Grace margin to confirm at wiring time (default 10%).

## Build split (from the decisions above)

- **NOW (no Stripe): the trial + entitlement system.** Plan/trial fields on `Merchant`; `lib/entitlements.ts` (ladder → caps, with a backward-compatible default so seed/demo/plan-less merchants are unaffected); `lib/trial.ts` (the derived 14-day clock + reminder milestones); the outbound email sender + lifecycle templates (raw-fetch Resend, reusing `RESEND_API_KEY`, no new dependency); a `/api/cron/trial-reminders` daily job (alongside the existing `sweep-outcomes` cron). Soft-lock **enforcement** in the app + the countdown UI land as their own careful slice (they touch app/hot surfaces and carry lockout risk).
- **GATED on keys: the payment half.** Stripe Checkout create route, the webhook, plan written by Stripe, per-plan cap enforcement at the two choke points, Billing Portal link.

## Out of scope for v1

Usage-based/metered billing; seat proration edge cases beyond Stripe's defaults; dunning beyond Stripe's built-in retries; **multi-currency** — the app hardcodes USD/en-US (`lib/onboarding-schema.ts:71`), a separate gap (NORTH-STAR P6) that blocks non-US merchants and should be sequenced before international paid signups, not bolted onto billing.

## Consequences

- The published pricing stops being decorative: a stranger can trial → pay → be correctly entitled, and the caps mean something.
- PCI and dunning liability stay entirely on Stripe; we add ~3 small surfaces (Checkout create, webhook, entitlements) and one Billing Portal link.
- Every downstream P1 item (trial clock UI, cancellation, invoices) either falls out of the Billing Portal for free or is a thin read of the `plan` field this ADR adds.
- **Blocked on the gate above.** Until Dylan answers §Decisions-for-Dylan and supplies keys, this stays `proposed` and no billing code lands — improvising a tier ladder or a refund policy is exactly the class of decision the charter reserves for Fable + Dylan.
