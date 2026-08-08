# Tideover Cold Outreach: Send Mechanics + CASL Compliance Runbook

> Scope: the cold lane only (List B). Never mix this with the Resend transactional or opt-in marketing lanes.
> Sender: Dylan, in Canada. CASL binds on every send regardless of where the recipient sits.
> Assets: 10 mailboxes, new domains, unwarmed. Theoretical ceiling ~450/day. **You will not send 450/day in month one.**

Every number below is tagged either **[LAW]** (statutory or platform-published, not negotiable) or **[ROT]** (rule of thumb, operational judgment, adjust on evidence).

---

## 1. The CASL floor for this campaign

The consent lane is **implied consent via conspicuous publication**. That means the address was posted publicly, in a business context, on the company's own page, with no "no unsolicited email" notice near it, and the message is relevant to that person's business role. Everything below keeps us inside that lane. Step outside it and there is no consent at all.

**The five conditions, all mandatory:**

1. **Business-context addresses only.** The address must have been observed on the store's own contact page, campaign page, or a linked business social profile. A pattern-guessed address (`firstname@domain`) has no publication basis and cannot be sent to. A personal Gmail scraped out of context cannot be sent to. This is already enforced in code: `C:\Users\dylan\Documents\axiom-balloon\Core Business\tideover\lib\prospect\casl.ts` refuses any contact whose `email_source` is not `observed` or `social`, and refuses any contact with no `source_url`. Do not add a fallback that substitutes the homepage URL for a missing source URL. A fabricated record is worse than no record.
2. **Source URL logged per contact.** We have this for every address. It is the due-diligence record and it is the entire defence if a complaint lands. Field: `EnrichedContact.source_url` → `CaslRecord.sourceUrl`, captured with `capturedAt` timestamp and the campaign URL. Do not send to any row where this is blank. **[LAW]**
3. **Identification in every message.** Sender's real name, the business name, and a physical mailing address that receives mail. **[LAW]**
4. **A working unsubscribe in every message**, able to be performed in about the same effort it took to read it, valid and functional for **at least 60 days** after sending, and honoured within **10 business days** with no confirmation step and no login required. **[LAW]**
5. **One-time contact per company.** CASL does not put a numeric cap on conspicuous-publication sends, but the basis depends on relevance to the recipient's role, and repeat-blasting a stranger is what turns a defensible send into a complaint. **For this campaign: one email per company. No sequence. No four-touch drip.** If Dylan wants a single follow-up, it is a second commercial message under the same basis, it goes no earlier than 5 business days later, it never goes to anyone who replied or unsubscribed, and it stops there. **[ROT — the one-per-company rule is our own discipline, not a statutory number]**

**Retention rule.** Keep the full compliance record (email, source URL, capture timestamp, consent basis, the exact message sent, unsubscribe status and the date it was actioned) for **3 years** from the send. CASL's limitation period for proceedings is 3 years from when the subject matter occurred, so a shorter retention leaves you unable to prove the basis for a send you can still be pursued over. Store it as a flat append-only log, not something the pipeline can overwrite on re-run. **[LAW-derived]**

**Also non-negotiable:**
- Unsubscribes are permanent and global. One suppression file across all 10 mailboxes and both domains. A person who unsubscribes from mailbox 3 is never emailed from mailbox 7.
- Never send from a domain whose WHOIS or footer identity does not match the sender identity in the email.
- Book the one-time CASL spot-check with a Canadian lawyer before scaling past the pilot list. Budget CA$150 to 300. Penalties run to $10M per violation with directors personally liable, which makes this the cheapest insurance in the plan.

---

## 2. The compliant footer, verbatim

Paste this below the sign-off. Replace every `[BRACKET]` with a real value before the first send. Do not delete a line to save space.

```
— Dylan

Dylan [LAST NAME], founder, Tideover
[LEGAL BUSINESS NAME OR "Dylan [LAST NAME], sole proprietor"]
[STREET ADDRESS], [CITY], [PROVINCE] [POSTAL CODE], Canada
dylan@[SENDING-DOMAIN] · https://[PRODUCT-URL]

I found this address published on [SOURCE URL] and I am writing once
because you are running a preorder campaign. If you would rather not
hear from me, unsubscribe here: [UNSUBSCRIBE URL]
That link works for at least 60 days. You can also just reply "stop"
and I will remove you the same day.
```

Footer rules:
- `[SOURCE URL]` is merge-populated per contact from `CaslRecord.sourceUrl`. If the merge field is empty, the send must fail, not send blank. Wire that as a hard validation, not a warning.
- The mailing address must be somewhere mail actually reaches Dylan. A home address, a registered business address, or a paid mailbox service all work. A fake or unmonitored address fails the identification requirement.
- `[UNSUBSCRIBE URL]` must be a plain static per-contact URL that unsubscribes in one click with no form and no login. Do not gate it behind a preferences centre.
- Do not use `List-Unsubscribe` headers as a substitute for the visible footer link. Add the header as well, both `mailto:` and `https:` variants, but the visible link is the compliance artifact.
- Keep the footer plain text. No logo, no image, no tracking pixel. Images and open-tracking pixels on a cold lane cost deliverability and buy nothing here.

