# LANDING-PAGE DESIGN PROMPTS — v2 (DESIGN-FIRST)

> **Why v2.** The v1 prompts baked in the full marketing copy + exact section order, so Claude kept rebuilding the original page. v2 strips ALL copy out — Claude designs the *visual system* with placeholder text, we pour the approved copy in AFTER the design is locked.
>
> **How to use.** Paste each block into a **FRESH Claude chat** (a fresh chat avoids anchoring to earlier attempts). For Adwield, pick a direction. Run it 2–3 times / across directions to compare.

---

## === ADWIELD — DESIGN-ONLY PROMPT (paste into a FRESH chat) ===

You are a world-class product/brand designer. Design a **landing page** as a single self-contained HTML file. This is a **pure VISUAL DESIGN exploration — I do NOT want marketing copy.** Use only **placeholder text**: lorem ipsum, or bracketed labels like `[HEADLINE]`, `[SUBHEAD ~12 words]`, `[PRIMARY CTA]`, `[SECTION TITLE]`, `[3 short blurbs]`, `[FAQ Q / A]`, `[FOOTER]`. Do NOT write real copy, taglines, or value props — we add those after the design is right. Your entire job is the **design**: layout, type, color, composition, components, motion, craft.

**THE BRAND (for aesthetic tone only — do NOT turn this into copy):** Name is **Adwield.** A premium, AI-native ad-creative engine for serious DTC operators. The feeling: *you're equipping a precision weapon, not hiring an agency* — confident, sharp, a little dangerous, expensive-looking. A very subtle, tasteful tactical undertone is welcome but must read as **premium operator tooling, never gamer-cheesy.**

**CRITICAL — BE DISTINCTIVE, START FROM A BLANK CANVAS:**
- Do NOT default to the generic dark-SaaS template (centered hero → 3 feature cards → pricing → footer). Surprise me.
- Pick **ONE** direction below and commit to it 100% (or invent a bolder one). Make a strong, opinionated choice — I'd rather it be polarizing and memorable than safe.

**CHOOSE ONE DIRECTION** (for maximum freshness, lean toward 1 or 3):
1. **Editorial Atelier** — luxury fashion/magazine energy. Huge serif or high-contrast display headlines, vast negative space, an asymmetric editorial grid, a restrained luxe palette + one metallic accent. Feels like a $50k creative studio, not software.
2. **Command Deck** — a high-end operations console. Precise modular grid, hairline rules, monospace data labels, live stat/readout modules, one hot accent on near-black. Bloomberg-terminal-meets-Linear. *(Closest to a tactical look — only pick if you want to push that lane further.)*
3. **Industrial Forge** — weighty, tactile, confident. Condensed grotesk + mono, tasteful concrete/steel/raw textures, a molten accent, heavy section dividers. Feels forged.
4. **Neo-precision / sharp** — high-contrast, bold borders, oversized type, unexpected layout shifts, one electric accent, deliberate rawness. Modern and arresting.

**VISUAL SYSTEM (deliver a real system, not random styling):**
- **Type:** choose ONE distinctive pairing and use a premium **Google Font** (or two) — this is a design phase, use whatever makes it gorgeous. Strong hierarchy.
- **Color:** a deliberate, restrained palette (≤3 colors + neutrals); one accent used with scarcity; commit to a mood.
- **Layout:** an intentional, interesting grid — asymmetry, overlap, or an unexpected hero all welcome; one clear focal point per screen.
- **Components:** design (with placeholder content) a hero, a how-it-works/mechanism section, an offer / two-options section, a guarantee/trust moment, an FAQ, and a footer — composed to fit your chosen direction, NOT as a checklist. A small brand mark/sigil for nav + footer is welcome.
- **Motion:** subtle, tasteful (scroll reveals, hover states, a hero accent), respect `prefers-reduced-motion`, never gimmicky.
- **Craft bar:** spacing, alignment, detail at the level of Linear / Vercel / Stripe. The test for every element: would a sharp, skeptical, expensive-taste operator nod, or wince?

**HARD DON'Ts:** no WoW/fantasy clipart, dragons, sword-clipart, glowing runes, parchment/leather textures, lens-flare "EPIC" energy, emoji, hype stickers, rainbow gradients, or more than ~3 colors. No real copy.

**TECHNICAL:** one self-contained, responsive (360px → 1440px+), accessible HTML file. Google Fonts via `<link>` are fine for this design phase. Make it genuinely beautiful.

Output the complete single-file HTML now.

## === END ADWIELD ===

---

## === TIDEOVER — TWEAK PROMPT (paste into your EXISTING Tideover chat) ===

Three small tweaks — keep everything else (structure, bolt-on messaging, warm/calm brand):

1. **Shorten the headline** to something punchy (≤6 words). Options to pick from or beat: *"Keep presale buyers from bailing."* / *"Calm the wait. Keep the sale."* / *"They paid — now keep them aboard."*
2. **Less muted.** Keep the calm sea-teal + warm-sand direction, but **deepen and slightly saturate the teal**, and let the terracotta accent run a touch **warmer/brighter** so the page feels alive, not washed out. Nudge text contrast up for readability.
3. **More flair on the CTAs.** Make the primary buttons feel premium and clickable: a richer fill (a subtle warm-terracotta gradient or a confident solid), a soft glow/elevation, a clear hover state (slight lift + brighten), pill shape, and a small arrow/motion cue. They should be the most eye-catching thing on the page — without breaking the calm.

## === END TIDEOVER ===
