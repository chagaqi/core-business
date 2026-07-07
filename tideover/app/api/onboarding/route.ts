import { NextResponse } from "next/server";
import { createMerchantFromIntake } from "@/lib/onboarding";
import { OnboardingBodySchema } from "@/lib/onboarding-schema";
import { inboxAddressFor } from "@/lib/inbound";
import { gorgiasHttpIntegration, zendeskTrigger } from "@/lib/ingest-templates";

/** POST /api/onboarding — turn wizard answers into a merchant + preview scripts. */
export async function POST(req: Request) {
  const parsed = OnboardingBodySchema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json({ error: "invalid body", issues: parsed.error.issues }, { status: 400 });
  }
  const { merchant, previews } = await createMerchantFromIntake(parsed.data);
  return NextResponse.json({
    merchantId: merchant.id,
    slug: merchant.slug,
    inboxAddress: inboxAddressFor(merchant.inboxToken),
    // Per-merchant helpdesk webhook setup (ADR-0011) — the derived signing secret
    // is computed server-side here (WEBHOOK_ROOT_SECRET is server-only) and passed
    // to the ConnectPanel for display.
    connect: {
      gorgias: gorgiasHttpIntegration(merchant),
      zendesk: zendeskTrigger(merchant),
    },
    previews,
  });
}
