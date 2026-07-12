# TORCH PASS — TIDEOVER

**To:** the engineer-operator taking this over.
**From:** the sprint that ran 10 merchants and 136 tickets through the real product and then spent itself fixing what that exposed.
**Date:** 2026-07-12. **Branch:** `sprint/tideover-finalization`.

Read this once, top to bottom. It is the only document you need to run this company. Everything else it points at.

Three rules before you touch anything:

1. **Proof-only.** A number the product cannot measure must never be displayed as if it were measured. A customer is told a confidence band, never a date. This is not a style preference; it is the entire reason the product is allowed to exist.
2. **Derive, never freeze.** Anything that is a function of elapsed time must be computed at read time. The single worst bug in this product's history was one stamped value.
3. **The gate is `cd tideover && npm run verify && npm test`.** Green or it does not ship.

---

## 1. THE MISSION IN ONE PAGE

### What it is

Tideover is the workflow layer for the **60 to 120 days between the charge and the shipping label**.

Every adjacent product's data model is blind to that window. A helpdesk's core object is a ticket. A tracking app's core object is a carrier scan. A pledge manager's core object is a survey. None of them can express "this customer is on day 73 of a 90-day wait, has written twice, and is about to charge back." That sentence is Tideover's core object.

Inside the window, the product does four things:

- **Ranks** the inbox by refund risk, not arrival time.
- **Drafts** a reply in the merchant's own voice that states what is physically happening and refuses to invent a date.
- **Publishes** a customer-facing status page with a confidence band instead of a promise.
- **Proves** it worked, using only events it actually recorded.

### Who it is for

The **distressed mid-size campaign**. A founder in fulfillment, doing 20+ hours a week of support, watching a comment wall turn on them. Crowdfunding creators (Kickstarter / BackerKit / Gamefound CSV) and Shopify preorder brands with long lead times.

Not the pre-pain merchant comparing us to a $60 Gorgias plan. If a merchant's monthly update cadence is working and their inbox is calm, they are not our customer and we should say so.

Market size is small and real: roughly 800 to 1,500 campaigns a year globally raise $100K+. This is a wedge, not a land grab. See `docs/recon-2026-07-10/MARKET-RECON.md`.

### Why it wins

Not because any single piece is unique. Status pages exist ($9/mo, StatusPro). Hard-date-free drafting is a system-prompt rule anyone can copy. The win is the **combination nobody offers**, aimed at a window nobody's data model can see, sold to a buyer who is findable at a public moment of pain.

And underneath the combination, one thing that is genuinely hard to copy: **the discipline**. A product that will say "I don't have that" is the only kind that survives two backers comparing screenshots in a Discord. Every competitor's incentive is to answer. Ours is to be right.

### "The Swan of presale support" — what that means as a standard

getswan.com is the model, and it is a standard, not an aesthetic:

- **Surgical copy.** What it is, who it is for, and the objection handled — in as few words as will carry it. Every sentence earns its place. No padding, no volume, no em-dash filler.
- **Crafted design.** Made, not templated. The paper/tide system in this repo is original and load-bearing. Design is a truth claim: a product that looks assembled will be assumed to be assembled.
- **No invented proof.** No borrowed logos, no fabricated testimonials, no metric we did not measure. `[CASE STUDY PLACEHOLDER]` stays a literal token until a real one exists.

Swan grew extremely fast on those three. We copy the mechanics, never the copy.

### The one sentence that must never be violated

> **Tideover never states a fact it cannot verify, never quotes a metric it did not measure, and never commits the merchant to an action the system cannot perform.**

That is ADR-0002 (`tideover/docs/adr/ADR-0002-repository-seam-and-proof-doctrine.md`), and it is enforced in code by `proof-lint`, the eval harness, `lib/proof.ts` (`assertNoHardDate`), `lib/drafting/llm-lint.ts`, and `lib/drafting/capabilities.ts`. If you find yourself arguing for an exception, you have found the thing that kills the company.

---

## 2. THE STATE OF THE UNION

### The stack

One Next.js 14 App Router app (`tideover/`), TypeScript strict, Tailwind. Marketing site + operator cockpit + API in one deployment on Vercel, backed by MongoDB Atlas. Architecture: **ADR-0001**. Disciplines: **ADR-0002**. Full decision log: `tideover/docs/adr/README.md` (21 ADRs, all current).

### What is live

