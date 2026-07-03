# GTM + Pricing Meta Digest — overnight research, 2026-07-03

> Five reports condensed: Swan, ColdIQ, Valley, the credit-pricing meta survey, and founder-story
> structures. Every claim cited to its source (proof-only doctrine). Feeds D8 v2
> (`mission-control/decisions/d8-pricing-v2.html`) and the ABOUT draft
> (`docs/research/founder-about-structures.md`).

## Cross-source takeaways

1. Credits are margin insurance for vendors with per-action COGS. Tideover has no such COGS, so credits import anxiety without protecting anything ([Growth Unhinged](https://www.growthunhinged.com/p/2025-state-of-saas-pricing-changes)).
2. Big tier gaps sell only against hard published caps (Gorgias Pro $360 to Advanced $900 buys a 2.5x ticket cap, [gorgias.com/pricing](https://www.gorgias.com/pricing)). v1's Scale gap failed because no per-tier numbers were printed.
3. Nobody healthy meters the thing their product is supposed to reduce. Tideover's meter is orders in the wait window, never tickets or resolutions.
4. The strongest proof assets for a day-zero solo founder: publish your own real numbers (ColdIQ), show raw product output (Valley's coolmessagebro.com), and describe verifiable mechanisms (Plausible).
5. Launch simple, re-tier on real usage data. Swan sold one flat $240/mo plan for a year before splitting into four tiers ([coldiq.com/tools/swan-ai](https://coldiq.com/tools/swan-ai)).

---

## Swan (getswan.com) — credit pricing done carefully

**Product/ICP.** "AI GTM Engineer": prompts become agentic outbound/RevOps workflows across HubSpot, Salesforce, LinkedIn, Slack. Hero: "Pay for GTM work done, not software access" ([getswan.com](https://getswan.com), [getswan.com/pricing](https://www.getswan.com/pricing)).

**Pricing (verified from raw page HTML, July 2026).**

| Tier | Price | Credits | Meter | Seats |
|---|---|---|---|---|
| Solo | $100/mo | 650 | $0.16/credit | 1 |
| Starter | $200/mo | 1,250 | $0.16/credit | 1 |
| Growth | $419/mo | 2,000 | $99 platform fee + $0.16/credit | 5 |
| Scale | Custom, "Most Popular" badge | Custom | — | Custom |

**Mechanics.** Credits = work done (research, enrichment, drafting, CRM updates); pricing FAQ says variable cost per action while the homepage still says flat 1 credit per task, the two pages contradict. Rollover: 2x monthly allocation on monthly plans, unlimited within term on annual. Overage top-ups at 150% of plan rate (deliberate upgrade push); automations pause at zero credits ([salesforge.ai/blog/swan-gtm-review](https://www.salesforge.ai/blog/swan-gtm-review)). Seats $20/mo; alert recipients and view-only access free. Arithmetic legible on the card: 650 x $0.16 ≈ $100. History: mid-2025 was one plan, $240/mo for 4,000 credits (~$0.06/credit); re-tiered later with entry down and per-credit up ~2.7x ([coldiq.com/tools/swan-ai](https://coldiq.com/tools/swan-ai)).

**Page patterns.** Headline + value reframe + toggle + 4 cards; cumulative "Everything in Starter and:" lists; explainer sections pre-empting FAQ objections; "Ask Swan" AI assistant instead of talk-to-sales; "Most Popular" badge on the custom tier; third-party comparison SEO hub reviewing OTHER tools ([getswan.com/compare](https://www.getswan.com/compare), [clay-vs-apollo](https://www.getswan.com/compare/clay-vs-apollo)). Reviews: [g2.com/products/swan/reviews](https://www.g2.com/products/swan/reviews).

**Transfers to Tideover:** the value-metric reframe sentence, free passive access, rollover-as-fairness copy, price decomposition on the card, named concrete playbooks as SKUs. **Does not transfer:** credits themselves (Tideover's unit is an order, not a dollar-priced AI action), pause-at-zero (fatal mid-presale), 150% overage penalty (punishes the Kickstarter spike moment), seat pricing, sales-assisted tiers with no sales team behind them.

---

## ColdIQ (coldiq.com) — proof engine + call-gated retainers

**What they sell.** Managed outbound agency (cold email + LinkedIn ABM + LinkedIn content, end-to-end) for "B2B TECH COMPANIES ABOVE >$100K/MO IN REVENUE", stated on the hero ([coldiq.com](https://coldiq.com/), [coldiq.com/outbound](https://coldiq.com/outbound)). Plus free education ([walkthrough](https://coldiq.com/walkthrough), [minicourse](https://coldiq.com/minicourse)), an application-gated accelerator on a separate brand ([aiagency.io](https://aiagency.io/)), an 850+ tool affiliate directory ([coldiq.com/tools](https://coldiq.com/tools), [LinkedIn post](https://www.linkedin.com/posts/michel-lieben_there-are-over-850-ai-sales-tools-on-coldiq-activity-7214657834515378176-PwgS)), and a beehiiv newsletter ([newsletter.coldiq.com](https://www.newsletter.coldiq.com/)).

**Pricing.** Fully call-gated; third parties report $2,000-8,000+/mo retainers ([puzzleinbox.com/blog/coldiq-review](https://puzzleinbox.com/blog/coldiq-review/), [salesforge.ai directory](https://www.salesforge.ai/directory/agencies/coldiq)). Their /outbound page implies price via a cost table (SDR team $28K/mo labor + $28K tools vs ColdIQ "$5-7k/mo"). Contact form self-segments budget: $2K-5K / $5K-10K / $10K+. Commitment: 3-month pilot, then no lock-in ([coldiq.com/outbound](https://coldiq.com/outbound)).

**Proof machine.** Founder publishes real ARR from $0: "$4,000,000 ARR" ([post](https://www.linkedin.com/posts/michel-lieben_coldiq-just-crossed-4000000-arr-it-took-activity-7318219273934417921-zqmG)), "0 to $6,000,000 ARR" ([post](https://www.linkedin.com/posts/michel-lieben_coldiq-went-from-0-to-6000000-arr-in-activity-7383813893648973824-2fBy)), $6.5M ARR / 70+ clients / bootstrapped ([growth blog post](https://coldiq.com/blog/how-coldiq-grew-from-an-affiliate-side-project-to-a-65m-arr-agency), [Favikon profile](https://www.favikon.com/blog/who-is-michel-lieben)). LinkedIn content built as a "Google-me" trust layer for cold email (20-30 posts before expecting ROI), not inbound. Discipline: "one revenue-generating activity every single day", minimum 90 days. No money-back guarantee anywhere; risk reversal is structural: Day-90 review where "you still leave with a complete playbook, assets, and a working system", plus pre-send approval ("we won't send any messages you're not happy with").

**Transfers to Tideover:** build-in-public revenue transparency as the day-zero proof asset; the Google-me trust layer before cold outreach; pilot + walk-away asset instead of refund guarantee; budget self-segmentation on the managed-tier form; keep sub-$1K SaaS pricing public (gating gains nothing below $1K); a small free tool as SEO wedge (presale ETA-page grader); dogfooding.

---

## Valley (joinvalley.co) — order-of-magnitude anchor + proof-only moves

**Product/ICP.** Signal-based "warm outbound" LinkedIn AI SDR ([joinvalley.co](https://joinvalley.co), [product](https://www.joinvalley.co/product)).

**Pricing.** Starter $395/mo (1 seat, pay-then-onboard self-serve) / Growth $999/mo (3 seats, "10 meetings in 90 days or Valley works for free") / Scale custom (agencies) / Studios $1,499/mo done-for-you, waitlisted; third parties report $4,999 ([pricing](https://www.joinvalley.co/pricing), [fahimai.com/valley](https://www.fahimai.com/valley)). Meter is message volume per seat, not credits. Guarantee is usage-gated (600+ messages/seat/mo for 3 consecutive months, miss once and it voids; fine-print criticism at [salesforge.ai/blog/valley-ai](https://www.salesforge.ai/blog/valley-ai)). Value anchor: "Replaces the $750/month duct-tape stack" with the tools named, entry price set just under it.

**Positioning.** Reframes the axis: warm vs cold (15-45% reply rates vs 2% average as headline stat, [Artisan-vs-Valley post](https://www.joinvalley.co/blog/artisan-vs-valley-which-ai-sdr-platform-actually-books-meetings)); single-channel depth sold as a feature; safety as trust wedge (dedicated IPs, 5x money-back if YOUR account gets suspended: they insure the ICP's #1 fear specifically). They author the category's pricing SEO themselves ([AI SDR pricing explainer](https://www.joinvalley.co/blog/ai-sdr-pricing-in-2026-how-much-do-they-cost-what-s-the-roi), [best-tools listicle](https://www.joinvalley.co/blog/best-ai-sdr-tools-for-linkedin-outbound-in-2026)).

**Funnel assets.** Navattic interactive tour (joinvalley.navattic.com/l8k017s), 90-second demo video, ROI calculator (roi.joinvalley.co), self-DISqualification checker ([tryvalley](https://www.joinvalley.co/tryvalley)), coolmessagebro.com (100+ unedited AI-written messages: raw output as proof), dedicated cold-traffic landing page, case-study formula "[Company] + [verb] + [quantified result] + [timeframe]" ([casestudies](https://www.joinvalley.co/casestudies)). G2 listing Cloudflare-gated ([g2.com/products/valley/reviews](https://www.g2.com/products/valley/reviews)).

**Transfers to Tideover:** named-enemy stack math; unedited output gallery (public page of real or clearly-labeled demo buyer updates); insure the chargeback fear specifically, not generic dissatisfaction; usage-gated guarantee mechanic with conditions stated plainly; self-disqualification checker; dedicated cold-traffic landing page; tier-gated onboarding. **Anti-pattern:** their prices disagree across their own pages ($995/$999, $1,499/$4,999) and pay-first onboarding generates most of their negative reviews.

---

## Credit-pricing meta survey (7 tools + macro)

| Tool | Model | Key mechanic |
|---|---|---|
| [Clay](https://www.clay.com/pricing) | Free / ~$167 / ~$446 / custom | Two currencies (data credits ~$0.05, actions <$0.01); rollover to 2x; overage at 30% premium; AI tokens at cost-passthrough |
| [Instantly](https://instantly.ai/pricing) | $94 / $194 / $555 bundles | Capacity flat (sends, contacts), only data/AI is credits |
| [Apollo](https://www.apollo.io/pricing) | $49 / $79 / $119 per user | Three credit types; use-it-or-lose-it expiry; fair-use cap on "unlimited" (detail via [salesmotion.io](https://salesmotion.io/blog/apollo-pricing), [eesel.ai](https://www.eesel.ai/blog/apollo-pricing)) |
| [Smartlead](https://www.smartlead.ai/pricing) | $39 / $94 / $174 / $379 | No credits; capacity bands; "Unlimited" tier has a fine-print send cap |
| [Lemlist](https://www.lemlist.com/pricing) | $69 / $109 | Credits dollar-pinned (1 = $0.01), charged only on successful lookup |
| [Intercom Fin](https://www.intercom.com/pricing) | $0.99 per outcome | Pure outcome pricing; resolution IS the value |
| [Gorgias](https://www.gorgias.com/pricing) | $10-900 ticket tiers | Double meter: ticket bundles + $36-40/100 overage + AI Agent $1.00 per resolved conversation ($1.50 overage) |

**Macro.** 79 of the PricingSaaS 500 now offer a credit model, up from 35 at end of 2024, +126% YoY ([growthunhinged.com/p/2025-state-of-saas-pricing-changes](https://www.growthunhinged.com/p/2025-state-of-saas-pricing-changes)); 1,800+ pricing changes in 2025 across those 500 ([Poyar note](https://substack.com/@kylepoyar/note/c-196463953)). Credits exist to protect vendor COGS on customer-triggered actions. Poyar's 2026 call: pendulum swings back toward simplicity and predictability.

**Failure modes on record.** Clay: unpredictable bills, credits burned testing workflows, pay-for-the-attempt even when a lookup finds nothing ([eesel.ai/blog/clay-pricing](https://www.eesel.ai/blog/clay-pricing)). Cursor: June 2025 switch to an opaque usage pool exhausted "after only a handful of prompts", public CEO apology and refunds ([TechCrunch](https://techcrunch.com/2025/07/07/cursor-apologizes-for-unclear-pricing-changes-that-upset-users/)). Apollo/Cursor rollover expiry is a recurring resentment ([eesel.ai](https://www.eesel.ai/blog/apollo-pricing), [Growth Unhinged](https://www.growthunhinged.com/p/2025-state-of-saas-pricing-changes)).

**Verdict for Tideover:** no credits as core meter (no COGS to protect; torches the flat-fee wedge vs Gorgias; charges the merchant more exactly when the product is failing; adopts a fad as its analysts call the reversal). Narrow yes: a dollar-denominated Goodwill Wallet for gift sends only (pass-through + flat handling fee, charged on delivery, never expires while subscribed, refundable on exit). Ladder fix and full option table live in D8 v2. Local grounding: `docs/research/2026-07-02-enrichment-digest.md` lines 329-343 and 414, `TIDEOVER-PLAN.md` line 241 (Stripe links $199/$299/$499 need updating), `tideover/components/marketing/Pilot.tsx` and `FAQ.tsx` (still show the old $199-$499 / $799-$999 ladder).

---

## Founder-story structures (7 exemplars)

Corpus: [Basecamp about](https://basecamp.com/about) (~800 words), [Linear README](https://linear.app/readme) (~2,500), [Ahrefs about](https://ahrefs.com/about) (~1,200-1,400), [Plausible about](https://plausible.io/about) (~1,200), [Nathan Barry $5,020 MRR letter](https://nathanbarry.com/5k/) (~3,500), [Ugmonk about](https://ugmonk.com/pages/about) (~900), [PostHog about](https://posthog.com/about) (~2,000). ConvertKit arc corroborated: [growfers.com/story/convertkit](https://growfers.com/story/convertkit/), [nichepursuits.com interview](https://www.nichepursuits.com/nathan-barry-convertkit/). Dead ends: superhuman.com/manifesto (404), oatly.com/about-oatly (404).

**The winning arc:** lived problem in first-person scene → the named bottom → one-sentence insight → beliefs as verifiable mechanisms → honest limits → low-pressure invitation with direct contact. Tone: first-person singular beats corporate "we" for solo founders; humility is load-bearing; specificity (dates, dollars, named low points) is the anti-slop mechanism. Length: 800-1,200 words for founder letters. Proof without bragging: numbers as diagnosis not trophies, deliberate vagueness where precision would boast, proof by checkable mechanism.

Full findings, the mapped ABOUT draft, and morning-detail slots: `docs/research/founder-about-structures.md`.
