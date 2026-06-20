# Tideover — Daily Prospecting SOP

> **What this is.** The daily operating checklist for Tideover outreach. Derived from `outreach-playbook.md` (§3.5 artifact-first, §3.6 hook-sourcing, §5.2 the Tideover play) and `tideover-brand-kit.md`. Strategy lives there; this is the do-it-today list.
>
> **The bar.** Every line you send clears `copy-standard.md`. Read it aloud before it ships. No em-dash connector, no "I hope this finds you well," no triads, no hype.
>
> **Proof-only, non-negotiable.** No fabricated metrics, case studies, testimonials, or refund stats. Credibility is the operator war story, framed as experience not a number ("I ran fulfillment and the where's-my-order comms for a physical-goods brand for years"). The ~$2M figure is warm-call only. The refund-reduction case study does not exist until a cohort completes its wait. Say that plainly.
>
> **The one motion.** One fresh, verifiable trigger per prospect. One soft, interest-based ask. The free teardown is the artifact that buys the trust. Personal DM first, never the cold-email rig.

---

## A. The trigger engine — campaign-end-date calendar (weekly, ~45 min)

The whole play runs on knowing who hits the 60-to-120-day fulfillment window, and when. Build the calendar once, refresh it weekly.

**Build (first run):**
- [ ] Open a sheet: columns = `brand | platform | campaign | campaign-end-date | est. fulfillment window | moved to Shopify? | trigger spotted | last touch | stage`.
- [ ] Pull funded campaigns from the three sources: **Kickstarter** (Discover, by category + "successful" + recently-ended), **Indiegogo** (ended, funded), **BackerKit** (live + recently-launched crowdfunding projects).
- [ ] Filter to the beachhead: **hardware, design, made-to-order**, with a real fulfillment delay and a large backer list. Skip digital, skip same-week-ship.
- [ ] Record each campaign's end date. Add the estimated ship window the creator stated (or 60 to 120 days out if unstated). That window is the trigger clock.

**Refresh (every week, same day):**
- [ ] Re-run the scrape. Add new funded campaigns to the bottom.
- [ ] Sort by who is now **inside their fulfillment window** (campaign ended 30+ days ago, product not yet shipped). These are this week's targets.
- [ ] Flag any that just opened preorders on their own Shopify store (the "moved to Shopify" signal).
- [ ] Queue raw signals; do not write hooks yet. Hooks get written in batch (Section C).

**Rule:** a trigger you find by hand once is not a system. The calendar refreshed weekly is the system. Never send to a brand whose trigger you cannot see on their public page.

---

## B. Detecting the highest-intent triggers (daily, ~20 min)

Mid-fulfillment with visible strain is the strongest signal there is. These prospects jump the queue.

Scan the active-window brands from the calendar for, in priority order:

- [ ] **A posted delay update** (campaign update titled "shipping update," "delay," "timeline change"). The creator has admitted slippage publicly. Highest intent.
- [ ] **Angry backer threads** — comment feeds with "where's my order?", "is this a scam?", refund or chargeback mentions, repeated unanswered questions. Screenshot the public thread (you reference the situation, never the individual backer).
- [ ] **Mid-fulfillment with a large backer list** — ended 60+ days ago, no ship notice, hundreds-plus backers. The wave is coming even if the comments are quiet.
- [ ] **The three-timeline juggle** — backers + BackerKit late-pledges + new Shopify preorders running at once. The "who is who and what timeline" pain.

For each hit:
- [ ] Mark `trigger spotted` in the calendar with one line naming the exact thing (the delay-update date, the angry-thread topic, the campaign name).
- [ ] Move it to the front of today's send queue. One trigger per prospect, the freshest one. Stacking signals reads like a research report, not a conversation.

---

## C. The free 15-minute teardown — the artifact (batch, ~15 min each)

The teardown is the credential. It replaces the case study you do not have. Produce one per priority prospect before you send. Frame it as already made: "I'm doing free 15-min presale-support teardowns for a few crowdfunding brands mid-fulfillment. Want one?"

**What you actually do (the teardown itself):**
- [ ] Open their public presale surface: campaign comments, the brand's reply pattern, their FAQ/shipping page, any visible helpdesk auto-reply.
- [ ] Read their wait against the day-stage map. Find **the 2 or 3 points in their wait where backers are most likely to bail** — typically the first long silence, the day the stated ship date passes with no word, and the post-delay-update stretch.
- [ ] Note where their current answer fails: a day-20 reassurance answer given to a day-80 customer, a "standard shipping" auto-reply on a product that has not shipped, a hard date they promised that is now slipping.
- [ ] Draft, for one real recurring question on their feed, the **timeline-aware reply** the brand kit voice would send: acknowledge the feeling first, then an honest ETA band, never an invented hard date. (See `tideover-brand-kit.md` §9 voice-in-one-swap.)

