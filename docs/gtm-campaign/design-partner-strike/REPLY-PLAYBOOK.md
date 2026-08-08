# Tideover Reply Playbook

Written to `C:\Users\dylan\Documents\axiom-balloon\Core Business\gtm-assets\tideover-reply-playbook.md`.

**Verified against the codebase before writing** (nothing invented):
- Pricing ladder $299 / $499 / $749, annual = 2 months free, 14-day trial no card — `tideover/components/marketing/PricingParts.tsx:14-16, 67-107` ("NUMBERS LOCKED (Fable, 2026-07-09)").
- Helpdesk ingest for Gorgias, Zendesk, Help Scout + generic webhook — `tideover/app/onboarding/ConnectPanel.tsx:39` (`ORDER: IngestVendor[] = ["gorgias","zendesk","helpscout","generic"]`); channels `mock, gorgias, tidio, intercom, email` at `tideover/app/api/ticket-ingest/route.ts:29`.
- **No Klaviyo integration exists** (zero matches repo-wide), so the Klaviyo handler claims no integration and reframes broadcast vs per-order reply.
- Per-order status page `app/status/[token]`, full data export `app/api/export/route.ts`.
- Voice and objection precedent pulled from `gtm-assets/copy-standard.md` and `outreach-playbook.md:272-289`.

**One judgment call for Dylan to confirm:** pilot length set at **4 weeks**. The existing playbook says "one cycle," but a real presale cycle is 60-120 days, which is too long to hold a design partner to and too slow for feedback. Four weeks gets drafts in front of live day-40-plus buyers without asking for a quarter of commitment.

---

# Tideover Reply Playbook

What Dylan says when a prospect replies to the cold outreach. Paste-grade. Strategy lives in `outreach-playbook.md` §5.2, the copy bar lives in `copy-standard.md`.

The ask at this stage is a free pilot in exchange for candid feedback. It is not a sale. No price is named unless they ask.

---

## 0. Standing rules

Every reply on this page holds these or it does not ship.

- No metric, stat, case study, customer count, or testimonial. We have none. Never "merchants like you see X".
- Never state or imply a delivery date on their behalf. Ranges, never dates.
- Banned: "honest", "hope this finds you well", "quick question", "just circling back", flattery, exclamation marks, em-dash cadence.
- One ask per reply. Low friction.
- If you cannot say something specific and true about their store, say the generic thing plainly. Do not invent a specific.
- Match their length. A two-line reply gets a two-line answer, not a wall.
- Sign "— Dylan".

---

## 1. The one diagnostic question

Ask this of every warm reply, before anything else. It is the whole qualification.

> How many paid orders are sitting unshipped right now, and how long has the oldest one been waiting?

Why this one. It gets volume and danger in a single answer. The oldest unshipped order is where refunds, chargebacks and "this is a scam" posts come from, and most merchants have never counted it.

**Reading the answer:**

| They say | What it means | Move |
|---|---|---|
| Oldest is 45+ days, dozens or more waiting | Live problem, live queue | Offer the pilot now |
| Oldest is 45+ days, single digits waiting | Real pain, small volume | Pilot still fits, set expectations low |
| Oldest is under 2 weeks | Not the shape of the problem yet | Say so, ask to circle back when the next campaign lands |
| They do not know | The most common answer, and the finding itself | Name it gently, then offer to count it with them |

For the last row:

> That number is the one I'd want on the wall. It is usually the order that turns into a refund request, and almost nobody is tracking it. Happy to count it with you in 15 minutes.
>
> — Dylan

---

## 2. The pilot terms

Say these the same way every time. Do not improvise new terms in a live thread.

**What it is:** four weeks, free, one presale queue.

**What Dylan does:**
- Connects Tideover to the helpdesk they already run (Gorgias, Zendesk and Help Scout have direct ingest, plus a generic webhook), or takes a CSV of open presale orders.
- Sets it up himself. No onboarding queue, no support ticket.
- Tideover reads the timeline on each order and drafts the reassurance reply in their voice.
- Buyers get a status page link for their own order instead of an email thread.

**What they do:** approve, edit, or bin every draft. Nothing sends on its own. Ever.

