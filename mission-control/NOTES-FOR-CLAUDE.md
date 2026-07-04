# 📥 Notes for Claude — Chaga's inbox

This is the channel where **Chaga leaves notes / updates / instructions for Claude** about the sprint.

**Why this file exists:** Claude **cannot read the Mission Control dashboard's saved state** — your approvals, deny-notes, and checkboxes all live in your **browser's localStorage**, which Claude has no access to. To leave Claude a note it can actually read, do ONE of:
1. **Write it in this file** (any text editor) under "Inbox" below, then tell Claude *"check the notes file."*
2. **In the dashboard → Deliverables tab → hit `⎘ Copy decisions`** and paste the export into chat. That dumps every approve/deny + note you typed.

**Claude checks this file at the start of each session and whenever you say "check mission control."**

---

## How to use
- Add a new entry at the TOP of **Inbox**, dated.
- Mark it `[ ] new`. Claude flips it to `[x] done` and moves it to **Handled** after acting.
- Keep it short: *what* you want changed, on *which* asset (e.g. "Adwield VSL — hook is weak, redo it").

---

## 📤 From Claude — weekend test is ready (2026-07-03)

**The webhook/API connection you asked for (W2) is built + live.** No email forwarding needed.

**Fastest test right now** (paste in a terminal — should return `"status":"ingested"` and a drafted reply):
```
curl -X POST "https://www.tideover.app/api/ingest/webhook/zubwdu74tq5zt83vu6egiasx" \
  -H "Content-Type: application/json" \
  -d '{"external_id":"my-test-1","customer_email":"you@example.com","subject":"where is my order?","body":"just checking in","tags":["presale"]}'
```
That token is the seeded **Lumen Forge** demo merchant — the ticket shows up in `/app/inbox`. Change `external_id` for a new ticket; reuse it to see de-dupe.

**To test a real helpdesk connection (Gorgias mock):**
1. Go to `www.tideover.app/onboarding`, create your mock brand → the **"Connect your helpdesk"** panel gives you your OWN ingest URL + a copy-paste Gorgias (or Zendesk) setup block.
2. In Gorgias: add an **HTTP Integration** with that URL + body template, and a **Rule**: *ticket tagged `presale` → run the integration*. That's the whole setup.
3. Tag a test ticket `presale` in Gorgias → it lands in your Tideover cockpit, drafted. Untagged tickets never reach us — your helpdesk decides what we see.

**Also testable now, zero setup:** the customer status page (`/status/<token>`), the CSV backer-list import (`/onboarding`), the cockpit keyboard flow (`/app/inbox`, j/k/Enter/⌘Enter).

Note taken on the word "honest" — I've stopped, and queued a copy sweep to pull it out of the reassurance scripts too (a drafted reply literally said "the honest status", which proves your point). Enjoy the weekend.

---

## 📨 Inbox (newest first)

_(empty — your "1 day left, what's left?" note is answered under Handled.)_

---

## ✅ Handled

### [x] 2026-07-05 — END OF SPRINT: autonomous work is done; the rest is your call

**Read this first.** Over the weekend I closed out ~13 more tasks (56 done total). The product is complete, hardened, monitored, backed up, and documented. I've now hit the honest end of what I can build without you — **every remaining board task is a decision only you can make.** So the next tick will stop-and-wait unless you unblock something below.

**Shipped since Friday (all on branch `sprint/tideover-finalization`, verify + tests green):** the full outcome loop (CSAT tap, reply/reopen attribution, the resolved_quiet cron, the QA hard-date gate + save-edit-as-variant); the money surfaces (baseline report, GMV-in-dispute tile); the cohort WISMO forecast; the "previously told" strip; draft alternates; SLA timers + attainment; the setup checklist + integration-health signal; the security procurement packet; the ADR log + dev-guide; the SAMPLE DATA watermark across all demo surfaces; Export Everything; a backup tool; a health/uptime endpoint. Two security bugs were caught by adversarial review before commit (a webhook cross-merchant vector, a capability-token leak in the export).

