/**
 * Operator auth-mode resolution (ADR-0020). PURE and Edge-safe: reads only
 * process.env and does string work — importable from the middleware bundle,
 * scripts, and tests alike (mirrors lib/mode.ts).
 *
 * Two operator auth mechanisms exist in real mode (ADR-0004, ADR-0020):
 *   - "password": the legacy single shared APP_PASSWORD + HMAC session cookie.
 *   - "auth0":    per-user Auth0 accounts via @auth0/nextjs-auth0 v4.
 *
 * Selection is env-driven so Auth0 ships dark: with NONE of the AUTH0_* vars
 * set, the app runs exactly as before ("password"). Setting ANY of them flips
 * the deployment to "auth0" — deliberately, so a PARTIAL config FAILS CLOSED:
 * a typo in one variable must never silently downgrade the real app to the
 * shared password (or worse, leave it open). The middleware turns an
 * incomplete "auth0" config into an explicit 500, never a pass-through.
 *
 * Demo mode is untouched by all of this: the middleware's host gate
 * (lib/mode.ts resolveMode) runs FIRST, and demo hosts never reach an auth
 * check of either kind.
 */

export type AuthMode = "auth0" | "password";

/**
 * The full Auth0 env contract (@auth0/nextjs-auth0 v4 names — v3's
 * AUTH0_BASE_URL / AUTH0_ISSUER_BASE_URL are NOT read):
 *   AUTH0_DOMAIN        tenant domain, e.g. tideover.us.auth0.com
 *   AUTH0_CLIENT_ID     the Auth0 application's client id
 *   AUTH0_CLIENT_SECRET the Auth0 application's client secret
 *   AUTH0_SECRET        32+ byte random string for session cookie encryption
 *   APP_BASE_URL        this app's own origin, e.g. https://app.tideover.app
 *                       (required here — never inferred from the Host header)
 */
export const AUTH0_ENV_VARS = [
  "AUTH0_DOMAIN",
  "AUTH0_CLIENT_ID",
  "AUTH0_CLIENT_SECRET",
  "AUTH0_SECRET",
  "APP_BASE_URL",
] as const;

function present(name: string): boolean {
  return Boolean(process.env[name]?.trim());
}

/**
 * "auth0" when ANY of the Auth0 vars is set (see the fail-closed note above),
 * "password" when none are. Only consulted for requests already resolved to
 * real mode — demo mode never asks.
 */
export function authMode(): AuthMode {
  return AUTH0_ENV_VARS.some(present) ? "auth0" : "password";
}

/**
 * Names of the Auth0 vars still missing. Empty array = config complete.
 * Non-empty while authMode() is "auth0" = the fail-closed 500 state.
 */
export function auth0ConfigMissing(): string[] {
  return AUTH0_ENV_VARS.filter((v) => !present(v));
}

/**
 * Request-header marker the middleware stamps onto OPERATOR-surface requests
 * in auth0 mode (its matcher is the single source of truth for what counts as
 * an operator surface). lib/tenant.ts honors it — only in auth0 mode — to
 * scope repository reads to the session user's own merchant. Public surfaces
 * (status pages, webhooks, cron) are never matched, never marked, never
 * scoped. Spoofing the header from outside can only RESTRICT the request
 * (scoping narrows reads; it never widens them).
 */
export const TENANT_SCOPE_HEADER = "x-tideover-tenant-scope";

/**
 * Client-visible hint cookie: "this login has a merchant already". Set by
 * POST /api/onboarding and GET /api/auth/tenant; read by the middleware to
 * route first-time users to /onboarding without a datastore hop (the
 * middleware stays edge-safe — no Mongo). A spoofed cookie only skips the
 * hint redirect; tenancy itself is enforced in the repository layer.
 */
export const TENANT_HINT_COOKIE = "tideover_tenant";

/** Cookie attributes for TENANT_HINT_COOKIE (mirrors lib/session.ts's shape). */
export function tenantHintCookieOptions() {
  return {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax" as const,
    path: "/",
    maxAge: 30 * 24 * 60 * 60,
  };
}

/**
 * Short-lived "tenant was just re-resolved" marker, set alongside the hint by
 * GET /api/auth/tenant. While it is present the middleware skips the
 * document-navigation re-resolve below, so ordinary browsing stays
 * redirect-free; once it lapses, the NEXT full-page /app navigation takes one
 * cheap hop through /api/auth/tenant. That re-resolve is what frees a user
 * whose 30-day hint went stale (e.g. their seat was removed) — without it they
 * would be pinned on an empty workspace until the hint expired.
 */
export const TENANT_RESOLVED_COOKIE = "tideover_tenant_res";

/** Cookie attributes for TENANT_RESOLVED_COOKIE — same shape, 60s lifetime. */
export function tenantResolvedCookieOptions() {
  return { ...tenantHintCookieOptions(), maxAge: 60 };
}

/**
 * PURE middleware decision: should this /app request bounce through
 * GET /api/auth/tenant to (re-)resolve tenancy?
 *   - no hint cookie          → yes (first-visit routing, unchanged behavior);
 *   - hint present            → only for a DOCUMENT navigation whose resolved
 *                               marker has lapsed — a stale hint (removed seat,
 *                               deleted merchant) self-heals on the next
 *                               full-page load instead of dead-ending for 30
 *                               days. Client-side/RSC requests never bounce.
 * The resolver always answers with a redirect that sets the marker, so this
 * can never redirect-loop: the follow-up document request carries the marker.
 */
export function shouldResolveTenant(args: {
  hasHint: boolean;
  recentlyResolved: boolean;
  isDocumentNav: boolean;
}): boolean {
  if (!args.hasHint) return true;
  return args.isDocumentNav && !args.recentlyResolved;
}