**What Dylan wants back:** one 30-minute call at the end, candid. Three questions:
1. Which drafts would you never have sent, and why.
2. Where did the tone read wrong for your brand.
3. What did you end up rewriting every single time.

Grumpy feedback is the point. Politeness is worthless here.

**What they keep, pilot or no pilot:**
- Every reply that got approved.
- The wait-stage script set, written for their timeline.
- A full export of their data.

**No lock-in:**
- No card, no invoice, no contract.
- It does not roll into a paid plan. It ends and Dylan asks what they thought.
- They can stop any day, mid-week, no exit conversation.
- Data deleted on request.

**What Dylan will not do:** promise a ship date on their behalf, or send anything to a buyer without their approval.

---

## 3. Reply handlers

### 3.1 "Sure, tell me more"

The warmest reply and the easiest to fumble by over-explaining. Answer short, then the diagnostic question.

> Short version. Between the day someone pays and the day their thing ships, they write in asking where it is. Tideover reads each order's real timeline and drafts the reply for you to approve, in your voice. You approve or bin it. Nothing sends by itself. The buyer also gets a status page for their own order, so the second and third "any update?" never becomes an email.
>
> Before I say anything else: how many paid orders are sitting unshipped right now, and how long has the oldest one been waiting?
>
> — Dylan

### 3.2 "What does it cost?"

Do not dodge, do not discount, do not hint at one. The price is real and published. The pilot is free because we need the feedback, not as a favour.

> Nothing for what I'm asking about. I'm running free four-week pilots because I need candid feedback more than I need the money right now.
>
> Published pricing is $299, $499 and $749 a month depending on seats and how many presale orders are in the wait window. It's on the site. The pilot isn't on that ladder and doesn't turn into it. It ends, and I ask you what was wrong with it.
>
> Still worth 15 minutes?
>
> — Dylan

**If they push, "so what would I pay after?"**

> Whichever tier fits your order volume at the time, at list. I'm not going to invent a founder discount to get you in the door. If four weeks of it doesn't earn the list price, that's my problem to fix.
>
> — Dylan

### 3.3 "We already use Gorgias / Zendesk / Klaviyo"

The most common wall. The answer is bolt-on, and it is genuinely good news for them.

> Keep it. Tideover sits on top of Gorgias and only touches the presale tickets you route to it. Everything else stays exactly where it is. Direct ingest is built for Gorgias, Zendesk and Help Scout, so there's nothing to migrate and nothing new for your team to learn. You approve and send from the inbox you already use.
>
> — Dylan

**Klaviyo specifically.** Different tool, different job. Do not claim an integration, there isn't one.

> Klaviyo is the right tool for telling every backer the same thing at once. Keep doing that. It doesn't answer the one buyer at day 62 who has read that update and still wants to know about *their* order. That reply is the one that decides whether they wait or file a dispute. That's the only part I'm talking about.
>
> — Dylan

### 3.4 "How is this different from a shipping-notification app / order tracker?"

The sharpest question they can ask, and the one with the cleanest answer. Do not get defensive.

> Those pick up once there's a tracking number. They tell someone where a parcel already in transit is.
>
> On a presale there is no tracking number for 60 to 120 days. That whole stretch is the part with nothing in it, and it's the part where people get anxious, ask three times, then ask for their money back. Tideover works that gap, before the label exists. Once it ships, your tracker takes over and I'm done.
>
> — Dylan

### 3.5 "We don't have that problem"

Do not argue. Ask the question and let their own number answer it. Be genuinely willing to accept no.

> Could well be. One way to check: how many paid orders are sitting unshipped right now, and how long has the oldest one been waiting?
>
> If the oldest is a couple of weeks, you don't have this problem and I'll leave you alone. If it's day 70 and the last thing they heard from you was a campaign update in month one, that's the one I'd want to look at.
>
> — Dylan

**If they answer and genuinely don't have it:**

> That's a clean operation, and it's the right answer. Not going to manufacture a problem for you. If a future campaign stretches past a couple of months, I'd be glad to hear about it.
>
> — Dylan

### 3.6 "Who else uses it?"

