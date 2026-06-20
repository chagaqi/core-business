# LANDING-PAGE DESIGN PROMPTS — paste-ready briefs for Claude (Artifacts)

> **What this file is.** Two complete, copy-whole prompts you paste into Claude's artifact/design feature to generate a redesigned, **single self-contained HTML file** landing page — one for **ADWIELD**, one for **TIDEOVER**.
>
> **How to use.** Copy everything between the `=== ... DESIGN PROMPT ===` line and the next `=== END ... ===` line. Paste it into a fresh Claude chat. That's the whole instruction — it's written so Claude needs nothing else.
>
> **The one rule both prompts enforce, hard:** PROOF-ONLY. Claude must never invent a metric, case study, testimonial, review, star rating, or client logo. Every number is a *target to measure*. Where proof would go, it uses the free offer + the guarantee + "founding/early" framing + literal `[CASE STUDY PLACEHOLDER]`s. Merge fields like `{{first_strike_form}}` stay as literal placeholders.
>
> **The design brief in both:** lead with ONE clear value prop, cut clutter, value lands in ~5 seconds. Simplicity is the explicit goal — fewer sections, less copy per section, one decision per screen.

---

=== ADWIELD DESIGN PROMPT ===

You are designing a premium, conversion-optimized landing page. Output **one single self-contained HTML file** — all CSS in a `<style>` block in the `<head>`, no external assets, no frameworks, no CDN links, no external fonts (system font stack only). Any JS must be tiny and progressive-enhancement only; the page must be fully functional and readable with JS disabled. The page must be fully responsive (mobile-first, looking great from 360px to 1440px+) and accessible (semantic HTML, proper heading order, focus-visible states, alt/aria where needed, prefers-reduced-motion respected).

## THE BRAND
**Adwield** (always one word, capital A — never "Ad Wield," "AdWield," or all-caps in body). Domain: adwield.com. It's an **AI-native ad-creative engine** for $20–100K/mo functional-consumables brands (mushroom coffee, adaptogen gummies, functional beverages, greens, nootropics).

**One-line positioning (the whole brand in six words):** *You don't hire an agency. You equip a weapon.*

**Hero line (lead with this, verbatim or near-verbatim):** "Equip us as your secret weapon — raise your hit rate, land more critical strikes in the ad auction."

**Tagline (use once, under the hero or in the footer, not stacked):** "More hits. More crits. Every two weeks."

## THE AESTHETIC / VIBE — read this carefully, it's the hardest part
Premium, modern, restrained SaaS surface — think **Linear / Vercel / Raycast**: clean geometric/grotesk type, generous whitespace, a sharp grid, dark-mode-native. Onto that surface, layer a **tasteful RPG-HUD / crest** wink — "linear-meets-loadout." The game flavor lives in the *vocabulary and a few precise details*, NOT in the skin.

- **A crest/sigil mark** (geometric, monoline, modern — reads as a premium guild mark, with the "A" able to anchor it). Use it in nav + footer.
- **A HUD-style stat readout** for the four brand terms (clean labels, monospace numerals, thin rules, one small glowing dot accent).
- **A "loadout" card-grid** motif for the 4×24 (a tidy slotted grid reads instantly as "a loadout").
- **Palette:** near-black / deep charcoal base (around `#0B0D12`) + off-white text. **Exactly two accents, max:** one "equip" color — a forged steel-blue / electric cyan (~`#5EC8E6`), used sparingly for CTAs and the crest; and one "crit" color — a molten amber / forge-orange (~`#F4A23B`), used RARELY, only to signify a crit or the free First Strike. Scarcity of the amber is what keeps it premium.
- **Type:** one confident sans for headlines, one clean sans for body, monospace only for HUD/labels/numerals. No decorative or fantasy fonts, ever.

**HARD "DO NOT" list (this is a $20–100K/mo buyer — it must look like a weapon a serious operator equips, not a costume):** no WoW clipart, no dragons, no swords-as-clipart, no glowing runes, no pixel-art, no parchment/leather/metal-bevel textures, no lens-flare "EPIC" energy, no emoji, no exclamation-mark hype, no rainbow gradients, no more than two accent colors, no hype-sticker badges. The test for every visual and every line: *would a sharp, skeptical, burned-once founder nod, or wince?* If a game element makes him wince, cut it. The swagger has to feel **earned** — and only the free offer + the guarantee earn it.

