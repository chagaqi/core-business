I have full ground truth on the current site. The Tideover marketing site is already ~70% aligned with the Swan playbook and the proof-only doctrine (tokens, `.proof-placeholder`, founder story, cited-stat guardrails all exist). The plan below is an evolution, not a rebuild. Returning the build-ready plan.

---

# THE TIDEOVER REDESIGN PLAN
### Swan's conversion playbook, translated onto Tideover's real Next.js 14 + Tailwind site

> **CRITIQUE RESOLUTIONS (Fable, 2026-07-08)** — the adversarial critique (`CRITIQUE.md`) passed originality (independent re-fetch: all drafted copy is our own words) and flagged 3 blockers + 5 weak lines, all now FIXED in this doc: B1 pricing-card crowd-claim → trigger-conditioned recommendation; B2 integration logo band → truth-mirroring text capability chips, no vendor marks (several integrations aren't live; a logo band reads as endorsement); B3 terracotta-as-danger → tan/amber (terracotta stays action-only); hero subhead tightened; "before day 90" / "presale layer" jargon / "novel reply" all replaced. Also adopted: max ~3 signature paper devices + ONE hero object (paper boat) — no lighthouse/anchor/buoy proliferation (calm, not theme-park). REMAINING FOR DYLAN (from CRITIQUE.md §Questions): founder portrait for the Operator section (real photo or ship without — never AI-generated), and confirm the six S2 capability cards against what's shipped before build (any unshipped one gets roadmap treatment).

**Strategic frame (read first).** The current site already implements much of Swan's discipline: a warm-neutral base with a single action accent (terracotta in coral's exact role), Fraunces/Inter mapped onto Manrope/Inter, `.section` rhythm, a real `.proof-placeholder` dashed block, `lib/proof.ts` runtime guardrails (`assertNoHardDate`, `citedStat`, `CASE_STUDY_PLACEHOLDER`), a genuine founder-story component (`Operator.tsx`), and real trust surfaces (`/security`, `/procurement`) that Swan does not even have. So this is not a from-scratch redesign. It is three moves:

