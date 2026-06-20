# GET GOOD FAST — Sora 2 Consistent-Character Skill-Up Curriculum + The Slop Rubric

**For:** Chaga Chai · solo founder, AI-Native UGC agency
**Method under training:** the Sora 2 consistent-character workflow (`28-sora2-consistent-character-workflow.md`) feeding the 4×24 system (`4x24-framework-spec.md`, `production-sop.md`)
**Practice surface:** the 3 fictional sample brands only — **MycoMornings** (mushroom coffee, $39, 12oz matte-black pouch), **ZenChews** (ashwagandha + L-theanine gummies, $34, jar), **DailyGreens24** (greens powder, $59, tub). Never burn a real prospect on a rough early render.
**The one goal:** turn "practice until good" into a measurable program that ends with a hard, testable **Graduation Bar** — the moment you may offer this to a real brand for proof and start collecting the first $3–5K.

---

## 0. How to use this (read once)

Your bottleneck is **production skill, not strategy.** The strategy is already locked. So this curriculum measures one thing: *can you reliably make a render that does not look like AI slop, fast.* Inconsistency (morphing face, warping label) is the #1 "this is AI" tell — and consistency is the entire moat you sell (doc 28 §Why this matters). Everything below is built to drill that out of your hands.

**The three instruments:**
1. **The Drill Ladder (§1)** — ~8 drills, easiest → hardest. Each has a goal, exact steps tied to doc 28, and a *binary* pass/fail bar. Do them in order. Do not skip ahead — D6 will collapse if D2 isn't automatic.
2. **The Slop Rubric (§2)** — the 8-point pass/fail card you self-score *every single render* against. This is the spine of the whole program.
3. **The Self-Eval Loop (§3) + Graduation Bar (§4)** — how to A/B and discard your own work, and the explicit "you're good enough now" test.

**The rule that makes practice count:** *Every render gets a Slop Rubric score logged before you watch the next one.* No exceptions. Unscored practice is just scrolling.

**Set up your practice log now** (one row per render — this becomes your evidence you graduated):

```
render_id | brand | drill | date | attempt# | RUBRIC 8 (P/F each) | overall PASS/FAIL | seconds-to-produce | discard? | the one fix for next attempt
```

---

## 1. THE DRILL LADDER — 8 drills, easiest to hardest

> Each drill names a **single new skill** it adds on top of the last. The pass bar is **binary** — you either cleared it or you didn't, no "pretty good." Hit the **streak** before you advance, because a one-off lucky render is a lucky seed, not a skill.

---

### D1 — The Clean Product Still (label fidelity)
**New skill:** make Sora hold the product label pixel-perfect. This is the foundation; if the label warps, nothing downstream matters.

**Steps (tie to doc 28 §1):**
1. Pick **MycoMornings**. Take its product image (or the worked description in doc 28 §Templates).
2. Run the **product-prompt template** in ChatGPT/Claude: upload the image, ≤500 chars, exact container/colors/every text line, end with the lock command *"no redesign, recolor, or artistic reinterpretation; typography and proportions pixel-perfect to the image."*
3. Generate a **still** in Sora 2 with that product description + the image, framed as a simple product-in-hand or product-on-counter shot. No character performance yet — just the object.
4. Zoom to 100% on the label. Read every line of text out loud against the real label.

**PASS/FAIL bar (binary):** The wordmark reads **"MycoMornings"** with correct letterforms, the ingredient line ("LION'S MANE · CHAGA · CORDYCEPS") is legible and correctly spelled, the pouch shape/finish matches, and there is **zero invented text, warped type, or recolor.** One garbled letter = FAIL.

**Streak to advance:** 3 consecutive passes, across at least 2 of the 3 brands (do ZenChews jar + DailyGreens24 tub too — small label vs. big tub teaches different failure modes).

---

### D2 — The Consistent Character Holding the Product
**New skill:** mint a believable real-customer character **already holding** the product at generation time — the critical insight of the whole method (doc 28 §2: Sora does NOT reliably honor a product image added *after* creation).

**Steps:**
1. Paste your D1 product description **into the character-prompt scaffold** (doc 28 §Templates), filling the `[character]` as a *believable real customer* — never a fabricated authority. For MycoMornings: "burnt-out knowledge worker, 30s, cozy kitchen."
2. Upload the product image **during the initial character generation**, not after.
3. Generate. When it renders, three-dots → **"Generate Character"** → **publish public.** Treat this first render as **infrastructure, not a deliverable** (doc 28 §3).
4. Score the still frame on the rubric (§2 points 1, 2, 3).

