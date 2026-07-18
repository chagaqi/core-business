# 04 — Managed Tier Runbook: operating the human layer

Internal training doc. Audience: Dylan. Goal: run the managed support tier like a small BPO a larger brand recognizes and trusts, from the hire gate through QA and margin. Every external number keeps its source. Insider terms are **bold** on first use.

## If you only remember five things

1. **Don't hire until two things are true: 2 signed managed clients AND more than 2 hours/day of your own queue time.** A $780-1,210/mo salary against a $750 budget is insolvency. You are agent #1 until the queue forces the hire.
2. **Your first queue is the SOP library.** Screen-record every session you work in the cockpit. Those recordings plus the engine drafts are the training curriculum for PH hire #1. Zero labor cost, and the hire trains inside Tideover from day one.
3. **The market proves the demand.** BackerKit already sells "Backer Support" as a managed inbox to creators ([BackerKit](https://www.backerkit.com/features/support)). You're positioning the same labor, but living inside their Shopify store and helpdesk, run through Tideover's engines.
4. **QA is 4 dimensions, 2 auto-scored, sampled 10-20% weekly, calibrated with the lead every week.** A 15-question scorecard stalls grading. Keep it short or it becomes shelfware.
5. **Escalation is a contract artifact.** Sentiment-flagged and chargeback-threat tickets reach you within 4 business hours; goodwill above a dollar cap needs merchant approval. Putting this in writing converts "can I trust an offshore stranger" into a spec.

---

## The hiring reality (Philippines direct hire)

You hire directly, OnlineJobs.ph-style, not through a BPO. The bands:

- **CS rep** — $780-1,210/mo ($5-7/hr) for a remote Filipino ecommerce CSR ([hiretalent.ph](https://hiretalent.ph/blog/filipino-customer-service-salary-guide)).
- **Senior / team lead** — $1,210-1,730/mo, up to ~$2,600 for agency-grade ([hiretalent.ph](https://hiretalent.ph/blog/filipino-customer-service-salary-guide)); broader PH VA bands corroborate ([Hurupay](https://hurupay.com/blog/virtual-assistant-salary-philippines), [OnlineJobs.ph](https://blog.onlinejobs.ph/comprehensive-guide-to-virtual-assistant-salaries-in-the-philippines/)).
- **13th-month pay** — legally standard for PH employees and customary for full-time contractors: one extra month's salary in December. **Budget +8.3% on any quoted monthly rate.**

The market comps you price against are dedicated agents at $1,400-3,500/mo, PartnerHero from $1,975/mo, TalentPop with a ~$2,500 setup fee ([PartnerHero](https://www.partnerhero.com/offshore-customer-service-outsourcing), [TalentPop](https://www.talentpop.co/pricing)). Those are bare agents with no presale software, no playbooks, no QA layer. You're differentiated at parity, not discounted below it.

**OnlineJobs.ph flow:** post the role (ecommerce CS, presale/crowdfunding context, English fluency, US-evening availability), screen for written tone against a sample ticket, trial-task with a real cockpit draft, hire on a month-to-month contract, track time with Hubstaff-style tooling. The trial task is a real presale reply graded on your scorecard, so hiring and QA use the same rubric.

---

## The hire gate (do not skip)

Two conditions, both required, before the first hire:

1. **2 signed managed clients.** Revenue must precede the salary obligation.
2. **More than 2 hours/day of your own queue time.** If you're not personally underwater in the cockpit, you don't need the hire yet.

Until both are true, **you are agent #1.** You run the first client's queue yourself, inside the cockpit, and you screen-record everything. This validates the managed offering at $0 labor cost, and it builds the SOP library and curriculum before anyone's hired. The recordings are the onboarding.

---

## Shift design (the timezone is a feature)

Philippine daytime is US evening and overnight. Sell that as an SLA a US-only solo founder cannot offer: "your presale queue is cleared before your customers wake up."

Map shifts to each merchant's **slaWindows** (already in the schema). Tideover runs twice-daily presale SLA windows (AM/PM). The rep works the queue against those windows during PH day, so the merchant opens to an empty presale backlog. Chargeback-threat tickets get a tighter target via priority rank.

Capacity math for staffing: **AHT ~6 min per presale ticket**, so roughly **10 tickets per agent-hour**. Feed the cohort forecast panel in ÷ 10 to get the VA-hours needed for next week's expected WISMO. That's the whole WFM requirement at this scale. Keep occupancy under ~85-90% or SLAs collapse and the rep burns out.

---

## The QA program

Run it like a real team lead, kept deliberately small so grading actually happens ([MaestroQA](https://www.maestroqa.com/blog/how-to-build-a-qa-scorecard)).

**Sampling:** grade **10-20% of a rep's sends weekly** at low volume.

**The 4-dimension scorecard** (two auto-scored by the software, two graded by you or the lead):

| Dimension | How scored | What it checks |
|---|---|---|
| **Compliance** | Auto (`assertNoHardDate`, no-PII) — **auto-fail** | No hard delivery date, no PII leak. One violation zeroes the score. |
| **Brand Voice** | Auto (banned-words strip, signoff present) | Merchant's tone rules honored, correct signoff. |
| **Accuracy** | Human | Timeline, stage, and confidence-band facts are correct. |
| **Resolution** | Human | Next window and next step clearly stated. |

Roll these up to a rep-level and merchant-level **IQS** and trend it. Benchmark is ~88% (Klaus survey of 4,000+ pros, via [Zendesk](https://www.zendesk.com/blog/customer-service-internal-quality-score/)). The Compliance auto-fail is a QA gate no agency has: the software physically won't send a hard date.

**Calibration:** weekly between you and the PH lead. Grade the same handful of tickets independently, reconcile, so a score means the same thing to both of you. Templates that score poorly get queued for a playbook revision, which is the honest version of "the system improves over time."

---

## The escalation matrix

Put this in the managed-tier one-pager. It's what converts trust objections into a spec.

- **Sentiment-flagged / chargeback-threat / hostile** → the rep must escalate to **Dylan within 4 business hours**. Engine 2 already flags these; they never enter any experiment and always reach a named human.
- **Goodwill above the dollar cap** → requires **merchant approval** before the rep sends a gift or credit. Below the cap, the rep proceeds within policy.
- **Everything else** → handled in-window by the rep against the playbook, drafts approved before send during pilot.

The line a CX leader wants: your angriest customers and your money decisions always reach an accountable human on a clock. That's the answer to "who's accountable for quality."

---

## Margin math (at the approved prices)

**Managed Pod — $1,950/mo:**

| Line | Cost |
|---|---|
| Rep (incl. 13th-month accrual) | ~$870 |
| Fractional lead slice (one lead QAs 4-6 reps) | ~$300 |
| Tooling | ~$50 |
| **Total cost** | **~$1,220** |

That's **~37% gross margin on labor alone**, before the software margin stacks on top. Priced at parity with a bare PartnerHero agent ($1,975/mo), but you include the software, playbooks, and QA layer they don't.

**Managed Lite — $849/mo:**

- ≤150 tickets/mo, roughly 0.25 FTE ≈ ~$300 cost.
- **~65% gross margin.** A shared-pod entry point where one rep splits time across a few small merchants.

The framing for a larger brand: your support labor makes the software smarter (rep edits are the training signal), and the software makes $5-7/hr labor perform like $25/hr support. That's the leverage, and it's why the managed tier is priced as software-enabled support, not labor arbitrage.

---

## The one-line summary of the whole tier

You run the first queue yourself and record it. Two signed clients and a full queue trigger the first PH hire, who trains on your recordings inside the cockpit. You grade 10-20% weekly on a 4-dimension scorecard (two auto-scored, Compliance as auto-fail), calibrate with the lead weekly, and escalate anger and money to yourself and the merchant on a clock. At $1,950 the Pod runs ~37% on labor before software margin; at $849 Lite runs ~65%.
