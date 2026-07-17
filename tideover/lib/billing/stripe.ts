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
  /** attach an existing Stripe customer (a returning/prior subscriber) so we never mint a duplicate. */
  stripeCustomerId?: string;
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
  // Reuse the existing customer when we have one; Stripe rejects customer +
  // customer_email together, so it's one or the other.
  if (args.stripeCustomerId) params.customer = args.stripeCustomerId;
  else if (args.customerEmail) params.customer_email = args.customerEmail;

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
 * Create a Stripe Billing Portal session for an existing customer — the canonical
 * place to change plan, update payment, view invoices, or cancel. Returns its URL.
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
  const pairs = sigHeader.split(",").map((kv) => kv.split("=", 2) as [string, string]);
  const t = Number(pairs.find(([k]) => k === "t")?.[1]);
  // Stripe includes ONE v1 per active signing secret — TWO during a secret
  // rotation. Accept if ANY matches; clobbering to the last (as Object.fromEntries
  // did) silently fails verification for the whole rotation window.
  const v1s = pairs.filter(([k]) => k === "v1").map(([, v]) => v);
  if (!t || v1s.length === 0) return false;
  if (Math.abs(now / 1000 - t) > toleranceSec) return false;

  const a = Buffer.from(createHmac("sha256", secret).update(`${t}.${payload}`).digest("hex"));
  return v1s.some((v1) => {
    const b = Buffer.from(v1);
    if (a.length !== b.length) return false;
    try {
      return timingSafeEqual(a, b);
    } catch {
      return false;
    }
  });
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
    const rawStatus = String(obj.status ?? "");
    // Ignore in-flight/incomplete states: the definitive state arrives via
    // checkout.session.completed or a later `active` update. Acting on an
    // "incomplete" (card still settling, e.g. 3-D Secure) would cancel a paid
    // signup mid-flight if it landed after the completion event.
    if (!deleted && (rawStatus === "incomplete" || rawStatus === "incomplete_expired")) return null;

    const metaPlan = (meta.plan as PlanKey) ?? null;
    const items = obj.items as { data?: { price?: { id?: string } }[] } | undefined;
    const priceId = items?.data?.[0]?.price?.id;
    // Preserve the plan the merchant is paying for. When the price id isn't in our
    // map (create-products re-run with new ids, or a dashboard edit to an unwired
    // price), fall back to the plan we stamped in the subscription metadata at
    // checkout — never silently null an ACTIVE plan back to default entitlements.
    const plan = deleted ? null : priceId ? (planForPriceId(priceId) ?? metaPlan) : metaPlan;
    return {
      merchantId,
      plan,
      subscriptionStatus: deleted ? "canceled" : mapStatus(rawStatus),
      stripeCustomerId: typeof obj.customer === "string" ? obj.customer : null,
    };
  }

  return null;
}