**Your decision list — in leverage order:**
1. **D17 → unlocks /pricing (G2).** Two answers: the per-tier order caps (Starter $299 / Growth $499 / Scale $749 each need an "up to N presale orders" number), and reconcile the ladder with the live copy that pledges founding partners "$199–299, the lowest I'll offer." Then /pricing is a 1-tick build.
2. **X2 → unlocks the About-page voice + G4 (lead magnet).** Approve the copy framework (I recommended templating Basecamp; `docs/copy/ABOUT-TEMPLATE.md`).
3. **M6 framing** — okay the bleed-calculator pitch angle (a public conversion asset; landmines pre-scoped in its board note).
4. **M5** — the delay-notice's FTC/refund policy (your call, not mine to guess).
5. **Sign-offs:** D7 (founder story), D9 (55 goldens → reviewed:true).
6. **Env/infra (30 sec–5 min each):** D16 (`WEBHOOK_ROOT_SECRET` + `CRON_SECRET` in Vercel), F5b (an R2/S3 bucket + key for automated offsite backup), D15 (email-forward DNS if you want that rung live).
7. **Copy you'd shape:** C8 (de-escalate reply wording — engine mechanics are ready), U6 (stage-transition outbound copy, also needs D15).

**To ship it:** the branch is merge-ready. `tideover/RELEASE.md` is the ritual (verify → merge to main → `vercel --prod` → `npm run smoke` → changelog). Prod is already live on Mongo at www.tideover.app.

**On the Mac:** the migration bundle on your H: drive is still current-enough (pull the branch after `restore-on-mac.sh` to get the weekend's work).

---

### [x] 2026-07-03 — "1 day left — list what still needs work"

**Bottom line: the software is done and live. What's left is (1) four sign-offs only you can give, and (2) the outreach copy, which is waiting on ONE decision from you.** Nothing on the product itself is blocking.

**① Your sign-offs — the real critical path (≈1 hour total):**
- **D7** — read the "Why I built Tideover" founder story (`docs/founder-story.md`) and say go / change. It's the trust spine of the whole pitch.
- **D9** — the 55 golden fixtures review (~30 min). They're the engine's reply snapshots; approving them flips `reviewed:false → true` and locks the safety net.
- **X2** — approve the copy framework so I can build the outreach pages (I recommended templating Basecamp's structure; see `docs/copy/ABOUT-TEMPLATE.md`). **This is the unblocker** — /pricing and the lead-magnet page are gated on it.
- **D16** — set `WEBHOOK_ROOT_SECRET` + `CRON_SECRET` in Vercel (30 sec, any long random strings). Two built features stay dormant/fail-closed until then — safe, but not armed.

**⚠️ Correction (2026-07-04): /pricing is NOT gated on X2 — it needs a different call from you (now D17).** Building it, I hit two things I won't decide for you: (1) the per-tier **order caps** were never written down (Starter $299 / Growth $499 / Scale $749 each need an "up to N presale orders" number; the D8 decision page is missing); (2) a **live pricing conflict** — `Pilot.tsx`/`FAQ.tsx` say "$199–$499/mo on proof" and `v2-sales-page.md` promises founding partners "$199–299, the lowest I'll offer," so publishing $299 as Starter makes that pledge false. Give me the caps + which numbers win and I ship /pricing + fix the stale copy in one tick. (X2 is still separate — the About-page voice.)

**② Copy / GTM still to build (the biggest lever for the $20K goal):**
- **/pricing page (G2)** — the pricing ladder you approved (D8), as a real page. **Now blocked on D17 (above), not X2.**
- **WISMO Teardown lead magnet (G4)** — the cold-outreach lead magnet page + day-14 checkpoint.
- The cold-email sequence + lead-magnet *content* already exist as docs (`14-cold-email-sequence.md`, `16-lead-magnet.md`); these turn them into site surfaces.

**VSL:** all four VSL landing pages are built and live (`/vsl/landing-vsl`, `/partner-demo`, `/playbook-promo`, `/cold-loom`). What's not done is *recording the actual videos* — that's you on camera; the pages + scripts are ready to shoot against.

**③ Optional product polish (nice-to-have, NOT blockers — I'll do if you want):** cockpit tweaks (draft alternates, "previously told" strip, dashboard v2), a demo-tour-first onboarding, the GMV-in-dispute money tile. The design-taste pass (X1) you already said "later."

**What I'm doing autonomously today** (safe, unblocked): hardening + hygiene tasks that don't need you. If you want me to spend the last day on the **outreach pages instead, just approve X2** and I'll build /pricing + the lead magnet page.

**My rec for your hour:** D7 + D9 + X2 + D16, in that order. That unlocks the outreach build and arms everything for a real pilot.

---

### (earlier handled)
_(Claude moves done notes here with a one-line outcome.)_
