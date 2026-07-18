# 03 — Pricing and Pitching: the commercial layer

Internal training doc. Audience: Dylan. Goal: know what competitors charge and why, defend Tideover's ladder, handle procurement without flinching, and pitch against the chargeback and the founder's nervous system instead of the ticket. Every external number keeps its source. Insider terms are **bold** on first use.

## If you only remember five things

1. **You're not competing on ticket price. You're competing on the chargeback.** One dispute costs ~$128 all-in (Mastercard 2025 State of Chargebacks, cited via the objection audit) plus the product you re-ship. Growth at $499/mo is "fewer than two prevented disputes."
2. **Meter on presale orders in the wait window. Never tickets, seats, or resolutions.** Metering the thing the product reduces is self-sabotage. Order-volume is the only meter that can't be gamed by deflection.
3. **No credits.** Tideover has no per-action COGS to protect, credits torch the flat-fee wedge, and they charge the merchant more exactly when the product is failing. Analysts are already calling the credit fad's reversal.
4. **Under the card-swipe threshold wins.** Keep the pilot under ~$500-1,000/mo and a manager buys it on a card without triggering procurement review. Above it, you're in DPA-and-questionnaire territory.
5. **De-risk with the ladder: start read-nothing.** No password, no API key, no install on day one. A mail filter they control and delete in one click. Plus a day-14 walk-away checkpoint where they keep the assets.

---

## What the competitors charge (and where it hurts)

Every number here is externally verifiable. That's the point: the wedge copy needs no efficacy claim.

