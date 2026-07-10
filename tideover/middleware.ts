import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { SESSION_COOKIE, verifySessionValue } from "@/lib/session";
import { resolveMode } from "@/lib/mode";
import {
  authMode,
  auth0ConfigMissing,
  TENANT_HINT_COOKIE,
  TENANT_SCOPE_HEADER,
} from "@/lib/auth-mode";

/**
 * Operator auth gate (ADR-0004, ADR-0017, ADR-0020). The matcher lists ONLY the
 * operator surfaces plus the two auth-flow paths — public pages (/, /book,
 * /vsl/*, /status/*, /widget/*) and public APIs (/api/status/*,
 * /api/widget-submit, /api/ticket-ingest, /api/inbound/*, /api/ingest/*,
 * /api/cron/*) never hit this. The webhook ingest endpoints authenticate by
 * their own token + signature, and /api/cron/* by its own bearer secret
 * (ADR-0013), so they must stay OUT of this matcher.
 *
 * Mode is derived from the request host (ADR-0017): only the real app host is
 * gated; every other host — including the public demo — passes through
 * untouched, and DEMO_MODE=false still forces the gate on for backcompat.
 *
 * In real mode the auth MECHANISM is env-selected (ADR-0020, lib/auth-mode.ts):
 *   password — no AUTH0_* vars set: the legacy shared-password HMAC cookie,
 *              byte-for-byte the pre-Auth0 behavior. /onboarding and /auth/*
 *              stay un-gated here exactly as before (POST /api/onboarding was
 *              and remains gated).
 *   auth0    — any AUTH0_* var set: per-user sessions via @auth0/nextjs-auth0
 *              v4 (its middleware mounts /auth/login|logout|callback|…). A
 *              PARTIAL config fails CLOSED with an explicit 500 — never a
 *              silent fall-back to password, never an open gate. Authenticated
 *              operator requests get the tenant-scope marker header stamped so
 *              the repository layer (lib/tenant.ts) scopes reads to the
 *              session user's own merchant; users without a merchant are
 *              routed through /api/auth/tenant → /onboarding.
 *
 * Everything here stays Edge-safe: pure env reads, SubtleCrypto, and the
 * edge-compatible Auth0 client (imported dynamically so password-mode deploys
 * never evaluate it). No next/headers, no Mongo.
 */
export async function middleware(req: NextRequest) {
  if (resolveMode(req.headers.get("host") ?? undefined) !== "real") {
    return NextResponse.next();
  }

  const { pathname, search } = req.nextUrl;

  if (authMode() === "password") {
    // Unchanged legacy gate (ADR-0004). The two auth0-only matcher additions
    // pass through: /auth/* has no route in password mode (404s), and the
    // /onboarding PAGE stays public exactly as before this ADR.
    if (pathname.startsWith("/auth") || pathname === "/onboarding") {
      return NextResponse.next();
    }
    const session = req.cookies.get(SESSION_COOKIE)?.value;
    if (session && (await verifySessionValue(session))) return NextResponse.next();
    if (pathname.startsWith("/api/")) {
      return NextResponse.json({ error: "unauthorized" }, { status: 401 });
    }
    const login = new URL("/login", req.url);
    login.searchParams.set("next", pathname + search);
    return NextResponse.redirect(login);
  }

  // ── auth0 mode ──────────────────────────────────────────────────────────
  // FAIL CLOSED: a partial AUTH0_* config is a loud 500, never password mode
  // and never a pass-through — a typo must not downgrade auth (ADR-0020).
  const missing = auth0ConfigMissing();
  if (missing.length > 0) {
    console.error(`auth0 config incomplete — failing closed. Missing: ${missing.join(", ")}`);
    if (pathname.startsWith("/api/")) {
      return NextResponse.json({ error: "auth misconfigured" }, { status: 500 });
    }
    return new NextResponse(
      "Sign-in is unavailable: this deployment's Auth0 configuration is incomplete. An operator must set the full AUTH0_* variable set (see .env.example).",
      { status: 500, headers: { "content-type": "text/plain; charset=utf-8" } },
    );
  }

  const { getAuth0 } = await import("@/lib/auth0");
  const auth0 = getAuth0();

  // The SDK middleware serves the mounted /auth/* routes and keeps rolling
  // sessions fresh (its cookie updates are re-applied below for other paths).
  const authRes = await auth0.middleware(req);
  if (pathname.startsWith("/auth")) return authRes;

  const session = await auth0.getSession(req);
  if (!session) {
    if (pathname.startsWith("/api/")) {
      return NextResponse.json({ error: "unauthorized" }, { status: 401 });
    }
    const login = new URL("/auth/login", req.url);
    login.searchParams.set("returnTo", pathname + search);
    return NextResponse.redirect(login);
  }

  // First-visit routing: a login with no merchant yet belongs on /onboarding.
  // The hint cookie is set by /api/auth/tenant (which resolves ownerSub →
  // merchant in the Node runtime — this middleware stays Mongo-free) and by a
  // successful POST /api/onboarding. Pages only; APIs answer data, not tours.
  if (pathname.startsWith("/app") && req.cookies.get(TENANT_HINT_COOKIE)?.value !== "1") {
    const resolve = new URL("/api/auth/tenant", req.url);
    resolve.searchParams.set("next", pathname + search);
    return NextResponse.redirect(resolve);
  }

  // Stamp the tenant-scope marker for the repository layer (overwriting any
  // client-supplied value) and carry over the SDK's session cookie updates.
  const fwd = new Headers(req.headers);
  fwd.set(TENANT_SCOPE_HEADER, "1");
  const res = NextResponse.next({ request: { headers: fwd } });
  for (const cookie of authRes.cookies.getAll()) res.cookies.set(cookie);
  return res;
}

export const config = {
  matcher: [
    "/app/:path*",
    "/auth/:path*",
    "/onboarding",
    "/api/approve-send",
    "/api/draft",
    "/api/export",
    "/api/gift-catalog/:path*",
    "/api/gift-send",
    "/api/escalate",
    "/api/social-signal-feed",
    "/api/orders/:path*",
    "/api/onboarding",
    "/api/analyze",
    "/api/import",
    "/api/updates",
    "/api/setup-status",
    "/api/team",
    "/api/variants/promote",
  ],
};
