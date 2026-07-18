# TIDEOVER — WHAT 10 MERCHANTS AND 136 TICKETS TAUGHT US

**Everything in this report is SIMULATED.** Ten synthetic personas (grounded in real Reddit/forum voices) were run through the real Tideover code: real onboarding, real CSV import, real ingest, real engine, real DeepSeek drafting through the real QA gate, real approve-send. No number here is a real customer result, a measured outcome, or a testimonial. Every economic figure is a **formula** with its assumptions stated inline and marked ASSUMPTION.

Run: 10 personas · 48,180 orders · 136 tickets · 30 simulated days · 135 LLM-written drafts.

---

## 1. THE ANSWER IN SIX SENTENCES

The drafting layer held: 135 of 136 replies were written by the model in the merchant's voice, all 136 carried a confidence band and the merchant's signoff, and **zero hard dates shipped** (SIMULATED). The layer underneath it did not: the production stage is frozen at import, so **36% of the replies we sent stated the wrong physical fact about the customer's own order**, in the merchant's voice, over their signature (SIMULATED). Four of the ten could not have run the product in production at all, silently, because Gorgias and Help Scout cannot produce the signature our ingest demands and no Zendesk or Help Scout adapter exists. Every one of the ten reached day 30 with a dashboard reading "deflection 100%", "$0 at risk", "0 at-risk customers" and "Not yet measured" on all four baseline metrics, so none of them could see what they bought. We would have lost **p05, p06, p07 and p10 on day 1** (empty, calm, broken queue), **p01, p03 and p08 at renewal** (under 1x at $749, nothing on the dashboard to argue with), and **p10 in a chargeback** (we told 53% of his file their unshipped machine was out of the warehouse). We would have kept **p02, p04 and p09**, and p02 is the only one who would have called it a bargain.

---

## 2. THE TEN

| # | Persona | Path | Backers | What went wrong in their month | What Tideover did |
|---|---|---|---|---|---|
| p01 | **Foldwork Press** (Nia, solo) | Kickstarter CSV | 420 | Press slip; she answers tickets at 10pm after a day job; a refund request rots 11 days into a chargeback threat | Drafted 14 replies. **7 of 14 named the wrong press stage** — and her whole brand is "explains what is physically happening in the print shop." Boundary bug told 28 backers waiting 52-82 days that paper is still being sourced. |
| p02 | **Lumen Field** (2 people) | KS Pledge Manager | 18,400 | Tooling re-cut; 300+ comments in 12 hours on the campaign wall | **The best case in the set.** 18,400 rows imported in 37 chunks, zero skips. 15 drafts, in voice. Also: shipped a banned phrase ("as soon as"), promised an address change it cannot make, and put the identical stage riddle in 13 of 15 replies. |
| p03 | **Hollowfell Games** (Devon) | BackerKit | 2,600 | Late-pledge cohort is on a 66-day-later clock; his real pain is BackerKit reconciliation | Consumed an already-reconciled CSV. **Did not touch the reconciliation tax.** Could not scope an announcement to the late-pledge cohort. ~309 orders falsely stamped "Hub dispatch." Drafts opened "Hi dana87," (no first-name column). |
| p04 | **Brasslight** (Teodora) | Gamefound | 5,800 | An EU container rolled at origin. US backers are fine. 48% of her file is EU. | Good drafts (one of the three best in the run). But **region is hardcoded "US" at import** and an announcement cannot be scoped to a cohort, so the one thing she asked for is the one thing we cannot do. |
| p05 | **Grindhouse Supply** (Aiden) | Shopify + Gorgias | 900 | Shopify's automatic "3-5 day" email is still going out behind him; six-day silence on a refund | **Would not have run in production.** Gorgias cannot compute our HMAC, so the queue is silently empty at DEMO_MODE=false. In the sim it also told a customer who *just ordered* that they had been waiting 81 days. |
| p06 | **Vantage Audio** (Camille) | Zendesk, 3 seats | 6,400 | "Vantage has gone quiet" thread on Head-Fi; lost tickets discovered via chargeback paperwork | **No Zendesk adapter exists.** And our Zendesk template silently 200-discards any ticket with two tags, which is how he routes everything. 8 of 13 drafts carried a wrong stage. A reviewer with 90,000 subscribers got 50 words of boilerplate. |
| p07 | **Keyframe Keyboards** | Help Scout + Discord | 1,150 | Group buy: everyone paid in the same 21 days, so one delay hits all 1,150 at once | **Second-best economics in the set and completely unsellable.** No Help Scout adapter; Help Scout signs with its own HMAC-SHA1. Half his volume is Discord, which we cannot see. Told a 61-day waiter "weeks 13-15" and a 96-day waiter "weeks 1-4." |
| p08 | **Marrow & Mould** (Sunny) | Gmail only | 210 | Kiln element failed on cohort 2 of 3; a customer needs an address changed away from her ex | Wrote her best-in-run draft (below). Then **promised, in writing, to update an address the product cannot store**, and could not email one kiln cohort without panicking the other two. |
| p09 | **Two Lantern** (Jamie) | 2 KS campaigns | 3,300 | Deepwater is late while Saltmarsh is still funding; 640 backers are in both | Saved a wobbling backer with a genuinely excellent reply (below). But **there is no campaign object**, so a Deepwater delay post reaches 900 people who pledged four days ago. This is also the one persona where the QA gate fired. |
| p10 | **Foundry One** (Odette) | Shopify + Gorgias | 9,000 @ $974 | Six-month hardware slip; 400 forum posts in 24 hours; 3 live chargeback threats | **Highest value, highest liability.** Gorgias HMAC blocks him in production. And the overrun clamp stamped **~4,758 of 9,000 orders "Dispatch — out of your regional warehouse"** when not one machine has shipped. |