| Surface | State |
|---|---|
| `www.tideover.app` | Marketing + public demo. Demo mode: seeded JSON, every surface watermarked SAMPLE DATA. |
| `app.tideover.app` | The real cockpit. Login-gated, live Mongo. |
| **Mode** | Derived from the request **host** (ADR-0017). `REAL_APP_HOST` runs real; everything else runs demo. `DEMO_MODE` overrides per-env. |
| **Auth** | **Auth0** per-user accounts + per-merchant tenancy (ADR-0020). Each user owns at most one merchant (`ownerSub`). Five env vars, all-or-nothing: a partial set returns an explicit 500, never a silent fallback to the old shared password, never an open gate. |
| **Datastore** | Mongo Atlas (ADR-0003). Real mode **refuses to boot** without `MONGODB_URI` rather than fall back to the in-memory JSON store, because that fallback would be silent pilot data loss. Live DB (`tideover_live`) is strictly separate from the demo DB. |
| **LLM** | **DeepSeek** (ADR-0018), behind the QA gate. Unset key = deterministic drafting, never a crash. |
| **Ingest** | Resend **inbound** email (ADR-0008): merchant forwards their support alias to `<inboxToken>@in.tideover.app`. Plus per-merchant helpdesk webhooks (ADR-0011 + **ADR-0021**). |
| **Cron** | Vercel Cron, daily outcome sweep (ADR-0013). Fails closed in production. |

### What is built and real (with pointers)

The engine room, all of it exercised by the eval harness:

- `lib/engines/reassurance.ts` — **UNTOUCHABLE.** The reply engine.
- `lib/engines/refund-risk.ts`, `lib/engines/gift.ts` — scoring and the goodwill gate.
- `evals/` — **57,614 invariant assertions over 3,760 combos, 0 violations** + 55 golden fixtures (ADR-0006). The invariant sweep is property-based and authoritative. It is the thing that makes doctrine violations impossible to merge by accident.
- `lib/repositories/` — the seam (ADR-0002/0003). Nothing reads a driver directly. JSON driver for demo/test, Mongo for production, identical shapes.
- `lib/repositories/tenant-scope.ts`, `lib/tenant.ts`, `middleware.ts` — tenant isolation.
- `lib/import.ts` + `lib/csv.ts` — CSV import (ADR-0010). 50k rows, chunked. Kickstarter / BackerKit / Gamefound / Shopify shapes.
- `lib/ingest-route.ts` + `lib/ingest-auth.ts` + `lib/channel-adapters/ingest-vendors.ts` — per-vendor webhook auth (ADR-0021).
- `lib/status.ts` + `app/status/[token]` — customer status pages, HMAC-signed tokens, append-only view ledger.
- `lib/evidence.ts` — the chargeback evidence pack.
- `lib/service.ts` — the application seam. Routes stay thin (a Next route imports `next/server`, which breaks the node test runner).

**Gate status, verified by me on the current tree just now:**

```
tsc --noEmit          clean
npm run lint          clean
npm test              480 / 480 pass
npm run seed-check    pass
npm run proof-lint    pass
npm run eval          57,614 invariant assertions, 0 violations
                      55 / 55 goldens byte-identical
```

### What is simulated

**`docs/sim-2026-07-12/`.** Ten synthetic merchant personas (p01–p10), built from real Reddit / Kickstarter-comment / Shopify-Community voices, run through the **real code** for 30 simulated days each: real importer, real ingest, real engines, real DeepSeek drafter behind the real QA gate.

48,180 orders. 136 tickets. 135 LLM drafts. 0 crashes.

**Every number in those reports is SIMULATED.** Not a customer result, not a testimonial, not a measured outcome. The economic tables are formulas with their assumptions labeled inline. Two independent analyses were run against the same 136 tickets (`TEN-CUSTOMER-SIMULATION.md` and `SIMULATION-SECOND-READ.md`); they disagree on some rates and converge on every structural finding. Read both. They are the most valuable documents in this repo.

### What is fake-but-looks-real

This category is supposed to be empty. It is not. **There is exactly one item, and it is serious.**

> ### "Send this gift" sends nothing.
>
> `components/product/GiftSuggestion.tsx` renders **"Send this gift"** → **"Confirm"** → **"Gift logged — {name} sent."**
>
> `lib/gift-send.ts:authorizeGiftSend` re-authorizes the tier server-side (correctly, and it refuses locked or cross-merchant gifts) and then **writes a `gift-sent:*` tag**. Nothing is fulfilled. There is no budget, no cap, no cost rollup, no delivery. In the simulation, 15 to 17 gifts were "sent" across ten merchants. Zero customers received anything.
>
> And it compounds: `lib/evidence.ts:379` puts `giftGestures` into the **chargeback evidence pack**. A rebuttal document submitted to a card network reports goodwill gestures the customer never received.
>
> **Fix it in your first hour.** The cheap, correct fix is a rename: the button becomes "Log a goodwill gesture," the confirmation becomes "Logged. Send it yourself and it stays on the record," and the evidence pack labels the field as an internal log entry, not a delivered gesture. That is 30 minutes and it makes the product truthful. Delivering gifts properly is a later, larger decision (see §6).

Nothing else in the product claims an outcome it did not produce. The deterministic drafter's `ManualAdapter` is scrupulous about this and should be your model: it returns `externalId: null` and a real `sentAt`, because "the operator pasted this" is a real human action and no vendor stamped an id on it. It never fabricates one.

---

## 3. THE TRUTH ABOUT QUALITY

### The verdict from the 10-customer simulation

The drafting layer held. The layer underneath it did not.

**What held:**

