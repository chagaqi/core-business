# Cold Email System — AI UGC Ad-Creative Engine for DTC Functional Consumables
**Smartlead-ready · v2.0 (ship) · Founder: Chaga Chai**

> **Spine of the whole system:** We do not pitch the service. We earn the click with one true observation about the prospect's own account, then hand them a sample we already made of their own product as the payoff. The `{{hook}}` carries the email. The sample carries the credibility. The retainer is never mentioned until they reply.
>
> **What changed from v1.0 (skeptic teardown applied):**
> 1. **The `{{hook}}` truth now leads — the link comes after.** A skeptic clicks a stranger's link only after the stranger proves they looked at *his* business. Proof-of-research before proof-of-product.
> 2. **The proof-only credibility line lives in Email 1's body**, not deferred to a reply. I claim no ad track record (I have none) — so instead of pitching, the email *is* the built ad. The rendered sample of their own product does the work, in the email.
> 3. **The word "slop" is gone** except at most once. We were repeating the buyer's feared word and *claiming* the negative — which violates "show, don't claim." Replaced with positive concrete tells (mouth-sync, the pour shot).
> 4. **Connective-tissue scaffolding cut to ~one instance per sequence.** Em-dash cadence broken into operator-choppy fragments. The voice is one notch less polished on purpose.
> 5. **The blind paid head-to-head is promoted to the spine of Email 3** (Track 2) — it was the strongest credibility play in the system, buried in paragraph 3 where no one read it.
>
> **HARD PREREQUISITES before any send:** (1) For priority prospects, the rendered sample exists and `{{sampleLink}}` resolves. Per the locked rule: *do not send a cold email to a priority prospect without their sample in it.* (2) `{{hook}}` is hand-written, true, and specific per lead. A generic hook collapses the whole email to template.
>
> **PROOF STATE:** Zero case studies at launch. No fabricated numbers anywhere. `[CASE STUDY PLACEHOLDER: ...]` blocks mark where a real delta goes once a founding-partner pilot produces one. "Two founding slots left" is honest scarcity tied to the 5-brand cap.

---

## 0. Merge Tags & Lead-List Field Mapping

| Merge tag | Feeds from (lead-list column) | Notes / fallback |
|---|---|---|
| `{{firstName}}` | `first_name` | Founder/decision-maker first name. **Verify it's the decision-maker, not a generic info@.** If missing → **suppress from priority send** (do not fall back to "there"). |
| `{{brand}}` | `brand_name` | The DTC brand, e.g. "Cordyceps Co." |
| `{{product}}` | `product` | The specific hero SKU you rendered. **Write it lowercase, mid-sentence, natural** — "your lion's mane coffee," never the scraped title "Lion's Mane Cold Brew 12oz." A raw product-title pull *is* the slop you're claiming not to be. Hand-clean every priority lead. |
| `{{sampleLink}}` | `sample_url` | Unlisted Loom/hosted MP4 of the rendered ad of THEIR product. **Priority sends require this populated.** If blank → lead is non-priority, route out of this sequence (priority-first is the locked motion). |
| `{{hook}}` | `hook_observed` | One specific, **true** observation about their account/site — the ad they're running, a review theme, an AOV signal, the angle they over-rely on. **Hand-researched per priority lead. This is the line that earns the open-through and the click. If it's generic, kill the send.** Write it as a complete clause that reads naturally after a name + em-dash. |

**Supporting columns (routing / spintax, not merge tags):**
- `track` (`1` = Wounded Veteran / `2` = Volume-Lean) — routes the lead into the correct sequence.
- `spend_band`, `aov`, `team_size` — used to hand-write `{{hook}}` and pick the right SKU economics line.

> **The two fields that make or break this system are `{{hook}}` and a clean, natural `{{product}}`.** Both are hand-built per priority lead. They are also the two that degrade fastest at scale. Auto-generate either and you've built a well-organized slop machine. Get them right per-lead and the buyer clicks.
>
> **`{{hook}}` quality bar (must pass all three):** (1) It's *true* — verifiable from their public account/site. (2) It's *specific* — names the actual ad/angle/review/AOV, not "you're scaling on Meta." (3) It tells them something they *half-suspected and didn't want to say out loud.* If it fails any one, the lead is not priority-ready.

---

## 1. TRACK 1 — "Wounded Veteran" Sequence (Archetype A)

