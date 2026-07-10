import { headers } from "next/headers";
import { authMode, TENANT_SCOPE_HEADER } from "@/lib/auth-mode";
import { getRepositories } from "@/lib/repositories";
import type { Merchant } from "@/lib/types";

/**
 * Per-request tenancy resolution (ADR-0020). Node-runtime only (imports
 * next/headers) — never import from the middleware bundle.
 *
 * The scope decision for repository reads:
 *   unscoped — password mode, demo hosts, public surfaces, scripts, tests,
 *              cron, webhooks: exactly today's behavior.
 *   scoped   — auth0 mode + the middleware's operator-surface marker + a live
 *              session: reads see ONLY merchants whose ownerSub === session sub.
 *   denied   — auth0 mode + the marker but NO resolvable session. Middleware
 *              already 401s these, so this is defense in depth: if one ever
 *              slips through, it reads nothing rather than everything.
 *
 * The Auth0 SDK is imported DYNAMICALLY and only in auth0 mode, so password
 * deployments and the node --test loader never evaluate it.
 */

export type TenantScope =
  | { kind: "unscoped" }
  | { kind: "scoped"; sub: string }
  | { kind: "denied" };

/**
 * The signed-in user's identity, reduced to what tenancy + seats need. `email`
 * / `emailVerified` back the invite-claim flow (lib/team.ts): an invite is
 * claimable ONLY when the identity provider says email_verified === true — an
 * unverified address must never attach to a workspace (squatting risk).
 */
export interface TenantSession {
  sub: string;
  email?: string | null;
  emailVerified?: boolean;
}

export type TenantSessionResolver = () => Promise<TenantSession | null>;

/** Test seams — never set in production code paths. */
let sessionResolverOverride: TenantSessionResolver | null = null;
let scopeOverride: TenantScope | null = null;

export function __setTenantSessionResolverForTests(r: TenantSessionResolver | null): void {
  sessionResolverOverride = r;
}

export function __setTenantScopeForTests(s: TenantScope | null): void {
  scopeOverride = s;
}

/**
 * The signed-in user's session or null. Auth0-mode only; password
 * mode has no per-user identity by design (ADR-0004 single operator).
 */
export async function getTenantSession(): Promise<TenantSession | null> {
  if (sessionResolverOverride) return sessionResolverOverride();
  if (authMode() !== "auth0") return null;
  const { getAuth0Session } = await import("@/lib/auth0");
  return getAuth0Session();
}

/** The scope repository reads run under for the current request. */
export async function tenantScope(): Promise<TenantScope> {
  if (scopeOverride) return scopeOverride;
  if (authMode() !== "auth0") return { kind: "unscoped" };
  let marked = false;
  try {
    marked = headers().get(TENANT_SCOPE_HEADER) === "1";
  } catch {
    // Outside a request scope (scripts, tests, build) → today's behavior.
    return { kind: "unscoped" };
  }
  if (!marked) return { kind: "unscoped" };
  const session = await getTenantSession();
  return session ? { kind: "scoped", sub: session.sub } : { kind: "denied" };
}

/**
 * The merchant owned by an Auth0 user (one merchant per user, v1). Runs
 * against the request's datastore. Named per the ADR-0020 contract; the repo
 * method underneath is merchants.findByOwnerSub on BOTH drivers.
 */
export async function findMerchantByOwnerSub(sub: string): Promise<Merchant | null> {
  return getRepositories().merchants.findByOwnerSub(sub);
}

/**
 * The merchant an Auth0 user OWNS or is an attached MEMBER of (seats). This is
 * what post-login tenancy resolution uses — a teammate who accepted an invite
 * routes into the same workspace as its owner. One merchant per user holds
 * across both roles.
 */
export async function findMerchantByMemberOrOwnerSub(sub: string): Promise<Merchant | null> {
  return getRepositories().merchants.findByMemberOrOwnerSub(sub);
}
