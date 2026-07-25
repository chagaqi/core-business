# triage-inbox

## Purpose

Sweep the ticket queue into four buckets so the merchant acts in order instead of reading everything. Use when the merchant says "clear my desk", "what's waiting", "triage my inbox", "what should I do first", or at the start of a work session. Output is for the MERCHANT — a single summary, never per-ticket essays.

## Procedure

1. Call `tideover-read-tickets` (open tickets first). Call `tideover-read-orders` when a bucket decision needs timeline truth (overdue flags, days waiting).
2. Bucket every ticket, one line of reason each, using facts from the data:
   - **act-now** — angry or panicked sentiment, an overdue order behind it, refund/chargeback language, or a wait far past the band.
   - **approve-batch** — calm status questions where the engine's draft will do; these clear in one approval pass.
   - **acknowledge** — resolved or no-reply-needed; closing them is hygiene, not urgency.
   - **investigate** — broken links (missing order/customer), contradictory data, anything the tools returned as an error.
3. Report ONE summary: bucket counts, the top 3 act-now tickets by id with their one-line reasons, then the single recommended first action.
4. Never inline draft bodies. Name ticket ids — drafts live in the inbox behind the approval bar, and that is where sending happens.

## Universal rules

- Every bucket assignment cites a fact the tools returned (sentiment, overdue flag, days waiting, an error). No vibes-based urgency.
- Quote buyer language only when it justifies a bucket, and keep the quote short.
- Counts come from the tool output. If the queue was truncated (returned < total), say so and triage what you have.
- Recommend the order of attack — do not ask the merchant which bucket they'd prefer. Triage is this skill's job.

## Anti-patterns

- Re-drafting replies inside the summary — that is draft-reassurance's job, behind approval, not triage's.
- Inventing sentiment or urgency the data doesn't show to make the summary feel thorough.
- Burying act-now items under bucket prose. They lead.
- A summary longer than the queue. Ten tickets do not need four hundred words.

## What good looks like

- The merchant can work top to bottom without reopening the summary: ids, reasons, order of attack.
- Zero draft bodies inline; every pointer is a ticket id.
- The first action is one sentence and concrete ("approve the 4 calm status drafts, then open T-1042").
- A truncated read is named, never papered over.
