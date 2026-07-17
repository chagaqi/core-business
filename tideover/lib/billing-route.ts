import { z } from "zod";
import { getRepositories } from "@/lib/repositories";
import { getTenantSession } from "@/lib/tenant";
import { createCheckoutSession, createPortalSession } from "@/lib/billing/stripe";
import type { Merchant } from "@/lib/types";

/**
 * Injectable cores for the billing routes (ADR-0022), owner-only, following the
 * exact auth shape of lib/team-route.ts: the merchant resolves from the SESSION
 * sub only (no merchant id from the client), and mutations/redirects require
 * ownerSub === session sub. Stripe hosts Checkout + the Billing Portal, so these
 * only mint a hosted URL and hand it back; the money truth arrives via the webhook.
 */

function json(status: number, body: unknown): Response {
  return Response.json(body, { status });
}

const ORIGIN = (process.env.APP_BASE_URL || process.env.APP_URL || "https://app.tideover.app").replace(/\/$/, "");

async function resolveOwner(): Promise<{ merchant: Merchant; email: string | null } | Response> {
  const session = await getTenantSession();
  if (!session) return json(401, { error: "sign in to manage billing" });
  const merchant = await getRepositories().merchants.findByMemberOrOwnerSub(session.sub);
  if (!merchant) return json(404, { error: "no workspace for this account" });
  if (merchant.ownerSub !== session.sub) return json(403, { error: "only the workspace owner can manage billing" });
  return { merchant, email: session.email ?? null };
}

const CheckoutBody = z.object({
  plan: z.enum(["starter", "growth", "scale"]),
  interval: z.enum(["month", "year"]),
});

/** POST /api/billing/checkout — start a subscription Checkout for a plan; returns { url }. */
export async function handleCheckoutPOST(req: Request): Promise<Response> {
  const ctx = await resolveOwner();
  if (ctx instanceof Response) return ctx;

  // An active subscriber changes plan through the Billing Portal (which modifies
  // the existing subscription), NOT a fresh Checkout — a new Checkout mints a
  // second subscription and double-bills them.
  if (ctx.merchant.subscriptionStatus === "active" && ctx.merchant.stripeCustomerId) {
    return json(409, { error: "you're already subscribed — use Manage billing to change your plan", useBillingPortal: true });
  }

  const parsed = CheckoutBody.safeParse(await req.json().catch(() => null));
  if (!parsed.success) return json(400, { error: "choose a plan and a monthly/annual interval" });

  const result = await createCheckoutSession({
    merchantId: ctx.merchant.id,
    plan: parsed.data.plan,
    interval: parsed.data.interval,
    successUrl: `${ORIGIN}/app/billing?checkout=success`,
    cancelUrl: `${ORIGIN}/app/billing?checkout=cancelled`,
    customerEmail: ctx.email ?? undefined,
    // Reuse the customer if one exists (a prior/canceled subscriber returning).
    stripeCustomerId: ctx.merchant.stripeCustomerId ?? undefined,
  });
  if ("error" in result) return json(502, { error: "could not start checkout", detail: result.error });
  return json(200, { url: result.url });
}

/** POST /api/billing/portal — open the Stripe Billing Portal for an existing customer. */
export async function handlePortalPOST(): Promise<Response> {
  const ctx = await resolveOwner();
  if (ctx instanceof Response) return ctx;
  const customerId = ctx.merchant.stripeCustomerId;
  if (!customerId) return json(400, { error: "no billing account yet — choose a plan first" });

  const result = await createPortalSession({ stripeCustomerId: customerId, returnUrl: `${ORIGIN}/app/billing` });
  if ("error" in result) return json(502, { error: "could not open the billing portal", detail: result.error });
  return json(200, { url: result.url });
}