## VOICE
Premium-with-a-wink, gamer-adjacent, **never cheesy**. Plain declarative sentences. Specificity is the brand: use the real numbers — `4 angles`, `24 variations`, `every 2 weeks`, `~7-week fatigue`, `$20–100K/mo`, `$497`, `capped at 5 brands`. Make the winner the hero and volume the method (never lead with volume, never lead with price, never lead with the word "AI"). No banned hype words (revolutionary, game-changing, cutting-edge, synergy, 10x-as-filler, effortless). Confidence comes from specificity, not slogans.

## SIMPLIFIED VALUE HIERARCHY — the most important instruction
The founder wants MORE SIMPLICITY than a typical SaaS page. **Lead with ONE clear value prop. The visitor must "get it" in about 5 seconds.** Cut clutter ruthlessly.

- The hero does ONE job: state the weapon frame + the single promise, with ONE primary CTA dominant. Keep the hero sub-copy to ~2 short sentences.
- Below the hero, a compact HUD stat-readout of the four terms (Hit rate / Critical strike / Loadout / The Fatigue Wall) — short definitions only, this IS the explainer, so the rest of the page can stay lean.
- Each section after that makes ONE point and gets out. Short paragraphs. No section should require scrolling-while-reading to grasp.
- One decision per screen. Don't make the visitor weigh five things at once.

## THE FOUR BRAND TERMS (use consistently — these are the AIM/MECHANIC, never a claimed result)
- **Hit rate** — how often a shipped creative actually wins (beats the control). The aim we swing for.
- **Critical strike / crit** — a breakout winner that *scales*. The aim, never "we land 3 crits a month."
- **Loadout** — your 4 angles × 24 variations per 2-week cycle (the 4×24 Framework), launched + tagged in your own account.
- **The Fatigue Wall** — creative fatigue at ~7 weeks; the weapon keeps a fresh winner equipped before the last one breaks against it.

## PAGE SECTION ORDER (build exactly this, top to bottom)
1. **Sticky nav** — crest + "adwield" wordmark, a few anchor links, one primary CTA button ("Claim First Strike").
2. **Hero** — eyebrow ("The AI-native ad-creative engine · functional consumables"), the hero line as H1, the tagline once, ~2 sentences of sub-copy, the dominant primary CTA + one quiet secondary link, a one-line no-risk note ("No card. No pitch deck. One battle-ready ad of your product, before you spend a coin."). Then the **HUD stat-readout** of the four terms.
3. **The Fatigue Wall** — the problem section. One tight argument: every winning ad dies on a clock (~week 7); a two-person team can't produce fresh creative fast enough; you're short on hands, not ideas. A simple, restrained decay-curve illustration (inline SVG, not clipart) is welcome.
4. **The Loadout (the 4×24 mechanism)** — one section: 4 hypothesis angles → 24 production-grade variations → launched, read at 2 weeks, reloaded. Show it with a clean loadout card-grid (4 angle cards, slotted variation grid, an occasional amber "crit" slot). One honest note: the edge is operator judgment + economics + production hands, not the name; claims are FTC/Meta-screened.
5. **First Strike (Free)** — the trust spine. One free, made-for-them ad of THEIR product, pulled from their real site + reviews, before they pay anything. Short "how it works" steps. Amber-accented (this is a crit moment). Primary CTA: "Claim your First Strike."
6. **Choose Your Path** — the DFY-vs-DWY selector, TWO cards only:
   - **Path A — Hire a Maxed-Out Knight (Done-For-You):** "We wield it for you." A max-level operator runs the full loadout in your account; you greenlight angles and watch the crits land. CTA: **"Hire your Knight."** Tag: retainer quoted live, capped at 5 brands.
   - **Path B — Build a Forge in Your Domain (Done-With-You):** "We install the Adwield Forge inside your domain — your tools, your account, your crew — and train your team to wield it; the weapon stays yours." Lean on the domain double-meaning (your kingdom AND your website/ad-stack). CTA: **"Build your Forge — by application"** (founding cohort / opening after the first documented wins).
