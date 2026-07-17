import { NextResponse } from "next/server";
import { getRepositories } from "@/lib/repositories";
import { verifyStripeSignature, billingUpdateFromEvent } from "@/lib/billing/stripe";

/**
 * POST /api/stripe/webhook — the money truth (ADR-0022). NOT in the middleware
 * matcher: like the ingest + cron endpoints it authenticates on its OWN signature
 * (Stripe-Signature), verified over the RAW body before any parse, exactly the
 * discipline lib/ingest-auth.ts established.
 *
 * FAIL CLOSED in production: no STRIPE_WEBHOOK_SECRET → 500, a bad signature →
 * 400, so a live deploy never applies an unverified plan change. In demo/dev an
 * unset secret is allowed (unsigned) so the flow is testable against the seed.
 *
 * The `plan`, `subscriptionStatus`, and `stripeCustomerId` fields are written
 * ONLY here — the client never asserts its own plan. Updates are idempotent, so a
 * Stripe retry is safe; an apply failure returns 500 to earn a retry.
 */
export const dynamic = "force-dynamic";

export async function POST(req: Request): Promise<Response> {
  const secret = process.env.STRIPE_WEBHOOK_SECRET;
  const payload = await req.text();

  if (secret) {
    if (!verifyStripeSignature(payload, req.headers.get("stripe-signature"), secret, Date.now())) {
      return NextResponse.json({ error: "bad signature" }, { status: 400 });
    }
  } else if (process.env.NODE_ENV === "production") {
    console.error(JSON.stringify({ event: "stripe.webhook.no-secret" }));
    return NextResponse.json({ error: "webhook secret not configured" }, { status: 500 });
  }

  let event: unknown;
  try {
    event = JSON.parse(payload);
  } catch {
    return NextResponse.json({ error: "bad payload" }, { status: 400 });
  }

  const update = billingUpdateFromEvent(event);
  if (!update) return NextResponse.json({ received: true, applied: false });

  try {
    const repos = getRepositories();
    const merchant = await repos.merchants.findById(update.merchantId);
    if (!merchant) return NextResponse.json({ received: true, applied: false, reason: "merchant-not-found" });
    await repos.merchants.update(update.merchantId, {
      plan: update.plan,
      subscriptionStatus: update.subscriptionStatus,
      stripeCustomerId: update.stripeCustomerId,
    });
    return NextResponse.json({ received: true, applied: true });
  } catch (err) {
    console.error(
      JSON.stringify({
        event: "stripe.webhook.apply-failed",
        merchantId: update.merchantId,
        error: err instanceof Error ? err.message : String(err),
      }),
    );
    // 500 so Stripe retries (the update is idempotent, so a retry is safe).
    return NextResponse.json({ error: "apply failed" }, { status: 500 });
  }
}