- 135 of 136 drafts written by the model, in the merchant's voice, p50 2.6s / p90 3.6s.
- **136 of 136 carried a confidence band and the merchant's signoff. Zero hard dates shipped.** The proof-only doctrine survived 136 live generations.
- 18,400 rows imported in 37 chunks with zero skips.
- 13 of 14 chargeback threats landed in the top 2 of the live queue.
- Security seams held: cross-merchant order attachment refused at ingest, gift authorization re-derived server-side, unmatched tickets refused to borrow a stranger's order.

**What did not:**

**Send-as-is rate: 24% on the strict read, 44% on the lenient read.** Take the strict one. The two analyses used different bars; the pessimistic bar is the one your customers use.

**The classes of failure:**

1. **Wrong physical fact.** 36% of sent replies stated the wrong production stage for the customer's own order, in the merchant's voice, over their signature. Root cause: the stage was stamped at CSV import and nothing advanced it. Every reply described where the order was on the day the merchant uploaded their file.
2. **Invented actions.** Five replies promised an address update against a domain model with no address field. One went to a customer moving a parcel away from her ex. The old QA gate was a date lexicon; it had no concept of a capability we do not have.
3. **Incoherent bands across a cohort.** Because the band derived from the frozen stage, a 61-day waiter was told "weeks 13-15" and a 96-day waiter "weeks 1-4." They are in the same Discord.
4. **The overrun clamp.** Past the last band, the code clamped to the latest stage, which is always Dispatch. ~4,758 of one merchant's 9,000 backers were told their CNC machine was "out of your regional warehouse." Not one had been built. One of them had already written "I am building a case."
5. **The floor was a trapdoor.** When the QA gate blocked a draft, the deterministic fallback shipped something worse: it fabricated "Your tracking is generating" (the product holds no tracking data at all), fired a refund-save script at a calm customer, and never answered the question.
6. **Metrics that lie.** The dashboard read "deflection 100%" (it was `resolved / tickets`, a reply-completion rate), "$0 at risk / 100% unknown," "0 at-risk customers," and "Not yet measured" on all four baseline metrics. On 10 of 10. The product could not show its own value to the person paying for it.
7. **Silent connector death.** Gorgias cannot compute the HMAC our ingest demanded. Help Scout signs with its own scheme. Zendesk had no path. Four of ten merchants, 17,450 orders, would have run a full month on a calm empty queue that looked exactly like a quiet week.

**The most important sentence in the whole simulation:** *the bad drafts do not read as bad.* They are fluent, calm, in-voice and confidently wrong, and the UI offers one-click approve on all of them. The operator approved 136 of 136.

### What this sprint fixed

All of it is in the working tree right now: 46 files modified, ~20 new, 3,524 insertions, 480 tests green. Each new module carries a header comment naming the exact simulation finding it kills. Read those headers; they are the best documentation in the repo.

| Finding | Fix | Where |
|---|---|---|
| Frozen stage / half-open bands / overrun clamp | **Derive the stage from the wait at READ time.** Inclusive band boundaries. A real overrun stage instead of clamping to Dispatch. | `lib/repositories/live-stage.ts` |
| No merchant "current word" on production | **The production status board.** The merchant's own current statement, scoped, and every reply reads it. | `lib/status-board.ts`, `app/api/status-board/`, `app/app/status/`, `components/product/StatusBoardComposer.tsx` |
| The model invented **actions** | **The capability registry.** A list of what Tideover cannot do and the language that would commit the merchant to it anyway. The gate now blocks the promise, not just the date. | `lib/drafting/capabilities.ts` (489 lines, read the header) |
| The floor was worse than the block | **The safe floor.** Claims nothing. Names the gap. Offers a human. | `lib/drafting/safe-floor.ts` |
| Banned phrases were prompt-only | Enforced **post-generation**, with word boundaries. | `lib/drafting/llm-lint.ts` |
| Gorgias/Help Scout/Zendesk cannot connect | **Per-vendor ingest auth.** Bearer for Gorgias and Zendesk, HMAC-SHA1 for Help Scout, HMAC-SHA256 generic. Every credential derived from `(WEBHOOK_ROOT_SECRET, inboxToken)`, so no new stored field and rotating the token rotates everything. Still fails closed. | `lib/ingest-auth.ts`, `lib/channel-adapters/ingest-vendors.ts`, **ADR-0021** |
| A broken connector looked like a quiet week | **Silence is the alarm.** The old check returned `quiet: false` when nothing had ever arrived. Polarity inverted, counters added, reasons surfaced on `/app/setup`. | `lib/ingest-health.ts`, `lib/setup-status.ts` |
| "Deflection 100%" | **Measured, or not claimed.** A status-page view with no ticket from that order inside the window. Both halves are recorded facts. | `lib/deflection.ts` |
| Queue degenerated in a crisis | **Rank relative to the merchant's own live distribution**, not an absolute bar. | `lib/queue-rank.ts` |
| `disclosedEta` empty on 48,180/48,180 orders | Captured at import, counted when absent. | `lib/import.ts`, `lib/csv.ts` |
| Region hardcoded "US"; no campaign/wave | Written from the file. `regionlessRows` counted so the merchant knows what they cannot scope. | `lib/import.ts` |
| Baseline unwritable; no ScriptVariants seeded | Both given a write path at onboarding. This resurrects the outcome ledger, Script Performance, CSAT attribution and the forecast. | `lib/onboarding.ts`, `lib/baseline.ts`, `lib/forecast.ts` |
| Gift "warrant" gate permanently open | Deep-wait threshold now relative to the merchant's own window. | `lib/engines/gift.ts` |

