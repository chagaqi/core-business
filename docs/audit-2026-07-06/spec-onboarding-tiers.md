Research and product grounding complete. Returning the deliverable.

---

# Tideover Onboarding Service Tiers — packaging design

Answer to Dylan's question ("what extra services happen with higher-ticket onboarding vs lower"): the *product* onboarding is the same self-serve wizard for everyone — what scales with price is **how many of the setup steps Dylan does for you, how much live human calibration you get, and how fast he answers during setup.** Nothing here promises a customer outcome; every promise is about Dylan's effort and availability (proof-only safe).

## TL;DR recommendation

- **Starter ($299) = tech-touch, unattended.** The existing wizard already produces a working playbook, a derived setup checklist, and a quiet-webhook alarm. Ship it as genuinely self-serve with async support only. **Do not schedule a call at $299** — it eats the month.
- **Growth ($499) = low-touch, one human hour where it counts.** A single 45-min guided kickoff + a *voice-calibration* pass on the auto-generated tough-message scripts. This is the highest-leverage hour Dylan spends and doubles as product learning.
- **Scale ($749) = high-touch, done-*with*-you.** Dylan wires the webhook, imports the list, seeds the gift catalog, brands the status page, runs a training session, and checks in twice. This is where his hours concentrate — **cap how many run concurrently.**
- **Founding-Partner (free/discounted pilot) = full white-glove concierge — deliberately the *most* hands-on despite being the cheapest.** Its return is learning + a reference case study, not onboarding margin (the "do things that don't scale" rung). Cap at 2–3 at a time.

The counterintuitive shape: touch rises with price for the three paid tiers, then **inverts** for the founding rung. That inversion is intentional and is the standard early-stage concierge playbook.

---

## What comparable tools actually do (concrete mechanics)

| Company | Bottom tier | Top / paid onboarding | Mechanic worth stealing |
|---|---|---|---|
| **Gorgias** | Pro = "lite onboarding" via product specialists + automated guide | Advanced/Enterprise = dedicated CSM, Implementation Manager meets **2–5 times**, optional on-site | Time-box the human by **call count**, and let the bottom tier *choose* "book a call OR self-guide" |
| **Intercom** | Self-serve, no human setup | **Premier Onboarding** = dedicated onboarding specialist, **one-time fee, sales-gated, custom-priced** | Top-tier onboarding is a *named* thing you talk to a human to get; it is not on the self-serve menu |
| **HubSpot** | Starter = no fee | Pro/Enterprise = **mandatory one-time onboarding fee that scales by tier** ($1.5k → $7k) | Higher tier openly = more human hours; the fee is unbundled from subscription (Tideover's is bundled — a deliberate difference) |
| **Malomo (Shopify)** | Self-serve tracking pages | Growth = **tracking pages built *by the Malomo team***, "hand-in-hand with post-purchase experts" | Done-for-you **branded status-page build** is a normal higher-touch deliverable in this exact category |
| **Concierge playbook** (early-stage SaaS) | — | Founder onboards manually, watches screens, "**import my messy spreadsheet**" concierge (~40% uptake); onboarding *is* product development | At 8 customers, losing one = 12.5% of revenue — the founder's concierge time has outsized ROI as **learning**, not margin |

The through-line (high-/low-/tech-touch segmentation): **tech-touch** for the long tail, **low-touch** (one human, time-boxed) in the middle, **high-touch/white-glove** at the top — with a **usage-threshold escalation** path so a self-serve customer who hits trouble gets routed to a human. That maps cleanly onto Tideover's four rungs.

---

## Design principle

Tideover's onboarding is bundled into the subscription (unlike HubSpot's separate fee), so the tier a merchant buys *is* the service level they get. Each rung adds human hours on top of the same self-serve base:

- **The base everyone gets** already exists and works: the 5-step wizard + 6-question fast-start (`app/onboarding/OnboardingWizard.tsx`), which captures brand/voice/tone/banned/sign-off, timeline + production stages, and helpdesk choice, then auto-generates day-7/30/60/89 reassurance scripts (`lib/onboarding.ts:36–55`, previews at `:125–143`). It ships a **derived 5-item setup checklist** (`lib/setup.ts:96–159`) and a **quiet-webhook alarm** that flags a severed integration after 7 silent days (`lib/setup.ts:56–79`). This is a real tech-touch floor — it can carry Starter unattended.
- **Higher tiers convert self-serve steps to done-for-you** and add live calibration + check-ins.

---

## The matrix

Rows = the eight dimensions Dylan named. Columns = the four rungs.

