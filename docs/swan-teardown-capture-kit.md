# Swan UX Teardown — Capture Kit

**Goal:** go through Swan's (getswan.com) full new-user experience — signup → onboarding → first "aha" → daily use — and capture it so Claude can digest *everything that makes it convert and retain*, then port the good parts into Tideover. Swan is our benchmark: an AI-based company that onboards well and grows fast.

**The one thing to know about what Claude can consume:** Claude reads **images and text at full fidelity**. Screenshots are the richest input — every headline, button label, microcopy, empty state, and error is legible. What screenshots *can't* show: motion, timing, hover/reveal states, and the *feel*. So the method below is layered to fill exactly those gaps.

---

## The method — 3 layers, ~stacked

### Layer 1 (PRIMARY): a screenshot of every screen, in order
Not just the pretty ones. **Every** screen, in sequence: the landing page you signed up from, each signup field, every onboarding step, every modal/tooltip, the first dashboard, every empty state, every email that arrives, any error you hit. Name them in order: `01-landing.png`, `02-signup.png`, `03-onboarding-step1.png` … Order is the whole story.

### Layer 2: the annotation doc (catches what stills miss)
One markdown file, one entry per screenshot number, using the template below. This is where you record the things a still can't show — and your reactions, which are the most valuable part.

### Layer 3 (BACKUP, optional but ideal): a narrated screen recording
Record the whole run once with **your voice on** (Loom/OBS) — think out loud: "now I'm clicking X… oh, this loaded instantly… I'm not sure what this field wants…". Then make it digestible for Claude:
- **Transcribe the narration** with `transcribe-anything` (you already have it) → a text transcript. Your spoken reactions + timing become text Claude reads.
- The screenshots from Layer 1 are the frames. (If you want, export 1 frame/sec from the video too, but usually the ordered screenshots + transcript are enough.)

**Best combo:** narrated recording → transcript + your ordered screenshots + the annotation doc. That misses nothing.

---

## Per-screen template (copy one block per screenshot)

```
### 07 — Onboarding step 2 (connect your store)
- Screenshot: 07-onboarding-connect.png
- What I did: clicked "Connect Shopify", picked my store from the OAuth list.
- What happened: bounced to Shopify OAuth, back in ~2s, showed a green "Connected" check.
- Exact copy: Headline "Let's plug Swan in" · Sub "This is the only setup step." · Button "Connect Shopify" · helper text under it: "…"
- Load/motion: near-instant; the check animated in with a little bounce.
- What I FELT: relief — one step, no config. Almost too easy, wondered what it actually pulled.
- Friction / confusion: none here. (or: "sat for 4s wondering if it froze")
- What nudged me forward: the "1 of 3" progress dots + the single obvious button.
```

---

## The specific things to capture (the easily-missed checklist)

Tick these across the run — they're where the "why it converts" hides:

- [ ] **The signup ask** — how much do they ask for up front? Email only? Card? What's deferred?
- [ ] **Time-to-value** — how many clicks/minutes from signup to seeing something *useful about your own data*? (This is the #1 thing.)
- [ ] **The "aha" moment** — the first screen where you go "oh, this is for me." Screenshot + note exactly what triggered it.
- [ ] **Empty states** — what does a brand-new account show before there's data? (Often the best onboarding copy lives here.)
- [ ] **Every piece of microcopy** — button labels, helper text, tooltips, placeholder text, error messages. Copy them verbatim.
- [ ] **Progress + momentum** — progress bars, checklists, "you're almost there" nudges, defaults pre-filled for you.
- [ ] **The onboarding emails** — screenshot each, note the ORDER and TIMING (welcome now? nudge at +1hr? +1 day?). Forward the actual emails to yourself so the copy's exact.
- [ ] **AI moments** — where does the AI show up, and how do they make it feel trustworthy vs gimmicky? What does it do on your real data?
- [ ] **Defaults & pre-fill** — what did they set up FOR you vs make you configure?
- [ ] **Friction points** — anywhere you paused, got confused, or almost bailed. These are as valuable as the wins.
- [ ] **The daily-use hook** — after onboarding, what pulls you back tomorrow?
- [ ] **Anything you'd steal** — mark it with a ⭐ in the notes.

---

## How to hand it to me

Drop it all in one folder in the repo, e.g. `docs/swan-teardown/`:
- `screenshots/01-*.png … NN-*.png` (ordered)
- `notes.md` (the annotation doc, per-screen template above)
- `transcript.txt` (if you did the narrated recording)
- the onboarding emails (screenshots or `.eml`)

Then tell me "Swan teardown's in docs/swan-teardown" and I'll read the whole thing.

## What I'll do with it
- Read every screen + your notes + the transcript.
- I'll **also do the public-facing research myself** in parallel (their site, changelog, pricing, positioning, any public onboarding content, reviews) — the parts that don't need an account — so we triangulate.
- Then synthesize a ranked "steal-this" list mapped to Tideover: what to port into our onboarding/first-run/empty-states/emails, each with a concrete implementation, and ship the ones that fit our proof-only voice.

---
**Note on account creation:** you make the Swan account and drive the flow (I can't create accounts or sign in as you). I handle the public research + all the synthesis + implementation once your capture lands.
