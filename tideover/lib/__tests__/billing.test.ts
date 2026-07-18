import assert from "node:assert/strict";
import { createHmac } from "node:crypto";
import { afterEach, beforeEach, test } from "node:test";
import { priceIdFor, planForPriceId } from "@/lib/billing/prices";
import {
  createCheckoutSession,
  verifyStripeSignature,
  billingUpdateFromEvent,
} from "@/lib/billing/stripe";

const realFetch = global.fetch;
const ENV = ["STRIPE_SECRET_KEY", "STRIPE_PRICE_STARTER_MONTHLY"] as const;
const saved: Record<string, string | undefined> = {};

beforeEach(() => {
  for (const k of ENV) saved[k] = process.env[k];
});
afterEach(() => {
  global.fetch = realFetch;
  for (const k of ENV) {
    if (saved[k] === undefined) delete process.env[k];
    else process.env[k] = saved[k];
  }
});

// ── prices ──────────────────────────────────────────────────────────────────────

test("prices: test ids resolve, env overrides win, and the plan round-trips", () => {
  delete process.env.STRIPE_PRICE_STARTER_MONTHLY;
  const testId = priceIdFor("starter", "month");
  assert.ok(testId.startsWith("price_"), "falls back to the committed test id");
  assert.equal(planForPriceId(testId), "starter", "reverse lookup finds the plan");
  assert.equal(planForPriceId("price_unknown"), null);

  process.env.STRIPE_PRICE_STARTER_MONTHLY = "price_LIVEoverride";
  assert.equal(priceIdFor("starter", "month"), "price_LIVEoverride", "env (live) overrides the default");
  assert.equal(planForPriceId("price_LIVEoverride"), "starter", "reverse lookup honors the override too");
});

// ── webhook signature ─────────────────────────────────────────────────────────────

test("verifyStripeSignature: a correctly-signed recent payload passes; everything else fails", () => {
  const secret = "whsec_test";
  const payload = '{"id":"evt_1","type":"checkout.session.completed"}';
  const now = 1_800_000_000_000; // fixed ms
  const t = Math.floor(now / 1000);
  const good = createHmac("sha256", secret).update(`${t}.${payload}`).digest("hex");

  assert.equal(verifyStripeSignature(payload, `t=${t},v1=${good}`, secret, now), true, "valid");
  assert.equal(verifyStripeSignature(payload, `t=${t},v1=${good}`, "whsec_wrong", now), false, "wrong secret");
  assert.equal(verifyStripeSignature(payload + " ", `t=${t},v1=${good}`, secret, now), false, "tampered payload");
  assert.equal(verifyStripeSignature(payload, `t=${t - 10_000},v1=${good}`, secret, now), false, "stale timestamp");
  assert.equal(verifyStripeSignature(payload, null, secret, now), false, "missing header");
  assert.equal(verifyStripeSignature(payload, "garbage", secret, now), false, "malformed header");
});

test("verifyStripeSignature: accepts when ANY v1 matches — a secret rotation sends two", () => {
  const secret = "whsec_test";
  const payload = '{"id":"evt_2"}';
  const now = 1_800_000_000_000;
  const t = Math.floor(now / 1000);
  const good = createHmac("sha256", secret).update(`${t}.${payload}`).digest("hex");
  assert.equal(verifyStripeSignature(payload, `t=${t},v1=deadbeef,v1=${good}`, secret, now), true, "good sig second");
  assert.equal(verifyStripeSignature(payload, `t=${t},v1=${good},v1=deadbeef`, secret, now), true, "good sig first");
  assert.equal(verifyStripeSignature(payload, `t=${t},v1=dead,v1=beef`, secret, now), false, "neither matches");
});

