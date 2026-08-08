# Design-partner strike list — personalized, diagnosis-led outreach

**12 emails**, each led by a real finding about that merchant's own store. 7 carry a high-confidence (live-verified) finding. 12 passed a doctrine audit; 10 were corrected by the auditor before landing here.

**How these were built:** 8,821 store-side TAM rows scored for design-partner fit (named human contact, non-role mailbox, paying for a preorder app, active brand) → top 90 probed with Tideover's own site analyzer → only merchants whose live product catalog we could actually read survived → 36 handed to agents that fetched each store, found one true specific, and wrote the email. **Every finding is evidenced. Nothing is invented — no metrics, no fake customers, no dates.**

**Before sending:** read `SEND-RUNBOOK.md` (CASL floor, footer, warmup-aware ramp, kill-criteria). These are business addresses published on the merchants' own sites; the source URL is logged per row in the CSV. Dylan sends; nothing is automated.

---

### 2nd Story Ale Works
`beer@2ndstoryale.jp` · https://2ndstoryale.jp · Timesact (Shopify) · confidence: **high** · _auditor-corrected_

**Subject:** your shipping policy page is blank

> 2ndstoryale.jp has Timesact installed, a preorder app. But your 配送ポリシー page loads with just contact info and the nav menu. Nothing about when a buyer hears from you next, or what happens if an order runs late.
> 
> That's the page people check when they're unsure, and it tells them nothing. The ones who still want an answer write to you instead, one at a time.
> 
> Tideover reads each order's real timeline and drafts a reply in your voice for you to approve before anything sends.
> 
> I'm looking for a couple of design partners to try it free in exchange for straight feedback. Want me to draft what a reply on one of your orders would say?
> 
> — Dylan

*Finding:* Their live shipping policy page (配送ポリシー) at 2ndstoryale.jp/policies/shipping-policy renders with only contact info and the nav menu — no actual shipping timeline or post-purchase communication content.
*Evidence:* WebFetch of https://2ndstoryale.jp/policies/shipping-policy this run: page titled 配送ポリシー displays business contact information and navigation menu only; no shipping timeline, delay, or policy text present. Site also runs the Timesact preorder app per catalog data.
*Auditor flagged:* (d) Unsupported specific: "runs Timesact, so you've sold something ahead of being in hand before." Evidence only shows the Timesact app is installed per catalog data. Installed app != preorders actually sold. The AKOIASWIM record in this same batch proves the gap (Timesact installed, preorderCount = 0). Telling a stranger what they have done, wrongly, on line one kills the email.; (d/a) "Every one of those turns into a support email or DM" is an absolute claim about their support volume. We have no data on their inbox. Reads as a fabricated stat in prose form.

---

### 1 Shot Energy
`partnerships@1shotenergy.com` · https://1shotenergy.com · Timesact (Shopify) · confidence: **medium** · _auditor-corrected_

**Subject:** your FAQ covers speed, not what happens if it slips

> Your FAQ promises 1-2 day fulfillment and 2-6 day transit. It never says what a buyer hears if that slips, beyond a tracking link and a chatbot that can escalate to a person.
> 
> An order past that window has no answer waiting for it on your site, so the buyer writes to you.
> 
> Tideover reads each order's real timeline and drafts the reassurance reply in your voice, for you to approve before anything sends.
> 
> I'm running a free pilot for a few merchants in exchange for candid feedback. Worth a look?
> 
> — Dylan

*Finding:* Their live FAQ states a 1-2 business-day fulfillment window plus 2-6 business-day transit, but does not say what a buyer is told if that window is missed, beyond order tracking and a support chatbot.
*Evidence:* WebFetch of https://1shotenergy.com/pages/faq this run: page states 'We strive for 1-2 business-day order fulfillment, and once your package is shipped out, it generally takes about 2-6 business days to reach US destinations,' with no stated post-purchase communication schedule beyond tracking/chatbot support. Timesact preorder app listed in catalog data (not independently re-verified live).
*Auditor flagged:* (d) "You're also running Timesact, so you've sold ahead of stock before." Two failures stacked: the evidence itself flags Timesact as catalog data "not independently re-verified live," and even if installed, it does not establish they have sold ahead of stock. Cut it — the FAQ finding is the verified one and is strong enough alone.; (d/a) "Every order that runs past its window turns into a support ticket someone answers by hand" asserts their ticket volume and their internal process. Unknown to us.

---

### 2bTanned — Erin
`erin@2btanned.co.uk` · https://2btanned.com · Timesact (Shopify) · confidence: **medium** · _auditor-corrected_

