# P2 — The onboarding flow, beat by beat

The Swan videos convert on a *feeling*: you hand over one thing, sit back, and watch it work — then it asks you one easy question at a time, shows you value before asking for anything, and closes with a recap that tells you exactly what happens tomorrow morning. This spec ports that feeling onto Tideover's real seams. Companion to `docs/SWAN-SPRINT-PLAN.md` (P2) and ADR-0023.

## The two architecture calls

**1. The flow is a scripted state machine; the agent runs only where it adds truth.**
Swan's onboarding is fully agentic. Ours doesn't need an LLM to ask "pick your tone" — a fixed question sequence rendered as DecisionCards is faster, free, deterministic, and IS the never-dead-end fallback (agent unavailable = same flow minus the research beat). The agent runs at exactly three beats: **research** (real scrape), **diagnosis** (real findings), **sample drafts** (real engine output). Everything else is scripted UI wearing the same conversational skin. This keeps API cost ≈ 1–2¢ per onboarding and means the flow works identically with `LLM_PROVIDER` unset.

**2. Preview drafts come from the pure engine on the UNSAVED config.**
Backlog #4 ("drafts before connect") has a chicken-and-egg problem: drafting needs a merchant, but the wizard creates the merchant atomically at the end (a property we keep — partial merchants were a bug class we don't reintroduce). Solution: the deterministic drafter is a pure function — a new `/api/onboarding/preview-draft` runs it against the *in-progress, unsaved* config + a sample ticket (from their staged CSV when present, else a canned one labeled SAMPLE). Real bands from THEIR stage bands, zero persistence, instant.

## The beats

