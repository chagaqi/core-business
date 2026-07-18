# ADR-0005 — disclosed-ETA + status-view logging + campaign/wave labels

**Date:** 2026-07-03 · **Status:** accepted · **Task:** M1 (unblocks M2 Evidence Pack, M3 dispute-window tile)

## Context

The Evidence Pack and the "GMV in open dispute window" tile need data the model doesn't capture yet: (a) the delivery estimate disclosed to the buyer at purchase — the legal trigger for the Visa 13.1 window (120 days from *expected delivery*, not sale); (b) a log of when the customer viewed their status page (dispute evidence: "notified on X, viewed on Y"); (c) native crowdfunding vocabulary (campaign/wave) so the product reads native to the ICP. Must not break the seeded demo or the proof-only doctrine.

## Decision

1. **`Order.disclosedEta`** — optional `{ value: string /* human band, e.g. "weeks 9–11" */, source: 'campaign-page'|'checkout'|'update', disclosedAt: string /* ISO */ }`. Distinct from the internal fulfillment window. Drives both the customer-facing band and the dispute-window computation. Optional → existing call sites unaffected; seed populates it for realism.
2. **Campaign/wave as label strings, NOT entities** (per the sprint cut list — no Wave CRUD). `Order.campaignName?: string`, `Order.wave?: string` (e.g. "Wave 2 — EU hub"). Pure display; zero logic.
3. **Status-view logging** — append-only `status_views` collection: `{ id, orderId, merchantId, token, viewedAt, ip?: string /* truncated/hashed, see below */, userAgent?: string }`. Written once per `/status/[token]` server render and per `/api/status/[token]` hit, fire-and-forget (never blocks the render). Repository method `statusViews.record(...)` + `listByOrder(orderId)`.
4. **PII minimization on the view log:** store a truncated IP (first two octets) or omit; never full IP alongside customer identity. The status page already exposes only first name + timeline; the view log is metadata, not customer PII.

## Options considered

- View log as a field on the order (array) — rejected: unbounded growth on a hot document, and append-only collection matches the outcome-ledger pattern (E1) for consistent proof provenance.
- Full Campaign/Wave entities — rejected: on the cut list; label strings deliver the native-vocabulary win at ~zero cost.

## Migration & proof rules

- `gen-seed.mjs` + `seed-check.mjs` migrate in the SAME change: populate `disclosedEta`/`campaignName`/`wave` on seeded orders (tokens/ids stay stable), seed a handful of `status_views`, and add validation. Both JSON and Mongo drivers implement the new repo.
- Demo `status_views` rows carry the `isDemo` lineage via their merchant; they must never count toward any real proof stat.
- No fabricated outcome anywhere; disclosedEta is a disclosed *estimate* (band), never a hard date — `assertNoHardDate` still governs customer-facing rendering.

## Kill-criteria

If view-log volume threatens M0 storage on real traffic, add a TTL index (keep ~180 days — covers the 13.1 window) — that's the only foreseeable scaling lever and it's one line.