**Routing:** `track = 1`. 5–10yr operators gutted by the Feb-2025 Andromeda update.
**Voice rule for this track:** ENTER on recognition of the wound, then PIVOT FAST to the lever they couldn't pull alone (production capacity). Do **not** marinate in grief. Never say "volume is the answer." Reference Andromeda as shared context, never sold back as a hook.

---

### Email 1 — Primary (hook earns the click; sample is the payoff)
**Send:** Day 0
**Goal:** Open with the true observation, prove you looked, *then* reveal the sample. One ask: the click.

```
Subject: the angle {{brand}} is leaning on

{{firstName}} — {{hook}}. That's the angle I'd expect to fatigue
first.

So I rebuilt it. A 15-second UGC ad of {{product}}, rendered, not
a mockup: {{sampleLink}}

I'm not a tool vendor and I'm newer to this than the 10-year
agencies — so instead of pitching you, I just built the ad. That
render is the proof: a UGC spot of {{product}} from your own site
and reviews, not a mockup. So that's not "an AI ad." It's the ad
I'd run if {{brand}} were my account.

Watch the pour shot and the mouth-sync. If it holds up, that's the
only credential that matters here — hit reply and I'll send the
angles I'd test against it.

— Chaga
```

> **Single ask is the click.** The reply line is the *natural next step after the click*, not a second pitch — it only fires "if it holds up." Don't preview a three-step gauntlet.
>
> **Credibility source:** proof-only. No claimed ad track record — the rendered sample of their own product *is* the credential. The "newer than the 10-year agencies, so I just built the ad" framing carries the trust *in this email*, confidently and honestly, never apologetically.

---

### Email 2 — Bump
**Send:** Day 2
**Goal:** Resurface the sample. Reply-in-thread, no new pitch.

```
Subject: (re: the {{product}} ad)

Did the render come through? {{sampleLink}}

I lead with it instead of a deck for one reason. An ad of your own
product that holds up answers "is the AI any good" and "does this
guy know my brand" faster than a paragraph can.

15 seconds. Then tell me if I read the angle wrong.
```

> Note: the faux-reply `(re: ...)` subject is a known automation tell. It's retained here only because the sample genuinely *was* the subject of Email 1, so the thread is real, not faked. If your spam tests flag it, switch to a plain subject (`one more on the {{product}} ad`).

---

### Email 3 — Value (enter the wound, pivot immediately to the lever)
**Send:** Day 5
**Goal:** Name what broke. Pivot fast to the production-hands gap. Plant the mechanism. No grief marinade.

```
Subject: the part nobody fixes with targeting

{{firstName}} — context on why I built the {{product}} sample.

Sometime after mid-February last year, a creative that was carrying
the account stopped working. Same ad. Same audience. Double the
CPMs, no reason. The targeting fixes didn't touch it. They never
do. Targeting was never the problem.

Here's the part underneath. The auction now rewards whoever keeps
fresh, specific creative in front of the customer. You can't
produce at that rate by hand. That's not a strategy gap. It's a
production-hands gap, and it's the one lever you couldn't pull
alone.

So I pull it. 4 angles, 24 production-grade UGC variations every
2 weeks, launched and tagged in your own account. You greenlight
the angles and the claims. I produce, launch, read the data, kill
losers, double winners, reload. The volume isn't the point. It's
how the next winner gets found before the last one dies.

The {{product}} ad in the sample is one of those 24. Want to see
what a full cycle looks like on {{brand}}?
```

---

### Email 4 — Breakup
**Send:** Day 9
**Goal:** Permission to close the loop. ONE idea: I'll stop, here's the honest scarcity, door's open. Shortest email in the sequence.

```
Subject: closing your file, {{firstName}}

I'll stop here so I'm not another inbox you have to manage.

Sample stays live if it's useful later: {{sampleLink}}

I cap at 5 functional-consumables brands, so no account becomes
the deprioritized one. Two founding slots are open. Founding
partners get a full cycle at no cost; in return I get to publish
the before/after.

[CASE STUDY PLACEHOLDER: control hold-rate → winner hold-rate,
CPA flat, named founding partner — inserted once cycle 1 ships]

If the timing's wrong, no reply needed. If it's not, reply "show
me" and I'll walk you through a cycle.

— Chaga
```

> **Reframe applied:** "free work in exchange for the right to publish" (which framed the buyer as your case-study lab rat) is recut to *what they get* — "a full cycle at no cost" — with the publishing right stated as the honest trade, not the headline. Six ideas trimmed to three: I'll stop / cap + slots / door's open.

