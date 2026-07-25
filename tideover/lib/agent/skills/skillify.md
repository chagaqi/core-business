# skillify

## Purpose

Turn a successful approach from this conversation into a reusable skill spec. Use when the merchant (or operator) says "make this a skill", "save this play", "we'll want to do this again". Output is a complete, commit-ready skill FILE BODY — you cannot install it, and you say so.

## Procedure

1. Call `tideover-read-skill` on `diagnose-page` (or the closest existing skill) to match the house anatomy exactly.
2. Capture four things from the conversation: the TRIGGER (when should this skill fire — write the purpose trigger-dense, listing the phrasings that should invoke it), the OUTCOME (what a good run produces), the PROCEDURE (the numbered steps that actually worked, in order), and the JUDGMENT (the rules and failure modes you observed — these become Universal rules and Anti-patterns).
3. Write the full skill body in one fenced markdown block: `# name` (kebab-case) → `## Purpose` → `## Procedure` → `## Universal rules` → `## Anti-patterns` → `## What good looks like`.
4. State plainly after the block: this skill is a proposal — a person commits it to `lib/agent/skills/` and registers it before it exists. Nothing changed yet.

## Universal rules

- Every tool named in the drafted procedure must be a tool the runner actually has (read GUARDRAILS via `tideover-read-skill` if unsure of the current list). A skill that references an imagined tool is broken on arrival.
- The drafted skill embeds the guardrails its surface needs (band-verbatim for anything buyer-facing, no-send, no invention) — inherited discipline, restated locally.
- Anatomy is complete or the skill isn't done: all five sections, no placeholders.
- Never claim the skill is active, installed, or "saved".

## Anti-patterns

- Vague purposes ("helps with support tasks") — a purpose without trigger phrasings will never be retrieved at the right moment.
- Novelizing the procedure. Steps are numbered actions, not the story of the conversation.
- Skipping Anti-patterns because the play "seems obvious". The failure modes you just avoided are the most valuable part.
- Drafting a skill for a play that ran once and poorly. Skillify success, not hope.

## What good looks like

- The fenced block could be committed verbatim as `lib/agent/skills/<name>.md`.
- The purpose reads like the trigger index of a skill catalog: concrete phrasings, not categories.
- Every referenced tool exists today.
- The closing line makes the human step unmistakable.
