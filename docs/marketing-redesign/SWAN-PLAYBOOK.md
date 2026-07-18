# THE SWAN PLAYBOOK
### getswan.com reverse-engineered into a conversion + design reference for Tideover
*Patterns, structure, and principles only. No Swan copy is reproduced; the rare <15-word fragment in quotes is a load-bearing pattern example. All final Tideover copy must be 100% original.*

---

## 1. What Swan is + why the site converts (the thesis)

Swan sells an AI "GTM Engineer": describe a sales/marketing workflow in plain English, and autonomous agents research, enrich, watch buying signals, and fire outreach across the RevOps stack. It is positioned as **headcount replacement** for B2B revenue teams (3 founders, ~200 customers in 2025, $6M raised).

**Why the site converts, in one paragraph:** the homepage is a deliberate *attention → comprehension → belief → proof → objection-clearing → action* staircase where **every proof beat and objection-killer is placed exactly where the corresponding doubt naturally arises**, and it alternates emotional beats (hero, before/after, testimonials, heart-close) with rational beats (benefits, workflows, integrations, FAQ) so it never reads as pure hype or pure spec-sheet. It personifies the product as a *teammate you would otherwise hire* (killing the "just another automation tool?" reflex), makes an abstract platform instantly concrete via six named agent cards, and — critically — **uses zero fabricated metrics**: its credibility rests on specificity of mechanism, named humans, and real integration logos. Every capability card and pricing CTA is itself a doorway into a live, no-login product demo, so the proof *is* watching the product operate.

**The single most important structural fact for us:** Swan's design language is *already paper/origami* — papercraft mascots, layered paper-cut backgrounds, a green folded-paper frame built into the UI chrome. Tideover's PAPER/tide target is not a leap away from a proven high-converting site; it is the **same visual family, validated**. Our job is to borrow the mechanics and differentiate on *emotional register*: Swan is a playful, energetic zoo; Tideover is warm, calm, reassuring (tide, sand, buoy, lighthouse, calm horizon).

**The two load-bearing pillars Swan leans on hardest — a real customer-logo band and a 10-deep named-testimonial carousel — are exactly the two things Tideover is forbidden to fake.** The entire adaptation problem reduces to: keep Swan's structural slots, but substitute *honest* proof (live demo, mechanism specificity, founder credibility, real /security + /procurement surfaces Swan doesn't even have) into the two slots where Swan uses logos and testimonials — never leaving those containers empty.

---

## 2. Site map + page-type inventory

Swan runs a **flat, template-driven, programmatic-SEO mesh** — not a hub-and-spoke. Every page links to every other page for internal-linking value.

| Surface | Count | Role |
|---|---|---|
| Homepage | 1 | Full 12-section conversion staircase (§3) |
| **Role landers** ("By Role") | 6 | Deepest tier; persona-adapted problem/metrics per job title. Shortest FAQ. |
| **Use-case landers** | 7 | Mid-depth; mechanism/JTBD-driven. Longest FAQ (category education = SEO layer). |
| **Solution page** | 1 | Thinnest tier; compressed skeleton, footer-only. Long-tail SEO surface. |
| **/compare/** landers | several | "False-choice" SEO pages: comparison tables + quadrant scatter, founder "expert tip" byline, cites Reddit/G2 as indirect proof. |
| **Blog** | 8 posts | Single content type; founder-voice build-in-public journal (§6). |
| **/about** | 1 | Founder credibility (names, photos, "two exits," "200 customers / 3 people"). |
| **/pricing** | 1 | 4-card tier row + usage explainer + billing-only FAQ (§5). |
| App (`agent.getswan.com`) | — | Separate Clerk-auth React app + public no-login `/assistant` chat demo. |

**Absent on Swan (Tideover opportunities):** no /security, no /trust, no /case-studies, no gated content, no glossary. Swan gets away with this because its buyer is sophisticated and self-serve. Tideover's buyer (a stressed merchant mid-refund-crisis) benefits from the surfaces Swan skips — so building them is *differentiation, not just parity*.

**The 3-tier depth ladder is the phasing plan for Tideover:** ship 2–3 deep flagship pages first (homepage + top role/use-case), then thin SEO variants later. Do not build 14 landers on day one.

**Tideover nav (portable as-is):** persona-first ordering. `Logo · By Role (Solo founder / CX lead / Ops) · Use Cases (crowdfunding delays / Shopify preorder / made-to-order / 60–120 day waits) · Blog · Pricing · [secondary link] · [primary CTA]`. Persona/use-case dropdowns sit *before* Blog/Pricing, signaling the site is organized around *who you are* and *what you want*, not features.