---

### Track 1 — A/B Subject Lines (5)
Test in Smartlead as subject variants on Email 1. Curiosity + specificity, low spam-trigger.

1. `the angle {{brand}} is leaning on`  *(default — pairs with the hook-first open)*
2. `your {{product}}, as a UGC ad (15 sec)`
3. `made you a {{product}} ad, {{firstName}}`
4. `built this before emailing you`
5. `same ad, double the CPMs, no reason`

> #5 names the Andromeda wound — highest risk/reward. **Cap at ~20% of the split**; it reads as a cold-read unless the list is tightly qualified. Lead the split with **#1 and #2** (specific, on-voice, low spam risk). Note #3 ("made you a...") only works if `{{product}}` is hand-cleaned to natural lowercase — pair it with a quality-checked sublist.

---

## 2. TRACK 2 — "Volume-Player / Lean-Team" Sequence (Archetypes B & C)

**Routing:** `track = 2`. Volume-Players ($200–500K/mo, testing ~90/wk) and Solo+Lean Teams (2–3 person — the dream client).
**Voice rule for this track:** NO grief. Lead with capacity math + workflow integration. Never say "the dashboard is lying to you" — they're winning. The deliverable is "one angle-family off your plate, end-to-end, handed back launched and tagged."

---

### Email 1 — Primary (hook earns the click; sample + capacity framing)
**Send:** Day 0

```
Subject: one angle-family off your plate

{{firstName}} — {{hook}}. The bottleneck there usually isn't
strategy. It's that briefing, producing, naming, uploading, and
structuring every new angle-family eats your ops people alive.

So I took it end-to-end and rendered one. A UGC ad of {{product}},
real, not a pitch: {{sampleLink}}

What I do: own one angle-family completely. Concept → 24 variations
→ launched and tagged in your taxonomy → read in your dashboard.
Not 24 files in a Drive folder. Launched.

That sample is one variation of one family. Watch the pour and the
mouth-sync. If it holds up, reply and I'll show you the family.

— Chaga
```

> Connective tissue is now one instance ("What I do:") instead of one per paragraph. The capacity logic leads; the sample is the proof, not the opener.

---

### Email 2 — Bump
**Send:** Day 2

```
Subject: (re: the {{product}} ad)

Did {{sampleLink}} open ok?

I send the render first because your team could license Arcads
tomorrow. The tool was never the bottleneck. The hours were. The
sample is what those hours produce when someone else owns them
end-to-end.

15 seconds, then I'll show you the cadence. 24 variations, every
2 weeks.
```

---

### Email 3 — Value (the blind paid head-to-head, led with)
**Send:** Day 5
**Goal:** Lead with the strongest credibility play in the whole system — the head-to-head. This is the line that says "I'll bet my judgment against your existing guy, in your real account." Promoted out of paragraph 3 into the spine.

```
Subject: my 4 angles vs your media buyer's 4

{{firstName}} — here's the trade I'd actually put money on.

A blind paid head-to-head. My 4 angles against your media buyer's
4. Same spend. Your account. Win once and we both know the angle
judgment isn't a coin flip. That's the thing ChatGPT can't do for
free — it writes a script, but it can't tell you which of 4 angles
leads for your AOV.

If that lands, here's the standing arrangement behind it. You keep
strategy and approvals. I own one angle-family completely. 4
hypothesis angles, 24 production-grade variations every 2 weeks,
launched and tagged in your naming convention and ad-set structure,
read against your metrics. Your 2 ops people get that throughput
back without you hiring a third.

Claims are gated to what you can substantiate before anything
renders, so nothing I ship puts your account at FTC or Meta risk.

Want me to map what one family would look like on {{brand}}?
```

---

### Email 4 — Breakup
**Send:** Day 9

```
Subject: last one, {{firstName}}

I'll close your file so I'm not noise in your day.

Sample stays live: {{sampleLink}}

I cap at 5 functional-consumables brands so the SLA never degrades
when I sign the next one. Two founding slots open. Month-to-month,
you keep every video, and the guarantee is in labor not cash: beat
your control's hold-rate while CPA holds flat in 30 days, or the
next 24-variation cycle is free.

[CASE STUDY PLACEHOLDER: founding-partner delta — control vs
winner hold-rate, CPA flat — inserted once first cycle ships]

Reply "send the cycle plan" and I'll get it to you. Otherwise,
all good.

— Chaga
```

