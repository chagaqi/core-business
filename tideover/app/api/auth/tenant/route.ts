import { NextResponse } from "next/server";
import { resolveModeFromRequest } from "@/lib/request-mode";
import {
  authMode,
  TENANT_HINT_COOKIE,
  TENANT_RESOLVED_COOKIE,
  tenantHintCookieOptions,
  tenantResolvedCookieOptions,
} from "@/lib/auth-mode";
import { findMerchantByMemberOrOwnerSub, getTenantSession } from "@/lib/tenant";
import { acceptPendingInvite } from "@/lib/team";

export const dynamic = "force-dynamic";

/**
 * GET /api/auth/tenant?next=/app/... — post-login tenant resolution (ADR-0020).
 * The Edge middleware cannot touch Mongo, so when an auth0-mode session hits
 * /app without the tenant hint cookie it bounces here; this Node-runtime
 * handler resolves session sub → owned merchant and routes:
 *
 *   merchant found  → set the hint cookie, continue to `next` (the /app page).
 *                     "Found" means owned OR member-of (seats): a teammate who
 *                     accepted an invite routes into the owner's workspace.
 *   no merchant yet → claim a pending team invite if this session's VERIFIED
 *                     email matches one (lib/team.ts) — on success the user is
 *                     attached as a member and continues to `next`; otherwise
 *                     /onboarding (first-run wizard).
 *   no session      → /auth/login?returnTo=… (should not happen behind the
 *                     middleware; kept so this route fails closed standalone).
 *
 * Outside real+auth0 mode it is a plain redirect to `next` — demo hosts and
 * password mode never depend on it. The cookie is a routing HINT only; tenant
 * isolation is enforced in the repository layer regardless.
 */
export async function GET(req: Request) {
  const url = new URL(req.url);
  const requested = url.searchParams.get("next") ?? "/app";
  // Same-origin relative paths only — never an open redirect.
  const next = requested.startsWith("/") && !requested.startsWith("//") ? requested : "/app";

  if (resolveModeFromRequest() !== "real" || authMode() !== "auth0") {
    return NextResponse.redirect(new URL(next, req.url));
  }

  const session = await getTenantSession();
  if (!session) {
    const login = new URL("/auth/login", req.url);
    login.searchParams.set("returnTo", next);
    return NextResponse.redirect(login);
  }

  const merchant = await findMerchantByMemberOrOwnerSub(session.sub);
  if (!merchant) {
    // No workspace yet — a pending team invite for this session's verified
    // email attaches them as a member (unverified emails never match). On a
    // successful claim, fall through to the hint cookie + `next` like any
    // resolved tenant; otherwise it's a genuine first run → onboarding.
    const claimed = await acceptPendingInvite(session);
    if (!claimed || "error" in claimed) {
      // No workspace for this login — a genuine first run, OR a seat that was
      // removed while the browser still held the 30-day hint. CLEAR the hint
      // so the middleware keeps routing this login back here (never a stale
      // dead-end on an empty workspace), and stamp the resolved marker so the
      // decision isn't re-run on every document navigation.
      const res = NextResponse.redirect(new URL("/onboarding", req.url));
      res.cookies.delete(TENANT_HINT_COOKIE);
      res.cookies.set(TENANT_RESOLVED_COOKIE, "1", tenantResolvedCookieOptions());
      return res;
    }
    // Confirm the claim actually persisted before stamping the 30-day hint
    // cookie — a lost write (concurrent seat mutation) would otherwise pin the
    // user on NoMerchantState behind the hint. No cookie = next hit re-resolves.
    const confirmed = await findMerchantByMemberOrOwnerSub(session.sub);
    if (!confirmed) {
      return NextResponse.redirect(new URL(next, req.url));
    }
  }

  const res = NextResponse.redirect(new URL(next, req.url));
  res.cookies.set(TENANT_HINT_COOKIE, "1", tenantHintCookieOptions());
  // Short-lived marker: while present, the middleware skips the document-
  // navigation re-resolve, keeping browsing redirect-free between resolves.
  res.cookies.set(TENANT_RESOLVED_COOKIE, "1", tenantResolvedCookieOptions());
  return res;
}
