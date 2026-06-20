# Adwield Component Contract

Source of truth for the visual + copy: `../_newestsite-source.html` (the approved
"Command Deck" design). Recreate it FAITHFULLY as clean React. Keep ALL elements,
animations, copy, colors, type, spacing, and layout — just rebuild it properly.
A concise-copy pass comes later, so use the reference copy verbatim for now.

This file is the contract the section-component agents read. Each agent overwrites
exactly ONE stub in `components/` and must conform to the tokens, conventions, and
hard rules below.

---

## 1. Design tokens (token -> value)

All tokens live as CSS custom properties in `app/globals.css` (`:root`) AND as
Tailwind theme keys in `tailwind.config.ts`. Prefer Tailwind classes
(`text-equip`, `bg-bg`, `border-frame`) for new markup; the ported `.panel`,
`.btn`, `.win-title`, `.section`, `.wrap`, etc. component classes in globals.css
are also available and already match the reference.

### Base surfaces
| token        | value                    |
| ------------ | ------------------------ |
| bg           | #070A12                  |
| bg-1         | #0A0F1A                  |
| panel-a      | rgba(20,29,47,0.82)      |
| panel-b      | rgba(11,17,29,0.88)      |

### HUD frame
| token       | value                  |
| ----------- | ---------------------- |
| frame       | rgba(150,190,225,0.24) |
| frame-soft  | rgba(150,190,225,0.14) |
| frame-glow  | rgba(110,170,225,0.18) |

### Gold (crest / wordmark / panel brackets)
| token     | value                   |
| --------- | ----------------------- |
| gold      | #E3C778                 |
| gold-dim  | rgba(227,199,120,0.5)   |
| gold-glow | rgba(227,199,120,0.4)   |

### Rarity color system
| token       | value   | meaning                          |
| ----------- | ------- | -------------------------------- |
| equip       | #5EC8E6 | cyan — primary / "the aim"       |
| equip-deep  | #2E7E96 | cyan deep (gradients, bars)      |
| epic        | #A879F0 | violet — "the system" / DWY      |
| crit        | #F4A23B | amber — "the breakout" / free    |
| danger      | #F2666B | red — "the timer" / fatigue      |
| buff        | #7CE0B0 | green — guarantee                |
| equip-glow  | rgba(94,200,230,0.5)  |                    |
| crit-glow   | rgba(244,162,59,0.5)  |                    |
| epic-glow   | rgba(168,121,240,0.5) |                    |

### Ink / type
| token    | value   |
| -------- | ------- |
| ink      | #E9ECF3 |
| ink-soft | #AEB8C8 |
| ink-mute | #76819A |

### Layout / fonts
- Max content width: `--maxw: 1140px` (Tailwind `max-w-deck`); use the `.wrap` class.
- Display/body font: **Space Grotesk** via `var(--font-grotesk)` (Tailwind `font-sans`/`font-display`).
- Mono (wordmark, eyebrows, HUD labels, count-ups): **Space Mono** via `var(--font-mono)` (Tailwind `font-mono`, or the `.mono` class).
- Gold corner-bracket panel frame: use the `.panel` class (it bakes in `--cTL/TR/BL/BR`).

---

## 2. Component file list + required contents

Each must keep the section's `id` so the nav/rail/hotbar anchors work. Use the
EXACT reference copy. Section ids: `#top` (main), `#fatigue`, `#loadout`,
`#first-strike`, `#paths`, `#guarantee`, `#proof`, `#faq`.

- **Nav.tsx** — sticky top HUD. Gold crest SVG + mono `adwield` wordmark, primary
  nav links (The Fatigue Wall, The Loadout, Choose Your Path, Guarantee, FAQ),
  the "player plate" (LVL ring + HP/XP bars — HP full, XP driven by GameChrome or
  static), and a primary `<CalButton>` "Claim First Strike". Links hide < 900px.
