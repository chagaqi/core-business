# Shortlist — Top Contenders for Deep Dive

**Updated:** 2026-05-20

## OFFICIAL TOP 3 (CONFIRMED 2026-05-20 via No Mercy Roast)

1. **Customer Interaction SaaS** — idea #8 in this file
2. **AI Ads Agency** — idea #5 in this file
3. **Presale CS Agent** — idea #1 in this file

Hard Roast on the top 3 lives in `07-roast-top3-hard.md`. The other 5 entries below remain as Phase 2 / reference material.

---

Each entry includes: thesis, the arbitrage / why-now, why-Chaga moat, pricing model, MVP path, risks, and open questions. See `04-research-findings.md` for the Ideabrowser research data underpinning each entry.

---

## 1. Presale Customer Service Agent — LOCKED

**Lane:** Ecom × Agentic
**Source idea:** niche-down of #6759 (StoreSide) plus Chaga's domain experience
**Ideabrowser ID:** N/A (original framing)

### Thesis
A Shopify-app AI support agent specialized for brands running **presales / preorders / made-to-order / drops**. The product is empathy + reassurance + timeline knowledge during the 60-120 day waiting window between order and fulfillment.

### Arbitrage / Why-Now
- Presale brands collect cash 2-4 months before shipping product
- Support volume goes 5-10x normal during the wait window (customers anxious, no order to track)
- Generic CS bots (Gorgias, Tidio, Intercom) make it WORSE — they sound robotic about an emotionally charged "where is my f***ing order" question
- Chargeback / refund risk is the brand's biggest cash leak
- Tariff and supply-chain delays continuing through 2026 = more presale brands than ever
- Crowdfunding-to-Shopify pipeline (Kickstarter → BackerKit → Shopify) is a known funnel

### Who buys
- Kickstarter / Indiegogo graduates moving to Shopify
- Drop / scarcity culture: sneakers, streetwear, sports cards (Topps, Panini), vinyl, collectibles
- Hardware crowdfunders graduating to retail
- Made-to-order luxury: custom furniture, bespoke watches
- Made-to-order CPG: small-batch coffee, bourbon allocations, custom jewelry

### Why-Chaga moat
- Has shipped presale product personally — knows the exact emotional arc at day 45, day 60, day 89
- Can write the empathy prompts from memory
- Network: can dogfood with old ecom contacts
- Operations DNA = understands the supply-chain delays the agent has to explain

### Pricing model
- Base: $499 - $1,500 / mo per brand
- Performance kicker: % of refunds prevented OR per-saved-cart fee
- Killer hook: "you only pay big if we save you money"

### MVP path
1. Find 5 brands currently running presales — look at BackerKit alumni, Shopify "Pre-Order Now" app users, Kickstarter recently-funded list
2. Manually run their support inbox for 30 days using Claude/GPT-4 + Gorgias macros
3. Document every emotional pattern, every timeline question, every successful save
4. Productize into a Shopify app that plugs INTO Gorgias/Tidio as a "presale specialist" layer
5. App Store launch + outbound to BackerKit alumni list

