<!-- Tideover PR. The gate below is the definition of done — see CONTRIBUTING.md. -->

## What & why

<!-- One or two sentences. Link the board task id (e.g. C5) and the ADR if there is one. -->

## Gate (all must hold before merge)

- [ ] `cd tideover && npm run verify` is green (seed-check · proof-lint · eval [52,440 invariants + 55 goldens] · lint · build)
- [ ] `npm test` is green
- [ ] **Proof-only** respected: no fabricated metric/testimonial/result; confidence bands, never hard dates; `[CASE STUDY PLACEHOLDER]` literal; demo surfaces watermarked
- [ ] **ADR** added under `docs/adr/` if this is a new dependency, engine change, integration, or pricing/data-exposure decision
- [ ] **Schema change?** `gen-seed.mjs` + `seed-check.mjs` migrated in the same commit
- [ ] **Hot files** (`app/app/inbox/page.tsx`, `DraftRail.tsx`, `ApprovalBar.tsx`, `app/app/page.tsx`, `lib/engines/reassurance.ts`): only one in-flight change touches these at a time, and the send/approve flow + keyboard shortcuts still work
- [ ] **Goldens**: if engine output changed, `npm run gen-goldens` was run and the diff is a legitimate content change (not a papered-over bug)
- [ ] **No secrets** committed (`.env*.local` stays git-ignored; `MONGODB_URI`/`RESEND_API_KEY`/etc. live only in Vercel + local env)

## Notes for the reviewer

<!-- Anything to look at closely: a tricky derivation, a proof-only edge, a migration. -->
