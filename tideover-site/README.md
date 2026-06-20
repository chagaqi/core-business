# Tideover — Landing Page

Clean, deploy-ready static landing page for **Tideover** — the presale-specialist support layer that bolts onto the helpdesk a merchant already runs (Gorgias / Tidio / Intercom) and answers the long 60–120 day presale wait with calm, human, timeline-aware reassurance.

Rebuilt as **vanilla HTML + CSS + JS** (no React, no bundler, no build step). Warm/calm aesthetic: sea-teal + warm sand/terracotta, wave-crest mark, serif headings.

## Files

| File | Purpose |
|---|---|
| `index.html` | All markup + copy (single page) |
| `styles.css` | Full design system + responsive + reduced-motion |
| `script.js` | Scroll-reveal, nav shadow, a11y focus handoff |
| `README.md` | This file |

No dependencies are vendored. The only external request is **one Google Fonts `<link>`** (Fraunces for headings, Inter for body). It degrades gracefully to system fonts offline.

## Deploy

It's a static site — drop the folder anywhere that serves files.

- **Netlify / Vercel / Cloudflare Pages:** drag-and-drop the `tideover-site/` folder, or point the project at it. No build command, no output dir config needed.
- **GitHub Pages:** commit the folder contents to the published branch/root.
- **Any host / S3 / nginx:** upload the three files; ensure `index.html` is the directory index.

### Local preview

From inside `tideover-site/`:

```bash
python -m http.server 8000
# then open http://localhost:8000
```

(Opening `index.html` directly via `file://` also works; a local server just mirrors production more closely.)

## BEFORE GOING LIVE — fill the merge fields

Two literal merge fields are intentionally left in `index.html`. Find-and-replace both before launch:

- `{{book_call}}` — the booking/calendar URL for the **free 15-min presale-support teardown** (the primary CTA, used in nav, hero, final CTA, footer).
- `{{first_strike_form}}` — the **founding-partner pilot** application form URL (the pilot section CTA).

> Until these are replaced, those buttons link to the literal `{{book_call}}` / `{{first_strike_form}}` strings — they won't navigate anywhere useful.

## Proof-only — do not "improve" with fake proof

This page deliberately ships **no fabricated metrics, case studies, testimonials, star ratings, or logos.** Every number is a *target to measure against the merchant's own baseline.* Keep it that way:

- The `[CASE STUDY PLACEHOLDER — refund-reduction delta, post first completed cohort]` block in the **operator** section is intentional. Leave it until a real cohort completes.
- The hero reply card (Dana, order #4821) is a **product demonstration of voice**, not a testimonial — don't relabel it as a customer quote.
- Pricing shown ($199–$499/mo → $799–$999+/mo) is the value ladder, not a claimed result.

## Accessibility & motion

- Responsive from **360px → 1440px+** (fluid `clamp()` type, auto-fit grids, horizontally scrollable comparison table on narrow screens).
- Skip-to-content link, semantic landmarks, labeled nav, focus-visible outlines, scoped table headers, `aria-hidden` on decorative SVGs.
- Animations are gentle: scroll-reveals, soft hover lifts, a calm tide/gradient drift. **`prefers-reduced-motion: reduce` disables all animation/transition and reveals content immediately** — no JS-driven motion runs for those users.