**Subject:** your shipping policy has no answer for delays

> Erin,
> 
> Your shipping policy covers same-day dispatch cutoffs and customs fees, but says nothing about what happens if an order runs late or an item is out of stock.
> 
> That's the exact moment a buyer emails you instead of waiting, and the page has no answer to point them back to.
> 
> Tideover reads each order's real status and drafts the reassurance reply in your voice, for you to approve before it sends, so buyers get an answer without you writing it from scratch.
> 
> I'm looking for a design partner to try it free in exchange for straight feedback. Want me to send what a reply on one of your recent orders would look like?
> 
> — Dylan

*Finding:* Their live shipping policy page states dispatch cutoffs and customs-fee notes but has no language covering delays, backorders, or out-of-stock items.
*Evidence:* WebFetch of https://2btanned.com/policies/shipping-policy this run: page states 'Orders placed before 15:00 will be dispatched the same working day. All orders placed after 15:00 will be dispatched the following working day' and notes international customs/import fees, with no mention of backorder, out-of-stock, restock, or delay communication anywhere on the page.
*Auditor flagged:* (d/f) "when you're running the salon and the shop at once" — nothing in the finding_evidence establishes Erin runs a salon or works both. This is invented biography dressed as familiarity, the exact fake-familiar move the doctrine bans, and it is the kind of guess a real recipient spots instantly.; (d) Domain mismatch worth resolving before send: the contact is @2btanned.co.uk but the body asserts "2btanned.com's shipping policy" and the evidence was fetched from 2btanned.com. Rewrite drops the domain assertion; verify the two are the same store before this goes out.

---

### Abayah House
`abayahhouse@outlook.com` · https://abayahhouse.com.au · Timesact (Shopify) · confidence: **medium** · _auditor-corrected_

**Subject:** the gap on your shipping policy page

> Abayah House runs on Timesact, a preorder-capable app, but your shipping policy page has no line about what a customer hears from you between checkout and delivery.
> 
> That's the gap the "where is my order" emails come through, one at a time.
> 
> Tideover reads each order's real timeline and drafts a status update in your voice, for you to approve before anything sends. Buyers get an answer, you don't write it from scratch.
> 
> I'll run it free as a pilot in exchange for candid feedback. Want me to draft what a day-14 update to one of your customers would look like?
> 
> — Dylan

*Finding:* Abayah House uses Timesact (a preorder-enabling Shopify app) yet their shipping policy page and homepage say nothing about post-purchase communication.
*Evidence:* WebFetch on abayahhouse.com.au homepage and /policies/shipping-policy returned no mention of preorder, made-to-order, lead time, dispatch time, or any post-purchase communication; /pages/faq returned 404. Catalog data (given) confirms the store's app field is "Timesact (Shopify)", a preorder app.
*Auditor flagged:* (d) "with nobody templated to answer them" claims knowledge of their internal support setup. We fetched two public pages. We do not know what templates or helpdesk they run, and being wrong here reads as bluffing.; Note: the Timesact framing here is correct — "a preorder-capable app" states the installed capability without claiming sales history. This is the phrasing the 2nd Story and 1 Shot emails should have used.

---

### Abbigliamento Jessica — Mitica
`mitica@pecditta.com` · https://abbigliamentojessica.com · Timesact (Shopify) · confidence: **high** · _auditor-corrected_

**Subject:** the gap between order and ship

> Mitica,
> 
> Your shipping policy tells a customer transit takes 1-3 days in Italy, 6-10 in Europe, once the order ships. It never says when that clock actually starts.
> 
> That's the gap where "did you send it yet" messages land in your inbox, one at a time.
> 
> Tideover reads each order's real status and drafts a reply in your voice, for you to approve before it sends. Those messages get answered without you writing each one by hand.
> 
> No cost to try. I'll run a real pilot in exchange for candid feedback. Want me to send what your reply to that message would actually say?
> 
> — Dylan

*Finding:* Their shipping policy states transit windows (1-3 days Italy, 6-10 days Europe) but never states when an order is actually dispatched, so a buyer has no way to know if the clock has started.
*Evidence:* WebFetch on abbigliamentojessica.com/policies/shipping-policy returned exact quoted text "1–3 giorni lavorativi" (Italy) and "6-10 giorni lavorativi" / "entro 10 giorni lavorativi" (Europe), with no processing or dispatch time stated anywhere on the page.
*Auditor flagged:* (d) "with no template ready to answer them" asserts their internal process. The evidence covers one public policy page only. Cut the clause; the finding itself (transit windows stated, dispatch clock never stated) is high-confidence and quoted, and carries the email on its own.

