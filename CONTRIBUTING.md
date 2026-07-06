# Contributing to Tideover

The single entry point for working on this codebase. It ties together the docs that already exist rather than repeating them.

> **Agents:** the multi-model orchestration + token-discipline charter that governs *how* work is delegated and moved is [`CLAUDE.md`](CLAUDE.md) (auto-loaded each session). This file is the human/repo-specifics companion to it.

## What this is

Tideover is presale-support software for Shopify merchants with 60–120 day fulfillment waits. One Next.js 14 app (`tideover/`) — marketing + operator app + API — on Vercel, backed by MongoDB Atlas. Start with **[docs/adr/ADR-0001](docs/adr/ADR-0001-app-architecture.md)** (the shape) and **[ADR-0002](docs/adr/ADR-0002-repository-seam-and-proof-doctrine.md)** (the two disciplines everything else assumes). The full decision log is **[docs/adr/README.md](docs/adr/README.md)**.

## Setup

```
cd tideover
npm install
npm run dev          # http://localhost:3000 on the seeded JSON demo data
```

No database or API key is needed to run — the app ships on deterministic engines + seeded JSON behind a repository seam (ADR-0001). To point at Mongo, set `MONGODB_URI` in `tideover/.env.local` and `DATA_DRIVER=mongo` (see `.env.example`).

## The two disciplines (non-negotiable)

1. **Proof-only** (ADR-0002): never a fabricated metric, testimonial, or result; confidence bands, never hard dates; `[CASE STUDY PLACEHOLDER]` literal; demo surfaces watermarked. `proof-lint` + the eval harness fail the build on a violation — the doctrine is enforced, not just intended.
2. **The repository seam** (ADR-0002/0003): nothing reads JSON or Mongo directly; everything goes through `lib/repositories`. A schema change migrates `gen-seed.mjs` + `seed-check.mjs` in the same commit.

## Definition of done (the gate)

Every change must pass, before push:

```
cd tideover && npm run verify && npm test
```

`verify` = seed-check → proof-lint → **eval (52,440 invariant assertions + 55 golden fixtures)** → lint → build. This is exactly what CI (`.github/workflows/ci.yml`, Node 22) runs. The eval harness (ADR-0006) gates every engine change: the invariant sweep is authoritative; golden fixtures are review-gated — if engine output legitimately changes, run `npm run gen-goldens` and confirm the diff is real.

## Rules that keep the codebase safe

- **Hot-file serialization:** only one in-flight change may touch `app/app/inbox/page.tsx`, `DraftRail.tsx`, `ApprovalBar.tsx`, `app/app/page.tsx`, or `lib/engines/reassurance.ts` at a time — they're the load-bearing cockpit/engine surfaces.
- **ADR first** for a new dependency, engine change, integration, or pricing/data-exposure decision (`docs/adr/`, use `TEMPLATE.md`).
- **Testable core, thin route:** a Next route imports `next/server`, which breaks the node test runner — put logic in a `lib/*.ts` and keep `route.ts` a thin wrapper (see `lib/health.ts` / `api/health`).
- **Never commit secrets:** `.env*.local` is git-ignored; live credentials belong only in Vercel + local env. `npm run backup` output (`backups/`) is git-ignored — it holds merchant data.
- **Branch model:** work on a feature branch; PRs into `main` are approved merges only, never a direct push to `main`.

## Shipping

Release ritual (verify → merge → deploy → smoke → changelog): **[tideover/RELEASE.md](tideover/RELEASE.md)**. Ops: **[docs/ops-backup.md](docs/ops-backup.md)** (backup/restore), the uptime section of RELEASE.md (health monitoring). Labels + issue conventions: **[.github/labels.md](.github/labels.md)**.

## Out of scope

The standing **cut list** (things deliberately not built, and why) lives in `docs/TIDEOVER-SPRINT-PLAN.md`. Don't start one without revisiting that decision.
