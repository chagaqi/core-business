# ADR-0021 — Authenticate each helpdesk with the credential it can actually send, and make a dead ingest scream

**Date:** 2026-07-12 · **Status:** accepted · **Task:** B1 / B3 / B6 / B7 (sim backlog) · **Amends:** [ADR-0011](./ADR-0011-webhook-ingest.md)

## Context

ADR-0011 shipped one ingest endpoint, one canonical body, and **one credential**: `X-Tideover-Signature: sha256=<HMAC-SHA256 of the raw body>`, derived per merchant from `HMAC(WEBHOOK_ROOT_SECRET, inboxToken)`. It is a good scheme. It has one flaw: **most of our target helpdesks cannot produce it.**

The 10-merchant simulation (`docs/sim-2026-07-12/`) ran the real product and found that four of ten personas — 17,450 orders, **including the two best-paying** — could not have run in production at all:

| Vendor | What it can actually send | What ADR-0011 demanded |
|---|---|---|
| **Gorgias** (p05, p10) | Its HTTP Integration attaches **static** custom headers, or OAuth2. It cannot compute anything over the body. | a per-request body HMAC |
| **Help Scout** (p07) | `X-HelpScout-Signature: base64(HMAC-**SHA1**(rawBody, secretKey))` — its own algorithm, its own header, its own secret field. It also **cannot template a request body at all**; it POSTs its conversation object. | our HMAC-SHA256 over *our* canonical body |
| **Zendesk** (p06) | Webhook auth is Bearer/API-key (a static header). Its own `X-Zendesk-Webhook-Signature` uses a secret **Zendesk generates**. | — no route existed |

At `DEMO_MODE=false` these merchants' webhooks 401 forever. And that is only half the damage. The failure is **silent**:

- `integrationHealth` (lib/setup.ts) returns `{ quiet: false }` when `lastInboundAt` is `null` — it is coded to say "fine" about the one merchant from whom **nothing has ever arrived**.
- The setup checklist flips "helpdesk connected" to a green ✓ on the mere presence of a presale **tag filter**, which is set during onboarding, before a single ticket exists.
- So the broken install is **indistinguishable from a healthy one having a quiet week**, on every surface we own. p06 and p10 would have spent a month watching a calm cockpit while their real inbox burned and backers opened chargebacks.

A third, quieter kill: Zendesk renders `{{ticket.tags}}` as **one space-separated string**, so a ticket tagged `presale vip` arrived as `["presale vip"]`, matched the `presale` filter on nothing, and was 200-**discarded**. Multi-tag routing is how a 3-seat Zendesk shop tags *every* ticket.

## Decision

### 1. Auth is per vendor — the strongest credential each one CAN send

`lib/channel-adapters/ingest-vendors.ts` declares, per vendor, the ordered list of credentials it is capable of producing. `lib/ingest-auth.ts` verifies them. The route (`lib/ingest-route.ts`) accepts the first that verifies over the **raw bytes**, before any parse.

| Vendor | Schemes (strongest first) | Credential |
|---|---|---|
| `generic` (`/webhook`) | `tideover-hmac`, `bearer` | **unchanged from ADR-0011** |
| `gorgias` | `bearer`, `tideover-hmac` | `Authorization: Bearer tdo_<64 hex>` |
| `zendesk` | `bearer`, `tideover-hmac` | same bearer (Zendesk's "Bearer token" auth) |
| `helpscout` | `helpscout-hmac-sha1`, `bearer`, `tideover-hmac` | Help Scout's own signature, verified with a 32-char key |

**Every credential is still DERIVED — no new stored field, on any model:**

```
credential(purpose) = HMAC_SHA256(WEBHOOK_ROOT_SECRET, "<purpose>:<inboxToken>")

bearer     = "tdo_" + hex(credential("bearer"))              // 256 bits
helpscout  = hex(credential("helpscout")).slice(0, 32)       // Help Scout caps secrets at 40 chars
tideover   = hex(HMAC(root, inboxToken))                     // ADR-0011, byte-identical
```

Domain separation means a leaked bearer (which rides in a header on every request) does not yield the HMAC signing key. Rotating the `inboxToken` still rotates every credential at once.

**Help Scout's secret is one the MERCHANT supplies** when creating the webhook (Help Scout's docs: "a randomly-generated string of 40 characters or less" that you provide). That is the whole reason this works without storage: we hand them a derived value to paste into Help Scout's Secret Key field, Help Scout signs with it, we verify with the same derivation.