---

### AccuGOLF
`gsm@accugolf.us` · https://accugolf.us · Timesact (Shopify) · confidence: **medium** · _auditor-corrected_

**Subject:** what a homecourse buyer hears after checkout

> Your shipping policy spells out the 2-year limited warranty on simulator packages in detail. It never states a processing time, a lead time, or what a customer hears between placing the order and it arriving.
> 
> On a simulator package, that silence is what turns into "any update?" calls and emails while gear is in transit.
> 
> Tideover reads the real order timeline and drafts a status reply in your voice, for you to approve, so a buyer gets an answer without your team writing one from scratch each time.
> 
> Free pilot, in exchange for candid feedback on whether it's useful. Want me to draft what a day-14 update on a simulator order would say?
> 
> — Dylan

*Finding:* AccuGOLF's shipping policy details their 2-year warranty at length but states no processing time, lead time, or post-purchase communication commitment, on a storefront that sells a $13,849.99 full simulator system and $2,899-$4,499 projectors.
*Evidence:* WebFetch directly on accugolf.us/policies/shipping-policy confirmed content covering "AccuGOLF provides a 2-year limited warranty on all golf simulator packages" with no stated shipping/processing timeframe anywhere on the page; product page at /products/accugolf-homecourse returned 404 so pricing/product-detail claims rely on the given catalog data (HomeCourse listed at $13,849.99).
*Auditor flagged:* (d) The HomeCourse specifics are the weakest link in the batch. The evidence states the product page /products/accugolf-homecourse returned 404, so the only support for HomeCourse being a live product is catalog data. The email then escalates to "a day-14 update on a HomeCourse order," which presumes live HomeCourse orders exist. If it is discontinued, the opening line is wrong to a stranger.; (d) "On a purchase that size" leans on the $13,849.99 catalog price, which the live fetch could not confirm. The verified quote says "golf simulator packages," which is enough to signal high ticket without naming a price or a SKU we could not load.; (d) "that silence is exactly what turns into phone calls and 'any update?' emails" states their support reality as fact; softened in the rewrite to what the gap invites rather than what is happening.

---

### AKOIASWIM
`love@akoiaswim.com` · https://akoiaswim.com · Timesact (Shopify) · confidence: **medium** · _auditor-corrected_

**Subject:** your preorder app isn't running any preorders

> AKOIASWIM has Timesact's preorder tools installed, but nothing on the store is listed as a preorder right now, and your shipping policy doesn't mention preorder, made-to-order, or backorder anywhere.
> 
> That's fine while orders clear inside the 5 business days your policy states. It stops being fine the first time a drop or restock needs real lead time, because that's when "where is my order" starts landing in your inbox.
> 
> Tideover reads the real order timeline and drafts a reassurance reply in your voice, for you to approve before anything sends, plus a status page instead of a status email.
> 
> Free pilot, in exchange for candid feedback. Want me to send what a day-30 reply would look like for you?
> 
> — Dylan

*Finding:* AKOIASWIM has a preorder app installed (Timesact) but currently zero live preorder items and no preorder/made-to-order language on its own shipping policy page.
*Evidence:* Scraped catalog: app = "Timesact (Shopify)", preorderCount = 0, all 8 sampled products preorder:false. Live fetch of akoiaswim.com/policies/shipping-policy confirms only standard processing (5 business days) and tracking-email language, no preorder/made-to-order/backorder terms anywhere on the page.
*Auditor flagged:* (d/a) "That's fine while everything ships in 5-10 days" is a fabricated number. The evidence says the policy states 5 business days of processing. The "10" appears nowhere, and processing is not shipping. Quoting a merchant's own policy back to them with the number changed is the fastest way to lose the reply.; (d) "nothing on the store is running as a preorder right now" is absolute but rests on preorderCount = 0 plus an 8-product sample. Softened to what the store listings show.; (d) "refund requests start landing on your inbox" predicts a refund problem we have no evidence of; cut.

---

### AJ Toys & Books
`ajtoys.sales@gmail.com` · https://ajtoys.co.uk · Timesact (Shopify) · confidence: **high** · _auditor-corrected_

**Subject:** the gap after "more info coming soon"