| Dimension | **Starter $299**<br>*Self-Launch* | **Growth $499**<br>*Guided Launch* | **Scale $749**<br>*Done-With-You* | **Founding-Partner** (free/disc.)<br>*Founding Concierge* |
|---|---|---|---|---|
| **CSV backer import** | Self-serve `ImportPanel` (parsed in browser, raw file never leaves their machine) + docs | Self-serve; Dylan spot-checks the first import + segmentation on the call | **DFY** — send the export, Dylan cleans, imports, verifies backer/late-pledge/new-preorder split | **DFY**, incl. messy-spreadsheet reconciliation + multi-file merges |
| **Helpdesk webhook / ingest** | `ConnectPanel` docs (Gorgias/Zendesk steps + forwarding address) | **Guided** 30–45-min screen-share to wire the presale tag → ingest URL | **Dylan-does-it** — configures tag filter + ingest URL, confirms a real inbound lands (integration-health green) | **Dylan-does-it** end-to-end + sets up quiet-webhook monitoring together |
| **Voice calibration** | Onboarding form → auto-generated day-stage playbook; self-review | **30-min calibration call** — review generated scripts, paste their scariest real message, Dylan tunes wording | Growth + **hand-written stage overrides** (`byStage`) + short custom playbook doc + a 2nd pass after week 1 of real replies | Deep, live-in-the-cockpit tuning against real tickets; iterated weekly |
| **Gift-catalog setup** | Self-serve (empty by default, `lib/onboarding.ts:93`) + docs | Threshold advice on the call; merchant enters them | **DFY** — Dylan seeds catalog + goodwill thresholds tied to LTV tiers | DFY + iterated against real chargeback-risk cases |
| **Status-page branding** | Default colors/logo (`lib/onboarding.ts:84–86`) + docs | Dylan reviews the rendered status page + widget on the call, suggests tweaks | **DFY branding pass** — sets colors/logo to match brand, checks widget embed | DFY review of the full customer-facing surface before a launch |
| **Training** | Docs / async (how to approve-send in the cockpit) | Live 30-min cockpit walkthrough (in kickoff) | Dedicated operator training session + a recorded walkthrough they keep | Ongoing — trained as they go, live answers |
| **First-week check-in** | Automated only: setup checklist + quiet-webhook alarm; no scheduled human touch | **One** check-in end of week 1 (async or 15 min) | **Two** — day 3 + day 10, proactive review of first real sends | **Weekly** calls through the pilot (~4 weeks) |
| **Setup-question response time**¹ | Best-effort async, next-business-day target (email) | 1 business day | Same business day during the 2-week setup window, then 1 business day | Direct line (text/Slack), fastest available |

