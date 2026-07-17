import { createHmac, timingSafeEqual } from "crypto";
import type { PlanKey, SubscriptionStatus } from "@/lib/types";
import { priceIdFor, planForPriceId, type Interval } from "@/lib/billing/prices";

/**
 * Stripe integration, raw (ADR-0022) — the codebase talks to Resend, the ingest
 * vendors, and Svix by hand rather than via SDKs, and Stripe is the same: a form
 * POST to create Checkout sessions, and a documented HMAC to verify webhooks. No
 * dependency, and the money-path verification is code we can read and test.
 *
 * The secret is read from env at call time and never returned or logged.
 */

const API = "https://api.stripe.com/v1";

function secretKey(): string | null {
  return process.env.STRIPE_SECRET_KEY || null;
}

/**
 * Create a subscription Checkout session and return its hosted URL. The session
 * carries the merchant id in three places so every later event can find it home:
 * client_reference_id, session metadata, and the SUBSCRIPTION metadata (which is
 * what customer.subscription.* events echo back).
 */
export async function createCheckoutSession(args: {
  merchantId: string;
  plan: PlanKey;
  interval: Interval;
  successUrl: string;
  cancelUrl: string;
  customerEmail?: string;
}): Promise<{ url: string } | { error: string }> {
  const key = secretKey();
  if (!key) return { error: "billing-not-configured" };

  const params: Record<string, string> = {
    mode: "subscription",
    "line_items[0][price]": priceIdFor(args.plan, args.interval),
    "line_items[0][quantity]": "1",
    success_url: args.successUrl,
    cancel_url: args.cancelUrl,
    client_reference_id: args.merchantId,
    "metadata[merchantId]": args.merchantId,
    "metadata[plan]": args.plan,
    "subscription_data[metadata][merchantId]": args.merchantId,
    "subscription_data[metadata][plan]": args.plan,
    allow_promotion_codes: "true",
  };
  if (args.customerEmail) params.customer_email = args.customerEmail;

  try {
    const res = await fetch(`${API}/checkout/sessions`, {
      method: "POST",
      headers: { authorization: `Bearer ${key}`, "content-type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams(params),
    });
    const data = (await res.json()) as { url?: string; error?: { message?: string } };
    if (!res.ok || !data.url) return { error: `stripe-${res.status}:${data.error?.message ?? "no-url"}` };
    return { url: data.url };
  } catch (err) {
    return { error: `checkout-failed:${err instanceof Error ? err.message : String(err)}` };
  }
}

/**
 * Verify a Stripe webhook signature (the `Stripe-Signature: t=…,v1=…` header).
 * Recomputes HMAC-SHA256 over `${t}.${payload}` with the endpoint secret and
 * constant-time compares. Rejects a timestamp outside `toleranceSec` (replay
 * defense). `now` is injected for testability.
 */
export async function createPortalSession(args: {
  stripeCustomerId: string;
  returnUrl: string;
}): Promise<{ url: string } | { error: string }> {
  const key = secretKey();
  if (!key) return { error: "billing-not-configured" };
  try {
    const res = await fetch(`${API}/billing_portal/sessions`, {
      method: "POST",
      headers: { authorization: `Bearer ${key}`, "content-type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({ customer: args.stripeCustomerId, return_url: args.returnUrl }),
    });
    const data = (await res.json()) as { url?: string; error?: { message?: string } };
    if (!res.ok || !data.url) return { error: `stripe-${res.status}:${data.error?.message ?? "no-url"}` };
    return { url: data.url };
  } catch (err) {
    return { error: `portal-failed:${err instanceof Error ? err.message : String(err)}` };
  }
}

export function verifyStripeSignature(
  payload: string,
  sigHeader: string | null,
  secret: string,
  now: number,
  toleranceSec = 300,
): boolean {
  if (!sigHeader) return false;
  const parts = Object.fromEntries(sigHeader.split(",").map((kv) => kv.split("=", 2) as [string, string]));
  const t = Number(parts.t);
  const v1 = parts.v1;
  if (!t || !v1) return false;
  if (Math.abs(now / 1000 - t) > toleranceSec) return false;

  const expected = createHmac("sha256", secret).update(`${t}.${payload}`).digest("hex");
  const a = Buffer.from(expected);
  const b = Buffer.from(v1);
  if (a.length !== b.length) return false;
  try {
    return timingSafeEqual(a, b);
  } catch {
    return false;
  }
}

/** Map Stripe's subscription.status to our narrower lifecycle. */
function mapStatus(stripeStatus: string): SubscriptionStatus {
  switch (stripeStatus) {
    case "active":
      return "active";
    case "trialing":
      return "trialing";
    case "past_due":
    case "unpaid":
      return "past_due";
    default:
      return "canceled"; // canceled, incomplete_expired, incomplete, paused → treat as lapsed
  }
}

/** The merchant fields a billing event resolves to. `null` = the event isn't one we act on. */
export interface BillingUpdate {
  merchantId: string;
  plan: PlanKey | null;
  subscriptionStatus: SubscriptionStatus;
  stripeCustomerId: string | null;
}

/**
 * Map a verified Stripe event to a merchant update, or null to ignore it. Reads
 * the merchant id from the id we planted at checkout (client_reference_id or the
 * metadata that subscription events echo), so no lookup-by-customer is needed.
 */
export function billingUpdateFromEvent(event: unknown): BillingUpdate | null {
  const e = event as { type?: string; data?: { object?: Record<string, unknown> } };
  const obj = e.data?.object;
  if (!e.type || !obj) return null;

  if (e.type === "checkout.session.completed") {
    const merchantId = (obj.client_reference_id as string) || ((obj.metadata as Record<string, string>)?.merchantId ?? "");
    const plan = ((obj.metadata as Record<string, string>)?.plan as PlanKey) ?? null;
    if (!merchantId || !plan) return null;
    return {
      merchantId,
      plan,
      subscriptionStatus: "active",
      stripeCustomerId: typeof obj.customer === "string" ? obj.customer : null,
    };
  }

  if (e.type === "customer.subscription.updated" || e.type === "customer.subscription.deleted") {
    const meta = (obj.metadata as Record<string, string>) ?? {};
    const merchantId = meta.merchantId;
    if (!merchantId) return null;
    const deleted = e.type === "customer.subscription.deleted";
    const status = deleted ? "canceled" : mapStatus(String(obj.status ?? ""));
    // resolve the plan from the subscription's active price when present
    const items = obj.items as { data?: { price?: { id?: string } }[] } | undefined;
    const priceId = items?.data?.[0]?.price?.id;
    const plan = deleted ? null : priceId ? planForPriceId(priceId) : ((meta.plan as PlanKey) ?? null);
    return {
      merchantId,
      plan,
      subscriptionStatus: status,
      stripeCustomerId: typeof obj.customer === "string" ? obj.customer : null,
    };
  }

  return null;
}
