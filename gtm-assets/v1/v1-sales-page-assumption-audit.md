# V1 Sales Page — Assumption Audit & Validation Playbook

**Asset audited:** `gtm-assets/v1/v1-sales-page.md` (Adwield long-form sales page)
**Audited against:** `10-icp-research.md`, `reddit-scrape/ranked_quotes.md` (356 verbatim ICP quotes), `12-offer-locked.md`
**Purpose:** You did not personally run DTC Meta ads. You are serving an ICP whose shoes you have not been in. This doc separates what the ICP research actually *proves* from what the page *assumes* about what the ICP wants, believes, and will pay — so you know exactly which claims are load-bearing-but-unverified before you point traffic at this page.
**Date:** 2026-06-16
**Rule honored throughout:** PROOF-ONLY. Nothing below invents a metric, case study, testimonial, rating, or logo. Every number in the page is a *target to measure*, not a result. Merge fields and `[CASE STUDY PLACEHOLDER]`s stay.

---

# PART 0 — PUNCH-LIST: the riskiest unverified assumptions (fix/test these first)

These are the claims the whole page leans on that the ICP research does **not** back. Ranked by how much damage a wrong guess does. Each one is tested by the validation moves in Part 2 — most by the first 10 calls.

| # | Risky assumption | Where it lives | Why it's risky |
|---|---|---|---|
| **1** | **The ICP will accept *AI UGC* as the production method at all** (not just "more creative"). | Entire premise; hero, First Strike, FAQ "AI looks fake." | Research proves they want *creative velocity* and that AI-without-brand-context is slop. It does **not** prove your $20–100K/mo functional-consumables founder will run AI-avatar UGC *in their own account against their own brand*. The "AI is authentic-killing" camp is real and quoted. This is the single biggest leap. Test on every call. |
| **2** | **They will buy a $497 one-time pack as the front door** (and convert ~30–40% to retainer). | Pricing table, "Start here," ladder. | Zero pricing-acceptance data in the research. The $497 anchor, the under-pricing logic, and the conversion rate are all *founder design choices*, not validated. Reasonable, but unproven willingness-to-pay. |
| **3** | **The "equip a weapon / loadout / crit / Knight" gaming metaphor lands as confident, not gimmicky.** | Every section — it's the brand spine. | Not one ICP quote uses or rewards this register. Operators in the bank talk in flat P&L/ROAS/CPM terms ("more than profitable," "tested 400 creatives"). The flavor is 100% founder bet. It could read as a tell that you're *not* one of them. |
| **4** | **The hook-rate / hold-rate + CPA-flat guarantee is the metric they actually trust** (vs raw CTR or ROAS). | The No-Risk Loadout section. | The page *defends* the metric choice eloquently, but no ICP quote says hold-rate is the metric that would make them buy. The reframe ("raw CTR is gameable") is a smart hypothesis about their psychology — untested on a real buyer. |
| **5** | **"Launched and tagged in your account" is a top-tier desire** (vs just getting good files). | Hero B, deliverable, FAQ. | Strong inference from agency-frustration quotes, but no quote explicitly says "I'd pay more if you launch + tag in my taxonomy." Plausible; not verified. The whole Track-2 (Leverage) pitch rests on it. |
| **6** | **They greenlight 4 angles + claims and trust you to produce 24 off that.** | The 4×24 loop, review-loop section. | The "24 surprises off 4 approvals" objection is one *you* invented and pre-answered. No quote raises it. You may be solving a fear they don't have — or missing the fear they do. |
| **7** | **The 5-brand cap reads as scarcity/protection, not as "tiny operator who'll vanish."** | "Taking 5 brands," cap section, guarantee. | The page asserts the cap *cures* the agency scar. But a solo-operator counterparty doubt ("will he be here next month?") is real (offer doc scores Perceived Likelihood 6/10). Cap could amplify the "too small to rely on" fear instead of curing it. |
| **8** | **Two-person ops teams + the "30 hours a cycle" labor figure describe your actual buyer.** | Hero B, "the hands," FAQ. | The 2-person-team detail is verified for *8-figure* brands (u/Serious_Parsley5813, $400K/mo). It is **assumed**, not verified, for the $20–100K/mo tier you actually target. The "30 hours a cycle" number is a founder estimate, not from the data. |
| **9** | **The "drink-and-react shot is the one AI failure mode" is the credibility-builder you think it is.** | FAQ "AI looks fake," First Strike. | This specific vertical-insider tell is meant to signal expertise. It comes from your own analysis (offer doc Element 5), not from ICP mouths. If it's wrong or incomplete, a real operator spots it instantly — high-leverage to verify with an expert (Part 2c). |

