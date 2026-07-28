# Pre-merge adversarial review — SWAN sprint (2026-07-27)

A 55-agent workflow (5 hostile Opus reviewers over the sprint's 44 changed files, every finding double-verified by an independent refute agent + a trace agent; only findings both verifiers failed to refute are listed). **20 confirmed, all fixed before merge, gate green.** Refuted findings were duplicates of confirmed ones scored differently — nothing real was dropped.

## P1 — would have been a production hole

| # | Where | Defect | Fix |
|---|---|---|---|
| 1 | `api/agent/stream/route.ts` | The agent + its outbound-fetch tool ran **fully unauthenticated** on demo/`*.vercel.app` hosts and in password mode (middleware skips demo hosts; the route only gated on `real+auth0`). Unmetered LLM billing drain + anonymous SSRF primitive. | Session **required in every mode** → 503 (graceful manual-branch fallback) when absent; route added to the middleware matcher; `maxDuration=60`; `req.signal` wired so a disconnect stops the run; 16KB body cap read before parse. |
| 2 | `app/app/layout.tsx` → `lib/service.ts` | `getSetupChecklist` did **one `statusViews.listByOrder` per order** — an unbounded N+1 now on **every `/app` render** (the ResumeBanner). | Switched to the merchant-wide `statusViews.listByMerchant` index — one query. |
| 3 | `onboarding/flow/OnboardingFlow.tsx` recap | Reported the **client staged row count** as "backers imported", discarding the server's real `ImportResult` (dedup, dateless rows, partial `failedAtChunk`). | Recap now reads `result.imported.ordersCreated`. |
| 4 | `onboarding/flow/OnboardingFlow.tsx` | Hardcoded `helpdesk: "gorgias"` for **every** flow-onboarded merchant, with no settings UI to change it. | Defaults to `"email"` (the universal ADR-0008 forward path); the connect beat wires the real helpdesk. |
| 5 | `api/agent/stream/route.ts` | No `maxDuration` — Vercel kills the function mid-stream (a run makes multiple provider calls). | `export const maxDuration = 60` + a 55s runner wall-clock deadline. |

## P2 — real bugs, bounded

- **Guardrail doctrine, now enforced (was only claimed):** `GUARDRAILS.md` rule 4 ("band stays verbatim") and rule 6 ("capability lint applies to agent output") had no enforcement. Added `foreignBandIn` (digit-sequence compare — rejects a rewritten/invented confidence band, both audiences) and ran `capabilityCommitment` on the merchant path (rejects "I've updated the address" claims to the merchant too).
- **Streaming before guard:** customer-audience tokens were streamed to the client before `guardAgentText` ran. Merchant skills (the onboarding research beat) still stream live; customer skills now buffer and emit only the guarded final.
- **Prompt injection:** scraped third-party HTML was returned to the model as fact. Now wrapped in an `untrusted_page_content` marker the system prompt tells the model to treat as data, never instructions.
- **Unbounded inputs → RangeError after persist:** `windowMinDays`/`windowMaxDays` were unbounded `z.number()` reaching Date math; a huge value threw *after* the merchant was saved (half-built workspace). Now `int().min().max()` + a `max > min` refine.
- **Unbounded brand name:** a hostile 1.9MB `<title>` became the merchant name and was replayed into every provider request. Capped at 120 chars on every path.
- **Tool success mis-inferred:** `output.startsWith('{"error"')` reported a blocked-Kickstarter scrape (`{ok:false}`) as `tool_done{ok:true}`. Now parses and checks `error`/`ok:false`.
- **No unmount abort:** navigating away mid-research left the fetch reader, the flush timer, and the server run alive. `useAgentStream` now aborts on unmount (which, via `req.signal`, stops the server run too).
- **No run deadline / no disconnect abort:** one request could hold a worker ~7 min across turns + fetches; a hung-up caller kept paying provider spend. 55s deadline + per-call timeout clamp + `req.signal` threaded to the provider fetch.
- **Gift beat false binary:** the "use suggested ladder / decide later" choice did nothing (the server always builds the ladder). Made an honest single acknowledgment.
- **Setup health false statement:** the panel said "past every planned band" but counted `overdue` = "past the promised window". Copy corrected to match the real meaning.
- **Body caps** added to `/api/onboarding/preview` (64KB) and `/api/analyze` (8KB).

## Tests added

7 new: band-verbatim enforced (both audiences) + exact-band passes, merchant-capability rejection, plus the earlier maxCalls-ceiling and registry-integrity tests. Full gate green throughout.

## Deliberately not changed

- `clientIp` leftmost-XFF (a verifier refuted the bypass claim; the rate limiter is explicitly "not a security boundary" and the real control is the new session requirement).
- The setup page loads orders a second time (`getSetupChecklist` already loaded them internally) — P2, and the setup page is not a hot path; the layout N+1 (the real cost) is fixed.
