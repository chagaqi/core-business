# ADR-0009 — Update pipeline: one workshop update → status-page feed + Kickstarter draft

**Date:** 2026-07-03 · **Status:** accepted · **Task:** U2 · Unifies three overlapping proposals (workshop micro-feed, KS Update Composer, forecast outreach) into one composer

## Context

Three research lenses independently proposed the same feature. The unifying insight (enrichment digest, UX + crowdfunding lenses): a merchant should write ONE short "here's what's happening" update and have it serve every channel. The lever is the **labor illusion** (Buell & Norton 2011) + Kickstarter's own guidance ("silence, not delay, breaks backer trust") — a backer who checks their status page twice must see *motion*, and the creator's monthly KS update is the same content. Today the status timeline is static config, so repeat visits show nothing new.

## Decision (core scope this task)

1. **`MerchantUpdate`** — `{ id: 'upd_…', merchantId, text, imageUrl?: string, createdAt }`. Text only + an OPTIONAL externally-hosted image URL (no upload pipeline — cut list). Append-only in practice; a soft `hidden?: boolean` allows retracting one without deletion.
2. **Composer** at a NEW operator route **`/app/updates`** (under `/app`, so it sits behind the F2 auth gate; NOT a hot file): post an update (text + optional image URL), see the recent feed. On save the text is run through `assertNoHardDate` + the proof-lint discipline — a workshop update must never promise a hard ship date (proof-only extends to merchant-authored broadcasts).
3. **Status-page fan-out.** `getPublicStatus` gains a curated `updates` array (the merchant's most recent N, hidden ones excluded) — merchant-level, not per-order, so one post reaches every waiting backer. `StatusView` + the widget render a **"Latest from the workshop"** feed with a relative freshness stamp ("2 days ago"). This is the only new field crossing the PII boundary and it is the merchant's own public message — no customer data.
4. **Copy-to-Kickstarter.** The composer renders any update as a Kickstarter-update-formatted **draft** with a copy button. Draft-only — the creator posts it to Kickstarter themselves. NEVER auto-post (KS ToS / account-risk; cut list).
5. **Repository** `MerchantUpdateRepository { create, listByMerchant, listRecentPublic(merchantId, limit) }` in both drivers; mongo index `{merchantId, createdAt}`. Seed a few demo updates (isDemo lineage; demo surfaces already carry the SAMPLE DATA watermark).

## Explicitly deferred (follow-on, not this task)

- **Stage-transition outbound approval queue** (drafts a per-order email when an order crosses a day-stage boundary, queued for one-click approval) — real value but needs the outbound send rail (drafts-to-inbox / Resend send), which is not built. Tracked as a follow-on (U6). The composer + fan-out feed deliver the proactive-update value now.

## Proof-only guardrails

Update text passes `assertNoHardDate`; the copy-to-KS draft is proof-linted the same way. Image is an external URL the merchant supplies — rendered with `max-width:100%`, never uploaded/stored as a blob. Demo updates are merchant-authored copy carrying no fabricated metric.

## Kill-criteria

If merchants want per-cohort or per-stage targeted updates (not just merchant-wide), add a `scope` field then — don't model it speculatively now.