---

### Track 2 — A/B Subject Lines (5)

1. `one angle-family off your plate`  *(default — clearest capacity hook)*
2. `a {{product}} ad, already off your plate`
3. `your ops team isn't slow. they're the production line.`
4. `24 variations / 2 weeks on {{brand}}`
5. `the hours were the bottleneck, not the tool`

> #3 is the sharpest capacity reframe for Archetype C (lean team) — felt pain, zero grief. Lead the split with **#1 and #2** (lowest spam risk, clearest curiosity). #5 is a strong follow-on variant.

---

## 3. LinkedIn / X DM Variant (the opener, shortened)

Same spine — hook-first, sample as payoff, one ask — compressed for a DM. No subject line. The sample carries the credibility; the full proof-only credibility line and the 4×24 mechanism wait for the reply.

**LinkedIn (connection note → first message):**

*Connection note (≤300 char):*
```
{{firstName}} — made a 15-sec UGC ad of {{product}} after looking
at {{brand}}'s account. Sending it once we connect. Not a pitch.
```

*First message after accept (Track 1 flavor):*
```
{{firstName}} — {{hook}}. So I rebuilt that angle as a 15-sec UGC
ad of {{product}}: {{sampleLink}}

I'm newer to this than the 10-year agencies, so instead of
pitching I just built the ad — from your own site and reviews.
That render is the only credential that matters. Not "an AI ad."

Watch the pour shot. If it holds up, I'll send the 3 angles I'd
test against it.
```

*First message after accept (Track 2 flavor):*
```
{{firstName}} — {{hook}}. So I took that angle-family end-to-end
and rendered one: {{sampleLink}}

24 variations / 2 weeks, launched and tagged in your account, not
files in a folder. This is one variation of one family.

Worth 15 sec?
```

**X / Twitter DM (tightest):**
```
{{firstName}} — {{hook}}, so I rebuilt that angle as a UGC ad of
{{product}}: {{sampleLink}}

Watch the mouth-sync. If it holds up I'll send the 3 angles I'd
test against it. 15 sec.
```

> **DM rule:** lead with the hook, one link, one ask, zero credentials dump. Even in a DM the true observation precedes the link — the click is earned the same way. Save the full proof-only credibility line and the 4×24 mechanism for the reply.

---

## 4. Deliverability Notes

**Domain & infrastructure**
- Send from a **separate cold-outreach domain**, never the primary brand/root domain (e.g. `try-chagachai.com`, `chagachai-team.com`). Protects the root domain's reputation.
- 1–2 inboxes per domain, 2–3 domains to start. Spread volume; never concentrate.
- Full auth before any send: **SPF, DKIM, DMARC** all passing. Custom tracking domain (or **tracking OFF** — see below).

**Warmup**
- **2–3 weeks of warmup per inbox before real sends** (Smartlead warmup or equivalent). Do not skip.
- Keep warmup running in the background even during live campaigns — it sustains reputation.