**Optional IP allowlist** (`INGEST_IP_ALLOWLIST`, exact IPs + IPv4 CIDRs) hardens the bearer schemes. **Off by default** — a wrong range would silently empty the queue, which is the exact failure this ADR exists to kill, so it must be an explicit opt-in.

### 2. The posture still FAILS CLOSED, in every mode

Unchanged from ADR-0011 and byte-for-byte the same as the Resend inbound route (ADR-0008):

- unauthenticated accept **only** when `DEMO_MODE != "false"` **and** `NODE_ENV != "production"` **and** no root secret is set;
- **`NODE_ENV=production` is never the demo branch**, even with `DEMO_MODE` and the root secret both unset;
- a **missing** `WEBHOOK_ROOT_SECRET` outside demo is itself a rejection (`no-root-secret`) — an empty root makes every derived credential computable from the *public* URL token, so accepting would mean accepting a forgeable secret.

Merchant identity still comes **only** from the URL path token. A captured payload replayed at another merchant's token authenticates against a different derived credential and is refused.

*Bearer is weaker than a body signature — it is replayable if it leaks.* We take that trade knowingly: the alternative on Gorgias and Zendesk is not a stronger credential, it is **no credential and no product**. The bearer is per-merchant, 256-bit, rotatable, constant-time compared, TLS-only, and pairs with the IP allowlist. The HMAC path is untouched and still preferred wherever a tool can do it.

### 3. Help Scout's native payload is read directly

`IngestVendorSpec.normalizeNative` maps a vendor's own payload onto the canonical schema, tried **only after** the canonical parse fails. For Help Scout that fallback *is* the integration (there is no body to template): it reads `_embedded.threads[type=customer].body`, strips the HTML, and takes `customer.email`, `subject`, `tags[].tag`, `createdAt`. `external_id` is prefixed (`hs-…`) so it can never collide with another vendor's id space. Gorgias gets one too, as insurance.

`Ticket.channel` stays **`email`** for every canonical webhook (as ADR-0011 specified). Widening the `Channel` union would change ticket identity and engine inputs for zero user-visible gain — **the vendor matters at the door, not in the pipeline.** The eval harness (ADR-0006) is therefore untouched: 57,614 invariants and 55/55 goldens pass unchanged, because no engine input changed.

### 4. Tags are split and case-folded before the drop-at-edge filter

`expandTags` keeps the original entries **and** adds the whitespace/comma-split pieces, lower-cased. The union can only make a match *more* likely, so it converts a silent drop into a delivery but can never let an untagged ticket through — a ticket tagged `billing` gains no `presale`. The onboarding promise ("untagged tickets never reach us") holds: with `presaleTags` configured, an untagged payload is still dropped.

### 5. Silence is an alarm (`lib/ingest-health.ts`, `lib/setup-status.ts`)

Every terminal outcome of the route is counted with its reason: `accepted · duplicate · unmatched · discarded · rejected · invalid · test`. `deriveIngestStatus` (pure, clock injected) turns that into a level, and the ordering **is** the product decision — the loudest true thing wins:

1. **alarm** — being turned away (`rejected`/`invalid` with no accept since): *"Your helpdesk is being turned away at the door."*
2. **alarm** — configured, and **nothing has ever arrived**. ← *the inversion. This is the case the old check called healthy.*
3. **alarm** — everything is being eaten by the merchant's own tag rule.
4. **alarm** — it used to deliver and has gone mute (≥ 3 days).
5. **warn** — unmatched tickets, or rejections that have since recovered.
6. **idle** — nothing wired yet. Not an error; there is nothing to be wrong.

Every alarm carries the **last failure with its reason and a copy-paste fix that names the vendor's own screen and field** ("In Gorgias → Settings → Integrations → HTTP integration, add the header `Authorization: Bearer …`"). `/app/setup` renders it **above** the checklist, and `IngestStatus.badge` is exported so the cockpit can badge itself with one import.