**PASS/FAIL bar:** The character looks like a real person (not waxy/uncanny), is **holding the product naturally**, the label still holds from D1, **hands have five fingers each and no melt**, and the face has no artifacts. Mint succeeds (character publishes). Any morphed hand or warped label = FAIL.

**Streak to advance:** 2 clean minted characters on 2 different sample brands. (You now own 2 reusable assets — keep them.)

---

### D3 — The Single Clean 15s Talking Spot
**New skill:** a full 15-second take with **lipsync that locks**, correct pacing, and a hook that lands in the first 3 seconds.

**Steps:**
1. Take **one existing 15s script** from doc 19 for your minted brand — e.g. `MYCO_PAS_H08_TH_15` or any 15s cell. Use the **spoken BODY only** (doc SOP §3.2).
2. Word-count discipline: 15s ≈ **35–45 spoken words** (SOP §2.4). If the script is longer, trim — never speed the render to fit.
3. Phonetic-spell ingredient names in the prompt if needed: "ash-wuh-GAN-duh," "L-thee-uh-neen."
4. Generate against the **tagged character** from D2 (base prompt identical, only action + dialogue change — doc 28 §4).
5. Watch it **3 times**: once for the hook (first 3s), once muted (does the visual hook carry?), once for lipsync drift.

**PASS/FAIL bar:** Lipsync locks on the hook line (the most-watched frames, SOP §3.3); no uncanny mouth artifacts; pacing matches 15s (not rushed/robotic); the hook works as the literal first frame; ingredient pronounced correctly. **Any lipsync desync >~2 syllables, or a rushed/robotic delivery = FAIL.**

**Streak to advance:** 3 consecutive passing 15s spots.

---

### D4 — Same Character, 3 Clips, Change Only Action + Dialogue
**New skill:** the **reuse-and-tag** discipline — the literal economic engine of 4×24 (one minted character → unlimited consistent clips). This is where "consistency across a batch" gets proven (doc 28 §4).

**Steps:**
1. Using your D2 character, generate **3 clips**: keep the base prompt **byte-for-byte identical**, tag the published character, and change **only** (a) the action beat and (b) the dialogue. Three different hooks/CTAs from the same angle's cells.
2. One clip must be a **product-out** scene (add *"[character] holds nothing in their hand"* — doc 28 §5) to prove you can vary the staging without re-minting.
3. Lay the 3 clips side by side (the §3 A/B method).

**PASS/FAIL bar:** Across all 3 clips the **face is the same person** (no morph between clips), the **product label is identical and un-warped** in every product-in clip, lighting/setting feel like one continuous shoot, and each clip individually passes the rubric. **If a stranger could tell it's three different people or three different products = FAIL.** This is the literal anti-slop test you sell against.

**Streak to advance:** 1 clean 3-clip set per brand, on 2 brands.

---

### D5 — The Full 6-Cell Angle Set
**New skill:** produce one complete **6-variation angle block** to the fixed grid (4×24 spec §2) — your first real "section" of a deliverable.

**Steps:**
1. Pick **one angle** for one brand (e.g. ZenChews **PAS**). Pull its 6 scripts from doc 19 — they're already written to the V01–V06 template (face cold-open / symptom b-roll / text-card / product-in-hand / hook-β / hook-γ; mix of 15s & 30s; SHOP/SOFT/OFFER/URG).
2. Render the 6 cells against your tagged character. **One lever changes per cell** (spec §2) — don't let yourself "improve" a cell by changing hook *and* format.
3. **QA each render immediately before moving on** (SOP §3.2 step 4) — re-roll fails *now*; a bad render found later costs 3×.
4. Name each file `BRAND_ANGLE_HOOK_FORMAT_LEN_vNN` (spec §5).

**PASS/FAIL bar:** All **6/6** clips pass the rubric, the character is consistent across all 6, all 6 are correctly named, and the format/runtime/CTA of each cell matches the grid. **5/6 is a FAIL** — the discipline is the whole point.

**Streak to advance:** 2 clean 6-cell sets (2 different angles, can be different brands).

---

### D6 — The Clean 24-Pack on One Sample Brand
**New skill:** the full assembly line — **all 4 angles × 6 = 24** consistent renders for one brand, the actual cycle deliverable (SOP §3).

