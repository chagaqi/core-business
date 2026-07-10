# ADR-0020 — Auth0 user accounts + per-merchant tenancy, env-gated behind the password fallback

**Date:** 2026-07-09 · **Status:** accepted · **Task:** auth/tenancy P2

## Context

ADR-0004's single shared APP_PASSWORD gets one operator into EVERY merchant: no per-user identity, no tenant isolation — the known P2. Real pilots need accounts where a signed-in user sees exactly their own merchant. Constraint: no Auth0 tenant exists yet, so the whole thing must ship dark and turn on by pasting credentials, and the demo host (ADR-0017) must stay a zero-login sandbox.

## Decision

1. **SDK + surface.** `@auth0/nextjs-auth0` v4 (`lib/auth0.ts`, lazy `Auth0Client`). Its middleware mounts `/auth/login|logout|callback|…`; no app-owned auth routes beyond `GET /api/auth/tenant` (post-login tenant resolution). Sessions are the SDK's encrypted cookie; the ADR-0004 HMAC cookie stays for password mode.
2. **Env contract + mode selection** (`lib/auth-mode.ts`): `AUTH0_DOMAIN`, `AUTH0_CLIENT_ID`, `AUTH0_CLIENT_SECRET`, `AUTH0_SECRET`, `APP_BASE_URL` (v4 names; v3's `AUTH0_BASE_URL`/`AUTH0_ISSUER_BASE_URL` are not read). `authMode()` = "auth0" when ANY of the five is set, else "password". Applies only in real mode (ADR-0017 host gate runs first); demo hosts never see either gate.
3. **Fail closed.** Partial config = auth0 mode with an explicit 500 from the middleware (JSON for APIs, plain page otherwise). A typo can never downgrade to password mode or leave the gate open.
4. **Tenancy model.** `Merchant.ownerSub` (nullable; seeds/demo/password-created merchants null). One merchant per user v1: enforced in `createMerchantFromIntake` (throws `AlreadyOnboardedError` → 409 + `{ redirect: "/app" }`) and by a partial unique Mongo index on `{ ownerSub }`. Both drivers implement `merchants.findByOwnerSub` identically; `lib/tenant.ts findMerchantByOwnerSub` is the callable seam.
5. **Isolation seam.** In auth0 mode `getRepositories()` wraps the driver with `lib/repositories/tenant-scope.ts`: on operator requests (marked by the middleware via the `x-tideover-tenant-scope` request header — the matcher is the source of truth for "operator surface") the merchants repository answers only for `ownerSub === session.sub`; marker-without-session reads nothing (denied). Every operator flow resolves its merchant through `merchants.list()`/`findById` before touching child data, so a foreign merchantId dead-ends at that lookup. Public surfaces, cron, webhooks, scripts, and password mode resolve unscoped — byte-for-byte prior behavior.
6. **Onboarding.** Real+auth0: `/onboarding` requires login; `POST /api/onboarding` stamps `ownerSub` from the SESSION (never the body). Merchant-less logins hitting `/app` bounce via `/api/auth/tenant` (Node runtime — middleware stays edge-safe, no Mongo) to `/onboarding`; the `tideover_tenant` hint cookie skips the hop afterward and is a routing hint only. Demo-host onboarding is unchanged (public, ownerless sandbox).
7. **Marketing CTA.** `GET_STARTED_HREF` (`components/marketing/nav/nav-data.ts`) points at `https://$NEXT_PUBLIC_REAL_APP_HOST/onboarding` when that build-time var is set (marketing deploy), else relative `/onboarding` — the appUrl() host-awareness pattern, applied at build.
8. **Engine/seed untouched:** no seed changes (ownerSub absent = null), eval harness and seed-check unaffected.

## Consequences

- Turning real multi-tenant auth on = paste five env vars; nothing ships live before that.
- Password mode remains the deploy default. **Deprecation path:** once the first Auth0 pilot is live and stable, remove `APP_PASSWORD`/`AUTH_SECRET` from the deploy env (flips nothing — auth0 vars already win), then delete the password branch (middleware, `/login` form, `/api/login|logout`, `lib/session.ts`) in its own change.
- Residual risk, documented: an operator API that never resolves its merchant (directly or via lib/service's `merchants.findById`) would bypass the seam; today every matched route resolves one. Per-object child-record checks are the v2 hardening step.

## Alternatives rejected

- **Extend the HMAC cookie to per-user creds** — hand-rolled password storage/reset/MFA; exactly what ADR-0004 deferred, still wrong to build.
- **NextAuth/Auth.js** — needs a user store + adapter (new tables in the live db), more moving parts than a hosted IdP for a one-founder team.
- **Per-route tenancy checks in every handler** — N places to forget one; the repository seam is one place, and pages/APIs already resolve merchants through it.
- **Scope by datastore instead of request marker** — would scope public status pages/webhooks whenever a session cookie rides along; the middleware matcher already defines "operator surface", so reuse it.

## Kill-criteria

- A pilot needs multiple users per merchant (or one user with several brands) → the one-merchant-per-sub model is wrong; move ownership to a membership table then.
- Auth0 pricing/lock-in bites before revenue covers it → the seam (`lib/tenant.ts` session resolver + `lib/auth0.ts` being the only SDK touchpoints) is sized to swap IdPs without touching the repositories.