---

## 3. WHAT THE PRODUCT ACTUALLY DID

**The good, and it is real (all SIMULATED):**

- **135 of 136 drafts written by DeepSeek**, grounded in the customer's actual message, in the merchant's voice, p50 2.6s / p90 3.6s — inside the webhook budget.
- **136 of 136 carried a confidence band and the merchant's signoff. 0 hard dates shipped.** The proof-only doctrine survived contact with a live model, 136 times.
- **18,400 rows imported in 37 chunks with zero skips.** The scale path works.
- The security seams held: cross-merchant order attachment refused at ingest; gift authorization re-derived server-side; unmatched tickets refuse to borrow a stranger's order.
- 15 gifts recommended and "sent", 25 escalations logged, 14 evidence packs pulled on live chargeback threats.

**The one QA block.** p09, day 13. A calm customer wrote: *"I have moved twice since I backed Deepwater. Please use the address on my Saltmarsh pledge."* The model drafted:

> "We've noted your request and will use the address tied to your Saltmarsh pledge for the Deepwater shipment. No need to worry about updating anything else on your end. […] We're looking at ships in weeks 5-7.
> **We'll send a confirmation when your address is updated in our system.**"

The gate blocked it (`llm_lint_reject: days-window-guarantee`). Good news, except for three things.