test("billingUpdateFromEvent: ignores in-flight 'incomplete'; preserves the paid plan when the price id is unknown", () => {
  // an incomplete (card still settling) update must not cancel a paid signup
  assert.equal(
    billingUpdateFromEvent({
      type: "customer.subscription.updated",
      data: { object: { metadata: { merchantId: "m" }, status: "incomplete" } },
    }),
    null,
  );
  // an unrecognized price on an ACTIVE sub falls back to the metadata plan, never null
  const u = billingUpdateFromEvent({
    type: "customer.subscription.updated",
    data: {
      object: {
        metadata: { merchantId: "m", plan: "growth" },
        customer: "cus_1",
        status: "active",
        items: { data: [{ price: { id: "price_unwired_new" } }] },
      },
    },
  });
  assert.deepEqual(u, { merchantId: "m", plan: "growth", subscriptionStatus: "active", stripeCustomerId: "cus_1" });
});

// ── event → merchant update ───────────────────────────────────────────────────────

test("billingUpdateFromEvent: checkout completion activates the plan the session carried", () => {
  const u = billingUpdateFromEvent({
    type: "checkout.session.completed",
    data: { object: { client_reference_id: "mch_1", customer: "cus_9", metadata: { plan: "growth", merchantId: "mch_1" } } },
  });
  assert.deepEqual(u, { merchantId: "mch_1", plan: "growth", subscriptionStatus: "active", stripeCustomerId: "cus_9" });
});

test("billingUpdateFromEvent: subscription updates map status + plan; deletion cancels and clears the plan", () => {
  const price = priceIdFor("scale", "month");
  const updated = billingUpdateFromEvent({
    type: "customer.subscription.updated",
    data: { object: { metadata: { merchantId: "mch_2" }, customer: "cus_2", status: "past_due", items: { data: [{ price: { id: price } }] } } },
  });
  assert.deepEqual(updated, { merchantId: "mch_2", plan: "scale", subscriptionStatus: "past_due", stripeCustomerId: "cus_2" });

  const deleted = billingUpdateFromEvent({
    type: "customer.subscription.deleted",
    data: { object: { metadata: { merchantId: "mch_2" }, customer: "cus_2", status: "canceled" } },
  });
  assert.deepEqual(deleted, { merchantId: "mch_2", plan: null, subscriptionStatus: "canceled", stripeCustomerId: "cus_2" });
});

test("billingUpdateFromEvent: an event we don't act on, or one missing the merchant id, is ignored", () => {
  assert.equal(billingUpdateFromEvent({ type: "invoice.paid", data: { object: {} } }), null);
  assert.equal(billingUpdateFromEvent({ type: "checkout.session.completed", data: { object: { metadata: {} } } }), null);
  assert.equal(billingUpdateFromEvent({}), null);
});

// ── checkout session ──────────────────────────────────────────────────────────────

test("createCheckoutSession: unconfigured returns an error, never throws", async () => {
  delete process.env.STRIPE_SECRET_KEY;
  const r = await createCheckoutSession({ merchantId: "m", plan: "starter", interval: "month", successUrl: "s", cancelUrl: "c" });
  assert.deepEqual(r, { error: "billing-not-configured" });
});

test("createCheckoutSession: a 200 returns the hosted url; a Stripe error is surfaced, not thrown", async () => {
  process.env.STRIPE_SECRET_KEY = "sk_test_x";
  global.fetch = (async () =>
    new Response(JSON.stringify({ url: "https://checkout.stripe.com/c/pay/cs_test_1" }), { status: 200 })) as typeof fetch;
  const ok = await createCheckoutSession({ merchantId: "m", plan: "growth", interval: "year", successUrl: "s", cancelUrl: "c" });
  assert.deepEqual(ok, { url: "https://checkout.stripe.com/c/pay/cs_test_1" });

  global.fetch = (async () =>
    new Response(JSON.stringify({ error: { message: "No such price" } }), { status: 400 })) as typeof fetch;
  const bad = await createCheckoutSession({ merchantId: "m", plan: "growth", interval: "year", successUrl: "s", cancelUrl: "c" });
  assert.ok("error" in bad && bad.error.includes("stripe-400"));
});