Answer first, plainly, in the first sentence. Any hedge here reads as a lie and the thread dies.

> Nobody yet. You'd be the first, and I'd rather say that than dodge it.
>
> Here's why I think that's the offer and not the risk. There's no money in it, so there's nothing to lose but the setup time, which I do myself. Nothing sends to a buyer without you approving it, so the worst case is you bin every draft I write. You keep the scripts and your data either way. And for four weeks the product bends to your campaign, because you're the only one in it.
>
> What I want back is a 30-minute call at the end telling me what was wrong with it. That's the whole deal.
>
> — Dylan

**If they ask "so why should I trust you at all?"** Lead with the operator story, framed as experience. Never as a number in a cold thread.

> Fair. I ran a home-gym equipment company through COVID. Did $200K in the first week, then spent two straight years on 60-plus day backorders. I answered the day-60 refund email at 11pm more times than I want to think about. I'm not an ecommerce software guy. I'm someone who lived this specific inbox and got tired of it.
>
> — Dylan

### 3.7 Angry reply or spam accusation

Apologise once. Remove them. Stop. No defence, no explanation of how you found them, no re-pitch, no "sorry you feel that way". Never reply twice.

> Apologies, that's on me. Removing you now. You won't hear from me again.
>
> — Dylan

Then actually remove them from every list and never contact them again through any channel. Do not add them to a nurture sequence. Do not follow them on X.

### 3.8 "Send me a demo"

A recorded demo of a product with no customers is weak. Offer the live thing on their own queue. If they want async, send the page, not a deck.

> Better on your actual queue than a canned one, and it's 15 minutes. I'll show you what the drafts look like against your real presale orders, and you keep whatever I find whether or not you carry on. [bookingLink]
>
> If async is easier, this walks through it: [link]
>
> — Dylan

**If they insist on async only:** send the link, one line, no follow-up paragraph.

> Here you go: [link]. If anything in it looks wrong for how you run presales, tell me and I'll fix it.
>
> — Dylan

---

## 4. Fast reference

| Reply | Core move | Never |
|---|---|---|
| Tell me more | Two-line explainer, then the diagnostic question | Feature list |
| What's the cost | Free pilot. Ladder is $299 / $499 / $749, published | Hint at a discount |
| We use Gorgias / Zendesk | Bolt-on. Direct ingest exists. Keep your helpdesk | Ask them to switch |
| We use Klaviyo | Broadcast is not a per-order reply | Claim a Klaviyo integration |
| How is this different | Trackers start at the tracking number. This is the 60 to 120 days before it | Get defensive |
| We don't have that | Ask the diagnostic. Accept no | Argue |
| Who else uses it | "Nobody yet, you'd be first", in sentence one | Imply pilots or interest we don't have |
| Angry / spam | Apologise once, remove, done | Reply twice |
| Send a demo | Live, on their queue, 15 min | Send a deck |

---

## 5. Things that are true and can be said

Everything below is verified against the product. Nothing else may be claimed.

- Nothing auto-sends. Every reply is drafted for merchant approval.
- Direct helpdesk ingest exists for Gorgias, Zendesk and Help Scout, plus a generic webhook. Tidio, Intercom and email are supported channels.
- Buyers get a status page for their own order, on a per-order link.
- CSV import of backer or presale orders works.
- Full data export exists.
- Published pricing: $299, $499, $749 per month. Annual is two months free. A 14-day free trial with no card exists on the site, separate from the pilot.
- Zero customers. Zero case studies. No cohort has finished a wait window yet, so there is no outcome data, and we say that plainly.
- Dylan's background: home-gym equipment company through COVID, $200K in week one, 60-plus day waits for two years. No ecommerce SaaS track record.

---

**Placeholders left for Dylan to fill:** `[bookingLink]` and `[link]` in 3.8. Real routes that exist and could fill them: `/book`, `/how-it-works`, `/vsl/partner-demo`. I did not hard-code them since I could not confirm which is the current public-facing demo.

**Remaining risk:** the four-week pilot length and the three feedback questions are my call, not a pre-existing locked term. If Dylan has already promised a different pilot shape to anyone, section 2 needs to match it before this goes into use.