### Risks
- Brand fragmentation — every vertical (sneakers vs CPG vs furniture) has different timeline norms
- Gorgias could add this feature themselves (probability: low — their mid-market customer doesn't run presales)
- Sales cycle: small brands close fast, but you need 30-40 of them

### Open questions for deep-dive
- How many active Shopify stores run presale/preorder workflows? (size the TAM)
- What's the typical support cost during a presale window?
- What's BackerKit's policy on partner referrals?
- Could we white-label this through BackerKit itself as the distribution channel?

---

## 2. Local Makers Corporate Gifts — LOCKED

**Lane:** Productized Service / B2B Marketplace
**Ideabrowser ID:** #1153
**Scores:** Opportunity 9 / Pain 8 / Builder 6 / Timing 9

### Thesis
Aggregate hyperlocal artisans (jam, honey, ceramics, soap, candles, leather, coffee roasters) into curated city-themed gift boxes, sold to HR teams and real estate agents as a B2B subscription / corporate gifting program.

### Arbitrage / Why-Now
Three markets don't talk to each other:
1. **Demand:** HR teams + real estate agents + sales teams need authentic recurring gifts but use the same 4 boring vendors (Edible Arrangements, Harry & David, branded merch). They have **time pressure**, not budget pressure.
2. **Supply:** Hyperlocal artisans sell $20-50/unit at farmers markets. Would kill for predictable B2B contracts.
3. **The middle:** Nobody is operating the aggregation + logistics layer because most B2B gifting companies don't know how to coordinate inventory from 20 small makers.

Why-now: post-COVID local sourcing demand, ESG / authenticity marketing wave, real estate closing-gift recurring spend ($75-200 per close).

### Who buys
- HR teams at companies 50-500 employees (anniversaries, holidays, onboarding)
- Real estate agents (closing gifts — recurring per transaction)
- Sales teams (account-opening gifts, customer milestones)
- Wedding / event planners (welcome boxes)

### Why-Chaga moat
- Ran a warehouse + in-house shipping at $2M scale
- Knows how to coordinate inventory from many SKUs / sources
- Operations is the **actual moat** — most competitors can't do the logistics
- Sales + Marketing skills = can pitch HR directors and brokerages directly

### Pricing model
- Box price: $80-150 retail
- Maker wholesale: $25-40 per box
- Margin: $30-50 per box
- Subscription play: quarterly box program for HR ($X / employee / quarter)
- Volume: 500 boxes / mo across portfolio = $40-75K revenue

### MVP path
1. Pick ONE metro (Austin, Denver, Portland, Charleston, Asheville — known artisan hubs)
2. Recruit 15-20 makers — negotiate wholesale and volume terms
3. Build a Shopify or Squarespace storefront for the city-box
4. Direct outbound to 50 HR directors + 50 top-performing real estate brokerages in metro
5. First 10 corporate customers = baseline. Then add second metro.

### Risks
- Physical inventory ties up Chaga's $5K budget fast — need to negotiate consignment terms with makers
- Maker reliability (small artisans flake / run out)
- Margin can compress with custom packaging requirements
- Geography-bound — needs to expand metro by metro

### Open questions for deep-dive
- What's the typical corporate-gifting spend per company per year (size the TAM)?
- Can we get consignment terms from makers (no upfront inventory cost)?
- Are there real-estate-agent-specific platforms that already do gifts (Goody, Sendoso)? How do we differentiate?
- Could we start as a Sendoso *vendor* (white-label) before going direct?

---

## 3. ChurnDetective for Indie SaaS — LOCKED

**Lane:** Recurring Operator Play
**Ideabrowser ID:** #1235
**Scores:** Opportunity 9 / Pain 9 / Builder 6 / Timing 9

### Thesis
AI-powered churn prediction + auto-retention agent built for the **indie / micro-SaaS** segment ($5K-$50K MRR), priced at $79-199/mo. Targets the gap between "nothing" and enterprise tools (Gainsight, Vitally).

### Arbitrage / Why-Now
- Bifurcated market: enterprise retention tools cost $20-100K/yr; indie SaaS uses nothing
- The 2024-2025 indie wave produced thousands of founders at $5-20K MRR
- They've hit the **retention wall** — LTV is short, can't out-acquire churn
- Existing tools assume enterprise CSM workflows; indie builders need a single dashboard + auto-DM
- Customer development is easy here — Indie Hackers / X / MicroAcquire communities are visible

### Who buys
- Indie SaaS founders at $5-50K MRR
- Boutique B2B SaaS teams (2-10 people)
- Micro-acquisition portfolio operators (people who buy small SaaS on Acquire.com)
- Boutique agencies running SaaS portfolios

### Why-Chaga moat
- The founder profile already signals "war-game churn with a churn specialist" — Chaga **thinks in churn**
- Sales + Marketing skills = can build inside the Indie Hackers / X founder communities
- Architect archetype = compounding playbook business

### Pricing model
- $79 / mo for $5K-$20K MRR products
- $199 / mo for $20K-$100K MRR products
- $499 / mo for $100K-$500K MRR products
- Possible: % of MRR retained kicker

### MVP path
1. Get 5 indie founders to give you read-only access to Stripe + their support tool
2. Manually identify their at-risk customers + draft retention messages
3. Validate the "save rate" — if you can save 2-3 customers per founder per month, you have it
4. Build the dashboard: Stripe webhook + LLM-based behavior scoring + suggested actions
5. Distribution: build in public on X, get featured on Indie Hackers, sponsor the right Slack/Discord communities

### Risks
- Competition: 3-5 funded entrants may already be in the space (need to research before committing)
- "Saving" customers vs "blaming" the product — sometimes the right answer is to let them go
- Indie founders are price-sensitive and notoriously DIY ("I'll just build it myself")

### Open questions for deep-dive
- Who's already in this space? (Userlist, Encharge, June, Vitally Free Tier?)
- What does the indie founder actually do when an at-risk customer is flagged?
- Could we sell to micro-acquisition operators (the Codie Sanchez crowd) instead?

---

## 4. First100 — Productized Customer Acquisition Agency — LOCKED

**Lane:** Productized Service
**Ideabrowser ID:** #1232
**Scores:** Opportunity 9 / Pain 9 / Builder 6 / Timing 9

### Thesis
A productized agency that guarantees a startup its first 100 qualified customers/leads. Vertical-focused (NOT "any startup") for repeatability. Three-layer pricing: service fee + pass-through ad budget + performance kicker.

### Arbitrage / Why-Now
- Most early-stage startups die between MVP and Series A because of customer acquisition, not product
- Founders have cash ($20-100K saved or pre-seed) but no time / no playbook
- Existing demand-gen agencies sell to Series A+ companies at $10-25K/mo retainers — out of reach
- Vertical productization = repeatable playbook = scalable margin

### Who buys
- Pre-seed and seed B2B SaaS founders post-MVP, pre-Series A
- Bootstrapped founders with savings who want to skip the customer-acquisition learning curve
- Solo founders with technical skills but no marketing instinct

### Why-Chaga moat
- Sales + Marketing + Design in the existing stack
- $2M ecom built means customer acquisition is in muscle memory
- Network: founder communities on X
- Operations = can systemize the playbook (every engagement adds to the proprietary CAC database)

### Pricing model
- **Service fee: $7,500** per engagement (Chaga's margin)
- **Pass-through ad budget: $5-15K** (client wires directly to ad accounts they own — Chaga never touches the money)
- **Performance fee: $50-200 per qualified lead over baseline** (aligns incentives)
- Guarantee: "100 qualified leads or 50% refund" — note **leads**, not customers (conversion is the product's job)

### MVP path
1. Pick ONE vertical — recommendation: **B2B SaaS founders, post-MVP, pre-Series A, $0-$25K MRR**
2. Build a vertical CAC database (channel-fit matrix) from public benchmarks + your own ecom data
3. Land 2 paid pilots at $7,500 each = $15K cash to fund the system build
4. Document the playbook ruthlessly — every channel test, every CAC number, every outreach template
5. Get 3 clients per month at $7,500 = $22,500/mo MRR-equivalent (hits the goal in month 2-3)

### Risks
- **"Building a job"** — the Architect's primary watch-out applies hardest here. Need to design the operator layer (who runs delivery) by month 3.
- Long sales cycle — your red flag list. Founders take 2-6 weeks to decide. Counter: charge a $500 deposit to qualify them.
- Hard to guarantee "customers" — only leads. The marketing needs to be VERY clear about this.
- Refund risk if the playbook doesn't work for an outlier vertical / product

### Open questions for deep-dive
- Which vertical has the highest LTV and most repeatable CAC? (B2B SaaS, B2C DTC, productivity tools, AI tools?)
- Is the X founder community saturated with demand-gen offers right now?
- Can we partner with a YC / Pioneer / Founder Institute as a distribution channel?
- What's the operator role we'd hire by month 3?

---

## 5. AI-Native Performance Ads Agency — LOCKED

**Lane:** Productized Service / Agency (AI-leveraged)
**Ideabrowser ID:** user_idea bff6375a-99c8-41b6-9c49-39a7f6dc2497 (research pending, 15-30 min)
**Source:** Chaga's own discovery — a cutting-edge course on AI-generated UGC-style video ad creatives

### Thesis
An AI-native performance ads agency for ecom / DTC brands, specialized in AI-generated UGC-style video creatives. The product exploits the arbitrage where top-performing ad creatives on Meta, TikTok, and YouTube in 2026 are increasingly AI-generated (synthetic creators, AI voiceovers, prompt-engineered hooks) — at a fraction of the cost and 10-20x the velocity of traditional UGC production.

### Arbitrage / Why-Now
- Traditional UGC: $200-$500 per video, 2-week turnaround, one creator
- AI UGC: 20 variations across 20 synthetic creators in 48 hours at a fraction of the cost
- Creative velocity is the new performance lever — Meta and TikTok algorithms reward creative testing
- Most ecom brands don't know this is possible yet, or don't have the tooling / prompting skill to do it themselves
- Window is closing: in 6-12 months this becomes table stakes and the arbitrage compresses

### Who buys
- DTC and ecom brands spending $20K-$500K/month on paid social
- Brands frustrated with traditional UGC turnaround
- Brands testing hooks / angles aggressively (DTC supplements, beauty, fashion, consumer tech)
- Brands that want to scale spend but have hit creative-fatigue ceiling

### Why-Chaga moat
- Sales + Marketing + Design in the existing stack — can pitch + produce + iterate
- $2M ecom built means he speaks the buyer's language fluently ("I was you")
- Foot-in-the-door pitch is the perfect fit for his Sales skill
- Performance-based offer is also Architect-friendly (his validation reflex stays satisfied — only scale if it works)

### Pricing model — the wedge
**The foot-in-the-door pitch:**
- "Give us 10% of your current ad spend. We'll match your existing creatives' KPIs or beat them with AI UGC. If we don't, you owe us nothing."
- No retainer to start. Zero friction to the yes.

**Once proven:**
- Performance-based fee (% of spend managed) — typical agency 10-15%
- Creative-only tier: $X per video pack delivered (10-20 variations / month)
- Full media + creative retainer: $5K-$25K/month
- Performance bonus tier: % of incremental revenue over baseline

### MVP path
1. **Build the production rig** (week 1-2): pick the AI UGC stack — Arcads, Captions AI, HeyGen, Pictory, Topview, or a custom pipeline. Test 20 hooks across 20 avatars on a fake product first to validate the engine works.
2. **Find 3 pilot brands** (week 2-4): direct outreach to your existing ecom network — anyone you know running $20K+ monthly ad spend. Offer the foot-in-the-door pitch.
3. **Run the 10% test** (week 4-8): match or beat their current creatives on 10% of spend. Document every win, every angle, every hook with screenshots and CPA / ROAS comparison.
4. **Case studies + outbound** (week 8-12): turn winners into Twitter / LinkedIn case studies. Outbound to 100 more brands using the case studies.
5. **First retainer client at $5K/mo by week 10** = $20K/mo trajectory unlocked.

### Risks
- **Creative quality plateau** — synthetic UGC has an uncanny-valley problem in some verticals (beauty / fashion where authenticity matters most). Pick verticals where this works.
- **Tool commodity risk** — if anyone can spin up Arcads + ChatGPT, what's the moat? Answer: prompting skill, creative strategy, the relationship with the brand, and (eventually) the creative strategist partner.
- **Platform policy** — Meta and TikTok have started flagging AI-generated content; could change the rules mid-game. Mitigation: stay close to platform announcements, blend AI with light human polish.
- **Performance pricing eats your time** — if you guarantee performance, you carry risk. Cap the upside (e.g., 90-day pilot only).

### The strategist partnership angle (Chaga's idea)
Once the AI creative engine is running, partner with a creative strategist who layers brand storytelling and angle development on top. This is the right Architect move because:
- Strategist is the rare premium skill (10x rare vs. operators)
- They handle the "what to test" while you handle the "how to produce + measure"
- Revenue share or equity split — they don't get cash up front (preserves your $5K budget)
- 2x's the perceived value of each engagement (the brand gets velocity + strategic depth)
- Likely role: white-label strategist who works under your agency brand

### Open questions for deep-dive
- Which AI UGC tool is the current state-of-the-art? (Arcads, Captions AI, HeyGen, Synthesia, Topview, custom?)
- What verticals does AI UGC perform BEST in? (consumer tech, DTC supplements, productivity apps) and WORST in (beauty, fashion, lifestyle where authenticity matters)?
- Are there existing AI-UGC agencies already? Who, and what's their pricing / positioning?
- Can we negotiate volume pricing on the AI tools themselves to widen margin?
- What's the typical AI-UGC ROAS lift vs. traditional UGC? (Need real benchmarks to honor the foot-in-the-door promise)
- Who's the ideal creative strategist partner — a freelancer, a moonlighting agency strategist, an indie creative director?

---

## 6. AI Code Assistant for GTM Engineers (Nimbalyst-inspired) — LOCKED

**Lane:** B2B SaaS / DevTool for marketers
**Ideabrowser ID:** user_idea 081da98e-e45a-44c3-90a3-f28425bbc915 (submit-idea brief only; deep pipeline hit monthly cap)
**Substitute research:** market_insight d43e7d90-5581-4b86-9b4c-5fbacfa1dc14 ("AI code assistants and workflow tooling for GTM engineers"), running 3-7 min
**Source:** Chaga's own discovery — inspired by Nimbalyst, narrowed to GTM engineer audience

### Thesis
A SaaS product offering a GUI for an AI code assistant that's purpose-built for GTM engineers and technical marketers — the emerging discipline that combines marketing strategy with the technical chops to build modern outbound and revenue-ops automation stacks. Where horizontal AI coding tools like Cursor and Copilot don't understand the GTM tool ecosystem semantically, this product is fluent in Clay, n8n, Apollo, Cargo, Smartlead, Make, Zapier, Salesforce, HubSpot, and the custom Python that holds it all together.

### Arbitrage / Why-Now
- GTM engineering is an emerging role with no purpose-built tooling — current options are horizontal (Cursor, Copilot) or fragmented (each tool has its own internal AI)
- The role itself is exploding: every Series A+ B2B SaaS now wants 1-2 GTM engineers on the team
- Clay, Common Room, Pocus, Default — the underlying tools are growing fast but the meta-tooling (the IDE for the whole stack) doesn't exist
- The GTM engineer Twitter community has visible influence (Adam Robinson, Mark Kosoglow, Jason Bay) — wedge-friendly distribution
- Founders see it as a productivity multiplier (10x workflow build velocity) — high willingness to pay

### Who buys
- GTM engineers at B2B SaaS companies in the $1M-$50M ARR range
- Growth agency operators running outbound for 5-20 clients
- RevOps teams at $50M+ ARR companies who want to automate without hiring engineers
- Solo founder-operators building outbound machines themselves

### Why-Chaga moat
- Sales + Marketing skills mean he understands what GTM engineers are actually trying to do
- Distribution: GTM engineer community is publicly visible on X / LinkedIn, easy to build relationships
- BUT — this needs a strong technical co-builder; Chaga is not the engineer here

### Pricing model
- Indie / solo: $99 / mo per seat
- Team: $299 / seat (5+ seats)
- Agency: $499 / seat with multi-client workspaces
- Long-term: enterprise self-serve at $999+ per seat

### MVP path
1. Find the technical co-builder FIRST (this is the gating constraint) — likely a moonlighting senior engineer with GTM curiosity, equity-heavy comp
2. Validate via 20 GTM engineer interviews — what specific workflows eat their week, what are their existing tools' limits
3. Pick the 3 most-painful workflows and prototype the AI assistant for those 3 only
4. Launch as a closed beta to the X / LinkedIn GTM engineer community
5. Iterate to PMF on those 3 workflows before expanding scope

### Risks
- **Technical co-founder dependency** — gating constraint, this is the project's #1 risk
- **Horizontal tool competition** — Cursor and Copilot are getting better at domain-specific code by the month. The window for a vertical IDE may compress
- **The tools themselves could build it** — Clay, n8n, Cargo all have AI features and could expand. The defensible position is being the meta-layer that spans them
- **GTM engineer market size** — emerging role, may not yet be big enough to support a venture-scale outcome. Need to size carefully in the research

### Open questions for deep-dive
- How large is the GTM engineer audience today, and what's the growth trajectory?
- What does Nimbalyst do exactly, and what would we do differently?
- Who's already in the "AI for GTM engineers" space? (Default, Cargo, Hyperbound, Common Room's AI features)
- What's the actual willingness to pay among GTM engineers — do they buy their own tools or expense?
- Where do we find the right technical co-builder, and what equity / cash split makes sense?
- Could we partner with Clay / Cargo / n8n directly as a complementary AI layer instead of competing?

---

## 7. Fractional CFO Marketplace — API-Style Access — LOCKED

**Lane:** B2B Marketplace / Productized Network
**Ideabrowser ID:** 7852 (your own submission, deep research complete)
**Source:** Your own discovery before this conversation

### Thesis
A two-sided marketplace connecting growth-stage companies with vetted fractional CFOs and strategic consultants, filtered by outcome (raised Series A, prepped for exit, fixed unit economics) and engagement type (one-time, monthly retainer, outcome-based). Take 15-20% on every transaction. Wedge starts with CFOs because they are the highest-value fractional role; expand into fractional CMOs, CTOs, Heads of Sales over time.

### Key data from research
- Market: $4.1B fractional CFO market by 2030, CAGR 18.7%
- Main competitor: Paro (also Toptal, CFO Hub, FocusCFO)
- Communities: r/smallbusiness (764K), r/startups (1.1M), r/Accounting (150K), r/CFO (35K)
- Average engagement: $15K → 15% take = $2,250 per deal
- 90-day math: 9 placements/month = $20K MRR-equivalent
- MVP timeline: 1-2 weeks
- Hormozi value-score: 5 (drag from quality-trust and time-delay)
- Tags: capital_intensive, sales_driven, recurring_revenue, marketplace_potential

### Why-Chaga moat
- Sales skill = critical for recruiting CFO supply AND closing buyer demand
- Architect archetype = marketplace network effects are systemizable from day one
- BUT: chicken-and-egg supply / demand problem is the classic marketplace risk

### Pricing / value ladder
- Free: Financial Strategy Checklist (lead magnet)
- Frontend: $100 consultant-match trial
- Middle: $500-$5,000 per contract (15% take)
- Continuity: $200-$500/mo subscriber priority access
- Backend: $10K+/year enterprise integration

### Risks
- Marketplace cold-start — need to recruit 20-30 CFOs from network BEFORE attracting demand
- Trust/quality assurance in new marketplace is hard
- Competing with established players (Paro raised $50M+)
- Sales cycle on both sides could be slow

### Open questions
- Can Chaga recruit 20 fractional CFOs from his network in week 1?
- What outcome filters do buyers actually care about (raised Series A vs fixed churn vs prep for exit)?
- Could we niche down to ONE outcome (e.g., "ecom-native fractional CFOs for $1-10M Shopify brands") to bypass cold-start?

---

## 8. Automated Customer Interaction SaaS — Lean & Modern — LOCKED

**Lane:** B2B SaaS (local service businesses)
**Ideabrowser ID:** 7849 (your own submission, deep research complete)
**Source:** Your own discovery before this conversation

### Thesis
A modern, API-native SaaS that automates customer interactions for local service businesses (HVAC, plumbing, dental, auto). Three core features: instant review requests after every job, unified inbox (SMS, Google, Facebook, Instagram in one view), and webchat-to-SMS persistence. The wedge is competing against $100M+ legacy incumbents (Podium, Birdeye, GoHighLevel) burning cash on 800-person teams — you ship the same core value at half the price with a 20-30 person lean team powered by modern APIs and AI.

### Key data from research
- Market: $32.53B CX management market by 2029
- Builder confidence: **8** (highest of any idea in the entire 27-idea pile)
- Main competitor: Podium (also Birdeye, Broadly, GoHighLevel)
- Pricing: $49-$199/mo, $149 average
- Hormozi value-score: 6 (likelihood 8 from clear differentiation)
- MVP timeline: 1-2 weeks
- 90-day math: 135 customers at $149 avg = $20K MRR (aggressive but doable)
- Tags: solo_founder_friendly, perfect_timing, 10x_better, unfair_advantage, low_tech_risk

### Why-Chaga moat / risk
- Solo founder friendly per Ideabrowser tagging
- Architect archetype: lean-machine business is the dream
- RISK: Chaga's ecom background doesn't translate directly to local services (HVAC, plumbing, dental). He'd be learning the buyer
- RISK: competing against well-funded incumbents in a crowded market is hard even with a price wedge

### Pricing / value ladder
- Free: Customer Interaction Automation Guide (lead magnet)
- Starter: $49/mo (basic review automation + unified inbox)
- Pro: $99-$149/mo (lead capture + CRM integrations)
- Add-on: $30/mo analytics + reporting
- Backend: $10K+/yr enterprise

### Risks
- Highly crowded market — Podium ($100M+ raised), Birdeye ($60M+), GoHighLevel (massive agency channel)
- Switching costs for incumbents' customers are real — winning new customers is easier than poaching
- Local SMB owners are notoriously hard to sell to (low tech literacy, price-sensitive)

### Open questions
- Can Chaga partner with vertical SaaS (Jobber, Housecall Pro, ServiceTitan) for built-in distribution instead of cold-pitching?
- Niche down to ONE vertical (e.g., dental only, or HVAC only) to build a sharper wedge?
- Is there an ecom-adjacent version of this (DTC review automation) where his background actually helps?

---

## Candidates that competed for the 4th slot (kept for reference)

### Knownly — Customer Context Layer for DTC AI Support (#7459)
- Scores: 9/9/**9**/9 — highest builder confidence in the entire pile
- Slim middleware between Shopify and AI support tools (Gorgias / Tidio / Intercom)
- $49/seat Shopify App Store distribution kills sales cycle
- Compounds: every order / ticket enriches the context layer
- **Why not (yet):** tagged technical_founder_needed — would burn $3-5K of budget on a contractor
- **Status:** strong swap candidate if we want a pure-recurring portfolio

### Crediva — Government License Database for B2B Sales (#6947)
- Scores: 9/8/**8**/9
- Aggregate state licensing boards (medical, contractor, real estate) into a B2B sales-signal database
- Boring + sticky + government does the data updating for you
- **Why not (yet):** long B2B sales cycle (Chaga's red flag)
- **Status:** strong long-term play, not a 90-day vehicle