**Volume ramp (per inbox)**
- Week 1: ~10–15/day · Week 2: ~20 · Week 3: ~30 · steady-state ceiling **~30–40/day/inbox**. Never spike.
- Scale total volume by adding **inboxes**, not by raising per-inbox volume.
- Send on a human schedule (business hours in the prospect's timezone, M–F), randomized intervals.

**Tracking**
- **Turn OFF open-tracking pixels** for this system. They depress deliverability, and the sequences are short enough that reply-rate is the only metric that matters. Track **clicks on `{{sampleLink}}`** via the link host (Loom views / hosting analytics), not via Smartlead's pixel.
- Keeps emails closer to genuine plain-text 1:1 mail, which is the whole aesthetic here.

**Format**
- **Plain text only.** No HTML templates, no embedded images, no logos, no signature graphics. One link (`{{sampleLink}}`), occasionally two. Multiple links + images = spam folder.
- Mobile-skimmable: short lines, generous breaks, one idea per paragraph (as written above). The buyer reads on a phone with a thumb on archive — write for that.
- Plain-text signature: name only ("— Chaga"). No legal blocks, no social-icon bars.

**Spintax (rotate to avoid identical-fingerprint sends)**
Apply Smartlead spintax to openers, connectors, and CTAs so no two emails are byte-identical. Keep every variant semantically identical, equally on-voice, and equally choppy — never let a variant drift into hype or into smoother "copywriter" cadence.
- Opener (after the hook): `{So I rebuilt it.|So I rebuilt that angle.|So I took it and rendered one.}`
- Bump open: `{Did the render come through?|Did {{sampleLink}} open ok?|Catch the render?}`
- CTA: `{If it holds up, reply|Worth a look? Reply|If it looks like something you'd run, reply}`
- Positive-tell rotation (replaces any "slop" language): `{Watch the pour shot.|Watch the mouth-sync.|Watch the pour and the mouth-sync.}`
- `{{firstName}}` missing → **suppress the lead from priority send**; do not spin to "there."

**Spam-trigger words to AVOID** (filters + voice alignment)
- Money/urgency: `free` (in subject), `guarantee` (in subject), `$$$`, `cheap`, `discount`, `limited time`, `act now`, `urgent`, `risk-free`, `100%`, `cash`, `earn`, `income`.
- Hype (also voice-banned): `revolutionary`, `game-changing`, `cutting-edge`, `breakthrough`, `amazing`, `incredible`, `synergy`, `10x`, `skyrocket`, `unlock`, `crush it`.
- Spammy mechanics: ALL-CAPS words, multiple `!!!`, `click here`, `buy now`, `dear`, `congratulations`, `winner` (the word — fine as "winning ad" in body, avoid in subject).
- **Voice-hygiene additions from the teardown:** minimize the word **"slop"** — it appears at most once across the whole system (and even that is optional). Repeating the buyer's feared word back to them, and *claiming* the negative ("doesn't look like slop"), undoes the "show, don't claim" rule. Prove quality with concrete tells (pour shot, mouth-sync), don't name the fear.
- Note: "guarantee" appears in Track 2 breakup *body* — acceptable in body, **never in a subject**. If a spam test flags it, swap to "or your next cycle's on me."

**Pre-send QA checklist**
- [ ] The proof-only credibility line ("newer than the 10-year agencies, so I just built the ad") is present *in Email 1's body*, not deferred — and no false store/warehouse/Meta-spend claim has crept back in.
- [ ] `{{sampleLink}}` populated and resolving for every priority lead.
- [ ] `{{hook}}` is true, specific, and passes the three-part quality bar (true / specific / says-the-quiet-part). No generic filler.
- [ ] `{{product}}` reads as natural lowercase mid-sentence — not a scraped product title.
- [ ] The word "slop" appears at most once across all live copy.
- [ ] No fabricated numbers anywhere; `[CASE STUDY PLACEHOLDER]` only in breakup, only until a real delta exists.
- [ ] Spam-score check (mail-tester or similar) ≥ 9/10 before campaign goes live.
- [ ] List scrubbed/verified (bounce rate < 2% target); catch-alls flagged.
- [ ] Track field correct — no Wounded-Veteran grief copy sent to a winning Volume-Player.

---

## 5. Sequence Timing Summary

| Step | Track 1 (Wounded Vet) | Track 2 (Volume/Lean) | One clear ask |
|---|---|---|---|
| Email 1 | Day 0 | Day 0 | Click the sample (hook earns it first) |
| Email 2 (bump) | Day 2 | Day 2 | Resurface sample |
| Email 3 (value) | Day 5 | Day 5 | See a full cycle / **the head-to-head** |
| Email 4 (breakup) | Day 9 | Day 9 | "Show me" / "Send the cycle plan" |

**One clear ask per email. Reply-in-thread for bumps (same thread keeps deliverability and context). Stop after Email 4 — no second breakup.**

> **The whole system in one line:** earn the click with a true observation about *their* account, let the sample prove the work, and never mass-produce the two fields (`{{hook}}` and `{{product}}`) that carry it. Right per-lead, the skeptic clicks. Automated, it's slop.

---

Source files read in full: `C:\Users\dylan\Documents\axiom-balloon\Core Business\12-offer-locked.md` and `C:\Users\dylan\Documents\axiom-balloon\Core Business\13-positioning-acp.md`. This is the ship version (v2.0) — all five highest-impact edits applied, both tracks intact, subject-line A/Bs, merge-tag map, deliverability notes, and DM variant preserved. Credibility is proof-only: no claimed ad track record, no store/warehouse/Meta-spend claims — the made-for-them rendered sample carries the trust. One hard prerequisite remains blocking before any live send: a resolving `{{sampleLink}}` per priority lead.