# Gemini prompt pack — Tideover papercraft art

Paste-ready prompts for Gemini image generation. Every prompt starts with the same STYLE BLOCK so the set reads as one hand. Generate 2–4 variants per asset, pick the cleanest fold geometry, and keep generating in the **same conversation** so the style stays consistent across assets.

## The style block (prepend to every prompt)

> Papercraft origami style: crisply folded matte paper with visible fold creases and flat facets, subtle paper grain, soft studio light from the upper left, gentle contact shadows. Palette: warm off-white sand paper (#FBF8F2) background, deep sea-teal paper (#0E5366), one small terracotta accent (#D9762F), nothing else. Minimal, calm composition with generous negative space. No text, no letters, no watermark, no gloss, no plastic 3D-render look, no gradients — it must read as real folded paper photographed cleanly.

## 1. Hero / OG art — the boat (16:9, also make one 1:1)

> [style block] A small origami paper boat — the classic folded newspaper-boat silhouette with a terracotta sail facet — riding layered zigzag paper waves. Three to four pleated wave bands in tints of sea-teal and sand, folded like accordion paper, overlapping so the boat sits IN the water. The boat is small against the sea but clearly in control, calm harbor mood, not a storm. Wide 16:9 composition with the boat right-of-center and clear empty sand-paper sky occupying the upper-left third.

Usage: the upper-left negative space is where the headline overlays on the OG/social card. The website hero itself is code-drawn (being built now) — this art is for share cards, decks, and anywhere static.

## 2. Capability icon set (six icons, 1:1 each)

Use this skeleton, swapping only the [SUBJECT] line. Ask Gemini after the first one: "keep this exact style, lighting, and scale for the next icon."

> [style block] A single origami paper icon centered on a plain sand-paper background, square 1:1 composition, the object built from 5–10 clean folded facets, sea-teal paper with one small terracotta accent facet. [SUBJECT]

The six subjects:
1. `An origami envelope with a raised folded flag on top — an inbox that flags what matters.`
2. `An origami warning pennant / signal flag on a short folded mast — risk that gets flagged early.`
3. `An origami winding route or map with a folded location marker — a journey a customer can follow.`
4. `An origami gift box with folded ribbon — a small goodwill gesture.`
5. `An origami spyglass / telescope angled upward — seeing the wave of questions before it lands.`
6. `An origami clipboard or folded report sheet with a simple folded bar-chart — the day-zero baseline.`

Usage: these go in the six capability cards + the mega-menu. Same background, same scale, same light = a set. Sand background beats transparent (paper shadows survive; I composite them).

## 3. Empty-state art (app, 4:3)

> [style block] A tiny origami paper boat resting on one gentle pleated teal wave band, vast calm sand-paper sky above, extremely minimal — a quiet harbor with nothing to do. Small boat, low horizon, 4:3 composition.

Usage: the inbox zero-state ("queue is clear") and the pre-import onboarding screens.

## 4. The long-wait timeline spot (wide 3:1)

> [style block] A horizontal series of five origami paper waypoints along a folded paper path from left to right — a folded flag, an envelope, a gear made of paper facets, a box, a boat arriving at a small paper harbor — connected by a creased paper line. Wide 3:1 banner composition on sand paper.

Usage: the how-it-works pipeline strip and email headers.

## Workflow notes

- Export the largest PNG Gemini offers; never screenshot.
- Name files exactly: `hero-boat-16x9.png`, `hero-boat-1x1.png`, `icon-inbox.png`, `icon-risk.png`, `icon-status.png`, `icon-gift.png`, `icon-forecast.png`, `icon-baseline.png`, `empty-harbor.png`, `pipeline-strip.png`.
- Drop them all in one folder anywhere and tell Claude — the site's ImageSlot components are already waiting for them, and I wire + optimize + commit in one pass.
- Reject any variant where folds look melted/organic instead of creased — the crease discipline is what sells papercraft.