**Storage.** The **alarm itself is derived from durable data** — has any real (non-`mock`) ticket ever arrived — so it survives a restart, a redeploy and a cold serverless instance. The **counters** are process-local, bounded (25 recent events, 500 merchants, LRU) and best-effort: they are the *diagnosis* layered on top, they refill within one vendor retry cycle, and the UI says so. Persisting them needs a new repository + a `Merchant` field; that is a deliberate follow-up rather than a half-persisted seam today.

### 6. Onboarding actually connects

`ConnectPanel` gives each vendor its own tab: its exact credential, the exact field in **its** UI to paste it into, its body template (or an explicit "there is nothing to paste" for Help Scout), and a **Send a test event** button. The test fires a real request at the real endpoint through the real gate — same auth, same tag rule — and then stops at `test: true` **before anything is written**, so a green result proves a real ticket would land without putting a synthetic one in a real queue. An unauthenticated test is refused exactly like a real ticket: there is no back door.

## Proof-only guardrails

The health panel reports only what is **counted or derived** — payloads that hit the endpoint, tickets that exist. No projection, no date, no invented metric. Where the counters are lossy the UI **says so** ("counted since this server last started… whether anything has *ever* arrived is read from your real tickets and is always accurate") rather than presenting a number the product cannot stand behind. A green "connected" is now earned by a delivered ticket or a passed live test, never by a saved setting — which is exactly the proof-only discipline the setup checklist claimed and did not have.

## Consequences

- **Gorgias, Zendesk and Help Scout merchants can be onboarded.** That is p05, p06, p07, p10 — the four highest-ARPU personas in the sim, and the reason the top price tier was previously "priced for the merchants we cannot onboard."
- A merchant with a broken webhook now finds out **on the setup page, with the fix**, instead of finding out from a chargeback.
- The bearer schemes are replayable if TLS is broken or a secret leaks. Mitigated by derivation, rotation and the optional allowlist; revisit if we ever hold a vendor-generated signing secret per merchant.
- Counters are process-local. A multi-instance deploy under-reports totals (never the alarm).
- `ConnectKit` is now the shape returned by `POST /api/onboarding` (`connect`) — four vendors, not two.

## Alternatives rejected

- **Store a per-merchant vendor secret** (Zendesk's generated signing secret, a Gorgias OAuth token). Strongest crypto, but it needs a new `Merchant` field + repository work in a lane we do not own, an OAuth callback per vendor, and a rotation story — and it still does not save Gorgias, which cannot sign a body at any price. Deferred, not refused: the seam is `IngestVendorSpec.schemes`, so adding `zendesk-hmac-sha256` later is additive.
- **Widen the `Channel` union to `zendesk`/`helpscout`.** Changes `Ticket.channel`, hence `findByExternalId` identity and every `Record<Channel, …>` in the app, for a label the pipeline does not use. Rejected: the vendor matters at the door, not in the pipeline.
- **Keep HMAC-only and tell Gorgias merchants to run a proxy.** That is asking a solo hardware founder to deploy a signing shim. It is why we lost them.
- **Drop the signature requirement in production** to make everything "just work". This is the one that is genuinely tempting and genuinely fatal: the ingest URL is a capability, and an unauthenticated one lets anyone who sees a token inject tickets into a merchant's queue. Fail-closed stands.
- **A "quiet for N days" warning only** (the ADR-0011 F7 check). It cannot fire for a merchant who never received anything — precisely the broken merchant. Inverting the default is the whole fix.

## Kill-criteria

- A merchant's ingest is **not** the thing that breaks and the health panel cries wolf — if the alarm fires on healthy installs (e.g. a legitimately quiet 3-day window on a small merchant), raise `QUIET_ALARM_DAYS` or scope rule 4 to merchants with an established inbound rate. The never-arrived rule (2) should not need touching; if it does, we mis-modelled `configured`.
- A bearer secret leaks and is replayed. Then the trade in §2 was wrong and we buy the stored-secret path (Zendesk signature, Gorgias OAuth) properly.
- The counters' process-locality misleads someone in a real incident. Then they earn their repository.
