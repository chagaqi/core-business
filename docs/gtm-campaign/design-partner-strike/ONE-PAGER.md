# Tideover — 14-Day Launch Plan: 36 Diagnosed Prospects → 2–5 Signed Design Partners

# THE 14-DAY LAUNCH PLAN
### 36 diagnosed prospects → 2–5 signed design partners

**Window:** Day 1 = the next weekday Dylan can give 2 hours. **Owner:** Dylan (2 hrs/day, hard cap). **AI layer:** runs before he wakes.
**Sources:** `docs/gtm-campaign/GTM-CAMPAIGN-2026-07.md` (§4 calendar, §7 CASL floor), `mission-control/tideover-hq.html` (GTM COMMAND CENTER — near-term goal is literally "2–5 free design partners"), `gtm-assets/v2/v2-cold-email.md`, `gtm-assets/v2/v2-sales-call-kit.md`.

---

## 0. THE SHAPE OF THIS FORTNIGHT

There are two clocks running and they do not overlap.

**Clock A — the cold infrastructure.** Domains aren't bought. From purchase, warmup is 14 days minimum (the campaign doc plans 21 for margin). Buy them on Day 1 and the first legitimate cold-infrastructure send is **Day 15 at the earliest** — the day *after* this plan ends. Nothing in Days 1–14 can ride that lane. The only thing Day 1 owes Clock A is the 20 minutes it takes to start it.

**Clock B — the 36.** These are hand-diagnosed. Someone looked at each campaign or store and wrote down the specific thing that is going wrong for them right now. That is the entire asset. It can be spent today, from a mailbox that already exists, without touching the deliverability of anything that matters.

**This plan is Clock B, executed properly, while Clock A ticks in the background.** The 90-day engine in `GTM-CAMPAIGN-2026-07.md` is not being replaced — it's being fed. If the 36 produce pilots, Day 15 opens with a *proven message* to scale onto 19k enriched rows instead of a guess.

