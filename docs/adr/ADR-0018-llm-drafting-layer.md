# ADR-0018 — LLM drafting layer: per-tenant context, shared stateless model, deterministic floor

**Date:** 2026-07-09 · **Status:** accepted · provider decided (DeepSeek, Dylan 2026-07-09) · **Task:** AI1

## Context

Dylan's directive: "we want this to be actually ai powered not some fake ai stuff" — and his questions were exactly the ones that sink early SaaS margins: do we train a model? spawn an agent per user? run DeepSeek V3 for cost?

Today every reply is drafted by the DeterministicDrafter (stage-aware template engine, ADR-0006-evaled). The seam for a model already exists: `lib/drafting/LlmDrafter.ts` implements `ReplyDrafter`, env-gated on `LLM_PROVIDER + LLM_API_KEY`, selected in `getDrafter()`, consumed by `lib/service.ts`. Nothing else in the product knows which drafter ran. What forces the decision now is wiring it for real without (a) per-merchant infrastructure that can't be paid for at $199/mo, (b) a provider whose data posture contradicts our own /security page, or (c) losing the eval harness as the safety floor.

## Decision

1. **No training, no fine-tuning, no per-user agents.** "The agent learns your brand" is implemented as **per-tenant context, not per-tenant weights**: every merchant already has a brand/voice/timeline profile from onboarding (intake + gifts + product stages). Drafting = one stateless API call per ticket with that profile assembled into the system prompt. This is how production support-AI companies actually engineer it; a "spawned agent per user" is a prompt, not a process.
2. **Model class: Haiku-tier** (small, fast, cheap — `claude-haiku-4-5` class). Drafting a reassurance reply is a constrained rewrite task, not deep reasoning. At ~2k in / ~300 out per draft and pilot volume (≤50 tickets/mo/merchant), model cost is **well under $1/mo per merchant** — margin-irrelevant at every rung of the ladder. Prompt caching applies to the static system-prompt prefix (tenant profile), cutting input cost further (~0.1× on cached reads).
3. **Provider: first-party API from a US/EU-hostable vendor; NOT DeepSeek's first-party API.** DeepSeek V3 weights are fine engineering, but the first-party API is China-hosted inference — merchant support emails (customer names, addresses, order details) would transit infrastructure we cannot defend on the /security and /procurement pages we sell with. If Dylan wants DeepSeek-class economics later, the acceptable route is a US-hosted serving vendor of open weights. Default recommendation: Anthropic Haiku-tier. **Final provider pick + API key = Dylan's call (money/account); everything below is provider-agnostic.**

   **Decision taken (Dylan, 2026-07-09): DeepSeek first-party API**, overriding the recommendation above. `LLM_PROVIDER=deepseek`, `LLM_MODEL=deepseek-chat`, OpenAI-compatible chat-completions endpoint. Condition of the override: the /security page ships a plain subprocessor disclosure with it — ticket text is processed by Hangzhou DeepSeek AI on servers in the PRC, drafts remain human-approved, deterministic floor and QA gate unchanged. The provider switch in `LlmDrafter` keeps an "anthropic" (or other) adapter a one-case addition if this call is revisited.
4. **Prompt assembly lives server-side in `LlmDrafter.draft()`**: system = tenant profile (brand voice, product, real timeline, stage definitions, confidence-band rules, banned-claims list) + the proof-only contract; user = the ticket. Temperature low. Output = draft body only.
5. **The deterministic engine is the floor, not the fallback of last resort.** Three hard rules:
   a. `LlmDrafter` errors/timeouts → serve the DeterministicDrafter draft (already the seam's behavior — keep it).
   b. Every LLM draft passes the **reply-QA gate (ADR-0014)** before it reaches the rail: hard-date lint, banned-claims lint, confidence-band presence. A draft that fails QA is replaced by the deterministic draft, and the failure is logged.
   c. **Human approval stays mandatory** (ApprovalBar). The LLM changes draft quality, never the trust model.
6. **Eval stays authoritative.** The 57,614-invariant + golden harness (ADR-0006) runs on the deterministic engine and is untouched. LLM output is gated per-draft by QA-lint (5b) rather than by the offline harness; goldens continue to pin the floor the merchant is never allowed to fall below.
7. **Env contract** (documented in `.env.example` when wired): `LLM_PROVIDER`, `LLM_API_KEY`, `LLM_MODEL`. Unset = deterministic-only, which remains the shipped demo posture. Keys live only in `.env.local`/Vercel env, never in the repo.

## Proof-only guardrails

The model is instructed with, and QA-linted against, the same doctrine as the engine: no hard delivery dates (confidence bands only), no invented order facts, no fabricated empathy claims ("I checked with the warehouse" when nothing checked), no "honest". Marketing may say "AI-drafted, human-approved" only once this ADR is wired and a real model produced real drafts — not before.

## Consequences

- Easier: onboarding autofill (site-analyze), reply drafting, and future summarization all share one provider account + one env contract.
- Easier: per-tenant profile assembly is reusable by any future model call (WISMO explanations, gift-note drafting).
- Harder: QA-lint becomes load-bearing for anything the model writes — it must be maintained as strictly as the eval harness.
- Cost model is linear in tickets, near-zero fixed: no GPU, no vector store, no per-tenant infra to babysit.

## Alternatives rejected

- **Fine-tune / train per merchant:** weeks of ops, data-hunger our pilot volume can't feed, and marginal quality vs. a good tenant profile in context. Wrong tool below ~10⁵ examples.
- **Persistent per-user agents:** stateful processes to host, monitor, and bill for, delivering nothing a stateless call with the same context doesn't. This is architecture theater.
- **DeepSeek first-party API:** cost is attractive; data posture is disqualifying while we sell to merchants on a security page (see 3).
- **LLM with no deterministic floor:** one hallucinated hard date to an angry backer is a chargeback and a churned pilot. The engine + QA gate is the product's spine; the model is upside.

## Kill-criteria

If, after wiring, ≥20% of LLM drafts fail QA-lint or operators consistently prefer deterministic drafts in the approval rail, stop paying for the model and revisit prompt/provider rather than degrade output.
