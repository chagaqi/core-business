# TIDEOVER MARKET RECON — 2026-07-10

Synthesized from 8 research lanes, an adversarial bear case, and an independent fact-check. Where the fact-check contradicts a lane, the correction wins and is marked **[CORRECTED]**. VERIFIED = a researcher read the source. INFERRED = concluded, not read.

---

## 1. THE ANSWER IN SIX SENTENCES

Tideover is not a helpdesk, a tracking app, or an AI deflection bot; it is the workflow layer for the 60-120 days between charge and shipping label, a window every adjacent product's data model ignores because their core object is a ticket, a carrier scan, or a pledge survey. In the CSR job it currently HANDLES triage and reporting (risk-ranked queue, day-0 baseline, cohort forecast, outcome ledger), ASSISTS the two biggest wait-window tasks (WISMO reply drafting and pre-ticket deflection), and IGNORES address changes and order edits. Its marketplace value is the combination: risk-scored inbox + hard-date-free drafting + confidence-band status pages + backer CSV import, which none of the ~20 vendors checked offers together (verified absence), even though every individual piece is replicable and standalone pre-shipment status-page apps already exist on Shopify **[CORRECTED]** (https://apps.shopify.com/statuspro). The buyer where the economics clear is the distressed mid-size campaign (roughly 800-1,500 campaigns/yr globally raise $100K+, per Statista/Kickstarter stats), a founder doing 20+ hours a week of support amid visible backer anger, not the pre-pain merchant comparing us to a $60 Gorgias plan. We sell retention through the wait (prevented refunds, chargebacks, founder hours), never per-ticket cost savings, a spreadsheet we lose against a ~$300/mo part-time VA or $0.99/resolution Fin. This is a viable niche wedge, not open whitespace, and demand is campaign-shaped (3-4 month customers), so the 90-day plan is: fix the six P1s, ship exactly one integration (Help Scout), and run symptom-led outbound to campaigns already in trouble.

---

## 2. LANDSCAPE MAP

### Ring 1 — Helpdesks (the ticket layer)

Helpdesks start at the ticket. They optimize speed-to-close and now all meter AI per resolution on top of seats or ticket volume; none knows the buyer is at day 73 of a 90-day wait or which backer is about to charge back. Tideover sits beside them for two segments (Help Scout, Zendesk, Gorgias merchants) and replaces nothing here yet: approve = copy-to-clipboard until write-back ships.

