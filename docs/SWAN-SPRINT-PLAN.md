# SWAN SPRINT — the revamp + the agent

**Goal:** ship a large portion of the Swan-inspired backlog in one sprint: the visual/UX revamp aligned with Dylan's screenshots + transcripts, and a real agent layer (skills, guardrails, live Anthropic API) with a test rig.

**Grounding:** 9-agent mining pass over all raw sources (6 transcripts, verbatim chat, 26 screenshots, 1,169 frames sampled, SKILLSLIST + TOOLS dumps, current-UI inventory). Digest: scratchpad `swan-mining-digest.md`. Synthesis: `docs/swan-teardown/STEAL-THIS.md`.

**Branch:** `sprint/tideover-finalization`. Gate for every phase: `cd tideover && npm run verify && npm test` green. Production only on Dylan's explicit "merge it".

---

## Design direction (the two calls)

**1. Port Swan's patterns, keep Tideover's skin.** Swan's *marketing* site is light + crumpled-paper texture + origami mascot — which is exactly Tideover's existing system (sand `#FBF8F2`, teal `#0E5366`, terracotta `#D9762F`, Fraunces/Inter, PaperTexture/origami components). Only Swan's *app* is dark navy. We do not flip the cockpit dark: it would fight every existing component and the calm/trust brand. Where Swan uses near-black for drama (auth left panel, section-break banners), we use **teal-700 `#0B404F`**. Everything else lands in existing tokens.

**2. The agent is honest by construction.** Swan's magic moment is watching the agent work. Ours does the same — but every fact it shows comes from a real tool call, every band/date in a draft comes from the deterministic reassurance engine verbatim, and a runtime guardrail validator (not a prompt) rejects output that violates proof-only. Nothing sends; the agent can only stage drafts behind ApprovalBar.

### The component grammar we're porting (from screenshots + frames)

| Component | Swan's spec (observed) | Tideover build |
|---|---|---|
| ToolChecklist | vertical timeline, hollow dot = done, filled accent dot = active step, one line per tool call ("Web searched ×3, Page scraped…") | `components/agentic/ToolChecklist.tsx` — slate dots, terracotta active dot |
| ThoughtRow | collapsed "Thought & used N tools ⌄" disclosure above every agent turn; checklist collapses into it when the phase ends | `ThoughtRow.tsx` |
| StreamingText | word-by-word streaming, viewport anchored to newest text; single pulsing dot as pre-first-token loader | `StreamingText.tsx` + `PulseDot.tsx` |
| DecisionCard | bordered card, "1 of 1" header, bold question, numbered options + "+ Other" free text; one question at a time | `DecisionCard.tsx` |
| RecapCard | fixed recap template: ✅ Done · ✅ Every morning · 📬 Where they land · ⚠️ Your one open item · 📈 Week 1 | `RecapCard.tsx` |
| EmptyState | centered icon badge + bold heading + gray sub + 2-up action cards (manual CTA / "✨ agent does it" CTA-as-link); "All caught up" green check when clear | `EmptyState.tsx` |
| ResumeBanner | full-width accent banner on every screen until onboarding 100%: "Your onboarding is still in progress — pick up where you left off →" | `ResumeBanner.tsx` (terracotta) |
| Data-table anatomy | name+desc two-line cell, status pill w/ green dot, icon+type, overflow ⋯ menu | table conventions doc, applied opportunistically |
| Draft-vs-voice typography | agent speech = regular ink; drafted artifact = indented, muted, italic blockquote | inbox + onboarding draft previews |
| Trust refrain | "Nothing sends without your approval" at every send-adjacent moment | copy sweep (DraftRail, ApprovalBar, connect card, recap) |

All primitives are **new files** under `components/agentic/` — zero hot-file risk until Phase 3.

---

## Phase 0 — Agentic component kit + design ADR (foundation)

- **ADR-0023 "Agentic design language":** the table above, token mapping, and the do-not-copy list (no fabricated testimonials/metrics, no business-email gate, no hard dates, no auto-send).
- Build the 9 primitives in `components/agentic/` with a `/dev/agentic` gallery page (dev-only) to eyeball them.
- Done means: verify+tests green, gallery renders every primitive with canned props.

