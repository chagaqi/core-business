# ADR-0011 — Rung 2: per-merchant helpdesk webhook ingest (the API path, tag-routed)

**Date:** 2026-07-03 · **Status:** accepted · **Task:** W2 · Closes the ADR-0008/§F3 cross-merchant-replay note

## Context

The email-forward rung (W1) works but is lossy (no tags, fragile threading, deliverability). The cleaner integration — and the one a Shopify merchant on Gorgias/Zendesk actually wants — is a **helpdesk webhook**: the merchant's helpdesk fires a structured JSON POST to a private Tideover URL when a ticket appears. Crucially, **the merchant's helpdesk does the presale categorization**: a rule ("tag = presale → notify Tideover") means only presale tickets ever reach us. That is the low-risk "your helpdesk decides what we see" story and the answer to "how do we know which ticket is presale."

Current `/api/ticket-ingest` takes merchant identity from an **unsigned `?merchant=` query param** with a single global secret — flagged in F3 as cross-merchant-replay-able. This ADR replaces that path.

## Decision

1. **Per-merchant ingest URL:** `POST /api/ingest/[channel]/[token]` where `token` is the merchant's existing unguessable `inboxToken` (reused from W1 — one per-merchant capability for both email and webhook). Merchant identity comes from the URL path, resolved via `merchants.findByInboxToken`; there is no `?merchant=` param to forge. An unknown token → 404 (no merchant leak).

2. **Per-merchant HMAC secret, derived (no new stored field):** `webhookSecret = HMAC_SHA256(WEBHOOK_ROOT_SECRET, inboxToken)` (hex). The onboarding UI shows the merchant this value to paste into their helpdesk's webhook signing config. Verify inbound signatures against it. Demo mode (`DEMO_MODE !== 'false'` and no `WEBHOOK_ROOT_SECRET`) accepts unsigned so the seeded demo/test path works — same gate shape as ADR-0004/0008, and it fails **closed** under `NODE_ENV=production`.

3. **Canonical push schema** (`lib/ingest-schema.ts`, zod): one Tideover ingest shape — `{ external_id, customer_email, subject, body, tags?: string[], order_ref?, created_at? }`. Every vendor's webhook body is templated by the *merchant's helpdesk* to emit this shape, so one endpoint + one normalizer replaces N bespoke adapters. Routes through the existing hardened `ingestTicket` (idempotency on `external_id`, drop-at-edge on `presaleTags`).

4. **Tag routing / drop-at-edge:** the payload carries `tags`; the existing `Merchant.presaleTags` filter (F3) discards a payload whose tags don't match — a backstop even though the merchant's rule should only send tagged tickets. Discards are logged, counted, never persisted.

5. **Onboarding integration step:** a new "Connect your helpdesk" panel generates, per merchant: the ingest URL, the signing secret, and **copy-paste setup for Gorgias (HTTP Integration) and Zendesk (trigger + webhook)** — the exact JSON body mapping the vendor's ticket fields onto the canonical schema — plus a plain-English "add a rule: tag `presale` → send to this URL" instruction and a "waiting for first ping" hint. Vendor-agnostic: any helpdesk that can POST a templated JSON body on a ticket event works.

## Out of scope / deferred

- Write-back (posting the drafted reply *into* the helpdesk under the merchant's name) — needs per-merchant scoped API keys; post-first-revenue.
- A bespoke Zendesk/Gorgias *adapter class* — unnecessary; the canonical schema + merchant-side templating is the whole point (the merchant maps their fields, we don't reverse-engineer each vendor).

## Proof-only / security

No fabricated data. The derived-secret scheme means one leaked token exposes exactly one merchant and rotating the token rotates the secret. Same fail-closed-in-production posture as the email route.

## Kill-criteria

If real merchants' helpdesks can't template a custom JSON body (some cheaper tiers can't), fall back to a thin per-vendor normalizer for that vendor's native payload — but only when a real merchant hits the wall.