- **Hero.tsx** — kicker chip, big H1 with `.equip` cyan span on "critical strikes",
  mono tagline (More hits · More crits · Every two weeks), hero-sub, CTA row
  (`<CalButton>` "Claim your First Strike" + quiet anchor to #loadout), no-risk
  line with shield SVG, and the 4-slot **Equipped Kit** panel (Hit rate / Critical
  strike / Loadout / Fatigue Wall — rarities equip/crit/epic/danger respectively).
- **FatigueWall.tsx** — `#fatigue`. Quest 01 header, H1 "Every winning ad dies on a
  clock.", 3 fatigue points, and the Combat-Log panel with the decay-curve SVG +
  "Winner HP" enemy bar. Week count-up `~7`.
- **Loadout.tsx** — `#loadout`. Quest 02, H2, lede with `24` count-up, the 4×24
  inventory panel: 4 angles (Mechanism / Identity / Objection / Proof) × 6 slots
  each, with one `CRIT` slot, plus the honest note.
- **FirstStrike.tsx** — `#first-strike`. Legendary tag, H2 (cyan/crit accents),
  lede, the gold fs-card panel: 3 numbered steps + a CTA column with a `crit`
  `<CalButton>` "Claim your First Strike" and a quiet `<CalButton>` "Book a call
  instead".
- **Paths.tsx** — `#paths`. Quest 03, two path panels: Knight (DFY, equip/cyan,
  `<CalButton>` "Hire your Knight") and Forge (DWY, epic/violet, ghost
  `<CalButton>` "Build your Forge — by application").
- **Guarantee.tsx** — `#guarantee`. Buff tag, H2, the buff quote panel (No-Risk
  Loadout), and 3 guarantee-point panels. All buff/green.
- **Proof.tsx** — `#proof`. PROOF-ONLY (see §4). Honest number card renders a
  literal `—%` (NOT animated), the "Teardowns" judgment card, and the literal
  `[ CASE STUDY PLACEHOLDER ]` dashed block.
- **FAQ.tsx** — `#faq`. Quest 05, H2, 7 `<details>`/`<summary>` accordion items
  with the reference Q&A copy. Native disclosure is fine; keep focus states.
- **Footer.tsx** — crest + wordmark, tagline, blurb, 3 link columns (booking links
  must be `<CalButton variant="quiet">`, not merge-field anchors), and the legal
  block (keep the proof-honest legal copy verbatim).
- **GameChrome.tsx** — `"use client"`. The whole client-side HUD layer: scroll
  cast-bar (top), quest rail (left, hidden < 1360px), XP/level plate sync, the
  FFXIV-style toast log fired per section, the XP-float on `[data-xp]` clicks, and
  the fixed bottom **hotbar**. Renders portals/fixed elements; returns null-safe
  markup. MUST gate every animation behind `useReducedMotion()`.

---

## 3. Conventions

- **Tailwind first** for new layout; reuse the ported component classes
  (`.panel`, `.win-title`, `.btn`/`.btn-primary`/`.btn-crit`/`.btn-ghost`,
  `.link-quiet`, `.section`, `.wrap`, `.qhead`, `.lede`, `.eyebrow`, `.mono`,
  `.dot`, `.cu`) that already match the reference pixel-for-pixel.
- **Framer Motion** for reveals/entrance. Pattern: a small `Reveal` wrapper using
  `motion.div` with `initial`/`whileInView`/`viewport={{ once: true }}` and a
  per-item delay (the reference used `--i * 70ms`). ALWAYS read
  `useReducedMotion()` and, when true, render with no transform/opacity animation
  (final state only). Components doing motion need `"use client"`.
- **Server vs client**: keep purely-presentational sections as server components
  when possible; add `"use client"` only when using motion hooks or state.
- **Typed props**: every component exposes a typed props interface (even if `{}`),
  `export default function`. TS strict is on — no `any`, no unused vars/params.
- **Accessibility**: semantic landmarks (`header`/`main`/`section`/`footer`/`nav`),
  `aria-label` on icon-only links, `aria-hidden` on decorative SVGs, visible
  `:focus-visible` (already styled globally). Maintain heading order.
- **Responsive**: must hold 360px → 1440px+. Mirror the reference breakpoints
  (900px and 560px collapse multi-col grids to 1col; rail hides < 1360px;
  nav-links + plate-bars hide < 900px).

---

## 4. HARD RULES (do not violate)

1. **PROOF-ONLY.** No fabricated metrics, testimonials, logos, or ratings
   anywhere. In Proof.tsx the headline number is a literal `—%` placeholder and
   is **NOT** animated/counted to any value. The case-study block stays the
   literal text `[ CASE STUDY PLACEHOLDER ]`. (The reference's `data-to="47"`
   count-up is intentionally DROPPED.) Count-ups are allowed ONLY for the
   non-proof, descriptive numbers: the `~7` week and the `24` variations.
2. **CAL POPUP is the only booking path.** Every booking CTA (Claim First Strike,
   Book a call, Hire your Knight, Build your Forge) renders `<CalButton>` from
   `components/CalButton.tsx`. Do NOT hand-roll booking anchors, and do NOT leave
   `{{first_strike_form}}` / `{{book_call}}` / `{{contact_email}}` merge fields —
   replace booking ones with `<CalButton>`. CalButton already binds
   `data-cal-link="bookthecall/firststrike"`, namespace `firststrike`, config
   `month_view`.
3. **Reduced motion.** Every animation respects `prefers-reduced-motion` — via
   Framer Motion `useReducedMotion()` in JS-driven motion, and the global CSS
   `@media (prefers-reduced-motion: reduce)` already kills CSS animations.
4. **Build clean.** `npm run build` must pass with zero TypeScript and zero lint
   errors. No `any`, no unused imports/vars (tsconfig has noUnusedLocals/Params).

---

## 5. CalButton usage

```tsx
import CalButton from "@/components/CalButton";

<CalButton variant="primary">Claim your First Strike</CalButton>
<CalButton variant="crit" large>Claim your First Strike</CalButton>
<CalButton variant="ghost">Build your Forge — by application</CalButton>
<CalButton variant="quiet">Book a call instead</CalButton>
```

Props: `{ children: React.ReactNode; className?: string; variant?: "primary" |
"crit" | "ghost" | "quiet"; large?: boolean }`. It is a client component that
inits the Cal `firststrike` namespace once and renders the data-cal-* button.