**Tideover footer (portable):** mirror Swan's columns — Use Cases / By Role / Company / legal — plus a newsletter capture as the soft-conversion fallback. This footer *is* the programmatic-SEO sitemap.

---

## 3. The homepage formula — section by section

Twelve sections. For each: JOB → what Swan does → Tideover translation.

**§1 — HERO.** *Job: plant the category belief in one breath and name a role, not a feature.* Text-only (no screenshot/video); the whitespace signals confidence. 4-word imperative headline personifying the product as a hire ("Meet Your [role]"). Two-sentence subhead: sentence 1 = mechanism + speed claim + an alliterative outcome-bookend ("from prompt to pipeline"); sentence 2 = an X-not-Y positioning stake ("with intelligence, not headcount"). Two action CTAs at different commitment levels (self-serve trial + "Ask Swan" curiosity CTA). No numbers.
→ **Tideover:** headline = outcome-role personification ("Meet the teammate who answers 'where's my order?'"). Subhead = mechanism + speed + X-not-Y stake ("keeps backers calm while you wait on the factory — without hiring a support team"). Secondary CTA = **"Try a live draft"** (product-led interactive demo) — our single strongest in-hero proof substitute since we can't flex logos. No announcement/promo bar; keep the top edge clean.

**§2 — AGENT SHOWCASE CAROUSEL (6 cards).** *Job: make the abstract platform instantly concrete; kill blank-canvas fear.* Each card = named mascot + 2–3-word capability label + one verb-first outcome line + integration logos + click-through into a pre-filled live prompt.
→ **Tideover (most portable pattern on the site):** six *real* concrete jobs — reassurance-reply drafting · refund-risk scoring · WISMO auto-triage · status-page updates · backer digest · escalation flags. Each gets a small paper/tide motif (wave, buoy, lighthouse, tide-line — not zoo mascots). Integration logos = Shopify/Klaviyo/Gorgias/Zendesk. Every card deep-links into the live reassurance-draft demo, pre-seeded for that job. **Honest by construction** — these are all real capabilities.

