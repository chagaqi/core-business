import { NextResponse } from "next/server";
import { AlreadyOnboardedError, createMerchantFromIntake } from "@/lib/onboarding";
import { OnboardingBodySchema } from "@/lib/onboarding-schema";
import { helpdeskSetups } from "@/lib/ingest-templates";
import { withApiErrorHandling } from "@/lib/api-handler";
import { resolveModeFromRequest } from "@/lib/request-mode";
import { authMode, TENANT_HINT_COOKIE, tenantHintCookieOptions } from "@/lib/auth-mode";
import { getTenantSession } from "@/lib/tenant";

/**
 * POST /api/onboarding — turn wizard answers into a merchant, atomically import
 * any staged backer rows, and return preview scripts + the real import counts.
 * Email forwarding was dropped (D15): no inbox/forwarding address is minted for
 * the client anymore. The optional helpdesk WEBHOOK connect kit is still returned
 * for the success screen's optional "connect your helpdesk" card.
 *
 * Tenancy (ADR-0020): in real mode with Auth0 configured, the new merchant is
 * stamped with the SESSION user's sub (never a client-supplied value), one
 * merchant per user — a second submit gets 409 + { redirect: "/app" } so the
 * wizard can route an already-onboarded user home. Demo hosts keep the public
 * ownerless sandbox exactly as before.
 */
async function handlePOST(req: Request) {
  const parsed = OnboardingBodySchema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json({ error: "invalid body", issues: parsed.error.issues }, { status: 400 });
  }

  let ownerSub: string | null = null;
  if (resolveModeFromRequest() === "real" && authMode() === "auth0") {
    // Middleware already gates this route; re-check here so the stamp can
    // never be skipped by a gate regression (defense in depth, fail closed).
    const session = await getTenantSession();
    if (!session) return NextResponse.json({ error: "unauthorized" }, { status: 401 });
    ownerSub = session.sub;
  }

  let created;
  try {
    created = await createMerchantFromIntake(parsed.data, { ownerSub });
  } catch (err) {
    if (err instanceof AlreadyOnboardedError) {
      const res = NextResponse.json(
        { error: "already onboarded", redirect: "/app" },
        { status: 409 },
      );
      res.cookies.set(TENANT_HINT_COOKIE, "1", tenantHintCookieOptions());
      return res;
    }
    throw err;
  }
  const { merchant, previews, imported } = created;
  const res = NextResponse.json({
    merchantId: merchant.id,
    slug: merchant.slug,
    // Per-merchant helpdesk webhook setup (ADR-0011, ADR-0021) — every vendor's
    // derived credential is computed server-side here (WEBHOOK_ROOT_SECRET is
    // server-only) and passed to the ConnectPanel for the success screen. All
    // four vendors ship, because a Help Scout or Zendesk merchant who is only
    // shown Gorgias/generic instructions cannot connect at all.
    connect: helpdeskSetups(merchant),
    // Real counts from the atomic import (null when no rows were staged) — the
    // success screen leads with "{N} backers imported" from this.
    imported,
    previews,
  });
  // Mark this login as onboarded so the middleware's first-visit routing
  // sends them to /app, not back to the wizard (ADR-0020).
  if (ownerSub) res.cookies.set(TENANT_HINT_COOKIE, "1", tenantHintCookieOptions());
  return res;
}

export const POST = withApiErrorHandling("/api/onboarding", handlePOST);
