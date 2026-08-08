# Persona walk — the new onboarding flow (2026-08-08)

Five ICP personas walked the conversational onboarding **in character** against the real code (boardgame · hardware · overrun · solo · apparel). Not QA bots — people with scar tissue, reading our actual copy. Their reports converged hard, which is what makes them trustworthy.

## Shipped immediately (11 fixes, gate green)

The convergent set — every one of these was flagged by 2+ personas independently:

| Fix | Who flagged it | Why it mattered |
|---|---|---|
| **Recap no longer promises "tickets arrive drafted" when connect was skipped** | hardware, solo, apparel | A promise the product cannot keep, told at the moment of maximum trust. Doctrine violation in our own copy. |
| **Timeline beat: "Already past it? Enter the window you originally promised"** + button now "That's what I promised" | overrun | **The deepest flaw found.** An already-late merchant's only path forward was to invent a longer window — which silently un-overdues every order and converts the engine's honest "we're behind" into a fabricated confidence band. The product was pressuring merchants into the exact lie it exists to prevent. |
| **Editable sign-off beat ("Who signs these replies?")** | all five | We silently set `— BrandName`. Every persona named a company-signed reply as the precise tell that reads as a bot — the thing that burned them before. |
| Bare domain accepted (`voltfield.com`) | boardgame, hardware, solo | Dead button, no explanation, at beat zero. |
| "three questions and you're live" → accurate scope | boardgame, hardware, overrun | The first untrue thing we said; they count. |
| Recap names **every** open item, in the setup page's words | boardgame, hardware, apparel | "You're set up" → "You're 2 of 5 set up" thirty seconds later reads as a rug pull. |
| Gift gestures **shown** + a real skip option | all four store personas | "A tool committing something to my backers sight-unseen" is their stated top fear. |
| Drafts show the early check-in **and the day-89 one** | boardgame, hardware, overrun | We showed the two easy months and hid "the only draft I opened the tab to read." |
| Approval refrain now **leads** the drafts beat | hardware | For a burned merchant the antidote must arrive before the frightening sentence. |
| Import accepts "any CSV with name, email, order date" | hardware, solo, apparel | The Woo/Gumroad/Shopify merchants were skipping because they assumed their export wasn't supported. |
| "Not yet — tell me more" path at the readout | boardgame, overrun, apparel | One option and no free text, for someone arriving braced for betrayal. |

## The punch list — not yet shipped, ranked

**P0 — reaches a buyer with something untrue**
1. **`{stage_blurb}` in the day-89 overrun template.** The one template written to be safe for late merchants says "I'm not going to invent a tracking number I don't have" and then states a manufacturing stage that may be pure fiction ("your unit is going through quality control" while tooling is being re-cut). Gate `stage_blurb` behind a merchant-confirmed stage; drop the clause when none is set. *(overrun — engine + goldens, needs a serialized pass)*
2. **Six manufacturing claims generated from one number.** `scaleStages(max)` assigns blurbs the merchant never wrote and never sees before they reach a buyer over their signature. Render the six scaled bands on the timeline confirm card with a "none of these are true yet — I'll set the stage myself" opt-out.
3. **Stage vocabulary is factory-shaped for everyone.** "Your unit is on the production line" for a hand-folded riso zine, a knitwear run, a board game. Offer a vocabulary set at the timeline beat (factory run / made by hand / printed / digital) and derive the buyer noun (backer / customer / preorder) from the detected platform.

**P1 — real drop-off, no untruth**
4. **No end state for a merchant without a helpdesk.** Gmail-only and Shopify-Inbox merchants (a large share of our ICP) see only Gorgias/Zendesk/Help Scout/HMAC and read "not built for me." Add a "just email, no helpdesk" path with the forward address, or state plainly that no-helpdesk is supported.
5. **Drafts aren't editable at the drafts beat.** Copy says "your voice"; the only control is "Create my workspace." Their stated test is approving *or editing* before anything is real.
6. **Kickstarter URL dead-ends the conversation.** The agent correctly asks for their own site instead — but the UI has already advanced to a card that can't take that answer. Re-render the URL card on `kickstarter-blocks-tools`.
7. **The already-late merchant has no beat.** Nothing asks "are you already past what you promised?" — which for a chunk of our ICP is the entire reason they're here. One beat after timeline, leading to a delay announcement as the first thing they approve.
8. **Import shortfall is hidden.** `ImportCounts` carries `skipped`/`datelessRows`/`failedAtChunk`; the recap prints none of them and can say "you're fully set" while thousands of rows dropped (a Kickstarter report has no per-backer date).
9. **`prefill.estimatedDelivery` is read aloud then discarded** — never reaches `buildBody`. The gap between what they promised publicly and what's true is the merchant's whole crisis; we should keep it and let overdue fire against the promise.
10. Suppress the "Friendly & upbeat" voice preset when the confirmed window is already blown (reads as a tool that hasn't understood the situation).

**Deliberately not fixing**
- The timeline question stays uncomfortable. Asking for a real window *should* be uncomfortable — it must be true, and that discomfort is the product working. We soften the path (see the "already past it" fix), never the honesty.

## What lands — the keep-list

Unanimous across all five: **"Nothing sends without you hitting approve — that never changes,"** placed directly under `(SAMPLE)`-labeled previews that are real engine output rather than model-written prose. Every persona named that single line as the reason they didn't close the tab. The overrun merchant asked for it *earlier* — at the URL beat, before ten minutes of bracing for the trapdoor.