**§3 — SOCIAL-PROOF LOGO BAR.** *Job: borrow credibility the instant the product feels real.* Minimal 2-word header ("Trusted By") + 9-logo monochrome scrolling row.
→ **⚠️ Tideover (CRITICAL — proof-only):** we cannot run a customer-logo bar. This slot **structurally needs a credibility beat**, so fill it honestly, do not skip it. Substitute (strongest first): (a) an **embedded live/looping demo** of the cockpit drafting a real reassurance reply — a working product shown early beats logos and is the highest-leverage build; (b) a **founder-credibility band** (Dylan's real COVID gym-equipment 60+ day-wait story); (c) the *integration* logo strip (Shopify/Klaviyo/etc. — factual connection, not endorsement). Never render this container empty.

**§4 — PRODUCT VIDEO / DEMO.** *Job: show, don't tell; convert the "sounds too good" skeptic.* Headline uses an **analogy to an already-loved product** ("Swan is Lovable for GTM") as a comprehension hack, + a "see it in action" nudge + video frame.
→ **Tideover:** this is where the **live interactive draft-a-reassurance-reply demo** lives (not a passive video). Analogy headline is portable only if the reference genuinely fits our merchants; use sparingly.

**§5 — THREE-COLUMN BENEFIT BLOCKS.** *Job: convert features into a differentiated worldview; kill the top 3 conceptual objections.* Every block runs the same 3-tier rhythm: **label → aphorism → 2-sentence mechanism.** Aphorisms are X-not-Y or capability boasts ("Intelligence, Not Automation"); explainers position **by negation of the category** (traditional tools vs. Swan).
→ **Tideover:** steal the label→aphorism→mechanism rhythm and X-not-Y device exactly. Our three objections to kill: "won't it sound robotic/off-brand?" → *your voice, not a template*; "I don't trust AI talking to angry backers" → *drafts for your approval, never auto-sends* (our human-in-the-loop moat — lean hard here); "my delays keep changing" → *update the timeline once, every reply updates.*

**§6 — DEEP-DIVE AGENT WORKFLOWS.** *Job: prove depth for the now-engaged evaluator; move belief from "cute" to "capable."* Six agents expanded into numbered 4–5-step workflows (Detect → Enrich → Research → Draft → Send), tied by a customer-journey spine. "For every X" totality header.
→ **Tideover:** show the reassurance pipeline as numbered steps — Detect WISMO ticket → Pull order/shipment status → Score refund risk → Draft on-brand reply → **Route to operator for approval.** The visible human-approval final step is our trust differentiator; put it *in* the flow, never hide it.

**§7 — ROLE-BASED BEFORE/AFTER (tabbed).** *Job: the empathy peak — prospect sees their own chaos, then calm.* Tabs by persona. "Before" = deliberately busy/stressful tangle of tools, notification spam, time-cost narrated in concrete tool-names. "After" = one plain-English prompt → visible AI reasoning → a calm "Done." The contrast *is* the argument.
→ **Tideover (enormously on-brand):** tabs by Solo founder / CX lead / Ops. Before = inbox flooded with angry "WHERE IS MY ORDER," refund threats, chargeback warnings (stressful, red). After = a calm queue of pre-drafted on-brand replies awaiting one-click approval (sand/teal — literally the tide coming in to calm the water). This is where PAPER + tide earns its emotional keep. **Highest-priority visual asset** (see §8 shot list).

**§8 — INTEGRATIONS GRID.** *Job: kill "will it work with my stack?" right before commitment.* ~20-logo grid + scale-boast headline + "no custom integration work" + re-engagement CTA.
→ **Tideover (straight, honest port):** real logos we integrate with (Shopify, Klaviyo, Gorgias, Zendesk, ShipStation). This is an *integrations* grid, not endorsements — it satisfies both the stack objection AND gives us a legitimate logo beat the proof-only doctrine allows.

**§9 — SECONDARY-SURFACE FEATURE (Slack co-pilot).** *Job: "it meets you where you already work"; widen perceived surface area.* Eyebrow label + benefit headline + "without leaving [tool]."
→ **Tideover (optional, secondary):** operator cockpit + customer status pages — the surfaces where the work lives. Keep it a minor beat, not a headline.

**§10 — TESTIMONIALS CAROUSEL.** *Job: emotional social-proof peak immediately before the ask.* 10 attributed cards (name/title/company/headshot), senior titles for authority. **Quotes chosen for emotion and specificity, not stats** — zero metrics. One meta-proof quote turns the tiny 3-person team into a credibility flex.
→ **⚠️ Tideover (proof-only):** cannot fabricate one. Substitutes: (a) the **founder's first-person account** as the "testimonial" (real person, real lived pain); (b) `[CASE STUDY PLACEHOLDER]` cards designed to look *deliberate* ("early results coming"), not like an empty div; (c) specificity-of-mechanism copy. **Strategic lesson to bank:** Swan's best testimonials contain zero metrics — when we collect real ones, chase "heartbroken"-style emotional specificity, never fake percentages. Build the tilted-paper testimonial component now; populate later.

**§11 — FAQ ACCORDION.** *Job: sweep the last rational objections — mostly billing/credits mechanics.* 6 Q&As in the customer's worried voice; plain, specific, reassuring answers.
→ **Tideover:** pre-empt "does it auto-send?" (no, you approve), "will it sound like us?" (learns your voice), data/privacy, "what if the delay changes?", pricing mechanics. **Pricing numbers are HELD — keep pricing answers mechanism-level, anchored to existing copy.**

**§12 — FINAL CTA.** *Job: narrow to one action once every doubt is retired.* Compact block, single button, emotional-payoff visual (a small origami heart) rather than another argument. No competing links.
→ **Tideover:** one button → Cal.com booking / live demo. A warm paper/tide closing motif (small paper wave or calm horizon) instead of a heart. Resist secondary links.

**The governing sequence law:** proof escalates in commitment cost — cheap/passive proof early (logos), high-trust specific proof late (testimonials), objection-cleanup last (FAQ). Tideover keeps the escalation ladder and swaps the *contents* of the logo (§3), metrics, and testimonial (§10) slots.

---

## 4. Proof architecture

**The reusable proof rhythm (copyright-clean, it's structure):** Hero (claim only) → **logo band** (earliest "is this real?") → problem (builds the ache) → solution/capability → **metrics band** → **before/after** (status-quo complexity vs. calm outcome) → **integration logos** → **testimonials** (emotional peak) → FAQ → CTA.

**Device-by-device verdict for Tideover:**

| Swan device | Tideover verdict |
|---|---|
| Customer logo band (9 named brands) | ❌ No honest fill yet — **#1 empty-hole risk.** Substitute: live demo + founder band + integration logos. |
| Named testimonials (11–12) | ❌ Cannot fabricate. Substitute: founder voice + `[CASE STUDY PLACEHOLDER]` + demo. |
| Metrics band (unattributed outcome stats) | ⚠️ Swan gets away with unattributed stats; **we must not.** Replace with *mechanism-true* claims ("every reply cites the actual order and SLA" — true by construction) or an explicitly-labeled illustrative model ("how the math works"), never a customer result. |
| Integration logos | ✅ **Full-strength honest device.** Ship only integrations that genuinely exist. |
| Before/after workflow visual | ✅ Honest + on-brand: chaotic WISMO inbox → calm drafted reply. Product demonstration, not proof-faking. High shot-list priority. |
| Founder-credibility /about | ✅ **Strongest honest lever.** Dylan's lived fulfillment-wait pain is *domain-native proof* — better than Swan's exits. Elevate it. |
| Funding/investor proof | ❌ No raise to cite. **Omit entirely** — do not create a hole for it. Durability comes from founder + product, not capital. |
| Security/compliance surface | ✅ **Tideover ADVANTAGE** — Swan has none. Merchants handing over customer PII care. Build /security + /procurement honestly (what we actually do), link from footer + near CTA. |
| Comparison / "false-choice" pages | ✅ Honest equivalent: Tideover vs. "hire more reps" / "canned macros" / "generic AI chatbot." The *"honest comparison names the hidden cost"* move is copyright-clean and on-brand. |
| Persona-tailored proof | ✅ Structure honest, content gated — tailor *language and mechanism* per segment; tailored testimonials stay placeholders. |

**Three transferable trust-manufacturing tricks (steal the mechanics, all honesty-compatible):**
1. **Proof by restraint** — Swan spins a small team + revenue-per-employee as *discipline = durability*. Tideover: "built by someone who ate 60-day waits for two years" is a feature, not an apology for being pre-scale.
2. **Specificity as proof substitute** — where Swan lacks certifications, it over-specifies the *mechanism*; concreteness reads as competence. This is Tideover's cheapest, most abundant honest proof and doubles as anti-slop copy.
3. **The honest-comparison flex** — concede a competitor's genuine strength, then name the *hidden* cost the invoice doesn't show ("Yes, a macro is free. Here's the cost it hides: the refund spike from silence"). Conceding builds trust that the pitch is credible.

**The hard rule for the design/build agent:** never render a social-proof container that will ship empty. Either fill it with an honest substitute above, or remove the container and re-tighten the flow so the gap is invisible.

---

## 5. Pricing mechanics

Swan's /pricing page — **structure, not numbers** (Tideover prices stay HELD, exactly as in `tideover/components/marketing/Pilot.tsx`: free pilot → mid → scale):

1. **Four-card ascending row.** The lowest two tiers differ mainly by *usage quantity*, not feature set — making the first decision "pick your volume," which is easier than a feature-gated choice.
2. **Visually-emphasized anchor tier** (badge + heavier card) sits in the middle.
3. **Enterprise/custom is a visible full card in the row**, never exiled to a "contact sales" footnote — signals the product scales without inventing a price.
4. **CTA splits by tier, not tone:** self-serve friction (checkout) only at the *bottom* of the ladder; a conversational, human-assisted CTA ("Ask Swan," framed as a conversation not a form) at the anchor + custom tiers.
5. **A dedicated "how usage works" explainer** sits right under the cards, in plain language, *before* the FAQ — it defuses the "what am I actually buying?" confusion a consumption model creates, and it **states the unfavorable case (top-up premium) up front**, which reads as trustworthy.
6. **The #1 pricing objection gets its own standalone micro-section** ("What's a seat?") — promoted out of the FAQ, not buried as item #4.
7. **Billing-mechanics-only FAQ** directly under the table (~6 items, ordered mechanism → flexibility → edge cases). Nothing about product efficacy or trust — that lives elsewhere.
8. **Gap, not a pattern:** Swan has *no* guarantee / risk-reversal copy anywhere; it leans on its logo strip instead. We can't, and we already exceed it here.

**Tideover translation (numbers untouched):**
- Turn the current inline value-ladder pill-chips into a **3-card row** (Free pilot / Proof-priced / Scale-priced) so it reads as a real pricing section. Same numbers, same "deferred performance fee" line.
- **Flip which end is assisted:** our entry point (the free pilot) is the one needing a human — it's an "apply" that routes to Cal.com. That's correct; don't bolt on a self-serve checkout. Pricing is held; the pilot is deliberately concierge.
- Emphasize the middle/last card honestly — **not "Most Popular"** (no data) but e.g. "where most partners land after proof." Anchors attention without a fabricated popularity claim.
- **Add the usage explainer block** (highest-leverage borrow): what counts as scope/usage at each stage and what triggers moving pilot → proof-priced. Our staged/deferred model raises the same "what am I buying?" question credits do, and currently has zero explainer.
- **Promote one objection to its own micro-section** ("how is the deferred fee actually triggered/calculated?") — currently homeless.
- **Add a compact, mechanics-only FAQ** under the ladder: how the pilot is scoped, what triggers moving off pilot pricing, what if the presale cycle runs long/short, whether integration requires migration, how the deferred fee is measured/paid. 4–6 items.
- **Keep the guarantee box adjacent to the ladder** — it's our honest substitute for Swan's missing risk-reversal *and* its logo strip; already positioned correctly.
- Show the top of the ladder as a real card, not a footnote (Swan's "enterprise is visible" pattern).
- **Not applicable:** an annual/monthly toggle — our pilot-then-proof ladder isn't a recurring self-serve price, so a toggle would be noise.

---

## 6. Content engine + templates

Swan runs **one content type: a founder-voice thought-leadership blog** (8 posts, single author = the CEO). No glossary, gated ebooks, webinars, or video hub. It's a *build-in-public journal toward a stated metric goal*, not a keyword-cluster SEO machine.

**Blog index:** hero tagline frames the whole blog as the company's own trajectory-as-content. Flat vertical card grid (image + headline + date + one-sentence dek). No categories/tags/filters/pagination. One newsletter form at the bottom.

**Post template (rigid across all 8):**
1. **Headline** — number/dollar-driven or trend-declarative; dramatic framing over descriptive ("We Spent $X…", "The Rise and Fall of…").
2. **One-sentence narrative dek**, usually with a concrete result number.
3. **Byline block** — circular author photo + name + title + date + read-time. Same single founder every time; no guest/team bylines.
4. **"Key Takeaways" callout box** near the top — conclusions *before* the argument. On nearly every post.
5. **Body** — 4–6 H2 sections, short 2–3-sentence paragraphs, heavy bold, occasional charts on data-heavy posts.
6. **Length scales with how how-to it is** — ~400–500 words (opinion/news) up to ~2,200–2,400 (deep tactical playbook), not fixed.
7. **One in-body CTA** ("Ask Swan") mid/late — a product touch disguised as a content interaction, never a banner ad.
8. **Close** — repeated author bio, a 2–3-card "Explore More" related row, footer. No comments. Newsletter capture once mid-post + once at bottom.

**Topics** chase AI-operator search intent tied to the buyer's job (AI SDR effectiveness, pricing/margin models, context-vs-prompt engineering) — thought-leadership that pre-sells the worldview without keyword-stuffed "ultimate guides."

**Cadence:** bursty and founder-paced (3-post launch batch, then every 2–4 weeks, then gaps, then back-to-back) — not a fixed editorial calendar. Consistent with a tiny team.

**Tideover translation:**
- Every post signed **"— Dylan"** (matches the established founder-credibility anchor).
- Frame the blog as the founder's real **60–120-day-fulfillment operator log** — legitimate because it's Dylan's actual story.
- Keep the "Key Takeaways" box, renamed for warm/calm voice (e.g. "The short version").
- Numbers-in-headline posts **only with real Dylan numbers** (his own wait-time/refund figures) — never invented.
- In-body CTA = "See a live status page" / "Try a live draft," pointing to the *real* demo (Tideover has no conversational agent to send them to).
- Replicate bursty founder cadence as-is; don't fabricate a calendar.
- No gated content, no case-study page — matches proof-only; `[CASE STUDY PLACEHOLDER]` until real.
- **Gap Swan skips that Tideover should fill:** a couple of evergreen merchant-intent guides (e.g. "how to respond to WISMO tickets during a fulfillment delay") — doubles as SEO capture for merchants actively searching for help mid-crisis.

---

## 7. Signup / CTA flow

**Two parallel top-of-funnel CTAs on every surface** (nav, hero, pricing, feature cards): a self-serve "Free Trial" + a conversational "Ask Swan." Visitors self-select between "let me try it" and "let me ask first" rather than being forced down one funnel.

**CTA discipline:** only **3 placements per page** (sticky nav, hero, footer band) — no mid-scroll CTA spam. They rely on the persistent nav button.

**The signature mechanic — product-as-marketing:** a **public, no-login AI chat** at `agent.getswan.com/assistant` is the real sandbox. It opens with starter chips ("Ask about pricing," "Talk to a human," "Start trial"), shows a **visible live agent trace** ("thinking" / "skill read") before answering. Each of the 6 homepage feature cards **deep-links into that same chat pre-seeded with a use-case-specific question** via URL query param — one shared demo surface, many contextual entry points, instead of a separate sandbox per feature.

**Friction points to NOT copy:** the "Free Trial" button opens the app subdomain and lands on **Sign In by default** ("Welcome back") — a first-time visitor must notice a small "Sign up" link. Auth is a Clerk split-screen that *does* carry proof into the wall (testimonial carousel + logo strip + mascot on the brand panel — a good pattern). Sign-up itself is minimal (email+password or Google/Slack OAuth; no company/team/card field pre-account). Email capture is a plain, ungated footer newsletter — **no exit-intent popup, no countdown, no scarcity, no waitlist language anywhere.**

**Tideover translation:**
- Route every CTA (nav/hero/pricing/persona cards) to **one entry point but let visitors pick framing** — "see the live demo" vs. "ask a question" — not a generic "Get Started."
- **Deep-link each "who it's for" / use-case card into the live reassurance-reply demo, pre-seeded** with that merchant type's scenario (crowdfunding vs. Shopify presale), mirroring the query-param pattern — don't build bespoke demos per segment.
- Keep the **3-placement CTA discipline, but point all three at Cal.com booking** (Tideover has no instant-trial surface). Keep Swan's brevity and confidence; change the destination verb (a 2–3-word verb-led label, not "Free Trial").
- If a booking/waitlist wall is added, **carry proof into that wall screen itself** (founder story, mechanism specificity, live-demo callback) — never a proof-free wall.
- **Stay scarcity-free and ungated** on email capture — consistent with the calm brand and proof-only doctrine.

---

## 8. The design system (what makes it feel crafted)

Marketing site = **Webflow** (Swiper.js carousels); the app is a separate Tailwind/shadcn system — ignore the app tokens. All values below are read from live CSS.

**Color (the discipline is the point):** two warm neutrals + near-black text + **exactly one action color**. Warm off-white base `#f7f5f3` (never pure `#fff` — this is *why* it feels warm), cream secondary panels `#f1ebe5`, near-black text `#0c0b10`. **One coral-red accent `#ff4433` = every CTA AND the lone spot color on each mascot** ("accent = the thing you do"). A teal-green `#387f7d` owns product/feature surfaces (the folded-paper frame, eyebrow pills, chat bubbles). Blue/yellow appear *only* as soft gradient washes, never as solids.

**Type (two families only):** Manrope 700 for all display/headings + buttons; Inter for body/subheads. **Tight display leading (line-height 1.0–1.1)** in Manrope 700 = editorial and confident, not the default 1.2. Body ~18px / 1.5. Headings use **normal tracking** (no trendy negative tracking); only uppercase eyebrow kickers are tracked out. Fluid viewport type engine (~10→11px root). The tight-heading / loose-body contrast is a big part of the crafted read.

**Layout:** max container ~1380px; text measure capped ~450–520px (never full-width paragraphs); asymmetric hero split (not 50/50); very generous vertical whitespace; **every adjacent section uses a different layout** (asymmetric hero → centered video → left-text/right-visual → centered carousel).

**Radius/shadow/motion (restraint):** crisp near-square buttons (~2px radius) vs. very round image frames (~32px) and pill labels — deliberate contrast. Restrained shadows (a 1px ring + soft drop on cards; a white ring for stacked cards; **one dramatic ambient glow behind the hero product**) — editorial, not "material" elevation. All motion `ease-in-out .2–.35s`, uniform and calm (no bounce). Card hover lift `translateY(-10px)`. Testimonial cards **statically rotated 3° / −4°** (physical-card tilt).

**The signature move — paper built into the chrome:** (1) a **proprietary papercraft-mascot system** — named origami animals rendered as *photorealistic physical paper sculptures*, studio-lit on a warm seamless backdrop, each with **one coral prop** tying it to the accent; (2) a **green folded-paper FRAME device** — feature cards and product screenshots sit *inside* an illustrated teal paper folder with origami corners and stacked-paper depth. The paper motif is in the *container*, not just the art.

**Why it reads crafted, not generic:** ownable photographed-paper mascots (expensive, memorable, literally embodies the material); single-accent discipline; warm paper base instead of cold white; tight 1.0 display leading; the folded-paper frame as repeated UI chrome; restrained shadows; human touches (tilted cards, colored props, named characters); coherent calm motion.

**Tideover PAPER/tide translation (use existing brand — do NOT copy Swan's hexes):**
- Base bg → **sand `#FBF8F2`** (plays the warm-off-white role); secondary panels a half-step deeper.
- Text → warm near-black (not pure black).
- **Single action accent → terracotta `#D9762F`** in Swan's coral role: every CTA + the one spot color in every illustration.
- **Secondary brand surface → sea-teal `#0E5366`** in Swan's green role: the folded-paper frame, eyebrow pills, status/chat bubbles. (Conveniently, Swan's own secondary is already a teal.)
- Keep the set that tight: **sand + warm-black + terracotta + sea-teal. No 4th solid.**
- Type: **Fraunces** (display, 700, line-height 1.0–1.1, normal tracking) + **Inter** (body ~18px / 1.5). Adopt fluid `clamp()` type.
- Components: solid terracotta primary + outline secondary CTA pair (Cal.com behind primary); crisp small-radius buttons vs. round image frames; `.8rem` cards with 1px-ring + soft-drop shadow; light-teal eyebrow pills; hover `translateY(-10px)`; `ease-in-out .3s`; one ambient glow behind the hero product.
- **The single most translatable, most ownable move:** wrap product screenshots + the demo in a folded-paper frame — but make the fold a **paper tide/wave edge** (torn-paper coastline, layered paper strata) in sea-teal, literalizing "Tideover." Origami corners → a cut-paper wave lip.

**Shot list (Dylan sources — we cannot generate; PAPER aesthetic, seamless warm-sand backdrop, studio-lit, one terracotta accent element each):**
1. **Before/after "inbox chaos → calm reply" centerpiece** (§7 homepage) — messy WISMO state vs. calm drafted-reply state, in layered-paper/tide motif. **Highest priority.**
2. Papercraft mascot-equivalents mapped to capabilities: (a) folded-paper **boat/ship riding a paper wave** (the "tide over" the wait), (b) paper **parcel** with terracotta ribbon, (c) paper **lighthouse/buoy** (the reassurance beacon), (d) layered paper **tide/beach strata** for section dividers.
3. **Founder portrait of Dylan** — real, warm, for the elevated /about block and testimonial-slot substitute.
4. **Live demo capture** — screen-recording / interactive embed of the cockpit (the §3 slot-2 substitute). *Build, not shoot.*
5. **Real product screenshots** of the operator cockpit + a draft reassurance reply, inside the paper-wave frame.
6. **Customer status-page mockup** (shopper-facing reassurance page) — doubles as product proof.
7. **Comparison-table module** (Tideover vs. hire reps vs. canned macros vs. generic chatbot) with the honest-hidden-cost column.
8. **`[CASE STUDY PLACEHOLDER]` component** — a reusable, intentionally-designed "results coming / early access" card so real proof drops in later without a redesign.
9. **/security + /procurement pages** — content build, no imagery. The differentiator Swan lacks.

*(Caveat from the design pass: the live homepage aggressively redirects automated browsers to sign-in, so testimonial/pricing/footer visuals were inferred from CSS — card rotations, container widths — not directly captured. Everything above the mid-page carousel was captured directly.)*

---

## 9. The copy style guide (the portable rules)

20 mechanics reverse-engineered from Swan. **All examples are original Tideover phrasings** illustrating the mechanic. Port the *structure*; see the two voice-fit caveats at the end.

**Sentence mechanics**
1. **Default to short; punch with fragments.** Section sentences run ~5–15 words. Break rhythm with one-/two-beat period-stops after a claim ("Done." / "One ticket. Full reply."). One longer sentence per section carries the "how"; never stack two long sentences.
2. **Time-compression template:** *"What took [long unit] takes [short unit]."* ("What took a rep an afternoon takes one click.")
3. **Write in triads.** Verb/benefit lists come in threes (*scores, enriches, routes*). Two feels thin, four feels like a spec sheet.

**Headline formulas (pick per page type)**
4. **Hero = personify the product as a role the buyer would otherwise hire.** "Meet your [Job Title]" turns software into a teammate.
5. **Role/segment landers = [reader's job function] + [outcome] + a signature qualifier** that recurs site-wide as a brand tic (Swan's is "in plain English" — pick one and repeat it).
6. **Use-case landers = [mechanism-named category] + a "That…" relative-clause payoff.** The category noun does positioning; the clause does the promise. Variant: a "thinks like your best [role]" analogy.
7. **Pain-section headings = "Why [audience] [suffers specific pain]."** Validate before pitching, then 3–4 named sub-pains as 2–3-word micro-headings ("Tool Sprawl").
8. **Solution headings echo the hero, restated as self-running** ("[The method] That Runs Itself").
9. **Keep a stock of couplet/triad taglines** — conditional couplets ("If you can write it, [product] can build it"), triadic fragment stacks, and especially **antithesis / not-X-but-Y taglines** ("scaling smarter, not bigger" — the highest-value format; build one signature line on this frame).

**Compression: what + who, in few words**
10. **Headline carries who + what; subhead carries how, in exactly one sentence.** Subhead = *[imperative verb] + [object] + "in [time unit]" + [signature journey phrase]*. The alliterative journey phrase names start + end state in three words (Tideover could own a "from ticket to calm" arc).
11. **Coin and repeat proprietary mechanism names** ("Context-Aware Execution") and capitalize them like owned IP. Reuse the same 3–4 site-wide — naming the *how* makes a generic capability feel proprietary.

**Objection-handling (where + how)**
12. **Validate pain before pitching, always in this order:** hero → named-sub-pain block → solution → before/after → proof → FAQ.
13. **Run an explicit Before & After block on every lander.** Left = messy status quo shown as stitched-together tools (name the actual tools the reader juggles). Right = the same job as one plain-language instruction ending in a satisfied result line. Handles "I already have a stack" + "setup is painful" *structurally*.
14. **A "day-in-the-life" cost-of-inaction vignette** in present tense, concrete and sequential, no adjectives. (Tideover: the anxious buyer on day 40 of a 90-day wait, refund button one tap away.)
15. **Handle competitors by mapping tradeoffs, not trashing.** State each rival's genuine strength, position yourself as a *third category* dissolving the tradeoff, and close with conditional buyer-routing ("Choose X if… choose us if…"). Name yourself in every comparison table.

**Specificity**
16. **Named concretes over adjectives.** List the signals/tools instead of "many" / "widely." Specificity is the persuasion; adjectives are filler.
17. **Anchor claims to numbers and hard time-units** ("in seconds," "at 2am"). ⚠️ **Tideover constraint:** the *mechanic* transfers, Swan's freedom to assert unaudited metrics does NOT. Substitute honest specifics — exact reply-draft latency, real ticket-volume ranges from the live demo, named integration counts, `[CASE STUDY PLACEHOLDER]` for outcome stats. Keep the *precision*; never fabricate the number.

**POV, tense, tone**
18. **Second person + product-as-active-hero, present tense.** Address "you/your"; make the *product* the grammatical subject doing strong verbs; lace in imperatives ("Describe it."). First person ("I/we") only in /about and blog, where founder voice earns trust.
19. **Confident, contrarian edge aimed at the old way, never the customer.** Bold category claims, a side taken, light self-aware humor. The edge points at the outdated status quo — never condescends to the reader.

**Words they DON'T use**
20. **Ban list:** hedges ("might," "designed to," "aims to"); tired enterprise buzz ("synergy," "best-in-class," "revolutionary," "world-class"); hype punctuation (near-zero exclamation marks); long compound-complex corporate sentences. **Signature devices to keep on hand:** X-over-Y anaphora value lists, antithesis taglines, alliterative journey phrases, capitalized proprietary mechanism names, fragment-stop punchlines.

**Two Tideover voice-fit caveats (do not skip):**
- **CTA divergence:** Swan's CTAs are self-serve verbs ("Free Trial," "Ask Swan"). Tideover's backend is **Cal.com booking** — keep the brevity and confidence, change the destination verb to a booking/demo motion.
- **Dial down rule 19's swagger.** Swan's register is fast/aggressive B2B-RevOps; Tideover is warm/calm/reassuring. Port the *structural* rules (1–16, 18, 20) directly, keep the confidence and the "we understand your pain" move, but **drop the hustle-energy edge** — our emotional target is calm reassurance. And per the standing anti-slop rule: write tight, kill em-dashes/padding, and don't overuse "honest/honestly."

---

## Appendix — the three things Tideover must do differently (proof-only reconciliation)

Swan's playbook leans on two assets we don't have and can't fake: a real customer-logo bar (§3) and a named-testimonial carousel (§10). The conversion staircase *structurally needs* a credibility beat in both slots, so fill them honestly rather than skip:

1. **§3 logo bar → live demo + founder-credibility band + integration logos** (all true).
2. **§10 testimonials → founder's first-person lived-pain story + deliberately-designed `[CASE STUDY PLACEHOLDER]` cards** until real quotes exist.
3. **Match every Swan vibes-claim with an honest mechanic.** The benchmark is already playing the honest game — **Swan itself uses zero fabricated metrics**; its credibility is specificity of mechanism, named humans, and real integration logos. Tideover can copy that strategy almost 1:1 within the proof-only doctrine — plus build the /security + /procurement + honest-comparison surfaces Swan doesn't even have, turning our constraint into a differentiator.

**Aesthetic north star:** Swan validates that paper-cut/origami + single-accent discipline + warm neutrals converts. Borrow the mechanics; differentiate on register — Swan is a playful zoo, Tideover is a calm coastline.

*Sources (patterns only, no copy reproduced): getswan.com homepage, /about, /pricing, /roles/*, /use-cases/*, /compare/*, /blog + posts, `agent.getswan.com` auth + `/assistant` demo, and the live Webflow CSS tokens; external context via Salesforge, G2, LinkedIn, and the $6M funding post.*