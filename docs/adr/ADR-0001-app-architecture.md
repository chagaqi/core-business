# ADR-0001 — One Next.js app, deterministic engines, seeded-demo-first

**Date:** 2026-07-01 · **Status:** accepted · **Backfilled 2026-07-04 (OS3)** — records the founding decision the whole build rests on.

## Context

Tideover is presale-support software for Shopify merchants with 60–120 day fulfillment waits (Kickstarter/BackerKit graduates). The hard product constraint from the founder: it must feel like **software the merchant bought**, not "we handle a slice of your tickets for a fee" — more proprietary, better-engineered, with a real engine and real surfaces. Two delivery modes both matter (bolt onto the existing helpdesk AND Tideover-branded surfaces), and **ease of integration is the priority**. It had to be buildable and demoable immediately, with the real database and any LLM key plugged in later.

## Decision

1. **One Next.js 14 App-Router app** (`tideover/`) holds marketing + operator app + API in a single Vercel deployment — fastest path, one deploy, no cross-service glue. TypeScript strict, Tailwind, no chart/UI mega-deps.

2. **Deterministic engines** (`lib/engines/`: reassurance, refund-risk/priority, gift, social-signal). They are rule + script-library functions that run with **no AI key** — the product is fully functional and demoable on pure logic. An optional LLM drafter (`lib/drafting/`) plugs in later for novel-reply drafting without changing call sites. Determinism is also what makes the eval harness (ADR-0006) possible.

3. **Seeded demo data first, real DB behind a seam.** The app ships on seeded JSON (a mock merchant/orders/customers/tickets) read only through a repository interface, so MongoDB Atlas swaps in later with no call-site changes (realized in ADR-0002, ADR-0003). This let the whole product be built + demoed before any infra existed.

4. **Integration as real engineering, not a claim.** Each inbound path is a typed adapter/rung (CSV import, email-forward, per-merchant webhook — ADR-0008/0010/0011), demoed with a Mock adapter, so "easy integration" is a real abstraction, not marketing.

5. **Surfaces prove the "software" feel:** operator cockpit, merchant health dashboard, customer-branded status page + embeddable widget — the tangible, proprietary things a merchant and their backers see.

## Consequences

- The product is verifiable offline (deterministic + seeded), which is why an invariant sweep + golden fixtures (ADR-0006) can gate every engine change.
- Swapping to Mongo (ADR-0003) and adding an LLM later are additive, not rewrites.
- One app = one auth boundary (ADR-0004) and one proof discipline (ADR-0002) applied everywhere.

## Alternatives rejected

- **Separate marketing site + app + API services** — more infra + glue for a solo build; no benefit at this scale.
- **AI-drafting from day one** — would block demoing on a key + spend, and defeat deterministic evaluability. Kept as a pluggable upgrade instead.
- **A thin service wrapper over a helpdesk** — explicitly rejected: it fails the "feels like software they bought" constraint.