¹ Service SLA (Dylan's availability) — *not* a product-outcome promise. Keep it phrased this way to stay inside the proof-only doctrine; never attach a deflection-rate or delivery-date claim to onboarding.

---

## Per-tier detail (name · included · honest Dylan-hours · upgrade moment)

### Starter $299 — **"Self-Launch"** (tech-touch)
- **Included:** the full self-serve wizard, auto-generated playbook, setup checklist, quiet-webhook alarm, docs for every step, async email support (next-business-day).
- **Dylan-hours (per merchant):** **~0 scheduled.** Budget 0.25–0.5 hr of reactive async across week 1. Design target = essentially unattended. (At $299, a single scheduled hour is a third of the first month's revenue — protect it.)
- **Upgrade moment:** their first refund-threat wave that the generic scripts don't calm → they want the tough-message tuned → **Growth.** Or the webhook goes quiet and they can't debug it → **Scale.**

### Growth $499 — **"Guided Launch"** (low-touch)
- **Included:** everything in Starter **+ one 45-min guided kickoff** (webhook screen-share + live cockpit walkthrough) **+ a 30-min voice-calibration pass** on the auto-generated scripts using their real scariest message (the `worstStory` field, `OnboardingWizard.tsx:570–579`) **+ one week-1 check-in.** SLA 1 business day.
- **Dylan-hours:** **~2–3 hrs** (call + prep + one follow-up + async). This is his single highest-leverage hour — it's also where he *learns the segment*.
- **Upgrade moment:** they want gifting to cut chargebacks, or a branded status page for a relaunch, or a big new campaign import → those are Scale DFY items → **Scale.**

### Scale $749 — **"Done-With-You Launch"** (high-touch)
- **Included:** everything in Growth, but the setup steps become **done-for-you** — Dylan wires the webhook, imports + segments the list, seeds the gift catalog, brands the status page, runs a dedicated training session, hand-writes stage overrides, and does **two proactive check-ins** (day 3 + day 10). Same-business-day SLA during the 2-week setup window.
- **Dylan-hours:** **~5–7 hrs** over ~2 weeks. This is the concentration point — see the capacity guardrail below.
- **Upgrade moment:** Scale is the top paid rung, so "upgrade" here = **expansion within Scale** (new campaign = new DFY import + re-segmentation; seasonal relaunch = fresh branding pass). Renewal risk is low-touch drift, so the two check-ins are what protect retention.

### Founding-Partner (free / discounted pilot) — **"Founding Concierge"** (white-glove, deliberately inverted)
- **Included:** everything DFY, plus Dylan sits in the cockpit with them, tunes against live tickets, and runs **weekly calls** through the pilot. Direct line. This is the "import my messy spreadsheet + watch their screen" rung.
- **Dylan-hours:** **~10–15 hrs across a 4-week pilot.** By the hour this loses money — **on purpose.** Its ROI is (a) product learning that improves the engine for everyone and (b) a reference case study. Treat the hours as R&D + sales collateral, not onboarding margin.
- **Cap:** **2–3 concurrent partners, max.** More than that and the concierge quality (and the learning) collapses.
- **Upgrade / graduation moment:** pilot succeeds → merchant graduates onto **Growth or Scale** at list price, and Dylan captures the case study. This is the founding rung's whole point — it's a funnel into the paid ladder, not a permanent free tier.

---

## Capacity guardrail (the real solo constraint)

The binding limit isn't packaging — it's Dylan's calendar, because onboarding hours land **concentrated at signup**, not spread evenly.

Rough monthly ceiling if he's the only human:
- Founding-Partner pilots: **2–3 active** at any time (~10–15 hrs each) → this alone can be 20–40 hrs/mo.
- Scale onboardings: **~1 per week** (~5–7 hrs each) is the sustainable rate alongside pilots.
- Growth: **~2–3 per week** (~2–3 hrs each).
- Starter: unlimited by design (unattended).

**Implication for packaging:** the tiers must funnel volume toward Starter (self-serve) and reserve DFY for Scale + founding. If Starter ever requires a call, the model breaks the first month he lands five of them. Recommend an explicit **"onboarding starts on a scheduled date" mechanic for Scale + founding** so Dylan can stagger start dates rather than have three white-glove setups collide in one week (this is Gorgias's ~60-day, 2–5-meeting cadence adapted to a solo operator).

---

## What's an option vs. what's recommended (Dylan decides)

**Recommended (my call, but yours to accept):**
1. Keep Starter fully self-serve — the wizard is already good enough to carry it (evidence below). This is the single most important line to hold.
2. Make Growth's identity the **voice-calibration call**, not generic "support." It's the differentiator merchants will feel and the hour Dylan should most want to spend.
3. Make Scale's identity **"we wire it up for you"** (webhook + import + gift + branding + training), and gate its volume with scheduled start dates.
4. Run Founding-Partner as an explicit 2–3-slot concierge with a graduation-to-paid + case-study exit.

**Options for you to pick (packaging levers, all price-neutral):**
- **Package names** — I used Self-Launch / Guided Launch / Done-With-You / Founding Concierge. These are customer-facing copy, which is your call; swap freely (nautical-consistent alternatives: *Chart-Your-Course / Harbor-Pilot / Full-Rig / Captain's Table*).
- **Check-in cadence** — 1 (Growth) / 2 (Scale) / weekly (founding) is a starting point; tighten or loosen to fit your week.
- **Where gift-catalog DFY sits** — I put it at Scale. It could instead be a Growth-call advisory item if you'd rather keep Scale leaner.
- **Call length** — Growth's 45 min vs. Gorgias-style 2-meeting split; pick what you can staff.

**Explicitly out of scope (I considered, not recommending here):** an unbundled one-time "white-glove setup" add-on fee for Starter/Growth merchants who want Scale-level setup without the monthly. That's a *pricing* move, and pricing is held — flagging it only so you know it was weighed and parked, not overlooked.

**Proof-only guardrail (do not violate when writing the customer-facing version):** every onboarding promise must be about Dylan's *effort/availability* (a call happens, a step is done-for-you, a reply comes within N days). Never promise a *result* — no "50% automation in 50 days" (Gorgias's claim), no deflection rate, no delivery date. The response-time SLAs above are safe because they describe Dylan's availability, not a customer outcome.

---

## Evidence (files I opened)

- Self-serve wizard (5-step + 6-question fast-start), `worstStory` tough-message capture, forwarding address + `ConnectPanel`, `ImportPanel`: `tideover/app/onboarding/OnboardingWizard.tsx` (steps `65–74`, `worstStory` `570–579`, inbox/connect `223–240`).
- Auto-generated day-stage playbook + review previews: `tideover/lib/onboarding.ts` (`buildPlaybook` `36–55`, empty `giftCatalogIds` default `93`, brand-color defaults `84–86`, previews `125–143`).
- Derived 5-item setup checklist (brand · import · helpdesk · first-reply · status-visible): `tideover/lib/setup.ts:96–159`.
- Quiet-webhook / integration-health backstop (7-day silence flag): `tideover/lib/setup.ts:56–79`.