---

## 3. Warmup-aware send schedule, new domain, 10 mailboxes

**Why day-one blasting torches the domain.** A brand-new domain has no sending reputation at Google or Microsoft. Reputation is built from consistent low volume and positive engagement signals (opens, replies, moves out of spam) over weeks. A cold domain that emits several hundred messages on day one produces the exact fingerprint of a compromised or throwaway spam domain: no history, sudden volume, low engagement, high bounce. The filters do not warn you. They start silently spam-foldering, then rate-limiting, then rejecting at SMTP. Reputation damage on a domain is effectively permanent at our scale, so the failure mode is not "a bad week," it is "buy new domains and start the 3 weeks over," plus a burnt list because those contacts already received a message they never saw. The domain is the asset. Volume is replaceable.

**Before day 1 (blocking prerequisites):**
- SPF, DKIM, DMARC published on every sending domain. DMARC starts at `p=none`, moves to `p=quarantine` after week 2 once reports are clean.
- Custom tracking domain: **off**. No open tracking, no link wrapping on the cold lane. The only link in the email is the unsubscribe URL.
- Every mailbox has a real display name, a real signature, and a profile photo. Empty mailboxes read as disposable.
- Forwarding and catch-all: off. Catch-all on a sending domain invites backscatter.
- Warmup tool (Smartlead or equivalent) enabled on all 10 mailboxes from day 1 and left running permanently, including through the send weeks.

**The ramp. Per-mailbox cold sends per day, excluding warmup traffic:**

| Days | Cold per mailbox/day | Cold total/day | What actually goes out |
|---|---|---|---|
| 1–7 | 0 | 0 | Warmup pool only. No prospects. Do not shortcut this week. |
| 8–11 | 0 | 0 | Warmup continues. Use the time for §4 list hygiene and to finish the 36 findings. |
| 12–14 | 1–2 | ~12–20 | **The 36 diagnosed prospects, hand-sent.** Roughly 12/day across 10 mailboxes, sent by hand from the mailbox UI, not the sequencer. |
| 15–17 | 4 | ~40 | First automated batch from the tier-2 segment. Batches of 40, one batch/day, spread over a 6-hour window with random 90–240s gaps. |
| 18–21 | 6–8 | ~60–80 | Hold here through end of week 3. Only step up if every metric in §5 is green for two consecutive days. |
| Week 4+ | +3/mailbox/week, ceiling 15–20 | 150–200 | The realistic steady state. |

**[ROT]** Every number in that table is operational judgment, not a legal or platform-published limit. The one hard external number: Google rejects mail outright above a **0.30% spam-complaint rate**, and that is their published threshold. **[LAW-adjacent, platform rule]**

Say this plainly: **the 450/day figure is capacity, not a plan.** Cold outbound on Google-backed mailboxes tops out around 15 to 20 per mailbox per day before engagement ratios go bad, so the honest ceiling for this fleet is 150 to 200 cold sends/day, reached around week 5 or 6. Anyone promising 450 cold sends/day off 10 fresh mailboxes is describing a domain funeral.

Other schedule rules:
- Send Tuesday through Thursday, 8am to 2pm in the recipient's local time. Skip Monday and Friday for the first three weeks.
- Never send the same subject line to more than ~30 contacts in a day. Rotate at least 3 subject variants.
- No two mailboxes send to the same company. Ever.
- If a mailbox goes quiet on replies for a full week while its peers get replies, pull it out and check its placement individually. One bad mailbox drags the domain.

---

## 4. List hygiene before the first send

Run in this order. Each step is a filter, and the list only shrinks.

1. **CASL gate first, before spending a cent on verification.** Drop every row with no `source_url` or with `email_source` outside `observed`/`social`. This is the code path in `lib\prospect\casl.ts`. Verifying an address you are not allowed to email is money burnt.
2. **Dedupe by root domain.** One company gets one email. Strip subdomains and `www`, normalize to the registrable domain, keep the single best contact per domain (named human > role address; higher confidence > lower). This is the single biggest complaint-avoider in the whole runbook. Five emails into one company on the same morning is how you get reported by someone who was never even the target.
3. **Dedupe by person.** The same operator often runs several stores. Match on email, then on name plus domain. One human, one email.
4. **Role-address rule.** Drop `info@`, `support@`, `sales@`, `orders@`, `hello@` **where a named human's address exists for that company**. Where the role address is the only thing the company published on its own contact page, keep it: that is genuinely a business-context published address and it is the address they chose to publish. Always drop `abuse@`, `postmaster@`, `privacy@`, `legal@`, `webmaster@`, `noreply@`, and anything at a generic ESP or platform domain.
5. **Verify and bounce-check** the survivors through a verifier (ZeroBounce, NeverBounce, MillionVerifier). Send only to `valid`. Drop `invalid` and `unknown` outright. Catch-all domains go to a separate holding segment and get sent last, in small batches, after week 3, because they bounce-check clean and then hard-bounce anyway. **[ROT]**
6. **Suppression list, checked at send time, not at list-build time.** It contains: every prior unsubscribe, every reply of any kind, every hard bounce, every complaint, competitors, anyone already using the product, and any address Dylan manually blacklists. One file, all mailboxes, checked immediately before each batch dispatches. A suppression list that is only applied when the list is built will re-email someone who unsubscribed yesterday.
7. **Eyeball the first 36 by hand.** Open each store page. Confirm the company still exists, the campaign is still live, and the finding in the email is still true. A finding that was accurate three weeks ago and is stale today is the worst possible first impression, and it is the one thing that makes a hand-picked list read as a blast.