**Steps:**
1. Pick one brand (do **DailyGreens24** — highest AOV, most demanding label, all 24 scripts already in doc 19).
2. Render **by angle block (6 at a time)** so you QA in coherent batches and reuse the same character setup (SOP §3.2).
3. Hold the **2–4 recurring characters** to the angle→avatar map (SOP §3.1): PAS = looks like the avatar mid-symptom; FND = founder-plausible; MECH = smart-friend explainer; TRAN = believable "after." Don't use a new face every cell.
4. QA-gate every render; re-roll fails; name everything; drop into a `/03-Renders/` folder.

**PASS/FAIL bar:** **24/24** raw renders pass the rubric; character consistency holds within each angle's 6 cells; the label holds across all 24; all 24 correctly named. Log your **total wall-clock time** — this is your throughput baseline for the SOP's time math (doc 28 §Validation #3).

**Streak to advance:** 1 clean 24-pack. (You only need to do this once cleanly to unlock D7 — but the time you log matters.)

---

### D7 — The Speed Run: Product Image → Clean 15s Sample, Timed
**New skill:** the **made-for-them sample motion** — the single highest-trust, highest-leverage action in the entire business (doc 21 §2; doc 22). This is the exact thing you'll do for real prospects: take a product image cold and turn it into one clean 15s UGC ad, fast.

**Steps (simulate a real prospect using a sample brand you haven't pre-minted):**
1. Start a stopwatch. From **only a product image** (treat it as a prospect's image you've never seen): run the product-prompt → mint a character with product embedded → render one **15s** spot to a doc-19-style hook for that brand.
2. Use the templatized approach (doc 25 §Risk 5): reuse a known character family + a fixed 15s spec format so it's a *build*, not a custom art project.
3. Stop the clock when you have one rubric-passing 15s render exported.

**PASS/FAIL bar:** A **rubric-passing 15s sample produced in under 20 minutes** (the templatized target in doc 25 §Risk 5 / §2.4 is ~15–20 min). Over 20 min, or a render that fails the rubric, = FAIL.

**Streak to advance:** 3 consecutive sub-20-min passing samples, across **all 3 brands** (so it's the *skill* that's fast, not memorized muscle on one product).

---

### D8 — The Cold-Brand Drill (graduation rehearsal)
**New skill:** prove the speed run holds on a product you have **zero prior setup for** — the true test that you can serve a real prospect tomorrow.

**Steps:**
1. Grab a **product image you have never built before** (a fourth, unused functional-consumable image — a real DTC product page screenshot is fine; you're only *practicing*, not sending anything).
2. Run the full D7 motion cold: product-prompt → mint → 15s render → rubric → export. No pre-minted character, no prior product description.

**PASS/FAIL bar:** Rubric-passing 15s sample of a never-before-seen product **in under 20 minutes.** This is the dress rehearsal for the Graduation Bar.

---

## 2. THE SLOP RUBRIC — score every render, every time

> **8 checks. Each is binary: PASS or FAIL.** A render is a **PASS only if all 8 pass.** One FAIL = the whole render fails (that's how slop works — a single melted hand tanks the trust). Print this. Score from the still frame for points 1–5, from playback for 6–8.

| # | Check | What a PASS looks like | What FAIL looks like | The fix |
|---|---|---|---|---|
| **1** | **Character consistency** | Same face/build/wardrobe across every clip in the set; one real person | Face morphs between clips; features drift; "different person" feel | You re-described the character instead of **tagging the published reference**. Re-tag; keep the base prompt identical; change only action + dialogue (doc 28 §4). Re-mint if the asset itself is weak. |
| **2** | **Product / label fidelity** | Wordmark + every text line legible and correctly spelled; container shape/finish/colors match; no invented text | Warped type, garbled letters, recolored label, redesigned packaging, label "re-renders" into nonsense | Product was added **after** creation, or the product-prompt was loose. Re-embed the product **at generation time** with the image; tighten the ≤500-char prompt + the "pixel-perfect, no redesign" lock (doc 28 §1–2). |
| **3** | **Hands & face artifacts** | 5 fingers/hand, natural grip, no extra limbs; eyes/gaze natural, no waxy skin, no glitch frames | 6 fingers, fused/melting hands, dead or crossed eyes, plastic skin, flicker frames | Re-roll the seed; shorten the take; simplify the hand action (holding still > gesturing). Add the negatives: `distorted hands, inconsistent character` (doc 28 scaffold). |
| **4** | **Lighting / realism** | Looks like a phone-shot real moment; soft natural/window light; natural skin texture; no oversaturation | Over-glossy "rendered" look, plasticky CGI sheen, blown highlights, studio-fake polish on a "UGC" spot | Add `handheld realism, natural skin texture, no filters, soft window light` and negative `oversaturation` (doc 28 scaffold). UGC must read *un-produced*. |
| **5** | **Hook in first 3s (visual)** | The first frame *is* the hook; works on mute as a text-card-able moment; thumb-stop-worthy | A slow warmup, logo intro, or a hook that only works as audio | Hook must be the literal first frame and work on mute (SOP §2.4, §4.1). If it only works with sound, it fails on the feed. Re-cut to open on the symptom/payoff. |
| **6** | **Lipsync** | Mouth locks to words, especially on the hook line (most-watched frames) | Desync, mouth flapping out of time, lips still moving after audio stops | Script too long for runtime is the #1 cause. Trim to word-count (15s≈40w, 30s≈80w); never speed the render (SOP §3.3, §2.4). Re-roll if it's a seed glitch. |
| **7** | **Pacing** | Delivery matches runtime — natural, conversational, not crammed | Rushed/robotic (overwritten script) or draggy dead air | Trim the script, don't compress the voice. Cut adjectives, read it aloud as a person texting a friend (SOP §2.4). |
| **8** | **FTC-safe claim** | Real product, honest experiential framing ("calm focus," "less bloat"); no disease/cure/enhancement; no fabricated testimonial/authority | "Cures anxiety," "treats ADHD," "clinically proven" with no study, a fake doctor/grandma authority, concealment that it's AI | Strike the claim. Stay inside the brand's CLAIMS-OK set; frame benefits as *experience*, never medical (doc 28 §FTC boundary; SOP §2.3). **This is the boundary that separates you from the slop you sell against — never the spot you ship to look good.** |

**Scoring shorthand for your log:** write the 8 results as `1P 2P 3F 4P 5P 6P 7P 8P` so you can see *which* check fails most often. The check that fails most is your next deliberate-practice target.

---

## 3. THE SELF-EVALUATION LOOP — A/B your own renders, and when to discard

You will not have a client telling you what's slop yet. **You are the judge.** Train the judgment with a tight loop:

**The 2-render A/B (after every drill attempt):**
1. Generate **two variants** of the same beat (different seed, or one prompt-knob changed — e.g. add the realism negatives to one).
2. Put them **side by side** and score both on the rubric. Pick the winner *only* on rubric points, not on "vibe."
3. Log *why* the winner won (which rubric point separated them). That "why" is the lesson — it's what compounds.

**The mute test (do it on every render):** watch it on **mute** first. Most feed views are silent (SOP §4.1). If the hook and the story don't survive muted, it fails point 5 regardless of how good the audio is.

**The 3-second test:** ask "would a stranger's thumb stop here in 3 seconds?" If you hesitate, it's a no. Thumb-stop is the metric the real account lives or dies on (spec §4).

**WHEN TO DISCARD (be ruthless — this is the skill):**
- **Discard immediately** (don't try to save it): any FAIL on points 1, 2, 3, or 6 (consistency, label, hands/face, lipsync). These are generation-level failures — re-roll or re-mint, don't polish a broken render.
- **Re-roll the seed** (up to ~3 tries) for points 3/6 if everything else is strong — sometimes it's just an unlucky seed.
- **Go back to the prompt** for points 2, 4, 5, 7 — these are *your* prompt/script failures, not the model's. Fix the input.
- **Never ship past a FAIL to "save time."** A bad render found later costs 3× (SOP §3.2). Killing it now *is* the fast path.
- **The 3-strike rule:** if a single beat fails the same rubric point 3 times in a row, the **prompt is broken, not the seed** — stop re-rolling and rewrite the prompt/script.

**Track your hit-rate.** Each session, compute `passing renders ÷ total renders`. This single number is your skill curve. Watch it climb. When it crosses the Graduation thresholds below, you're done practicing.

---

## 4. THE GRADUATION BAR — "you may now offer this to a real brand for proof"

> This is the gate to collecting the first $3–5K. **All five criteria must be met, with the evidence in your practice log.** No vibes — these are testable. The bar is set deliberately at the real-world jobs you'll be paid for: a clean 24-pack, and a fast made-for-them sample (doc 21 §5, doc 25 §Risk 5).

**You have graduated when ALL of these are true:**

1. **Consistency streak — 10 in a row.** Your last **10 consecutive renders** all scored a full **8/8 PASS** on the Slop Rubric. (10, not 5 — because a paid cycle is 24 and you cannot afford a slop rate that surfaces a melted hand in front of a paying brand.)

2. **The made-for-them speed bar.** You can turn a **never-before-seen product image into a rubric-passing 15s sample in under 20 minutes** — demonstrated on **3 consecutive cold products** (D7 + D8). This is the literal cold-email/sample motion; if you can't hit it, the whole outreach funnel starves (doc 25 §2.4, §Risk 5).

3. **A complete clean 24-pack exists.** You have shipped at least **one 24/24-passing pack** on a sample brand (D6), with character consistency holding within every angle's 6 cells and all 24 correctly named — and you logged the wall-clock time (this becomes your real cycle-time estimate for pricing/capacity).

4. **Hit-rate ≥ 80%.** Across your **most recent 25 renders**, at least **20 passed** on the first or second attempt (rubric points logged). You're not graduating on a lucky 10-streak alone — your *baseline* output is reliable, so a real cycle won't blow your time budget on re-rolls.

5. **Self-judgment calibrated + FTC-clean.** You can predict a render's rubric verdict *before* watching it the second time (you "feel" the slop), AND **zero** of your graduating renders contain an FTC point-8 failure — no disease/enhancement claim, no fabricated authority, no concealment. (This one is non-negotiable: a compliance slip on an ingestible is a real-world liability, not a quality miss.)

**The graduation render (do this last, then you're cleared):** Pick a real DTC functional-consumable product image you've never touched. Cold, timed, on camera-roll. Produce one clean 15s sample in under 20 minutes that passes 8/8. If you clear it on the first try — **you're good enough. Go render the A-tier prospect samples (doc 22) and start the outreach motion.** The first $3–5K is on the other side of that send.

---

## 5. The motivating frame (keep this taped above the monitor)

- **You are not "learning AI video." You are drilling out the one tell that loses the sale: inconsistency.** Every clean streak is you widening the moat you literally sell (doc 28 §Why this matters).
- **The fictional brands are your flight simulator.** Crash them as many times as you want — MycoMornings, ZenChews, and DailyGreens24 never complain, never churn, never see a bad render. *Real* prospects only ever see graduated work.
- **The whole rest of the business is already built and waiting** (offer, 79-brand list, openers, sales script, guarantee). The *only* thing standing between you and the first cash is this number going up: **your rubric pass-rate.** Make it climb. That's the entire job right now.
- **The day you clear the Graduation Bar, you stop practicing and start selling.** The guarantee you'll offer — *"my creative beats your control on hook-rate and hold-rate, CPA flat, or your next cycle's free"* (doc 18) — is only safe to make once your hands can reliably produce the renders that win it. This curriculum is what makes that guarantee honest.

---

**Relevant source files (all absolute):**
- `C:\Users\dylan\Documents\axiom-balloon\Core Business\28-sora2-consistent-character-workflow.md` — the 5-step method + FTC-safe templates the drills are tied to
- `C:\Users\dylan\Documents\axiom-balloon\Core Business\production-sop.md` — §3 QA gate + §2.4 word-counts + naming, source for D5/D6 bars
- `C:\Users\dylan\Documents\axiom-balloon\Core Business\4x24-framework-spec.md` — 6-cell grid + angle→avatar map + thresholds behind D5/D6
- `C:\Users\dylan\Documents\axiom-balloon\Core Business\19-creative-scripts.md` — the 72 ready scripts (3 sample brands) used as drill inputs
- `C:\Users\dylan\Documents\axiom-balloon\Core Business\18-sales-playbook.md` — guarantee language the Graduation Bar must make honest
- `C:\Users\dylan\Documents\axiom-balloon\Core Business\22-prospect-personalization.md` — the 15s made-for-them sample standard behind D7/D8
- `C:\Users\dylan\Documents\axiom-balloon\Core Business\21-LAUNCH-BRIEF.md` + `25-path-to-20k-model.md` — the ~15-20 min sample-time target and why sample-production speed is the rate-limiter (graduation criterion 2)