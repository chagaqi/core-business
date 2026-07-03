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

### [ ] 2026-06-19 — (paste your note here)
> Replace this line with the note you tried to leave in the dashboard, then tell Claude to check the file.
> We have **1 day left** in the sprint — list anything that still needs work (VSL, deliverables, copy, etc.).

---

## ✅ Handled
_(Claude moves done notes here with a one-line outcome.)_
