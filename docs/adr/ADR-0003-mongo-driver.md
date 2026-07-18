# ADR-0003 — MongoDB via the official driver, behind the existing Repositories seam

**Date:** 2026-07-03 · **Status:** accepted · **Task:** F1

## Context

The JSON driver is an in-memory cache seeded from `lib/data/*.json`; on Vercel serverless every write evaporates on cold start and diverges across lambda instances. Half the sprint (outcome ledger, live ingest, CSAT, update feed, checklist) writes data and is unbuildable without durable storage. Atlas M0 cluster `tideovermvp` is live (user has $500 startup credits on standby); URI is in `.env.local` + Vercel prod env. The `Repositories` interface (`lib/repositories/types.ts`) was designed for exactly this swap — no call sites read JSON directly.

## Options

1. **Official `mongodb` driver, no ODM** — thin, zod already owns validation, matches the existing repo-interface shape. Standard globalThis connection caching handles serverless.
2. **Mongoose** — ODM schema layer is redundant with zod + `lib/types.ts`, adds magic (casting, middleware) that can silently diverge from the JSON driver's semantics.
3. **Prisma** — schema engine + heavier cold starts; Mongo support is its weakest path; overkill for ~8 collections.
4. **Stay JSON + Vercel KV** — KV is key-value; the cockpit needs filtered/sorted document queries. Doesn't fit.

## Decision

Option 1. Rules:
- Documents stored exactly as the domain objects (ISO-date strings, prefixed-nanoid `id` field). Mongo `_id` stays an ObjectId and is stripped on read (`projection: {_id: 0}`); unique index on `id` per collection. No `_id`↔`id` mapping = no round-trip bugs.
- `DATA_DRIVER=mongo` selects the driver; JSON stays the default for dev/demo parity.
- Semantics must match the JSON driver 1:1 — engines, services, and API routes change zero lines.
- `Merchant.isDemo` flag added in the same change: demo merchants' events must never pollute real stats (proof-only).
- Seed import (`scripts/seed-mongo.mjs`) is idempotent (upsert by `id`) and refuses a non-empty DB without `--force`.

## Kill-criteria

If M0 latency makes the cockpit sluggish (sustained >500ms per page query), upgrade the cluster with the startup credits; if the seam forces >1 semantic divergence between drivers, stop and redesign the interface instead of patching.
