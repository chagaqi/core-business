# ADR-0017 — Split the real SaaS onto `app.tideover.app`, keep the demo separate

**Date:** 2026-07-07 · **Status:** accepted · **Task:** DR1 / (subdomain split, Dylan 2026-07-06)

## Context

Today one deployment serves both jobs and they are in tension:
- The **demo** (`www.tideover.app/app`) must stay open and pretty on **seed data** so Dylan can show it to anyone.
- The **real product** must run with **auth on**, real merchant data, and real metrics — and the data-provenance audit (`docs/DATA-PROVENANCE-HANDOFF.md`) shows those two data worlds must not mix.

The current control for this is a single env var read fail-open: `if (DEMO_MODE !== "false") allow` (`middleware.ts:15`, `lib/auth.ts:16`). Any mistype serves real PII unauthenticated (ENG-01/PR-05), and `DATA_DRIVER` is chosen independently, so "real Mongo + demo auth-off" is a one-keystroke mistake. There is also no tenant isolation (ENG-14): one shared password reaches every merchant, so real merchants cannot safely share a datastore with the demo seed. Builds on ADR-0001 (app architecture), ADR-0002/0003 (repository seam), ADR-0004 (auth).

## Decision

1. **Mode is derived from the request host, not a bare env flag.** A single helper `resolveMode(host)` in `lib/mode.ts` returns `"real"` when the host is `app.tideover.app` (configurable via `REAL_APP_HOST`), else `"demo"`. `middleware.ts`, `lib/auth.ts`, and the repository selector all read `resolveMode()` instead of `DEMO_MODE`. This makes real-mode a **specific domain**, which cannot be reached by mistyping an env var — closing the fail-open hole structurally (supersedes the `DEMO_MODE !== "false"` gate; keep `DEMO_MODE` honored as an override for local dev only).
2. **Two data worlds, never mixed.** Demo mode reads the **json/seed driver** (or a read-only demo Mongo DB). Real mode reads the **mongo driver against a dedicated live database** (`MONGODB_DB=tideover_live`, distinct from the demo seed DB). The repository selector (`lib/repositories/index.ts`) picks driver + DB from `resolveMode()`. A real merchant's data therefore lives in a separate database from the demo seed — no demo record is ever reachable from the real app and vice-versa.
3. **Auth is on in real mode, off in demo.** `middleware.ts` gates `/app/*` + operator APIs only when `resolveMode()==="real"`; demo stays open. (Per-merchant tenancy — session→merchantId binding, ENG-14 — is a separate ADR, still required before a *second* real merchant; until then real mode is single-merchant.)
4. **One codebase, one Vercel project, two domains.** No second deployment. `app.tideover.app` and `www./demo.` point at the same build; the host header does the rest. This keeps the demo and the real app on identical code so a fix ships to both at once.
5. **Boot/asserts:** a startup assertion refuses to serve if real-mode config is incoherent (real host configured but no live `MONGODB_URI`/`MONGODB_DB`), and the release smoke check (`scripts/smoke.mjs`) curls an operator route on `app.tideover.app` and asserts **401** (today it only checks public 200s).

Engine/seed/eval impact: **none.** This is a host-routing + datastore-selection change; it does not touch `lib/engines/*` or the seed shape, so the eval harness (ADR-0006) and seed-check stay green. `gen-seed`/the demo continue to target the demo DB.

## Proof-only guardrails

The demo keeps its `SAMPLE DATA` watermark (real mode does not render it). No customer-facing metric changes; this ADR only decides *where* data lives and *which* auth applies. Real-mode metrics become truthful only in combination with the DR1 data-truth fixes — this ADR does not itself claim any proof.

## What Dylan must do (access-gated — Vercel + DNS)

1. In Vercel → the Tideover project → **Domains**, add `app.tideover.app`.
2. At the DNS provider, add the **CNAME** Vercel shows (`app` → `cname.vercel-dns.com`), or the A/ALIAS Vercel specifies.
3. In Vercel **Environment Variables** (Production), set for the real app: `REAL_APP_HOST=app.tideover.app`, `MONGODB_URI=<live cluster>`, `MONGODB_DB=tideover_live`, `DATA_DRIVER=mongo`, `DEMO_MODE=false`, plus the secrets (`AUTH_SECRET`, `APP_PASSWORD`, `WEBHOOK_ROOT_SECRET`, `CRON_SECRET`, `STATUS_TOKEN_SECRET`) per `docs/PILOT-READINESS-HANDOFF.md`.
4. Keep `www.tideover.app` pointing demo config (seed data, no live DB required).

## Consequences

- Closes the fail-open auth hole and cleanly isolates real vs demo data — the two biggest pilot blockers on the infra side.
- The live demo Dylan shows people is untouched by real-merchant activity, and vice-versa; a bad import in real mode can never pollute the demo.
- Adds a small routing layer every request reads (host → mode); cheap, but it becomes load-bearing, so it needs a test.
- A second real merchant still requires the tenancy ADR (ENG-14) before they can share `tideover_live`.

## Alternatives rejected

- **Keep the single `DEMO_MODE` env flag.** Fail-open by construction; a mistype exposes PII. Rejected — the whole point is to make mode structural.
- **Two separate Vercel deployments/projects.** Doubles deploy surface and lets the demo and real app drift to different code. Rejected — one build, host-routed, keeps them in lockstep.
- **One database with an `isDemo` flag on every record.** One missed filter leaks demo rows into real views (or worse, real PII into the demo). Rejected — physical DB separation is the safe default pre-tenancy.

## Kill-criteria

If host-based routing proves flaky on Vercel (edge/host header edge cases) or the single-DB-per-mode model blocks a needed demo-of-real-data feature, revisit — most likely by promoting to per-merchant tenancy (ENG-14) sooner rather than by merging the datastores.
