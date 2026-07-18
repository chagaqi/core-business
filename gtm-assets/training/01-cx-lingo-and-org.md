# 01 — CX Lingo and Org: the support-industry crash course

Internal training doc. Audience: Dylan. Goal: after one evening you can hold a cold call with a Head of CX at a 50-person brand and sound like a peer, not a founder reading features off a page. Every external number keeps its source. Insider terms are **bold** on first use.

## If you only remember five things

1. **The scoreboard is the language.** A CX leader is comped on a handful of metrics: contact rate, FRT, CSAT, IQS, SLA attainment, deflection. Speak those, not features.
2. **WISMO is the whole game.** "Where is my order" is 25-40% of ecommerce ticket volume and worse in presale ([Gorgias](https://www.gorgias.com/blog/customer-service-benchmarks)). Tideover exists to prevent it before it becomes a refund.
3. **Quality has its own number, and it is not CSAT.** **IQS** is the internal grade you give your own replies against a rubric. Industry benchmark is ~88% ([Zendesk](https://www.zendesk.com/blog/customer-service-internal-quality-score/)). CSAT is what the customer says. Never mix them.
4. **Four words outsiders swap and get caught: deflection ≠ automation rate; FCR ≠ one-touch; IQS ≠ CSAT; SLA attainment ≠ FRT.** The "say this, never that" table at the end is the drill.
5. **Ask, don't pitch.** The 10 diagnostic openers below are questions a real Head of CX asks their own team. Asking them earns credibility before you've claimed a single thing.

---

## The glossary (learn these cold)

Each term carries the standard definition plus, in italics, the presale/Tideover angle.

**Volume and demand**

- **WISMO** ("Where Is My Order") — order-status tickets; ~25-40% of all ecommerce volume, 50%+ in peak ([Gorgias](https://www.gorgias.com/blog/customer-service-benchmarks)). *The exact volume Tideover prevents by answering the day-stage before the customer writes in.*
- **Tickets per 100 orders (contact rate)** — support volume normalized to order volume; varies ~2.4x across verticals, so pros never quote a universal number ([Gorgias](https://www.gorgias.com/blog/customer-support-metrics)). *Presale runs higher than a merchant's steady state; the gap is your wedge.*
- **Contact driver / reason code** — the tag recording WHY a customer wrote in (wismo, refund, address change, damage). *Feeds the Pareto report that decides where a CX leader spends; Tideover auto-tags it.*
- **Backlog** — open, unanswered tickets. *The first number a team lead checks every morning.*
- **Triage** — first-pass sorting of the incoming queue by type, priority, and routing before anyone answers. *Tideover triages presale tickets to a dedicated view via one tag.*

**Speed and resolution**

- **FRT (First Response Time)** — time from ticket creation to first reply; ecommerce email median ~5 hours, top quartile under 1 hour ([Gorgias](https://www.gorgias.com/blog/customer-service-benchmarks)). Zendesk's ladder: ≤12h decent, ≤4h better, ≤1h best. *Tideover baselines median FRT per merchant.*
- **TTR (Time To Resolution)** — total time from open to fully closed; reported as median to dampen outliers. *Captures the whole interaction, not just the first reply.*
- **FCR (First Contact Resolution)** — % of issues fully resolved in one interaction; ecommerce average ~70-75%, top performers 80-85% ([Nicereply](https://www.nicereply.com/blog/benchmark-metrics/)). *Not the same as one-touch.*
- **One-touch ticket** — a ticket closed with a single agent reply. *The helpdesk-report sibling of FCR and a team-lead efficiency favorite.*
- **Reopen rate** — % of "solved" tickets the customer replies to again; under 10% is the accepted target, under 5% is excellent ([KPI Depot](https://kpidepot.com/kpi/ticket-reopen-rate)). *The honesty check on whether a reply actually resolved the worry. Tideover's playbook outcome signal.*
- **AHT (Average Handle Time)** — average working minutes per ticket; drives all staffing math. *Tideover's PH-tier plan assumes ~6 min per presale ticket, roughly 10 tickets per agent-hour.*

**Satisfaction and quality**

- **CSAT (Customer Satisfaction Score)** — post-interaction 1-5 survey reported as % positive; 75-85% is good, top ecommerce teams target 90%+ ([Gorgias](https://www.gorgias.com/blog/customer-service-benchmarks)). *Stable across verticals.*
- **CES (Customer Effort Score)** — "how easy was it to get your issue resolved?" on a 1-7 scale; underused in ecommerce and arguably more predictive of repeat purchase than CSAT. *Fits a per-interaction status-page tap.*
- **NPS (Net Promoter Score)** — 0-10 "would you recommend us" minus detractors; brand-level and slow-moving. *Not a per-ticket metric. Tideover leaves it out on purpose.*
- **IQS (Internal Quality Score)** — the internal grade of replies against a QA rubric, as a %; benchmark ~88% (Klaus survey of 4,000+ support pros, via [Zendesk](https://www.zendesk.com/blog/customer-service-internal-quality-score/)). *Says "quality" without waiting for customer surveys. Tideover computes a partial IQS deterministically on every draft.*
- **QA scorecard / rubric** — the questionnaire and grading scheme a reviewer applies to an interaction; typical dimensions are tone/empathy, accuracy, resolution, process adherence ([MaestroQA](https://www.maestroqa.com/blog/how-to-build-a-qa-scorecard)).
- **4C framework** — MaestroQA's rubric template: Communication, Connection, Correct & Complete, Compliance ([MaestroQA](https://help.maestroqa.com/en/articles/4537176-rubric-scorecard-structure)).
- **Auto-fail** — a scorecard section where one violation zeroes the whole score (promising a hard date, leaking PII). *Tideover can honestly say hard delivery dates are an auto-fail: `assertNoHardDate` runs at send, so the software physically will not emit one.*
- **Calibration (session)** — reviewers independently grade the same tickets then reconcile, so scoring means the same thing across people; the standard weekly QA ritual. *Weekly calibration between Dylan and the PH lead is the managed-tier control.*

**Process and structure**

- **Macro / saved reply / canned response** — a pre-written template with variables ({first_name}, order status) auto-filled; the atomic unit of professional support ([Gorgias](https://docs.gorgias.com/en-US/macros-101-81846)). *Tideover's day-7/30/60/89 playbook is a macro library.*
- **Macro naming convention** — tag-prefixed, searchable names ("WISMO/day-60/anxious", or Gorgias's "PS - offer type"); one macro per scenario, not multi-option monsters. *Signals you know how pros actually work.*
- **SLA (Service Level Agreement)** — committed response/resolution targets per channel and priority; **SLA attainment** = % of tickets meeting target, **breach** = missing one. *Tideover runs twice-daily presale SLA windows with breach flags.*
- **Escalation matrix** — the documented map of what escalates to whom and when; **functional** escalation goes to a specialist, **hierarchical** escalation goes up the management chain.
- **Support tiers (0/1/2/3)** — tier 0: self-serve (FAQ, order tracking); tier 1: standard queries; tier 2: complex cases (carrier claims, partial refunds); tier 3: high-risk (fraud, legal, chargeback threats, VIPs).
- **Deflection rate** — % of contacts resolved without a human (help center, status page, bot); 15-30% baseline without AI, 40-65% with well-configured AI ([Decagon](https://decagon.ai/glossary/deflection-rate)). *Tideover's proactive status page is the tier-0 deflection layer. Measure it as status-page sessions that produce no ticket within 24h.*
- **Proactive support** — contacting the customer before they write in (delay notices, status updates); the lever behind best-in-class WISMO rates below ~4%. *This is what Tideover's day-stage cadence does. Name it "proactive support."*
- **Knowledge base / Help center** — public self-service docs; the classic tier-0 layer. *Tideover's status page plays this role for presale orders.*
- **Occupancy / utilization** — % of paid agent time spent actively handling tickets; kept below ~85-90% to prevent burnout and SLA collapse.
- **BPO (Business Process Outsourcing)** — an outsourced support provider, judged on SLA attainment, IQS, and AHT. *Exactly the controls Tideover's managed PH tier publishes. "We use a BPO" is how bigger brands describe outsourced support.*
- **WFM (Workforce Management)** — the function that forecasts volume and schedules agents to hit SLAs; a dedicated role at scale. *Tideover ships WFM-lite: a cohort forecast, not a scheduler.*

---

## The org chart of a 50-person brand's CX team

At 50 people a brand's support team is usually four to eight humans. The person who answers your cold call is the **Head of CX** or an **Ops lead**. Structure and morning routines below, drawn from the standard support-org playbooks ([Siena](https://www.siena.cx/blog/customer-service-organizational-structure), [Zendesk](https://zendesk.com/blog/structure-customer-support-organization)).

```
Head of CX / Director of Support   (owns strategy, metrics, budget — your buyer)
        │
   Team Lead / Supervisor          (runs the day-to-day queue)
        │
   ├── T1 Agents        (status, policy, standard queries)
   ├── T2 Agents        (carrier claims, exceptions, partial refunds)
   ├── QA Analyst       (grades sampled tickets, runs calibration, reports IQS)
   └── WFM              (forecasts volume, builds the schedule — often fractional at this size)
```

**What each role checks every morning:**

- **Head of CX** — yesterday's CSAT trend, SLA attainment, ticket volume vs forecast, and any escalations that reached them. They think in weekly and monthly trends, not individual tickets.
- **Team Lead** — the backlog first (how many open, how old), overnight SLA breaches, and today's coverage against expected volume. They are the person feeling the pain your product removes.
- **QA Analyst** — the previous day's sampled scores, IQS movement, and recurring coaching themes to raise in calibration.
- **WFM** (if present) — forecast vs actual volume and whether staffing covers the day's expected load and occupancy target.

The tell that you belong: talk to the Head of CX in trends and money, talk to the Team Lead in backlog and coverage. Ask the Team Lead's morning questions and they relax immediately.

---

## Escalation tiers, in practice

- **Tier 0** — self-serve. FAQ, order tracking, Tideover's status page. Success is measured as deflection.
- **Tier 1** — standard presale queries: status, ETA, policy. The engine drafts, a human approves.
- **Tier 2** — complex: address changes, split shipments, damaged items, partial refunds, carrier claims.
- **Tier 3** — high-risk: chargeback threats, legal, fraud, VIPs. These **fast-lane** and never enter any experiment or automation. In Tideover they always ping the merchant.

The rule a CX leader wants to hear: hostile and chargeback-threat tickets skip the queue and reach a named human on a tight clock. That is the answer to "who's accountable for quality."

---

## QA culture (the part outsiders skip)

Professional support is graded, not vibed. The mechanics:

- **Scorecards, kept short.** MaestroQA's own guidance is a few criteria organized in sections, with auto-fail reserved for the deadly stuff ([MaestroQA](https://www.maestroqa.com/blog/how-to-build-a-qa-scorecard)). A 15-20 question scorecard kills throughput. Tideover ships four dimensions, two auto-scored.
- **IQS as the headline.** Roll the scorecard up to a merchant-level IQS % and trend it. Benchmark ~88% ([Zendesk](https://www.zendesk.com/blog/customer-service-internal-quality-score/)).
- **Calibration weekly.** Reviewers grade the same tickets independently, then reconcile, so a "4 on tone" means the same thing to everyone.
- **Auto-fail for the unforgivable.** One violation zeroes the score. Promising a hard delivery date. Leaking PII. This is where Tideover's `assertNoHardDate` becomes a QA claim no service competitor can make: the hard-date auto-fail is enforced in code.

Sampling rate: grade ~10-20% of sends at low volume, weekly. That is the managed-tier number to quote.

---

## The 10 diagnostic cold-call openers (drill these)

Each is a question a Head of CX asks their own team. You are not pitching. You are demonstrating that you already think in their scoreboard. Written verbatim, with why each lands.

**1.** "What's your tickets-per-100-orders running right now, and how does presale compare to your steady state?"
*Why: contact rate is a metric they're comped on. Asking for the presale split shows you know WISMO concentrates in the wait, and it sizes the problem in their own numbers without you claiming anything.*

**2.** "What share of your ticket volume is WISMO during an active fulfillment window?"
*Why: naming the category by its acronym and tying it to the fulfillment window signals you've lived this. WISMO is 25-40% of volume and worse in presale, so the answer quantifies the pain for you.*

**3.** "Where's your median first response time sitting, and does it hold during a wave?"
*Why: FRT is the first number CS leaders quote. "Does it hold during a wave" shows you understand demand spikes and staffing. A slipping FRT is the opening.*

**4.** "Who's grading quality on the presale replies right now, and against what rubric?"
*Why: it surfaces whether they have QA at all. Most small teams don't grade presale, which is the exact gap Tideover's scorecard fills. Saying "rubric" proves you speak QA.*

**5.** "What's your reopen rate on 'solved' presale tickets?"
*Why: reopen rate is the honesty check on resolution. A high one means the calm answer didn't calm anyone. Few merchants track it, so asking positions you above their current tooling.*

**6.** "How much GMV do you have sitting inside an open dispute window right now?"
*Why: it ties support to money via the chargeback clock. No generic helpdesk frames it this way. It moves the call from ticket-handling to chargeback exposure, the fear that reaches the CFO.*

**7.** "What's your deflection rate on the status page, and are you measuring it?"
*Why: deflection is a budgeted metric. The honest baseline is 15-30% without AI. Asking whether they measure it reveals the tier-0 gap and sets up the proactive status page.*

**8.** "When an ETA slips, how are you handling the update cadence?"
*Why: it's domain-native (cadence, silence-breaks-trust) and tests whether they're proactive or purely reactive. Reactive is where WISMO explodes.*

**9.** "What's your average handle time on a presale ticket, and who's absorbing that time?"
*Why: AHT drives staffing and cost-per-ticket. "Who's absorbing it" exposes founder burnout or an overloaded VA, the human cost you sell against, not just the metric.*

**10.** "If I pulled your top three contact drivers for the last 30 days, what would they be?"
*Why: the contact-driver Pareto is the first report a Head of CX pulls. Asking it makes you a peer, and the answer hands you the exact scripts to open the teardown with.*

---

## Say this, never that

The four swaps that get an outsider caught in one sentence.

| Say this | Not that | Because |
|---|---|---|
| **Deflection** (customer self-served, no human touched — status page, FAQ) | **Automation rate / AI resolution rate** (a bot auto-answered) | Tideover's status page deflects; it doesn't auto-answer. Calling proactive deflection "automation" claims a chatbot you didn't build and undercuts the human-approved trust story. |
| **FCR** (issue fully resolved in one interaction) | **One-touch** (ticket closed with a single agent reply) | Related, not identical. A ticket can be one-touch and still not resolve the issue, or resolve in one session across several messages. Conflating them reads as report-tool illiteracy. |
| **IQS** (your internal grade against your rubric — you control it) | **CSAT** (the customer's rating — they control it) | "Our quality is 88%" (IQS) and "customers rate us 88%" (CSAT) are different claims. Mixing them is the fastest way to sound like you've never run a QA program. |
| **SLA attainment** (% of tickets that met the committed target) | **FRT** (how fast the first reply went out) | FRT is a duration; SLA attainment is a percentage against a promise. "Our SLA is 4 hours" is loose talk. The number a leader tracks is what % hit it. |
