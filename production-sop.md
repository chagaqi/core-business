# Production SOP — The 24-Pack Assembly Line

**Owner:** Production / Solo Operator
**Companion doc:** `4x24-framework-spec.md` (the *why* and the strategy layer — this doc is the *how* and the assembly line)
**Scope:** The repeatable, end-to-end process one operator runs to ship **24 AI-UGC video variations per brand, every 2-week cycle**, for DTC functional consumables.
**Tool stack:** GPT/Claude (scripting) → Arcads / Creatify *or* Sora 2 + kie.ai (avatar/character render — see `28-sora2-consistent-character-workflow.md`) → Captions AI (edit / lipsync / caption / b-roll) → Meta Ads Manager (deploy + iterate).
**Golden rule:** The framework spec defines the 4 angles, 6-cell grid, hook bank, thresholds, and naming convention. **This SOP never reinvents those — it executes them.** When in doubt, the spec wins.

---

## 0. How to Read This Manual

This is an operating manual, not an essay. It is organized as the **literal sequence of stations on the line**:

```
INTAKE → SCRIPTING → GENERATION → POST → DELIVERY/NAMING → META LOOP → STRATEGY CALL
  §1         §2          §3         §4         §5             §6           §7
```

Each station has: **inputs** (what arrives), **the work** (what you do), **outputs** (what leaves), **failure modes + fixes**, and **time**. Section §8 gives the full time budget and the hire-order for scaling. The tear-off **station checklist** is at the end.

A "24-pack" = one cycle's full deliverable for one brand: 4 angles × 6 variations, all named, captioned, formatted, and ready to launch.

---

## 1. INTAKE — Build the Brand Brief Once, Reuse Every Cycle

**Goal:** Collect everything once into a single **Brand Brief** so scripting, generation, and post never stall waiting on an asset. Intake is heavy in cycle 1 (~90 min) and near-zero after — you only refresh the "winners" section each cycle.

### 1.1 What to collect (the Brand Brief intake checklist)

| Bucket | Specifically collect | Why it matters downstream |
|---|---|---|
| **Identity** | Brand name, the 3-letter naming token (e.g. `MYCO`/`ZEN`/`DG24`), logo (PNG, transparent), brand colors (hex), font | Feeds naming convention + Captions AI brand kit |
| **Product** | SKU, exact ingredients + doses, serving count, **AOV / price**, format (powder/gummy/bag) | AOV drives angle weighting (spec §1 cheat-sheet); ingredients feed Mechanism angle |
| **Offer** | Current promo (first-order %, bundle, subscription discount), free-shipping threshold, guarantee | Feeds the `OFFER`/`URG` CTA cells |
| **Avatar** | The 1-paragraph avatar (age, job, the *sharp recurring pain* + its daily trigger), their words/objections | The single most important input — drives avatar selection + hook choice |
| **Voice** | 3–5 adjectives, "we say / we never say" list, reading level, emoji policy, claims they're comfortable making | Stops "AI slop" (see §3.4); keeps scripts on-brand |
| **Visual assets** | 6–10 product shots (hero, in-hand, lifestyle, texture/pour, label macro, packaging), any existing b-roll/lifestyle clips | Opening-3s product-in-hand cells; b-roll layer in post |
| **Proof** | Real reviews/testimonials (verbatim quotes), UGC they already have, press, "as seen in" | Feeds Transformation + Social-proof angles **and** keeps claims grounded in real customer language |
| **Past performance** | Their **winning past ads** (the actual video/static + the metric that made it a winner), losers + why, current best CPA/ROAS/AOV benchmarks | Seeds angle weighting and hook selection; tells you their baseline so thresholds get recalibrated (spec §4) |
| **Compliance** | Banned claims list, regulated phrases (FDA/FTC sensitive: "cures," "treats," "clinically proven" without a study), required disclaimers | The D1–3 compliance pass (spec §0 risk flag) starts here, not at the end |

### 1.2 The work

1. Send the client a **one-page intake form + an asset-upload folder link** (Google Drive/Dropbox). Never collect assets over email/DM — they get lost.
2. Drop everything into a per-brand folder: `/Brands/<BRAND>/00-Brief/`, `/01-Assets/`, `/02-Winners/`.
3. Write the **Brand Brief** as a single markdown file (template below). This file is the literal context block you paste into the scripting prompt in §2.

### 1.3 Brand Brief template (the reusable context block)