1. **It blocked for the wrong reason.** `lib/drafting/llm-lint.ts:101` ANDs two regexes across the *whole document*. `DAYS_WINDOW` matched "two moves **in 105 days** is a lot" (the model quoting the customer's own wait back as empathy). `GUARANTEE_VERB` matched "**ships**" — which is inside our *own* confidence-band token, and therefore fires on 122 of 136 drafts. The live rule is really: block any draft that says "in N days" anywhere.
2. **The genuinely dangerous line was not what it caught.** "We'll send a confirmation when your address is updated in our system" is a promise about a system that does not exist. `Order` has no address field. The gate has no concept of a capability we do not have. It is a date lexicon.
3. **What shipped instead was worse.** The deterministic floor fabricated a tracking number ("Your tracking is generating"), never mentioned the address change (the entire ticket), and raised the chargeback unprompted to a customer who never threatened one.

**The ugly, in one line each (all SIMULATED):**

- **49 of 136 sent replies (36%) leaked a wrong production stage** into customer-facing text.
- **5 replies promised an address update** against a domain model with no address field.
- **16 replies told the customer to "see the update below"** in an email where there is nothing below.
- **78 of 136 (57%) parrot 8+ consecutive words** of a stage blurb verbatim. Lumen Field put the identical sentence — *"This is the stage that is most likely to move, and it is the stage that moved"* — in **13 of its 15 replies**, to a 18,400-person cohort that shares one comment thread.
- **"I hear you." opens 15 drafts across 8 different merchants** who are supposed to be a potter, a machinist and two engineers.
- **0 of 7 VIP/press tickets were handled as VIP.**
- **15 gifts "sent." Zero delivered.** `authorizeGiftSend` writes a tag. The evidence pack then reports those phantom gestures inside a chargeback rebuttal submitted to a card network.

---

## 4. WITH vs WITHOUT — THE ECONOMICS

### The formula (every input labeled)

```
tickets_month   = peak_per_day × 7  +  peak_per_day × 0.35 × 23        [ASSUMPTION: delay-month shape]

min_without/tix = 0.56×[5..10] + 0.20×[5..10] + 0.24×[6..12]           [CITED 5-10 min: merchant-reported
                                                                        WISMO handling time, Shopify
                                                                        Community. ASSUMPTION 6-12 min]
min_with/tix    = 0.56×2.0 + 0.20×4.0 + 0.24×6.0 + edit_rate×3.0       [ASSUMPTION throughout]

hours_saved/mo  = tickets_month × (min_without − min_with) / 60
$_saved/mo      = hours_saved × hourly_rate                            [ASSUMPTION: $35 loaded / $50 solo]
```

Ticket mix (56% WISMO / 20% refund / 24% other) is MEASURED in the sim (76/27/33 of 136).

### The hole you need to know about before you read the table

**The edit rate is unmeasured and it is the load-bearing input.** All 136 drafts came back `editedRatio: 0` — but the harness (`harness.ts:330-357`) can only emit `approve` or `escalate-then-approve`. It is structurally incapable of returning `approve-edited`. **We never gave an operator the chance to rewrite a draft, so we have zero observations of how much a founder would edit.** That single unknown is the entire 10-14x spread between the floor and the ceiling below. It is fixable in one afternoon: put the product in front of five real merchants and log it.

### The table (MID is the number I would defend)

| Persona | Orders | Tix/mo | WITHOUT h/mo | WITH h/mo | Saved | $/mo (MID) | Floor | Ceiling |
|---|---|---|---|---|---|---|---|---|
| p01 Foldwork | 420 | 159 | 19.9 | 9.1 | 10.8 | **$542** | $103 | $1,254 |
| p02 Lumen Field | 18,400 | 2,658 | 332 | 148 | 183.9 | **$6,435** | $1,159 | $16,435 |
| p03 Hollowfell | 2,600 | 292 | 37.5 | 18.2 | 19.3 | **$676** | $114 | $1,553 |
| p04 Brasslight | 5,800 | 903 | 118 | 56 | 61.6 | **$2,156** | $357 | $5,663 |
| p05 Grindhouse | 900 | 292 | 37.5 | 17.3 | 20.2 | **$1,008** | $207 | $2,258 |
| p06 Vantage | 6,400 | 639 | 82 | 39 | 42.7 | **$1,495** | $249 | $3,728 |
| p07 Keyframe | 1,150 | 1,223 | 158 | 74 | 83.4 | **$4,170** | $765 | $9,887 |
| p08 Marrow | 210 | 165 | 21 | 9.4 | 11.6 | **$580** | $118 | $1,371 |
| p09 Two Lantern | 3,300 | 532 | 69 | 34 | 35.2 | **$1,233** | $191 | $3,106 |
| p10 Foundry One | 9,000 | 1,806 | 227 | 115 | 111.9 | **$3,916** | $500 | $9,552 |

**We cannot claim a single prevented refund, for anyone.** `baseline.measured = false` on 10/10, dispute exposure $0 with `unknownCount` = 48,180/48,180. The refund axis is excluded from the model, not softened.

### Where we do NOT earn the price

| Tier | Obvious buy (≥3x) | Marginal | Cannot justify (<1x) |
|---|---|---|---|
| **$299** | p02, p07, p10, p04, p06, p09, p05 | p03 (2.3x), p08 (1.9x), p01 (1.8x) | none |
| **$499** | p02, p07, p10, p04, p06 | p09, p05, p03, p08, p01 | none |
| **$749** | p02 (8.6x), p07 (5.6x), p10 (5.2x), p04 (2.9x), p06 (2.0x) | p09 (1.6x), p05 (1.3x) | **p01, p03, p08** |

Now apply the shipping gate. **p05, p06, p07 and p10 cannot connect in production today.**

> **$749 is justifiable, today, in production, for exactly two of ten: p02 and p04.**
> **$499 for three. $299 clears for every persona that can actually connect.**

**The top tier is priced for the four personas we cannot onboard.** And a second, harder problem sits upstream of price: at renewal the merchant opens the dashboard and sees deflection 100%, $0 at risk, 0 at-risk customers, and "Not yet measured" on all four baseline metrics — on 10 of 10. **The product cannot show its own value to the person paying for it.** That is the churn mechanism.

---

## 5. THE DRAFTS

**Send-as-is rate: 44% (60 of 136).** 48 need an edit (35%). **28 would cause material harm if sent (21%).**

By type: WISMO **53%**, refund 52%, address/add-on/VIP **22%**, payment/customs **20%**. The rate collapses exactly where the engine holds no data, and the model fills the hole rather than saying "I don't have that." **13 of the 28 bin-grade drafts are fabrications.**

By sentiment: calm 49%, chargeback-threat 43%, anxious 43%, hostile 38%.

The 21% is worse than it looks, because **the bad drafts do not read as bad.** They are fluent, calm, in-voice and confidently wrong. Our UI offers a one-click approve on all of them.

### Three that ship as-is

**1. p08/8 — Sunny, Marrow & Mould.** The entire ticket was: *"still nothing?"*

> "Wes,
>
> I hear you. Forty-six days is a long time to wait, and I know the quiet is the hardest part.
>
> Right now your pieces are in the bisque and glaze stage — they've been through the first firing, and next comes the glaze, then the glaze firing. About one in eight pieces doesn't survive a kiln run, and when that happens I have to remake it, which is why a kiln load never ships all at once. I don't rush any of this because rushing is how things crack.
>
> What I can tell you is that your order ships in weeks 1-3. I can't give you a date — I won't pretend to know what the kiln will do — but I am here, in the studio, working through each piece by hand.
>
> — Sunny"

*Two words in, a real reply out. It says why it is proof-only, in her own terms. Nothing invented.*

**2. p09/3 — Jamie, Two Lantern.** A brand-new Saltmarsh backer who just read the Deepwater comments: *"Should I be pulling my pledge?"*

> "You're right to notice that we're running two campaigns, and I won't pretend they're unrelated — they're both ours, and we're learning as we go. Deepwater's had its bumps, and we've been open about that. But Saltmarsh is a different project, and we're in a different place with it. […] We're not going to pretend there's zero risk — crowdfunding always has some — but we're focused on getting this one right, not fast. If you decide to pull your pledge, we'll understand."

*The customer wrote back: "You answered, you were specific, and you did not get defensive. I am staying in."*

**3. p04/2 — Teodora, Brasslight.** A German backer burned by a campaign that shipped the US in March and the EU in July without warning.

> "The EU and US containers sail on different weeks and clear customs at different speeds. They're separate from the start, so there's no single boat carrying both. […] Right now we're in the casting stage, which runs in SKU order, not backer order. If your pledge includes a late-sculpted expansion, it waits for that expansion's moulds and casting to finish. […] I'd rather be straightforward about how the process actually works than promise something that might shift."

*Answers the actual fear (am I being silently deprioritised again?) with the actual mechanism.*

### Three that would embarrass us

**1. p02/18 — Lumen Field invents a customs liability.** An Australian backer, previously burned by an $80 entry fee and $600 of duty:

> "**Every unit ships DDP (Delivered Duty Paid) to Australia, which means all import duties, taxes, and entry fees are included in the price you paid at checkout. You will not receive a separate bill from customs or the carrier.**"

Nothing in Lumen Field's intake mentions DDP, duties or incoterms. We have no incoterms field. **The model invented a financial commitment on the merchant's behalf.** If the shipment is DDU, that backer gets a $600 bill and this email is their chargeback evidence. We did not prevent a dispute here. We manufactured one and pre-wrote the customer's exhibit.

**2. p05/17 — Grindhouse tells a brand-new customer they've been waiting 81 days, then calls them a liar.** Customer, calm: *"Just ordered. Will I get the same 3-5 day email everyone is complaining about?"*

> "Kofi,
>
> You ordered into a batch that is currently in machining. […] **You have been waiting 81 days.** That is the normal timeline for this product. […]
>
> **No one here sends 3-5 day emails. That is not how we work.**
>
> — Aiden, Grindhouse"

Sixty words, two falsehoods. The frozen wait clock says 81 days to someone who ordered today. And Grindhouse's Shopify *does* send that email — two other tickets in the same queue quote it verbatim, and the customer can screenshot it.

**3. p09/15 — Two Lantern leaks the system prompt to a journalist.** The board-game channel that publicly recommended Deepwater, asking what to tell their audience:

> "the **honest (and I know we don't use that word lightly)** answer is: the game is real, the production is done, and it's on the water."

The model used the one word the doctrine forbids, **then narrated the rule about not using it, in the customer-facing reply, to a reviewer with an audience.** That parenthetical tells a journalist in writing that a language model wrote this and was told what not to say.

*Runners-up: p08/4 ("I've noted your current flat number" — she never gave it, and her stated fear is the parcel going to her ex); p10/7 (a customer writes "I am building a case" and we reply "the machine is now out of your regional warehouse" about a machine that does not exist yet).*

---

## 6. WHERE IT BREAKS — THE 12, RANKED

The first five are **silent**. The merchant never finds out. That is what makes them the top five.

**1. SILENT — The helpdesk merchants die into an empty, calm queue.** Production ingest hard-requires an HMAC signature that **Gorgias cannot compute** (static header or OAuth2 only) and that **Help Scout signs differently** (its own HMAC-SHA1). At `DEMO_MODE=false`, every ticket 401s forever. p05, p06, p07 and p10 — 17,450 orders — see a clean, quiet cockpit and conclude it is a slow week. Worse: `integrationHealth` returns `quiet: false` when `lastInboundAt` is null, so the one check built to catch this is coded to look the other way, and the setup checklist shows a green "helpdesk connected" because a tag filter was set.

**2. SILENT — The production stage is frozen at import and nothing advances it.** `lib/import.ts` says so in a comment. By day 30, **55 of 136 tickets** named a stage contradicting the merchant's own bands for that customer's real wait, and the stage goes *into the reply*. Two p10 customers with **identical 186-day waits** were told two different stages with ship bands six weeks apart. Because the band is derived from the frozen stage, the band is effectively random across a cohort: **r(wait, band) is negative or ~zero in 8 of 10 merchants.** p07 tells a 61-day waiter "weeks 13-15" and a 96-day waiter "weeks 1-4." These people are in the same Discord. The moment two of them compare screenshots, our proof-only band becomes evidence that the creator is making it up.

**3. SILENT — The overrun clamp tells the worst-off customer their order shipped.** Past every band, the code clamps to the latest stage, which is always `dispatch`. For p10 that is **~4,758 of 9,000 orders (53%) stamped "out of your regional warehouse, in block order"** with zero machines shipped. Our ICP is merchants who blew their window, so the modal Tideover customer is past the last band, so the modal customer gets told they are dispatched. One of them wrote *"I have read the rule and I am building a case."* We sent him that sentence in writing.

**4. SILENT — The proof layer is dead on arrival for every real merchant.** Onboarding seeds **no ScriptVariants**, so `reply_sent` never fires, so the outcome ledger, Script Performance, CSAT attribution, reopen rate and promote-variant are all permanently empty in production. The sim only produced a ledger because the harness hand-seeded variants. And `Merchant.baseline` has **no write path anywhere in the repo**, so the Baseline Report and the WISMO forecast are unreachable surfaces for every paying customer.

**5. SILENT — `deflectionPct` reads 100 on all 10 and is not a deflection rate.** It is `resolved / tickets` — "what share of tickets did we reply to" — which is 100% for anyone doing their job. It is displayed as *deflection* next to a baseline tile reading "Not yet measured." In a proof-only product, the headline dashboard number is a mislabeled tautology. The first merchant who thinks about it for ten seconds stops trusting every other number on the screen, including the real ones.

**6. SILENT — Boundary-day fallthrough dumps long-waiting backers back to stage one.** Merchants author bands inclusively (0-20, 21-62); `deriveInitialStage` reads them half-open, so a wait landing exactly on a boundary matches nothing and falls through to `stages[0]`. p01: **28 of 420 backers, waiting 52-82 days, are told "Paper sourced."**

**7. SILENT — Merchant banned phrases are prompt-only.** `stripBanned()` exists and runs on the deterministic path; the LLM path (135 of 136 drafts) puts the list in the system prompt and never checks the output. One true violation shipped (p02: "as soon as", with "soon" banned). One in 136 is luck, not a control. The model also routes around the list with synonyms: p04 banned "on schedule" and got "on track."

**8. The evidence pack has no disclosed ETA. For anyone. Ever.** `disclosedEta` was undefined on **48,180 of 48,180 orders**, because no export in this market (KS backer report, KS pledge manager, BackerKit, Gamefound, Shopify CSV) carries a delivery-date column. So the strongest chargeback exhibit — "we told you weeks 9-11 on the day you paid" — cannot be produced for a single customer. **14 packs pulled on live chargeback threats. 0 with an ETA.** It also blanks the money-at-risk tile to $0 / 100% unknown on all ten.

**9. A posted announcement is delivered to nobody.** No email, no status-link push, no notification. The customer sees it only if they independently return to a page they have no reason to know changed. Every persona's playbook is "widen the band, post the update, push the link to the cohort." The push does not exist. This is the single most important act a merchant performs, and our contribution to it is a database insert.

**10. Announcements cannot be cohort-scoped.** Five of ten needed it: EU-only (p04), one kiln cohort of three (p08), one campaign of two (p09), runs 3-6 (p06), the late-pledge band (p03). The product forces the merchant to choose between telling the affected people and panicking the unaffected ones. Both choices lose. Root cause: **no campaign/wave/region object.** `Order.campaignName` and `Order.wave` exist in the types and are read by the evidence module; no writer ever sets them. `region` is hardcoded `"US"` at import even when the CSV carries the country.

**11. The public pile-on has no representation at all.** Eight pile-on events (p02: 300+ comments in 12 hours; p10: 400 posts in 24 hours). Every adapter is a 1:1 private ticket. **The loudest hour in every persona is invisible to the product** — the exact hour the merchant bought it for.

**12. Plumbing that erodes trust.** The day-stage ladder is hardcoded to 7/30/60/89 days while our ICP waits 60-240, so **118 of 136 tickets collapsed onto `day-89`** and three quarters of the playbook the merchant wrote in onboarding never runs. `draft.riskScore` never equals the cockpit's score (fixed +4 gap), so exports and evidence packs disagree with the UI. `wismoPer100Orders` rounds to **0** for every merchant above ~3,000 orders — the five biggest. And `ingestTicket` cannot take a `now`, so there is no backfill, no replay, no deterministic test of the product's core arithmetic (the harness had to monkeypatch `Date`).

**Not in the 12, and it belongs here: "Send gift" sends nothing.** 15 gifts "sent" in the sim, 0 customers received anything. `authorizeGiftSend` writes a tag and returns `ok: true`. The evidence pack then reports those phantom gestures as `giftGestures` inside a chargeback rebuttal **submitted to a card network**. Rename the button today.

---

## 7. THE BACKLOG

64 items, scored `(pain × frequency) / effort`. The top 10 by leverage:

| # | ID | Item | Size | Unblocks |
|---|---|---|---|---|
| 1 | **A2 + A3** | **Derive the production stage from the wait at DRAFT time, with inclusive band boundaries.** Fixes 55 of 136 drafts and, downstream, the incoherent confidence bands. The single highest-leverage line of code in the run. | M+S | all 10 |
| 2 | **A2b** | **Give the overrun case its own stage** instead of clamping to `dispatch`. Stops telling 53% of p10's file that unshipped hardware has shipped. | S | p10, p03, every late merchant |
| 3 | **D2/D3** | **Add a capability predicate to the QA gate**, and on a block route to a human instead of falling back to the WISMO floor. Kills 13 of the 28 bin-grade drafts. A blank draft is safe; the floor is not. | M | all 10 |
| 4 | **G3** | **Seed ScriptVariants at onboarding.** Reconnects the measurement spine: outcome ledger, Script Performance, CSAT, reopen rate. Currently silently dead for every real merchant. | M | all 10 |
| 5 | **G1 + G2** | **Kill or redefine `deflectionPct`, and give `Merchant.baseline` a write path.** Four onboarding questions. Without a before-picture, a proof-only product cannot make its own argument. | S+M | all 10 |
| 6 | **B1/B3/B6** | **Make the helpdesks connect, and scream when they don't.** Bearer-secret auth mode for Gorgias; split space-separated Zendesk tags; invert `integrationHealth` so a never-connected merchant is the loudest alert. | M+S+S | p05, p06, p07, p10 |
| 7 | **A1** | **Capture the disclosed ETA** (one wizard field, bulk-write at import). Unblanks the evidence pack's best exhibit and the money-at-risk tile for all 48,180 orders. | M | all 10 |
| 8 | **E1** | **Deliver the announcement.** Post → email the cohort → email carries the status link. Ship unsubscribe/preferences with it (E7). The biggest single hole in the product. | L | all 10 |
| 9 | **D5** | **Make the day-stage ladder relative to the merchant's own window.** Un-collapses 118/136 tickets from `day-89`; repairs the forecast window and Script Performance for free. | M | all 10, existential for p10 |
| 10 | **H1/A7/A6** | **Give orders a campaign key and a real region.** The fields already exist and are already read; nobody writes them. Unlocks cohort-scoped announcements, queue filters and per-cohort bands. | M | p03, p04, p06, p08, p09 |

**Then, grouped (highest first within each):**

- **Day-0 data (A):** A8 block the wizard on `datelessRows` (a missed date column silently makes every clock in the product wrong) · A5 block on >10% unparseable money rows · A10 six per-path onboarding recipes · A4 persist add-on/shipping/tax columns (p02 and p04 understate revenue by ~60%) · A9 stop opening drafts with "Hi dana87," · A11 thread `now` through import.
- **Ingest (B):** B8 reject empty ticket bodies (an empty body infers `calm`/`other` and sorts a chargeback threat to the bottom) · B7 stop showing a false green on "helpdesk connected" · B11 surface the unmatched bucket with search-and-attach · B5 count and dead-letter the drop-at-edge discards · B4 strip Zendesk's name/date preamble · B10 stop picking `orders[0]` for a customer with two campaigns · B9 carry the real channel · B2 a real Help Scout adapter (L).
- **Queue (C):** C2 put `riskTopDriver` on the row (it is computed and thrown away) · C3 fix the +4 risk-score gap · C6 ask for the timezone (the SLA never fired once in 136 tickets) · C1 split the dashboard into open work vs 30-day outcomes · C4 filter chips · C5 bulk actions (L).
- **Drafting (D):** D1 enforce banned phrases in the lint, word-boundary plus a synonym class · D6 two overdue bands (email vs status page) · D7 tell the operator who wrote the draft · D4 playbook templates keyed by `(type, dayStage)` · per-type response contracts (6 of 27 refund tickets never mention the refund; 5 of those are chargeback threats) · an explicit known-unknowns list ("name the gap, never fill it") · a no-verbatim-blurb lint · route VIP/press out of the draft path entirely · D8 real write-back per vendor (L).
- **Announcements (E):** E4 one composer that moves the band and posts atomically · E6 a "last update: N days ago" nudge ("went dark" is the accusation in every persona) · E5 good news moves the band too · E2 cohort scoping · E3 a public-reply composer, then a public-thread object (L).
- **Money (F):** F3 rename "Send gift" today, deliver it properly next · F4 show gift cost and spend-to-date · F5 a refund path (a fast refund is cheaper than a chargeback and carries no network penalty) · F6 make `disclosedEta` an append-only history, not one field.
- **Proof (G):** G4 one decimal on `wismoPer100Orders` · G5 derive the forecast window from the merchant's own wait · G7 **the printable 30-day report — this is the renewal artifact** · G6 Script Performance (free once D5 lands) · G8 move CSAT into the service layer.
- **Platform (I):** I4 make the setup checklist the day-0 home screen and make it truthful · I3 rename or dispatch "Escalate" (25 escalations, 14 on chargeback threats, nobody was told) · I2 an address field and an address-change ticket type · I1 thread `now` through `ingestTicket` · I5 stop showing the customer a raw enum.

---

## 8. THE DECISIONS DYLAN OWNS

**D1 — Price. Do we hold $749, or collapse to one $299 tier now?**
*Recommend:* **one tier, $299, until the adapters and the proof layer ship.** $749 is earned in production today by two of ten, and both are big-CSV crowdfunders. That is a two-customer TAM at the top tier.
*Cost of being wrong:* if you hold $749 you close almost nobody and burn the four best-economics logos on a broken install. If you drop to $299 and the fixes land fast, you have anchored low and re-pricing a live base is painful, but it is a fixable problem and the other one is not.

**D2 — ICP for the next 30 days. Crowdfunding CSV only, or chase preorder DTC on helpdesks?**
*Recommend:* **crowdfunding CSV only** (p01-p04, p08, p09). It is the path that actually works end to end today. Do not take a Gorgias/Zendesk/Help Scout merchant until B1/B3/B6/B2 land.
*Cost of being wrong:* the helpdesk personas are the higher ARPU and the real card-payment chargeback exposure, so you are deferring the best revenue. But selling into them today ships a product that fails **silently** — the worst possible first impression, and the one you never get a chance to explain.

**D3 — The truth gate. Do we accept a lower draft coverage in exchange for never fabricating?**
*Recommend:* **yes. Add a capability predicate, and produce NO draft** for address / payment / customs / VIP / press. Coverage drops (those are 33 of 136 tickets), send-as-is rate goes up.
*Cost of being wrong:* if you leave it as-is, the failure is not "a bad draft." It is a merchant on written record promising a customer something we know they cannot deliver, in a document that later becomes chargeback evidence pointing the wrong way. That is a lawsuit-shaped risk, not a churn-shaped one.

**D4 — Outbound delivery. Do we become a comms layer (email the cohort, push the status link) or stay a drafting tool?**
*Recommend:* **build it.** Every persona's playbook ends in "push the link to the cohort," and that half does not exist. Without it we are a faster way to type, and typing is not what they are afraid of.
*Cost of being wrong:* it is an L, it drags in CAN-SPAM/GDPR/unsubscribe, and it puts us on the hook for deliverability. If you skip it, the merchant keeps posting on Kickstarter by hand, which is what they did before they paid us, and the renewal question answers itself.

**D5 — Ship or hold. Do we put a paying merchant on this now?**
*Recommend:* **hold on paid. Pilot free with five merchants immediately**, with one instrumented goal: **log `editedRatio`.** It is the input the entire value model swings on and we have zero observations of it. Take paid money once items 1-5 of the backlog are green.
*Cost of being wrong:* holding costs you weeks and revenue in a 90-day window. Shipping now costs you the five merchants who would have been your references, and their backers will assemble the evidence in public, in a comment thread, using screenshots of replies we wrote.

---

## 9. VERDICT

**Would these ten pay?** At $299, seven of them would find the math obvious and three would find it thin. But only six of the ten can physically connect, so the real answer today is: **six could pay, and two of those (p01, p08) shouldn't.**

**Would they renew?** On this build, no. Not because the drafts are bad (53% of WISMO replies ship as-is, and the best of them are genuinely good), but because on day 30 the dashboard shows them deflection 100%, $0 at risk, zero at-risk customers and "Not yet measured" on every baseline metric. **The product cannot show its own value to the person paying for it.** Meanwhile their backers are comparing screenshots and finding that the 61-day waiter was told "weeks 13-15" and the 96-day waiter was told "weeks 1-4."

**Would they refer?** p02, p04 and p09 might. p10 would refer us to her lawyer.

**The single highest-leverage fix:** **derive the production stage from the actual wait at draft time, with inclusive band boundaries and a real overrun stage.** It is one function. It repairs 55 of 136 drafts, it makes the confidence band a monotonic function of the wait (fixing the cohort inconsistency that turns our core promise into its opposite), and it stops us telling 4,758 people that hardware which does not exist yet has left the warehouse. Nothing else in this document buys as much per line of code.

Right now the case for Tideover is *"it drafts faster than you can."* The case against it is *"and 36% of what it drafts is wrong about the customer's own order."* Both are true, and only one of them gets repeated in a comment thread.
