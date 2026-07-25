# ADR-0023 — Agentic design language: port Swan's patterns, keep Tideover's skin

**Date:** 2026-07-24 · **Status:** accepted · **Task:** SW0 (SWAN SPRINT — docs/SWAN-SPRINT-PLAN.md)

## Context

The Swan teardown (docs/swan-teardown/, mined exhaustively 2026-07-24) shows why getSwan converts: the user *watches the agent work* — a streaming tool-use checklist, collapsed "Thought & used N tools" rows, one question at a time, empty states that refuse fake data, and a persistent resume-onboarding banner. Dylan wants Tideover's pages "more like it," plus a real agent layer behind them. Two tensions force a decision: (1) Swan's app is a dark navy HUD while Tideover's system (ADR-built sand/teal/terracotta, Fraunces/Inter, paper/origami motif) is deliberately warm and light; (2) Swan's streaming UI *implies* live agent work, and on our doctrine (ADR-0002) implying work that didn't happen is fabrication.

## Decision

1. **Patterns, not palette.** We port Swan's interaction grammar into Tideover's existing tokens. The cockpit stays light (sand/paper). Where Swan uses near-black for drama — the auth split-panel, section-break banners — we use `teal-700 #0B404F`. No dark-mode rebuild. (Swan's own *marketing* site is light + crumpled-paper + origami; our chassis already matches it.)
2. **One component kit, `tideover/components/agentic/`** — the only place agentic UI lives; product surfaces compose these, never re-implement them:
   - `ToolChecklist` — vertical timeline of tool steps. Dot grammar (from the frame analysis): **muted dot = done, terracotta pulsing dot = active, hollow dot = pending.**
   - `ThoughtRow` — native `<details>` disclosure, "Thought & used N tools ⌄"; a finished checklist collapses into it.
   - `StreamingText` + `PulseDot` — streamed text with caret; single pulsing dot as the pre-first-token state. Typewriter mode exists for *scripted* replays only.
   - `DecisionCard` — bordered card, "n of N" header, bold question, numbered options + "+ Other". One question at a time is the rule, enforced by usage not props.
   - `RecapCard` — the fixed close template: ✅ done · ✅ every morning · 📬 where things land · ⚠️ the one open item (named honestly) · 📈 week 1.
   - `EmptyState` / `AllCaughtUp` — centered icon badge + heading + sub + a 2-up action-card row (manual path / agent path). Zero sample metrics, ever.
   - `ResumeBanner` — full-width `terracotta-700` bar shown until onboarding completeness = 100%.
   - `ChatTurn` / `DraftArtifact` — agent speech is regular ink text; **drafted artifacts are indented, muted, italic** — the typographic line between "the agent talking" and "the thing the agent wrote."
3. **Motion rules.** `Reveal` stays the only *scroll* motion wrapper (its own doc comment). Agentic components use micro-motion only: Tailwind `animate-pulse` for active/caret states, CSS transitions for disclosure. Typewriter and pulse honor `prefers-reduced-motion` (render final state, no animation). No new framer-motion surfaces.
4. **Dev gallery** at `/dev/agentic` (404s in production) renders every primitive with canned props — the visual contract for the sprint.

## Proof-only guardrails

A checklist line rendered in the product must correspond to a **real tool event** from the agent runner (SW1) — never a scripted sequence presented as live. Scripted replays are allowed only on marketing surfaces, driven by clearly-labeled demo/sample data (SAMPLE DATA watermark rule). No fabricated testimonials in any rail; the auth right-rail carries product visuals until real, attributed quotes exist. Empty states never show sample charts or invented numbers.

## Consequences

Onboarding (SW4), cockpit (SW6–SW10), and the homepage demo (SW11) all compose one kit, so the "agentic feel" stays consistent and a styling fix lands once. The kit is new-file-only — no hot-file risk until Phase 3 wires it into `app/app/*`. Adding a dark cockpit later would mean retokenizing the kit, which is the cost of decision 1 and accepted.

## Alternatives rejected

- **Flip the cockpit dark to match Swan's app** — fights every existing component, abandons the calm/trust brand, and Swan's conversion moments (checklist, empty states, banner) don't depend on darkness.
- **framer-motion for streaming/checklist animation** — per-token JS animation is heavier and fights the repo's Reveal-only motion doctrine; CSS pulse + re-render on stream events is enough.
- **Bespoke per-page empty states** — Swan's strength is the *repeated* template; the frame analysis shows one identical layout across Desk/Accounts/Analytics/Sequences. Divergence is the failure mode.

## Kill-criteria

If merchant testing shows the light cockpit reads as "not AI-native" even with the full pattern kit live (the specific fear behind "make it look like Swan"), revisit decision 1 deliberately — starting with the onboarding surface only, never a big-bang retheme.