| Vendor | Model | The pain you sell against |
|---|---|---|
| **Gorgias** | $10 / $60 / $360 (Pro) / $900 (Advanced) ticket tiers | Per-ticket **overages** $0.32-0.40, plus the **AI Agent double meter**: $0.90-1.00 per resolved conversation billed *on top of* the ticket fee ([chatarmin](https://chatarmin.com/en/blog/gorgias-pricing), [gorgias.com/pricing](https://www.gorgias.com/pricing)) |
| **Zendesk** | $55 / $115 / ~$169 per agent/mo (annual) | **Per-seat**: punishes you for adding headcount. Copilot +$50/agent, AI ~$1-2/resolution ([Zendesk](https://www.zendesk.com/pricing/), [costbench](https://costbench.com/software/help-desk/zendesk/)) |
| **Richpanel** | $29 / $49 / $99 per user | AI ~$0.30/conversation, self-service portal from $100/mo ([Richpanel](https://www.richpanel.com/pricing)) |
| **TalentPop** (managed) | ~$8-14/hr per agent | **~$2,500 one-time setup fee**, hours tracked via Hubstaff ([TalentPop](https://www.talentpop.co/pricing)) |
| **PartnerHero** (managed) | Dedicated agent from $10/hr or **$1,975/mo** | A bare offshore agent with no presale software, no playbooks, no QA layer ([PartnerHero](https://www.partnerhero.com/offshore-customer-service-outsourcing)) |
| **BackerKit** (pledge manager) | ~2% campaign fee (sliding) + 3.5% transaction fee | **~5% of funds** through the pledge manager plus Stripe. A $200K raise pays them roughly $7-10K ([BackerKit](https://www.backerkit.com/pricing/pledge_manager)) |

The two mechanics merchants hate most: **per-ticket overages** and the **per-resolution AI meter** (the extra $0.90-2.00 charged every time the AI resolves a ticket, billed on top of the seat/ticket fee). Tideover dodges both. The wedge line writes itself and every clause is verifiable: "one flat fee, no per-resolution meter, no setup fee, month-to-month."

---

## Tideover's ladder, and the logic

Three software tiers, metered on **presale orders in the wait window**, unlimited seats. This sits legibly inside the Gorgias band ($360 Pro to $900 Advanced) while dodging their hated mechanics.

| Tier | Price | Cap | Adds |
|---|---|---|---|
| **Starter** | $299/mo | ≤300 orders in window | Core cockpit, playbook, status page |
| **Growth** | $499/mo | ≤1,500 orders | Helpdesk integrations, risk dashboard, evidence packs |
| **Scale** | $749/mo | ≤5,000 orders | QA scorecard, routing, unlimited evidence packs, SLA, API |

*(v2 recommended ladder, pending Dylan's approval — see `mission-control/decisions/d8-pricing-v2.html`. Never price a public tier below $299: the founding floor is a written promise. Caps print on every tier card — tier gaps only sell against hard published caps.)*

Plus the managed human tiers (covered in doc 04): **Managed Lite $849/mo**, **Managed Pod $1,950/mo**.

**Founding promise floor.** Founding pilot customers lock a floor rate of **$199-299/mo that never rises**, as the early-adopter deal. It's below or at Starter and it's a genuine commitment, not a discount gimmick. Public ladder pricing stays public: gating a sub-$1K SaaS price gains nothing.

**Why order-volume metering.** The meter has to scale with the value delivered and resist gaming. Tickets can be deflected (so metering tickets punishes success). Seats punish the merchant for adding the PH pod later. Resolutions recreate Gorgias's most-resented mechanic. Presale orders in the wait window is the one meter that tracks the actual exposure Tideover manages.

**Why NOT credits (the v2 verdict, summarized).** Credits exist to protect a vendor's COGS on customer-triggered actions ([Growth Unhinged](https://www.growthunhinged.com/p/2025-state-of-saas-pricing-changes)). Tideover has no such COGS, so credits import billing anxiety without protecting anything. Worse, they'd charge the merchant more during a Kickstarter spike, the exact moment the relationship is most fragile, and they'd torch the flat-fee advantage over Gorgias. The market is already turning: analysts call the 2026 swing back toward simplicity and predictability. The one narrow exception is a dollar-denominated **Goodwill Wallet** for gift sends only (pass-through cost plus a flat handling fee, charged on delivery, never expires while subscribed, refundable on exit). That's it.

**Cohort Pass option.** Crowdfunding merchants think in campaigns and already pay BackerKit ~5% per raise. A flat **Cohort Pass (~$1,500)** covering one full 90-120 day wait cycle matches their mental model and is trivially proportionate to what they just paid BackerKit. It converts to monthly when the next campaign overlaps.

---

## Procurement, for the bigger brands

At a 20-50 person brand, "send me your security stuff" should get a same-day reply. Know these terms:

- **Card-swipe / procurement threshold** — the spend level (often ~$500-1,000/mo at SMBs) below which a manager buys on a card with no formal vendor review ([pricing-ops lens]). Pricing the pilot under it is a legitimate speed tactic. This is why Growth at $499 matters.
- **DPA (Data Processing Agreement)** — the addendum stating what customer personal data you touch and how you protect and delete it. Mid-size buyers ask reflexively. A solid Common Paper-style template is acceptable at pilot scale. Have one ready.
- **SIG-Lite / CAIQ** — standardized vendor security questionnaires (shorter forms of the enterprise versions). If a prospect sends one unprompted, they're procurement-heavy. Qualify hard before spending days on it.
- **SOC 2** — the third-party security audit larger buyers request; $25-50K first year, audit alone $10-20K ([Secureframe](https://secureframe.com/hub/soc-2/audit-cost), [Drata](https://drata.com/learn/soc-2/cost)). You don't have it. The substitute is a **procurement packet**: a one-page security overview describing real architecture (opaque HMAC status tokens, PII boundary at `getPublicStatus`, no store write access), a template mutual DPA, a subprocessor list (Vercel, MongoDB Atlas, Cal.com), a data-deletion-on-exit commitment, and a named-human-accountability line. That answers ~90% of a SIG-Lite in one attachment.

**When to qualify OUT.** Anyone demanding full SOC 2 or a full enterprise questionnaire from a two-month-old vendor costs more than they'll pay at this stage. Say so politely and move on. The /security data-map is the honest answer; certification is not on the table yet.

---

## The pitch frames

**Sell against the chargeback, not the ticket.** Each dispute is $15-25 in fees plus the product plus a mark against a merchant account already flagged high-risk for being crowdfunded and long-delivery. All-in, ~$128 (Mastercard 2025, via the objection audit). Frame Growth at $499 as "fewer than two prevented disputes plus the product you didn't re-ship." The dispute-fee figure is externally citable, so this needs no fabricated efficacy claim.

**Sell against the founder's nervous system.** Your story is the anchor: you closed $200K in week one during peak COVID, then had to tide customers over for 60+ days through the worst shipping delays in ecommerce history, for two years. You answered the day-60 refund email at 11pm more times than you can count. The ICP parallel is exact: sudden surge, long uncontrollable wait, WISMO onslaught, refund pressure, burnout. You were the buyer. That's what you're removing, not a metric.

**The day-14 walk-away checkpoint.** Structure the pilot so there's a no-obligation checkpoint at day 14: the merchant reviews their day-0 baseline report and the drafted day-7/30/60/89 scripts in their own voice, and decides to continue or walk, keeping the assets either way. This mirrors the strongest risk-reversal in the category (ColdIQ's "you still leave with a complete playbook and a working system", via the GTM meta digest) and beats a money-back guarantee, which reads as an admission you might fail.

**The de-risking ladder: start read-nothing.** Make the integration friction explicit and low:

- **Rung 0** — CSV import, parsed in the browser. The raw file never leaves their machine.
- **Rung 1** — a mail-forwarding filter they create and delete in one click. No password, no API key, no app install. This already powers the full ingest-to-draft-to-approve pipeline, so don't undersell it.
- **Rung 2** — a merchant-templated webhook (Gorgias/Zendesk) where their helpdesk decides which tickets and which fields leave. "Your helpdesk decides what we see, not us."
- **Rung 3** — write-back, last, after you've earned it.

Pitch line: "Start read-nothing. Webhooks and write-back are upgrades you grant after we've earned them." Pair it with a published revocation table (delete the filter, deactivate the webhook, reset the key). Telling a prospect exactly how to fire you is the cheapest objection-killer there is.

---

## Two objection handlers worth memorizing

**"Another bill during our cash-tight fulfillment gap."** It's a smaller bill replacing bigger ones. Each support interaction costs $5-25 to handle, one dispute ~$128, and WISMO is 20-40% of ecommerce tickets and worse in presale. Tideover is flat-priced on presale tickets only, measured against your own captured baseline.

**"My VA already handles tickets."** Keep them. Tideover doesn't replace the VA, it's the cockpit that makes them a presale specialist: engine drafts, risk breakdown, gift suggestions. The plan quantifies it: engine-drafted replies make $8/hr labor perform like $25/hr support. "Your VA logs into our cockpit" is a tier below "our PH manager runs it."
