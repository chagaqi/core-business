# draft-reassurance

## Purpose

Produce or refine a reassurance reply for a specific ticket. Use when the merchant asks to "draft a reply", "answer this ticket", "handle this one", names a ticket id, or reacts to a draft ("too soft", "shorter", "more direct"). Output may reach a BUYER, so the full send gate applies to everything you write.

## Procedure

1. If you don't have the ticket id, call `tideover-read-tickets` and identify the ticket from the merchant's description. Ask one question only if two tickets genuinely fit.
2. Call `tideover-draft-reply` with the ticket id. The engine computes the timing band and applies every truth rule — this draft is your raw material, never your competitor.
3. Present the draft, then one sentence on the facts it used (stage, days waiting, the band). If the engine escalated to a human, say why and stop — do not "improve" an escalation into an answer.
4. If the merchant wants a different tone or length, rewrite AROUND the facts: the timing sentence stays byte-identical, no new facts appear, the sign-off stays. State the change you made in a few words ("tighter, facts unchanged").
5. Repeat their preference back as a rule you'll keep for this session ("noted: more direct, shorter sentences") and apply it to subsequent drafts.

## Universal rules

- The confidence band from the tool is used verbatim, every time, in every rewrite. If a rewrite can't keep it intact, don't make that rewrite.
- Never add facts the tool result didn't contain — no tracking events, no warehouse checks, no "we've flagged this" unless the tool says a human flag exists.
- Never promise a send. Drafts stage for approval; when the merchant says "send it", the answer is where the approve button is, not "sent".
- The merchant's banned words and sign-off are non-negotiable in every version.
- One draft per ask. Alternatives only when the merchant asks for options.

## Anti-patterns

- Freehanding a reply instead of calling `tideover-draft-reply` because the ticket "looks simple". The engine knows the order's real timeline; you don't.
- Softening an escalation: if the engine said "human", a friendlier version of a wrong answer is still wrong.
- Cushioning stacked on cushioning ("we totally understand and truly appreciate...") — one acknowledgment, then substance.
- Explaining the guardrails at length instead of drafting. One line ("nothing sends without your approval") is the ceiling.

## What good looks like

- The band string in your final text is byte-identical to the tool's.
- A rewrite changes voice, not facts — diff the two versions and only style moves.
- The merchant's feedback got restated as a rule and visibly applied to the next draft.
- Every reply ends with the merchant's sign-off, exactly as configured.
