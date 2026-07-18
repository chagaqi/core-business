# THE VOICE ENGINE — build direction for training Tideover's support voice into a top-1% de-escalator

**Status:** SPEC. No code in this document has been built. Nothing here modifies product code.
**Owner:** Dylan (voice, product calls) · Fable (architecture) · Sonnet (execution, Phases 0–1)
**Evidence base:** the 10-customer simulation (`docs/sim-2026-07-12/`) — 10 merchants, 48,180 orders, 136 tickets, 135 real LLM drafts through the real engine. **Every number sourced from the sim is SIMULATED.** Two independent analyses (`TEN-CUSTOMER-SIMULATION.md`, `SIMULATION-SECOND-READ.md`) converged; where they disagree on a rate, both are given.
**Doctrine constraints:** ADR-0002 (proof-only), ADR-0006 (eval harness), ADR-0014 (reply-QA gate), ADR-0018 (LLM drafting layer). `lib/engines/reassurance.ts` and `evals/` are untouchable by this work.

> ### ⚠️ STATE OF THE TREE — read this before planning off this doc
> This spec was researched against the engine as it stood on the morning of 2026-07-12. **While it was being written, a concurrent lane shipped a large part of what §4 and Phase 0/1 proposed.** As of the last check (`lib/drafting/`, 13:52):
>
> | Proposed here | Real status |
> |---|---|
> | Status board wired into the drafting prompt | ✅ **LANDED** — `LlmDrafter.ts` imports `getCurrentStatus` |
> | Capability manifest | ✅ **LANDED** — `lib/drafting/capabilities.ts`, `CAPABILITY_REGISTRY`, 8 keys |
> | Capability lint (blocks invented **actions**) | ✅ **LANDED** — `capabilityCommitment()`, wired into `llmDraftBlocked` |
> | Safe floor replacing the trapdoor floor | ✅ **LANDED** — `lib/drafting/safe-floor.ts` |
> | `merchant.banned` enforced post-generation | ✅ **LANDED** — `bannedPhraseIn()` |
> | Day-bands labelled INTERNAL in the prompt | ✅ **LANDED** — `LlmDrafter.ts:125` |
> | Band rendered as a **clause** not a noun phrase | ❌ **REMAINS** — `LlmDrafter.ts:124` still splices `verbatim: "${timeline.confidenceBand}"` |
> | Channel-aware overdue band | ❌ **REMAINS** — `lib/time.ts:153` still returns "see the update below" |
> | **Few-shot bank · CALM-9 rubric · the judge · the A/B** | ❌ **NOT STARTED — and this is the actual voice work** |
>
> **What this means for the plan:** Phase 0 and Phase 1 are ~80% done by someone else. The critical path is now **Phase 2** — the few-shot bank, the rubric, the judge, the A/B — which is the part that cannot be delegated and which nobody is building. §5 is re-baselined accordingly. Everything in §1, §2 and §3 stands unchanged; those sections were never about the plumbing.

---

## 0. THE BAR, AND WHY WE ARE NOT AT IT

### 0.1 What the product does today

135 of 136 replies in the sim were written by the model, in the merchant's voice, carrying the merchant's signoff, with **zero hard dates across 136 generations**. The proof-only doctrine survived contact with a live LLM 136 times. That is real and it is the foundation everything below is built on.

### 0.2 What it does that a top-1% de-escalator would never do

All SIMULATED, all from the 136-draft corpus:

| Defect | Rate | What it actually is |
|---|---|---|
| Stated the wrong physical fact about the customer's own order | **36%** (49–55 of 136) | The stage was stamped at import and never moved. Fluent, calm, in-voice, and wrong about the thing the customer asked about. |
| Would cause material harm if sent | **21%** (28 of 136) | 13 of the 28 are fabrications — invented duties, invented tracking, invented address updates. |
| Promised an action the product cannot perform | **5 drafts** | `Order` has no address field. Five replies say the address is updated. One went to a woman whose stated fear was the parcel reaching her ex. |
| Parroted 8+ consecutive words of a stage blurb | **57%** (78 of 136) | Lumen Field shipped the identical sentence to 13 of 15 backers who share one comment thread. |
| Opened with "I hear you." | **15 drafts across 8 merchants** | A potter, a machinist and two engineers, all opening the same way. |
| Chargeback-threat drafts that never mention the refund | **6 of 14** | Including the two highest-risk tickets in the corpus. Three of them *blessed* the chargeback. |
| Band spliced as a raw noun phrase | **24%** (32 of 136) | *"your mugs ships in weeks 1–3"* |
| "see the update below" — in an email, where there is nothing below | **12%** (16 of 136) | 11 of Foundry One's 15 replies. |
| Leaked internal day-bands to the customer | **8 drafts** | *"Burn-in (days 56–78)"* next to *"You are 72 days in."* That is a hard date by arithmetic. |
| VIP / press tickets handled as VIP | **0 of 7** | A reviewer with 90,000 subscribers got 50 words of burn-in blurb. |
| Send-as-is rate | **44%** (read 1) / **24%** (read 2) | The two analyses disagree on the number and agree on the verdict: plausible-but-mediocre, which is the churn zone. |

### 0.3 The one finding that decides the doctrine

I re-counted the corpus for this spec. Across the 30 hostile and chargeback-threat tickets, **8 of 30 (27%) name silence — not the wait — as the grievance, in the customer's own words** (SIMULATED, counted from `results.json`):

> *"It is not the wait, it is that nobody answers."* — p05
> *"No reply to my refund request either. That is what actually bothers me now. Not the book. The fact that nobody answers."* — p01
> *"Ten days. Nobody has answered a refund request. That is not a delay problem, that is a you problem."* — p07
> *"I have opened three tickets. None of them have been answered."* — p06

**We are not in the business of making people wait less. We are in the business of making the wait cost them less.** Every principle below follows from that sentence.

### 0.4 The bar

"The Swan of presale support." A reply is at the bar when **a backer would screenshot it approvingly into the Discord where they compare notes.** Today they screenshot our replies to compare bands and catch us. That distance is the whole project, and it is measurable — §3(c) turns it into a score.

---

## 1. THE VOICE DOCTRINE

Twelve principles. Each carries its evidence and a DO/DON'T pair written for one running case:

> **THE RUNNING CASE.** Backer, day 74. Told 8 weeks at pledge. No word since a delay post 11 days ago. Writes: *"Still nothing? At what point does this stop being a delay and start being a pattern?"*

---

### P1 — ANSWER THE SENTENCE THEY ACTUALLY WROTE

**The principle.** The first sentence of the reply must prove you read theirs. Not the ticket type. The sentence.

