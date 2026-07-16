# TIDEOVER GTM CAMPAIGN — the daily operating plan

**2026-07-16.** Built from a 12-agent research workflow (6 lanes, each independently fact-checked with fresh fetches; 7 of 36 load-bearing claims were refuted and corrected before anything below was written — the corrections are marked). This is the plan Dylan runs at ~2 hours/day with the AI layer doing the rest. It extends, and does not replace, the assets that already exist: the sequences in `gtm-assets/v2/v2-cold-email.md`, the trigger engine in `gtm-assets/v2/v2-prospecting-sop.md`, the copy rules in `gtm-assets/copy-standard.md`, and the positioning verdict in `docs/recon-2026-07-10/MARKET-RECON.md`.

---

## 0. THE VERDICT IN ONE PAGE

**The honest math first.** Ninety days of solo founder-led cold outbound at 2 hrs/day models to **1–5 new customers (~$500–$2,500 MRR)** — reply rates for B2B SaaS run 2–4% (3–5% with a tight trigger-event ICP, which ours is), a good meeting rate is a fraction of that, and cold-outbound conversations close at maybe 15–25%. That is ~5% of the $20K/mo-in-90-days goal. No channel in this plan changes that arithmetic alone. What changes it: the Shopify preorder segment (customers that renew instead of churning at ship-day), tier mix toward $749, the window-pass packaging (torch pass D8), pilot referrals, and frankly more runway than 90 days. **This plan's real job in 90 days is 3–5 instrumented pilots and a repeatable engine — the $20K/mo target needs a recalibration conversation** (added to the decision list as D9-GTM).

**Channel roles — each does one job:**

| Channel | Job | NOT its job |
|---|---|---|
| Prospect engine + cold email | The pipeline. Trigger-led outreach to visibly-late campaigns | Volume spray. 30–90/day max, personalized |
| Reddit | Credibility + voice-of-customer mining where the ICP complains | Lead gen. Most subs ban promotion; play the long game |
| X | Founder presence, creator-peer relationships, build-in-public | Backer reach (tabletop discovery lives on YouTube/BGG/Discord, not X) |
| Directories (free layer) | Indexing + looking real when a prospect googles us | Signups. Near-zero direct yield, ~3 hrs one-time |
| Product Hunt + Show HN | One-shot PR badge, **after** first pilot proof exists | Pipeline. Verified outcomes for niche B2B: 56 signups at #8-of-day; 0 signups at top-50 |
| BackerKit blog / Stonemaier PR | The earned-media jackpot, post-pilot only | Anything before a real testimonial exists |

**The one structural truth to plan around:** crowdfunding demand is a **flow, not a stock**. A campaign customer's wait ends in 3–4 months and the need ends with it. The pipeline must re-source itself weekly forever, or MRR sags — this is why the prospect engine is automated and why the Shopify segment is the long-term anchor.

---

## 1. TAM / SAM / SOM (cited; every multiplier flagged)

All external stats verified by an independent second agent against primary sources. Assumptions are labeled — this doc obeys the same proof-only rule as the product.

