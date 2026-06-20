---

# LAUNCH SETUP GUIDES — Chaga Chai AI-UGC Agency
**Solo operator · ~$500 month-1 budget · Goal: first paid $497 packs in ~3 weeks, $20K/mo in ~90 days**

> **How to read this:** Each numbered section is self-contained: what you're doing, the cheapest viable tool, exact click-by-click steps, and **where it plugs into the assets already on disk**. The COST TABLE and ORDER-OF-OPERATIONS are at the bottom — read those two first if you only read two things, because **cold-email domains have a 2-3 week warmup lead time and must be bought on Day 1** even though you won't send for ~3 weeks.
>
> **Hard prerequisites that block parts of this (from the offer + cold-email docs):**
> - **Credibility is proof-only (locked 2026-05-30):** the assets claim NO ad track record — trust is carried by the made-for-them sample, the rendered portfolio + teardowns, the guarantee, and founding-partner pilots. There is NO "DTC store details" to fill; that earlier prerequisite is retired (see `27-credibility-and-trust.md`). Remaining founder `[FILL]` items are only operational (booking link, contact email, honest founding-slot count).
> - Zero case studies at launch. The landing page's three `[CASE STUDY PLACEHOLDER]` cards and the cold-email `[CASE STUDY PLACEHOLDER]` blocks stay as honest placeholders until a real founding-partner delta exists. **Never paste a fabricated number.**

---

## 1. Deploy the landing page free + custom domain

**What you're doing:** Putting the single file `15-landing-page/index.html` on the public internet, free, on a fast CDN, with your own domain.

