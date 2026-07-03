# ADR-0010 — CSV import (Rung 0): backer list → customers + orders, parsed client-side

**Date:** 2026-07-03 · **Status:** accepted · **Task:** W3 · The lowest-trust onboarding rung

## Context

The integration ladder's bottom rung is a merchant importing the export they already hold — a Kickstarter backer report or BackerKit CSV — to populate their customers + orders, with NO OAuth, NO Shopify admin, NO passwords. The privacy story (Rung 0): the raw file is parsed **in the browser**; only the mapped structured fields are sent to the server. This is the concrete "redirect the flow with no new data exposure" claim.

## Decision

1. **Client-side parse.** A small, tested CSV parser (`lib/csv.ts`, no new dependency) runs in the browser. It handles quoted fields, embedded commas, and escaped `""` quotes (documented limitation: not embedded newlines inside quotes — rare in these exports). The raw file never leaves the machine; the import UI shows a preview of the mapped rows, and only the mapped fields POST to the server.

2. **Format mapping.** Ship the **Kickstarter backer report** mapping first (the most common export): backer name → `firstName`, email → `email`, reward/tier → order `group` + a coarse `orderValueCents` from the pledge amount, plus an optional disclosed-ETA column → `Order.disclosedEta` when present. A best-effort **BackerKit** column-alias set is included. Column detection is by header name (case-insensitive), with the mapping shown to the merchant before import so a wrong guess is visible.

3. **Repository create methods.** Add `CustomerRepository.create` and `OrderRepository.create` to the `Repositories` interface and BOTH drivers (json + mongo; mongo strips `_id`, unique index on `id`). Import **dedupes by email within the merchant** (an existing customer is reused, not duplicated) so a re-import is idempotent-ish.

4. **Import route.** `POST /api/import` (zod-validated, operator-side under the F2 gate): takes `{ merchantId, rows: MappedRow[] }`, creates/reuses customers and creates orders. Bounded (cap rows per request, e.g. 2000) and fast. Each created order gets a fresh signed `statusToken` and a sensible `fulfillmentStart`/window derived from the merchant's `fulfillmentWindowDays` (so the wait math + status pages work immediately). `preorderEtaSource: 'manual'`.

5. **Onboarding surface.** An "Import your backer list" step in the wizard (NOT a hot file): file picker → client parse → mapping preview → import → "N customers / N orders created". Rung-0 privacy line stated inline.

## Proof-only guardrails

Imported data is the merchant's own — nothing fabricated. `disclosedEta` is captured ONLY when the source has an estimate column; otherwise it stays undefined (the evidence pack simply omits the dispute-window orientation for those orders). No hard dates synthesized. Demo merchants keep `isDemo`.

## Out of scope

- No Shopify order-API pull (post-revenue, cut list). No dedupe across merchants. No embedded-newline CSV edge case. No live backer-list scraping (KS ToS; cut).

## Kill-criteria

If real exports vary enough that header-name detection misfires often, add an explicit column-mapping UI (drag headers to fields) — but not before real merchant files prove it's needed.