New test files, each pinning a class of failure so it cannot return: `stage-derivation`, `drafting-safety`, `ingest-vendor-auth`, `deflection`, `dashboard-truth`, `metric-truth`, `queue-rank`, `status-board`.

### What is STILL broken

Do not launder this list. It is the real one.

1. **Nothing sends.** Every `ChannelAdapter.sendReply` throws `NotImplementedError` except `ManualAdapter`, which records the human paste. `package.json` has no outbound email dependency. Resend is wired for **inbound only**. Approve = copy to clipboard. **This is the #1 gap in the product.**
2. **The status board reaches nobody.** It writes a row and renders a page. There is no broadcast, no cohort email, no push of the status link at import. The status link still only rides on a reply footer, which means **you have to complain to be handed the link to the page that would have prevented your complaint.** Deflection is now *measurable* and will read approximately zero, because almost nobody ever gets a link.
3. **"Send this gift" sends nothing.** See §2. Rename it today.
4. **No helpdesk write-back.** Tickets can now get *in* from Gorgias, Zendesk and Help Scout. The reply still leaves via the operator's clipboard. Help Scout's `draft: true` is the fix and it is queued (INT1).
5. **No address field.** The capability gate now correctly refuses to promise an address change. The pain is still unserved. 10 of 10 personas hit it.
6. **The public comment wall is invisible.** Eight pile-on events in the simulation (300+ comments in 12 hours; 400 forum posts in 24 hours). The loudest hour in every persona, and the product cannot see it.
7. **`editedRatio` has never been observed.** Zero times. The simulation harness structurally could not emit "approve-edited." It is the load-bearing input to the entire value model and the whole 10x spread between the floor and ceiling economics. **It is fixable in one afternoon with five real merchants.**
8. **The 55 goldens are a regression tripwire, not verified-correct.** The eval prints it every run: `55/55 goldens still pending human review (D9)`. They freeze current behavior; they do not bless it. Dylan owes a 30-minute review.
9. **Seats are sold; ticket assignment does not exist.** Three agents open the queue and draft the same reply.
10. **Pricing is on the wrong axis.** The ladder prices on order count. Value scales with tickets-in-window × refund risk. One persona has no tier at all (18,400 orders).

---

## 4. THE OPERATING CHARTER

### The gate

```
cd tideover && npm run verify && npm test
```

`verify` = seed-check → proof-lint → **eval** → lint → build. This is exactly what CI runs (Node 22). Green or it does not ship. `CONTRIBUTING.md` is the entry point.

> **Local caveat:** a dev server owns `:3000` and `.next` on this machine. Do not run `npm run dev` or `npm run build`. Run the other four stages individually plus `npx tsc --noEmit`; let CI run the build.

### The golden / invariant contract

- The **invariant sweep is authoritative.** It is property-based: 57,614 assertions over 3,760 combos of seed shape × wait-day × stage × sentiment × velocity. A real fix keeps it green. **If it goes red, you broke a doctrine invariant. Stop. Do not regenerate anything. Report.**
- The **55 goldens are a tripwire.** If you legitimately change engine output, run `npm run gen-goldens`, then read the diff line by line and report a summary of the drift. A golden diff you cannot explain is a bug you have not found yet.
- `lib/engines/reassurance.ts` and `evals/` are **untouchable** without an explicit decision.

### Hot files (serialized — one in-flight change at a time)

```
app/app/inbox/page.tsx
app/app/page.tsx
components/product/DraftRail.tsx
components/product/ApprovalBar.tsx
lib/engines/reassurance.ts
```

Two agents in these files at once will silently clobber each other. Own them or do not touch them.

### ADR discipline

An ADR **first** for: a new dependency, an engine change, an integration, a pricing decision, or a data-exposure decision. `tideover/docs/adr/TEMPLATE.md`. Twenty-one exist; they are short, current, and they are the reason this codebase can be handed to a stranger.

### Tenant isolation

- Everything goes through `lib/repositories`. Nothing reads a driver directly.
- Every query is merchant-scoped (`lib/repositories/tenant-scope.ts`). A cross-merchant read is a security bug, not a logic bug.
- Auth0 `ownerSub` → one merchant. Operator surfaces only ever see the signed-in user's merchant.
- Ingest re-derives merchant identity from the URL token, never from a request parameter. Gift sends re-authorize server-side. A trusting client is never taken at its word.
- `lib/__tests__/tenant-isolation.test.ts` is load-bearing. If you touch the seam, it must stay green.

### What must never be improvised

**Auth. Billing. Migrations. Customer-facing promises.**