**How to read the rest:** Part 1 tags every significant claim VERIFIED (with the citing quote) or ASSUMPTION. Part 2 is the concrete playbook to convert the assumptions into data without you ever having run a Meta account.

---

# PART 1 — CLAIM-BY-CLAIM AUDIT

Legend: **✅ VERIFIED** = backed by a specific ICP quote/source. **⚠️ ASSUMPTION** = a claim about what the ICP wants / believes / will pay that no data yet backs.

## A. The problem diagnosis (the "what broke" narrative)

| Claim in page | Tag | Evidence / why-risky |
|---|---|---|
| A winning creative "just broke" post-mid-February — same creative, same audience, double CPMs, no explanation. | **✅ VERIFIED** | u/Fabulous_Rich8974: *"Then Andromeda happened and everything broke… I tested everything. Nothing fixed it."* u/404NotAFool: *"Ad sets that worked for months suddenly die without warning."* u/AnyWrangler650: CPMs *"$45… they were $28 two months earlier."* |
| Operators tried targeting fixes / budget restructures / consolidation / "let it learn" and none worked. | **✅ VERIFIED** | u/Fabulous_Rich8974: *"I spent months blaming my creative, my audiences, my data, my landing pages. I tested everything."* u/IIth-The-Second: *"No matter what I do. What strategy, budget, audience etc... Nothing."* |
| The real lever now is creative supply/velocity, not targeting. | **✅ VERIFIED** | u/QuantumWolf99: *"the accounts that recovered fastest… were shipping 15-20 unique creative concepts per campaign."* u/WizardOfEcommerce: *"tested more than 400 ad creatives… The more you test, the faster you find winning ads that can scale."* |
| Creative fatigue at ~7 weeks; campaigns run to week 24+ that should've retired. | **✅ VERIFIED** | u/Emotional_Citron4073 (verbatim, quoted on the page): *"creative fatigue sets in at 7 weeks… we've been running 26-week campaigns when our end customers are disengaged at week 7."* |
| The auction is a "volume-discovery game" / flooded with creative, killing CPMs. | **✅ VERIFIED** | u/AbbreviationsReal139: *"The ad auction is being flooded with creatives, all optimized, driving CPMs through the roof… you're going to get absolutely killed unless you become so specific…"* |
| "You ship maybe 4 tests a month and hope." | **⚠️ ASSUMPTION** | The *volume reality* is verified, but "4 tests a month" as *your specific ICP's* current cadence is a characterization, not a quote. Top quotes are from people testing 90–400/wk. Risk: the lean $20–100K/mo founder may already test more than 4/mo, making the strawman ring false. Verify on calls. |
| "You're short on hands, not ideas/instinct." | **⚠️ ASSUMPTION** | Emotionally resonant inference, but no quote says "I have the ideas, I lack the hands." It's a flattering reframe you're betting on. Test whether it lands or feels presumptuous. |

## B. The agency / "fired-agency" wound