**Beat 0 — one field.** `/onboarding` after signup. Not a 5-step wizard: a single centered card — "What's your store or campaign URL? We'll do the homework on your business." One input, one button, plus a quiet "No URL? Answer three questions instead →" link (the manual branch). Optional second mini-step: "How did you find us?" (one tap, skippable — Swan's step 3).

**Beat 1 — watch it work.** Submit → the page becomes the chat canvas (ChatTurn + ToolChecklist). `useAgentStream` POSTs to `/api/agent/stream` running **diagnose-page**; the checklist renders REAL runner events — "Reading the page ✓ · Reading your shipping/FAQ page ✓" (the skill may scrape up to two real URLs on the same site) — then the findings stream in as text. PulseDot before first token. ~15–40s of visible, real work. *Fallback:* agent disabled or scrape failed → one plain sentence about what happened ("that page took too long to respond") and straight to Beat 2's questions; the transcript never dead-ends.

**Beat 2 — the readout.** The streamed diagnosis ends with the agent's one question ("Want me to set this up so backers stop asking?"). One DecisionCard: "Set it up" / "Show me a sample reply first" (jumps to Beat 5 early with a canned sample — the impatient path).

**Beat 3 — config as conversation.** The existing wizard's steps 0–2 (brand & voice · real timeline · gifts), re-rendered as one DecisionCard at a time in the same transcript, PRE-FILLED from the scrape (`analyzeSite` → brandName, estimatedDelivery seeds the window, rewardTiers/giftCandidates seed gifts). The merchant corrects instead of typing. Each answer appends as a user bubble; state accumulates into the SAME object the current wizard builds — the backend contract (`POST /api/onboarding`) does not change. Voice beat includes tone chips; timeline beat shows the derived stage bands and asks "does this match reality?" — their edit here is the single most load-bearing answer, so it gets the one confirmation re-ask if they widen/narrow drastically (consultative pushback, pattern D).

**Beat 4 — bring your backers.** The existing `ImportPanel` (CSV staging) embedded as a transcript beat behind a 2-card choice: "Upload your backer CSV" / "Skip for now — add them later". Import stays staged (atomic commit at finish, unchanged). The conversational column-mapping version (import-backers skill) lands here later without changing the beat's shape.

**Beat 5 — drafts BEFORE connect (the trust beat).** "Here's what I'd send your backers today." 2–3 preview drafts via `/api/onboarding/preview-draft` — against their real staged CSV rows when Beat 4 imported, else the SAMPLE-labeled canned ticket. Rendered as DraftArtifact (indented/muted/italic), each with the band visibly coming from THEIR timeline. Refrain line beneath: **"Nothing sends without you hitting approve."**

**Beat 6 — finish (silent).** On the merchant's go: `POST /api/onboarding` (existing, unchanged — owner-scoped idempotency, 409→/app redirect preserved). *Scout correction 2026-07-25:* the connect kit (per-merchant ingest URLs/secrets) is computed server-side at creation and returned on the response — so creation must precede the connect beat. Drafts (Beat 5) still precede BOTH, so the trust ordering holds.

**Beat 7 — the connect ask, late.** The existing `ConnectPanel`, fed from the response's `connect` kit — "to have real tickets land here drafted, connect your helpdesk." Skippable with the graceful line (pattern C): "Skip — everything still works; drafts stage in your inbox and you can connect any time." Then the RecapCard: ✅ set up today (voice · N stages · N backers) · ✅ every morning (tickets arrive drafted; you approve) · 📬 where they land (your Inbox — first drafts waiting) · ⚠️ your one open item (whatever was skipped: connect/import — named plainly) · 📈 week 1. One CTA: "Open your Inbox".

*Deferred from Beat 0 (scout finding):* "how did you find us" has no backend field — attribution ships later as its own small schema change, not smuggled into P2.

**Beat 8 — the pull-back.** ResumeBanner across /app until completeness hits 100% (that wiring is SW6/P3; the completeness signal is defined by which beats were skipped).

## Never-dead-end map (every branch has a floor)

| Failure | Behavior |
|---|---|
| Agent env unset | Beats 1–2 replaced by the manual 3-question card; identical flow after |
| Scrape fails/timeout | Plain one-line explanation + manual questions; no fake findings, ever |
| SSE drops mid-stream | Checklist freezes → after 5s the flow offers the manual branch; answers so far kept |
| CSV import fails | Beat 4's existing error surface; flow continues, import becomes the ⚠️ recap item |
| Connect fails | Beat 6 skip path auto-offered (Swan's email-bug move: keep building, name it in recap) |
| Old-wizard escape | `?classic=1` renders the current 5-step wizard untouched (kept until P2 soaks) |

## Build order (each step gates on verify + tests before the next)

1. **`useAgentStream` hook** (fetch-POST + SSE reader → typed AgentEvents) + `/api/agent/stream` becomes merchant-*optional* (session still required; skills whose tools need tenant scope 400 without a merchant — diagnose-page doesn't).
2. **diagnose-page skill**: permit a second real same-site scrape (shipping/FAQ) so the checklist has honest depth.
3. **Flow shell** `app/onboarding/flow/` — the state machine + transcript renderer composing the agentic kit; Beat 0–2 working end-to-end (live + fallback branches).
4. **Beats 3–4**: config DecisionCards mapped onto the existing wizard state object; ImportPanel embedded.
5. **`/api/onboarding/preview-draft`** (pure-engine preview) + Beat 5–7 (drafts, connect, finish, recap).
6. **Flip default** to the new flow with `?classic=1` escape; delete nothing.
7. **SW5 auth screens** (split-panel /login reskin; Auth0 dashboard items are Dylan's, below).

Hot-file note: none of this touches the five hot files — `/app` cockpit wiring is P3.

## Dylan items (tracked on the board)

- **SWP0CHK / SWP1CHK** — accept P0 (gallery) and P1 (repl runs) before P2 bakes them in.
- **DSMODEL** — the Vercel `LLM_MODEL` fix (prod drafting is floored until then).
- **SWAUTH0 (new, lands with SW5)** — Auth0 dashboard config only you can do: enable email-verification code on signup + password-policy display. 10 minutes, guided when we get there.
- **Walk the flow** when build step 6 lands — the P2 acceptance run, as a fake merchant, start to finish.
