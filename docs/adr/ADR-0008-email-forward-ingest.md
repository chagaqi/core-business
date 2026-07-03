# ADR-0008 — Email-forward ingest via Resend inbound (the zero-trust wedge)

**Date:** 2026-07-03 · **Status:** accepted · **Task:** W1 · The "integration = one forwarding rule" sell

## Context

The lowest-friction, lowest-trust integration — the whole cold-outreach wedge — is: the merchant adds ONE email forwarding rule pointing their support alias at a Tideover address; nothing else (no OAuth, no password, no app install), and revocation = deleting that rule. Dylan already runs Resend for *sending* (`mail.tideover.app`, verified). Resend also does inbound, so we stay one-vendor.

## Resend inbound contract (verified from docs, 2026-07)

- Add an **MX record** (lowest priority) to a receiving domain; Resend then receives mail for ANY address at it. Use a **dedicated subdomain `in.tideover.app`** so it never conflicts with the `mail.tideover.app` sending domain. Resend supplies the exact MX value in its dashboard (Dylan copies it — a Needs-Dylan step).
- On receipt Resend POSTs a webhook, event **`email.received`**, payload: `{ type, created_at, data: { email_id, from, to: string[], subject, attachments } }`. **Metadata only — no body.**
- Full body via **`GET https://api.resend.com/emails/receiving/{email_id}`**, `Authorization: Bearer <RESEND_API_KEY>` → `{ from, to[], subject, html, text, headers, ... }`.
- Webhook is **Svix-signed**: headers `svix-id`, `svix-timestamp`, `svix-signature`; HMAC-SHA256 over `"{svix-id}.{svix-timestamp}.{rawBody}"` keyed by the base64 secret after the `whsec_` prefix; compare against the `v1,<b64>` entries in `svix-signature`. Resend stores + retries + lets you replay, so a brief endpoint outage loses nothing.

## Decision

1. **Per-merchant inbound address** `<inboxToken>@in.tideover.app`. Add `Merchant.inboxToken` (stable, unguessable per-merchant token). Routing is by the recipient local-part → merchant; a leaked address exposes only one merchant, and revocation = rotate the token (new address). The address IS the routing key + capability.
2. **Route** `POST /api/inbound/resend`: read raw body → **verify the Svix signature FIRST** (before parse), using `RESEND_WEBHOOK_SECRET`; in demo mode (`DEMO_MODE !== 'false'` and no secret set) accept unsigned so the seeded demo/test path works, exactly mirroring the ADR-0004 mock gate. → parse `email.received` → for each `data.to` matching `*@in.tideover.app`, resolve merchant by `inboxToken` (skip unknown addresses) → **fetch the body** via the Resend Received-Emails API (behind an injectable `fetchReceivedEmail(id)` seam so it is unit-testable/stubbable) → normalize `{ from, subject, body: text ?? htmlToText(html), externalId: email_id }` → run the EXISTING hardened ingest (`ingestTicket`): idempotency on `(merchantId, 'email', email_id)`, drop-at-edge `presaleTags`. **Fast-ACK 200** immediately after enqueue-equivalent work; never do unbounded work in the handler.
3. **Repository:** `merchants.findByInboxToken(token)` in both json + mongo drivers.
4. **Surface** the merchant's forwarding address in onboarding ("forward your support email here") — the concrete form of the one-rule integration.

## Out of scope / cut

- No OAuth helpdesk apps, no Shopify app (post-revenue, cut list).
- Send-as / DKIM-delegated outbound replies — Phase 0 is drafts-to-inbox / native; keep this ingest-only.
- The **live activation** (MX record on `in.tideover.app`, Resend inbound + webhook config pointing at `/api/inbound/resend`, `RESEND_WEBHOOK_SECRET`) is Dylan's DNS/dashboard step — the code is built + tested against the verified contract so it works on activation. Cross-merchant replay via the earlier `?merchant=` seam (W2) is unrelated; this route derives merchant from the signed inbound address.

## Verification & kill-criteria

Everything except the real MX + real API fetch is unit/integration testable with a simulated `email.received` payload (valid + invalid Svix signature) and a stubbed `fetchReceivedEmail`. If Resend's inbound proves unreliable at pilot volume, the same normalized-ingest seam accepts a Cloudflare Email Worker or Postmark inbound instead — only the route adapter changes.
