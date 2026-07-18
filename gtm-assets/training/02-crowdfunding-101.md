# 02 — Crowdfunding 101: how the Kickstarter world actually works

Internal training doc. Audience: Dylan. Goal: understand the lifecycle, the money rails, and the vocabulary well enough that a crowdfunding operator recognizes you as someone who has fulfilled a campaign, not someone who read about one. Every external number keeps its source. Insider terms are **bold** on first use.

## If you only remember five things

1. **The chargeback clock starts at expected delivery, not purchase.** Visa reason code **13.1** (Merchandise Not Received) is filable up to **120 days after the expected delivery date**, capped at 540 days from the transaction, after a mandatory 15-day issuer wait ([Kount](https://kount.com/chargeback-reason-codes/visa/merchandise-services-not-received)). Every ETA slip extends the merchant's exposure. Get this backwards and any real operator writes you off.
2. **Three money rails, not one.** Kickstarter backers paid Stripe through Kickstarter (disputes claw back from the creator). Shopify preorder buyers paid Shopify Payments (disputes route there). Indiegogo has its own reserve. The merchant's remedies differ per rail.
3. **Silence breaks trust, not delay.** The norm is a monthly update floor, weekly during problems. Backers can formally request an update after 4 weeks of silence, and Kickstarter can restrict chronically silent creators ([Kickstarter](https://www.kickstarter.com/help/handbook/updates)).
4. **WISMO peaks 60-90 days after funding, then again after dispatch.** The wait is not the only pain window. Address changes, customs, split shipments, and stalled tracking create a second surge exactly when merchants think they're done.
5. **Tideover lives after the survey.** Pledge managers (BackerKit, PledgeBox) own address collection and add-ons. You never touch the backer list. You handle the wait.

---

## The campaign lifecycle, end to end

**1. Live campaign (30-60 days).** Backers **pledge** money for a **reward tier**. Kickstarter is **all-or-nothing**: hit the goal by the deadline or nobody is charged ([Kickstarter](https://www.kickstarter.com/help/handbook/funding)). **Stretch goals** unlock extra items as funding climbs, and are a classic source of later delay.

**2. Payment collection (~14 days after close).** Cards are charged. Failed cards retry for about a week (**pledge drop** = the pledges lost when a card never clears). Kickstarter takes 5% plus Stripe processing (~3% + $0.20 per pledge over $10) ([Kickstarter](https://help.kickstarter.com/hc/en-us/articles/115005028634-What-are-the-fees)).

**3. Pledge manager survey.** The creator moves backers into a **pledge manager** (BackerKit, PledgeBox, PledgeManager.com, Gamefound, or Kickstarter's native one). The **backer survey** collects or re-confirms shipping addresses, sells **add-ons**, and charges shipping and tax. Addresses are collected here, not at pledge time, because they go stale over a 60-120 day wait ([BackerKit](https://www.backerkit.com/pledge-manager)). BackerKit's **smoke test** sends the survey to ~5% of backers first to catch pricing/SKU errors.

**4. Manufacturing (60-120 days, often longer).** Sourcing, tooling, production, QC, then freight. This is the wait Tideover was built for.

**5. Fulfillment in waves.** Crowdfunding 3PLs ship in **fulfillment waves** (early birds first, then main wave, then late pledges), usually split by region through **regional hubs** ([Fulfillrite](https://www.fulfillrite.com/blog/guide-to-international-fulfillment-for-kickstarter-2025/)). "You're in Wave 2, shipping from the EU hub" is native vocabulary.

**6. Post-dispatch.** Not the end. Address changes, split shipments, damaged/missing items, customs bills, and stalled tracking generate a second WISMO surge.

---

## How backer data actually flows

The chain, in order:

1. **Kickstarter backer report** — the creator's CSV export of backer name, email, tier, and amount ([Kickstarter data FAQ](https://help.kickstarter.com/hc/en-us/articles/25922705763355-Third-Party-Pledge-Manager-Data-FAQs)). Kickstarter restricts how this data may be used: no unsolicited marketing to backers who didn't opt in through the merchant's survey or store.
2. **Pledge manager survey** — the creator uploads that report into BackerKit/PledgeBox, which surveys backers and produces a clean fulfillment export with confirmed addresses and add-ons.
3. **Shopify / 3PL** — the export flows to the store (for late pledges and preorders) and to the 3PL for shipping.

**Where Tideover fits, and the compliance line:** merchants already hold the backer report CSV and the pledge-manager export. Tideover accepts those files as an import to seed customers and orders. No Shopify admin scope, no passwords. And Tideover only ever messages people who contacted the merchant or transacted with the store, never the raw backer list. That last point is a selling point, not a limitation: cold-emailing KS backers who never opted in risks the merchant's Kickstarter account.

---

## Where WISMO concentrates, and when

- **Days 0-14 post-funding:** low. Backers are still excited.
- **Days 60-90:** the first peak. Manufacturing drags, the disclosed ETA approaches or slips, anxiety climbs. Scrape recently-funded hardware campaigns and you can pitch just before this hits.
- **At every ETA slip:** a spike, compounded socially because Kickstarter campaign comments are public and read by every co-waiting backer. One hostile comment infects the queue.
- **Post-dispatch:** the second peak. Stale addresses (the reason surveys exist), split shipments, damage on arrival, customs, and tracking that stops updating.

The domain-native move: a timeline that ends at "dispatch" reads fake. Most anxious WISMO happens after production, through freight, customs, and hub distribution.

---

## The money rails (get these exactly right)

This is the section that makes or breaks credibility. An operator who has fought a chargeback will disqualify you on one wrong sentence.

**The chargeback clock.** A **chargeback** (or **dispute**) is the buyer asking their card issuer to reverse the charge. For undelivered goods, the governing code is **Visa 13.1** (Mastercard 4855, Amex 155, Discover 4755). It is filable up to **120 days after the expected delivery date**, with a hard cap of **540 days from the transaction**, and there's a mandatory **15-day issuer wait** after expected delivery before it can be filed ([Kount](https://kount.com/chargeback-reason-codes/visa/merchandise-services-not-received), [Chargebacks911](https://chargebacks911.com/chargeback-reason-codes/visa/13-1-merchandise-services-not-received/)). The disclosed ETA is the legal trigger. Every slip literally extends how long the merchant's money stays exposed. Say "the window runs from expected delivery," never "from purchase."

**Rail 1 — Kickstarter backers.** They paid Kickstarter, which runs on Stripe, at campaign close. Kickstarter **never issues refunds**; refunds are entirely creator discretion, processed via Stripe ([Kickstarter](https://help.kickstarter.com/hc/en-us/articles/115005048173-Does-Kickstarter-issue-refunds)). If a backer disputes, Kickstarter handles the **representment** (the evidence-backed rebuttal) and **bills the creator** if the dispute is lost. Crucially: a KS backer cannot chargeback through the merchant's Shopify Payments. Counting KS-backer GMV as Shopify dispute exposure is wrong, and anyone who knows the mechanics will catch it.

**Rail 2 — Shopify preorder buyers.** They paid Shopify Payments directly and dispute there. The merchant pays a **$15 fee** (US, returned if they win), gets roughly 7-21 days to submit evidence, and resolution can take up to ~120 days ([Shopify](https://help.shopify.com/en/manual/payments/chargebacks/chargeback-process)). Shopify's dispute form asks for order confirmations, customer communications, disclosed policies, and proof the customer had a resolution path. That evidence is exactly Tideover's message log plus disclosed ETA plus status-page view history. Frame the Evidence Pack as "the evidence Shopify's dispute form asks for," never as a win-rate promise.

**Rail 3 — Indiegogo.** Different fear profile (see below).

---

## Update cadence norms

Updates are the single biggest ticket-deflection lever in this niche, and Kickstarter's own guidance is that a plain, timely update beats a polished one that never comes ([Kickstarter updates blog](https://updates.kickstarter.com/how-to-communicate-kickstarter-delays-without-losing-backer-trust/)).

- **Monthly is the floor.** Every ~3 weeks when stable. **Weekly during active problems.**
- **The 4-week mechanism.** After 4 weeks of silence, backers can formally request an update, and Kickstarter can restrict accounts of chronically silent creators ([Kickstarter](https://www.kickstarter.com/help/handbook/updates)).
- **Silence, not delay, flips backers hostile.** Backers forgive a slipping date if they hear from you. They turn on silence.

Tideover drafts the monthly **update** from the same stage data that powers ticket replies, but draft-only: the creator posts it. Never auto-post to Kickstarter, and never imply Tideover can. That's the creator's account and their ToS exposure.

---

## Indiegogo differences (know the contrasts)

An Indiegogo merchant's fear profile differs from a Kickstarter one, and the ICP doc should say so:

- **Fixed vs flexible funding.** **Fixed** refunds everyone if the goal is missed. **Flexible** lets the creator keep whatever was raised and still owe the perks ([Indiegogo](https://support.indiegogo.com/hc/en-us/articles/204092046-InDemand-FAQ)).
- **InDemand / late pledge fees.** 5% native, 8%+ (up to 15%) on platform-driven funds for external campaigns ([Indiegogo InDemand](https://support.indiegogo.com/hc/en-us/articles/204092046-InDemand-FAQ)).
- **Reserve.** Indiegogo automatically holds **5% of funds for 6+ months** rolling, against refunds and chargebacks ([Indiegogo](https://support.indiegogo.com/hc/en-us/articles/360000990627-Reserved-Funds-FAQ)).
- **InDemand refund window.** Indiegogo refunds InDemand orders within 10 days unless the perk is locked or fulfilled ([Indiegogo refund policy](https://support.indiegogo.com/hc/en-us/articles/526876-Indiegogo-Refund-Policy)).

---

## The crowdfunding glossary

- **Backer** — someone who pledges money for a promised reward; a project supporter, not a retail buyer, which is why platforms guarantee neither delivery nor refunds.
- **Pledge** — the money a backer commits; on Kickstarter, charged only if the campaign hits its goal.
- **All-or-nothing** — Kickstarter's model: reach the goal or nobody is charged.
- **Fixed vs flexible funding** — Indiegogo's two modes (refund everyone vs keep what's raised).
- **Reward tier** — the package a backer selects at a pledge level; becomes the SKU at fulfillment.
- **Stretch goal** — extra items unlocked as funding passes milestones; a scope-creep and delay source.
- **Add-on** — an extra item bought on top of a pledge, usually in the survey.
- **Early bird** — a discounted, limited tier for the first backers; ships in the first wave.
- **Pledge manager** — the post-campaign tool (BackerKit, PledgeBox, PledgeManager.com, Gamefound) that surveys for addresses, sells add-ons, charges shipping, and produces the fulfillment export. **Kickbooster is a referral/affiliate tool, not a pledge manager.**
- **Backer survey** — the pledge manager's questionnaire; where addresses are collected because they go stale over the wait.
- **Smoke test** — BackerKit sending the survey to ~5% of backers first to catch pricing/SKU errors.
- **Backer report** — Kickstarter's CSV of backer name, email, tier, amount; use is restricted (no unsolicited marketing).
- **Late pledge / InDemand** — continuing to take orders after the campaign (KS Late Pledges, IGG InDemand, or a Shopify preorder store). The moment the audience becomes Shopify customers, and Tideover's home turf.
- **Pledge drop / failed payment** — pledges lost when a card fails during collection; retried ~a week, then chased or lost.
- **Fulfillment wave / shipping wave** — shipping in batches (early birds → main → late pledges), often by region.
- **3PL** — third-party logistics provider that warehouses and ships rewards; crowdfunding-savvy ones run regional hubs.
- **Regional hub / EU-friendly shipping** — bulk-freighting inventory into an EU/UK warehouse so backers avoid surprise customs bills; "EU-friendly" is a badge backers look for.
- **IOSS** — EU Import One-Stop Shop: collecting EU VAT upfront on parcels under €150 so packages clear customs without dunning the backer; a top EU-backer inquiry.
- **Chargeback / dispute** — the buyer reverses the charge via their issuer.
- **Reason code 13.1** — Visa's Merchandise Not Received code; 120 days from expected delivery, 540-day cap, 15-day issuer wait.
- **Representment** — the merchant's evidence-backed rebuttal; on Kickstarter, KS handles it and bills the creator if lost.
- **Reserve** — funds held against future refunds/chargebacks; Indiegogo holds 5% for 6+ months.
- **Update (project update)** — the public post on the campaign page; monthly floor, weekly during problems.

---

## The 6 mistakes that instantly out you as an outsider

1. **Getting the chargeback clock backwards.** Saying the dispute window runs from purchase. It runs 120 days from expected delivery (540-day cap). Telling a merchant "the window expires before you ship" is wrong and disqualifying.
2. **Wrong rail.** Telling a KS-backer merchant they can fight the backer's chargeback through Shopify Payments. KS backers paid Stripe through Kickstarter; disputes claw back from the creator.
3. **Assuming Kickstarter refunds backers.** It never does. Refunds are creator discretion via Stripe.
4. **Calling a hard delivery date a trust-builder.** A hard date is what gets the chargeback when it slips. Pros give a confidence band, never a fixed date.
5. **Thinking the timeline ends at "dispatch."** Most anxious WISMO is after production: freight, customs, EU/UK hubs, waves, and post-dispatch issues.
6. **Confusing the tooling.** Calling Kickbooster a pledge manager, or proposing to rebuild the survey stage BackerKit already owns. And using "backers" and "customers" interchangeably. Backers are supporters; the copy layer changes based on which group an order belongs to.