> AJ Toys has live preorders with release dates months out, like the Gundam Card Game Booster (GD07) dated 29/01/2027. Each listing carries the same line: "THIS ITEM IS A PRE-ORDER AND IS DUE TO RELEASE: [DATE]. More info coming soon!"
> 
> That's all the listing tells a buyer about what comes next. They pay, then wait months on a promise of more info later, and the follow-up questions come to you.
> 
> Tideover reads each preorder's real timeline and drafts a reassurance reply in your voice, for you to approve before anything sends, plus a status page so buyers can check without emailing.
> 
> Free pilot, in exchange for candid feedback. Want me to send what a day-30 reply on one of these boosters would say?
> 
> — Dylan

*Finding:* Multiple live preorder listings (Gundam, Digimon, Dragon Ball Super boosters) with release dates months away, each carrying only the placeholder notice "More info coming soon!" with no further post-purchase communication described anywhere on the site.
*Evidence:* Live fetch of ajtoys.co.uk homepage: Gundam Card Game Booster Pack (GD07) release "29/01/2027"; Digimon Card Game Extra Booster (EX-14) release "22/01/2027"; Dragon Ball Super CG Booster Pack (FB12) release "11/12/2026"; each tagged with site text "THIS ITEM IS A PRE-ORDER AND IS DUE TO RELEASE: [DATE] More info coming soon!" No dedicated preorder policy page found (404 at /pages/pre-order-information).
*Auditor flagged:* (e) 136 words, over the 130 limit. Rewrite is 125.; (d) "That's the whole post-purchase experience right now" overreaches. The evidence covers listing text and one 404 policy URL. It says nothing about the emails they may already send after checkout. Narrowed to what the listing tells a buyer, which is what we actually verified.; (d) "every follow-up question about it lands in your inbox" is an absolute claim about their inbox volume.; (b) Cleared, not a violation: the 29/01/2027 and 22/01/2027 dates are their own published release dates, quoted back and attributed to their listings, not a delivery date promised on their behalf. The single exclamation mark sits inside a verbatim quote of their site copy, so it is reported text, not our cadence. Both kept intentionally.

---

### AKgelblaster
`customersupport@akgelblaster.com` · https://akgelblaster.com · Timesact (Shopify) · confidence: **high**

**Subject:** the custom-blaster gap in your shipping page

> AKgelblaster's shipping policy promises orders go out in 2 working days, then carves out one exception: "except out of stock or custom upgrade blaster." The page never says how long that exception takes or what a buyer hears while it's pending.
> 
> That's the exact gap where support tickets and "any update?" emails build up on a custom build nobody's confirmed a timeline for.
> 
> Tideover reads the real order timeline and drafts a reassurance reply in your voice, for you to approve before anything sends, plus a status page instead of a where-is-my-order email.
> 
> Running this free for candid feedback right now, no cost. Want me to send what a custom-build reply would look like?
> 
> — Dylan

*Finding:* Shipping policy carves out an explicit exception for custom/out-of-stock builds ("except out of stock or custom upgrade blaster") with zero elaboration on timeline or buyer communication for that case, anywhere on the site.
*Evidence:* Live fetch of akgelblaster.com/policies/shipping-policy and homepage: exact text "We will send your order in the next 2 working days except out of stock or custom upgrade blaster." No further mention of custom/out-of-stock lead times or buyer updates found on the shipping policy page; no preorder/made-to-order language elsewhere on site.

---

### A  LINE — Diogo
`store@alineclothing.com` · https://alineclothing.com · Timesact (Shopify) · confidence: **high**

**Subject:** your fall winter 26 preorder page has no ship date

> Diogo,
> 
> Your Fall Winter 26 collection is live as a preorder, every item shows out of stock, and nothing on the page tells a buyer what happens between checkout and shipping. That gap is where "where's my order" emails pile up, and each one either eats support time or turns into a refund request. Tideover reads the real order timeline and drafts a reassurance reply in your voice, you approve before anything sends, and buyers get a status page instead of guessing. I run a free pilot for a handful of preorder stores in exchange for straight feedback. Want me to draft what your day-30 reply to a Fall Winter 26 buyer would look like?
> 
> — Dylan

*Finding:* The Fall Winter 26 collection is explicitly labeled PRE-ORDER and every item on it shows OUT OF STOCK, but no product or collection page states a ship date, lead time, or what a buyer should expect between checkout and shipping.
*Evidence:* WebFetch of https://alineclothing.com showed a nav link "[PRE-ORDER](/collections/fall-winter-26)"; WebFetch of that collection page confirmed all products display OUT OF STOCK status with no ship-date or lead-time language anywhere on the page.

---

### Alizz col
`sac@alizz.com.co` · https://alizz.com.co · Timesact (Shopify) · confidence: **high** · _auditor-corrected_