**Cheapest viable option:** **Cloudflare Pages** (free, unmetered bandwidth, and you'll likely buy your domain at Cloudflare at cost anyway so DNS is one-click). **Netlify Drop** is the fastest if you want it live in 60 seconds with zero account friction. Both free forever for this. Vercel works too but its free tier is the most likely to nag about "commercial use" — use it only as a third fallback.

### Option A — Netlify Drop (fastest, ~2 minutes, no account needed to test)
1. Rename the file so the host serves it as the homepage. It **must be named `index.html`** (it already is). Put just that one file in an otherwise-empty folder, e.g. `C:\Users\dylan\Documents\axiom-balloon\Core Business\15-landing-page\`.
2. Go to **app.netlify.com/drop**.
3. Drag the **folder** (not the file) onto the drop zone. It deploys instantly to a random URL like `https://random-name-123.netlify.app`.
4. Create a free Netlify account when prompted (so the site persists and you can attach a domain). Site settings → **Change site name** to something clean like `chagachai`.
5. To redeploy after edits: drag the folder onto **Deploys** again. (No git needed for a one-file site.)

### Option B — Cloudflare Pages (recommended for the long run)
1. Create a free account at **dash.cloudflare.com**.
2. Workers & Pages → **Create** → **Pages** → **Upload assets** (the "Direct Upload" option — no GitHub required).
3. Name the project `chagachai`, drag the folder containing `index.html`, click **Deploy**. Live at `https://chagachai.pages.dev`.

### Custom domain (cheapest path)
1. **Buy the domain at Cloudflare Registrar** — it sells at wholesale cost, no markup, no first-year-cheap-then-gouge renewal. A `.com` is ~$10-11/yr. (Namecheap/Porkbun are fine alternatives at ~$10.)
   - **Important naming decision:** Use your **primary brand domain** for the landing page (e.g. `chagachai.com`). **Do NOT send cold email from this domain** — that's what the throwaway domains in Section 5 are for. The cold-email doc is explicit: protect the root domain's reputation by never sending cold from it.
2. **Attach it:**
   - *Cloudflare Pages:* Project → **Custom domains** → add `chagachai.com` and `www.chagachai.com`. If the domain is registered at Cloudflare, DNS records auto-create. Done in minutes.
   - *Netlify:* Site → **Domain management** → **Add custom domain** → follow the two DNS records it gives you (or point your registrar's nameservers to Netlify). Netlify provisions free SSL automatically.
3. Wait for SSL to go green (usually <15 min, up to a few hours). Verify `https://` loads with a padlock.

### Where it plugs in
This is the destination for **every CTA in your funnel**: the cold-email reply path, the Calendly confirmation, your LinkedIn/X bio, and the email signature. Before you point traffic at it, you must replace the markers in Sections 2-4 below (Stripe, Calendly, form handler) **inside this same `index.html`** and redeploy. Also fill the footer's `[FILL: legal entity name]`, the `mailto:EDIT_ME@yourdomain.com`, and the founder block's `[FILL: ...]` store details.

---

## 2. Stripe payment link for the $497 pack

**What you're doing:** Creating a hosted checkout so a founder can buy the 10-video pack without you touching anything, and wiring it into the `EDIT_ME_STRIPE_CHECKOUT_LINK` markers.

**Cheapest viable option:** **Stripe Payment Links** — $0/month, no code, no website integration needed. Stripe takes 2.9% + $0.30 per charge (~$14.70 on a $497 sale). That's the only cost and it's purely per-transaction, so it fits any budget.

### Steps
1. Create a Stripe account at **dashboard.stripe.com** (email + business details; for a solo operator you can start as an individual/sole prop and add the entity later). Complete identity verification so payouts aren't held.
2. Add a payout bank account (Settings → **Business** → Bank accounts & currency).
3. Create the product: **Product catalog** → **Add product**.
   - Name: `10-Video AI UGC Pack`
   - Description: `10 production-grade AI UGC videos, launched and tagged in your account. One-time, no retainer.`
   - Price: **$497.00 USD**, **One time** (not recurring).
4. **Payment Links** → **Create payment link** → select that product.
   - Turn ON **Collect customer's name** and (optionally) a custom field like "Brand name + website" so you get intake context at purchase.
   - **After payment → redirect to your own page** → set it to a simple thank-you/next-steps URL, e.g. `https://chagachai.com/?thanks=1` (or a Calendly intake link so they immediately book the kickoff). This is also where you'd trigger the §1 INTAKE step from `production-sop.md`.
5. Click **Create**. You get a URL like `https://buy.stripe.com/aBcDeF12345`.
6. **Test it first:** Toggle the dashboard to **Test mode**, make a test link, pay with card `4242 4242 4242 4242` (any future expiry, any CVC). Confirm the redirect works. Then switch to **Live mode** and use the live link.

### Where it plugs in
Open `C:\Users\dylan\Documents\axiom-balloon\Core Business\15-landing-page\index.html` and replace **every** occurrence of `https://buy.stripe.com/EDIT_ME_STRIPE_CHECKOUT_LINK` with your live link. There are **5 of them** (nav button, hero CTA, the `#pack` section CTA, the pricing card, and the final-CTA section), plus one in the footer's "Buy the pack" link. Find-and-replace `EDIT_ME_STRIPE_CHECKOUT_LINK` across the whole file. Redeploy (Section 1). The $497 pack is your **public, lead-with-this price** per the offer doc — this link is the single most important conversion element on the page.

---

## 3. Calendly free booking

**What you're doing:** A self-serve link so a founder can book the 15-minute call, wired into the `EDIT_ME_CALENDLY_LINK` markers.

**Cheapest viable option:** **Calendly free tier** — $0, one event type, unlimited bookings, Google Calendar sync. (Free tier = one event type, which is exactly what you need: the 15-min call.) Alternatives at $0: Cal.com (open-source, more generous free tier), TidyCal ($29 one-time lifetime). Start with Calendly free.

### Steps
1. Sign up at **calendly.com** with your Google account (`orderstatusfuc@gmail.com`) so it reads your real availability and prevents double-booking.
2. Connect Google Calendar when prompted (check for conflicts + auto-add events).
3. Create one event type: **15 Minute Meeting**.
   - Name it on-brand: `15-min fit call — AI UGC for functional consumables`.
   - Duration: **15 min**. Location: **Google Meet** or **Zoom** (Calendly auto-generates the link), or **Phone call** (you call them — lowest friction).
   - Set availability to real working hours, add **buffers** (e.g. 10 min after) so calls don't stack.
   - Add 1-2 intake questions to the booking form: "Brand + website?" and "Roughly what's your monthly Meta + TikTok spend?" — this pre-qualifies against the $20-100K/mo ICP **before** the call (the offer doc's discovery-call qualification step).
4. Copy your link: `https://calendly.com/your-handle/15min`.

### Where it plugs in
In `index.html`, replace every `https://calendly.com/EDIT_ME_CALENDLY_LINK` — there are **5 occurrences** (hero "Book a 15-min call", the `#pack` "book a call first", the founding-partner proof line, the retainer pricing card "Book a 15-min call to scope it", the final-CTA, and the footer "Book a call"). Find-and-replace `EDIT_ME_CALENDLY_LINK`. This link is also where **cold-email replies convert**: when a prospect replies "show me" / "send the cycle plan" (the Email 4 CTAs in `14-cold-email-sequence.md`), you send this booking link.

---

## 4. Lead-magnet form handler + where leads land

**What you're doing:** Making the "Functional Consumables Ad Teardown" email-capture form on the landing page actually collect emails, replacing `EDIT_ME_FORM_HANDLER_ENDPOINT`.

**Cheapest viable option:** **Formspree free** — $0, 50 submissions/month, dead-simple: point the existing `<form>` at one endpoint URL, no backend, no JS. (50/mo is plenty at launch volume; upgrade only if the teardown goes viral.) **Tally** is the better choice if you want the form to *also* be a standalone hosted page you can link in cold emails and DMs (free, unlimited submissions, and it can email you + push to a Google Sheet/Notion). Recommendation: **Formspree for the embedded landing-page form** (keeps the page's native design), **Tally** as a backup hosted form.

### Option A — Formspree (keeps the landing page's existing form design)
1. Sign up at **formspree.io** (free plan) with `orderstatusfuc@gmail.com`.
2. **New form** → name it `Teardown Lead Magnet` → it gives you an endpoint like `https://formspree.io/f/xyzabcd`.
3. In `index.html`, find this line (~line 775) and swap the action URL:
   ```html
   <form class="lm-form" action="https://EDIT_ME_FORM_HANDLER_ENDPOINT" method="post">
   ```
   becomes
   ```html
   <form class="lm-form" action="https://formspree.io/f/xyzabcd" method="post">
   ```
   Keep `method="post"` and the existing `<input type="email" name="email">` — Formspree reads the `name` attributes automatically.
4. Set the **redirect after submit** in Formspree settings to a thank-you URL, or add a hidden field `<input type="hidden" name="_next" value="https://chagachai.com/?subscribed=1">`.
5. Submit a test from the live page; confirm the email lands in your inbox.

### Option B — Tally (hosted form, also linkable in outreach)
1. **tally.so** → free account → new form with one Email field → Publish → get `https://tally.so/r/abc123`.
2. In Integrations, turn on **email notification to yourself** and **Google Sheets** sync.
3. Either embed it or, simplest, point the landing-page button at the hosted Tally URL.

### Where leads land
- **Immediate:** every submission emails you at `orderstatusfuc@gmail.com`.
- **Storage (do this so leads don't live only in your inbox):** Formspree free shows submissions in its dashboard; for a running list, connect Formspree/Tally to a **Google Sheet** (Tally native; Formspree via its Zapier/Make export or a paid plan). Keep a single sheet `teardown-leads` with columns `email, date, source`.
- **What to send them:** the teardown itself is the **lead magnet** described in the landing page — a written breakdown of functional-consumables UGC angles/hooks/claim-safe phrasing. This is a no-call top-of-funnel entry; these warm leads get nurtured toward the $497 pack or a call. (This is separate from the cold-outbound list in Sections 5-6.)

---

## 5. Cold-email infrastructure (the 2-3 week lead-time critical path)

**What you're doing:** Standing up a deliverable cold-email sending system on **throwaway domains** (never your brand root), warmed for 2-3 weeks before the first real send. **This is the long pole — start it on Day 1.**

**Cheapest viable real option (and the tradeoff):** The honest cheapest is **Google Workspace inboxes + Smartlead**, which matches your tool stack in `08-final-lock-execution.md`. But Google Workspace is **~$7.20/inbox/month** (Business Starter, monthly) — with 2 domains × 2 inboxes that's ~$28.80/mo, which is real money. **The budget-true alternative for month 1** is a reseller/SMTP setup, but for a beginner who must not torch deliverability, stick with the doc's stack and **start lean: 2 domains × 1 inbox = 2 inboxes (~$14.40/mo)** and scale inboxes once cash lands. Smartlead's entry plan is **~$39/mo** (also in your stack). Do **not** cheap out by sending from your real Gmail — one spam complaint there and your landing-page domain's mail is poisoned.

### Step-by-step (do this Day 1; you won't send until ~Day 18-21)

**A. Buy 2-3 secondary domains (~$10-11 each, one-time/yr)**
- Buy at **Cloudflare Registrar / Namecheap / Porkbun**. Use **lookalike variants of your brand, never the root**. The cold-email doc's examples: `try-chagachai.com`, `chagachai-team.com`, `getchagachai.com`. Buy **2 to start (3 if budget allows)**.
- Rationale (from the doc): spread volume across domains; if one gets burned, the others and your real `chagachai.com` survive.

**B. Create Google Workspace inboxes (1-2 per domain)**
1. For each throwaway domain: **workspace.google.com** → start Business Starter → verify domain ownership (add the TXT record Google gives you at your registrar).
2. Create **1 inbox per domain** to start (e.g. `chaga@try-chagachai.com`). Use a real human name, not `info@` or `sales@`.
3. Add a Gmail profile photo and a plain-text signature (name only — the doc bans signature graphics/legal blocks for cold).

**C. Set up SPF, DKIM, DMARC (all three must pass before any send)**
At each domain's DNS (registrar or Cloudflare), add:
- **SPF** — a TXT record on the root: `v=spf1 include:_spf.google.com ~all`
- **DKIM** — in Google Admin (admin.google.com → Apps → Google Workspace → Gmail → **Authenticate email**), generate the DKIM key, paste the provided TXT record at host `google._domainkey`, then click **Start authentication**.
- **DMARC** — TXT record at host `_dmarc`: start gentle: `v=DMARC1; p=none; rua=mailto:chaga@try-chagachai.com`
- Verify all three pass with **mxtoolbox.com** (SPF/DKIM/DMARC lookups) or by sending a test to **mail-tester.com** (target **≥9/10** before going live — this is a pre-send QA item in the cold-email doc).
- Set up a **custom tracking domain** (a subdomain like `track.try-chagachai.com` CNAME'd per Smartlead's instructions) — **or turn tracking OFF entirely**, which the doc actually recommends for this system (open-pixels depress deliverability; you'll track `{{sampleLink}}` clicks via the link host instead).

**D. Connect inboxes to Smartlead + warm up**
1. Sign up at **smartlead.ai** (~$39/mo entry plan).
2. Add each inbox (Smartlead has a Google OAuth flow + app-password path). Set **SPF/DKIM/custom-domain** green checks inside Smartlead.
3. Turn ON **warmup** for every inbox immediately. Leave it running **2-3 weeks before real sends**, and **keep it running in the background even during live campaigns** (the doc's rule — it sustains reputation).

**E. The warmup → live ramp (per inbox)**
| Phase | Per-inbox volume | Notes |
|---|---|---|
| Days 1-21 | Warmup only (auto, ~ramping to 20-40 warmup/day) | No real prospects. Auth must be green. |
| Live Week 1 | ~10-15 real/day | Start small even after warmup. |
| Live Week 2 | ~20/day | |
| Live Week 3+ | **~30-40/day steady-state ceiling** | **Never spike.** |
- **Scale total volume by adding inboxes, not by raising per-inbox volume.** Send M-F, business hours in the prospect's timezone, randomized intervals, **plain text only, one link** (`{{sampleLink}}`).

### Realistic timeline & monthly cost
- **Timeline:** Domains + inboxes + DNS auth on **Day 1-2** → warmup runs **~Days 1-21** → first live priority sends **~Day 18-21**. This is *why* domains are the first thing you buy.
- **Monthly cost (lean launch):** 2 inboxes × ~$7.20 = **~$14.40** (Google Workspace) + **~$39** (Smartlead) = **~$53/mo**, plus **~$20-33 one-time** for 2-3 domains (annual). Scale to 4-6 inboxes (~$29-43/mo Workspace) once the first packs land.

### Where it plugs in
This system runs the sequences in `14-cold-email-sequence.md` — Track 1 (Wounded Veteran) and Track 2 (Volume/Lean), 4 emails each (Day 0/2/5/9), with Smartlead **spintax** on openers/CTAs and A/B subject lines on Email 1. **The hard blocker before any live send** (from that doc): `{{sampleLink}}` resolves for every priority lead — the rendered sample of *their* product (Section 7 produces these). Email 1 carries proof-only credibility; there are no store details to fill. Tracking OFF, "slop" used at most once, no fabricated numbers.

---

## 6. Email enrichment — turn the 79-brand list into verified emails

**What you're doing:** The lead list `17-lead-list.md` / `17-lead-list.csv` ships with **every email flagged `enrich`** and the explicit rule **"do NOT fabricate."** You have founder names + domains + LinkedIn URLs for ~79 brands; you need verified, deliverable email addresses.

**Cheapest viable tools (name a couple + rough cost):**
- **Findymail** — built for exactly this (name + domain/LinkedIn → verified email), ~$49/mo for ~1,000 credits; high verification quality, low bounce. Best single pick for a small, hand-curated list like 79.
- **Apollo.io** — has a **free tier with limited email credits** plus the brand/contact database; the offer doc already budgets "Apollo / scraping." Good for filling gaps and for any founder not on LinkedIn. Free to start, ~$49/mo if you need volume.
- **Prospeo / Hunter.io** — cheap pay-as-you-go domain-search + verifier; Hunter's free tier covers a handful of lookups. Useful as a **second-source verifier**.
- **Best-practice combo on a budget:** find with **Findymail or Apollo**, then **verify the catch-all/risky ones** with a cheap verifier (**MillionVerifier**, ~$0.0004/email, or **NeverBounce**) to keep the campaign's bounce rate **<2%** (the cold-email doc's pre-send target).

Realistic cost to enrich 79 leads: **well under $50 one-time** — most of these have a free tier that covers 79 lookups, so you may spend **$0-20** if you stay on free credits and only pay for verification.

### The `enrich` column workflow (keep the CSV's structure)
1. Open `17-lead-list.csv`. It already has the founder name, domain, and an **`enrich`** flag in the email column.
2. For each row, feed **founder first/last name + the brand domain** (and the LinkedIn URL where present — many A-tier rows have one) into Findymail/Apollo. For brands with `Founder: unknown` (e.g. Zena, Live Conscious, Primal Harvest), enrich the operating entity or a marketing lead per the list's notes (e.g. "VitaMina Labs / Katrina Dachelet").
3. **Replace the `enrich` flag with the returned verified email** in that row. Keep the column; just overwrite the value. If a tool returns "guessed/unverified," run it through the verifier; if it stays risky, **leave it `enrich` / drop from priority send** rather than guessing — the doc forbids fabrication and suppresses a lead with no clean `{{firstName}}`/email.
4. Map the verified email into Smartlead's import as the email field; the other CSV columns already map to the merge tags (`first_name → {{firstName}}`, `brand_name → {{brand}}`, `product → {{product}}`, `hook_observed → {{hook}}`, `sample_url → {{sampleLink}}`, plus routing columns `track`, `spend_band`, `aov`, `team_size`).
5. **Hit A-tier (24 brands) first** — they have the strongest personalization hooks already written in the list. Verify those 24, write/clean their `{{hook}}` and natural-lowercase `{{product}}`, and ensure each priority lead has a rendered `{{sampleLink}}` before it enters the sequence.

### Where it plugs in
Output of this step = a clean, verified send list that loads straight into the Smartlead campaigns from Section 5, feeding the merge-tag map at the top of `14-cold-email-sequence.md`. **Bounce rate <2%, catch-alls flagged** are pre-send QA gates.

---

## 7. Production rig — Arcads/Creatify + Captions AI + first-render checklist

**What you're doing:** Standing up the tools that turn a script into a finished UGC ad, so you can (a) produce the **free `{{sampleLink}}` samples** that carry every cold email and (b) deliver the **$497 pack** and the 24-pack cycles.

**Cheapest viable option:** **Arcads** (~$110/mo entry) **OR Creatify** (~$39-49/mo entry, cheaper) for the avatar render, plus **Captions AI** (~$39/mo, "Pro") for lipsync/caption/edit polish. Per `08-final-lock-execution.md`, budget **Arcads $59 + Captions $39** if you catch a lower Arcads tier — otherwise **start on Creatify (cheapest avatar generator) + Captions AI** to stay inside month 1, and upgrade to Arcads once packs are landing. Scripting runs on **GPT/Claude (~$20-25 OpenAI/Claude credits)**. **Exploit free trials in Week 1** so subscriptions don't bite until cash is in (the execution doc's explicit instruction).

### Account setup
1. **Avatar generator (Arcads or Creatify):** create account → start on the free trial / lowest paid tier. In the brand setup, **pre-load the brand kit and pre-select 2-4 recurring avatars per brand** (the SOP's casting rule — a consistent face across cells/cycles builds pseudo-brand recognition).
2. **Captions AI:** create account (Pro tier for lipsync + brand-kit captions). Load the brand's font/colors/logo into the **brand kit** so captions are on-brand from clip one.
3. **Scripting LLM:** load **$20-25** of OpenAI or Claude API credit (or use the chat UI to start). This runs Prompt A (grid plan) and Prompt B (the 24 scripts) from `production-sop.md` §2.
4. **Folder structure (set once per brand):** `/Brands/<BRAND>/00-Brief/  01-Assets/  02-Winners/  03-Renders/  05-Delivery/` — the SOP's exact layout, so naming joins cleanly to Meta later.

### First-render checklist (ties directly to `production-sop.md`)
Before you render your very first sample, walk this gate:
- [ ] **Brand Brief written** (§1): brand, 3-letter token, AOV, avatar paragraph, "their words," VOICE (say/never-say), **CLAIMS OK / CLAIMS BANNED**, proof quotes, 6-10 product shots in the asset folder.
- [ ] **Script came from Prompt A → Prompt B** (§2), human-edited, read aloud, sized to runtime (**15s ≈ 35-45 words, 30s ≈ 75-90**). Hook works as the literal first frame *and* on mute.
- [ ] **Avatar cast to the angle** (§3.1 map): PAS = relatable/mid-symptom, FND = founder-plausible, MECH = explainer, TRAN = attainable "after." Demographic matches the brief.
- [ ] **Paste only the spoken BODY** into Arcads/Creatify (not b-roll/on-screen cues). Set voice/pace to runtime.
- [ ] **Per-render QA gate** (§3.3): lipsync locks on the hook line (first 3s); no uncanny mouth/glitch frames; ingredient names pronounced right (phonetic-spell "ash-wuh-GAN-duh" if needed); energy matches the angle. **Re-roll fails now** — a bad render found in post costs 3× the time.
- [ ] **Post in Captions AI** (§4): auto-caption + correct; **burn the hook as a text-card in the first 0-1s**; b-roll cuts every 1.5-3s; music -12 to -18 dB under VO; **compliance re-read** of every caption/on-screen text against the banned-claims list (captions sometimes auto-"upgrade" a benefit into a banned claim).
- [ ] **Export 9:16 + 4:5**, face + captions inside the 4:5 safe-zone.
- [ ] **Name the file** `BRAND_ANGLE_HOOK_FORMAT_LEN_vNN` (e.g. `MYCO_PAS_H01_TH_30_v01`) — the **same string** is the Captions project name and the Meta ad name. No renaming downstream.
- [ ] **Route around the known AI failure mode:** no "drink-and-react" consumption sip shots — use product-forward framing, hands-and-pour, voiceover-over-reaction (offer doc + SOP).

### Where it plugs in
Two outputs: (1) the **single rendered `{{sampleLink}}` ad of each priority prospect's own product** — the highest-reply-rate asset in the business, required in every priority cold email per the locked rule in `14-cold-email-sequence.md`; and (2) the **$497 pack / 24-pack cycle** deliverables that are "launched and tagged" per the offer doc. Host samples as **unlisted Loom or a hosted MP4** and paste the URL into the lead list's `sample_url` column (→ `{{sampleLink}}`).

---

## COST TABLE — fits inside ~$500 for month 1

**One-time**
| Item | Cheapest viable | Cost |
|---|---|---|
| Brand domain (landing page) | Cloudflare/Namecheap `.com` | ~$11 |
| 2-3 cold-email domains | Cloudflare/Namecheap | ~$22-33 |
| Landing page hosting | Netlify/Cloudflare Pages | $0 |
| Enrichment of 79 leads | Findymail/Apollo free credits + cheap verifier | ~$0-20 |
| **One-time subtotal** | | **~$33-64** |

**Monthly (month 1)**
| Item | Cheapest viable | Cost/mo |
|---|---|---|
| Stripe | Payment Links (per-txn only, 2.9%+$0.30) | $0 base |
| Calendly | Free tier | $0 |
| Lead-magnet form | Formspree/Tally free | $0 |
| Google Workspace inboxes | 2 inboxes × ~$7.20 | ~$14.40 |
| Smartlead | Entry plan | ~$39 |
| Avatar generator | Creatify entry (or Arcads $59) | ~$39-59 |
| Captions AI | Pro | ~$39 |
| LLM credits (scripting) | OpenAI/Claude | ~$20-25 |
| Enrichment tool (if beyond free) | Findymail/Apollo | ~$0-49 |
| **Monthly subtotal** | | **~$151-225** |

**Month 1 total (one-time + first month): ~$184-289.** Comfortably under $500, leaving a **$200+ reserve** for month-2 tool renewals, more inboxes (to scale send volume), extra enrichment/verification credits, or production overflow — matching the reserve logic in `08-final-lock-execution.md`. **Lever to go even leaner:** start avatar rendering on free trials in Week 1 (no charge until cash lands), and stay on enrichment free credits for the 79-brand list.

---

## ORDER-OF-OPERATIONS (sequenced around the domain-warmup lead time)

The binding constraint is **cold-email warmup (2-3 weeks)**. Buy domains and start warmup **before anything else**, then build the rest in parallel while the clock runs.

**Day 1 (the critical-path morning — do these first, in this order):**
1. **Buy 2-3 cold-email domains** + your brand domain.
2. **Create Google Workspace inboxes** on the cold domains; set **SPF + DKIM + DMARC**; verify ≥9/10 on mail-tester.
3. **Connect inboxes to Smartlead and turn warmup ON.** ← the warmup clock now starts; everything else happens while it runs.

**Days 1-3 (parallel, while warmup runs):**
4. **Fill Chaga's `[FILL: ...]` store details** (store name, product, ~$X/mo spend, CAC/ROAS, years, exit reason) — the hard prerequisite that unblocks both the landing page and Email 1.
5. **Stand up the production rig** (Arcads/Creatify + Captions AI + LLM credits); run the **first-render checklist** to prove the pipeline.
6. **Deploy the landing page** (Netlify/Cloudflare Pages), then create **Stripe Payment Link → Calendly → Formspree/Tally**, replace all `EDIT_ME` markers (Stripe ×6, Calendly ×6, form ×1) + the `[FILL]` footer/founder fields, and **redeploy**. Landing page + checkout are now live.

**Days 3-10 (parallel):**
7. **Enrich the 79-brand list** (A-tier first) and verify (<2% bounce). Overwrite each `enrich` flag with a verified email; keep the CSV columns intact.
8. **Render the `{{sampleLink}}` samples** for the A-tier priority leads (one ad of *their* product each) — no priority email sends without one.
9. **Hand-write the `{{hook}}` and clean natural-lowercase `{{product}}`** per priority lead; load the campaign into Smartlead with spintax + A/B subjects (but **do not send yet**).

**Days ~18-21 (warmup complete):**
10. Run the **pre-send QA checklist** (all `[FILL]` replaced, every `{{sampleLink}}` resolves, hooks pass the true/specific/quiet-part bar, "slop" ≤1×, no fabricated numbers, bounce <2%). **Go live** at ~10-15/inbox/day and ramp to 30-40 by Week 3. Replies route to your **Calendly** link → discovery call → $497 pack (Stripe) → retainer.

**Why this order:** the only thing you *cannot* compress is warmup — so it leads. The landing page, payments, booking, form, production rig, and enrichment all complete inside the same 2-3 weeks the inboxes are warming, so on the day inboxes are ready, the entire funnel (sample → email → reply → Calendly → Stripe → landing page) is already live and tested.

---

**Files referenced (all absolute):**
- Landing page to edit/deploy: `C:\Users\dylan\Documents\axiom-balloon\Core Business\15-landing-page\index.html` (markers: `EDIT_ME_STRIPE_CHECKOUT_LINK` ×6, `EDIT_ME_CALENDLY_LINK` ×6, `EDIT_ME_FORM_HANDLER_ENDPOINT` ×1, plus `[FILL: ...]` founder/footer fields)
- Offer/ladder/guarantee: `C:\Users\dylan\Documents\axiom-balloon\Core Business\12-offer-locked.md`
- Cold-email sequences + deliverability + merge tags: `C:\Users\dylan\Documents\axiom-balloon\Core Business\14-cold-email-sequence.md`
- Lead list + `enrich` workflow: `C:\Users\dylan\Documents\axiom-balloon\Core Business\17-lead-list.md` and `17-lead-list.csv`
- Production assembly line + first-render checklist: `C:\Users\dylan\Documents\axiom-balloon\Core Business\production-sop.md`
- Budget + tool stack + targets: `C:\Users\dylan\Documents\axiom-balloon\Core Business\08-final-lock-execution.md`