**TAM ≈ $17M–$28M/yr (mid ~$21M).** Kickstarter funded 35,512 projects in 2024, its biggest year ($706.4M total) [Tubefilter, citing Kickstarter]. 4.2% of successful projects clear $100K [Kickstarter's own stats via SearchLogistics — note: lifetime rate applied to one year's flow, ASSUMPTION] → ~1,490/yr. Gamefound: 496 campaigns in 2025, assumed 40% clear $100K given its high-raise tabletop skew [ASSUMPTION] → ~200/yr. ~85% of that raise tier are physical goods with genuine 60–120+ day waits (Mollick's Wharton study: >75% of funded design/tech projects ship late; the ~9% never-deliver stat is from a separate Kickstarter-commissioned 47k-backer survey — both a decade old, no larger replication exists) → **~1,440 crowdfunding merchants/yr**. Shopify: 81,585 Plus stores [BuiltWith]; a 534k-store scan found 2.56% of Plus stores run a *detectable* preorder app (9 apps fingerprinted; enterprise tools like Purple Dot confirmed undercounted) — with a correction factor for undetected apps [the SHAKIEST assumption in this doc] → **~2,090 long-wait preorder brands**. Total ~3,530/yr × $6,000 blended ACV → **~$21M/yr**.

**SAM ≈ $8M–$13M/yr (mid ~$10M).** English-speaking creator share (~60–65%) × the 800–1,500-backer mid-size band (~40% of the $100K+ tier — at $80–150 avg pledges, $100–180K raised ≈ 800–1,500 backers) → ~345 crowdfunding + ~1,360 Shopify ≈ **1,700 reachable merchants/yr**.

**SOM (90 days, this plan) ≈ 1–5 customers, ~$500–$2,500 MRR.** 300 hand-verified prospects × 2–4% reply (stretch 3–5% on trigger-event personalization [Instantly 2026 benchmark report: 3.43% avg; top-quartile 5.5%+]) × conversation and close rates → midpoint ~2 customers. **Gap to $20K/mo: stated at the top; not solvable inside this plan's channels.**

---

## 2. THE STACK — shopping list (all prices fetched from live pricing pages this week)

| Item | Price | Why |
|---|---|---|
| 3 outreach domains (Porkbun) — e.g. tideoverhq.com, gettideover.com | ~$33/yr (~$3/mo) | Cold sends NEVER from tideover.app. **Corrected ratio: ~1 domain per 30–40 daily sends** (the 1-per-100-150 claim was refuted 3–5x optimistic) |
| 6 Google Workspace Starter mailboxes (2/domain) | ~$43–59/mo | Gmail-backed deliverability; 15–20 sends/box/day ceiling |
| Smartlead Base | $39/mo | Sending + warmup + rotation; unlimited mailboxes/warmup confirmed on live pricing (beats Instantly's $47 at this tier) |
| X Premium Basic | $3/mo | Non-Premium reach is now near-zero for link posts (verified: Buffer's 18.8M-post analysis — free accounts <100 impressions/post, Premium ~600). Includes native scheduling |
| Typefully Creator (optional) | $19/mo | AI drafting + queue; free tier (15 posts/mo) as fallback |
| Apify (KS discover actor $20/1k results + $9.99 email actor) | ~$15–35/mo usage | The automated prospect engine |
| Hunter.io free (50 credits/mo) + F5Bot free | $0 | Contact verification + Reddit/HN keyword alerts. **GummySearch is DEAD (closed 11/30/2025, confirmed on their homepage) — do not budget it** |
| Google Postmaster Tools + mail-tester.com | $0 | The deliverability dead-man switch |
| **Core total** | **~$120–160/mo** | StoreLeads ($75–250/mo) DEFERRED — mine Purple Dot/PreProduct case-study pages + app-review counts free first; buy one Pro month later if the Shopify lane needs bulk |
| One-time: CASL legal spot-check | ~CA$150–300 | See §7 — the single largest legal exposure; cheap insurance |

---

## 3. THE 30-DAY RAMP

**Week 1 (days 1–7) — infrastructure + seasoning. No cold sends.**
Buy domains, provision mailboxes, SPF/DKIM/DMARC (p=none suffices for Google's rule), register Postmaster Tools, start Smartlead warmup day 1 (**14 days minimum before any cold send** — corrected from "3 weeks"; we plan 21 for margin). Start X daily cadence + Reddit comment-only seasoning the same day (both need weeks of history before they pay). Submit the free directory layer (BetaList, AlternativeTo, SaaSHub, Uneed, MicroLaunch, IndieHackers page — ~3 hrs total, one-time). AI engine builds the first 200-row prospect list. F5Bot keywords live. CASL sourcing log starts with row one.

**Week 2 (days 8–14) — list + voice.**
Warmup continues. List to 300+ verified rows with distress tags. Personalization-hook bank built (the specific lateness signal per prospect — this is what moves reply rate from 2% to 4%+). Founder-story beats running on X. Reddit karma accruing. Book the CASL consult.

**Week 3 (days 15–21) — first sends.**
Cold sends begin at 5/mailbox/day (30/day total), sequence A1/B1 from `v2-cold-email.md`, every email citing the prospect's real trigger. Hard rule: any domain crossing 0.30% spam rate pauses immediately (Google's own threshold; target <0.10%). First replies → Dylan personally, same day.

**Week 4 (days 22–30) — ramp + read the data.**
Ramp toward 15/mailbox/day (~90/day) only if spam <0.1% and bounces <2%. First weekly promo-thread one-liners (r/smallbusiness "Promote Your Business", r/Entrepreneur "Thank You Thursday" — the ONLY sanctioned lanes, verified against both subs' live rules). Compare reply rate against the 2–4% benchmark; iterate hooks, not volume.

**Post-pilot (gate: first real testimonial, whenever it lands):** Product Hunt (self-submit — the hunter boost is retired; expectations set by verified outcomes above) + Show HN led with the real founder story + BackerKit blog and Stonemaier Games PR pitches. **None of these fire before proof exists** — premature PR wastes the one good first impression.

---

## 4. THE DAILY CALENDAR — Dylan's ~2 hours

| Block | Min | What |
|---|---|---|
| Outreach approvals | 15 | Review AI-drafted personalization hooks + approve the day's batch. No AI email ships unedited |
| Replies | 20 | Personally answer every prospect reply, same day — this block grows; steal from others when it does |
| Deliverability + pipeline glance | 10 | Smartlead dashboard daily; Postmaster 2x/week; pause anything trending wrong |
| Distress verification | 15 | Open the top-10 AI-scored campaigns, read the comment wall, tag hard-late vs just-slow |
| X | 20 | 3-sentence raw note → approve 1 of 3 AI drafts (7 min); reply-first engagement into 5–8 hub threads (12 min) — replies outrank posts in the ranking code, links are penalized |
| Reddit | 20 | Review AI-triaged threads + drafted replies; rewrite in own voice; post 1–3 genuine comments. Rules: 90/10 value ratio, never the same link on 3+ subs/day, never DM-bait ("comment for link" = permaban trigger), product mention only when directly asked |
| Flex / demos | 20 | Early: directory submissions, BGG forum reading, IndieHackers milestone post. Later: demo calls (each demo displaces everything except replies) |

**The AI layer (runs before Dylan wakes up — this is the Opus automation spec):**
1. Pull/refresh prospect sources (webrobots monthly dump deltas; Apify discover run 2x/week) → distress-score = comments_count / max(updates_count,1) + days-past-estimate → ranked shortlist.
2. Contact discovery (Hunter + Apify email actor) with **source-URL logged per address** (the CASL due-diligence record).
3. Draft the day's outreach batch from the sequence library, each with the prospect's specific trigger cited.
4. F5Bot digest triage → candidate threads + drafted value-first replies.
5. X: 3 post variants from yesterday's raw note, rotated across the 5 formats (anonymized before/after reply, founder-story beat, build log, composite WISMO pattern — **never a named struggling creator: they are the customer, not the content**, and the HBR evidence says public engagement with complaints backfires anyway).
6. Pipeline digest: replies, spam rates, list health, today's suggested focus.

---

## 5. CHANNEL RULES THAT CAME OUT OF VERIFICATION (the corrections that matter)

- **r/Kickstarter is NOT quarantined** — a stats tool's flag was checked by live browse and is false. It's usable, but it's backers + creator self-promo noise; treat as VOC mine, not a channel. r/Crowdfunding bans promotion outright (listening only). The buyer subs are r/shopify, r/ecommerce, r/tabletopgamedesign + BGG's own crowdfunding forums (read BGG's community rules manually before posting — fetch was blocked).
- **Kickstarter's real ToS clause** bans crawling/spidering (the florid "bulk harvest" quote circulating is fabricated — it's from other sites' ToS). Direct scripted fetches 403 anyway. Use webrobots.io's dataset (free, monthly, since 2016) and Apify actors as tolerated-not-sanctioned, modest volumes, never republish.
- **Cold email numbers to plan on:** 2–4% reply (not the 5–8% the first sweep claimed — its own source didn't support it), 14-day minimum warmup, ~30–40 daily sends per domain ceiling, spam <0.30% or Google rejects outright (their published rule at 5k/day scale; the discipline applies at any volume).
- **X without Premium is pointless in 2026** (link-post reach for free accounts has collapsed to near-zero — worse than the "50–90% penalty" the first sweep reported). $3/mo solves it. The 150x reply-weight figure is 2023 leaked-code vintage (current weights are redacted) — directionally right: reply-first, link-averse.
- **Product Hunt is a badge, not a channel.** Ranking mechanics are unverifiable (accounts contradict each other on early-velocity weighting), links are rel=ugc (zero SEO), and the "PH screens out 70% of founders" stat is actually a launch agency's client intake, not PH. Launch it once, post-pilot, for the credibility line, and go back to outreach.

---

## 6. KPIs — measured, or not reported (the product's rule, applied to its GTM)

**Track:** verified prospects added/week · reply rate (target ≥3% by day 45) · positive replies → conversations · demos/week · pilots started (the only number that matters) · spam rate per domain (<0.10%) · Reddit comment karma + inbound DMs · X profile visits/DMs (directional only).
**Do not report:** open rates (Apple MPP noise), impressions, follower counts, directory listing counts. Vanity is the GTM version of the fake-deflection metric we just killed in the product.

---

## 7. THE LEGAL FLOOR (Dylan is a Canadian sender — CASL binds, and it's stricter than CAN-SPAM)

CASL applies to anything sent from Canada regardless of recipient location. The lane we operate in: **implied consent via conspicuous publication** — the address was publicly posted in a business context, with no "no unsolicited email" notice nearby, and the message is relevant to the recipient's business role (all verified against the CRTC's own guide). Operating rules: only business-context addresses (campaign pages, store contact pages — never guessed patterns, never personal Gmail scraped out of context); log the source URL of every address (the due-diligence record); identify sender + working unsubscribe honored promptly in every message; the one-time lawyer spot-check before scaling past the pilot list. Penalties are real: up to $10M/violation CASL (directors personally liable), $53,088/email CAN-SPAM.

---

## 8. HANDOFF WIRING

The AI layer in §4 is an Opus work order: the prospect engine (scrape→score→enrich→log), the drafting pipelines (outreach, X, Reddit), and the morning digest are all buildable as scheduled automations. Board card **GTM2** tracks the campaign; the daily calendar starts the day Dylan says go on the domain purchases (the 2-week warmup clock is the critical path — G5 called this in June and it's still true). Everything customer-facing that ships through this campaign passes the same copy standard and proof-only gate as the product.

**Sources:** every price/rule/stat above carries its verification in `docs/gtm-campaign/research/` (the 12 raw agent reports, JSON). Refuted-claim record is in the lane files — kept deliberately, so the next reader knows what was checked and what fell.