7. **The No-Risk Loadout (guarantee)** — headline: "Beat your control or the next cycle's free." Then the FULL locked guarantee language, verbatim, in a quoted block: *"Within 30 days, our creative beats your current best ad on hook-rate / hold-rate (3-second + thumbstop) AND your CPA holds flat or better — measured against your own control, in your own account, with the head-to-head data on the table. If it doesn't, your next 24-variation cycle is free. Month-to-month, cancel anytime, and you keep every video either way."* Three short supporting points (metric we control / CPA holds / you keep every video).
8. **Honest proof** — frame newness as the *reason* the free First Strike + guarantee exist. The First Strike is the proof; judgment shown via teardowns; ONE real hold-rate number off the founder's own small test, honestly labeled. Then a literal **`[CASE STUDY PLACEHOLDER]`** block where founding-partner deltas will go (control vs. winner on hook-rate, hold-rate, CPA-flat, baseline-first). State founding slots are limited and real.
9. **FAQ** — 6–7 sharp-operator questions (Isn't this AI slop? / Why trust a newer shop? / How do you make 24 ads off 4 approvals? / How much of my time? / What does it cost? / What if I already run 90 creatives a week? / Do I own the work + which vertical?).
10. **Final CTA** — restate the single offer: watch one battle-ready ad of your product, free, before you spend a coin. Primary CTA "Claim your First Strike" + quiet "Book a call instead." Tagline once.
11. **Footer** — crest, tagline, link columns, and a legal/honesty line: hit rate and crits describe the aim and mechanism, not a guaranteed or past result; every figure is a target to measure; no prior paid-ads track record claimed; the guarantee terms in the guarantee section govern; functional-consumables only; produced-creative claims are substantiation-gated and FTC/Meta-screened.

## THE EXACT CTAs (use these words)
- Primary, free: **"Claim your First Strike"** (free — no card, no pitch).
- The selector: **"Choose Your Path"** → **Knight (DFY)** and **Forge (DWY)**, with button labels **"Hire your Knight"** and **"Build your Forge."**
- Quiet secondary where appropriate: "Book a call instead."

## ABSOLUTE PROHIBITION — DO NOT include any self-serve / endgame tier
**Do NOT** add, mention, tease, or design any third path, self-serve software tier, "Open Your Own Forge," "Open the Forge," "Adwield Forge software," waitlist for self-serve, or any "endgame" tier. The page presents EXACTLY TWO paths: Knight (DFY) and Forge (DWY). There is no third option anywhere on the page — not in the path section, not in any tier ladder, not in the footer, not in the nav. If you feel an urge to add an "and there's also a self-serve version coming" line, do not.

## PROOF-ONLY — HARD RULE (governs everything)
**Never fabricate metrics, case studies, testimonials, reviews, star ratings, or client logos.** No logo wall, no "as seen in," no invented star ratings, no fake quotes. Every metric (hit rate, crits, hold-rate, CPA) is a **target to measure**, never a claimed number. Keep all merge fields literal: `{{first_strike_form}}`, `{{book_call}}`, `{{contact_email}}`. Keep `[CASE STUDY PLACEHOLDER]` literal where proof would normally sit. The home-gym / past-business background may appear at most once, lightly, as character — never as ad-proof, never as an online/DTC/paid-ads track record. In this niche, the clean empty proof inventory is itself a trust signal — leave it honest.

Now generate the complete single-file HTML landing page.

=== END ADWIELD DESIGN PROMPT ===

---

=== TIDEOVER DESIGN PROMPT ===

You are designing a warm, trustworthy, conversion-optimized landing page. Output **one single self-contained HTML file** — all CSS in a `<style>` block in the `<head>`, no external assets, no frameworks, no CDN links, no external fonts (system font stack only; a system serif for headings is welcome). Any JS must be tiny and progressive-enhancement only; the page must be fully functional with JS disabled. The page must be fully responsive (mobile-first, beautiful from 360px to 1440px+) and accessible (semantic HTML, correct heading order, focus-visible states, alt/aria where needed, prefers-reduced-motion respected).

## THE BRAND
**Tideover** (tideover.app) — from "to tide someone over": to sustain a person through a hard in-between stretch until things get better. It's a **presale-specialist customer-support layer for the long wait**. Presale/preorder brands collect cash today and ship in 60–120 days; that gap is an emotional liability where anxious buyers turn into refund requests and chargebacks. Tideover keeps those buyers calm and aboard until their order ships.

**One-line positioning:** *The support layer that tides your customers over until their order ships.*

**Hero headline (lead with this):** "Keep your presale buyers calm — and aboard — through the long wait."

**Subhead:** Tideover plugs into the Gorgias, Tidio, or Intercom you already use, knows each order's real production timeline, and answers the long wait with calm, human, timeline-aware reassurance — so "where's my order?" doesn't become a refund.

## THE AESTHETIC / VIBE
**Warm, calm, human, trustworthy, soft, reassuring.** This is a trust + empathy brand — the visual opposite of a cold helpdesk. It should feel like a steady, reassuring person, not a SaaS dashboard.

- **Palette:** warm paper/sand background (off-white cream, ~`#FBF8F2`), deep calm teal/sea as the primary (~`#1F5B6B`), a pale tide tint, soft sand, and a warm terracotta accent (~`#C97A4A`) used sparingly. Soft, low-contrast shadows; generous rounded corners; nothing harsh, neon, or high-contrast.
- **Type:** a warm system serif for headlines (calm, human, settled), a clean sans for body. Comfortable line-height, never cramped.
- **Texture/feel:** soft radial "tide / horizon" gradient washes in the hero, gentle rounded cards, pill-shaped buttons. Calm and unhurried. No hard edges, no aggressive motion.
- **A small wave/tide crest mark** for nav + footer (simple, soft, friendly — concentric waves, not a logo-contest mark).

**DO NOT:** no MMO/gaming/gamified theme, no winking-at-the-reader cleverness, no hype, no exclamation-point energy, no "🚀 revolutionary," no growth-hack tone, no cold/clinical/corporate buzzword voice, no emoji. This brand never winks. Every element either builds calm or it doesn't ship.

## VOICE
Five pillars: **Warm. Calm. Reassuring. Human. Steady.** Write like a real person who genuinely cares the customer isn't left in the dark — contractions, plain words, short settled sentences. Acknowledge the feeling before the fact. Use honest confidence bands ("currently tracking for [month]," "ETA band X–Y"), never invented exact ship dates. Speak to the merchant peer-to-peer, as a fellow operator who's "been in your inbox." No jargon, no "leverage/synergy/cutting-edge." Quietly confident — let the calm carry the authority.

## SIMPLIFIED VALUE HIERARCHY — the most important instruction
The founder wants MORE SIMPLICITY than a typical SaaS page. **Lead with ONE clear value prop. The visitor must "get it" in about 5 seconds:** *Your presale buyers wait 60–120 days and bail; Tideover keeps them calm and aboard, plugging into the helpdesk you already have.* Cut clutter ruthlessly.

- The hero does ONE job: name the pain (paid but waiting) + the relief (calm, aboard) + the single low-friction CTA. Keep hero copy tight — headline, ~2-sentence subhead, one note. A small, calm "reassurance reply" example card beside the copy is welcome (it shows the product in one glance — but keep its text short).
- Frame value on **revenue protection** (keeping the sale, no refund, no chargeback, preserved brand trust), NOT on "cheaper tickets / save money." Refunds and chargebacks threaten the merchant's Stripe/PayPal standing — that's the pain worth paying to remove.
- Each section makes ONE point and gets out. One decision per screen.

## THE BOLT-ON ANGLE — make this PROMINENT (it's a top objection-killer)
Surface this clearly and more than once, including high in the hero and in the final CTA: **No new helpdesk to install. Nothing to rip out. No second inbox. We bolt onto the Gorgias, Tidio, or Intercom you already run — no infra change.** Tideover is a specialist *layer* on top of the merchant's existing stack; it doesn't replace it. It routes/handles presale tickets specifically — the long-wait reassurance — while everything else stays exactly as it is. Use a simple "plugs-into-your-stack" diagram (order data + timeline + backer list → Tideover → your Gorgias/Tidio/Intercom). This zero-integration-risk, bolt-on, routes-only-presale framing is a load-bearing selling point — give it visual weight.

## PAGE SECTION ORDER (build exactly this, top to bottom)
1. **Sticky nav** — soft wave crest + "Tideover" wordmark, a few anchor links, one primary CTA ("Free teardown").
2. **Hero** — two-column on desktop: left = a couple of trust pills ("For 60–120 day presale waits," "Built for Kickstarter & BackerKit graduates"), the H1, the subhead, the primary CTA + a quiet "See how it works," and a prominent bolt-on note ("No new helpdesk to install. Nothing to rip out. We work inside the tools you already have."). Right = a calm reassurance-reply example card (an anxious "where's my order?" message at day ~60, and Tideover's warm, timeline-aware reply with an honest ETA band, footnoted "timeline-aware · human-approved · no hard date promised"). Keep the card's copy short.
3. **The long wait** — the problem, as a months-long emotional journey, not a one-off ticket. A simple 4-step timeline (Day 7 excited → Day 30 first doubt → Day 60 anxious → Day 89 ready to bail / chargeback). Then 3 compact "stakes" cards: chargebacks threaten your Stripe/PayPal standing; WISMO floods your inbox; "scam" reviews stick. Anchor on revenue/standing, not cost.
4. **The presale-specialist layer (how it works)** — the bolt-on mechanism. 4 short points: plugs into your existing stack (no migration); knows each order's real production timeline; timeline-aware, emotionally-intelligent day-stage replies; every novel reply is human-approved (never an auto-fired promise). Include the plugs-into-your-stack diagram here. Then a compact comparison table: Generic helpdesk (Gorgias/Tidio/Intercom) vs. Tideover across — knows it's a preorder / knows the real timeline / handles the 60–120 day journey / tone / replaces-vs-plugs-in.
5. **The founding-partner pilot (the offer)** — a calm, darker "sea" section. Headline: "We'll run your presale support by hand for one cycle. Free." Concierge-first: the founder + drafting system run presale support manually inside the partner's own helpdesk, capturing the day-by-day reassurance language, measured against a clean baseline. A free offer card listing what's included (works inside your helpdesk — nothing to migrate; timeline-aware human-approved replies in two fixed daily windows; a day-by-day reassurance playbook; leading-indicator measurement vs. your baseline; logged "saves"; founder-led). A simple value-ladder line (Free pilot → $199–$499/mo on proof → $799–$999+/mo as it scales; performance fee deferred until a real case study exists). An **honest guarantee** block (leading indicators — faster first response, fewer WISMO tickets, logged saves — measured against your own baseline; if the pilot doesn't move them, you don't pay; the full refund-reduction picture takes a complete 60–120 day cycle and is reported after the first cohort completes, said up front). CTA: "Apply for a founding-partner pilot."
6. **Honest fit** — two columns: "A strong fit if…" (Kickstarter/Indiegogo/BackerKit graduate onto Shopify; hardware/design/made-to-order with 60–120 day waits; juggling backers + late-pledges + new preorders; inbox floods with WISMO; would rather keep the sale than fight a chargeback) and "Probably not yet if…" (ship in-stock in days; want a full helpdesk replacement; regulated/supplement timeline-liability goods; only a handful of orders; want a bot that auto-fires promises).
7. **The operator behind it** — the war story (peer-to-peer credibility). The founder ran a real ~$2M/yr physical-goods company — warehouse, in-house shipping, fulfillment, and the "where's my order?" comms during long waits — and lived this exact problem from the merchant side. A plain-spoken proof pledge: no invented metric, fake testimonial, borrowed logo, or unearned star rating; every number is a target measured against the partner's own baseline; the full refund-reduction case study lands after a real cohort completes — with a literal **`[CASE STUDY PLACEHOLDER — refund-reduction delta, post first completed cohort]`**.
8. **FAQ** — 7 plainly-answered questions (Do I switch helpdesks or install anything? / How is this different from the bot in my helpdesk? / Will you make promises you can't keep? / What does the free pilot involve? / What can you prove and what can't you yet? / What does it cost after the pilot? / I'm a crowdfunding creator juggling backers + preorders — does that fit?).
9. **Final CTA** — calm "sea" section: "The tide always comes in. Their order is coming." Restate the free 15-min presale-support teardown (a real operator looking at your real support, no pitch). Reassurance row repeating: no new helpdesk to install · free founding-partner pilot · talk to the operator, not a queue.
10. **Footer** — wave crest, the one-liner, tideover.app, a teardown button, and an honesty line: every figure on this page is a target to measure, never a claimed result.

## THE EXACT CTAs (use these words)
- Primary, front-door: **"Get a free 15-min presale-support teardown"** (a helpful operator looking at *your* presale support — not a demo-pitch).
- The pilot offer: **"Apply for a founding-partner pilot"** — we run your presale support by hand for one cycle, free.
- Keep the bolt-on / no-infra-change / routes-only-presale framing visible near the CTAs.

## PROOF-ONLY — HARD RULE (governs everything)
**Never fabricate metrics, case studies, testimonials, reviews, star ratings, or client logos.** No "trusted by thousands," no logo wall, no invented refund-reduction percentage, no fake quotes. Where proof would sit, use: the free founding-partner pilot, the leading-indicator guarantee, "founding/early partner" framing, or a literal `[CASE STUDY PLACEHOLDER]`. The verbatim merchant-pain quote about pre-orders may be used ONLY as a cited community quote, never as a Tideover result. Reserve the "$2M" figure for the war story as character, not a number-led flex. Never make hard delivery promises or guarantee exact dates anywhere — confidence bands only; a false promise is the most damaging thing the brand can say. Keep all merge fields literal: `{{book_call}}`, `{{first_strike_form}}`. Every metric is a **target to measure** against the partner's own clean baseline.

Now generate the complete single-file HTML landing page.

=== END TIDEOVER DESIGN PROMPT ===