1. **Reorder + fill the conversion staircase** so every objection dies exactly where it arises (Swan's core mechanic), and stop leaving the two social-proof slots that Swan leans on hardest as empty holes — fill them with our four honest substitutes (live demo, mechanism specificity, founder credibility, trust surfaces).
2. **Add four missing high-leverage beats**: a concrete capability showcase, an under-hero credibility strip, a live before→after demo centerpiece, and a three-column objection-killer block.
3. **Layer the PAPER/tide visual system** on top of the already-warm tokens — the one genuinely new design surface.

**The empty-hole rule (governs every section below):** never render a social-proof container that will ship empty. Either fill it with an honest substitute, or remove it and re-tighten the flow so the gap is invisible. Swan's two load-bearing pillars (customer-logo band, named-testimonial carousel) are exactly the two we cannot fake — those structural slots get our substitutes, not blanks.

---

## 1. SITE MAP

Mapping Swan's page types onto Tideover's real routes (all confirmed present in `tideover/app/`).

| Tideover page | Swan analog | Status | Action |
|---|---|---|---|
| `/` (home) | Homepage | **KEEP + restructure** | Reorder sections into the staircase (§2); add 4 new sections. |
| `/how-it-works` | Use-case deep-dive | **KEEP** | Already holds the routing diagram + comparison table. Add the numbered 5-step pipeline (Swan §6 depth). |
| `/who-its-for` | "By Role" landers | **KEEP + seed persona network** | Today it's the full fit/not-yet cards. Becomes the hub for a small persona/use-case landing network (below). |
| `/#pricing` (Pilot) | `/pricing` | **KEEP as anchor, restructure in place** | Convert the inline value-ladder pill strip into a 3-card tier row + usage explainer + deferred-fee micro-section (pricing teardown). Numbers HELD. Do NOT build a separate `/pricing` route yet — the anchor works. |
| `/security` | *(Swan has none)* | **KEEP, do not touch content** | Proof differentiator. Link it harder from home + near CTA. |
| `/procurement` | *(Swan has none)* | **KEEP, do not touch content** | Same. B2B trust surface Swan lacks. |
| `/status/[token]`, `/widget/[token]` | *(Swan has no product-proof page)* | **KEEP + expose a demo** | Add a public `/status/demo` (or embed) as a **status-page-as-product-proof** asset. Real working surface Swan can't match. |
| `/book` | Trial signup / "Ask Swan" | **KEEP** | Cal.com booking is the CTA backend. Every primary CTA routes here. |
| `/vsl/*` (4) | Blog/video | **KEEP** | Already the video assets; footer already links them under "Watch." |
| `/privacy`, `/terms`, `/login`, `/onboarding` | Legal/auth | **KEEP** | No change. |
| **`/resources` + `/resources/[slug]`** | Blog / resources | **ADD (phase 2)** | Founder-voice build-in-public log + 1–2 evergreen WISMO guides for SEO intent capture (resources teardown). Every post signed "— Dylan," `[CASE STUDY PLACEHOLDER]` until real data. |
| **`/for/[vertical]`** (crowdfunding-graduate, shopify-preorder, made-to-order-hardware) | Persona/use-case SEO network | **ADD (phase 2)** | Same skeleton as home, language + mechanism swapped per vertical; testimonial slot stays placeholder. Linked from nav "Who it's for" dropdown + footer columns. |

**Kill:** nothing. **Merge:** the under-hero credibility strip and the integrations grid become one thin band on home (dedicated deeper integration confirmation optional near pricing). **Add:** `/resources`, the `/for/[vertical]` persona network, and a public demo status page.

---

## 2. HOMEPAGE PLAN — section by section

**Recommended new section order** (current order shown for diff):

> **Current:** Hero → LongWait → HowItWorks(condensed) → HonestFit(condensed) → Pilot → FAQ → FinalCTA
>
> **New:** Hero → **Capability Showcase (NEW)** → **Trust/Integration strip (NEW)** → LongWait → **Live before→after demo (NEW)** → HowItWorks → **Three-column objection blocks (NEW)** → **Operator (MOVE onto home)** → Pilot → FAQ → FinalCTA

This preserves Swan's alternating emotional/rational cadence: emotional (hero) → rational (capabilities/trust) → emotional (the wait) → rational→emotional (demo resolution) → rational (how/objections) → emotional (founder) → rational (pilot/FAQ) → emotional (close).

Copy below is **100% original, written for Tideover in Swan's style** (concise, role-personified, X-not-Y, mechanism-specific), warm/calm register, no fabricated numbers, no hard dates, no "honest" crutch, tight.

---

### S1 — HERO *(keep `Hero.tsx`, refine copy + add paper backdrop)*
- **Job:** Plant the category in one breath — a support teammate that keeps a presale buyer calm through a 60–120 day wait, so the wait doesn't become a refund. Kill "is this just another chatbot?" by naming a role, not a feature.
- **Layout:** Keep the current split — left text column (chips → H1 → subhead → dual CTA → reassurance trust card), right the animated reply card (Dana / Day 58). The reply card already does Swan's "show, don't tell" work; keep it.
- **Paper/tide treatment:** Replace the flat radial-gradient background with a **layered paper-wave backdrop** — 3 stacked SVG wave strata (sand → sand-2 → light teal) with a soft drop-shadow between layers, and a **torn-paper bottom edge** dividing hero from S2. Low-opacity paper grain overlay (SVG `feTurbulence`, ~4% opacity). Reduced-motion: waves static.
- **Copy (refined, role-personified):**
  - **Chips (keep):** "For 60–120 day presale waits" · "Built for Kickstarter & BackerKit graduates"
  - **H1:** *Keep them waiting, not walking.* (X-not-Y, 4 words, warm-confident) — alt: *The teammate who answers "where's my order?" for months.*
  - **Subhead (tightened per critique — Swan subheads run ~12–15 words):** "It reads each order's real production timeline and drafts the calm, no-false-promises reply — in your voice, for your approval." Support line: "A layer on the helpdesk you already run. Nothing to rip out."
  - **Primary CTA:** "Get a free 15-min teardown" → `/book` (unchanged). **Secondary CTA:** "See a live draft →" → scrolls to the demo centerpiece (S5), our product-led equivalent of "Ask Swan."
  - **Trust card (keep):** "No new helpdesk to install. Nothing to rip out."
- **Proof-only:** No numbers in hero. The reply card shows a confidence band ("weeks 9–11"), never a hard date — already correct.

### S2 — CAPABILITY SHOWCASE *(NEW — Swan §2, single most portable pattern)*
- **Job:** Make "presale support layer" concrete instantly. Turn a platform claim into six things it visibly does. Kills the blank-canvas / vague-AI reflex before skepticism sets in.
- **Layout:** 6 individuated cards (3×2 desktop, 1-col mobile). Each = paper/tide motif + 2–3-word job label + one verb-first outcome line + a row of real integration chips + click-through that deep-links into the live demo (S5) pre-seeded for that job (query param BEFORE the hash — `?scene=refund-risk#demo`; the critique caught that a query after a hash won't parse).
- **Paper/tide treatment:** Each card gets a small **paper motif instead of a zoo mascot** — wave, buoy, lighthouse, tide-line, paper boat, anchor. Line-art SVG NOW; upgrade to photographed papercraft later (shot list §4). Card is `.panel` + paper-lift hover.
- **The six jobs (all real capabilities — no fabrication):**
  1. **Reassurance drafts** — "Answer the long wait in your voice, ready for one-click approval." *(motif: paper boat on a wave)*
  2. **Refund-risk scoring** — "See which anxious buyer is one reply from disputing." *(motif: buoy)*
  3. **WISMO triage** — "Catch every 'where's my order?' the moment it lands, and start the reply." *(motif: tide-line)*
  4. **Customer status pages** — "Give each buyer a calm page showing where their order really is." *(motif: lighthouse)*
  5. **Backer & preorder digest** — "Keep Kickstarter backers and Shopify preorders on separate clocks." *(motif: layered strata)*
  6. **Escalation flags** — "Surface the worry that needs the founder, not a template." *(motif: anchor)*
- **Copy:** Kicker "What the layer does." H2: *Six jobs the long wait creates — off your plate.* (critique: no implied outcome timeline)
- **Proof-only:** These are shipped capabilities; the honest move is that each card **links to the live demo running that job**, not to a claim.

### S3 — TRUST / INTEGRATION STRIP *(NEW — Swan §3 logo-bar slot, honest substitute)*
- **Job:** The credibility beat the staircase structurally needs right after the product feels real — but filled honestly. Also kills the "will it work with my stack?" adoption fear early.
- **Layout (REVISED per critique B2 + the provenance audit):** NO third-party logo marks at all in v1 — a monochrome logo band in the post-hero credibility slot reads as a "trusted by" endorsement bar no matter the caption (visually indistinguishable), it would collide with the Operator pledge "No borrowed logo," and several of the would-be marks (Shopify, Klaviyo, ShipStation, Tidio) are NOT live integrations — showing them is an implied-capability claim. Instead: a thin band of **plain-text capability chips that mirror the DataSourcePicker's truth exactly** — "Kickstarter · BackerKit — backer-list import, live" · "Webhook — any helpdesk that can POST JSON (beta)" · "Shopify — coming soon" — left; right, the one-line founder-credibility anchor + links to the live demo and `/security`.
- **Paper/tide treatment:** Text chips on a `sand-2` band with edge-fade masks (CSS gradient). Torn-paper top edge. No logos.
- **Copy:** "Connects to where your backers already live." Founder anchor line: "Built by an operator who spent two years tiding customers over 60-plus-day waits." Link: "See what we can and can't see →" `/security`.
- **Proof-only (critical):** capability chips state only what ships today, with beta/coming-soon labeled — consistent with the onboarding picker so the site and product never disagree. No customer logos, no "trusted by," no vendor marks for unshipped integrations. The founder line and the `/security` link are the credibility. Never leave the slot blank.

### S4 — THE LONG WAIT *(keep `LongWait.tsx` — the problem/empathy peak)*
- **Job:** Validate the pain viscerally. Frame WISMO as a months-long emotional arc (Curious → Restless → Frustrated → Dispute-risk), not one ticket. Already excellent and on-voice.
- **Layout:** Keep — 4 day-stage timeline cards + 3 "stakes" cards with `citedStat` external numbers.
- **Paper/tide treatment:** Restyle the 4 stage cards as a **rising paper tide-line** — a horizontal wave strip beneath the cards whose color warms from teal (calm) to **tan/amber** (dispute-risk) across the four stages, literalizing the emotional rise. (Critique B3: terracotta stays action-only — using it for "danger" would break the single-action-accent discipline and collide with the product's risk pills.) The stakes cards keep `sand-2`.
- **Copy:** Keep. It's tight and the stats are cited to source (Mastercard, YepAI) — proof-lint clean.
- **Proof-only:** Every external number stays `citedStat(...)`, never restated as a Tideover result. Unchanged.

### S5 — LIVE BEFORE→AFTER DEMO *(NEW — Swan §4 + §7 merged; the single highest-leverage build)*
- **Job:** Show the magic and resolve the pain in one beat. This is our biggest honest proof asset and Swan's homepage has nothing like it. Converts the "sounds too good" skeptic by letting them watch chaos become calm.
- **Layout:** Full-width. **Left/before:** a stressful WISMO inbox state — stacked red-pill tickets ("Last chance before I dispute", "I want a refund", refund threats), deliberately busy. **Right/after:** the calm cockpit queue — the same tickets as pre-drafted, timeline-aware replies awaiting one-click approval (sand/teal). Ideally an **interactive embed** of the real cockpit in demo mode (the `DemoBadge` + `.demo-badge` pattern already exists in `globals.css`), or an autoplay-muted looping capture as fallback. Deep-linkable scenes for the S2 cards.
- **Paper/tide treatment:** The "before" panel is a torn, chaotic paper pile in reds; the "after" panel is smooth layered paper with the tide literally drawn coming in between the two panels (the reused 3-line wave SVG already in `Hero`/`FinalCTA`). This is where PAPER + tide earns its emotional keep.
- **Copy:** Kicker "See it run." H2 (analogy formula, used once, genuine fit): *The tide coming in on a flooded inbox.* Subhead: "Watch a day-89 'where IS my order??' become a calm, approved reply in your voice. This is the live cockpit, on sample data." Below the embed: "Draft a reply on your own scenario →" `/book` or demo.
- **Proof-only:** Runs on clearly-labeled **sample data** (`SAMPLE DATA` badge/watermark components already exist). The demo IS the proof — no metric claimed. A working product shown early is a stronger "this is real" signal than any logo.

### S6 — HOW IT WORKS *(keep `HowItWorks condensed`; add the numbered pipeline)*
- **Job:** Prove depth for the now-interested evaluator (Swan §6). Move belief from "cute" to "capable," with the human-approval step visible in the flow (our trust differentiator).
- **Layout:** Keep the 4 feature cards + "See how it works →" link. **Add a numbered 5-step pipeline strip** above the link: **1** Detect a presale WISMO ticket → **2** Pull the order's real production stage → **3** Score refund risk (factors shown) → **4** Draft an on-brand reply in a confidence band → **5** Route to a person for approval. Step 5 is rendered as the emphasized terminal node.
- **Paper/tide treatment:** Steps as paper stepping-stones across a tide; the approval step is a lighthouse. Keep the existing teal routing node with its wave glyph.
- **Copy:** Kicker "The pipeline." H3 on step 5: "Every reply to a worried buyer waits for your yes." (Accurate today: approve-and-send is the ONLY send path in the product — nothing auto-sends. Revisit only if per-intent auto-send ever ships.) Full routing diagram + comparison table stay on `/how-it-works`.
- **Proof-only:** The visible human-approval terminal is the proof-only, human-in-the-loop moat. Lean on it here.

### S7 — THREE-COLUMN OBJECTION BLOCKS *(NEW — Swan §5, label→aphorism→mechanism)*
- **Job:** Convert features into a worldview and knock down the top three conceptual objections in Swan's exact 3-tier rhythm. Currently these answers are buried in the FAQ; promote them.
- **Layout:** Three equal columns. Each = short label → an X-not-Y aphorism → a 2-sentence mechanism explainer.
- **Paper/tide treatment:** Each column headed by a small paper motif; terracotta corner-fold accent (SVG triangle) — our version of Swan's colored corner flourish.
- **Copy (the three objections to kill):**
  1. **Label:** Voice · **Aphorism:** *Your words, not a template.* · **Mechanism:** "Replies are assembled from a playbook built on your own tickets, keyed to where each order sits. It reads like you on a good day, not a macro."
  2. **Label:** Control · **Aphorism:** *Drafts for approval, never auto-sends.* · **Mechanism:** "Nothing reaches an anxious backer without a person's eyes. A hard delivery date physically can't leave the system — the check runs in code at send time."
  3. **Label:** Change · **Aphorism:** *Update the timeline once, every reply follows.* · **Mechanism:** "When the factory slips, you move one production window. Every future reply and status page reflects it. No re-writing macros."
- **Proof-only:** Mechanism claims are architecture facts (`assertNoHardDate` genuinely enforces #2), not outcome metrics.

### S8 — OPERATOR / FOUNDER CREDIBILITY *(MOVE `Operator.tsx` onto home — Swan §10 testimonial-slot substitute)*
- **Job:** The emotional social-proof peak immediately before the ask. Swan uses 10 named testimonials here; we use the founder's real first-person lived-pain account — better than Swan's exits because it's domain-native (he ate the exact 60-day-wait pain).
- **Layout:** Keep the component exactly — first-person blockquote, self-reported numbers, "— Dylan," the proof-pledge box, and the literal `CASE_STUDY_PLACEHOLDER` rendered in `.proof-placeholder`.
- **Paper/tide treatment:** Set on `section-sand2` with a **tilted paper testimonial card** frame (Swan's `3°/-4°` physical-card tilt) around the pledge box, and the `.proof-placeholder` styled as a deliberate "first results land after cohort one" card — designed, not missing. Add Dylan's real portrait (shot list §4) beside the quote.
- **Copy:** Keep. Self-reported numbers ($200K week one, 60+ day waits, two years) are allowed — his own account of his own business. The pledge ("no invented metric, no fake testimonial, no borrowed logo") is the anti-slop, proof-only spine of the whole page.
- **Proof-only:** This IS the honest fill for Swan's testimonial carousel. When real quotes arrive, chase Swan's emotional-specificity style ("heartbroken the trial ended"), never fake percentages.

### S9 — PILOT / PRICING *(keep `Pilot.tsx`, restructure in place — pricing teardown)*
- **Job:** De-risk the offer. Numbers HELD.
- **Layout changes (mechanics only):** Convert the inline value-ladder pill strip into a **3-card tier row** (Free pilot / $199–$499 on proof / $799–$999+ as it scales), the middle or top card given visual emphasis labeled as a trigger-conditioned self-sourced recommendation: **"Recommended once the pilot proves out on your own tickets."** (Critique B1: no crowd claim — "where most partners land" implies a customer base that doesn't exist yet; a popularity-shaped label is a proof-only violation until a real cohort completes.) Add a **usage explainer** ("what moves you off pilot pricing") and promote **"how the deferred fee is triggered"** into its own micro-section (Swan's "What's a seat?" move). Keep the guarantee box directly adjacent (it already exceeds Swan, which has no guarantee).
- **Paper/tide treatment:** Tier cards as stacked-paper tiers rising like a tide; keep `section-dark` teal.
- **Copy:** Keep existing offer copy verbatim. Add usage-explainer + deferred-fee micro-section copy at mechanism level only.
- **Proof-only / HELD:** Do NOT propose or add new prices. CTA stays `/book` (concierge apply). No self-serve checkout.

### S10 — FAQ *(keep `FAQ.tsx`)*
- **Job:** Sweep the last rational + billing objections. Already best-in-class: 14 questions in the customer's worried voice, proof-only answers, cited stats, `/security` link. No change needed.
- **Paper/tide treatment:** Keep native `<details>` accordion; terracotta "+" marker. Maybe a thin torn-paper top edge.
- **Proof-only:** "Do you actually have proof it reduces refunds?" answered with "Not yet, and we won't pretend we do" — this is the model. Keep untouched.

### S11 — FINAL CTA *(keep `FinalCTA.tsx`)*
- **Job:** Narrow to one action. Already on-brand — the tide-comes-in headline, single booking CTA, three support points, and the paper-wave SVG motif already present.
- **Paper/tide treatment:** Keep. Consider a full torn-paper wave crest as the top divider into this dark section.
- **Copy:** Keep. One button → `/book`. Resist adding competing links.

### FOOTER *(keep `Footer.tsx`, extend columns)*
- Extend to Swan's column model as the persona/use-case network grows: **Use Cases** (`/for/*`), **Who it's for** (`/who-its-for`), **Company/Resources** (`/resources`, `/security`, `/procurement`), **Legal**. Add a low-commitment newsletter capture (soft conversion for non-bookers) once `/resources` exists. Keep the proof-only disclaimer line and "Watch" (VSL) row.

---

## 3. THE PAPER / TIDE DESIGN SYSTEM

The color + type + component tokens are **already correct** and match Swan's discipline 1:1. Keep them; do not re-hex. The new work is the paper/tide layer.

### 3.1 Tokens — KEEP AS-IS (from `tailwind.config.ts` / `globals.css`)
- **Surfaces:** `sand #FBF8F2` (page, = Swan's warm `#f7f5f3` role), `sand-2 #F4EEE2` (alt band), `paper #fff` (cards).
- **Brand/secondary surface:** `teal #0E5366` — plays Swan's green `#387f7d` role (the folded-paper frame, eyebrow pills, dark sections, chat/status bubbles).
- **Single action accent:** `terracotta #D9762F` — plays coral's exact role: every CTA + the one spot color in every illustration. Keep the discipline: **no fourth solid.**
- **Dark-section emphasis:** `tan #E9B486`. **Type:** `ink #11252A` / `slate` / `ink-mute` / `ink-inverse`. **Lines:** `border #EBE2D0`. Risk pills red/amber/green (product only).
- **Type:** Fraunces (display, 700, `line-height 1.08`, `-0.02em`) ← Manrope; Inter (body, 17px, 1.6) ← Inter. Already fluid via `clamp()` (h1 34→60, h2 26→40, h3 18→22). Keep.
- **Components already built:** `.wrap` (1160px), `.panel` (14px radius, 1px border, `shadow-card`), `.kicker`, `.btn` (+`primary` gradient / `ghost` / `ondark` / `lg`), `.link-quiet`, `.section` (+`dark`/`sand2`), `.pill`, `.proof-placeholder` (dashed), `shadow-card`/`lift`/`cta`, `cta-gradient`. Reduced-motion global kill already in place.

### 3.2 NEW paper/tide primitives

**Achievable in CSS/SVG NOW (no images needed):**

1. **`<TideDivider>` / torn-paper section edges.** Systematize the wave SVG that already appears in `Hero`/`FinalCTA`/`HowItWorks` into one component with variants: `wave` (smooth 3-strata bezier), `torn` (jagged paper-tear path), `crest` (single tall wave). Fill = the adjacent section's bg color so it reads as one sheet tearing into the next. Props: `flip`, `color`, `variant`. Place at section boundaries. Pure inline SVG paths (`Q`/`T` beziers), zero libs.
2. **Layered paper-wave strata.** 3–4 stacked `<path>` waves, each offset ~6–10px vertically, each with a soft drop-shadow (`filter: drop-shadow(0 2px 3px rgba(17,37,42,.08))`) → the "cut-paper depth" look. Colors step sand → sand-2 → `accent-card` → teal. Used in hero backdrop, LongWait tide-line, demo divider.
3. **Paper grain overlay.** Inline SVG `feTurbulence` (fractal noise) as a `data:` URI `background-image` at 3–5% opacity over sand sections → paper-fiber texture. One utility class `.paper-grain`. GPU-cheap, static.
4. **Paper-lift card hover.** Extend `.panel`: `transition: transform .3s ease-in-out, box-shadow .3s`; hover `translateY(-6px)` + `shadow-lift`. Matches Swan's `translateY(-10px)`. Reduced-motion disables via existing global rule.
5. **Stacked-paper double edge** for showcase/tier cards: a 2px offset pseudo-element in `sand-2` behind the card (Swan's white-ring-on-overlap trick) → cards look like stacked sheets.
6. **Corner-fold accent.** Small terracotta SVG triangle at a card corner (origami-corner analog) for the S7 objection cards and tier cards.
7. **Subtle parallax tide** (hero only): translate the back wave strata on scroll via a tiny `IntersectionObserver`/`transform` (or CSS `scroll-timeline` where supported). **Reduced-motion: fully disabled** (already global). Keep amplitude tiny (calm, not springy) — Swan's motion is uniform `ease-in-out .2–.35s`; match it.

**Radius / shadow / motion language (align to Swan's contrast):**
- Crisp buttons (10px, keep) vs. round image/paper frames (24–32px) vs. pills (999px). 
- Shadows restrained: 1px border ring + soft drop (`shadow-card`); one big ambient glow behind the hero demo/product only.
- All transitions `ease-in-out` 0.14–0.3s, uniform. No bounce.

**Needs Dylan's images (cannot CSS/SVG):**
- Photorealistic **papercraft dioramas** (hero centerpiece art, capability-card motifs upgraded from line-art to photographed paper sculptures, section-divider beach/tide strata photos).
- **Dylan's portrait** for S8.
- **Product screenshots** of the cockpit + a status page — note these are *captured from the real `/app` and `/status` surfaces in demo mode*, not "generated." Frame them inside the paper-wave frame.

---

## 4. IMAGE SHOT LIST (for Dylan — he sources/generates)

Palette for every shot: sand `#FBF8F2` / sea-teal `#0E5366` / terracotta `#D9762F`, warm off-white seamless backdrop, soft top-light, long soft shadow, calm (not playful). Art style: **layered paper-craft / cut-paper diorama**, photographed as real paper sculpture (Swan's signature move), one terracotta accent element per shot.

**1. Hero centerpiece — "the boat riding over the wave"**
- Where: hero right column background, behind/around the reply card.
- Art direction: layered paper diorama, a small folded-paper boat cresting a 3–4-layer paper ocean wave, layers stepping sand→teal, one terracotta sail or flag as the single accent, low horizon, generous negative space top-right for the reply card to overlap.
- Specs: 2400×1600 PNG, transparent or sand bg, @2x.
- Prompt: *"Layered paper-craft diorama, a small folded origami paper boat riding over a cresting ocean wave built from 3–4 stacked cut-paper layers, colors stepping from warm sand cream to deep sea-teal, one terracotta-orange paper sail as the only bright accent, seamless warm off-white studio backdrop, soft top-lighting, long soft shadow, calm and reassuring mood, photorealistic paper sculpture, low horizon, empty space upper right, 3:2."*

**2–7. Capability motif set (6 small papercraft objects)** — for the S2 showcase cards (upgrade from SVG line-art later).
- Where: top of each of the 6 showcase cards.
- Art direction: single small papercraft object on seamless sand, one terracotta accent each, consistent lighting/scale across all six: (2) paper boat on a wave, (3) paper buoy, (4) paper lighthouse, (5) paper tide-line / layered beach strata, (6) stacked paper "digest" sheets, (7) paper anchor.
- Specs: 800×800 PNG each, transparent bg, consistent shadow direction.
- Prompt (template): *"Single [OBJECT: origami paper buoy] photographed as a real cut-paper sculpture, warm sand-cream and sea-teal paper layers, one small terracotta-orange accent, seamless warm off-white backdrop, soft top-light, long soft shadow, minimal calm studio product shot, centered, 1:1."*

**8. Before→after demo backdrop pair** — for S5.
- Where: framing the live cockpit embed.
- Art direction: diptych — left, a chaotic torn-paper pile in reds/terracotta suggesting a flooded inbox; right, smooth calm layered sand/teal paper with the tide drawn coming in over the mess.
- Specs: 2×(1600×1200) PNG.
- Prompt: *"Two-panel paper-craft diorama. Left: a chaotic pile of torn crumpled paper notes in muted red and terracotta, stressful, overflowing. Right: the same scene smoothed into calm flat layered cut-paper waves in sand and sea-teal, a paper tide sweeping in from the right. Seamless warm backdrop, soft light, long shadows, photorealistic paper sculpture, 4:3 each."*

**9. Dylan portrait** — for S8 founder block.
- Where: beside the founder blockquote.
- Art direction: real warm photograph of Dylan, natural light, approachable, not corporate-glossy. Neutral warm background that sits on sand. (Real photo — not generated.)
- Specs: 1200×1200, square, @2x.

**10. Section-divider tide strata (optional, decorative)** — for torn-paper dividers if SVG isn't enough.
- Prompt: *"Horizontal band of layered cut-paper ocean waves, 4 strata stepping warm sand to deep sea-teal, one thin terracotta line, seamless, soft top-light, long shadow, calm, 3:1 wide, photorealistic paper sculpture."* Specs: 2880×960 PNG.

**Product screenshots (capture, do not generate):** cockpit inbox with a drafted reply + risk-score factors; a customer status page; the day-0 baseline report. Capture from `/app` and `/status/[token]` in demo mode (the `SAMPLE DATA` badge is built in). Frame inside the paper-wave frame.

---

## 5. OTHER PAGES (briefer)

**`/how-it-works`** — keep the full `HowItWorks` (uncondensed): 4 feature cards + routing diagram + comparison table (Tideover column highlighted). **Add:** the numbered 5-step pipeline from S6, and drop the `Operator` founder block lower as secondary depth. Keep the Gorgias-pricing citation (proof-lint clean). Paper: wave dividers between the three blocks.

**`/who-its-for`** — keep the full `HonestFit` (fit / not-yet cards — the disqualifying honesty is a trust asset). **Evolve into a persona hub:** add short cards linking to `/for/crowdfunding-graduate`, `/for/shopify-preorder`, `/for/made-to-order-hardware`. Each `/for/*` lander reuses the home skeleton with language + mechanism swapped, testimonial slot = `[CASE STUDY PLACEHOLDER]`.

**`/#pricing` (Pilot)** — restructure per §S9. Numbers HELD, `/book` CTA, guarantee adjacent.

**`/security` + `/procurement`** — **do not touch content.** These are the trust surfaces Swan lacks. Just link them harder (S3 strip, FAQ, footer, near final CTA). Optionally reskin headers with a paper divider only — no copy change.

**`/status/demo` (NEW, product-proof)** — a public, sample-data status page a prospect can open from S2/S5. Reuses `/status/[token]` in demo mode. Shows first name + confidence-band timeline only (no email/LTV) — doubles as a live privacy demonstration.

**`/resources` + `/resources/[slug]` (NEW, phase 2)** — founder-voice build-in-public log. Post template mirrors Swan: Fraunces headline, single "— Dylan" byline, a "The short version" takeaways box (renamed from "Key Takeaways" for the calm voice), 4–6 H2 sections, one inline CTA ("See a live status page →", not a fake chat), related-posts row, newsletter capture. Seed with 1–2 evergreen SEO guides ("how to answer WISMO tickets during a long fulfillment delay") + Dylan's operator log. Numbers only if real and his own; `[CASE STUDY PLACEHOLDER]` otherwise. Bursty founder cadence is fine — don't fake a calendar.

**Footer** — extend to the 4-column persona/use-case model as `/for/*` and `/resources` ship; add newsletter capture then.

---

## 6. IMPLEMENTATION NOTES (Next.js 14 + Tailwind)

### 6.1 Component survival map
| Component | Verdict |
|---|---|
| `Nav.tsx` | **Keep.** Add a "Who it's for" dropdown (persona links) as `/for/*` lands; keep flat until then. Primary CTA stays "Book a pilot" → `/book`. |
| `Hero.tsx` | **Keep, refine.** New copy (S1) + paper-wave backdrop + secondary CTA scrolls to demo. Reply card unchanged. |
| `LongWait.tsx` | **Keep.** Add the warming tide-line strip under the stage cards. |
| `HowItWorks.tsx` | **Keep.** Add numbered pipeline (S6). `condensed` prop stays the home/full switch. |
| `HonestFit.tsx` | **Keep.** Becomes persona hub on `/who-its-for`. |
| `Pilot.tsx` | **Keep, restructure in place** (tier row + usage explainer + deferred-fee micro-section). Numbers HELD. |
| `FAQ.tsx` | **Keep as-is.** |
| `FinalCTA.tsx` | **Keep as-is.** |
| `Footer.tsx` | **Keep, extend columns** as network grows. |
| `Operator.tsx` | **Keep, MOVE onto home** (S8) + add portrait. Currently only on `/how-it-works`, `/vsl/landing-vsl`. |
| `lib/proof.ts`, `Reveal`, `Button`, `CalButton`, `Logo` | **Keep, reuse everywhere.** |

### 6.2 New components to build
- `components/marketing/CapabilityShowcase.tsx` (S2) — 6-card grid, deep-links to demo.
- `components/marketing/TrustStrip.tsx` (S3) — integration chips + founder anchor + `/security` link.
- `components/marketing/LiveDemo.tsx` (S5) — cockpit demo embed / looping capture, before→after frame.
- `components/marketing/BeliefBlocks.tsx` (S7) — 3-column objection killer.
- `components/ui/TideDivider.tsx` — the `wave`/`torn`/`crest` SVG divider primitive (reused site-wide).
- `.paper-grain` utility + `.paper-stack` (double-edge) added to `globals.css`.
- Phase 2: `app/resources/`, `app/for/[vertical]/`, `app/status/demo/`.

### 6.3 Build order
1. **Design primitives first:** `TideDivider`, `.paper-grain`, `.paper-stack`, `.panel` paper-lift hover. (No content risk, unblocks everything.)
2. **Hero refine** + paper backdrop.
3. **CapabilityShowcase (S2)** + **TrustStrip (S3)** — the two new beats that make the page concrete + fill the credibility slot.
4. **LiveDemo (S5)** — highest-leverage, build the embed against `/app` demo mode.
5. **BeliefBlocks (S7)** + move **Operator** onto home (S8).
6. **Reassemble `app/page.tsx`** into the new order.
7. **Pilot restructure (S9)** — serialize this alone (it's the pricing hot area).
8. Phase 2: `/resources`, `/for/*`, `/status/demo`, footer columns, nav dropdown.

Drop Dylan's images in as they arrive; ship with SVG line-art motifs + captured screenshots first so no section blocks on art.

### 6.4 MUST NOT change (hard constraints)
- **Pricing numbers HELD** — free pilot → $199–$499 → $799–$999+, deferred performance fee. No new prices, no self-serve checkout. `Pilot.tsx` restructure is layout-only.
- **Cal.com booking stays the CTA backend** — every primary CTA → `/book` via `CalButton`. Do not swap for self-serve trial (that's Swan's motion, not ours).
- **`/security` + `/procurement` content untouched.**
- **Proof-lint / proof-only doctrine:** no fabricated metrics, logos, testimonials, or case studies. Keep `assertNoHardDate` at send time and `citedStat(...)` on every external number. `CASE_STUDY_PLACEHOLDER` renders as a designed element, never a blank. Founder self-reported numbers are the only unattributed numbers allowed. Confidence bands only, never hard dates.
- **Hot-file serialization** (CLAUDE.md): `app/app/inbox/page.tsx`, `DraftRail.tsx`, `ApprovalBar.tsx`, `app/app/page.tsx`, `lib/engines/reassurance.ts` — one in-flight change at a time. The LiveDemo embed reads these product surfaces; touch them serially and verify each.
- **Verification gate before merge:** `cd tideover && npm run verify && npm test` green (seed-check · proof-lint · eval · lint · build).

### 6.5 The three things we do differently from Swan (proof-only reconciliation)
1. **Swan §3 logo bar → our TrustStrip** = integration logos (factual) + founder line + `/security` link. Both true.
2. **Swan §10 testimonials → our Operator block** = founder's lived-pain first-person account + designed `[CASE STUDY PLACEHOLDER]`.
3. **Swan §4 video → our LiveDemo** = the real cockpit on sample data, a stronger "this is real" than logos and something Swan's homepage doesn't have. Everywhere Swan uses vibes, we match the *mechanic* honestly — which is exactly what Swan itself does (zero fabricated metrics on their own site), just without the real customers we haven't earned yet.

**Aesthetic differentiator:** Swan's paper is playful-zoo/energetic. Tideover's is warm/calm/reassuring — tide, boat, buoy, lighthouse, calm horizon. Same proven paper-craft family, opposite emotional register, so we borrow the mechanics without cloning the look.