---

## 5. Per-batch measurement and kill criteria

Log per batch, every batch, into one sheet: date, mailbox, segment, sends, hard bounces, soft bounces, complaints, unsubscribes, replies, positive replies, negative replies.

| Metric | Green | Pause and diagnose | Hard stop |
|---|---|---|---|
| Hard bounce rate | <2% | 2–4% | ≥5% |
| Spam complaint rate | <0.10% | 0.10–0.30% | ≥0.30% (platform rejection threshold) |
| Unsubscribe rate | <2% | 2–5% | >5% |
| Reply rate | 2–4% expected | <1% after 200 sends | n/a (a copy problem, not a safety problem) |
| Negative/hostile replies | 0–1 per 100 | 2 per 100 | 3+ per 100 |

**[ROT]** on all the bounce and unsubscribe bands. **The 0.30% complaint number is Google's published rejection threshold and is the one number here you cannot argue with.**

**Kill criteria, in plain terms:**
- **Bounce ≥5% on any batch: stop all sending immediately.** That is a list-quality failure, not a copy failure. Re-verify the whole remaining list before another message goes out. Bounces are the fastest way to kill a young domain.
- **Complaints ≥0.30% on any domain: that domain stops sending, same day, no exceptions.** Do not "finish the batch." Pull it, let it sit on warmup-only traffic for two weeks, and diagnose whether the problem was the list, the copy, or the targeting.
- **Three or more hostile replies per 100 sends ("how did you get my email," "who are you," "remove me now"): stop and rewrite.** Complaint rate lags; hostile replies do not. This is the early-warning signal, and it means either the targeting is wrong or the opening line reads as a blast.
- **Any reply asking about data source or threatening a CRTC complaint: stop that segment, reply personally the same day with the source URL, unsubscribe them, and log it.** Do not send a template. Do not argue. This is exactly what the source-URL log exists for, so use it.
- **Any mailbox landing in spam on the seed test: pull that mailbox** and let it run warmup-only for a week. Run a seed test (a set of your own Gmail, Outlook, and Yahoo accounts) at the start of every send week.

Weekly review, 15 minutes: bounce, complaint, reply, and positive-reply rates by segment and by mailbox. Iterate the hook, not the volume. Raising volume on a list that is not replying just spends the domain faster.

---

## 6. Sequencing: what goes first and why

**Tier 1 — the 36 diagnosed prospects. Days 12 to 14. Hand-sent.**
These are the warmest thing we own: hand-picked, each with a real finding pulled from their actual store or campaign. They are first for three separate reasons that all point the same way.
- Deliverability: replies are the strongest positive signal a young domain can generate, and these have by far the highest reply probability. The first traffic a new domain sends should be the traffic most likely to get answered.
- Learning: 36 is enough to tell you whether the message works before you have spent the list. If the diagnosed 36 do not reply, the untargeted 12,000 certainly will not, and you have learned that for the cost of 36 sends instead of 3,000.
- Safety: a hand-checked email citing something true about their store is the least likely message in the campaign to draw a complaint, at exactly the moment the domain can least afford one.

Send them by hand from the mailbox, roughly 12 per day across 10 mailboxes for three days. No sequencer, no merge tags visible, no tracking. Dylan reads every one before it goes. Replies go to Dylan personally, same day.

**Gate:** do not proceed to tier 2 until the 36 have had 72 hours and the metrics in §5 are green. If bounces or complaints are bad on a hand-checked list of 36, the pipeline is broken and volume will only multiply the breakage.

**Tier 2 — passes the CASL gate, has a verified live campaign and a specific lateness trigger. Days 15 to 21.**
Automated, batches of 40 rising to 80/day, every email citing that prospect's real trigger. Same one-per-company rule. This is where the copy gets tested at enough volume for the reply rate to mean anything.

**Tier 3 — the bulk store list (~12.6k rows). Week 4 at the earliest, and most of it never sends.**
Be blunt about this: the large CSV was not collected with a per-address source URL for every row, and every row that fails the §1 gate is unsendable, not "sendable with a caveat." Expect the CASL gate plus dedupe-by-domain plus verification to remove most of it. Run the gate first and see what genuinely survives before planning any volume against it. A smaller list that can be defended beats a large one that cannot.

**Never do:** run tiers 2 and 3 in parallel to "save time." One segment at a time means that when a metric goes bad you know which segment caused it. Parallel segments on a young domain means you lose the domain and never learn why.