```
BRAND: MycoMornings  | TOKEN: MYCO
PRODUCT: Mushroom coffee — lion's mane + chaga + cordyceps. 30 servings/bag.
AOV: $39  | OFFER: 15% first order + free ship >$45 | GUARANTEE: 30-day money-back
AVATAR: 30–45 burnt-out knowledge worker. Gets coffee jitters/anxiety + a 2–3pm
        crash. Wants focus without the spike-and-crash. Trigger: the afternoon wall.
THEIR WORDS: "wired but tired", "I can't do a second cup", "I crash by 3"
VOICE: calm, smart-friend, lower-case, dry humor. NEVER: hype-y, "miracle", clinical.
CLAIMS OK: "jitter-free", "calm focus", "gut-friendly". CLAIMS BANNED: cures anxiety,
        treats ADHD, "clinically proven" (no study on file).
PROOF: 4.7★ (1,900 reviews). Top quote: "first coffee that doesn't make my heart race."
WINNERS LAST CYCLE: TRAN angle + H03 hook + VO format was the scaler (CPA $26 vs $41 target).
```

### 1.4 Failure modes + fixes

| Failure | Fix |
|---|---|
| Client sends 2 blurry product shots | Intake form **requires** the 6-shot list; provide a shot-list with examples; reject the cycle start until met |
| No avatar clarity ("everyone who likes coffee") | You write the avatar from their reviews + best past ad, send it back for a 1-line approval |
| Vague offer ("we run promos sometimes") | Lock ONE offer for the cycle in writing; `OFFER`/`URG` cells need a concrete number |
| Claims unknown | Default to the **conservative claims set**; flag anything spicy for the §4 compliance pass |

**Output:** A finished `Brand Brief.md` + an organized asset folder. **Time: ~90 min cycle 1, ~15 min refresh thereafter.**

---

## 2. SCRIPTING — Turn the Brief into 24 Scripts on the Grid

**Goal:** Produce **24 scripts** that exactly populate the spec's 4×6 grid — correct angle, hook (from the bank), format, runtime, and CTA per cell — in one batched GPT/Claude pass, then human-edit.

### 2.1 The approach

Do it in **two prompts, not one**:
1. **Prompt A — the grid plan:** model proposes the 24-cell plan (angle weighting + which 12 hooks + format/runtime/CTA per cell). You approve/adjust. This is the judgment layer; spend your attention here.
2. **Prompt B — the scripts:** model writes all 24 scripts to the approved plan, one at a time per angle (6 at a time keeps quality up vs. dumping 24).

Generating the plan separately is what prevents "24 generic scripts" — the model commits to *distinct hypotheses per cell* before it writes a word.

### 2.2 Prompt A — Grid Planner (paste the Brand Brief, then this)

```
You are the creative strategist for an AI-UGC performance ad agency. Using the
BRAND BRIEF above and the 4x24 Framework, produce the cycle's 24-cell PLAN — do
not write scripts yet.

RULES (non-negotiable):
- Ship all 4 angles: PAS, Founder (FND), Mechanism (MECH), Transformation (TRAN).
- 6 variations per angle = 24 total. Use the fixed 6-cell template:
    V01 baseline: hook-α, face cold-open, TH, 30s, SHOP
    V02: hook-α, symptom b-roll, VO, 30s, SHOP
    V03: hook-α, bold text-card, LF, 15s, SOFT
    V04: hook-α, product-in-hand, SS or GS, 30s, OFFER
    V05: hook-β, face cold-open, [angle's best format], 15s, URG
    V06: hook-γ, best-guess visual, [angle's best format], 30s, SOFT or OFFER
- Pick 3 hooks per angle (α, β, γ) ONLY from the 15-hook bank (H01–H15), matched
  to each angle's strength. 12 unique hooks total across the cycle.
- Weight spend + choose which angle LEADS using the AOV x avatar cheat-sheet for
  this brand's AOV of [$AOV] and avatar type [acute-symptom / skeptical / optimizer].

OUTPUT a table, one row per variation:
  var_id | angle | hook_id | hook_line(filled for this brand) | open_3s | format |
  len | cta | one-line hypothesis (what this cell tests)

Then a 2-sentence rationale for the angle weighting + lead angle.
```

### 2.3 Prompt B — Script Writer (run once per angle, 6 cells at a time)