In those four, ambiguity stops and surfaces to Dylan. No agent improvises. The reasons are specific:

- **Auth** fails open the moment someone gets clever. The Auth0 five-var rule is deliberately all-or-nothing.
- **Billing** is not built. Do not build it on a guess about the tier ladder.
- **Migrations** touch a live pilot store with no undo. `npm run backup` first (`docs/ops-backup.md`).
- **Customer-facing promises** are the whole product. A sentence that commits the merchant to something the system cannot do is a lawsuit-shaped risk, not a churn-shaped one.

### Copy rules

- Never the word "honest" in user-facing text. (The model once used it *and then narrated the rule about not using it*, in a reply to a journalist with a 90,000-subscriber audience.)
- No em-dash padding, no volume, no slop. `gtm-assets/copy-standard.md`.
- Never claim nobody else offers status pages. StatusPro sells them at $9/mo.
- Never quote deflection, first-response time, refunds prevented, disputes won, or CSAT until measured. The simulation produced no defensible number for any of them.

---

## 5. THE ROADMAP THAT WINS

Sequenced. The order is the argument.

### Step 0 — This week. Land the sprint.

Merge the working tree, deploy, smoke. **Rename the gift button before you deploy anything else** (§2). Get the D9 golden review off Dylan's desk (30 minutes; the eval nags on every run until it is done).

### Step 1 — The send seam and the status-link push. *This is the win.*

Every hour of value in every economic model in this repo comes from **reducing the cost of a ticket**. Not one comes from **reducing the number of tickets**. The status page is the only mechanism in the product that can do the second thing, and today it reaches 0.3% of backers, exclusively the ones who already complained.

Build:

- **One `Deliverer` seam** behind the existing `ChannelAdapter` contract. `EmailDeliverer` (Resend, already a subprocessor, already wired inbound) and `NoopDeliverer` (today's manual paste).
- **Push the status link at import**, not as a reply footer.
- **On a status-board post, enqueue a cohort send**: the merchant's update plus each backer's own status link.
- **Never fabricate a delivery receipt.** A manual paste stays "Copied," never "Delivered." The existing UX copy is already scrupulous here. Keep it exactly.
- Ship unsubscribe/preferences with it. CAN-SPAM and GDPR arrive with the first email.

When this lands, four things turn on at once: the status page becomes a deflection surface, the announcement stops being a database row, the WISMO forecast has a cohort to forecast against, and **deflection becomes a number we measured instead of a number we asserted.** That last one is the renewal argument.

### Step 2 — Help Scout. The one integration that matters.

`draft: true` on a reply thread is **the only native draft-back in the market** (verified at the primary source). Approve in Tideover, the draft lands in the merchant's own composer, they hit send. It deletes the worst objection in the demo ("how do replies actually reach my backers?") with zero UX compromise and **without Tideover owning deliverability**.

And it serves both segments with one adapter: Help Scout ships a documented Kickstarter email relay, so a creator with no helpdesk gets onboarded onto Help Scout Free/$25, their KS messages and BackerKit forwards arrive as tickets, and the approved reply relays back inside Kickstarter.

It is on the board as **INT1**. Size it at 2 to 4 weeks solo, not the 1 to 2 the research lanes guessed.

Zendesk is a fast clone of the same seam. Build it when two prospects are on it, not before.

### Step 3 — Five free merchants, instrumented.

**One goal: log `editedRatio`.** It is the input the entire value model swings on and we have zero observations of it. Also log deflection (now that it is real) and stage-correctness.

Do not take paid money before this. The economics are formulas until a real operator edits a real draft.

### Step 4 — Then take money.

### What NOT to build, and why

- **Own email send/receive infrastructure. NEVER.** SPF/DKIM/DMARC, bounces, threading, spam liability. It is a mini-helpdesk build competing with $10 to $60/mo products, at 10 to 30x the cost. Ride the helpdesk relays. Use Resend as a vendor, never as infrastructure.
- **Social / comment monitoring. NO.** Kickstarter comments are not capturable as tickets. Social DMs are shrinking. The status page is the comment-storm answer. Name it as a known gap and do not let it grow the bet.
- **Automation-first. Auto-send. Auto-refund. NO.** Human approval is the product's legal and trust design (Moffatt v. Air Canada, 2024: the merchant eats the liability for what the bot invents). Full automation is every competitor's game and it is the game where our doctrine is a handicap instead of a moat.
- **Intercom / Front / Richpanel.** ICP mismatch, Fin overlap, pricing drift.
- **Post-delivery returns and exchanges.** Different job. Loop and the helpdesks own it.
- **Competing as a status-page app.** StatusPro sells that at $9/mo. We sell the bundle.
- **Shopify App Store, yet.** Zero organic installs before you have reviews. After 3 to 5 reviewable customers.

### The first-10-customers plan

**Symptom-led outbound to campaigns already in trouble.** Not category search; nobody searches "presale support." Search the pain: late Kickstarter campaigns with a turning comment wall, preorder brands with a "where is my order" thread, Head-Fi and BoardGameGeek and Discord going quiet.

Qualify on: orders in the wait window, AOV, **visible distress**. If their update cadence is working, walk away.

Lead the demo with **triage + the status page**. Do not lead with send until step 1 lands. That is the most exposed moment in the demo and you must script it.

Sell **retention through the wait** (prevented refunds, prevented chargebacks, founder hours), never per-ticket cost savings. We lose the per-ticket spreadsheet against a $300/mo part-time VA, and we should concede that point instead of arguing it.

The founder story is the only credibility we have and it is real: `docs/founder-story.md`. A $2M gym-equipment company through COVID, $200K in week one, 60+ day waits for two years. He built what he needed. Sign it "— Dylan."

### How to know it is working — the metrics that are real

| Real. Track these. | Why |
|---|---|
| **`editedRatio` / send-as-is rate** | The only measure of whether the drafts are good. Currently unobserved. |
| **Deflection** (`lib/deflection.ts`) | A status view with no ticket from that order in the window. Both halves are recorded facts. |
| **Stage correctness** | Derived from the wait, so the band is now monotonic in the wait. Two backers comparing screenshots must find a coherent story. |
| **Ingest health** | Has a real inbound ever landed? Silence is an alarm. |
| **Chargeback outcomes with `disclosedEta` present** | The evidence pack's strongest exhibit only exists if the ETA was captured. |
| **Time to *customer*** | Not time to clipboard. |

| Flatters. Do not ship these. | Why |
|---|---|
| Deflection as `resolved / tickets` | A reply-completion rate. Killed this sprint. Never bring it back. |
| "Saves" | An activity count wearing an outcome's name. |
| Gifts sent | Nothing is sent. |
| SLA met | Never fired once in 136 tickets. |
| `firstResponseSec` | Time to clipboard. |
| `wismoPer100Orders` | Rounds to 0 for every merchant above ~3,000 orders. |
| CSAT with n < 20 | Small-N humility is in ADR-0007 for a reason. |

---

## 6. THE OPEN DECISIONS ONLY DYLAN CAN MAKE

Each one: my recommendation, and the cost of being wrong.

### D1 — Ship or hold. Do we put a paying merchant on this now?

**Recommend: hold on paid. Pilot free with five merchants immediately, instrumented to log `editedRatio`.** Take money once the send seam and Help Scout land.

**Cost of being wrong:** holding costs weeks and revenue inside a 90-day window. But shipping now costs the five merchants who would have been the references, and their backers assemble the evidence in public, in a comment thread, using screenshots of replies we wrote. One of those is recoverable.

### D2 — Price. Hold $749, or collapse to one tier?

**Recommend: one tier, $299, until the send seam and the proof layer ship.** At $749, on the pre-sprint build, exactly two of ten personas could both connect *and* clear the price. Add a tier above 15,000 orders (one line of config; the 18,400-backer campaign is a signature logo with no price). Decouple seats from order caps. **Hold the flat fee** — one persona named usage-based support pricing as the reason he rejected the entire category, because the bill spikes in the exact week a delay blows the inbox up. Flat pricing is not a concession. It is the pitch.

**Cost of being wrong:** anchoring low and re-pricing a live base is painful. Holding $749 and closing nobody, while burning the four best-economics logos on a broken install, is worse and is not fixable.

### D3 — ICP for the next 30 days.

**Recommend: crowdfunding CSV first, helpdesk merchants second — but the gap has narrowed.** Before this sprint, four of ten personas physically could not connect. ADR-0021 fixed that. The remaining asymmetry is write-back: a helpdesk merchant still leaves via the clipboard. So take helpdesk merchants, but only with the clipboard demoed as the flow, not hidden.

**Cost of being wrong:** the helpdesk personas are the higher ARPU and the real chargeback exposure. Deferring them defers the best revenue. Taking them and hiding the clipboard is the worst first impression there is.

### D4 — Outbound delivery. Do we become a comms layer?

**Recommend: yes. Build it. It is the quarter's one large bet.** Every persona's playbook ends in "push the link to the cohort," and that half does not exist. Without it we are a faster way to type, and typing is not what they are afraid of.

**Cost of being wrong:** it drags in CAN-SPAM, GDPR, unsubscribe, and deliverability. If you skip it, the merchant keeps posting on Kickstarter by hand, which is what they did before they paid us, and the renewal question answers itself.

### D5 — The gift feature. Rename, deliver, or cut?

**Recommend: rename today ("Log a goodwill gesture"), decide later.** The engine behind it is genuinely good — a working risk/wait gate that refuses to hand an expensive gift to a calm day-30 customer. The delivery is a fiction. Fulfilling gifts means a budget, a cap, a cost rollup, and a fulfillment partner.

**Cost of being wrong:** leaving it as-is puts phantom gestures inside a chargeback rebuttal submitted to a card network. That is not a churn risk.

### D6 — The 55 goldens (board item D9).

**Recommend: 30 minutes, this week.** They are a regression tripwire that has never been blessed. Until they are, every engine change is guarded by a fence nobody has inspected.

**Cost of being wrong:** you freeze a wrong behavior into the contract and then defend it.

### D7 — The address-change capability.

**Recommend: guardrail now (shipped this sprint — the gate refuses to promise), feature later.** The real fix is an address field plus a packing-list export. Do not build it before the delivery seam.

**Cost of being wrong:** 10 of 10 personas hit this. It is the biggest concrete unserved pain and a competitor could take the segment with it.

### D8 — Campaign-shaped LTV. Do we package a fulfillment-window pass?

**Recommend: yes, and treat it as survival arithmetic, not packaging.** A 3-to-4-month customer at ~$1,000–1,750 LTV means $20K/mo requires 40 to 65 concurrent payers, continuously replenished. The Shopify preorder segment (recurring waits) is the structural answer; the window pass is the near-term one. This ICP already pays BackerKit a percent of raise per campaign, so the shape is familiar to them.

**Cost of being wrong:** you build a perfect product and the business dies of arithmetic.

---

## 7. THE TRAPS

Everything a new operator gets wrong here.

**1. The frozen-stage class of bug.** Any value that is really a function of elapsed time, but gets stamped once and stored, will rot silently and then lie to a customer in the merchant's voice. `productionStage` did exactly this and it cost 36% of the replies. `lib/repositories/live-stage.ts` is now the pattern: derive at the read seam. **Before you persist anything, ask whether it is a fact or a function of `now`.**

**2. Off-by-one on band boundaries.** The merchant authors bands inclusively (0-20, 21-62). The old code read them half-open. A wait landing exactly on a boundary matched nothing and fell through to `stages[0]`, so 28 backers who had waited 52 to 82 days were told the paper for their book was still being sourced. Inclusive in, inclusive out.

**3. The overrun case.** Our ICP is merchants who blew their window, so **the modal customer is past the last band.** Any code that clamps past-the-end to "the latest stage" will tell the modal customer their order shipped. Overrun needs its own stage, always.

**4. Metrics that lie.** `resolved / tickets` is not deflection. A reply is not a save. A logged gift is not a sent gift. Time-to-clipboard is not first response. A rate over n=3 is not a rate. **In a proof-only product, one mislabeled number destroys trust in every true number beside it.**

**5. Connectors that fail silently.** A 401ing webhook produces a calm, empty queue that is indistinguishable from a quiet week. Four merchants ran a simulated month that way. The rule now: **once a merchant says they have a helpdesk, silence is the alarm.** Never let a health check return "fine" because nothing has ever arrived. Never green-check "connected" on the presence of a config value the merchant set before a single ticket existed.

**6. Models that promise things.** The gate was a date lexicon. It caught 0 hard dates in 136 drafts (a real achievement) and let through "We'll send a confirmation when your address is updated in our system." **Inventing an ACTION is worse than inventing a FACT**, because the merchant's signature is on it and it becomes the customer's exhibit. `lib/drafting/capabilities.ts` is the registry of what we cannot do. Add to it every time you decline to build something.

**7. Fluency reads as correctness.** The bad drafts are calm, in-voice, and confidently wrong, and the operator waved through 136 of 136. Any UI you build must make the *uncertain* draft look uncertain. A blank draft is safe; a plausible one is not.

**8. Goldens that drift.** `npm run gen-goldens` regenerates them and it is easy to run reflexively when a test goes red. **The invariant sweep is the authority.** If the sweep is green and a golden moved, read the diff and explain it. If the sweep is red, you broke doctrine. Never regenerate to make red go green.

**9. The worktree-cuts-from-main gotcha.** Agent worktrees in this repo base on **`main`**, not on `sprint/tideover-finalization`. An agent will silently build on months-old code and hand you a diff that looks fine and reverts the sprint. **Verify the base, or do not use worktrees for branch work.**

**10. The Auth0 / env split.** Five Auth0 vars, all-or-nothing: any subset flips the deployment into Auth0 mode, and a partial set returns an explicit 500 rather than falling back to the shared password. That is deliberate and correct — a silent fallback is an open gate. Also: `DEMO_MODE` and `NEXT_PUBLIC_DEMO_MODE` must **match** on every deploy, or the marketing mega-menu deep-links into `/app/*` and dead-ends at `/login`. Real mode refuses to boot without `MONGODB_URI`. A missing `WEBHOOK_ROOT_SECRET` outside demo rejects every ticket (now loudly, on `/app/setup`). Read `tideover/.env.example` end to end before any deploy; it is unusually good and it explains what breaks for every variable.

**11. Do not run `npm run dev` or `npm run build` on this machine.** A dev server owns `:3000` and `.next`.

**12. Do not open `.env.local`. Ever.**

**13. Hot files.** Five of them (§4). One in-flight change each.

**14. `ingestTicket` cannot take a `now`.** There is no backfill, no replay, no deterministic test of the product's core arithmetic. The simulation harness had to monkeypatch `Date`. Thread a clock through it early; every hour you delay makes the next test harder to write.

---

## 8. WHAT WOULD MAKE THIS COMPANY WIN

This is the section that matters. Everything above is inventory.

### The highest-leverage work

**Ship the send seam and push the status link to every backer at import.**

Here is the argument, and it is arithmetic, not taste. Read every economic model in this repo — the ten-persona tables, the hours-saved formulas, the ROI sentences. **Every single hour of value comes from reducing the cost of a ticket. Not one comes from reducing the number of tickets.**

A product that reduces cost-per-ticket is a faster typewriter. It gets compared to a $300/mo VA and it loses, because the VA does not require the founder to review 40 drafts. A product that reduces the *number* of tickets is a different category and cannot be compared to a VA at all.

The only mechanism in Tideover that can reduce tickets is the status page. It currently reaches 0.3% of backers, and only the ones who already complained. Fixing that turns four things on simultaneously: the status page becomes a deflection surface, the announcement stops being a database insert, the forecast gets a cohort, and deflection becomes **measured**, which is the only sentence that can survive a renewal conversation in a proof-only product.

Do this before Help Scout. Do this before pricing. Do this before anything.

### The moat

It is not the drafting. Hard-date-free replies are a system-prompt rule; anyone can copy the behavior in an afternoon. Say that out loud in every pitch, because a moat you oversell is a moat a prospect disproves in front of you.

The moat is three things that compound:

**1. The wait-window data model.** An order's stage as a *derived function of elapsed time against merchant-authored production bands*. No competitor's core object can express "day 73 of 90, in tooling, band moved twice, this customer has written three times." A helpdesk would have to rebuild its ticket model. A tracking app would have to invent events that do not exist. This is the thing that is expensive to copy, and it is now correct (`lib/repositories/live-stage.ts`).

**2. Reply quality under a refusal discipline.** The willingness to say "I do not have that." Competitors are all incentivized to answer, because deflection rate is their unit of value. Ours is not. That asymmetry is structural, and it is the only thing that survives the moment two backers paste our replies side by side in a Discord.

**3. The evidence pack.** It converts calm into dollars at the card network — "we told you weeks 9-11 on the day you paid, here are the four times we updated you, here is when you opened the status page." It is the one artifact a merchant can hold up and value in cash. **It only works if `disclosedEta` is populated**, which this sprint just fixed, and it must stop reporting gifts nobody received.

Reply quality gets you in. The data model makes you hard to leave. The evidence pack makes you cheap at any price.

### The failure mode most likely to kill it

**A plausible, fluent, confidently wrong reply, sent at cohort scale, into a community that shares one comment thread.**

This is not a hypothetical. It is the thing that actually happened across ten simulated merchants. A 61-day waiter is told "weeks 13-15." A 96-day waiter is told "weeks 1-4." They are in the same Discord. Thirteen of fifteen replies from one merchant contain the identical sentence, sent to an 18,400-person cohort with a shared comment wall. Fifty-three percent of a hardware merchant's file is told a machine that does not exist has left the warehouse, and one of those customers has already written "I am building a case."

The moment two customers compare screenshots, our core promise — *this reads like a person who is actually there* — becomes public evidence that the creator is lying. That is not churn. That is an execution, performed in the exact small, loud community we sell into, and it travels further than anything good we do.

**This is why the derive-don't-freeze fix was the right first move, and why the capability gate matters more than draft coverage.** Take the lower coverage. A blank draft is safe. A confident one is not. **Never trade truth for coverage. It is the only trade in this business that cannot be undone.**

The second-most-likely killer is quieter and you should watch it: **campaign-shaped demand.** Three-to-four-month customers mean $20K/mo needs 40 to 65 concurrent payers, replenished forever. A perfect product can still die of that arithmetic. The Shopify preorder segment and the window pass are the answers; do not let them stay "nice to have."

### The one thing to hold onto

Tideover is not a support tool. It is the thing that lets a founder who is late, and frightened, and looking at 400 angry posts, **behave the way they would if they had time.**

Every decision should be read against that. The product's job is to make the merchant look like the person they actually are: someone who is in the workshop, who knows what is happening, who will not lie to you about when it ships.

The day it makes them look like someone running a mail-merge, we are finished. Everything in §7 is a way that day arrives.

Build the thing that never lies. It is the only defensible position in a market where everyone else's incentive is to answer fast.

---

**Pointers, in order of usefulness:**

- `docs/sim-2026-07-12/` — the two simulation reads and `results.json`. Start here.
- `docs/recon-2026-07-10/MARKET-RECON.md` — landscape, integration order, positioning, pricing, the bear case.
- `CLAUDE.md` — the orchestration charter (who does what, token discipline).
- `tideover/CONTRIBUTING.md` — the gate, the hot files, the branch model.
- `tideover/docs/adr/README.md` — 21 ADRs. ADR-0001 (shape), ADR-0002 (doctrine), ADR-0021 (the connectors).
- `mission-control/tideover-hq.html` — the live board. TASKS + the Dylan list.
- `docs/PILOT-READINESS-HANDOFF.md` — the go-live env checklist. Read before any deploy.
- `docs/founder-story.md` — the only credibility we have, and it is real.