## Phase 1 — Agent core: runner, tools, guardrails, skills, test rig

The engine behind onboarding, inbox triage, and the homepage demo. **Provider: DeepSeek** (Dylan 2026-07-24 — reuse the key already wired for drafting: `LLM_PROVIDER=deepseek` + `LLM_API_KEY`, OpenAI-compatible chat completions with tool calling + streaming, same raw-fetch idiom as `LlmDrafter.ts`, no new deps). The runner keeps the same provider-switch seam `LlmDrafter` has, so Anthropic/others are a config case later, never a rewrite. Guardrail safety is provider-independent by design — enforcement is post-generation and the deterministic engine owns every band.

**`lib/agent/` layout:**
- `runner.ts` — tool-runner loop; emits structured progress events (tool_started/tool_done/text_delta) consumed by SSE route `app/api/agent/stream` → feeds ToolChecklist live.
- `tools/` — `tideover-` prefixed (Swan's `swan-verb-noun` convention): `tideover-scrape-page` (fetch merchant page/FAQ/shipping copy), `tideover-read-orders`, `tideover-read-tickets`, `tideover-draft-reply` (**calls the deterministic engine** — agent never freehands a band), `tideover-update-memory`, `tideover-read-skill`.
- `skills/*.md` — versioned markdown, Swan's spec anatomy: trigger-dense Purpose → numbered Procedure → **Universal rules → Anti-patterns → What good looks like** (triple-redundant guardrails, gradeable by a verifier) + self-editing "Setup state" preamble.
- `guardrails.ts` — **enforced post-generation, not prompted:** proof-lint rules at runtime (no hard dates, no "honest", no invented metrics/citations/testimonials), band phrasing must match engine output verbatim, send capability structurally absent (draft-stage only). Plus `skills/GUARDRAILS.md` — the inspectable "rules your agent follows" surface (trust feature, feeds #9).

**Skills v1 (6):**
1. `diagnose-page` — scrape → real findings readout ("your page promises 8 weeks but has no update cadence — the #1 chargeback trigger").
2. `draft-reassurance` — wraps engine + merchant voice rules; records "too soft → more direct" feedback as a **standing voice rule** (durable state, Swan pattern A).
3. `triage-inbox` — Clear-my-desk analog, fixed buckets: act-now / approve-batch / acknowledge / investigate.
4. `health-check` — Audit-Swan analog: missing proof sources, disconnected ingest, backers past ETA with no update queued, wait-clock anomalies.
5. `import-backers` — conversational CSV mapping (help-me-import; pairs with the known import reliability fix).
6. `skillify` — meta-skill: promote a successful ad-hoc run into a new skill file (trigger/procedure/judgment/outcome).

**Test rig:** `scripts/agent-repl.mjs` — run any skill against the 5 seeded personas from the terminal, streaming the checklist; records fixtures. Guardrail unit tests run offline (recorded fixtures + validator); live-API tests behind `ANTHROPIC_API_KEY` presence.

- Done means: repl streams a real `diagnose-page` run end-to-end; guardrail tests green offline; verify+tests green.
- **No Dylan unlock needed** — the existing DeepSeek key covers live runs (deepseek-chat is ~$0.28/$0.42 per MTok; an onboarding research run costs cents). Pricing/credits model stays a later Dylan call.

## Phase 2 — Onboarding revamp (the aha)

Backlog #1 #2 #3 #4 #10 + recap E + never-dead-end C. New files (`app/onboarding/*`) — not hot.

Flow: **one field** (store/campaign URL) → live research screen (ToolChecklist streaming real steps: "Read your product page ✓ · Found your stated ship window ✓ · Pulled your refund policy ✓") → **readout card** (real diagnosis of *their* gap) → chat-driven config, one DecisionCard at a time (voice, stages, gifts — pre-filled from scrape, merchant corrects instead of typing) → **drafts before connect**: 2–3 sample replies against imported/sample tickets → connect card lands only after a draft they like ("to actually send these I need your channel — nothing sends without you hitting approve") → RecapCard close (✅✅📬⚠️📈).

- Deterministic wizard stays as the fallback path — connect/import failure or missing API key degrades to the current flow, never a dead screen (pattern C).
- Signup hardening: email verification code yes (Auth0 config), password checklist (Auth0 feature), **no business-email gate** (kills our ICP — decided).
- Auth screens: split-panel in Tideover tokens — teal-700 left panel (form), right rail = product visual/origami motif (no fabricated testimonials; real quotes swap in when they exist).
- Done means: full onboarding runnable with live agent AND with agent disabled; verify+tests green.

## Phase 3 — Cockpit alignment (hot files — one change in flight at a time)

Backlog #5 #6 #7/#14 #9 #11. Strict serialization on `app/app/page.tsx`, `app/app/inbox/page.tsx`, `DraftRail.tsx`, `ApprovalBar.tsx`.

1. ResumeBanner global in `app/app/layout.tsx`, driven by setup-status completeness (voice · stages · backers · channel · first approved reply); dismisses only at 100%.
2. Empty-state pass, one file at a time: dashboard → inbox ("All caught up" + green check; "Import your backers / Connect your store" 2-up cards) → status list. No sample metrics anywhere.
3. Approval-refrain copy sweep: DraftRail, ApprovalBar ("Each morning, approve a handful of reassurance replies. That's the job."), connect card, recap.
4. **`/app/memory` — "What Tideover knows about your preorder":** editable doc (voice, stages, ship windows, proof sources, refund policy) + version history rail (author, timestamp, one-line changelog — Swan's exact pattern) + the inspectable guardrails section. New page — parallel-safe.
5. Health-check surface on `/app/setup` fed by the `health-check` skill (deterministic fallback checks when no API key).
- Done means: verify+tests green after EACH hot-file change, not just at phase end.

## Phase 4 — Homepage: the agentic product moment

Dylan's words: the single biggest overhaul needed to be publicly launchable is "some kind of agentic conversational style animation" as a featured product moment.

1. **Hero demo moment:** scripted replay (no live API on the marketing page) of the real thing — ToolChecklist + streaming draft against the demo merchant's clearly-labeled sample data. Reuses Phase 0/1 components; frame-stepped like Swan's 3-beat animation.
2. Origami-framed **demo-video slot** (FoldCard treatment) — ready for Dylan's recording.
3. **Logo wall** of platforms we actually ingest/serve (Kickstarter, Indiegogo, Gamefound, Shopify, WooCommerce, Gorgias, Zendesk, Stripe…) — real integrations only.
4. Positioning one-liner slot ("____ for presale support") + before/after module in fold-frame.
5. Reviews-as-paper-cards animation: **deferred** until real quotes exist (no fabricated social proof).
- Done means: verify+tests green; homepage demo runs from canned fixture data with a visible SAMPLE DATA label.

---

## Backlog coverage (18-feature table in HQ)

**Shipping this sprint:** #1 one-field start · #2 visible checklist · #3 real-finding readout · #4 delayed connect ask · #5 no-fake-data empty states · #6 resume banner · #7 approval-gate reframe · #9 memory doc + versions · #10 help-me-import · #11 health check · #12 positioning line · #14 trust refrain · #15 never-dead-end · A voice dial (standing voice rules) · B refrain drumbeat · C graceful degradation · E recap template · bonus: inspectable guardrails.

**Deferred (with reason):** #8 testimonials (need real quotes), D consultative pushback (lands naturally inside skills; dedicated pass later), Tools marketplace page (curate ~10 CS tools later), Slack copilot / Chrome-extension overlay (parking lot), small automations/triggers surface (crons exist; UI later), credit-pricing model (Dylan call, post-sprint).

## Execution order + risk

P0 → P1 → P2 → P3 → P4. P0/P1 parallelizable internally; P3 strictly serialized (hot files). Anything ambiguous in auth/billing/engine territory stops and surfaces — no improvising (charter).

**Dylan's items:**
1. ~~ANTHROPIC_API_KEY~~ **Resolved 2026-07-24: the agent runs on the existing DeepSeek key** (`LLM_PROVIDER`/`LLM_API_KEY`, already in .env.local + Vercel). Nothing to do.
2. Record the homepage demo video (P4 slot will be waiting).
3. "Merge it" calls per deploy.
4. Optional: pick the positioning one-liner.