```
Write the 6 scripts for the [ANGLE] block from the approved plan. For EACH variation
use its exact hook line, format, runtime, and CTA from the plan.

CONTEXT: use the BRAND BRIEF above as the ONLY source of truth for product facts,
avatar, voice, proof, and CLAIMS. Do not invent ingredients, studies, or testimonials.

WRITE in the brand voice ([VOICE adjectives]). Speak as the avatar or to the avatar.
Use THEIR WORDS from the brief. No marketing-speak, no "introducing", no "in today's
world". First line = the hook, under 12 words, must work as the literal first frame.

COMPLIANCE: stay inside CLAIMS OK. Never use any phrase in CLAIMS BANNED. No
disease/cure/treat language. Frame benefits as experience ("calm focus") not medical.

FORMAT each script as:
  [VAR_ID]
  HOOK (0–3s):        <on-screen + spoken first line>
  BODY (script):      <spoken VO/dialogue, beat by beat, sized to [LEN] runtime>
  ON-SCREEN TEXT:     <caption/text-card cues>
  B-ROLL / VISUAL:    <shot suggestions per beat>
  CTA (final 2–3s):   <the [CTA] ask, in brand voice>
  WORD COUNT:         <~40 words for 15s, ~80 for 30s>
```

### 2.4 Scripting rules of thumb

- **One lever per cell.** The grid already enforces this; don't let the model "improve" a cell by changing hook *and* format — that breaks the read (spec §2).
- **15s ≈ 35–45 spoken words; 30s ≈ 75–90.** Over-writing is the #1 cause of rushed, robotic lipsync in §3.
- **Hook = first frame.** If the hook only works as audio, it fails on mute. Make it a text-card too.
- **Human-edit every script.** Read each aloud. Cut adjectives, contractions in, make it sound like a person texting a friend. Budget real time here — this is where "AI slop" is killed.

### 2.5 Failure modes + fixes

| Failure | Fix |
|---|---|
| All 24 scripts sound the same | You skipped Prompt A; regenerate the plan so each cell has a distinct hypothesis first |
| Model invents a study/claim | Tighten the COMPLIANCE block; strike it; never let invented proof through |
| Scripts too long → bad lipsync later | Enforce word-count line; cut to the runtime, don't speed up the render |
| Generic hooks not from the bank | Force `hook_id` H01–H15 in Prompt A output; reject free-styled hooks |

**Output:** `Scripts.md` with 24 labeled scripts (named per §5 already). **Time: ~60–90 min (plan + generate + human-edit all 24).**

---

## 3. GENERATION — Render Avatars (Arcads / Creatify · or Sora 2 consistent-character)

**Goal:** Turn 24 scripts into 24 raw avatar videos, batched, with the right avatar per angle, avoiding the "AI slop" trap.

> **Two production paths (pick per format):**
> - **Arcads / Creatify (fast lane)** — talking-head UGC volume; what the rest of this section covers.
> - **Sora 2 consistent-character (cinematic lane)** — for character-led / product-forward / testimonial-style spots where batch *consistency* is the point (the strongest anti-slop signal). Mint one character per brand-avatar with the product embedded **at generation time**, publish it, then reuse-and-tag, changing only action + dialogue. Full method + FTC-safe templates: **`28-sora2-consistent-character-workflow.md`**. Each SKU's product-prompt lives in the §1 brand brief.

### 3.1 Avatar selection logic

The avatar must **match the brief's avatar and the angle's job.** Don't pick by "which looks nicest" — pick by who the target buyer trusts.

| Angle | Avatar to cast | Why |
|---|---|---|
| **PAS** | Looks *like the avatar* mid-symptom — relatable, slightly tired, real setting (desk, kitchen) | Recognition: "that's me." Over-polished = breaks PAS |
| **Founder (FND)** | Founder-plausible: a bit more authoritative, warm, "I made this" energy; can be off-demographic | Trust transfers from a credible builder |
| **Mechanism (MECH)** | Smart-friend / "explainer" energy; calm, articulate | Sells the rational justification |
| **Transformation (TRAN)** | Aspirational-but-attainable version of the avatar; the believable "after" | Proof must look reachable, not a model |

**Casting rules:**
- **2–4 recurring avatars per brand, max.** A consistent face across cycles builds pseudo-brand recognition and lets you read avatar as a variable. Don't use a new face every cell.
- Match **demographic to the brief** (age band, gender skew — e.g. ZenChews skews female).
- Hold the avatar constant within an angle's 6 cells where possible so format/hook is the variable, not the face.
- Check **accent/energy** matches the script's voice (calm brand ≠ hype avatar).

### 3.2 Batching workflow

