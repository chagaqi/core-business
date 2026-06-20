---

# Sora-Native Shoot Sheets — Starter Portfolio Set

**For:** Chaga Chai, founder · AI-Native UGC ad agency
**Built:** 2026-05-30 · sample/portfolio brands (fictional)
**Method source:** `28-sora2-consistent-character-workflow.md` (own-pipeline Sora 2 + kie.ai) · `4x24-framework-spec.md` (angles, hook bank, naming) · `19-creative-scripts.md` (the 72 scripts these reuse-prompts adapt)

## How to use this kit (read once)

Each of the 3 brands below is a **complete turnkey render kit**: 1 PRODUCT-PROMPT + 1 CHARACTER-MINT prompt + 4 REUSE prompts. Run them in this exact order — the order *is* the method:

1. **PRODUCT-PROMPT** → paste into ChatGPT/Claude *with the product image* to lock the ≤500-char pixel-perfect label description. (These brands are fictional, so a plausible clean label is invented and described concretely below — when you do this for a *real* prospect, you'd upload their actual product shot and regenerate.)
2. **CHARACTER-MINT prompt** → paste into the **Sora 2 app** for the *initial* generation, with the product description embedded and product image uploaded **at generation time** (doc 28's critical insight — Sora won't honor a product image added later). When it renders: three-dots → **Generate Character** → **publish public**. This first clip is *infrastructure*, not a deliverable.
3. **4 REUSE prompts** → for every subsequent clip, **tag the published character**, keep the base block identical, and change **only action + dialogue**. Batch these through **kie.ai** for volume. The 4 reuse prompts cover all four 4×24 angles so practice doubles as a balanced portfolio.

**Naming convention** (`4x24-framework-spec.md` §5): `BRAND_ANGLE_HOOK_FORMAT_LEN_vNN`. The character-mint asset is labeled `BRAND_CHAR_v01` (infrastructure, not a deliverable). Format token for cinematic character clips is `SS` (the doc's character-led/product-forward path); these are the Sora-lane siblings of the Arcads scripts in doc 19.

**FTC-safe boundary (locked):** real-looking customer, honest demonstration, experience-framed benefits ("calm focus," "quieter racing mind," "less afternoon bloat") — never disease/treat/cure/enhancement claims, never a fabricated authority figure, never concealment. Claims here are pulled verbatim/near-verbatim from the doc 19 scripts, which already passed the compliance gate. **Negatives block kills the slop tells** (warped label, morphing face, distorted hands).

> ⚠️ **Validation (doc 28 §Validation):** these are single-source course mechanics. On your first real run, confirm: (1) label fidelity holds clip-after-clip on tagged reuse; (2) how many reuses before the face drifts; (3) kie.ai throughput/hr. Practice on these 3 fictional brands first — don't burn real prospects on rough early renders.

---

# BRAND 1 — MycoMornings (mushroom coffee · $39)

**Token:** `MYCO` · **Avatar:** 35-42 burnt-out tech/knowledge worker; coffee jitters + a 2:30-3pm crash; wants focus without the spike. **AOV:** $39 (low-mid → PAS leads, Founder + Mechanism pull weight).

### (a) PRODUCT-PROMPT — `MYCO` SKU lock
*Paste into ChatGPT/Claude with the product image. Invented plausible label described concretely; ≤500 chars.*

> Use the image I uploaded and generate a product description from the EXACT template below. Do not change any colors, text, proportions, or design. Keep it ≤500 characters.
> **TEMPLATE:** He holds a real 12oz matte-black "MycoMornings" stand-up coffee pouch with a kraft-brown bottom third. Centered: the white "MycoMornings" wordmark above a small white line-art mushroom. Below in white caps: "LION'S MANE · CHAGA · CORDYCEPS" then thin italic "Calm Focus Coffee · 30 cups." All typography, proportions, and artwork pixel-perfect to the image — no redesign, recolor, or reinterpretation. Soft daylight reflections across the matte pouch reveal its realism.

### (b) CHARACTER-MINT — `MYCO_CHAR_v01` (infrastructure, publish public)
*Paste into the Sora 2 app for the INITIAL generation. Embed the product line above + upload the product image NOW. Full cinematography + negatives block from doc 28.*

> Casual, selfie-style iPhone front-camera vertical (9:16), cozy well-lit home kitchen, warm morning light.
> **Character:** a real-looking 38-year-old man, burnt-out-but-relieved knowledge-worker energy — slight stubble, casual grey henley, relaxed, NOT a polished spokesperson. He holds a real 12oz matte-black "MycoMornings" stand-up coffee pouch with a kraft-brown bottom third; centered white "MycoMornings" wordmark above a small white line-art mushroom; below in white caps "LION'S MANE · CHAGA · CORDYCEPS" then thin italic "Calm Focus Coffee · 30 cups." Typography and proportions pixel-perfect to the image, no redesign or recolor.
> **Cinematography:** medium close-up, ~24mm, subtle natural handheld sway, warm window light, HDR auto-tone, natural skin texture, no filters, 1080×1920 30fps.
> **Actions:** he glances at the pouch in his hand, then looks to camera with an easy half-smile and says, "This is the coffee I actually made for myself." Beat two: he scoops the powder into a mug.
> **Audio:** clear conversational voice, faint room ambience, one continuous take.
> **UGC keywords:** handheld realism, direct-to-camera, conversational, single continuous take.
> **Negatives:** subtitles, captions, watermark, text overlays, warped label, distorted hands, inconsistent character, audio-sync issues, oversaturation.

> After render: three-dots → **Generate Character** → **publish public**. Tag `@MYCO_CHAR_v01` in all 4 reuse prompts below.

### (c) 4 REUSE PROMPTS — same character, change ONLY action + dialogue
*Base block identical to the mint; tag the published character instead of re-describing. Dialogue pulled from the best doc-19 lines, kept honest/claim-safe.*

**1 · PAS — `MYCO_PAS_H01_SS_30_v01__247crash`** (adapted from doc 19 `MYCO_PAS_H01_TH_30`)
> Tag `@MYCO_CHAR_v01`, holding the MycoMornings pouch. Same kitchen, cinematography, and negatives block as the mint.
> **Action:** opens slumped at the kitchen counter rubbing his temples by a half-empty mug, then sits up and brightens as he lifts the pouch; one beat scooping powder into a mug.
> **Dialogue (one continuous take):** "POV: it's 2:47pm and the crash just hit again — two cups in, wired AND exhausted. So I swapped my morning coffee for this: MycoMornings, lion's mane, chaga, and cordyceps. Tastes like real coffee, but no jittery spike and no 2 o'clock nosedive — just calm, steady focus, and it's easier on my stomach. A bag's thirty-nine dollars, basically a month of mornings. Tap shop now and try it."

**2 · Founder/Origin — `MYCO_FND_H05_SS_30_v01`** (adapted from doc 19 `MYCO_FND_H05_TH_30`)
> Tag `@MYCO_CHAR_v01`, holding the pouch. Same base block.
> **Action:** seated at the counter, direct eye contact, holding the pouch from frame one; one b-roll beat scooping into a mug at the mid-point.
> **Dialogue:** "I built MycoMornings because I was sick of choosing between my focus and my heart racing. I'm a software guy — four coffees a day, wired and anxious by 10am, then flattened by 2:30. So I started blending lion's mane, chaga, and cordyceps into my morning cup, and the difference was the calm. Same focus, none of the jitters, and my stomach stopped hating me. One bag's thirty mornings for thirty-nine bucks. If your coffee makes you anxious, try mine — link's right here."

**3 · Mechanism — `MYCO_MECH_H07_SS_30_v01`** (adapted from doc 19 `MYCO_MECH_H07_TH_30`)
> Tag `@MYCO_CHAR_v01`. Same base block. Holds nothing for the first beat (per doc 28 §5, add "holds nothing in his hand"), then picks up the pouch.
> **Action:** talks to camera empty-handed for the explainer open, leans in slightly on the mechanism line, then picks up the pouch and holds it label-out for the back half.
> **Dialogue:** "Here's why lion's mane hits your brain different than regular coffee. Normal coffee is just caffeine — it spikes your adrenaline, gives you the jitters, then drops you off a cliff at 3pm. Lion's mane isn't a stimulant; it supports the focus pathways, so the clarity is smooth instead of wired. Then chaga and cordyceps add steady energy with no spike and crash. That's the whole reason I switched my morning cup to MycoMornings. Go grab a bag — link's right here."

**4 · Proof/Transformation — `MYCO_TRAN_H03_SS_30_v01__30days`** (adapted from doc 19 `MYCO_TRAN_H03_TH_30`)
> Tag `@MYCO_CHAR_v01`. Same base block. Holds a plain neutral mug for the first 3s, reveals the pouch when ingredients are named.
> **Action:** cold-opens on his face with a plain mug to read as a real testimonial, then reveals the MycoMornings pouch around the ingredient line; small genuine pauses.
> **Dialogue:** "I drank mushroom coffee every morning for 30 days — here's what actually changed. Day one I just missed my regular coffee. But by day four the shaky, wired feeling was gone — no jitters. Then around day eleven it hit me: 2:30 and I hadn't crashed. It's got lion's mane, chaga, and cordyceps, so you get calm, steady focus instead of the spike-and-crash, and my stomach actually feels fine. Thirty days in, I'm not going back. If the jitters and the afternoon crash are your whole life right now, just try it — link's right here."

---

# BRAND 2 — ZenChews (ashwagandha + L-theanine gummies · $34)

**Token:** `ZEN` · **Avatar:** 32-40 stressed professional, female-skew; racing mind / "tired but wired" at night; wants to wind down without melatonin grogginess. **AOV:** $34 (low → PAS leads; Mechanism + Founder support).

### (a) PRODUCT-PROMPT — `ZEN` SKU lock
> Use the image I uploaded and generate a product description from the EXACT template below. Do not change any colors, text, proportions, or design. Keep it ≤500 characters.
> **TEMPLATE:** She holds a real 60-count frosted-white "ZenChews" gummy jar with a soft sage-green lid. Centered on a sage label: the deep-navy "ZenChews" wordmark above a thin crescent-moon line-art. Below in navy caps: "ASHWAGANDHA + L-THEANINE" then thin italic "Calm Mind Gummies · 30 nights." A small "60 gummies" tag sits bottom-right. All typography, proportions, and artwork pixel-perfect to the image — no redesign, recolor, or reinterpretation. Soft lamp-light reflections across the frosted jar reveal its realism.

### (b) CHARACTER-MINT — `ZEN_CHAR_v01` (infrastructure, publish public)
> Casual, selfie-style iPhone front-camera vertical (9:16), cozy warm bedroom or kitchen at night, soft evening lamp light.
> **Character:** a real-looking 35-year-old woman, relatable stressed-professional energy — soft no-makeup-makeup look, cozy knit, warm and a little tired, NOT a polished influencer. She holds a real 60-count frosted-white "ZenChews" gummy jar with a soft sage-green lid; centered sage label with deep-navy "ZenChews" wordmark above a thin crescent-moon line-art; below in navy caps "ASHWAGANDHA + L-THEANINE" then thin italic "Calm Mind Gummies · 30 nights"; small "60 gummies" tag bottom-right. Typography and proportions pixel-perfect to the image, no redesign or recolor.
> **Cinematography:** medium close-up, ~24mm, subtle natural handheld sway, warm lamp light, HDR auto-tone, natural skin texture, no filters, 1080×1920 30fps.
> **Actions:** she turns the jar gently in her hand, looks to camera with a calm, confiding half-smile, and says, "These are the ones I actually wind down with." Beat two: she taps two gummies into her palm.
> **Audio:** clear soft conversational voice, faint quiet-room ambience, one continuous take.
> **UGC keywords:** handheld realism, direct-to-camera, conversational, single continuous take.
> **Negatives:** subtitles, captions, watermark, text overlays, warped label, distorted hands, inconsistent character, audio-sync issues, oversaturation.

> After render: three-dots → **Generate Character** → **publish public**. Tag `@ZEN_CHAR_v01` in all 4 reuse prompts.

### (c) 4 REUSE PROMPTS

**1 · PAS — `ZEN_PAS_H01_SS_30_v01`** (adapted from doc 19 `ZEN_PAS_H01_TH_30`)
> Tag `@ZEN_CHAR_v01`, holding the ZenChews jar. Same warm-bedroom base block + negatives.
> **Action:** half-lit against a headboard, phone glow on her face for the open, then sets the phone down and brings the jar in from the nightstand; taps two gummies into her palm near the end.
> **Dialogue:** "POV: it's 11:47pm and your brain just decided now is the time to replay every awkward thing you've ever said. Body's exhausted, but the mind won't shut up — tired AND wired. I did that nightly for years. Then I started taking these about an hour before bed. They're ashwagandha plus L-theanine — the ashwagandha takes the edge off the stress, the L-theanine quiets the racing without knocking you out. No grogginess, no melatonin hangover, just my brain finally agreeing to log off. They're ZenChews — tap the link and try them."

**2 · Founder/Origin — `ZEN_FND_H05_SS_30_v01__sickofwired`** (adapted from doc 19 `ZEN_FND_H05_TH_30`)
> Tag `@ZEN_CHAR_v01`, holding the jar naturally. Same base block.
> **Action:** seated in a warm kitchen doorway, calm eye contact, holds the jar around the ingredient line (never a hard product showcase).
> **Dialogue:** "I built ZenChews because I was so sick of lying in bed wired at 1am. I had the kind of job where my brain just would not clock out. I tried melatonin, but I'd wake up groggy and foggy, which defeated the point. So I went the other way — a gummy around ashwagandha and L-theanine, the two things that help your nervous system downshift instead of knocking you out. I take two about forty minutes before bed and my racing mind just gets quieter. One jar's thirty-four dollars and lasts the month. If your brain won't shut up at night, this is the one I made for you."

**3 · Mechanism — `ZEN_MECH_H07_SS_30_v01`** (adapted from doc 19 `ZEN_MECH_H07_TH_30`)
> Tag `@ZEN_CHAR_v01`. Same base block. "Holds nothing in her hand" for the explainer open, then picks up the jar in the last beats.
> **Action:** talks to camera empty-handed, conversational hand gestures, picks up the jar only in the final ~4s.
> **Dialogue:** "Here's why L-theanine plus ashwagandha hits completely different than melatonin. Melatonin just forces you unconscious, and then you're up at 3am groggy — that's not actually calm. L-theanine is the amino acid in green tea; it raises your alpha brain waves, the same state as meditating, so your racing mind quiets down — calm, but not drugged. Then the ashwagandha works on the cortisol side — your stress hormone — that stuck-high, wired-but-tired feeling. One slows the chatter, the other lowers the stress chemical. That's why two ZenChews after dinner actually lets me put my phone down. Link's right there."

**4 · Proof/Transformation — `ZEN_TRAN_H03_SS_30_v01`** (adapted from doc 19 `ZEN_TRAN_H03_TH_30`)
> Tag `@ZEN_CHAR_v01`. Same base block. Cold-opens on her face; quick beat popping one gummy from the jar mid-clip.
> **Action:** cozy loungewear, warm low lamp; calm confessional delivery, one cutaway popping a gummy from the jar, then back to face.
> **Dialogue:** "I took these every night for 30 days, and the thing that changed wasn't what I expected. I'm a chronic 11pm overthinker — I'd get in bed and my brain would start tomorrow's meeting, the email I forgot, all of it. Week one I just noticed I put my phone down earlier. By day ten the racing thoughts at night got quieter. It's ashwagandha and L-theanine, so it's not knocking you out like a sleep pill — it just takes the edge off so you can wind down. Thirty days in, I get in bed and I'm not bracing for the spiral anymore. If your brain won't shut up at night, these are ZenChews — link's right here."

---

# BRAND 3 — DailyGreens24 (greens powder · $59)

**Token:** `DG24` · **Avatar:** 35-45 health-optimizer, been-burned ("tried 5 greens powders"); 3pm bloat + crash; #1 objection is taste/clumping. **AOV:** $59 (high → Founder + Mechanism weighted; demo-as-proof de-risks the ticket).

### (a) PRODUCT-PROMPT — `DG24` SKU lock
> Use the image I uploaded and generate a product description from the EXACT template below. Do not change any colors, text, proportions, or design. Keep it ≤500 characters.
> **TEMPLATE:** She holds a real 30-serving matte-white "DailyGreens24" tub with a deep-forest-green lid. Wrapping the tub, a forest-green label: the white "DailyGreens24" wordmark above a small white line-art leaf-and-sun. Below in white caps: "GREENS · GUT · STEADY ENERGY" then thin italic "Superfood Blend · 30 servings." A bottom band reads "no grass aftertaste." All typography, proportions, and artwork pixel-perfect to the image — no redesign, recolor, or reinterpretation. Soft daylight reflections across the matte tub reveal its realism.

### (b) CHARACTER-MINT — `DG24_CHAR_v01` (infrastructure, publish public)
> Casual, selfie-style iPhone front-camera vertical (9:16), bright real home kitchen, soft natural daylight.
> **Character:** a real-looking 40-year-old woman, grounded health-optimizer / label-reader energy — clean athleisure, no glam, credible "I've tried everything" reviewer vibe, NOT a polished influencer. She holds a real 30-serving matte-white "DailyGreens24" tub with a deep-forest-green lid; forest-green wrap label with white "DailyGreens24" wordmark above a small white line-art leaf-and-sun; below in white caps "GREENS · GUT · STEADY ENERGY" then thin italic "Superfood Blend · 30 servings"; bottom band "no grass aftertaste." Typography and proportions pixel-perfect to the image, no redesign or recolor.
> **Cinematography:** medium close-up, ~24mm, subtle natural handheld sway, warm window light, HDR auto-tone, natural skin texture, no filters, 1080×1920 30fps.
> **Actions:** she sets the tub on the counter, looks to camera with a slightly skeptical-turned-convinced half-smile, and says, "This is the only greens I've actually finished." Beat two: she scoops powder into a clear glass of plain water.
> **Audio:** clear conversational voice, faint kitchen ambience, one continuous take.
> **UGC keywords:** handheld realism, direct-to-camera, conversational, single continuous take.
> **Negatives:** subtitles, captions, watermark, text overlays, warped label, distorted hands, inconsistent character, audio-sync issues, oversaturation.

> After render: three-dots → **Generate Character** → **publish public**. Tag `@DG24_CHAR_v01` in all 4 reuse prompts. (The clear-glass / plain-water scoop is load-bearing for this brand — it visually answers the taste/clump objection. Keep it in the reuse beats.)

### (c) 4 REUSE PROMPTS

**1 · PAS — `DG24_PAS_H01_SS_30_v01`** (adapted from doc 19 `DG24_PAS_H01_TH_30`)
> Tag `@DG24_CHAR_v01`, tub in hand. Same kitchen base block + negatives.
> **Action:** talks to camera at the counter; quick cutaway scooping green powder into a clear glass of plain water and a clean stir (no clumps), then back to face.
> **Dialogue:** "POV: it's 3pm, you're bloated, exhausted, and you still haven't eaten a single vegetable today. I used to just accept that — coffee number three, waistband digging in, brain fried. It's not that you're lazy; you're running on basically zero nutrients. I started doing one scoop of DailyGreens24 every morning and within a week the afternoon bloat just stopped. It's greens, gut support, steady energy — everything I never eat enough of, in one glass — and it actually tastes good, not grassy or chalky. Thirty servings, about two dollars a day. Shop at the link and see how different 3pm feels."

**2 · Founder/Origin — `DG24_FND_H05_SS_30_v01`** (adapted from doc 19 `DG24_FND_H05_TH_30`)
> Tag `@DG24_CHAR_v01`, holding the tub low in frame from the first second. Same base block.
> **Action:** cold-open on face, tub held low; one genuine eye-contact beat at the "graveyard of tubs" line; fast cut only on the ingredient line.
> **Dialogue:** "I built DailyGreens24 because I'd already thrown out four other greens powders. Every one tasted like I was drinking a lawn, so I'd use it twice and let it die in the back of the cabinet — and the whole time I'm bloated by 2pm, dragging by 3. So I stopped waiting for someone to fix it and made the one I actually wanted: real greens for the gut and the bloating, steady energy that doesn't crash, and it tastes good enough that I drink it every morning. One tub is thirty servings. If you've got a graveyard of tubs like I did, this is the one that stays."

**3 · Mechanism — `DG24_MECH_H06_SS_30_v01`** (adapted from doc 19 `DG24_MECH_H06_TH_30`)
> Tag `@DG24_CHAR_v01`. Same base block. "Holds nothing in her hand" for the open, then a single tub-in-hand reveal + one scoop-into-water shot.
> **Action:** talks to camera empty-handed, "I figured something out" energy; reveals tub in-hand at the mechanism beat, one subtle scoop-into-water.
> **Dialogue:** "Most greens powders are missing the one ingredient that actually does anything. They load up on the green stuff for the photo, then skip the part that makes it work in your gut. Here's what nobody tells you: if there's no prebiotic fiber, the nutrients just kind of pass through you — that's why you can drink greens for a month and still feel bloated and flat by 2pm. This one has the prebiotic fiber AND the digestive enzymes, so your body actually absorbs it, plus adaptogens for steady energy, not a caffeine spike. And it tastes like something you'd actually drink. If you've tried greens before and felt nothing, this is probably the ingredient you were missing — shop it at the link."

**4 · Proof/Transformation — `DG24_TRAN_H03_SS_30_v01`** (adapted from doc 19 `DG24_TRAN_H03_TH_30`)
> Tag `@DG24_CHAR_v01`. Same base block. Cold-open on face; product-in-hand insert (scoop into water, stir, color settle) when she names the brand.
> **Action:** phone propped at the counter, looking into lens conversationally; whip-cut on each of the "3 things"; brief scoop-stir insert at the brand line.
> **Dialogue:** "I drank this greens powder every morning for 30 days, and three things genuinely surprised me. First, the bloating — I'm that person whose stomach felt puffy by 2pm no matter what; around week two that quieted down. Second, my energy stopped doing the rollercoaster thing — no big 3pm crash. And third, the one I didn't expect: it actually tastes good. Every greens I'd tried before tasted like wet grass, so I'd quit by day four. It's DailyGreens24 — one scoop, water, done. A tub's about fifty-nine dollars and lasts the whole month. If you also 'know you don't eat enough veg,' just try the 30 days — tap the link and grab a tub."

---

## Cross-brand notes for the founder

- **Why these specific hooks per angle:** each reuse prompt pulls the doc-19 **baseline/control (V01)** hook for its angle — `H01` (PAS, sharpest symptom trigger), `H05` (Founder origin), `H06`/`H07` (Mechanism curiosity-gap), `H03` (30-day transformation). These are the validated anchors; once you have render reps, mint hook-test variants (β/γ) by changing *only the dialogue* and bumping `vNN`.
- **One-lever discipline carries into Sora:** the whole reuse method *is* "change only action + dialogue." That maps cleanly to the framework's "change ONE primary lever per variation" — here the locked character+product+cinematography is your constant, dialogue is your variable.
- **Product-out scenes:** the Mechanism prompts use doc 28 §5's `"holds nothing in their hand"` for the empty-handed explainer open, then reveal the product — this is the intended way to get a clean character-only beat without re-minting.
- **Portfolio framing for the pitch:** these 12 clips (3 brands × 4 angles) are a *balanced* book — every prospect sees their angle covered, and the consistent character + un-warped label across a batch is the literal anti-slop proof you sell against. Keep the fictional-brand origin honest if asked ("portfolio demos built to show the method"); swap in a real prospect's product image + regenerated product-prompt only once your renders are clean (per the locked context: don't burn real prospects on rough early output).
- **Files referenced (absolute):** `C:\Users\dylan\Documents\axiom-balloon\Core Business\28-sora2-consistent-character-workflow.md`, `…\4x24-framework-spec.md`, `…\19-creative-scripts.md`, `…\production-sop.md`.