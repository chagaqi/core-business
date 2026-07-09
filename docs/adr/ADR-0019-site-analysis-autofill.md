# ADR-0019 — Site-analysis autofill endpoint (deterministic, SSRF-guarded)

**Date:** 2026-07-09 · **Status:** accepted · **Task:** OB1

## Context

Onboarding should feel intelligent: the merchant pastes their website or Kickstarter URL and the wizard prefills brand name, platform, estimated delivery, and goodwill-gift candidates derived from their own reward tiers ("autofill as much as possible", "gifts auto populated from their campaign"). No LLM key exists yet (ADR-0018 pends provider), so extraction must be deterministic. Fetching operator-supplied URLs server-side creates SSRF exposure that has to be engineered, not hand-waved.

## Decision

1. **`POST /api/analyze { url }`** (`app/api/analyze/route.ts`, zod-validated, `withApiErrorHandling`, in-memory 10/min per-IP limiter, `runtime="nodejs"`). Reads no datastore — safe in demo and real mode.
2. **Extraction is pure and deterministic** (`lib/site-analyze.ts` → `extractFromHtml`): og/JSON-LD/title → brandName; theme-color → accent; host/markers → platform (kickstarter/indiegogo/shopify/generic); embedded KS project JSON → rewardTiers + estimatedDelivery; gift candidates quote extracted reward titles, bucketed base/mid/full by pledge amount. Nothing extractable → 3 generic candidates flagged `source:"fallback"` so the UI never presents invented site facts as site-derived.
3. **SSRF guard** (`assertUrlAllowed`): http/https only, ports 80/443 only, literal-IP and DNS-resolved-IP checks against private/reserved v4+v6 ranges (incl. metadata, CGNAT, IPv4-mapped v6), manual redirects capped at 3 same-registrable-domain with the guard re-run each hop, 8s timeout, 2MB streaming cap, text/html required, no upstream HTML echoed to the client.
4. **Auth posture:** added to the middleware matcher — operator-auth-gated on the real host, open on the demo/marketing host where public onboarding runs (that flow is the point), protected there by the guard + limiter.
5. **Accepted residual — DNS rebinding.** We validate the resolved IP but `fetch()` re-resolves, so an attacker controlling authoritative DNS with TTL≈0 could theoretically steer the second resolution at a private IP. Accepted because: the guard re-runs per redirect, responses echo no fetched content, and the Vercel function sandbox exposes no privileged internal network. Closing it fully requires socket pinning (custom undici dispatcher). Documented inline at `assertUrlAllowed`.

## Proof-only guardrails

Gift-candidate labels are grounded in the merchant's own extracted reward titles or clearly flagged `fallback`; the endpoint invents no brand facts, dates, or claims. `estimatedDelivery` feeds the wizard as a *prefill the merchant confirms*, never a customer-facing promise.

## Consequences

Onboarding can autofill live during signup; the same extraction layer is reusable for the ADR-0018 tenant-profile assembly. The limiter is per-instance memory (resets on cold start) — acceptable at pilot traffic, revisit with real volume.

## Alternatives rejected

- **LLM-based extraction:** no key yet, and deterministic parsing is testable + free; an LLM pass can layer on top later without changing the endpoint contract.
- **Client-side fetch:** CORS-blocked on arbitrary sites; a server fetch is the only reliable path.
- **Socket pinning now:** needs a dependency or custom dispatcher for a residual with no reachable target in our runtime; disproportionate at this stage.

## Kill-criteria

Before this endpoint ever runs inside a network with reachable internal services (VPC peering, self-hosted deploy) or is granted credentials of any kind, socket pinning becomes mandatory — revisit then, deliberately.
