# ADR-0004 — Operator auth: env-gated demo mode + shared-password session with HMAC cookie

**Date:** 2026-07-03 · **Status:** accepted · **Task:** F2

## Context

`/app/*` (cockpit, dashboards) and the operator APIs are publicly reachable; `lib/auth.ts` hard-codes demo mode true. Fine for a seeded demo, disqualifying the moment live ingest lands real customer emails. Constraint: the public sales demo must stay zero-login, so auth must be a mode, not a wall.

## Options

1. **Env-gated demo + single shared password, HMAC-signed session cookie (Web Crypto, works in edge middleware).** No new deps, no user table, revocation = rotate `APP_PASSWORD`/`AUTH_SECRET`.
2. NextAuth/Auth.js — user tables, providers, sessions: real RBAC later, days of surface now, overkill for 1 operator + a future PH pod.
3. Vercel Deployment Protection — protects the WHOLE deployment; can't leave the marketing site + status pages public. Doesn't fit.
4. Basic auth header — browsers nag, no logout, shared creds leak into URLs/logs. No.

## Decision

Option 1. Rules:
- `DEMO_MODE` (default **true** = today's behavior, everything open, seeded demo). When `false`: `/app/*` and operator APIs require the signed cookie; `/login` page takes `APP_PASSWORD`, sets an HMAC-SHA256 cookie (`AUTH_SECRET`), httpOnly, secure, sameSite=lax, 7-day expiry.
- Public surfaces NEVER gated: `/`, `/book`, `/vsl/*`, `/onboarding`, `/status/[token]`, `/widget/[token]`, `/api/status/*`, `/api/widget-submit`. `/api/ticket-ingest` keeps its own HMAC webhook auth (never cookie-gated).
- Middleware runs on edge: crypto via SubtleCrypto only.
- RBAC (per-operator identities for the PH pod) is a documented seam, post-revenue.

## Kill-criteria

If a second concurrent operator needs distinct identity/audit (managed-tier hire), upgrade to per-user auth then — not before.