**What "signed design partner" means here** (define it before you chase it, or you'll count the wrong things):
> A named person at a real merchant mid-fulfillment who has (1) taken a 20-min teardown call, (2) said yes to a 30-day founding-partner pilot, (3) returned a one-page agreement — free product, in exchange for a weekly 20-min feedback call, permission to quote outcomes, and their real backer/customer data in the system. A verbal "sounds cool, send me info" is **not** a signed partner. Do not let the scoreboard soften.

**Target:** 2 signed by Day 14 = plan worked. 3–5 = plan overperformed. 1 = salvageable, diagnose the offer. 0 with ≥3 calls held = offer problem. 0 with ≤1 call held = channel problem.

---

## 1. WHY DAY-1 SENDS ARE 3 EMAILS, AND WHY THAT'S THE PLAN WORKING

This looks like under-shipping. It isn't. Five reasons, in order of weight:

1. **The 36 are non-replenishable this fortnight.** There is no Day-3 restock — building 36 more hand-diagnosed rows is days of work. Sending all 36 on an unproven opener is the actual risk in this plan. Volume is not the scarce resource; *diagnosed prospects* are. You spend 3 to learn, then spend 33 knowing.
2. **The diagnosis line is the whole bet, and it's untested.** Every email leads with a specific observed fact about their campaign. Nobody has yet watched a stranger react to that. Three sends on Day 1 buys the read before the list is gone.
3. **The mailbox is an asset you cannot replace.** An aged mailbox with real two-way history is worth more than any of the 36 individually. Bulk-tool headers, tracking pixels, and link-heavy HTML from that address is how you find out what it was worth.
4. **Manual sending is the personalization forcing function.** A mail-merge cannot fake 36 different diagnoses. If it's typed one at a time, the personalization is structurally guaranteed. The friction is the quality control.
5. **Reply capacity is the real ceiling.** At 2 hrs/day, with a 20-min reply block that grows, Dylan can properly answer maybe 6 substantive replies a day. Sending more than you can answer *well* is negative expected value — a slow reply to a warm prospect is worse than never having emailed them.

**The math that makes this rational.** Sprayed cold email replies at 2–4% (the campaign doc's own verified benchmark). Thirty-six hand-diagnosed emails from an aged human mailbox, plain text, no links, no tool fingerprint, each citing a real observed fact about the recipient's own live campaign — that's a different instrument. Plan on **15–30% reply**. Model:

| | Conservative | Expected | Good |
|---|---|---|---|
| Emailed | 36 | 36 | 36 |
| Replies (15 / 22 / 30%) | 5 | 8 | 11 |
| Positive / curious | 2 | 4 | 6 |
| Teardown calls held | 2 | 3 | 5 |
| **Pilots signed (~60% of calls)** | **1** | **2** | **3** |

Two to five partners is not a stretch from 36 emails. It is the *expected value* of 36 emails done this way — and it is completely unreachable from 36 emails done the fast way.

---

## 2. THE MAILBOX DECISION (must be made before Day 1 — 10 minutes)

Rank order. Pick the highest one that's true.

1. **Best — an aged domain Dylan already owns that is neither the product's transactional domain nor the gym co's primary billing domain.** An old project domain, a secondary business domain. Real age, real history, nothing catastrophic if it takes a hit. Ceiling **8 new recipients/day**.
2. **Acceptable — a Google Workspace mailbox on any aged personal domain with genuine two-way history.** Ceiling **6/day**.
3. **Last resort — the personal Gmail** (`orderstatusfuc@gmail.com`). Deliverability is fine at single digits; the credibility cost is real but the diagnosis carries it, and a founder emailing from a personal address is congruent with the story. Ceiling **5/day**. Fix the display name to "Dylan Hare" and add a plain three-line signature first.
4. **Never — `tideover.app`.** That's the transactional lane. Cold complaints there degrade the mail your actual customers depend on. The campaign doc's rule (§9.2 three-lane rule) is not negotiable for convenience.
5. **Never — the gym company's primary domain.** A $2M business's mail flow is not collateral for a side experiment, and the ICP overlap is zero.

**Safe-volume rules on the chosen mailbox** — these are what keep it clean, more than the raw number:

- **New-recipient cap: 5–8/day, 40/week.** Follow-ups inside an existing thread are reply-lane traffic and count at roughly one-third — a 6-new + 6-follow-up day is fine; 12 net-new is not.
- **No bulk tool. No merge field. No BCC. No tracking pixel. No link in email #1.** Send them one at a time out of the normal client. If it looks like software, it gets treated like software.
- **Plain text.** No HTML template, no logo, no footer graphics.
- **Real unsubscribe language in plain English** ("if this isn't relevant, reply 'no' and I'll leave you alone") + sender identification. That satisfies CASL's identification + opt-out requirement at this scale; the implied-consent lane (§7, conspicuous publication, business-context addresses, source URL logged per row) is what makes the send lawful in the first place. **Every one of the 36 needs its source URL on file before it's emailed.** No exceptions, no guessed address patterns.
- **Circuit breaker:** more than 1 hard bounce in 20, or any complaint, or any reply containing "how did you get my email" — stop sends that day, tell Claude, re-verify the sourcing of the remaining rows.

---

## 3. STANDING BLOCKS

**The AI layer, every morning before Dylan opens the laptop** (this is the Opus automation spec from §4, narrowed to this fortnight):

- Overnight reply sweep → each reply classified (positive / question / objection / not-now / no) with a drafted response and the one fact Dylan must verify before he sends it.
- Today's send batch drafted — each email's diagnosis line re-checked against the prospect's page *this morning* (a campaign that posted an update overnight needs a different first line; a stale diagnosis is worse than no email).
- Pre-call brief for any booked teardown: campaign state, backer sentiment from the comment wall, their stack, the two most likely objections, the specific opening line.
- Scoreboard refresh: sent / replied / booked / held / signed, plus the per-cohort split that Day 8 depends on.
- Warmup watch from Day 1: DNS propagation, Postmaster registration, warmup health on the new domains. Surfaces only if something is wrong.

**Dylan's 120 minutes, priority order — this never changes:**
> Replies first. Always. A reply displaces everything below it including the day's sends. A same-day human reply is the single highest-conversion act in this entire plan.

**The tracking artifact.** The 36 must be frozen into a file — `docs/gtm-campaign/strike-list-36.md` (or `.csv`) — with per-row: name, merchant, platform, **the diagnosis in one sentence**, source URL of the address, cohort (send day), touch history, status. If the strike list only exists inside a chat thread, it is not an asset and it will be lost by Day 4. Claude builds this Day 1.

---

# THE 14 DAYS

---

## DAY 1 — MERGE, START THE CLOCK, SEND THREE

**Dylan (≈75 min)**
1. **(10 min) Say "merge it."** Watch CI go green, watch Vercel deploy. Every one of the 36 will google "tideover" before they reply; they should land on the merged site and the 3 SEO guides, not the old page.
2. **(20 min) Buy the 3 domains at Porkbun, provision the 6 Workspace mailboxes, paste in the DNS records Claude prepared, start Smartlead warmup.** This is the highest-leverage 20 minutes of the fortnight and it produces zero visible output today. Every hour of delay is an hour bolted onto Day 15.
3. **(45 min) Send the test trio.** The three warmest of the 36 — the ones whose lateness is most undeniable and most public. Hand-typed, one at a time, from the chosen mailbox. 15 minutes each. Read each one out loud before sending; if any sentence sounds like software wrote it, rewrite it.

**AI/Claude**
- SPF/DKIM/DMARC records + exact Porkbun/Workspace click-path, ready to paste.
- Prod smoke on the merged deploy: signup → wizard → import → inbox → approve → status page. Report pass/fail in one line.
- Freeze the strike list into `docs/gtm-campaign/strike-list-36.md` with diagnosis + source URL per row; assign cohorts D1–D7.
- Draft all 36 diagnosis emails so Dylan is editing, never authoring from blank.
- Build the reply-log scoreboard.

**GATE — working:** prod smoke green · 3 domains registered with warmup running · 3 emails sent, 0 bounces.
**GATE — not working:** prod smoke red → **revert immediately, do not delay the sends** (email #1 carries no link, so the send is unblocked; fix prod Day 2 before anyone can click). Domains not bought today → the entire Day-15 handoff slips a day, and you must say so out loud rather than quietly absorb it.

---

## DAY 2 — FIVE MORE, AND THE X FLOOR

**Dylan (≈95 min)**
1. **(15 min) Reply block.** Probably empty. Check anyway — the trio was warmest and same-day replies happen.
2. **(50 min) Send 5.** Second-warmest cohort. Still one at a time.
3. **(30 min) Stand up X.** Bio, Premium Basic ($3), pin the magnet post, post D1 from `x-content-pack.md`. This is not a lead channel this fortnight. It is the page a prospect finds when they check whether you're a real person, and it costs 30 minutes once.

**AI/Claude**
- Re-verify diagnosis lines for the Day-2 cohort against this morning's page state.
- Convert 5 more banked posts to X-native and queue them; Dylan approves in the Day-3 block.
- First deliverability read on the trio (delivered/bounced/opened-thread-activity — no pixel, so this is bounce and reply signal only).

**GATE — working:** 8 of 36 touched, 0 bounces, X profile live and not obviously a burner.
**GATE — not working:** ≥2 bounces from 8 → the sourcing has a problem. Stop. Re-verify the address provenance on all remaining 28 before another send goes out. A bad address list is a CASL exposure, not just a deliverability one.

---

## DAY 3 — SIX, AND REHEARSE THE CALL

**Dylan (≈110 min)**
1. **(20 min) Reply block.** First replies are statistically due today (48h from the trio).
2. **(60 min) Send 6.**
3. **(30 min) Rehearse the teardown call once, out loud, against the persona.** Use `gtm-assets/v2/v2-sales-call-kit.md` and one of the five ICP personas in `docs/personas/`. Time it — the call is sold as 15 minutes and must actually be 15. The first real call cannot be the first time these words leave his mouth.

**AI/Claude**
- Teardown call one-pager: the 5 questions, the 3 things to show live in the app, the pilot ask verbatim, the two objections and their answers.
- Draft the founding-partner pilot agreement — one page, plain language: 30 days free, weekly 20-min call, permission to quote outcomes with approval, data handling, either side can walk. Dylan approves once; it's reused all fortnight.

**GATE — working:** 14/36 touched · ≥1 reply of any kind · call script rehearsed under 15 min.
**GATE — not working:** 14 touched, 0 replies of any kind, 72h elapsed on the trio → not yet a verdict (small n), but flag it. If Day 4 ends the same way, Day 8's decision is already leaning toward "message."

---

## DAY 4 — FIRST FOLLOW-UPS

**Dylan (≈105 min)**
1. **(25 min) Reply block.** Growing.
2. **(60 min) Send 6 new.**
3. **(20 min) Send follow-up #1 to the Day-1 trio.** Rule: **a follow-up must carry a new fact, never a bump.** "Following up on the below" is a wasted touch and reads as automation. The new fact is a second observation about their campaign — a comment thread that got worse, an update that went out and what it did or didn't say. Claude supplies it; Dylan edits it.

**AI/Claude**
- Second-observation research for the trio (this is the follow-up's entire content).
- Booking link + calendar sanity check — a broken booking link on the day someone wants to talk is an unforced loss.
- Start the "why they replied / why they didn't" pattern file. It feeds Day 8.

**GATE — working:** 20/36 touched · ≥1 reply · booking link tested end-to-end by Claude.
**GATE — not working:** any follow-up that Dylan couldn't attach a genuine new fact to → don't send it. Skip that prospect's F1 rather than burn the thread on a bump.

---

## DAY 5 — THE FIRST CALL WINDOW

**Dylan (≈115 min)**
1. **(30 min) Reply block.** Every positive reply gets a same-day answer proposing two concrete times. Never "let me know what works" — always two specific slots.
2. **(45 min) Send 6 new + F1 to the Day-2 cohort (5).**
3. **(40 min) Hold the first teardown call if one is booked.** If none is booked, use the 40 minutes to do the *unsolicited* version: pick the 3 most compelling non-repliers, record a 4-minute Loom walking their actual campaign page and what it's doing to their backers, and send it in the thread. This converts silence better than a third text email.

**AI/Claude**
- Pre-call brief for any booked call.
- Loom scripts for the 3 unsolicited teardowns (what to click, what to say, in what order, under 4 min).
- Post-call: write the call notes into the strike list, draft the follow-up-with-agreement email within 30 min of the call ending.

**GATE — working:** ≥1 call booked or held by end of Day 5 · 26/36 touched.
**GATE — not working:** 26 touched, ≥2 replies, but 0 calls booked → the replies are polite, not interested. The *ask* is the problem, not the opener. Rewrite the CTA: replace "15-min teardown" with something with zero calendar friction — "want me to just send you the teardown as a 4-min video? no call needed." Claude reworks the remaining cohort's CTA tonight.

---

## DAY 6 — LIST NEARLY SPENT

**Dylan (≈110 min)**
1. **(30 min) Reply block.**
2. **(50 min) Send 6 new + F1 to the Day-3 cohort (6).**
3. **(30 min) Calls, or Loom teardowns #4–6.**

**AI/Claude**
- Draft strike list #2 in the background — the next 40 rows from `master_tam.csv`, hand-diagnosed to the same standard. **Do not send from it.** It exists so that if Day 8 says "double down," Dylan doesn't lose two days building ammunition.
- Wire the Resend nurture automation if the marketing subdomain DNS is in (from the COMMAND CENTER lane list) — a replier who isn't ready now should land somewhere, not nowhere.

**GATE — working:** 32/36 touched · ≥3 replies cumulative · ≥1 call held or booked.
**GATE — not working:** strike list #2 not started → Day 8's double-down branch has nothing to double down *with*, and the plan stalls for 48 hours at exactly the wrong moment.

---

## DAY 7 — LIST SPENT, WEEK-1 SCOREBOARD

**Dylan (≈100 min)**
1. **(30 min) Reply block.**
2. **(40 min) Send the last 4 + F1 to the Day-4 cohort (6).** All 36 are now touched at least once.
3. **(30 min) Read the week-1 scoreboard Claude built. Do not act on it yet.** Day 8 is the decision; today is just reading it honestly.

**AI/Claude**
- Week-1 scoreboard: sent, delivered, replied, reply *content* clustered by theme, booked, held, signed. Split by cohort so the D1 trio (2 touches, 6 days elapsed) is readable separately from Day-7's fresh sends.
- The three candidate reasons for whatever the numbers say — with evidence, not vibes.

**GATE — working:** 36/36 touched · ≥3 replies · ≥1 call held.
**GATE — not working:** 36/36 touched with 0 replies at all → this is now a real signal, not small-n noise. Day 8 goes straight to the channel-switch branch. Do not send a fourth touch into total silence.

---

## DAY 8 — 🔴 DECISION POINT ONE: DOUBLE DOWN OR SWITCH CHANNEL

The whole plan hinges here. Read the **first 20 touched** (Days 1–3 cohorts): each has had 1–2 touches and 5+ days elapsed. That's a fair sample.

**Dylan (≈90 min)**
1. **(30 min) Reply block — always first.**
2. **(30 min) Make the call.** One of three branches. Pick one; do not hedge across two.
3. **(30 min) Execute the first action of the branch.**

### Branch A — DOUBLE DOWN
**Trigger:** ≥4 replies from 20 **and** ≥2 calls booked or held.
**Read:** the message works. The constraint is list size, not conversion.
**Do:** Dylan raises to 8 new/day and starts sending strike list #2 (already diagnosed, Day 6). Claude begins list #3. Day 15's cold infrastructure is now a *volume multiplier on a proven message* rather than a shot in the dark — which is the single best outcome available from this fortnight and worth more than the pilots themselves.

### Branch B — FIX THE MESSAGE (do NOT switch channel)
**Trigger:** 1–3 replies from 20, 0–1 calls.
**Read:** people are receiving and reading; the opener isn't landing. This is a copy problem wearing a channel problem's clothes. Switching channels here would destroy the only clean signal you have.
**Do:** change **the first line only** — swap diagnosis-first ("Your campaign page says X, and your comment wall says Y") for question-first ("What are you telling the backers who ask about the November date?"). Everything else stays fixed. Run the new opener on the untouched second half of list #2. Because the cohorts are date-separated, this A/B is free and clean.

### Branch C — SWITCH CHANNEL
**Trigger:** 0–1 replies from 20, no positives.
**Read:** email into this ICP from this mailbox isn't landing or isn't wanted. More email is throwing good hours after bad.
**Do:** keep the same 36 people, change the door — in this order:
1. **Platform-native messages.** Kickstarter/Gamefound creator messages and campaign comments. Creators read these obsessively during fulfillment; they ignore email.
2. **DM lane** per `gtm-assets/v2/v2-dm-outreach.md` — X and Discord. The campaign doc is explicit that tabletop/crowdfunding creators live on BGG, Discord, Reddit, and Facebook, *not* email or LinkedIn.
3. **Reply-first presence** in the buyer subs and BGG crowdfunding forums.
**Critical:** the domains stay bought and stay warming. Branch C says "the 14-day window needs a different door," not "the 90-day cold-email plan was wrong." Those are separate claims and only the first one has evidence.

**AI/Claude:** whichever branch fires, Claude produces its full asset set by end of day — list #3, or the rewritten opener across the remaining rows, or 36 platform-native message drafts.

**GATE:** a branch is chosen and its first action is executed **today**. The failure mode here is not picking wrong — it's sitting between branches for three days "gathering more data." At this sample size there is no more data coming; there's only cost.

---

## DAY 9 — EXECUTE THE BRANCH

**Dylan (≈115 min)**
1. **(35 min) Reply block** — expect this to be the biggest reply day, since F1 touches from Days 5–6 are maturing.
2. **(50 min) Branch execution:** A → 8 new from list #2. B → rewritten opener to the fresh cohort. C → the first 10 platform-native messages.
3. **(30 min) Calls.**

**AI/Claude:** F2 drafts for the Day-1/Day-2 cohorts (final touch — the honest close: *"I'll stop here. If the November date slips again, my door's open."* No guilt, no fake scarcity). Pre-call briefs. Same-day post-call agreement sends.

**GATE — working:** ≥1 pilot verbally agreed · branch producing new touches.
**GATE — not working:** a call was held and no pilot ask was actually made → that's the failure, not the answer. **Every teardown call ends with the ask, out loud, in the call.** Not in a follow-up email. If Dylan skipped it, he re-opens that thread today.

---

## DAY 10 — CLOSE THE FIRST ONE

**Dylan (≈110 min)**
1. **(35 min) Reply block.**
2. **(45 min) Calls + branch sends.**
3. **(30 min) Get one agreement *returned*.** Chase the verbal yes into a signed page. Verbal yeses decay fast; a founder mid-fulfillment has a genuinely chaotic week and will forget by Friday. Make it one click.

**AI/Claude**
- Onboarding runbook for partner #1 from `gtm-assets/v2/v2-onboarding-kit.md`: import their real data, first drafts in the inbox, first approvals — **all done by Dylan, not by them.** The pilot's activation energy is the last place to make a design partner do work.
- Draft partner #1's first week of reassurance replies so their day-1 experience is a full inbox, not an empty state.

**GATE — working:** 1 signed agreement returned.
**GATE — not working:** a verbal yes older than 72 hours with no returned agreement → the agreement itself is too heavy. Cut it to five lines in the email body with "reply 'yes' and we're on." Signature theater is not worth losing a partner over.

---

## DAY 11 — PARTNER #1 IS LIVE, AND THAT CHANGES THE PITCH

**Dylan (≈115 min)**
1. **(30 min) Reply block.**
2. **(45 min) Onboard partner #1 personally** — import their data, sit in their inbox, approve their first replies with them. This session is worth more than the next 20 emails: it's the first time the product meets a real angry backer wall.
3. **(40 min) Calls + sends, now with a live reference.** The pitch changes today. "I'm doing this with a hardware founder mid-fulfillment right now" outperforms every cold opener in the file. Claude rewrites the remaining outreach to carry it — **anonymized, and only claims that are literally true.** The proof-only doctrine governs GTM copy exactly as it governs the product.

**AI/Claude:** rewrite remaining sequences with the live-reference line. Instrument partner #1 for the metrics that become the testimonial (reply-time reduction, approval throughput, backer sentiment shift) — *measured, or not reported.*

**GATE — working:** partner #1's real data in the system, first approvals shipped.
**GATE — not working:** the import broke, or the drafts read wrong for their voice → **this outranks everything, including outreach.** A design partner who has a bad first session is a lost partner and a lost testimonial. Stop sending, fix the product, resume tomorrow.

---

## DAY 12 — 🔴 DECISION POINT TWO: THE OFFER

**Dylan (≈100 min)**
1. **(30 min) Reply block.**
2. **(30 min) Read the conversion gate.**
3. **(40 min) Act on it.**

**The gate is conversion, not pipeline:**

- **≥2 calls held, ≥1 signed** → the offer works. Spend the rest of the fortnight on volume through the winning branch. Nothing to fix.
- **≥3 calls held, 0 signed** → **the offer is the problem, and the fix is almost always time-cost, not price** (it's free — price cannot be the objection). Loosen it: *"I'll do the first week for you. Send me a CSV, I'll run it, you approve five replies on Friday and tell me what's wrong."* That removes the only real cost of a free pilot, which is their attention during the worst week of their year.
- **≤1 call held total, ≥5 replies** → replies aren't converting to calls. Kill the call entirely for the remainder. Ship the async teardown video + a live demo instance loaded with **their** data, and ask for the pilot in writing. Bandwidth-matched to a founder who is drowning.
- **≤2 replies total across all branches** → the ICP read is wrong, not the copy or the channel. Say it plainly. The remaining days go to the store-side half of the TAM (Shopify preorder brands mid-window per §5b), whose situation is chronic rather than acute and who behave completely differently. That's a **finding worth more than a pilot** — and it must be written into `docs/gtm-campaign/` on Day 14, not left as a feeling.

**AI/Claude:** rebuild the offer assets for whichever branch fires, same day.

**GATE:** the offer changed, or it was consciously confirmed as fine. "It's probably fine" without looking at the number is the failure.

---

## DAY 13 — CLOSE #2 AND #3

**Dylan (≈110 min)**
1. **(30 min) Reply block.**
2. **(40 min) Close every open verbal yes.** Every warm thread gets a decision today — yes, no, or a real date. Ambiguity carried past Day 14 becomes ambiguity carried forever.
3. **(40 min) Partner #1's first feedback call.** Twenty minutes on what's broken. This is what the free pilot *bought*; collect it or the whole trade was one-sided.

**AI/Claude:** partner #1's feedback → the reply-quality lane in the COMMAND CENTER queue, as gated fixes with acceptance criteria. Draft the Day-14 scoreboard.

**GATE — working:** 2+ signed · partner #1 gave real, specific criticism.
**GATE — not working:** partner #1's feedback is "it's great, no notes" → that's not a design partner, that's a polite stranger. Push harder with the persona questions in `docs/personas/`, or accept that the partnership is decorative and go find a real one.

---

## DAY 14 — SCOREBOARD AND HANDOFF TO CLOCK A

**Dylan (≈90 min)**
1. **(30 min) Reply block.**
2. **(30 min) Read the fortnight scoreboard and write the verdict in three sentences.** What worked, what didn't, what's true now that wasn't true 14 days ago.
3. **(30 min) Green-light Day 15:** cold domains are 14 days warm as of tomorrow. Approve the Day-15 sending plan — which is *the winning message from this fortnight*, at 5/mailbox/day across 6 mailboxes (30/day), against the warmest slice of `master_tam.csv`. Not the message that was drafted on Day 1. The one the 36 proved.

**AI/Claude**
- Final scoreboard + the reply-pattern teardown: which diagnosis lines pulled, which CTA converted, which objections recurred, which ICP segment replied at what rate.
- Day-15 sequence built from the winning variant, loaded into Smartlead, ramp schedule per §3 of the campaign doc.
- Deliverability pre-flight on all 6 new mailboxes (mail-tester, Postmaster registration confirmed, spam <0.10% baseline).
- Update the COMMAND CENTER panel and the `DYLAN` task array in `mission-control/tideover-hq.html` with the real state.

**GATE — the fortnight worked:** ≥2 signed design partners with real data in the system **and** a message variant with a measured reply rate to scale on Day 15.
**GATE — the fortnight didn't:** 0 signed. **Do not roll straight into 30/day on Day 15 with an unproven message.** That converts a 14-day loss into a 6-week loss and burns three fresh domains doing it. Instead: Day 15 sends 30/day of the *variant that pulled best* against 200 rows only, and the double-down/switch decision repeats on Day 22 with a real sample.

---

## 4. THE SCOREBOARD (Claude maintains; Dylan reads Days 7, 8, 12, 14)

| Metric | Day 7 target | Day 14 target | Why it's on the board |
|---|---|---|---|
| Prospects touched | 36 | 36 + branch volume | The list is finite — spend rate is a real number |
| Reply rate (touched ≥5 days) | ≥15% | ≥20% | The message verdict |
| Positive/curious replies | ≥2 | ≥5 | The only replies that matter |
| Teardown calls held | ≥1 | ≥3 | The conversion chokepoint |
| **Signed design partners** | 0–1 | **2–5** | **The only number that counts** |
| Bounces | <2 total | <4 total | Mailbox integrity + CASL sourcing health |
| Complaints | 0 | 0 | Non-negotiable |
| Domains warm | day 7/14 | **day 14/14 — ready** | Clock A, unblocked |

**Deliberately not tracked:** open rate (no pixel, and MPP makes it noise anyway), impressions, followers, directory listings. Vanity metrics in GTM are the same sin as the fake-deflection metric that got killed in the product.

---

## 5. WHAT COULD GO WRONG, RANKED

1. **The domains don't get bought on Day 1.** Highest-probability failure, lowest-drama symptom — nothing visibly breaks, and that's exactly why it slips. It silently pushes the entire scaled channel past the fortnight. It's a 20-minute credit-card task.
2. **Dylan sends all 36 in two days because it feels productive.** The list is gone, the message never got tested, and there is no second sample. §1 exists specifically to prevent this.
3. **Replies pile up and go stale.** A 48-hour reply to a founder in fulfillment hell is a dead lead. The reply block outranks the send block on every single day, without exception.
4. **A call happens and the pilot ask never gets made out loud.** Astonishingly common. Ask on the call, not in a follow-up email.
5. **Partner #1 has a bad first session.** One broken import costs a testimonial and a reference — which are worth more than the next 100 emails. Product fixes outrank outreach on Days 11–14.
6. **Day 8 gets hedged.** Two half-branches produce no signal on either. Pick one.