| Claim | Tag | Evidence / why-risky |
|---|---|---|
| Agencies are expensive, slow, never learn the brand; you became the project manager and got "24 files in a Drive folder." | **✅ VERIFIED (sentiment) / ⚠️ ASSUMPTION (the specifics)** | Sentiment verified — u/day2: *"fees are incredibly high and agencies just don't know the brand or have as quick of turnaround as in-house… decent chance your agency people are either going to be incompetent or completely new."* u/iamiskander corroborates turnaround/attention complaints. BUT the vivid "24 mp4s in a Google Drive folder + an invoice" image is a *dramatization* — no quote describes that exact handoff. Low risk, but it's invented color, not data. |
| "You don't hire an agency, you equip a weapon" framing of the scar. | **⚠️ ASSUMPTION** | The *scar* is verified; the *metaphor* wrapping it is unverified (see Punch-list #3). |

## C. The AI-slop / brand-context moat

| Claim | Tag | Evidence / why-risky |
|---|---|---|
| AI alone is slop; brand-context judgment is the difference. | **✅ VERIFIED** | u/uitracer9818: *"the outputs were really bad and generic AI slop… realized i wasnt giving it any brand context."* u/Humble-Outcome5904: *"the quality jump when you feed it real brand assets vs nothing is massive."* |
| There's a live "AI can't be authentic" skeptic camp to disarm. | **✅ VERIFIED** | u/Commercial_Web_6821: *"Brands require authenticity, AI can't deliver that."* u/nebbiyolo: *"their AI generated ad slop isn't hitting as well."* |
| Functional consumables are product-centric, so the uncanny-valley penalty is "structurally low." | **⚠️ ASSUMPTION** | This is *your* vertical thesis (offer doc Element 2), not an ICP statement. No quote validates that AI UGC works *better* for supplements than beauty. Plausible and central — but a hypothesis. **Punch-list #1.** |
| "Drink-and-react consumption shot is the one genuine AI failure mode." | **⚠️ ASSUMPTION** | Founder-sourced insider tell (offer doc), zero ICP corroboration. High-leverage to validate with a real operator. **Punch-list #9.** |

## D. Unit economics / who the buyer is

| Claim | Tag | Evidence / why-risky |
|---|---|---|
| Supplement unit economics support the spend (e.g. $90 AOV, $30 CPA, 3× ROAS). | **✅ VERIFIED** | u/Are_A_Boob: *"selling supplements at aov $90, cpa ~$30. Spending 5 figures a day in spend. It's more than profitable."* |
| AI cuts per-UGC-video cost from "weeks and hundreds of dollars" to dollars/minutes. | **✅ VERIFIED** | u/makingadsforfun ($500K AI-ads spend): *"used to take me weeks and hundreds of dollars to make a single UGC video with a human creator… a few dollars and a few minutes per video."* Also the page's *"Production cost reduced. Scalability increased. ROI increased."* is his verbatim line. |
| "$200–500 all-in per video" is the human-creator-equivalent value. | **⚠️ ASSUMPTION** | The *direction* (human UGC is expensive/slow) is verified; the specific $200–500 band is a founder figure, not in the quotes. Defensible, but label it as an estimate, never a measured cost. |
| Buyer is a 2-person ops team at $20–100K/mo with the founder as decision-maker. | **⚠️ ASSUMPTION (for your tier)** | The 2-person-team profile is verified only at the *8-figure / $400K-mo* level (u/Serious_Parsley5813). For the $20–100K/mo target tier it's an inference. **Punch-list #8.** The single biggest "am I even describing my buyer?" gap. |
| "30 hours a cycle" to run the full loop. | **⚠️ ASSUMPTION** | Founder estimate. No quote quantifies the labor. Used repeatedly as a load-bearing number. |

## E. The offer mechanics, pricing & guarantee

| Claim | Tag | Evidence / why-risky |
|---|---|---|
| First Strike (free made-for-them ad) is the trust spine. | **⚠️ ASSUMPTION (strategy)** | This is your highest-conviction *strategic bet* (offer doc calls it "the single highest-trust action"). It is sound reasoning, but no ICP has yet said "a free sample of my product would convert me." It's a hypothesis the first 10 conversations exist to prove. **This is also your mitigation for almost every other assumption — see Part 2d.** |
| $497 one-time pack as the public front door. | **⚠️ ASSUMPTION** | No pricing-acceptance data. **Punch-list #2.** |
| ~30–40% pack→retainer conversion. | **⚠️ ASSUMPTION** | Pure projection. Never state it publicly as fact (it isn't on the page — good; keep it internal). |
| Retainer $1.5–3.5K/mo "out of a single profitable day of spend." | **⚠️ ASSUMPTION (affordability is inferable; willingness is not)** | Affordability is *inferable* from u/Are_A_Boob's economics. Whether they'll *pay it to you, an unknown,* is unverified. |
| Guarantee on hook-rate/hold-rate + CPA-flat is the trust unlock. | **⚠️ ASSUMPTION** | **Punch-list #4.** The metric-choice psychology is untested on a buyer. |
| 5-brand cap reads as protection/scarcity. | **⚠️ ASSUMPTION** | **Punch-list #7.** Could backfire as "too small." |
| Brand cap, "claim-gated FTC/Meta screening," and the QC pass are real, deliverable commitments. | **✅ VERIFIED (as commitments) — but operationally unproven** | These are honest promises you control, not ICP claims. FTC/health-claim sensitivity in this vertical is real and correctly flagged. The risk isn't truthfulness; it's that you haven't yet *executed* one cycle, so they're untested in practice. |

## F. Proof posture (the strongest part of the page)

| Claim | Tag | Notes |
|---|---|---|
| "I have zero case studies, zero logos, and I won't fake them." | **✅ VERIFIED (honest) — and strategically correct** | This is the page's best move and is fully proof-compliant. The inbox-is-full-of-fakers framing is corroborated indirectly by the volume of AI-slop skepticism in the bank. Keep it. |
| Founding-partner board with `[CASE STUDY PLACEHOLDER]`s and `{{founding_slots_left}}`. | **✅ COMPLIANT** | No fabricated numbers; placeholders intact. This is exactly right — do not fill until a real pilot delivers a real delta. |
| Teardown library + "a real hold-rate number off my own spend." | **⚠️ ASSUMPTION (does not exist yet)** | Honest *as a plan*, but the page implies these assets exist. **Hard prerequisite (offer doc END note):** publish ≥1 teardown and run ≥1 real self-test *before* sending traffic here, or the proof posture is writing a check you haven't cashed. |

**Audit bottom line:** The *problem* half of the page is heavily verified — the page is built on real wounds. The *solution, pricing, metaphor, and "what they want" half* is largely assumption: defensible, internally consistent founder bets, but untested on a single real buyer. That is normal and fine — *provided you treat the page as a hypothesis and let the first 10 conversations grade it,* which is Part 2.

---

# PART 2 — VALIDATION PLAYBOOK
### "Serving an ICP whose shoes you haven't been in"

You can't pressure-test this page from your own experience, because you don't have the operator's experience. So you borrow it — from their words, from a paid expert, and from the first 10 conversations. Four moves.

## (a) Build the copy from THEIR words, not your guesses

Your unfair advantage is `reddit-scrape/ranked_quotes.md` — 356 verbatim ICP sentences. Use it as the source of truth for *register and vocabulary*, the way a method actor uses tape.

- **Replace invented color with their phrasing.** Where the page dramatizes ("24 mp4s in a Google Drive folder," "Wendy's parking lot" energy), check it against an actual quote. If no quote talks like that, it's your imagination, not their voice — flag it for the call test. (The offer doc already made this call: *"No Reddit quotes sold back verbatim as a hook — the wound is described in our own words."* Good — but that makes the *register* a bet, so keep the quote bank open as you edit.)
- **Mine the bank for objection language you haven't pre-handled.** You invented the "24 surprises off 4 approvals" objection (Punch-list #6). Search the bank for the objections operators *actually* voice and make sure those are answered. The real one on record is u/Admexo_: *"a prospect told me they can't justify my retainer because 'ai does the same thing for free now.'"* — that's the DIY objection, and the page does answer it. Good.
- **Steal their nouns.** They say "concepts," "angles," "ROAS," "CPM," "fatigue," "scale," "kill losers." They do **not** say "loadout," "crit," "wield," or "Knight." Before launch, decide consciously whether the gaming layer is worth the risk of sounding non-native to them (Punch-list #3). One safe experiment: keep a metaphor-light variant of the hero in Appendix A and A/B it.

## (b) The first ~10 conversations ARE the validation

You do not need a survey or a focus group. You need 10 real ICP founders on a call, each handed a made-for-them First Strike, and a fixed question set that targets the riskiest assumptions. Treat each call as a unit test for the punch-list.

**Setup:** Lead with the free First Strike (the sample is the reason they take the call). Then run discovery. The sample buys you the 15 minutes; the questions buy you the validation.

### The exact 5 questions to ask a real ICP on the call

Ask these close to verbatim. Shut up and let them talk. You are testing the punch-list, not selling.

1. **"Walk me through how you make and ship ad creative right now — who does it, how many new concepts go live in a typical month, and where's the bottleneck?"**
   → *Tests Punch-list #8 + #1 ("4 tests a month," who the buyer is, team size, the labor figure). You'll learn instantly if your "2-person team, 4 tests/month, short on hands" picture is real or fantasy. Do NOT lead them — let them name the number.*

2. **"When you've used AI for creative — or seen it — what happened? Where does it fall apart for a brand like yours?"**
   → *Tests Punch-list #1 + #9 (will they run AI UGC at all; is the slop fear real; do they spontaneously name a failure mode like the consumption shot, or a different one?). If they volunteer a failure mode you didn't know, that's gold and corrects your moat thesis.*

3. **"You just watched the First Strike of your own product. Be brutal — what would stop you from running that in your account tomorrow?"**
   → *Tests Punch-list #1 + the First Strike thesis (2d). This is the most important question. Their objection here is the true objection — it's the thing the whole page is trying to overcome, spoken by a real buyer.*

4. **"If a creative beats your current best ad on hold-rate while CPA stays flat, in your own account with the data shown — is that the proof that would make you say yes? Or is there a different number you'd actually need to see?"**
   → *Tests Punch-list #4 (the guarantee metric) + #5 (do they care about launched-and-tagged, ask the follow-up: "would you rather I hand you files or launch them in your account?"). If three of ten say "no, I need ROAS / I need CAC," your guarantee is cut on the wrong metric.*

5. **"For 10 made-for-you videos in your account, no contract — what feels like an obvious-yes price, and what price makes you stop and deliberate?"**
   → *Tests Punch-list #2 + #7 (pricing acceptance; does $497 land as impulse-yes; does "I only take 5 brands" reassure or worry them — listen for which). Frame as research, not a quote.*

**Scoring rule:** Tally the answers across 10 calls. An assumption survives if ~7/10 confirm it. If 4+ contradict it, the copy was wrong, not the prospects — rewrite that section from what they actually said. Keep a one-line log per call (which assumption confirmed/broke) so the pattern is visible by call 10.

## (c) Cheap expert red-line (borrow operator experience you don't have)

You can rent the shoes for a couple hundred dollars before you spend a month learning the hard way.

- **Hire one DTC performance-ads operator for 1–2 hours, ~$100–300.** Source via X (DTC-ads operators post constantly — the research already lists names like Nick Theriot, Andrew Faris, Aazar Shad as *category references*, not contacts; find a working media buyer at the $20–100K/mo tier) or Upwork ("DTC Meta media buyer, supplements/functional consumables"). Brief: *"Read this sales page as if you were the target buyer. Where do you call BS? What would make you bounce? Is the hold-rate guarantee the metric you'd trust? Is anything in here a tell that the author has never run an account?"* That last question is the one only an operator can answer — it directly de-risks the fact that you haven't been in their shoes.
- **Prioritize their read on Punch-list #1, #4, #8, #9** (the AI-UGC-in-vertical thesis, the guarantee metric, the buyer/labor profile, the drink-and-react insight). Those are the four you literally cannot self-verify.
- **Run IdeaBrowser's Sales Page Surgeon** on the page — it's the closest available "roast my sales page" engine and the page was already written in that house style. Use it for structural/conversion red-lines (clarity, CTA hierarchy, objection order). Treat it as complementary to the human operator, not a substitute: the AI catches copy mechanics; the operator catches "this person has never run ads."

## (d) The reframe: early on, the SAMPLE carries the trust — not the copy

This is the mental model that makes serving-an-unfamiliar-ICP safe.

- **The First Strike is the proof; the page is just the frame around it.** You have no track record, so no paragraph can carry the sale — the offer doc says it outright: *"No claim in any paragraph outperforms it [the rendered sample]."* That means a *good enough* page + a *great* sample beats a perfect page + no sample. Don't over-polish copy you haven't validated; spend the energy making the First Strike undeniable.
- **Treat v1 copy as a hypothesis, not a finished artifact.** Ship it, point only warm/low-stakes traffic at it first, and let the 10 calls grade each section. The page earns the right to be "final" only after the punch-list assumptions come back confirmed. Version it: `v1` is the hypothesis, `v2` is rewritten from call data.
- **Your trust comes from demonstration, not from being the ICP.** You will never out-authentic a 6-year operator on lived experience — so don't try. Win on the thing you *can* prove cold: a rendered ad of their product, a sharp teardown of a real ad in their vertical, one honest self-test number, and a guarantee that puts the risk on you. That stack substitutes *demonstrated competence* for *operator résumé* — which is the entire point of a proof-only go-to-market.

**Hard prerequisites before this page sees real traffic (from offer doc END note):** (1) the made-for-them First Strike sample must exist and be undeniable; (2) ≥1 published teardown live; (3) ≥1 real self-test hold-rate number, honestly labeled. Until those three exist, the proof posture in the page is a promise you can't yet keep.

**Proof-only, restated:** every metric on the page (hold-rate deltas, $200–500/video, 30 hours/cycle, 7-week fatigue applied to a client, 30–40% conversion) is a **target to measure or a third-party-sourced figure**, never a result you've produced. Keep all merge fields and `[CASE STUDY PLACEHOLDER]`s empty until a real pilot fills them with a real number. Never fabricate a case study, testimonial, rating, or logo — the empty-but-honest ledger is itself the differentiator in an inbox full of fakes.

---

**END — Assumption Audit & Validation Playbook.** Built from `v1-sales-page.md`, `10-icp-research.md`, `reddit-scrape/ranked_quotes.md`, and `12-offer-locked.md`. The problem narrative is verified against the quote bank; the solution/pricing/metaphor/"what-they-want" claims are founder hypotheses flagged for validation. The first 10 First-Strike calls — using the 5 questions above — are the validation instrument. Proof-only honored: zero fabricated metrics, case studies, testimonials, or logos.