| Vendor | Pricing (2026) | Native AI | Integration surface | ICP evidence |
|---|---|---|---|---|
| Gorgias | $10-$900/mo by ticket volume, never per-seat (https://www.gorgias.com/pricing) | AI Agent $0.90-1.00/resolution, double-billed with ticket | REST API, HTTP-integration webhooks, JSON sidebar widgets; NO draft concept (https://developers.gorgias.com/reference/create-ticket-message); OAuth apps get 80 req/20s **[CORRECTED, favorable]** | Dominant Shopify-DTC helpdesk (~21K stores); ships a Kickstarter email-relay integration (https://docs.gorgias.com/en-US/kickstarter-81946) |
| Zendesk | Suite $55-$169/agent/mo | AI per Verified Resolution ~$1.20-2 | Full API + signed webhooks on ALL plans (https://support.zendesk.com/hc/en-us/articles/4408839108378); private sidebar apps need Growth+/Professional+ | Strongest verified crowdfunding footprint: BackerKit's official helpdesk integration, Kickstarter's own support, live creator help centers |
| Help Scout | Free/$25/$45/$75 per user/mo (https://www.helpscout.com/pricing) | AI Drafts free from Standard; AI Answers $0.75/resolution | OAuth2 API, first-class webhooks, and the ONLY native draft-back: `draft: true` on reply threads (https://developer.helpscout.com/mailbox-api/endpoints/conversations/threads/reply/); custom sidebar apps likely Pro-only ($75/user) **[CORRECTED]** | On BackerKit's helpdesk list; ships the documented Kickstarter email relay (https://docs.helpscout.com/article/863-kickstarter) |
| Re:amaze | $29-$69/seat, $59 flat Starter (https://www.reamaze.com/pricing) | Bundled AI resolutions, $0.85 extra | Best sidebar (Custom Module iframe, HMAC-signed); no ticket-event webhooks documented, no draft concept | Cheap seats fit small preorder brands; no direct crowdfunding evidence |
| Freshdesk | $19-$89/agent/mo | Freddy Copilot $29/agent, Pro+ only | API-key auth, automation webhooks; docs show stale plan names, re-verify at build | Real indie-creator portals exist; absent from BackerKit's list |
| Richpanel / Intercom / Front | $200/mo AI min + $100/seat; ~$29-132/seat; $25-105/seat | Fin $0.99/outcome (Intercom) | Thin, OAuth-heavy, or plan-gated surfaces | None found for crowdfunding (INFERRED poor fit) |

### Ring 2 — AI CS agents (the deflection layer)

Every player sells deflection: auto-resolving post-purchase tickets from order and tracking data. During a 60-120 day pre-shipment wait that data does not exist, so these bots either deflect with boilerplate or hallucinate a date; Moffatt v. Air Canada (Feb 2024, mccarthy.ca) established the merchant eats the liability for an invented policy. Verified across all eight: no vendor mentions preorders, backers, crowdfunding, or wait-window messaging. Tideover does not compete on automation rate; it does not sit in this ring.

| Vendor | Entry cost | Pre-shipment capability |
|---|---|---|
| Intercom Fin (Salesforce acquiring, ~$3.6B, close early 2027) | $0.99/outcome, 50-outcome/mo minimum (https://fin.ai/pricing) | None; generic KB answerer |
| Gorgias AI Agent | $0.90-1.00/resolution + ticket fee | WISMO = Shopify tracking lookup; reviewers report hallucination (ringly.io) |
| Siena | $750/mo floor + $0.90/conversation (https://www.siena.cx/pricing) | None |
| Yuma | Opaque, Shopify-order dependent | None; power comes from fulfillment data that doesn't exist pre-ship |
| DigitalGenius | ~$1K/mo entry | Closest neighbor, but all post-dispatch carrier events |
| Zowie / Tymely / Decagon | Enterprise, quote-only, ~$50K/yr (Decagon) | None; name-drops for objection handling only |

### Ring 3 — Post-purchase / WISMO tools (the tracking layer)

These products wake up at the carrier scan; their economics are per-shipment and their "pre-shipment" features cover days of warehouse processing, not months of production. **[CORRECTED]** The narrow claim "no preorder status page app exists" is FALSE: StatusPro ($9-99/mo) and W3 Custom Order Status sell customer-facing custom-status lookup pages today, and a Mar-2026 Shopify thread naming this need got Parcel Panel/Tracktor suggestions (https://community.shopify.com/t/preorder-status-page/591506). What survives disconfirmation: none of them touch 60-120 day waits, confidence bands, refund-risk scoring, a support inbox, or backer import. Tideover sits here only as the wait-window system, never as a tracking-page competitor.

| Vendor | Pricing | Pre-shipment reality |
|---|---|---|
| Track by Loop (ex-Wonderment) | $99/$189/$449 **[CORRECTED: $449 top tier, not $349]** (apps.shopify.com/wheres-my-order) | Shipment events only; Wonderment exited into Loop, cautionary precedent |
| Malomo | ~$49-400/mo + per-message | Starts at tracking number |
| AfterShip | Free-$239 tiers | "Pre-Shipment Tracking" exists BY NAME, Enterprise-only, fulfillment-status driven, silent on multi-month waits (support.aftership.com article iw0y20) |
| Shipup / parcelLab / Narvar | ~$299/mo floor / enterprise | Pre-shipment = the days-long processing gap by their own glossary |
| StatusPro / W3 | $9-99/mo | Standalone status pages, no inbox/risk/bands/backer import **[CORRECTED addition]** |

### Crowdfunding channels (where the tickets actually are)

No backer-data API exists anywhere: Kickstarter has no public API, BackerKit has none (https://help.backerkit.com/article/583-overview-of-exports), Gamefound/Indiegogo expose read-only project stats. CSV is the only interchange (KS backer report, BackerKit exports, Gamefound orders, PledgeBox), and Kickstarter's native Pledge Manager is now GA for all creators (updates.kickstarter.com/bringing-the-kickstarter-pledge-manager-to-all-creators/), so KS-native CSVs will rival BackerKit exports. Support flows through: KS inbox messages (reachable only via the proven email-relay trick Help Scout/Gorgias document), public KS comments (NOT capturable as tickets), BackerKit ticket forwards to the creator's support email (48h SLA, help.backerkit.com/article/580), and bare Gmail. Pledge managers do logistics and broadcast updates, not per-buyer anxiety. Tideover's CSV import + status page fits this channel exactly; Tideover does not sit in comment moderation or pledge management.

---

## 3. THE PRESALE GAP

**Verdict: PARTIALLY REAL.** Real as a workflow category, unproven as a market, and false as a literal feature claim.

**What is verified real:** Across 14+ vendors, the combination absence held under active disconfirmation: nobody combines wait-window status pages + support inbox + refund-risk scoring + confidence bands + backer CSV import for 60-120 day waits, and no platform or pledge manager offers a backer-facing status page (fact-check re-verified both). Incumbent data models genuinely start at the carrier scan and their per-shipment economics point away from months of zero tracking events. The buyer visibly exists: founders doing 20+ hrs/week of support mid-crisis (blog.groovehq.com/startup-ceo-customer-service; stonemaiergames.com/kickstarter-lesson-72), with preorder disputes clustering as item-not-received driven by delays and silence (chargeflow.io).

**What is not:** (a) Feature-level uniqueness: AfterShip sells "Pre-Shipment Tracking" by name and StatusPro sells status pages at $9/mo **[CORRECTED]**; copy must never claim the status page alone is unique. (b) Monetizability: no lane sized the market, and the data says it is small: ~11,866 KS projects ALL-TIME raised $100K-$999K, under 1,000 ever raised $1M+, so roughly 800-1,500 sweet-spot campaigns/yr globally, each a 3-4 month customer. Willingness-to-pay evidence is zero; every lane's own gap disclosure conceded demand-thread evidence was thin.

**The bear case beside it:** The real incumbent is free: a monthly Kickstarter update (Stegmaier doctrine, reaches all backers, IS a status page), a pinned comment, and batch-answered Gmail; at the briefs' own workload math (~1,000 tickets/90 days ≈ 11/day) a part-time PH VA at $5-7/hr costs $300-420/mo, under our $499 tier. Hard-date-free drafting is replicable as a system-prompt rule in Fin or Help Scout AI Drafts today; the 52K-invariant eval harness is real engineering but invisible to buyers. And Wonderment, funded and Shopify-native, could not sustain a standalone company adjacent to this window. Conclusion: the gap supports a wedge into distressed mid-size campaigns, not a land-grab, and the free-update-plus-VA stack is the competitor every pitch must displace.

---

## 4. THE CSR ROLE MAP

Anchors: WISMO is 25-40% of inbound normally, 50%+ in delay periods, and a preorder brand lives in the delay band for the whole window (INFERRED, no preorder-specific split published). ~80% of ecommerce volume is a handful of repetitive issues (gorgias.com/blog/customer-support-metrics). Do NOT build copy on WISMOlabs' $6/ticket figure: vendor-loaded; the bootstrapped ICP's cash cost is ~$1 (VA) or $0 (founder) **[CORRECTED]**.

| CSR task | Tideover today | What moves it up |
|---|---|---|
| Queue triage/prioritization | **HANDLES** (risk-ranked inbox) | Live helpdesk sync keeps it real-time |
| WISMO reply drafting | **ASSISTS** (AI drafts, hard-date-free, human-approved) | → HANDLES via native write-back; clipboard keeps agents in two tabs, the exact drain Gorgias monetizes (Princess Polly: 40% efficiency / 80% resolution-time claims) |
| WISMO deflection pre-ticket | **ASSISTS** (status pages) | → HANDLES: ship status-link delivery (known P1) + auto-inject link into replies; measure deflection % |
| Refund-demand de-escalation | **ASSISTS** (risk score + gated goodwill) | Escalation playbooks by risk band; save-rate in ledger |
| Chargeback prevention/response | **ASSISTS** (implicitly; proactive comms is the documented INR preventer, chargeflow.io) | One-click dispute evidence-pack export (status comms + acknowledgments per order), near-free, converts calm into dollars |
| Address changes | **IGNORES** | Biggest concrete unserved pain (~200 emails/4mo per pledgebox.com); status-page intake form → CSV is the cheap v1 |
| Backer-update posts | **IGNORES** | AI-drafted update generator from existing confidence-band data; creators hate writing "still delayed" |
| Public comments/social | **IGNORES** (spec only) | Keep deprioritized; social DMs shrinking per Gorgias research |
| Returns/missing parts (post-delivery) | **IGNORES** | Correctly out of scope; Loop/Gorgias own it |
| Reporting/summaries | **HANDLES** (baseline, forecast, ledger, CSAT, SLA, export) | Strongest differentiated surface; the baseline report is the outbound hook |
| Order edits/refund execution | **IGNORES** (no Shopify Admin API) | Acceptable v1; write-back outranks order-edit parity |

---

## 5. INTEGRATION MATRIX + BUILD ORDER

**[CORRECTED]** Three lanes each declared a different "the ONE" (Help Scout / Zendesk / email ingest). That was one unmade decision; here it is made.

| Platform | Shape | Size | Tier gating (merchant side) | Verdict |
|---|---|---|---|---|
| **Help Scout** | Webhook-in → existing HMAC ingest + write-back via `draft: true` (approve in Tideover, draft lands in the composer). Skip the sidebar app: likely Pro-only ($75/user) **[CORRECTED]** | M (2-4 wks solo; lane's 1-2 wk estimates were engineer-optimism **[CORRECTED]**) | API/webhooks from Free/Standard | **FIRST** |
| **Zendesk** | Token-auth API + trigger-fired signed webhooks; write-back = public comment on approve. No ZAF app, no marketplace review | M | None: API + webhooks on all plans (VERIFIED) | **NEXT**, trigger = 2+ pipeline prospects on it |
| **Gorgias** | OAuth2 app: webhook-in, JSON sidebar widget (risk/wait/status-link), draft compromise = internal note or macro (no draft concept, VERIFIED) | M | API all plans; OAuth apps get 80 req/20s **[CORRECTED]** | **NEXT**, post-revenue, as partner-store motion |
| Freshdesk | Zendesk clone, API-key auth | M | Paid plans | NEXT, only on prospect demand |
| Kickstarter | No API exists. Integration = CSV import (keep formats current with the new native Pledge Manager report) + the email relay THROUGH the merchant's helpdesk | S (formats) | n/a | FIRST (already core) |
| BackerKit | No API; BD conversation via the Zendesk/Help Scout wedge; partner AND most credible future competitor | n/a | n/a | NEXT, opportunistic |
| Shopify App Store | OAuth + GDPR webhooks + Billing API; $19 fee, 0% rev share to $1M (shopify.dev/docs/apps/launch/distribution/revenue-share) | L | Zero organic installs pre-reviews (community.shopify.com/t/643974) | NEXT, after 3-5 reviewable customers |
| Own email ingest/reply-out | SPF/DKIM/DMARC, bounces, threading, spam liability: a mini-helpdesk build competing with $10-60/mo products **[CORRECTED: lane sized it an order of magnitude too small]** | L-XL | n/a | **NEVER** (ride helpdesk relays instead) |
| Re:amaze | Iframe module + polling ingest (no event webhooks documented) | M | All plans | NEVER for now |
| Richpanel / Intercom / Front | Headless bridge / OAuth Canvas Kit / plugin | M-L | Pricing drift / Fin overlap / $65-seat webhook gate | NEVER |

**The one to build in the next 90 days: Help Scout.** Reasons: (1) `draft: true` is the only native draft-back in the market (VERIFIED at primary source) and it deletes the worst P1, approve-equals-clipboard, with zero UX compromise. (2) Help Scout's documented Kickstarter email relay means this single adapter serves BOTH segments: a no-helpdesk creator gets onboarded onto Help Scout Free/$25, KS messages and BackerKit forwards arrive as tickets, Tideover scores and drafts, the approved draft appears natively, and the reply relays back inside Kickstarter, all without Tideover owning deliverability. (3) It is on BackerKit's official helpdesk list, giving the later BD wedge. Zendesk follows because it has the strongest verified footprint among larger campaigns; it is a fast clone of the same adapter seam. This decision kills the email-ingest build and defers Gorgias until the partner motion is worth its OAuth review cycle.

---

## 6. POSITIONING

**Category to claim: "pre-shipment customer support," sold as "support for the wait."** "Presale support" fails externally (owned by B2B sales-engineering tools); "backer relations" is page-level vocabulary for the creator segment only. The category noun does zero acquisition work, nobody searches it; every early customer comes from symptom-led outbound ("angry backers," "kickstarter fulfillment delay," "preorder where is my order").

**Value prop per ICP flavor:**
- **KS/BackerKit creator in fulfillment:** "Tideover turns your backer mob into a managed queue: every 'where's my pledge?' ranked by refund risk, a calm promise-free reply drafted for your approval, and a live status page that answers before they ask, so you spend your days shipping, not apologizing."
- **Shopify preorder brand:** "Tideover covers the 60-120 days your helpdesk and tracking app both go quiet: it scores which preorder customers are about to charge back, drafts hard-date-free replies your team approves, and gives every buyer a branded status page, so long lead times stop turning into refunds."

**Layer vs replacement, resolved:** Today, Tideover is a command center that works alongside whatever the merchant has; the "we ARE the inbox" replacement story is a post-P1-fix story, not current **[CORRECTED: with replies not sending, no status-link delivery, and the 2k import cap, v1 cannot yet replace a Gmail inbox for the flagship buyer]**. Once the P1s and the Help Scout adapter ship, lead creators with replacement (they have no helpdesk to displace) and brands with layer-on-Gorgias/Zendesk. One site holds both if the hero leads with the problem (the wait) and forks by audience; the hero never says "helpdesk."

**Channel conflict, resolved [CORRECTED]:** Do not simultaneously court Gorgias's App Store and attack Gorgias AI's accuracy in outbound. Rule: in partner channels and listings, the enemy is generic ("auto-resolution bots invent ship dates; Air Canada set the liability precedent"), never a named partner. Named accuracy critiques are reserved for non-partner competitive contexts.

**The 8 objections:**
1. "I already pay for Gorgias/Zendesk." → They optimize speed-to-close per ticket; nothing in them knows you are at day 73 of a 90-day wait or which buyer is about to charge back. We are the wait; they are the ticket. **WEAK until write-back ships; say so plainly and roadmap it.**
2. "$299-749? Gorgias starts at $10." → At real campaign volume Gorgias runs $360-900 anyway; we are priced against the refunds, chargebacks, and founder-hours of the wait, not tickets. Use the Section 7 ROI line, never the old "two chargebacks a month" math **[CORRECTED]**.
3. "ChatGPT + a VA can do this." → A VA gives you no risk scoring, no status pages, no baseline report, and ChatGPT will invent a ship date, the single most expensive mistake in a delay. Strong on capability. **WEAK on cost: a part-time VA is ~$300-420/mo [CORRECTED]; concede the cost point and sell the tooling + liability point.**
4. "AI will promise my backers something you can't deliver." → Every reply is human-approved and the drafting layer cannot emit hard dates by design, enforced by an eval harness. Strong, but frame it as safety discipline, not an unreplicable moat: the visible behavior is copyable via custom AI guidance **[CORRECTED]**, the enforcement rigor is not.
5. "BackerKit/Hive covers this." → They are pledge logistics: surveys, add-ons, shipping. No risk ranking, no reassurance drafting, no confidence-band status pages. Strong; know their stack before the call.
6. "My wait ends in 60 days, why subscribe?" → Buy it for the campaign, cancel when you ship; a full window costs $600-1,500. Fine as an answer; **WEAK as economics (built-in churn), which is why a fulfillment-window pass is on the pricing roadmap.**
7. "Who else uses it?" → No customers yet; founder story (ran a $2M equipment company through COVID with 60+ day waits for two years; built what I needed, docs/founder-story.md). **WEAK until 2-3 design partners exist; buy the logos with discounted pilots.**
8. "How do replies actually reach backers?" → v1: one click copies the approved reply; you paste it where your backers already are. Help Scout adapter makes approve land as a native draft; Zendesk makes it send. **WEAK today, the most exposed demo moment; script it and lead demos with triage + status page, not send.**
9. (Bear-case addition, expect it): "A free Kickstarter update does this." → Updates are broadcast; they cannot rank who is about to refund, answer the 11 individual messages a day, or produce dispute evidence. But concede the overlap and never pitch a merchant whose update cadence is working.

---

## 7. PRICING VERDICT

**Where $299/$499/$749 stands: defensible in a pocket, for the distressed segment only.** Above tracking apps ($49-449 **[CORRECTED]**) and StatusPro at $9-99 (the anchor risk for any status-page-led pitch), at parity with Gorgias Pro ($360), far below Siena (~$2,550/mo at volume) and every full-time human path. The structure (order-volume tiers + bundled seats) matches the market's direction away from per-seat. But it loses the spreadsheet against the actual low-end stack: part-time VA at $300-420/mo, or Fin at ~$50/mo for 50 outcomes **[CORRECTED: the old full-time-VA comparison contradicted our own workload math; retired]**. Qualification (orders in wait-window, AOV, visible distress) beats discounting.

**Strongest TRUE ROI line (all arithmetic on sourced figures):**
> "Preorder disputes are overwhelmingly item-not-received claims triggered by delays and silence (chargeflow.io). Each one that lands costs about 2.4x the order value in fees and labor (Merchant Risk Council): roughly $360 on a $150 order, before Visa's 0.9% monitoring threshold and Mastercard fines that start at 100 disputes a month. If the wait produces even two chargebacks Tideover heads off, a month of the $499 plan is covered, and the rest of the plan buys back the 20+ hours a week founders in fulfillment spend in the queue (blog.groovehq.com/startup-ceo-customer-service)."

Pitch this only to campaigns showing delay symptoms; at baseline chargeback rates (0.17-0.26%) a calm 2,000-backer campaign expects 3-5 disputes TOTAL and the math does not clear **[CORRECTED]**. Add the 3-input break-even calculator (backers × AOV × plan) on the pricing page: it is the Chargeflow-style proof pattern and needs no invented benchmarks.

**Structural risks:** (1) Campaign-shaped demand: 3-4 month LTV of ~$1,000-1,750 means $20K/mo requires ~40-65 concurrent payers replenished continuously; mitigate with a "fulfillment-window pass" wrapper (this ICP already pays BackerKit percent-of-raise per campaign) and with the Shopify preorder-brand segment, whose waits recur. (2) The CSV import's 2,000-row cap contradicts a tier ladder built on order volume at exactly the flagship buyer; fix before pricing goes public, with a Gorgias-style graceful overage story. (3) Outcome-pricing trend (Zendesk, Fin, Help Scout, Chargeflow): flat tiers survive only if the page shows the outcome math. (4) Low-end anchor mismatch: $299 prices out hobby campaigns, which is correct, but say who it is NOT for.

---

## 8. FEATURE ROADMAP

Ranked by differentiation × CSR-role-impact / effort. Every NOW item traces to a finding.

**NOW (pre-first-10-customers):**
1. **Close the six P1s** (replies don't send, status-link delivery, 2k import cap + wait-clock break, auth fail-open, et al.) — traced to the audit and the bear case: without them the replacement story is untrue for the flagship buyer and demos die at objection #8.
2. **Help Scout adapter: webhook-in + `draft: true` write-back** — traced to Section 5; the one integration that converts drafting from ASSISTS to HANDLES and covers no-helpdesk creators via the documented KS relay.
3. **Status-link delivery + auto-injection into approved replies, with deflection % measured** — traced to the CSR role map (deflection is a known P1; the status page only deflects if buyers ever see it).
4. **Chargeback evidence-pack export** (all status comms + customer acknowledgments per order, one click) — traced to chargeflow.io's INR-prevention guidance and the pricing lane: it converts "keeps buyers calm" into a hard-dollar dispute artifact using data Tideover already has. Near-free.
5. **Kickstarter native Pledge Manager CSV format support** — traced to the crowdfunding lane: KS-native backer reports are now GA and will rival BackerKit exports.
6. **Pricing page: break-even calculator + fulfillment-window pass offer wrapper** — traced to Section 7 risks 1-3. (Copy + packaging, not product surface.)

**NEXT (post-revenue):**
- Address-change intake form on the status page → CSV export (biggest quantified unserved pain, ~200 emails/4mo; S-sized demo-winner, build the week a prospect asks).
- Zendesk adapter (trigger: 2+ pipeline prospects), then Freshdesk clone on demand.
- Gorgias OAuth app + sidebar widget, shipped as partner-store motion with de-fanged copy.
- AI-drafted backer-update generator from confidence-band data (Stegmaier doctrine: no news is worse than bad news).
- Risk-band escalation playbooks + save-rate reporting in the ledger.
- Shopify App Store listing + read-only Admin API order sync (after 3-5 customers can seed reviews; zero organic installs before that, VERIFIED developer consensus).
- Kickstarter Partner Directory application **[CORRECTED: moved from #1 channel to post-first-customers; its "proven track record" bar is circular for a pre-revenue tool]** — prep the one-pager and 1-2 pilot case studies now, submit after logos exist.
- BackerKit BD conversation via the Help Scout/Zendesk wedge (partner AND watch-item competitor).

**NEVER (with reasons):**
- Own email sending/receiving infrastructure — deliverability mini-helpdesk at 10-30x incumbent prices **[CORRECTED sizing]**; ride helpdesk relays.
- Social/comment monitoring beyond the existing spec — social DMs shrinking (Gorgias research); KS comments are not capturable as tickets; the status page is the comment-storm answer.
- Auto-send AI replies / full automation / auto-refund actions — human approval is the product's legal and trust design (Air Canada precedent); automation is the competitors' game.
- Intercom, Front, Richpanel integrations — ICP mismatch, Fin overlap, pricing drift.
- Post-delivery returns/exchanges — different job; Loop and the helpdesks own it.
- Competing as a tracking page or a status-page-only app — StatusPro sells that at $9/mo; we sell the bundle.

---

## 9. WHAT THE BEAR CASE CHANGES

1. **One integration, not three.** The lanes' three confident #1s were an unmade decision; it is now made (Help Scout first, Zendesk on trigger, email ingest never). Solo capacity + six P1s make anything more a fiction.
2. **ROI copy rebuilt on defensible arithmetic.** "Two chargebacks a month" and the full-time-VA comparison are retired; the surviving line is window-scoped, conditional, and aimed only at distressed campaigns. The part-time-VA and free-KS-update stack is named in our own qualification: if a monthly update and 1-2 hrs/day of Gmail are working, we are not their product.
3. **Segment discipline replaces whitespace talk.** The market is ~800-1,500 sweet-spot campaigns/yr plus Shopify preorder brands; internally we plan as a wedge (40-65 concurrent payers needed for the $20K/mo goal), which elevates the window pass, the brand segment, and retention packaging from nice-to-haves to survival mechanics.
4. **The moat claim is demoted and restated.** The window is a time span, not a defense; hard-date-free behavior is promptable by anyone. What we actually say: the enforced discipline (eval harness, human approval, proof-only) plus the workflow bundle nobody combines. Confidence bands are treated as representations too (Air Canada covers soft dates): bands stay ranges, wording stays reviewed, human approval stays mandatory, and marketing never calls bands legally safe.
5. **Channel humility.** KS Partner Directory moves to post-first-customers; marketplaces are credibility layers, not acquisition; first ten customers come from symptom-led outbound to visibly late campaigns, full stop.
6. **Copy red-lines from the fact-check:** never claim "nobody offers status pages" (StatusPro exists), never cite WISMOlabs' $6/ticket as the buyer's cost, never attack a named partner in a channel we want to list in, and keep the Wonderment/Loop exit in mind as the price-point cautionary tale: do not drift down to tracking-app pricing to win pre-pain merchants.
7. **What the bear case did not break, so we keep saying it:** the workflow gap is verified real, CSV + status page fit exactly how the channel works, the buyer is findable at a public moment of pain, and pricing holds for that buyer. The wedge is real; the discipline is aiming it.

— End of recon. Corrections from the independent fact-check override lane figures wherever marked.