**The evidence.** Procedural justice research finds *voice* — the sense of having been heard by the decision-maker — is one of four pillars determining whether people accept an unfavourable outcome ([Tyler; Oxford Bibliographies](https://www.oxfordbibliographies.com/display/document/obo-9780195396607/obo-9780195396607-0241.xml)). Motivational Interviewing's *reflective listening* and DBT's Level 2 validation (*accurate reflection*) both make the same move ([SAMHSA TIP 35, Ch.3](https://www.ncbi.nlm.nih.gov/books/NBK571068/); [Linehan's six levels](https://www.turnthemind.com/blog/6-levels-of-validation-dbt)). In our corpus, the specific-acknowledgment drafts are the three that ship as-is; the generic ones are the 21%.

**DON'T** — *"Hi Sam, thanks for reaching out about your order! Your order is currently in production."* (Answers a ticket type. He did not ask what stage it was in. He asked whether he is being managed.)

**DO** — *"Sam — you asked whether this is a delay or a pattern. It's the second one, and you were right to ask."*

---

### P2 — LABEL THE FEELING ONCE, AND GET IT RIGHT

**The principle.** Name the feeling. Name it accurately. Name it **once**. Never claim to share it.

**The evidence.** Affect labeling — putting a feeling into words — measurably reduces amygdala response and limbic reactivity ([Lieberman et al., 2007, *Psychological Science*](https://journals.sagepub.com/doi/10.1111/j.1467-9280.2007.01916.x); [UCLA Health summary](https://www.uclahealth.org/news/release/putting-feelings-into-words-produces-therapeutic-effects-in-the-brain-ucla-neuroimaging-study-supports-ancient-buddhist-teachings)). It is the mechanism under FBI crisis negotiation's *emotion labeling*, one of the core active-listening skills in the Behavioral Change Stairway ([BCSM: active listening → empathy → rapport → influence → behavioural change](https://www.ems1.com/ems-training/articles/how-to-use-the-fbis-behavioral-change-stairway-model-to-influence-like-a-pro-c5W8CNGj5tuZZ0Av/)). The accuracy requirement is not decorative: a wrong label is worse than none, because it proves you were pattern-matching. And repetition converts a technique into a tell — which is exactly what "I hear you." became in 15 of our drafts.

**DON'T** — *"I hear you. I completely understand your frustration, and I know how frustrating this must be."* (Three labels, all generic, all wrong. He is not frustrated. He is deciding whether he was conned.)

**DO** — *"Eleven days of nothing after a delay post reads like a company that has stopped answering. I'd read it that way too."* (One label. The right one: not anger — suspicion of abandonment.)

---

### P3 — THE SILENCE IS THE WOUND, NOT THE WAIT

**The principle.** Treat the gap in communication as the primary injury and address it before the logistics.

**The evidence.** Maister's fifth proposition: **unexplained waits feel longer than explained waits**; his fourth: **uncertain waits feel longer than known, finite waits** ([Maister, *The Psychology of Waiting Lines*, 1985](https://www.columbia.edu/~ww2040/4615S13/Psychology_of_Waiting_Lines.pdf)). "Waiting in ignorance creates a feeling of powerlessness, which frequently results in visible irritation." Our own corpus says it in the customers' words: **27% of the hot tickets name silence, not lateness** (§0.3, SIMULATED). Crowdfunding practitioners converge: *"Delays alone won't break backer trust, but silence can"* ([Kickstarter, on communicating delays](https://updates.kickstarter.com/how-to-communicate-kickstarter-delays-without-losing-backer-trust/)).

**DON'T** — Lead with the stage blurb. (You have answered a question he stopped asking three weeks ago.)

**DO** — *"You wrote on the 3rd and again last week. Both landed here; neither got answered. That's the part I'd be angry about."* — then the logistics.

---

### P4 — A BAND IS AN INSTRUMENT, NOT A WEAKER DATE

**The principle.** The confidence band is not an apology for lacking a date. It is a **better** instrument than a date, and it must be spoken with that confidence. Never hedge it, never apologise for it, never soften it into vagueness.

**The evidence.** Uncertainty, not bad news, is the stressor. de Berker et al. found subjective stress, pupil diameter and skin conductance track *irreducible uncertainty*, and that "it's much worse not knowing you are going to get a shock than knowing you definitely will" ([*Nature Communications*, 2016](https://www.nature.com/articles/ncomms10996); [UCL summary](https://www.ucl.ac.uk/brain-sciences/news/2016/mar/uncertainty-can-cause-more-stress-inevitable-pain)). The utility industry has known the operational version for years: real-time estimated restoration times "set expectations and reduce uncertainty, which studies show can cut customer frustration nearly in half during extended outages" ([DataCapable](https://datacapable.com/insights/news/the-hidden-cost-of-downtime-why-outage-transparency-builds-trust/)) — and, importantly, that **1–2 updates beat 3–4**, because a shifting estimate re-injects the uncertainty it was meant to remove ([American Public Power Association](https://www.publicpower.org/periodical/article/public-power-utility-boosts-customer-satisfaction-and-trust-texting-about-outages)).

**The corollary that nearly killed us.** A band is only an instrument if it is *coherent across the cohort*. In the sim, `r(wait, band)` was negative or ~zero for **8 of 10 merchants**: p07 told a 61-day waiter "weeks 13–15" and a 96-day waiter "weeks 1–4." Those two people are in the same Discord. **An incoherent band is worse than no band**, because it converts proof-only from a promise into evidence that the creator is improvising. Cohort coherence is a guardrail (§4.5), not a nice-to-have.

**DON'T** — *"I can't really say for sure, but hopefully it should be soon, maybe a few more weeks?"* (Hedged into meaninglessness. He now knows less than before he wrote.)

**DO** — *"I won't give you a date. Dates are how you got here. What I will give you is the band I'd bet on: it ships in weeks 3–6, and if that moves, you'll hear it from me before you have to ask."*

---

### P5 — GIVE THE MECHANISM, NOT THE EMOTION OF THE MECHANISM

**The principle.** Explain the physical thing that is happening, in concrete nouns. The kiln. The mould. The container. Never "the process," "production," "our team is working hard."

**The evidence.** Organizational-justice research on *causal accounts*: an adequate explanation materially reduces retaliation and perceived unfairness ([Bies & Shapiro, 1987; Shaw, Wild & Colquitt, 2003 meta-analysis](https://www.terry.uga.edu/wp-content/uploads/ColquittScottRodellLongZapataConlonWesson_2013.pdf) — employees are ~43% less likely to retaliate after an adverse decision when given an adequate explanation). Maister's proposition 5 says the same from the queue side. And the corpus proves it: the single best draft in 136 is the one that explains that **one in eight pieces doesn't survive a kiln run**, which is why a kiln load never ships at once. That sentence does more de-escalation work than every empathy phrase in the corpus combined.

**Cadence note (Bob Ross).** What is transferable from Ross is not folksiness — it is that **he reassures about the process, never about the result.** He promises you the next brushstroke, not the finished painting. His grammar is short, present-tense, concrete, and predictable, and the predictability is the safety ([Twenty Thousand Hertz, "Happy Little Episode"](https://www.20k.org/episodes/happylittleepisode); [Stand & Deliver on Ross as communicator](https://www.stand-deliver.com/columns/communication/969-bob-ross-the-soothing-communicator.html)). Import the grammar. **Never import the persona** — see §1.13.

**DON'T** — *"Our production team is working around the clock to get your order to you as quickly as possible."* (Zero information. It is an emotional posture wearing a fact's clothes.)

**DO** — *"The re-cut moulds came off the tool shop floor last week. They go into a first-shot run before anything is packed, because a bad shot means a re-cut, and a re-cut is what put you at day 74."*

---

### P6 — ONE APOLOGY, WITH A HAND IN IT

**The principle.** Apologise **once**, in the active voice, with a name attached, and pair it with a repair. Then stop.

**The evidence.** Lewicki, Polin & Lount tested the six components of an apology and ranked them: **acknowledgment of responsibility is the most important component; offer of repair is second** ([*Negotiation and Conflict Management Research*, 2016](https://onlinelibrary.wiley.com/doi/abs/10.1111/ncmr.12073); [OSU summary](https://news.osu.edu/the-6-elements-of-an-effective-apology-according-to-science/)). Expression of regret is only tied for third — which is exactly the component "we apologize for any inconvenience" contains and the only one it contains. That phrase is a passive-voice non-apology with no subject, no fault and no repair ([Jason Fried, "How to say you're sorry"](https://medium.com/signal-v-noise/how-to-say-youre-sorry-1c3477c33c89)).

Two counterweights that both matter:
- **Over-apology costs you.** Excessive apologising reliably reduces perceived competence and credibility. A merchant who apologises four times in one email reads as someone who cannot fix it ([research summary](https://laylool.substack.com/p/your-apologies-are-costing-you-credibility)).
- **But the *superfluous* apology — for the circumstance, not the fault — is cheap and it works.** Brooks, Dai & Schweitzer: apologising for something you clearly did not cause ("I'm sorry about the rain") demonstrates empathic concern and measurably increases trust ([*Social Psychological and Personality Science*, 2014](https://journals.sagepub.com/doi/abs/10.1177/1948550613506122)). So: *"I'm sorry you've had to chase this"* is free and lands. *"We apologize for any inconvenience"* is not the same move and does not.

**DON'T** — *"We sincerely apologize for any inconvenience this delay may have caused. We apologize again for the wait and appreciate your patience."*

**DO** — *"I owe you an apology for the eleven days of silence — that one is mine, not the factory's. Here's what I'm doing about it: [the repair]."*

---

### P7 — NEVER BUY CALM WITH A PROMISE

**The principle.** The reply may **never** trade a future commitment for present calm. Not a date, not an action, not a capability. This is the proof-only doctrine expressed as a voice rule, and it outranks every other principle here.

**The evidence.** The *double deviation*: a failed recovery on top of the original failure is the event that produces revenge behaviour and relationship dissolution, and time alone does not heal it ([service-recovery literature](https://www.sciencedirect.com/science/article/abs/pii/S0022435913000237)). Every promise we cannot keep is a scheduled double deviation. The sim manufactured five of them in the address class alone, plus an invented DDP customs liability that would land an Australian backer a $600 bill **with our own email as his chargeback exhibit**. We did not prevent that dispute. We wrote the customer's evidence for him.

**DON'T** — *"I've noted your new address and updated it in our system."* (`Order` has no address field.) · *"Your tracking is generating."* (Nothing is in freight.) · *"Every unit ships DDP."* (We have no incoterms field.)

**DO** — *"I can't change an address from inside this system — that's a real limitation and I'd rather say so than tell you it's handled. What I can do is flag it to Nia directly, and she'll confirm to you before your parcel is packed."*

---

### P8 — HAND BACK THE CONTROLS

**The principle.** Every reply ends with a **real lever the customer can pull.** Not a sentiment. A lever: the status link, the refund, the choice to stay, the gift, a named human.

**The evidence.** Psychological reactance (Brehm): a threatened freedom produces an amalgam of anger and resistance; reactance is reduced by autonomy-supportive language and by explicitly restoring choice ([Frontiers review](https://www.frontiersin.org/journals/communication/articles/10.3389/fcomm.2019.00056/full)). Procedural justice's *voice* pillar is the same finding from the fairness side: people accept bad outcomes when they had standing in the process. Motivational Interviewing formalises it as *rolling with resistance* and *supporting self-efficacy* — you never argue someone out of leaving; you make leaving an option they were free to take, and most of them don't.

**The corpus proof.** The single highest-value clause in 136 drafts is *"If you still want a refund, I'll process it — just say the word."* Only **8 of 14** chargeback-threat drafts contained it. The six that didn't are the ones that lose the dispute. And the one reply that saved a wobbling backer ended: *"If you decide to pull your pledge, we'll understand."* He replied: *"You answered, you were specific, and you did not get defensive. I am staying in."*

**DON'T** — *"We hope you'll continue to bear with us."* (No lever. A request for more of the thing he is out of.)

**DO** — *"Three things are yours to choose. You can watch it move yourself: [status link], updated when I update it, not when you ask. You can take the refund — say the word and it's done, no argument. Or you can stay, and I'll keep writing. All three are fine with me."*

---

### P9 — NAME THE GAP. NEVER FILL IT.

**The principle.** When we do not know something, say which thing we do not know, by name. The model may never generate a fact — it may only **re-say** one.

**The evidence.** The 21% harm class is almost entirely composed of fluent gap-filling: block numbers, batch positions, customs regimes, tracking states. All five of the "invented fact" drafts were **sycophantic confirmations of a number the customer supplied**. The prompt forbade inventing facts and the model invented facts, because a hole in the context is a vacuum and the model's job is to fill vacuums. The fix is not a better instruction. It is a **closed fact list** (§3a-L3) plus a rubric dimension that audits traceability (§3c-S3).

**DON'T** — *"You're in block 6, and block 6 has started dispatch."* (We have no block data. He told us the block number and we sold it back to him as confirmation.)

**DO** — *"You mentioned block 6. I want to be careful here: I don't have block-level data in front of me, so I'm not going to confirm or deny it. What I do have is [the status board fact], and that's the same thing everyone at your wait is being told."*

---

### P10 — BREVITY IS WARMTH. LENGTH IS DEFENCE.

**The principle.** 90–160 words. Mean sentence ≤ 18 words. **The sentence carrying the bad news is ≤ 12 words.** A long reply reads as a lawyer's reply.

**The evidence.** Over-apology and hedging reduce perceived competence (P6). Corporate deflection language is structurally *long* — passive constructions, nominalisations and qualifiers exist to absorb blame, and readers hear them doing it. Crisis negotiators slow down and shorten at the hard moment; they do not elaborate. Bob Ross's sentences are short, present-tense and concrete. The best draft in our corpus is ~120 words; the second-best is 60 (a machinist whose brand voice is blunt — so the floor is **merchant-dependent**, see §3a-L2).

**DON'T** — a 300-word reply with four apologies, three hedges and a paragraph of context nobody asked for.

**DO** — Cut every sentence that exists to make *us* feel better. Then read it aloud. If a sentence sounds like it is protecting someone, delete it.

---

### P11 — ONE VOICE, NEVER A FORM LETTER

**The principle.** **Facts must be identical across a cohort. Sentences must not be.** Two backers with the same wait must receive the same *truth* and never the same *paragraph*.

**The evidence.** This is the failure that kills the product in public. Lumen Field put *"This is the stage that is most likely to move, and it is the stage that moved"* in **13 of 15 replies** to an 18,400-person cohort that shares one comment thread. 57% of all drafts parrot 8+ consecutive words of a stage blurb. Per draft, the operator sees nothing wrong. **Backers paste replies into Discord.** The moment two of them compare, the entire promise — *this reads like a person who is actually there* — dies at cohort level, and it dies for every backer at once. Procedural justice's *neutrality* pillar breaks the other way too: the same cohort must not get *different facts* (see P4's corollary). Both halves are enforced mechanically in §3c-S8 and §4.5.

**DON'T** — one blurb, mail-merged.

**DO** — 5 authored variants per production stage, rotated; plus a hard n-gram check that no two replies in the same (merchant, 30-day window) share an 8-word span.

---

### P12 — SIGN IT WITH AN "I"

**The principle.** A named human takes the sentence. "I" wherever the merchant is one person; "we" only where a team genuinely acted. Never "the team", "our support staff", "the relevant department".

**The evidence.** Personal accountability is the difference between an apology and a press release — "an 'I' apology is a lot stronger than a 'we' apology" ([Spur, on why the stock phrase fails](https://www.spurnow.com/en/blogs/sorry-for-the-inconvenience)). The therapeutic-alliance literature is the deep version: the alliance itself — the felt bond and shared purpose between two named people — is one of the most robust predictors of outcome across 295 studies and 30,000 patients ([Flückiger et al., 2018, *Psychotherapy*](https://www.societyforpsychotherapy.org/wp-content/uploads/2018/10/Fluckiger-et-al-2018-Alliance-MA-Online.pdf)). DBT's Level 6, *radical genuineness*, is the same instruction: respond as a person, to a person, as equals — not as a handler managing a case ([Linehan](https://www.turnthemind.com/blog/6-levels-of-validation-dbt)). The sim already proves the mechanism works: **136 of 136 replies carried the merchant's verbatim signoff, and voice fidelity is the engine's one unambiguous win.** We are not adding this. We are protecting it.

**DON'T** — *"Our team will be in touch."*

**DO** — *"— Nia, Foldwork Press"* and, above it, a sentence only Nia would write.

---

### 1.13 — STYLE EXEMPLARS: PATTERNS, NOT COSTUMES

A hard rule before this section is read: **we extract cadence, grammar and move-order. We never import vocabulary or persona.** A folksy line in a chargeback thread from someone who is $974 down reads as mockery. The merchant's voice is the *only* voice in the reply. These exemplars shape the **skeleton**, never the skin.

| Exemplar | What actually makes them calm | What we take |
|---|---|---|
| **Bob Ross** | Near-whisper, unhurried, present tense, concrete nouns, and a *pre-normalised failure* ("happy accidents"). He reassures about the **process**, never the **result**. His predictability is the safety mechanism. ([20k Hz](https://www.20k.org/episodes/happylittleepisode)) | Short present-tense declaratives. Concrete objects. Reassure the process, never the outcome. Predictable structure across replies (P11 applies to *sentences*, not to *shape* — the shape should be stable). |
| **Crisis negotiators (Noesner / Voss)** | The stairway is sequential and you cannot skip a step: active listening → empathy → rapport → influence → change. Emotion labeling ("It sounds like…"). The *accusation audit*: say their worst accusation out loud, in your own words, **before they do**. ([BCSM](https://www.ems1.com/ems-training/articles/how-to-use-the-fbis-behavioral-change-stairway-model-to-influence-like-a-pro-c5W8CNGj5tuZZ0Av/)) | The move order in §2 **is** the stairway. And the accusation audit is the single most transferable technique into a chargeback threat — see archetype D. |
| **Mister Rogers** | Plain vocabulary. Names the feeling in the listener's own words, without euphemism, and then *stays*. | No euphemism. "Late" not "experiencing a timeline adjustment." Never leave the sentence before the feeling has been named. |
| **Best-in-class outage comms (utilities)** | An ETR even when imperfect; the mechanism; the time of the next update; the one thing you can do now. And **1–2 updates, not 4** — over-updating re-injects uncertainty. ([APPA](https://www.publicpower.org/periodical/article/public-power-utility-boosts-customer-satisfaction-and-trust-texting-about-outages)) | The four-part payload: band + mechanism + next-update commitment + lever. And restraint about update frequency — this constrains the announcement engine, not just the reply. |
| **The delay letters that work** | Fault in the first sentence, active voice, a name attached, a repair offered before it is demanded. | P1, P6, P8, P12. |

---

## 2. THE REPLY ARCHITECTURE

### 2.1 The seven moves

Every reply is built from these. **The moves are fixed; their order is archetype-dependent.**

| # | Move | What it is | Hard constraint |
|---|---|---|---|
| **M1** | **ANCHOR** | Name the specific thing they wrote. Quote their concrete detail back. | ≤ 1 sentence. Must contain a noun that appears in *their* message. |
| **M2** | **LABEL** | Name the feeling, once, accurately, without claiming to share it. | ≤ 1 sentence. Exactly one feeling-word. Never "I hear you", never "I understand your frustration". |
| **M3** | **GROUND** | The physical truth, from the status board. What is happening to their thing, right now, in concrete nouns. | **Every clause traceable to the closed fact list (§3a-L3).** Zero inference. |
| **M4** | **BAND** | The confidence band, rendered as a grammatical clause in the merchant's voice. | The band is passed as a *clause*, never a noun phrase. Never hedged. Never apologised for. |
| **M5** | **OWN** | The apology — only where there is something to own. Responsibility + repair. | **At most one apology in the reply.** Active voice. Must be paired with a concrete repair or omitted entirely. |
| **M6** | **LEVER** | Give control back. Status link + the archetype's mandatory lever (refund / choice / named human / gift). | **Mandatory. A reply with no lever fails the rubric outright.** |
| **M7** | **SIGN** | The merchant's signoff, verbatim. | Already 136/136. Do not regress it. |

**The default order (WISMO, calm):** M1 → M3 → M4 → M6 → M7. No label needed for a calm ticket; no apology where there is no fault. *Adding* moves is how you get a 300-word reply.

**The heat rule:** the hotter the ticket, the earlier the LEVER. A chargeback threat gets M6 before M3 — because the refund is the answer to the question he actually asked, and making him read three paragraphs of production detail to reach it is itself an insult.

**The proscribed move:** there is no "close" move. No "we hope this helps!", no "let us know if you have any other questions!", no "thanks for your patience". The lever is the close.

### 2.2 The forbidden lexicon (global — merges with `merchant.brand.banned`)

Blocked post-generation, word-boundary matched, synonym classes included:

- **Non-apologies:** `we apologize for any inconvenience` · `sorry for the inconvenience` · `any inconvenience caused` · `we regret any inconvenience`
- **Deflection:** `we are looking into it` · `we'll look into this` · `due to circumstances beyond our control` · `we value your business` · `at this time` (as an opener) · `rest assured` · `please bear with us`
- **Fake empathy:** `I hear you` (as an opener) · `we understand your frustration` · `I completely understand` · `I can only imagine`
- **Unbounded time words** (these are hard dates wearing a disguise): `as soon as possible` · `as soon as` · `shortly` · `soon` · `in the near future` · `imminently`
- **Gratitude for patience that was not given:** `thank you for your patience` · `your patience is appreciated`
- **Internal vocabulary:** `escalate` / `escalated to the relevant team` · raw enum keys · internal day-bands (`days 56-78`)
- **Channel leaks:** `see the update below` (in email)
- **Passive fault:** `mistakes were made` · `the order was not updated` · any agentless fault construction
- **Meta-narration:** any sentence referring to the system prompt, the model, or the rules (`I was instructed`, `we don't use that word`, `as an AI`). **This shipped, to a journalist, in the sim.**
- **The crutch word** (already banned repo-wide; the model must not use it *or narrate the ban*)
- **Any first-person claim of an action outside the capability manifest (§4.1).**

### 2.3 The eight archetypes, worked

Cell sizes are MEASURED in the sim corpus (136 tickets: wismo 76 / refund 27 / other 23 / deposit 10; calm 57 / anxious 49 / hostile 16 / chargeback-threat 14). All SIMULATED.

---

#### A · WISMO — CALM (41/136, the largest single cell)

**Real shape (p08):** *"Hi! No pressure at all, I know it is handmade. Just wondering roughly where in the process my mugs are."*

**What fails today:** the stage blurb, mail-merged, sometimes naming the wrong stage. This cell is where the form-letter defect concentrates, because it is the cell the operator waves through fastest.

**Moves:** M1 → M3 → M4 → M6 → M7. *No apology. No feeling-label.* Apologising to a calm customer manufactures a grievance he did not have.

**Model reply (Sunny, Marrow & Mould — 118 words):**
> Wes,
>
> No pressure taken — and "roughly where" is a fair question I can actually answer.
>
> Your mugs are in the bisque and glaze stage. They've been through the first firing; next is the glaze, then the glaze firing. About one in eight pieces doesn't survive a kiln run, and when that happens I remake it — which is why a kiln load never ships all at once.
>
> On timing, I won't give you a date, because I won't pretend to know what the kiln will do. What I'll give you is the band: it ships in weeks 1–3.
>
> You can watch it move without writing to me: [status link].
>
> — Sunny

**Forbidden here:** any apology; "thanks for your patience"; the word "unfortunately".

---

#### B · WISMO — ANXIOUS / HOSTILE (26 + 8 = 34/136) — *the running case*

**Real shape (p01):** *"So the answer is another delay. Cool. At what point does this stop being a delay and start being a pattern?"*

**What fails today:** the model reaches for "I hear you" and then delivers the same blurb it would have given the calm customer. It answers the question he asked three weeks ago.

**Moves:** M1 → M2 → **M5** → M3 → M4 → M6 → M7. The apology comes *before* the mechanism, because until the silence is owned he will not read the mechanism.

**Model reply (Nia, Foldwork Press — 141 words):**
> Sam,
>
> You asked whether this is a delay or a pattern. It's a pattern, and you were right to name it.
>
> Two slips, and eleven days of silence after the second one. The slips are the press. The silence is mine, and I'm not going to dress it up.
>
> Here's what's physically true today: your book is in binding and check. The signatures are folded and sewn, and I'm pulling a sample from every stack to check the offset. It's slow because I'm checking each one.
>
> No date — dates are how you got to day 74. The band I'd stand behind: it ships in weeks 3–6. If that moves, you'll hear it from me before you have to ask.
>
> And if you're done, say so and I'll refund you. No argument.
>
> [status link]
>
> — Nia, Foldwork Press

**Forbidden here:** two apologies; "I hear you"; any promise of a date; any defence of the slip.

---

#### C · REFUND DEMAND (27/136 — 9 anxious, 3 calm, 2 hostile, 13 already at chargeback threat)

**Real shape (p02):** *"Eight weeks becomes twelve, then it becomes a year. Refund my pledge and my add-ons."*

**What fails today:** **6 of 14 chargeback-threat drafts never mention the refund at all.** The engine sympathises beautifully and then fails to do the one thing that closes the ticket.

**Moves:** M1 → M2 → **M6 (the refund, immediately)** → M3 → M4 → M6b (the choice) → M7.

**The hard contract:** a refund-typed or chargeback-sentiment ticket **must** either offer the refund or state the refund policy in plain words. There is no third option. This is a rubric gate (§3c-S5), not a preference.

**Model reply (Priya & Sam, Lumen Field — 132 words):**
> Owen,
>
> "Eight weeks becomes a year" is the fear, and it's a reasonable one — you've watched it happen.
>
> So, first: **yes.** Reply to this and we refund the pledge and the add-ons. No form, no argument, no waiting on a manager.
>
> If you'd rather see what you'd be walking away from: your unit is in the tooling stage — the injection moulds for the joint housing. That is the stage that is most likely to move, and it is the stage that moved. We don't have a date that holds, so we won't give you one. The band is weeks 1–3.
>
> Either choice is fine with us. [status link]
>
> — Priya and Sam, Lumen Field

**Forbidden here:** making him ask twice; "we're sorry to hear you feel this way"; any sentence between the greeting and the refund offer that is longer than the label.

---

#### D · CHARGEBACK THREAT (14/136 — 13 of them refund-typed)

**Real shape (p10):** *"I have read the rule and I am building a case."* · **(p01):** *"I am giving you until Friday and then I am calling my card company. I have asked three times."*

**What fails today, and it is the worst thing in the corpus:** we replied to a man building a consumer-law case with *"the machine is now out of your regional warehouse"* — about a machine that does not exist. Elsewhere we wrote *"That's on us… If you want to escalate to a chargeback, that's your right"* — **a written admission of fault handed to the card issuer, plus an explicit invitation to dispute, with no refund offered.** That draft loses the chargeback.

**Moves:** M1 → **accusation audit** → M6 (refund, immediately) → M5 (own the specific miss, once, without a legal admission) → M3 → M4 → M7.

**The accusation audit** (from crisis negotiation): state his worst accusation, in your words, before he does. It is the fastest way to stop someone rehearsing an argument you have already made for them.

**The line we must never write again:** *"If you want to escalate to a chargeback, that's your right."* It is true, it is generous, and it is an exhibit. Replace with the **refund**, which is faster, cheaper and carries no network penalty.

**Model reply (Odette, Foundry One — 149 words):**
> Marc,
>
> You think we took $974, missed the window we sold you, and then went quiet. That is what the record looks like from where you sit, and I'm not going to argue with the record.
>
> The refund is yours. Reply with one word and it's processed today — you don't need your bank for this, and I'd rather you have your money back than spend six weeks getting it.
>
> If you want the position instead: no machine has shipped. Not yours, not anyone's. We're in [status-board headline], and I won't tell you a machine has left a warehouse when it hasn't — that's the sentence that got us here.
>
> Band: weeks 6–9, and it is a band, not a date.
>
> Everything we've told you, with dates, is here: [status link].
>
> — Odette, Foundry One

**Forbidden here:** the words "escalate", "dispute", "chargeback", "bank" — *unless the customer used them first* (in the sim we volunteered "bank" to a calm customer who never mentioned one). No admission of liability. No apology that reads as a legal concession. **And the evidence pack must be surfaced to the operator on this archetype, always.**

---

#### E · ADDRESS CHANGE (~8 tickets, 10 of 10 personas hit it — and the product has no address field)

**Real shape (p08):** *"I typed my old flat number at checkout. Can you fix it before it ships? I do not want it going to my ex."*

**What fails today:** **five replies promised the address was updated.** The most dangerous class of defect in the run — the model inventing an **action**. The prompt forbade inventing facts and said nothing about inventing actions.

**Moves:** M1 → M2 → **M-LIMIT (state the capability limit, plainly)** → M6 (the named human) → M3/M4 (brief) → M7.

**This archetype is capability-blocked. The correct behaviour is to say so.** The reply below is what a top-1% de-escalator writes when the system cannot do the thing — and it de-escalates *better* than the lie, because the customer is not stupid and the lie is discovered at the doorstep.

**Model reply (Sunny, Marrow & Mould — 96 words):**
> Ada,
>
> You don't want this going to your ex. That's the whole ticket, and it's the part I'm treating as urgent.
>
> I have to be straight about a limit: I can't change a delivery address from inside this system. I'd rather tell you that than tell you it's handled and have you find out at a doorstep.
>
> What I'm doing instead: I've written your name and this request down for the packing bench, and I will confirm the corrected address back to you in writing before your parcel is packed. Nothing ships until you've seen that confirmation.
>
> — Sunny
>
> *(Reply with the new flat number and I'll read it myself.)*

**Forbidden here:** `updated` · `noted` · `changed` · `confirmed` · `corrected` · `switched` · `on file` — anywhere near `address`. Enforced by the capability lint (§4.2), not by hope.

---

#### F · VIP / PUBLIC ESCALATION (7 tickets — **0 handled as VIP**)

**Real shape (p06):** *"This is the reviewer you promised an early unit to. My video slot is in two weeks. What do I tell 90,000 subscribers?"*

**What fails today:** he got 50 words of burn-in blurb. **He makes a video about that.** This is the highest-blast-radius ticket in the product and it currently sorts like a WISMO.

**The decision: this archetype does not get an auto-draft. It gets a *briefing*.** The customer's question ("what do I tell 90,000 people") is a question only the founder can answer, and any model answer is a press release written by a machine. What the model produces is an **operator briefing** — the facts, the stakes, the three things not to say — plus a *starting* draft the founder is expected to rewrite.

**Moves (for the draft the founder edits):** M1 → **the ask, answered directly** → M3 → M4 → M6 (a real, specific concession: a unit, a call, a date-free exclusive) → M7.

**Model draft (Camille, Vantage Audio — 118 words, flagged NEEDS FOUNDER):**
> Marcus,
>
> You need something to tell 90,000 people in two weeks, and "it's coming" is not that. Fair.
>
> Straight answer: I can't get a reviewer unit into your hands inside your slot, and I'm not going to promise one and miss it on camera.
>
> What I can offer, and you can take any of it: the actual production position on the record and quotable — [status-board headline], band weeks 6–9. A call with me, on the record, about why the burn-in stage moved. Or your unit first out of the first shipped run, before backer order, and I'll say that publicly so nobody accuses you of a favour.
>
> Your call. I'll work to your deadline, not mine.
>
> — Camille

**Forbidden here:** a blurb. Boilerplate. Anything that reads as PR. **And the ticket must be routed to a human before send — always, regardless of score.**

---

#### G · DELAY-WAVE / SILENCE-AFTER-UPDATE (the post-announcement inbox)

**Real shapes:** *"So the answer is another delay. Cool."* (hostile) · *"Saw the update, thanks. Thanks for actually explaining what happened with the press. I would rather have that than a fake date."* (calm — **and this one is a trap**)

**Two sub-cases, and getting them backwards is how you lose a supporter:**

**G1 — The wave (hostile/anxious).** Every reply in a wave shares one set of facts and must share **zero sentences**. This is where P11 is load-bearing: these people are, by definition, all reading the same announcement at the same time, in the same thread. Route: same as archetype B, but with the **cohort-coherence check enforced** (§4.5) — every backer in the affected scope must receive the *same band*, because they will compare.

**G2 — The thank-you (calm, post-update).** A backer who writes to say the update was good is the most valuable ticket in the queue and the easiest one to ruin. The correct reply is **short, un-defensive, and adds one thing.** Do not re-explain. Do not apologise. Do not sell.

**Model reply (Nia — 44 words. Yes, 44):**
> Bram,
>
> "Rather that than a fake date" — that's the whole policy, and it's good to know it lands.
>
> One thing the update didn't have room for: the reason the press slipped is [mechanism]. That's the part I'd want to know.
>
> — Nia

**Forbidden here:** the band (he didn't ask); an apology; the status link (he is not anxious — do not imply he should be); anything over 60 words.

---

#### H · ADD-ON / MONEY / CUSTOMS (deposit 10/136, plus the customs class)

**Real shapes:** *"I paid an extra $180 in the pledge manager for the wall mounts. Is that recorded anywhere?"* · *"Will I be charged import duty in Australia? Last campaign hit me with an $80 entry fee plus $600 of duty."* · *"My pledge manager total says 310 dollars but the confirmation email says 60. Which is real?"*

**What fails today:** the model **invented a DDP customs commitment** on the merchant's behalf. And it is structurally wrong about money: the importer detects add-on/shipping/tax columns and **discards them**, so a $60 pledge with $180 of add-ons imports as $60 — meaning the model is often looking at a number the customer knows is wrong.

**This archetype is capability-blocked on two axes** (incoterms; add-on totals) and must behave accordingly.

**Moves:** M1 → **the limit, stated first** → M6 (the human who can answer) → M7. Short.

**Model reply (Teodora, Brasslight — 89 words):**
> Jonas,
>
> Two numbers, $310 and $60, and you want to know which one is real. Reasonable.
>
> I'm not going to guess at that from here — the figure I can see is the core pledge, and I know that's not the whole story for anyone who used the pledge manager. Guessing at your money is worse than admitting I can't see it.
>
> I'm pulling your pledge-manager record myself and I'll write back with the actual breakdown, line by line, within this week's replies.
>
> — Teodora

**Forbidden here:** any claim about duties, VAT, DDP, DDU, customs, or import fees — **ever**, until a merchant incoterms field exists. Any confirmation of an add-on total the system does not hold. Enforced by the capability lint.

---

## 3. THE TRAINING PLAN

### 3(a) PROMPT ARCHITECTURE — five layers

Today's prompt (`lib/drafting/LlmDrafter.ts:50-87`) is a single flat block with four hard rules. It produced 0 hard dates in 136 (rule 1 works) and 21% harm (rules 2–4 do not). The replacement is layered so each layer is cacheable, testable and independently ownable.

```
L1  DOCTRINE          static, shared, ~900 tokens, prompt-cached
L2  MERCHANT VOICE    per-tenant, cached per merchant, ~200 tokens
L3  FACTS             per-ticket, THE CLOSED LIST — the only ground truth
L4  FEW-SHOT          3 retrieved exemplars by (archetype × heat), ~700 tokens
L5  TASK              the ticket, verbatim, sanitized
```

**L1 — DOCTRINE.** The 12 principles compiled into rules, plus the seven moves, plus the forbidden lexicon (§2.2), plus the archetype move-orders. Static across all tenants — so it is written once, reviewed by Dylan once, and prompt-cached forever. Never contains merchant data.

**L2 — MERCHANT VOICE.** `brand.voice`, `brand.tone[]`, `brand.banned[]`, `brand.signoff` — these already exist and **already do genuine work** (voice fidelity is the engine's one unambiguous win; signoff was correct 136/136). Add two fields:
- `brand.lengthFloor` — a machinist gets 60 words, a ceramicist gets 140. The 90–160 default is wrong for both. Derive from `tone` at onboarding; let the merchant override.
- `brand.fingerprint` — three lines mined from the merchant's *own* approved replies once we have ≥ 10 of them. Until then, empty. **Never invented.**

**L3 — FACTS: the closed list.** This is the layer that fixes 36% of the corpus, and it is the reason Phase 0 exists.

> **The rule: the model may never generate a fact. It may only re-say one.** Every physical claim in a reply must be traceable to exactly one of:

| Source | Where it comes from | Status (2026-07-12) |
|---|---|---|
| `status.headline` | `lib/status-board.ts` → `getCurrentStatus(merchantId, order)` | ✅ wired |
| `status.detail` | same | ✅ wired |
| `status.confidenceBand` (weeks) | same — hard-date-linted **on write**, rendered by `formatWeeksBand` | ✅ wired |
| `status.scope` | campaign / wave / region | ✅ wired |
| `timeline.daysInWait` | `lib/time.ts` | ✅ wired |
| `timeline.confidenceBand` | `lib/time.ts` — **must be a clause, not a spliced noun** | ⚠️ wired, **still spliced verbatim** (`LlmDrafter.ts:124`) |
| `order.disclosedEta` | what we told them on the day they paid | ❌ field exists, never populated |
| `merchant.stages[].blurb` | the plan, **explicitly labelled as the plan** | ✅ wired + labelled internal |
| **CAPABILITIES** | `CAPABILITY_REGISTRY` (§4.1) — what this product cannot do | ✅ **landed** (`lib/drafting/capabilities.ts`) |

Everything else the model wants to say is a hallucination by definition. The FACTS block is a fence, and the rubric's S3 dimension is the audit of that fence.

**The mechanical fixes that live in L3. Three of five have landed; two remain and are worth ~36% of the corpus between them:**
1. ❌ **Render the band as a clause.** `LlmDrafter.ts:124` still passes `Timing to give the buyer, verbatim: "${timeline.confidenceBand}"`. Result: *"your mugs ships in weeks 1–3"* — **24% of drafts, ungrammatical.** Pass a rendered clause the model can drop in whole. (`formatWeeksBand` already does this for the *status-board* band — the timeline band needs the same treatment.)
2. ❌ **Channel-aware overdue band.** `lib/time.ts:153` still returns `"running a little longer than planned — see the update below"`. In an email there is nothing below. **12% of drafts, and 11 of Foundry One's 15.** The band needs a channel argument. *(Note: `lib/time.ts` is adjacent to the untouchable engine — change the band's* consumers *or add a channel param; do not alter engine output, or the 55 goldens drift.)*
3. ✅ **Label the day-bands INTERNAL.** Landed — `LlmDrafter.ts:125` now says the day-bands are internal and must never be quoted.
4. ✅ **Enforce `merchant.banned` after generation.** Landed — `bannedPhraseIn()`, passed into `llmDraftBlocked`. **Still verify the synonym class**: p04 banned "on schedule" and the model produced "on track". A word-boundary list does not catch that; the lexicon needs synonym groups, not strings.
5. ✅ **Capability lint.** Landed — see §4.2.

**L4 — FEW-SHOT.** See 3(b).

**L5 — TASK.** The ticket, sanitized (`sanitizeInline` already handles prompt injection through `firstName`). Add the **archetype label** and the **heat level**, computed by the classifier we already have (`ticket.type` × `ticket.sentiment`), so the model knows which move-order to run.

---

### 3(b) THE FEW-SHOT BANK — 40 golds, and it is the part that cannot be delegated

**Composition:**

| Slice | Count | Purpose |
|---|---|---|
| 8 archetypes × 3 heat levels (calm / anxious / hot) | **24** | The core. One per cell the corpus actually produced. |
| Capability-blocked exemplars (address, customs, add-on totals, tracking, refund-processing) | **8** | The hardest and highest-value shapes: *how a great writer says "I can't."* These are what stop the 21%. |
| **Negative pairs** (a real bad draft → its corrected twin) | **8** | Free, and real: the 28 harm-class drafts in the sim corpus are already written. Do not invent bad examples — we have them. |

**Sourcing rule (non-negotiable).** Every gold is written **by us**, against the *ticket shapes* in `results.json` — never against a real customer's text, and never invented out of thin air. The sim's 136 ticket bodies are synthetic-but-grounded (built from real Reddit/Kickstarter/Shopify-Community voices), which makes them exactly the right stimulus and carries zero customer-data exposure. **No customer content, real or synthetic, ever enters the few-shot bank as an output exemplar.**

**Structure of a gold (replayable, not a text blob):**
```
{ archetype, heat, ticket:{subject, body}, facts:{...the exact L3 closed list...},
  reply, moves:["M1","M2","M5","M3","M4","M6","M7"], rationale, forbidden:[...] }
```
Carrying the `facts` object makes each gold **replayable**: a gold is a regression test, not a decoration. If the doctrine changes, you re-run the bank and see which golds the new prompt can no longer reproduce.

**Retrieval:** 3 exemplars per call, selected by exact `(archetype, heat)` match, falling back to same-archetype-adjacent-heat. Not semantic search — the cells are small and the routing is deterministic. ~700 tokens.

**Anti-mail-merge:** 5 authored blurb variants per production stage (the merchant writes 1 at onboarding; we generate 4 more *at onboarding time*, with the merchant approving them — never at draft time). Rotate by `hash(orderId) % 5`. This kills the 57% verbatim-parrot rate deterministically, without a model in the loop.

**Cost, stated plainly:** 40 golds × ~25 minutes of real thought = **~17 hours**. This is Dylan's voice and Fable's drafting. **A cheaper model cannot write this bank**, because the bank *is* the product's voice, and delegating it is delegating the thing customers are buying. Budget 2 days and do not compress them.

---

### 3(c) THE EVAL RUBRIC — **CALM-9**

Two halves, deliberately. **Half the rubric is deterministic and belongs in the lint** (fast, free, unit-testable, runs on every draft in production). **Half needs a judge** (slower, costs money, runs in the eval loop and on a sample in production).

#### The five hard gates — binary, any fail = draft blocked, no score

| Gate | Check | Where |
|---|---|---|
| **G1 · No hard date** | existing `llmDraftBlocked` (ADR-0014) + the fix to the `DAYS_WINDOW ∧ GUARANTEE_VERB` false positive that fires on the engine's own band | lint (exists, needs repair) |
| **G2 · No capability claim** | `capabilityLint(text)` against the manifest (§4.2) | lint (**new**) |
| **G3 · No ungrounded fact** | every physical claim traceable to the L3 closed list | **judged** (S3) — cannot be regexed |
| **G4 · No forbidden phrase** | global lexicon (§2.2) + `merchant.banned` + synonym class | lint (**new** — currently 0% enforced) |
| **G5 · Signoff verbatim** | exact string match | lint (**new**; already 136/136 in practice — pin it) |

**On any gate failure: route to a human with an empty draft and a reason. Do NOT fall back to the deterministic floor.** (§4.3 — the floor is a trapdoor.)

#### The nine scored dimensions — 0–3 each, 27 max

| # | Dimension | 0 | 3 | Scored by |
|---|---|---|---|---|
| **S1** | **Acknowledgment specificity** | generic ("thanks for reaching out") | quotes/names the concrete thing they wrote | judge |
| **S2** | **Feeling accuracy** | wrong feeling, or ≥2 labels, or "I hear you" | one label, correct, un-clichéd, not claiming to share it | judge |
| **S3** | **Truth grounding** | ≥1 claim not in the fact list | every physical clause traceable to a named source | **judge — this is the harm gate** |
| **S4** | **Band discipline** | band absent, hedged, or ungrammatical | present, grammatical, unhedged, consistent with the wait | **lint** (grammar + presence) + judge (hedging) |
| **S5** | **Control restoration** | no lever | the *right* lever for the archetype (refund ticket → refund offered or policy stated) | judge |
| **S6** | **Brevity** | outside `[lengthFloor, 200]` words, or mean sentence > 22 words | inside band; bad-news sentence ≤ 12 words | **lint** |
| **S7** | **Warmth without saccharine** | exclamation stacking, false intimacy, over-apology (≥2 apologies) | warm, adult, un-performed | judge |
| **S8** | **Non-formulaic** | shares an 8-word span with another reply in the same (merchant, 30d) window, or with a stage blurb | < 8-word overlap with everything | **lint** (n-gram, deterministic) |
| **S9** | **Voice fidelity** | reads like a support macro | reads like this specific merchant | judge (against `brand.fingerprint` + 2 of their own approved replies) |

**Thresholds:**
- **SHIP** — all 5 gates green **AND** total ≥ 22/27 **AND** S3 = 3 **AND** S5 ≥ 2. (S3 and S5 are non-substitutable: a beautiful reply that invents a fact, or a refund ticket that doesn't mention the refund, cannot pass on aggregate.)
- **NEEDS EDIT** — 16–21.
- **BIN** — < 16, or any gate red.

**Targets:** SHIP-rate **≥ 75%** (baseline 44% / 24%). Harm class **= 0 by construction** (G2 + G3 make it structurally unreachable, not statistically rare).

**The judge — and how not to fool ourselves with it:**
- **Different model family from the drafter.** The drafter is DeepSeek; the judge is Claude. Self-preference bias in LLM judges is well documented and a DeepSeek judge grading DeepSeek is a mirror.
- **Permutation averaging.** Rubric-based judges show position bias over score options and over criterion order; permutation-based calibration measurably improves human correlation ([Am I More Pointwise or Pairwise? Revealing Position Bias in Rubric-Based LLM-as-a-Judge](https://arxiv.org/abs/2602.02219)). Score each draft twice with the criterion order permuted; average. For A/B arms, use **pairwise** comparison (more stable than absolute scores) with the arm order shuffled on every call.
- **Human calibration is a gate, not a chore.** Dylan blind-scores 30 drafts. Compute chance-corrected agreement (Cohen's κ) against the judge on the SHIP/EDIT/BIN trichotomy. **If κ < 0.6, the judge's number is not allowed to gate anything** — we fix the rubric, not the engine. Re-calibrate monthly. ([Reliability without Validity — judge agreement/consistency/bias](https://arxiv.org/pdf/2606.19544))
- **Cost is not the constraint.** 136 drafts × 2 permutations × 4 arms ≈ 1,088 judge calls. That is pennies. The constraint is *trusting* the number.

---

### 3(d) THE A/B METHOD — the 136 tickets are the test set, and they are frozen

**The corpus is a gift: 136 tickets with 136 already-generated drafts.** A0 (the control arm) costs zero dollars because it already ran.

**Replay harness.** Each ticket replays as a deterministic tuple: `(ticket, order, customer, merchant, statusBoard, now)`. `results.json` has all of it. Two blockers, both known and both cheap: `ingestTicket` cannot take a `now` (I1/A11 in the backlog), and the harness had to monkey-patch `Date`. **Thread `now` before building the harness** — otherwise the A/B is not reproducible and every number it produces is decoration.

**The arms:**

| Arm | Contents | Question it answers |
|---|---|---|
| **A0** | today's engine (the 136 drafts already generated) | the control |
| **A1** | + L1 doctrine prompt | how much is the doctrine worth on its own? |
| **A2** | + L4 few-shot bank | how much is the voice bank worth? (this is the fine-tune-vs-prompt evidence) |
| **A3** | + L3 status board wired + capability manifest + rendered band + lint | the full stack — the shippable thing |

**Metrics per arm:** CALM-9 SHIP-rate · harm-class count (**must be 0 in A3**) · gate-block rate (by gate) · median words · **cohort self-similarity** (max n-gram overlap within a merchant) · p50/p90 latency · cost per draft.

**Blinding:** strip arm labels before judging; shuffle presentation order; run pairwise where possible.

**The human gate, and it outranks the judge:** Dylan blind-scores a random 30 across arms. **If Dylan and the judge disagree on SHIP/no-SHIP in more than 20% of cases, the judge is wrong and the rubric gets rewritten.** We do not ship a voice that a machine likes and Dylan doesn't.

**Statistical discipline (state this in the results doc, not in a footnote):** n=136 detects a ~15-point SHIP-rate move, not a 3-point one. Several cells are tiny (wismo × chargeback-threat = **1**). Report **per-cell**, and never claim a per-cell result from n<5. This is a proof-only product; the eval methodology gets the same standard as the customer-facing copy.

**The invariant that must not move:** the 55 goldens and the 57,614-assertion invariant sweep are the **deterministic** engine's contract. This work sits in the LLM path, *above* them. If a change makes them drift, the change touched `lib/engines/reassurance.ts` and it is out of scope — stop and escalate.

---

### 3(e) FINE-TUNE vs PROMPT — a decision, not a discussion

> **No fine-tune. Not now, not at 136 examples, and not at 1,000. Prompt + few-shot + best-of-N, and revisit in 2027 if — and only if — the conditions below are all true.**

**Why not, specifically:**

1. **We do not have the data, and the data we have is the wrong data.** A useful fine-tune wants ~1,000+ *approved, human-edited* (ticket → sent reply) pairs **per voice archetype**. We have 136 auto-approved drafts and **zero observations of an operator edit** — `editedRatio: 0` on all 136, because the harness is structurally incapable of emitting `approve-edited`. We would be fine-tuning on the output of the engine we are trying to replace.
2. **The failure mode is not fluency. It is grounding.** The 21% harm class is not "badly written" — it is **fluently, calmly, confidently wrong**. A fine-tune improves fluency. It would teach the model to be wrong *more persuasively*, which is the exact direction of the risk. Grounding is fixed by the FACTS fence and the capability manifest — plumbing, not weights.
3. **The voice is not stable yet.** We will rewrite this doctrine three times in 90 days. Every rewrite invalidates a fine-tune and costs another training run. Prompts are reversible in an afternoon; weights are not.
4. **Cost/latency don't bind.** Fine-tuning's real prize is dropping a ~2,500-token prompt. At 135 drafts per merchant-month on DeepSeek pricing that saving is a rounding error. It binds above ~200k drafts/month. We are four orders of magnitude away.

**What beats a fine-tune sooner, and is cheaper: best-of-N.** Generate 3 candidates, run all 3 through the mechanical lint (free), rank the survivors with a cheap judge, ship the best. That captures most of a fine-tune's quality gain at zero training cost and stays reversible. **Latency:** 3 parallel calls ≈ p90 3.6s → ~4.0s. That fits the 8s operator budget and **does not fit the 4.5s buyer-facing ingest budget** (`INGEST_DRAFT_TIMEOUT_MS`) — so best-of-N is **operator-path only**; ingest stays single-shot. Ship it in Phase 3.

**The conditions that flip the decision — all four, together:**
- ≥ **1,000 approved pairs with logged edit deltas**, in at least 3 voice archetypes; **and**
- the CALM-9 SHIP-rate has **plateaued below target across 3 prompt iterations** with the few-shot bank saturated (adding exemplars 11–20 gives no lift); **and**
- the doctrine has been **stable for 60 days**; **and**
- volume **> 50k drafts/month**, so the prompt-token saving is real money.

Realistically: **not in 2026.** Say so out loud so nobody re-opens it every sprint.

---

## 4. THE GUARDRAILS

**The governing sentence: a calmer voice must never buy calm with a promise we cannot keep.** Everything in this section is the machinery that makes that sentence true by construction rather than by instruction — because we already tried instruction, and instruction produced 21% harm.

### 4.1 The capability manifest — ✅ **LANDED. Verify it, don't rebuild it.**

A machine-readable, single-source-of-truth list of what Tideover **cannot** do. Its absence was the root of 13 of the 28 harm-class drafts. It now exists: `lib/drafting/capabilities.ts`, `CAPABILITY_REGISTRY`, eight keys —

`address-change` · `cancel-order` · `modify-order` · `refund` · `expedite` · `carrier-confirm` · `factory-contact` · `date-guarantee`

Each row carries `verbs` / `objects` / `participles` (what a *commitment* looks like), `requests` (what a *customer asking for it* looks like — used by the safe floor), `requires` (why it is on the list and not in the app), and **`insteadSay`** (the truthful sentence, injected into the system prompt verbatim). One definition feeds both consumers — the prompt and the lint — which is exactly the seam that stops them drifting apart. That is the right design.

**Three things this spec asks of it that need checking:**
1. **The gift discrepancy.** "Send gift" writes a tag and delivers nothing — 15 gifts "sent" in the sim, **0 received** — and the evidence pack then reports those phantom gestures inside a chargeback rebuttal **submitted to a card network**. Until the button is real, *offering a gift is a capability claim*, and it is not in the registry. Add it, or fix the button. **The manifest must describe the product as it is, not as the pricing page says it is.**
2. **Customs / duties / incoterms** is not in the registry, and the model **invented a DDP commitment** in the sim (an Australian backer, previously burned for $600 of duty). There is no incoterms field. Add a `customs-regime` key.
3. **Add-on totals** — the importer detects and *discards* add-on/shipping/tax columns, so the model is often looking at a number the customer knows is wrong. Add an `order-total` key, or the model will keep confirming figures it cannot see.

### 4.2 The capability lint — ✅ **LANDED**

`capabilityCommitment(text, enabled)` in `lib/drafting/capabilities.ts`, wired into `llmDraftBlocked` and surfacing as reason `capability:<key>`. It is negation-safe **by construction** (the auxiliary allowlist contains no "can't"/"cannot"/"unable"), which is the right way to build it — the truthful refusal (*"I can't change an address from here — I've flagged it to Nia and she'll confirm before your parcel is packed"*) passes, and is pinned by test.

**Two classes still missing, both from the harm corpus:**

| Class | Pattern | Why |
|---|---|---|
| **Sycophantic confirmation** | a **numeral present in the customer's message** and **absent from the fact list**, restated in the reply as fact | 5 harm drafts. *"You're in block 6, and block 6 has started dispatch."* We have no block data — he told us the number and we sold it back to him as confirmation. Trivially detectable: diff the reply's numerals against `facts ∪ ticket.body`. |
| **Meta-narration** | `as an AI\|language model\|system prompt\|I was (told\|instructed)\|we don't use that word` | This **shipped, to a journalist**: the model used the banned crutch word and then *narrated the rule about not using it*, in the customer-facing reply, to a reviewer with an audience. |

### 4.3 On block → a human, never the trapdoor floor — ✅ **MOSTLY LANDED**

`lib/drafting/safe-floor.ts` exists and its header quotes the exact failure it was built to prevent: the sim's one QA block shipped a floor draft that fabricated *"Your tracking is generating"*, fired a refund-save script at a calm customer (volunteering the word "bank" to someone who never mentioned one), and **never answered the address question at all**.

**What remains:**
- `DrafterOutput` should carry `blocked: LlmLintReason | null` and `blockedText` (retained server-side, never shown to the customer, **never logged alongside the ticket body**) — so the operator sees *what* was blocked and *why*, and so **we can measure gate precision instead of guessing at it**. In the sim we recovered the blocked text only by intercepting `fetch`; nothing downstream could distinguish "the QA gate blocked the model" from "the LLM was never configured."
- **The four seeded onboarding templates (`lib/onboarding.ts`) must claim nothing** — they are the merchant-authored floor and today `day-89` fires a refund-save script at a calm address change while `day-30` asserts *"Nothing has slipped"* to a merchant whose entire identity is that things slipped twice. Verify the safe floor supersedes them, or rewrite them.
- Repair the `DAYS_WINDOW ∧ GUARANTEE_VERB` false positive: `GUARANTEE_VERB` matches **"ships"** — which lives inside **our own confidence band** — so the rule is one co-fire away from blocking a correct draft, and it did exactly that once in 136.

### 4.4 Proof-only is not weakened by a warmer voice — it is the *reason* the voice works

P4 is the load-bearing link. The band is not a compromise we apologise for; it is the instrument that de Berker and Maister both say actually reduces the customer's stress. **The engine's own confidence band remains the only timing statement in any reply.** The model performs zero timeline arithmetic (it already doesn't — keep it that way). No new copy surface introduced by this work may state a number the product cannot measure.

### 4.5 Cohort coherence — the check nobody has built and everybody needs

**Two backers with the same wait and the same scope must receive the same facts.** No per-draft lint can see this; it is a property of the *set*.

Add a nightly (and pre-announcement) check: for each `(merchant, statusScope)`, across all orders with the same `daysInWait`, the variance of `confidenceBand` must be **0**. If it isn't, the merchant is told — loudly — before the cohort finds out in a Discord.

This is the check that converts P4 and P11 from prose into enforcement, and it is the exact failure that turned proof-only into its own refutation in the sim (a 61-day waiter told "weeks 13–15" and a 96-day waiter told "weeks 1–4", by the same merchant, in the same week).

---

## 5. BUILD DIRECTION

### Phase 0/1 — FINISH THE PLUMBING (≈ 2 days · Sonnet · **most of this shipped in a concurrent lane; do not rebuild it**)

Better prose over broken facts is just better-written falsehood. This phase is the fence, not the voice. **Already landed:** status board wired · capability registry · capability lint · safe floor · banned-phrase enforcement · day-bands labelled internal. **What is left:**

1. ❌ **Render the timeline band as a clause**, not a spliced noun phrase (`LlmDrafter.ts:124`) — **24% of drafts**, ungrammatical. *"your mugs ships in weeks 1–3."*
2. ❌ **Channel-aware overdue band** — kill "see the update below" in an email (`lib/time.ts:153`) — **12% of drafts**, 11 of Foundry One's 15. **Careful: `lib/time.ts` feeds the engine. Add a channel param at the consumer, or the 55 goldens drift.**
3. ❌ **Synonym classes in the banned lexicon** — p04 banned "on schedule" and got "on track". A string list cannot see that.
4. ❌ **Sycophantic-numeral check + meta-narration class** in the lint (§4.2) — 5 harm drafts and one leak to a journalist.
5. ❌ **Registry gaps:** `customs-regime`, `order-total`, and the gift (§4.1).
6. ❌ **`DrafterOutput.blocked` / `blockedText`** — without it we cannot measure gate precision, and we could not even *see* the blocked draft in the sim without intercepting `fetch`.
7. ❌ **L1 doctrine prompt** — the 12 principles, the 7 moves, the 8 archetype move-orders, the forbidden lexicon (§2.2).
8. ❌ **Per-archetype response contracts**, hard-coded rather than suggested: a refund/chargeback ticket **must** offer the refund or state the policy (6 of 14 didn't); a VIP/press ticket **never** auto-sends; an address/customs/add-on ticket states the limit.
9. ❌ **Repair the `DAYS_WINDOW ∧ GUARANTEE_VERB` false positive** — it matches "ships", from our own band.

**Done means:** the 136 replay shows 0 wrong-stage claims, 0 band-splice ungrammaticality, 0 "see the update below", 0 internal day-bands, 0 banned-phrase leaks, 0 capability claims. CALM-9 harm class = **0**. SHIP-rate ≥ 55%.

### Phase 2 — THE FEW-SHOT BANK + THE JUDGE (≈ 5–6 days · **THE CRITICAL PATH. Nobody is building this. Dylan's voice is the input, and it is the phase you cannot buy cheap.**)

12. The **40 golds** (§3b) — 2 days of Dylan + Fable, replayable, negative pairs from the real harm drafts.
13. The 5-variant blurb rotation, authored and merchant-approved at onboarding.
14. **CALM-9**: the mechanical half into the lint (unit-tested, runs in prod on every draft); the judged half behind a Claude judge with permutation averaging.
15. **Human calibration**: 30 blind-scored drafts, κ ≥ 0.6 or the judge gates nothing.
16. **The A/B**: A0 → A3 across the 136, blind, per-cell, with the MDE stated.

**Done means:** SHIP-rate **≥ 75%**, harm class = 0, cohort self-similarity < 8-word overlap, κ ≥ 0.6.

### Phase 3 — BEST-OF-N + THE VOICE FINGERPRINT (≈ 3–4 days)

17. **Best-of-3** on the operator path only (latency: ~4.0s, inside the 8s budget; **ingest stays single-shot** at 4.5s).
18. **`brand.fingerprint`** mined from the merchant's own ≥10 approved replies. Never invented.
19. **LOG THE EDIT DELTA.** From the first paid merchant: `editedRatio`, and the diff. Today the harness cannot even *emit* `approve-edited` — which is why the entire value model swings 10–14× on an input we have zero observations of.

**Done means:** SHIP-rate ≥ 85% on the 136. An edit-delta corpus that is growing.

### Phase 4 — THE MOAT (ongoing, and this is the answer to "what makes it defensible")

A prompt is not a moat. Anyone can write a good prompt, and by Q1 next year everyone will have.

**The moat is the edit-delta flywheel.** Every operator edit is a labeled pair: *the model's draft* → *what a human who knows this business actually said*, in a voice the model failed to hit, on a ticket shape nobody else has. Nobody else in this category has that corpus, because **nobody else is drafting in the merchant's own voice against a live production status board.** Competitors have generic support macros; we would have thousands of (draft → correction) pairs in the specific dialect of "the thing you make is late and the person who paid for it is scared."

That corpus does three things no prompt can:
- It writes the next doctrine revision for us — the edits *are* the diagnosis.
- It reopens the fine-tune question with an actual answer (§3e).
- It compounds. Every merchant-month makes the next merchant's first draft better, and none of it is copyable.

**Log it from the first paid merchant. It is free to collect and impossible to reconstruct later.**

### Cost, plainly

| | |
|---|---|
| **Engineering** | Phases 0–3 ≈ **13–16 working days** as originally scoped — but the concurrent lane has already spent most of Phase 0/1, so **the remaining path is ≈ 10–12 days**, of which **Phase 2 is the only part on the critical path** |
| **Model spend** | Negligible. 135 drafts cost cents at DeepSeek pricing; best-of-3 triples a rounding error; the full 4-arm A/B judged twice is ~1,088 calls. |
| **Dylan's time** | **2 days on the few-shot bank + ~3 hours of blind scoring.** This is the entire real cost, and it is the only part nobody else can buy. |
| **Risk** | The whole plan is reversible. No weights, no migrations, no schema change except the capability manifest and two `brand` fields. `lib/engines/reassurance.ts` and the eval harness are never touched. |

### What "surgically good" actually requires — the plain statement

Three things, and only three:

1. **The reply must be right about the customer's own order.** Everything else is decoration on a lie. That is the status board, wired (Phase 0).
2. **The reply must never promise what the product cannot do.** That is the capability manifest (Phase 1). It is the difference between churn-shaped risk and lawsuit-shaped risk.
3. **The reply must survive being screenshotted next to another customer's reply.** That is the few-shot bank, the blurb rotation, and the cohort-coherence check (Phases 2 + §4.5). It is the only one of the three that a competitor could not copy in a week, and it is where the moat actually lives.

The tone work — the labeling, the cadence, the accusation audit, the refusal to over-apologise — is what makes a reply *land*. But it is the third item that makes it a **product**, because a presale backer does not read one reply. He reads his, and then he reads six other people's in a Discord, and then he decides whether the person who took his money is telling the truth.

**That is the test we are training for. Not the reply. The thread.**

---

## 6. THE STRUNK LAYER — sentence mechanics, enforced (added 2026-07-16)

Dylan's directive: implement the rules of Strunk's *Elements of Style* as how the agent speaks. The right mental model: **Strunk is the grammar of calm; the doctrine above is its psychology.** P1–P12 decide what to say and in what order; Strunk governs how every sentence is built. Where they conflict, the doctrine is senior, and the capability lint is senior to both. We implement the *rules* in our own words with our own examples — the 1918 Strunk original is public domain, the later Strunk & White editions are not, and either way no book text enters the repo or the prompt: the model already knows the book; what it needs is the *contract*.

Enforcement takes the same three-layer shape as truth: prompt directives → a deterministic scorer (`lib/drafting/style-lint.ts` — **scores and flags, never blocks**; blocking on taste would push drafts to the deterministic floor and trade coverage for polish) → eval numbers. LEARN-1's edit corpus is the long-run judge of which rules merchants actually keep.

### 6.1 The ten rules, support-adapted

| # | Rule (adapted) | Support-reply application | Enforced by |
|---|---|---|---|
| S1 | Omit needless words | "due to the fact that" → "because" · "in order to" → "to" · "please be advised" → cut. **The acknowledgment (M2) is never needless** — cut filler, not feeling. | scorer + prompt |
| S2 | Active voice | "I posted an update Tuesday," never "an update was posted." Passive is tolerable only for external events with no known agent ("the shipment was held at the port") — never for our own actions or fault (§2.2's passive-fault ban stays a block). | scorer + prompt |
| S3 | Definite, specific, concrete | Concrete nouns from the closed fact list — proof-only's stylistic twin. "The frames are being anodized," not "things are progressing." | prompt (M3 mandates it) |
| S4 | Positive form | "Your order ships in weeks 9–11" over "we can't say exactly when." **The refusal discipline overrides:** when we do not know, P9 names the gap. Positive form never manufactures certainty. | prompt |
| S5 | One idea per sentence | No sentence over 30 words; mean ≤ 18 (P10); the bad-news sentence ≤ 12. Long sentences read as evasive. | scorer |
| S6 | Plain words | "use" not "utilize" · "help" not "assist"/"facilitate" · "start" not "commence." Band phrasing is exempt — `lib/time.ts` owns band wording. | scorer |
| S7 | Kill the qualifier leeches | very · quite · rather · really · fairly · extremely. Softeners doing de-escalation work ("just a heads-up") flag at low weight, not as errors. | scorer (low weight) |
| S8 | No stacked hedges | One hedge per reply, maximum. Two hedges in one sentence is a lawyer's sentence. | scorer |
| S9 | Paragraphs are units | One topic per paragraph; ≤ 3 sentences per paragraph in email. | scorer |
| S10 | End on the thing to remember | The last line before the signoff is the lever (M6). Strunk's emphatic-position rule and §2.1's no-close rule are the same instruction. | prompt (M6 mandates it) |

Ring order, for clarity: §2.2's forbidden lexicon **blocks**; the Strunk lists **score**. Nothing moves from the block ring to the score ring.

### 6.2 The scorer contract

`styleScore(text) → { score: 0–100, flags: [{rule, match, weight}] }` — deterministic, pure, no LLM call. Needless phrases and passive constructions weigh heavy; leeches weigh light. The score of every accepted draft is logged structurally (body never logged — the `llm_lint_reject` pattern) so LRN1's telemetry has a style channel the day it lands. Never a gate: a low-scoring draft still ships if the truth gates pass; the operator's edit (LEARN-1) is the vote on whether the style actually mattered.

### 6.3 What this is not

Not a rewrite pass (a one-shot "tighten" re-prompt below a score threshold is the v2 candidate), not a block, not a fine-tune, and never the book pasted into a prompt.

---

## SOURCES

**De-escalation & clinical**
- [Lieberman et al. (2007), *Putting Feelings Into Words: Affect Labeling Disrupts Amygdala Activity*, Psychological Science](https://journals.sagepub.com/doi/10.1111/j.1467-9280.2007.01916.x) · [UCLA Health summary](https://www.uclahealth.org/news/release/putting-feelings-into-words-produces-therapeutic-effects-in-the-brain-ucla-neuroimaging-study-supports-ancient-buddhist-teachings)
- [FBI Behavioral Change Stairway Model (Noesner / Voss) — active listening → empathy → rapport → influence → behavioural change](https://www.ems1.com/ems-training/articles/how-to-use-the-fbis-behavioral-change-stairway-model-to-influence-like-a-pro-c5W8CNGj5tuZZ0Av/) · [Behavioral Influence Stairway Model in crisis situations, *J. Behav. Ther. Exp. Psychiatry*](https://www.sciencedirect.com/science/article/abs/pii/S1359178919302150)
- [Motivational Interviewing (OARS, rolling with resistance) — SAMHSA TIP 35, Ch. 3](https://www.ncbi.nlm.nih.gov/books/NBK571068/) · [MI process meta-analysis](https://pmc.ncbi.nlm.nih.gov/articles/PMC5958907/)
- [Linehan's six levels of validation (DBT), incl. radical genuineness](https://www.turnthemind.com/blog/6-levels-of-validation-dbt)
- [Flückiger et al. (2018), *The Alliance in Adult Psychotherapy: A Meta-Analytic Synthesis* — 295 studies, 30,000 patients](https://www.societyforpsychotherapy.org/wp-content/uploads/2018/10/Fluckiger-et-al-2018-Alliance-MA-Online.pdf)
- [Brehm's psychological reactance & autonomy-supportive language — Frontiers review](https://www.frontiersin.org/journals/communication/articles/10.3389/fcomm.2019.00056/full)

**Apology, fairness, service recovery**
- [Lewicki, Polin & Lount (2016), *An Exploration of the Structure of Effective Apologies*, NCMR](https://onlinelibrary.wiley.com/doi/abs/10.1111/ncmr.12073) · [Ohio State summary](https://news.osu.edu/the-6-elements-of-an-effective-apology-according-to-science/)
- [Brooks, Dai & Schweitzer (2014), *I'm Sorry About the Rain! Superfluous Apologies Demonstrate Empathic Concern and Increase Trust*](https://journals.sagepub.com/doi/abs/10.1177/1948550613506122)
- [Tyler's procedural justice — voice, neutrality, respect, trustworthiness](https://www.oxfordbibliographies.com/display/document/obo-9780195396607/obo-9780195396607-0241.xml) · [Tyler, *Can the Police Enhance Their Legitimacy?*, Ill. L. Rev.](https://illinoislawreview.org/wp-content/uploads/2017/10/Tyler.pdf)
- [Colquitt et al., *Justice at the Millennium, a Decade Later* — meta-analytic test (explanations / causal accounts)](https://www.terry.uga.edu/wp-content/uploads/ColquittScottRodellLongZapataConlonWesson_2013.pdf)
- [Double deviation & customer revenge after a failed recovery, *J. Retailing*](https://www.sciencedirect.com/science/article/abs/pii/S0022435913000237)
- [Why "we apologize for any inconvenience" fails — Jason Fried](https://medium.com/signal-v-noise/how-to-say-youre-sorry-1c3477c33c89) · [passive-voice non-apology analysis](https://www.spurnow.com/en/blogs/sorry-for-the-inconvenience)
- [Over-apologising and perceived competence](https://laylool.substack.com/p/your-apologies-are-costing-you-credibility)

**The psychology of waiting**
- [Maister (1985), *The Psychology of Waiting Lines* — the eight propositions](https://www.columbia.edu/~ww2040/4615S13/Psychology_of_Waiting_Lines.pdf) · [40-year update, SSRN](https://papers.ssrn.com/sol3/papers.cfm?abstract_id=5669790)
- [de Berker et al. (2016), *Computations of uncertainty mediate acute stress responses in humans*, Nature Communications](https://www.nature.com/articles/ncomms10996) · [UCL summary](https://www.ucl.ac.uk/brain-sciences/news/2016/mar/uncertainty-can-cause-more-stress-inevitable-pain)
- [Utility outage comms: ETRs reduce frustration; over-updating re-injects uncertainty](https://www.publicpower.org/periodical/article/public-power-utility-boosts-customer-satisfaction-and-trust-texting-about-outages) · [outage transparency & trust](https://datacapable.com/insights/news/the-hidden-cost-of-downtime-why-outage-transparency-builds-trust/)
- [Kickstarter: communicating delays without losing backer trust — "delays alone won't break backer trust, but silence can"](https://updates.kickstarter.com/how-to-communicate-kickstarter-delays-without-losing-backer-trust/)

**Style exemplars**
- [Twenty Thousand Hertz, *Happy Little Episode* — the mechanics of Bob Ross's voice](https://www.20k.org/episodes/happylittleepisode) · [Bob Ross as communicator](https://www.stand-deliver.com/columns/communication/969-bob-ross-the-soothing-communicator.html)

**Eval methodology**
- [*Am I More Pointwise or Pairwise? Revealing Position Bias in Rubric-Based LLM-as-a-Judge*, arXiv 2602.02219](https://arxiv.org/abs/2602.02219)
- [*Reliability without Validity: A Systematic, Large-Scale Evaluation of LLM-as-a-Judge Models Across Agreement, Consistency, and Bias*, arXiv 2606.19544](https://arxiv.org/pdf/2606.19544)
- [A Systematic Study of Position Bias in LLM-as-a-Judge, ACL](https://aclanthology.org/2025.ijcnlp-long.18.pdf)

**Internal (SIMULATED)**
- `docs/sim-2026-07-12/TEN-CUSTOMER-SIMULATION.md` · `docs/sim-2026-07-12/SIMULATION-SECOND-READ.md` · `docs/sim-2026-07-12/results.json`
- Code: `lib/drafting/LlmDrafter.ts` · `lib/drafting/llm-lint.ts` · `lib/drafting/DeterministicDrafter.ts` · `lib/status-board.ts` · `lib/time.ts` · `lib/engines/reassurance.ts` (read-only) · `lib/types.ts`
