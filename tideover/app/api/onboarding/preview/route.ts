import { withApiErrorHandling } from "@/lib/api-handler";
import { buildMerchantFromIntake, buildStagePreviews } from "@/lib/onboarding";
import { OnboardingBodySchema } from "@/lib/onboarding-schema";
import { clientIp, createRateLimiter } from "@/lib/rate-limit";

/**
 * POST /api/onboarding/preview (SWAN SPRINT P2, Beat 5 — "drafts before
 * connect"). Runs the EXACT merchant construction + preview generation the real
 * create runs (buildMerchantFromIntake + buildStagePreviews, both pure) on the
 * IN-PROGRESS, UNSAVED config: real confidence bands from the merchant's own
 * stage bands, zero persistence, no partial merchants. Reads no datastore, so
 * it is safe in both demo and real mode; same rate-limit posture as
 * /api/analyze. importRows are ignored by construction — previews always run
 * against the built-in sample customer, clearly labeled SAMPLE in the UI.
 */
export const runtime = "nodejs";

const rateLimited = createRateLimiter(10);

export const POST = withApiErrorHandling(
  "/api/onboarding/preview",
  async (req: Request): Promise<Response> => {
    const ip = clientIp(req);
    if (rateLimited(ip)) return Response.json({ ok: false, reason: "rate-limited" }, { status: 429 });

    const parsed = OnboardingBodySchema.safeParse(await req.json().catch(() => null));
    if (!parsed.success) {
      return Response.json({ ok: false, reason: "invalid-body" }, { status: 400 });
    }

    const { merchant } = buildMerchantFromIntake(parsed.data, null);
    return Response.json({ ok: true, previews: buildStagePreviews(merchant) });
  },
);