**What you show them (the deliverable, on the call or in the DM):**
- [ ] The 2 to 3 bail points on *their* wait, named to their campaign.
- [ ] One before/after: their current answer to a real question vs. the timeline-aware version. Show, do not claim.
- [ ] The bolt-on truth: this rides on the helpdesk they already run and touches only presale tickets.
- [ ] No deck. No metrics. No fabricated refund numbers. The teardown is the proof.

**Voice + proof check before it ships:**
- [ ] Honest confidence bands only ("currently tracking for [month]" / "ETA band X to Y"). Zero hard dates.
- [ ] War story, not the $2M number.
- [ ] Read it aloud. Run the `copy-standard.md` pass. Cut 30 to 60%.

---

## D. The concierge-pilot setup (on a yes)

When a teardown converts to interest, the offer is the **founding-partner concierge pilot**: founder + AI run their presale support by hand for one cycle, inside the partner's own helpdesk. Nothing is built; you prove the language first.

- [ ] **Confirm the bolt-on, up front.** Only presale/preorder tickets route to you. Every other ticket stays in their Gorgias / Tidio / Intercom, handled exactly as today. Nothing to migrate, nothing for the team to learn.
- [ ] **Get access to their existing helpdesk** (a seat, a shared inbox, or a forwarding rule on presale tickets). You work inside their tool, not a new one.
- [ ] **Pull each order's real production timeline** from the creator so replies are timeline-aware per order.
- [ ] **State the live-support SLA plainly:** replies approved in two fixed daily windows (AM + PM). Between windows, only a small pre-approved, timeline-safe holding set may auto-send ("Got your message, here's your current ETA band, full reply by [next window]").
- [ ] **Novel replies are always human-approved, never auto-sent.** A false delivery promise is more damaging than a slow reply. This is the load-bearing trust rule.
- [ ] **Set the baseline before you touch a ticket:** their current first-response time, the WISMO volume, so the leading-indicator delta is measured against a clean number.
- [ ] **Name the honest proof horizon:** the leading indicators (faster first response, fewer repeat WISMO tickets, logged saves) land in this cycle; the full refund-reduction case study only after the cohort finishes its wait. Say so.
- [ ] Pilot is free, converting to **$199 to $299/mo**. Hold pricing for the pilot wrap, not the cold DM.

---

## E. The daily touch routine (~60 to 90 min total)

Personal LinkedIn / X / IG first. These are the gate-critical Week 1/2 sends. The warmed tideover.app domain is next-cohort email only, not the critical path. Cap: 15 to 25 messages per platform per day.

**Order of the day:**
1. [ ] **Refresh + scan (Sections A/B):** pull today's active-window and high-intent prospects into the send queue.
2. [ ] **Warm before cold.** Mine any 2nd-degree or community path first. Where a path exists, warm it: like, then one substantive comment, then the DM referencing it.
3. [ ] **Write the batch.** For each priority prospect: one true trigger line + the teardown offer + one soft ask. Pull the exemplar that matches the trigger:
   - mid-fulfillment → `copy-standard.md` #5
   - just moved to Shopify → #6
   - "we already have a helpdesk" reply → #7
4. [ ] **Send, personal accounts first** — LinkedIn, then X, then IG. Signal-matched only; no trigger, no send.
5. [ ] **Presence, not pitch:** one genuinely-helpful comment in Shopify Community / Gorgias Community / r/shopify / BackerKit Community. Mine voice-of-customer while there (exact pain phrasing for future hooks). Never pitch in-community. (`copy-standard.md` #8 is the model.)
6. [ ] **Work the replies** with the warm-reply objection tree (`copy-standard.md`): "just send info" → make the teardown the info; "what's your pricing?" → defer to the call's real number; ghosted → one re-engage with new value, then stop.
7. [ ] **Log every touch** in the calendar (`last touch`, `stage`). Move any reply straight into the pipeline.

**Pre-send filter — fail one, do not send:**
- [ ] Would 10x this today make them trust me less?
- [ ] Does it ask for attention before earning it?
- [ ] Can they see the trigger is true and specific to them, and could no competitor copy the line?
- [ ] Any fabricated number, hard date, or implied case study? (Kill it.)
- [ ] If they reply "not now," do I have a respectful next step?

**The deliverable is consistency.** What you skip today shows up 90 to 180 days out. Prospecting has a half-life. The routine runs every working day or it is not a system.
