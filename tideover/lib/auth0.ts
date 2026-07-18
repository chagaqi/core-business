import { Auth0Client } from "@auth0/nextjs-auth0/server";
import { auth0ConfigMissing } from "@/lib/auth-mode";
// Type-only: lib/tenant.ts imports THIS module dynamically, so no runtime cycle.
import type { TenantSession } from "@/lib/tenant";

/**
 * Lazy singleton around the @auth0/nextjs-auth0 v4 client (ADR-0020). Nothing
 * is instantiated at import time, and getAuth0() THROWS on incomplete config —
 * the fail-closed rule: a partial AUTH0_* set must produce a loud error, never
 * a silent fallback to the shared password or an open gate.
 *
 * The client reads its config from the env contract documented in
 * lib/auth-mode.ts (AUTH0_DOMAIN, AUTH0_CLIENT_ID, AUTH0_CLIENT_SECRET,
 * AUTH0_SECRET, APP_BASE_URL). It is edge-safe by design (jose/oauth4webapi,
 * no Node-only APIs), so middleware.ts may use it; the middleware still
 * imports this file DYNAMICALLY so password-mode deployments and the
 * node --test loader never evaluate the SDK.
 *
 * This module is the only place the SDK is touched server-side. Everything
 * else goes through lib/tenant.ts, which is mockable in tests.
 */

let client: Auth0Client | null = null;

export function getAuth0(): Auth0Client {
  const missing = auth0ConfigMissing();
  if (missing.length > 0) {
    throw new Error(
      `Auth0 config incomplete — refusing to run half-configured auth (fail closed, ADR-0020). Missing: ${missing.join(", ")}`,
    );
  }
  client ??= new Auth0Client();
  return client;
}

/**
 * The current request's Auth0 session, reduced to the fields tenancy + seats
 * need (lib/tenant.ts TenantSession). null when unauthenticated, outside a
 * request scope, or when the session carries no usable sub. `emailVerified`
 * is true ONLY on an explicit email_verified === true claim — anything else
 * (absent, false, non-boolean) reads as unverified, so the invite-claim flow
 * fails closed.
 */
export async function getAuth0Session(): Promise<TenantSession | null> {
  try {
    const session = await getAuth0().getSession();
    const user = session?.user;
    const sub = user?.sub;
    if (typeof sub !== "string" || sub.length === 0) return null;
    return {
      sub,
      email: typeof user?.email === "string" && user.email.length > 0 ? user.email : null,
      emailVerified: user?.email_verified === true,
    };
  } catch {
    // cookies()/headers() throw outside a request scope (scripts, build).
    return null;
  }
}
