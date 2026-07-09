import { NextResponse } from "next/server";
import { createMerchantFromIntake } from "@/lib/onboarding";
import { OnboardingBodySchema } from "@/lib/onboarding-schema";
import { gorgiasHttpIntegration, zendeskTrigger } from "@/lib/ingest-templates";
import { withApiErrorHandling } from "@/lib/api-handler";

/**
 * POST /api/onboarding — turn wizard answers into a merchant, atomically import
 * any staged backer rows, and return preview scripts + the real import counts.
 * Email forwarding was dropped (D15): no inbox/forwarding address is minted for
 * the client anymore. The optional helpdesk WEBHOOK connect kit is still returned
 * for the success screen's optional "connect your helpdesk" card.
 */
async function handlePOST(req: Request) {
  const parsed = OnboardingBodySchema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json({ error: "invalid body", issues: parsed.error.issues }, { status: 400 });
  }
  const { merchant, previews, imported } = await createMerchantFromIntake(parsed.data);
  return NextResponse.json({
    merchantId: merchant.id,
    slug: merchant.slug,
    // Per-merchant helpdesk webhook setup (ADR-0011) — the derived signing secret
    // is computed server-side here (WEBHOOK_ROOT_SECRET is server-only) and passed
    // to the ConnectPanel for display on the success screen (optional path).
    connect: {
      gorgias: gorgiasHttpIntegration(merchant),
      zendesk: zendeskTrigger(merchant),
    },
    // Real counts from the atomic import (null when no rows were staged) — the
    // success screen leads with "{N} backers imported" from this.
    imported,
    previews,
  });
}

export const POST = withApiErrorHandling("/api/onboarding", handlePOST);