**Subject:** your preventa page has no ship date

> Hi there,
> 
> Your Plancha Alizz Curling 480 is listed as preventa, but the only delivery timing anywhere on the site is the site-wide line about 3 a 4 dias habiles, and that doesn't describe a presale item. Whoever buys it has no idea what happens next, and that gap is where support tickets and refund requests start. Tideover reads each order's real timeline and drafts a reassurance reply in your voice, you approve it before anything sends, and the buyer gets a status page instead of guessing. I'm running a free pilot for a few preorder sellers in exchange for direct feedback. Want me to send what a day-14 reply for that preventa order would say?
> 
> — Dylan

*Finding:* They sell at least one product labeled PREVENTA (presale), but the only delivery-timing text anywhere on the site is the generic 3-4 business day shipping line, which doesn't describe the presale item and gives that buyer no real expectation.
*Evidence:* WebFetch of https://alizz.com.co found product titled "PLANCHA ALIZZ CURLING 480 PREVENTA"; WebFetch of that product page at /products/plancha-alizz-curling-480-preventa confirmed no ship date or lead time is stated, only the site-wide text "LOS TIEMPOS DE ENTREGA ESTIMADOS SON DE 3 A 4 DIAS HABILES PARA CIUDADES PRINCIPALES" repeated as boilerplate.
*Auditor flagged:* (d) Unsupported/garbled specific: the email calls the product "Plancha Alizz 480 Curling". The evidence records the actual title as "PLANCHA ALIZZ CURLING 480 PREVENTA". Getting a stranger's own product name scrambled is the fastest way to look like a bot that never looked at the store.; (d) Misquoted site text: "the standard 3 to 4 dia shipping text" is a broken half-translation. The evidence quote is "3 A 4 DIAS HABILES PARA CIUDADES PRINCIPALES". "dia" is neither Spanish nor English and reads as a scrape artifact pasted straight into the email.; (d) "A buyer who paid for that iron" presents an actual paying customer as fact. Nothing in the evidence shows any order exists. Framed as a hypothetical it is true; framed this way it is an assumption about their business.; Also note (not a doctrine break, kept in the rewrite): the evidence supports "only delivery-timing text anywhere on the site", so that claim stands.

---

### Alice im Wolleland — Alice
`alice@im-wolleland.eu` · https://alice-im-wolleland.eu · Timesact (Shopify) · confidence: **high** · _auditor-corrected_

**Subject:** your shipping pause is live right now

> Alice,
> 
> Your site says shipping is paused from July 30 to August 23. Anyone ordering right now buys into that window with no idea whether your usual 1 to 3 day packing time restarts when you're back. That stretch is where a buyer starts emailing to ask where the order is, and since you pack and send every order yourself, each one costs you time. Tideover reads the real order timeline and drafts the reassurance reply in your voice, you approve it before anything sends, and the buyer gets a status page instead of a guess. I'm running a free pilot with a few small shops in exchange for candid feedback. Want me to draft what your reply during the pause would say?
> 
> — Dylan

*Finding:* The site is currently in a stated shipping pause from July 30 to August 23 (today is August 7, so it's live right now), and the shipping policy doesn't say whether the normal 1-3 day pack time still applies once the pause ends.
*Evidence:* WebFetch of https://alice-im-wolleland.eu found homepage banner text "VERSANDPAUSE zwischen den 30. Juli und 23. August!"; WebFetch of /policies/shipping-policy confirmed the normal turnaround text "Jede Bestellung wird von mir innerhalb von 1 bis 3 Tagen persoenlich sorgfaeltig verpackt und verschickt" with no clarification of how it applies during or after the pause.
*Auditor flagged:* (d) + (f) "time you'd rather spend at the needle" is an invented specific and the worst line in the batch. The evidence covers a shipping-pause banner and a packing-time policy. Nothing establishes that Alice knits, uses needles, or makes anything by hand. It was inferred from the brand name "Wolleland" (wool). A wool shop can sell yarn without touching a needle, and telling a stranger how she likes to spend her day on a guess reads as fake-familiar warmth that collapses the moment she notices it's wrong.; (f) The same line performs intimacy with someone Dylan has never met. Doctrine bans fake-familiar flattery.; Note: the shipping-pause dates, the 1-3 day packing time, and the fact that she packs and sends every order herself are all directly supported by the evidence quote "Jede Bestellung wird von mir persoenlich sorgfaeltig verpackt und verschickt". The rewrite keeps the solo-operator point and drops only the fabricated craft detail.

---