1. **Set up the brand once:** load brand kit / pre-select the 2–4 avatars in Arcads/Creatify.
2. **Render by angle block (6 at a time)** so you QA in coherent batches and reuse the same avatar setup.
3. **Paste the script's spoken BODY only** (not the b-roll/on-screen cues — those are for post). Set voice/pace to match runtime.
4. **Render → immediately QA** (§3.3) before moving to the next block. Re-render fails *now*; a bad render found in post costs 3× the time.
5. Download raw clips into `/Brands/<BRAND>/03-Renders/<cycle>/` named per §5.

### 3.3 QA gate per render (pass before it leaves the station)

- Lipsync locks on the hook line (first 3s) — the most-watched frames.
- No uncanny mouth artifacts, no glitch frames, eyes/gaze natural.
- Pacing matches runtime (not rushed/robotic) — if rushed, the script was too long → trim in §2, re-render.
- Pronunciation of ingredient names correct (lion's mane, ashwagandha, L-theanine) — phonetic-spell in the script if needed.
- Energy/tone matches the angle (PAS = real; TRAN = warm).

### 3.4 Failure modes + fixes — including the "AI slop without brand context" trap

| Failure | Cause | Fix |
|---|---|---|
| **"AI slop" — generic, soulless, off-brand** | Tool fed a bare script with no brand voice/avatar context | The brand context lives **upstream in scripting** (§2 voice + their-words), not in the render tool. Render quality follows script quality. Generic in = generic out. Never paste a hook the model freestyled outside the bank |
| Robotic / rushed delivery | Script too long for runtime | Trim to word-count (§2.4); never fix by speeding the render |
| Mispronounced ingredient | Tool phonetics | Phonetic-spell in script ("ash-wuh-GAN-duh"); re-render |
| Uncanny / glitchy face | Bad avatar-script pairing or unlucky seed | Re-roll the render; switch avatar; shorten the take |
| Same vibe across all 24 | One avatar + one energy reused everywhere | Use the angle→avatar map (§3.1); vary energy by angle |
| Wrong demographic | Avatar mismatch to brief | Re-cast to the brief's age/gender band |

**Output:** 24 raw avatar clips, QA-passed, named. **Time: ~90–120 min (setup + render + QA + re-rolls).**

---

## 4. POST — Captions AI (Caption, Hook, B-roll, Music, Aspect Ratios)

**Goal:** Turn 24 raw renders into 24 platform-ready ads: branded captions, a hard hook, b-roll/text-cards per the script, music, and **correct aspect ratio per placement** — plus the compliance pass.

### 4.1 The post checklist per clip

1. **Captions** — auto-caption, then correct. Brand-kit styling (font/color from §1), high-contrast, safe-zone (not under the UI). Most views are **on mute** — captions carry the ad.
2. **Hook reinforcement** — burn the hook line as a **text-card in the first 0–1s** (from the script's ON-SCREEN TEXT). The thumb-stop metric (spec §4) lives or dies here.
3. **B-roll** — drop the script's b-roll/visual beats: symptom b-roll (tired at desk, phone in bed), product-in-hand, texture/pour shots from §1 assets. Keep cuts every 1.5–3s to hold attention.
4. **Music** — low-bed, on-trend, matched to angle (calm for ZenChews wind-down; upbeat for energy). Keep under the VO; never let it bury speech. Use platform-safe/licensed tracks only.
5. **B-roll + render seams** — trim dead air, tighten the open, ensure the cut to b-roll doesn't break lipsync.
6. **Compliance pass (do it here, every clip)** — re-check on-screen text + captions against the banned-claims list. Captions sometimes "auto-correct" a spoken benefit into a stronger claim — catch it. This is the spec's D1–3 risk flag, enforced at the last gate before delivery.

### 4.2 Aspect ratios per placement

Render/export each ad in the ratios its placements need. Frame for the **most-restrictive** crop (keep face + captions inside 4:5 safe-zone) so one master survives all placements.

| Ratio | Placement | Notes |
|---|---|---|
| **9:16** | Reels, Stories, TikTok | Primary for UGC; full-screen vertical |
| **4:5** | Feed (Instagram/Facebook) | Highest-real-estate feed crop; the safe master |
| **1:1** | Feed fallback / some placements | Optional; only if the account uses it |
| **16:9 / 1.91:1** | Rarely for UGC | Skip unless requested |

**Minimum export:** 9:16 + 4:5 per creative. Keep captions/face inside the 4:5 safe-zone so the same edit crops cleanly to both.

### 4.3 Failure modes + fixes

| Failure | Fix |
|---|---|
| Captions cover the CTA / sit under platform UI | Use safe-zone guides; raise caption baseline |
| Ad unwatchable on mute | Hook text-card + full captions are mandatory, not optional |
| Music drowns VO | -12 to -18 dB under speech; duck on the hook |
| Wrong crop kills the face in feed | Frame to 4:5 safe-zone from the start |
| Caption auto-corrects into a banned claim | The §4.1 step-6 compliance re-read catches it |
| B-roll breaks lipsync continuity | Cut to b-roll only between sentences, never mid-word |

**Output:** 24 finished ads, 2 ratios each, captioned, compliant, named. **Time: ~2.5–3.5 hrs (the heaviest station).**

---

## 5. DELIVERY + NAMING + Client Tracker

**Goal:** Hand off 24 named files and one tracker that joins cleanly to Meta and to the cross-cycle pattern library.

### 5.1 Naming — one string, everywhere (from spec §5)

```
BRAND_ANGLE_HOOK_FORMAT_LEN_vNN        e.g.  MYCO_PAS_H01_TH_30_v01
```

The **exact same string** is the export filename, the Captions AI project name, and the Meta ad name. **No renaming downstream** — that's how results join back to the brief. Cycle ID lives in the campaign name (`MYCO_2026-W22`), never the creative name. Optional human tag: `..._v01__247crash`.

### 5.2 Delivery package

- `/Brands/<BRAND>/05-Delivery/<cycle>/` — 24 ads × 2 ratios, named per §5.
- A delivery note: cycle ID, the 24-grid plan table (from §2.2), the offer used, and any compliance notes.
- If the client launches: also deliver a **ready-to-paste copy doc** (primary text + headline per ad, named to match).

### 5.3 Client-facing tracker columns

One row per creative per cycle. This is the spec's **results sheet** (the moat). Columns:

```
creative_id (the name string) | cycle | brand | angle | hook | format | len |
status (delivered/live/killed/scaled) | spend | impressions | thumb_stop% |
hold% | CTR% | CPC | CPA | ROAS | decision (KILL/SCALE/ITERATE) | note | asset_link
```

- Pre-fill columns 1–7 + `asset_link` at delivery (you already know them from the name).
- Metrics columns fill during the Meta loop (§6).
- Keep a **client-simple view** (status, spend, CPA, ROAS, decision) and an **internal full view** (all diagnostics) — same sheet, two tabs.

**Output:** Named delivery folder + populated tracker (cols 1–7). **Time: ~30 min.**

---

## 6. META ITERATION LOOP + Bi-Weekly Strategy Call

**Goal:** Launch the 24, read the right metric at the right time, kill/scale/iterate, and feed survivors into the next cycle. This mirrors spec §4 — execution detail here.

### 6.1 The loop (D4 → D14)

| Day | Action |
|---|---|
| **D4** | Launch all 24. **ABO testing campaign**, ad sets grouped **by angle**, per-ad-set budget floor so each creative clears the spend gate. Names per §5 |
| **D5–7** | **Hands off — learning phase.** Ignore hour-1 noise; let ad sets exit learning |
| **D8** | **First read + first kills.** Read **thumb-stop + hold** *after* each creative clears **~$20–30 / ~2,000 impressions** (spec spend gate) |
| **D10** | **Second read + scale decision.** Read **CTR + CPA/ROAS**. Expect **2–5 scalers of 24** |
| **D11–13** | Scale winners: budget up in **≤20–30% daily steps** or duplicate into fresh ad sets/audiences. Draft next cycle from survivors |
| **D14** | Retro: log all 24 to the tracker, promote winners to next-cycle baselines, run the strategy call |

### 6.2 Decision rules (from spec §4 — the quick-reference)

- **Thumb-stop < 25%** → hook/first-frame failed → **kill**, retire that hook for that avatar.
- **Thumb-stop OK but hold < 20%** → body/format wrong → keep hook, **swap format** next cycle.
- **Thumb-stop + hold OK but CTR < 0.8%** → CTA mismatch → keep creative, **test new CTA**.
- **All 3 gates pass + viable CPA/ROAS** → **scale.**
- **Fatigue:** frequency > ~2.5–3.0 or CPA up ~20–30% w/w → rotate down as new scalers ramp.

> Always gate on spend first. A creative below ~$20–30 / ~2,000 impressions is noise — do not judge it.

### 6.3 Bi-weekly strategy call agenda (45–60 min, D14)

1. **Results readout (10 min):** the 24, ranked on the diagnostic stack. Scalers, kills, the surprise.
2. **What the data taught us (10 min):** which **angle / hook / format / CTA** won — patterns, not anecdotes. Tie to the tracker.
3. **Spend + scale plan (10 min):** which winners scale, to what budget, into which audiences.
4. **Next cycle's 24-grid (10 min):** promote winners to baselines; confirm angle weighting from any AOV/offer change; assign the 12 hooks.
5. **Brand/offer/compliance changes (5 min):** new promo, new claims, new product, seasonal angle.
6. **Action items + dates (5 min):** D0 of next cycle, asset refreshes needed, owner per item.

**Output:** Updated tracker (full metrics + decisions), next-cycle grid drafted, scale executed. **Time: ~60 min call + ~30 min prep.**

---

## 7. TIME BUDGET + Where to Add Help First

### 7.1 Time per station — one 24-pack, solo

| Station | Task | Time (cycle 1) | Time (steady-state) |
|---|---|---|---|
| §1 Intake | Brief + assets | ~90 min | ~15 min (refresh) |
| §2 Scripting | Plan + 24 scripts + edit | ~75 min | ~60 min |
| §3 Generation | Render + QA 24 | ~120 min | ~90 min |
| §4 Post | Caption/hook/b-roll/music/ratios + compliance ×24 | ~210 min | ~180 min |
| §5 Delivery | Name, package, tracker | ~30 min | ~30 min |
| §6 Launch | Build campaign, launch 24 | ~45 min | ~30 min |
| §6 Loop reads | D8 + D10 reads + scaling | ~60 min | ~45 min |
| §6 Strategy call | Prep + call | ~90 min | ~90 min |
| **TOTAL / 24-pack** | | **~12 hrs** | **~9–9.5 hrs** |

**Reality check:** A single 24-pack is roughly **a day to a day-and-a-half of focused solo work**, front-loaded into the D1–3 production sprint (scripting + generation + post ≈ 7 hrs). **Post (§4) is ~40% of the time** and the first bottleneck. One operator can realistically run **3–4 brands on staggered 2-week cycles** before quality slips.

### 7.2 Where to add a VA / contractor first (hire order)

1. **First hire — Post / Editor VA (§4).** Biggest time sink, most templatable. You set the caption style, hook-card rule, b-roll library, music list, and export presets; they execute all 24. **Frees ~3 hrs/pack — the single highest-leverage hire.** You keep the compliance re-read until they're trusted.
2. **Second hire — Generation operator (§3).** Once avatars + brand kits are set, rendering + QA is a checklist. They render and QA; you approve casting per angle. Frees ~1.5 hrs/pack.
3. **Third — Ads-manager VA (§6 mechanics).** Campaign build, launch, pulling the D8/D10 numbers into the tracker. They do the *mechanics*; **you keep the kill/scale judgment.**
4. **Keep in-house (the moat):** **scripting strategy (§2 Prompt A grid plan), avatar casting logic, the kill/scale decisions, and the strategy call.** These are the judgment layer — the spec's "moat." Never outsource them until you have a trained creative strategist, not a VA.

**Scaling principle:** Productize each station into a **checklist + template + asset library** before you hand it off. A station you can't write down, you can't delegate — and the whole system is built so every station *is* written down (this doc).

---

## 8. Station Checklist (tear-off)

- [ ] §1 Brand Brief complete; assets in folder; winners-from-last-cycle logged
- [ ] §2 Prompt A grid plan approved (4 angles, 12 hooks, one-lever-per-cell)
- [ ] §2 24 scripts written + human-edited to word-count + voice
- [ ] §3 2–4 avatars cast to angle map; 24 rendered; QA gate passed; re-rolls done
- [ ] §4 24 edited: captions + hook-card + b-roll + music
- [ ] §4 exported 9:16 + 4:5; face/captions inside 4:5 safe-zone
- [ ] §4 **compliance re-read** on every clip's captions + on-screen text
- [ ] §5 every file named `BRAND_ANGLE_HOOK_FORMAT_LEN_vNN`; tracker cols 1–7 pre-filled
- [ ] §6 launched: ABO test campaign, ad sets by angle, spend floors, names matched
- [ ] §6 D5–7 hands-off; D8 thumb-stop/hold kills (post spend-gate); D10 CTR/CPA scale
- [ ] §6 winners promoted to next baselines; all 24 logged to tracker
- [ ] §6 strategy call run; next cycle's D0 + grid set
```
