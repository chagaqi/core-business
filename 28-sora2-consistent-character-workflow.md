# 28 — Sora 2 Consistent-Character UGC Workflow (current working method)

**Source:** Marketing Mafia — *The Anti-Slop AI UGC System*, Module 02 (Sora Consistent Characters), ingested 2026-05-30 via the `LLM COURSES/ugc-agency-brain` converter. **Single-source, confidence: medium** — this is what's working in the wild *right now*, not gospel; validate the deltas in first production (see §Validation). Real-world tradecraft from a current course, per Chaga.

**What it is:** the cinematic, product-in-hand, *consistent-character* method. It **complements, doesn't replace** the Arcads talking-head workflow in `production-sop.md`. Use Arcads for fast talking-head volume; use this for cinematic, character-led, product-forward spots where consistency across a batch is the whole game.

---

## Why this matters — the anti-slop angle

The #1 "AI is slop" tell is **inconsistency**: the face/character morphs between clips and the product label warps or re-renders into nonsense. This workflow locks **both the character and the product at generation time**, then reuses them — so an entire batch looks like one real creator filming one real product. That consistency *is* the moat against the slop objection we sell against. It's the production-side proof of "AI + brand context, not generic AI."

---

## The 5-step workflow

1. **Lock the product (the "product prompt").** Upload the product image to ChatGPT/Claude and generate a **≤500-character, pixel-perfect** product description from a fixed template — exact container, label layout, every text line, colors, finish — and command: *"no redesign, recolor, or artistic reinterpretation; typography and proportions pixel-perfect to the image."* This is what stops the label from warping.

2. **Embed the product AT generation time (THE critical insight).** Paste the product description **into the character prompt** and upload the product image during the **initial** character generation in the Sora 2 app — *not* afterward. Sora 2 does **not** reliably honor a product image added post-creation. The character must be generated *already holding* the product.

3. **Mint the character asset.** When the first video renders: three-dots menu → **"Generate Character"** → **publish it public.** Treat this first generation as *infrastructure* (a reusable asset), not a deliverable. It's a one-time setup cost that amortizes across unlimited clips.

4. **Reuse by tagging.** For every subsequent clip, keep the base prompt **identical** and just **tag the published character reference** instead of re-describing them. Change **only two things: the character's actions + the script/dialogue.** Everything else stays locked → consistency across the whole batch.

5. **Product-out scenes.** To show the character without the product, add *"[character] holds nothing in their hand"* to the prompt, or have an LLM strip the product line.

**Tooling:** mint the character on the official **Sora 2 app**; batch the subsequent clips through **kie.ai** (a Sora API layer) for volume. (Cost note for the deferred tool stack: Sora 2 access + kie.ai credits — price these when the money stack goes live; this is a different rig than Arcads.)

---

## How it plugs into the 4×24 Framework

- Sora 2 consistent-character is the **production method for the cinematic / character-led / testimonial-style formats** in `4x24-framework-spec.md`. Arcads stays the fast lane for talking-head volume.
- **One minted character per brand-avatar = the reusable asset.** The 24 variations per 2-week cycle then vary *action + dialogue* (i.e., hook / angle / CTA) against that locked character+product. This is what makes "24 variations" both *cheap* and *consistent* — exactly the 4×24 economics.
- The **product-prompt** for each client SKU gets stored in the brand brief (`production-sop.md` §1 intake), so every cycle reuses it.

---

## ⚠️ FTC-safe boundary — what we take vs. reject

- **TAKE:** the mechanics only — product-prompt template, embed-at-generation, character-mint-and-reuse, change-only-action+dialogue.
- **REJECT:** the course's worked *example* — a fabricated "grandmother" delivering a fake "organic" testimonial for a male-enhancement supplement, engineered to *conceal* that it's AI. That's the deceptive, FTC-violating slop we are positioned against (and Chaga's own knowledge engine correctly **discarded** it at 0.95 confidence). We use this workflow for **real products, honest demonstrations, and substantiated claims only** — no fabricated-authority testimonials, no concealment, no disease/enhancement claims. This boundary is the same compliance gate already in the offer and SOP.

---

## Reusable templates (FTC-safe, functional-consumables)

### Product-prompt template
> Use the image I uploaded and generate a detailed product description following the EXACT template below. Do not change any colors, text, proportions, or design elements. Describe everything exactly as it appears. Keep it ≤500 characters.
> **TEMPLATE:** *[character] holds the real [size] "[PRODUCT NAME]" [container] — [color / material / finish]. The label [layout: where the wordmark sits, the exact text lines, colors, any stripe/graphic]. All typography, proportions, and artwork must remain pixel-perfect to the image with no redesign, recolor, or reinterpretation. Soft daylight reflections across the [surface] reveal its realism.*

**Worked example (MycoMornings, our sample brand):**
> *She holds a real 12oz matte-black "MycoMornings" stand-up coffee pouch with a kraft-brown bottom third. Centered: the white "MycoMornings" wordmark above a small line-art mushroom. Below in white: "LION'S MANE · CHAGA · CORDYCEPS — Calm Focus Coffee." Typography and proportions pixel-perfect to the image; no redesign or recolor. Soft daylight reflections across the matte pouch reveal its realism.*

### Character-prompt scaffold (honest demo / real-customer style)
> Casual, selfie-style iPhone front-camera vertical (9:16), cozy well-lit kitchen. **Character:** [age / look / wardrobe — a believable *real customer*, never a fabricated authority figure]. Holds [product, per the product-prompt above]. **Cinematography:** medium close-up, ~24mm, subtle natural handheld sway, warm window light, HDR auto-tone, natural skin texture, no filters, 1080×1920 30fps. **Actions:** [beat 1 + honest line], [beat 2 + honest line]. **Audio:** clear voice, faint room ambience, one continuous take. **UGC keywords:** handheld realism, direct-to-camera, conversational, single continuous take. **Negatives:** subtitles, captions, watermark, text overlays, warped label, distorted hands, inconsistent character, audio-sync issues, oversaturation.

---

## Validation (do this in the first real production run)

Single-source course claim — measure these before trusting the time estimates in `production-sop.md`:
1. Does product-label fidelity actually hold across tagged-character reuse, clip after clip?
2. Max clip length / how many reuses before character consistency drifts?
3. Sora 2 (app) + kie.ai batch throughput per hour → update the SOP's per-cycle time math.
4. Disclosure/compliance: confirm the spot reads as honest AI creative (no concealment), claims substantiated.
