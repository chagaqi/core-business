import assert from "node:assert/strict";
import { createHmac } from "node:crypto";
import { afterEach, beforeEach, test } from "node:test";
import { POST } from "@/app/api/stripe/webhook/route";

/**
 * The Stripe webhook route (ADR-0022) — the money-truth endpoint. Verifies the
 * signature over the raw body, fails closed in production without a secret, and
 * maps events to merchant updates. Tests use a NON-EXISTENT merchant id so the
 * verify/parse/fail-closed logic is exercised without mutating shared seed data.
 */

const ENV = ["STRIPE_WEBHOOK_SECRET", "NODE_ENV"] as const;
const saved: Record<string, string | undefined> = {};
beforeEach(() => {
  for (const k of ENV) saved[k] = process.env[k];
});
afterEach(() => {
  for (const k of ENV) {
    if (saved[k] === undefined) delete process.env[k];
    else process.env[k] = saved[k];
  }
});

const SECRET = "whsec_test";
function signed(payload: string, secret = SECRET, t = Math.floor(Date.now() / 1000)): string {
  const v1 = createHmac("sha256", secret).update(`${t}.${payload}`).digest("hex");
  return `t=${t},v1=${v1}`;
}
function post(payload: string, sig?: string): Request {
  const headers: Record<string, string> = { "content-type": "application/json" };
  if (sig) headers["stripe-signature"] = sig;
  return new Request("https://app.tideover.app/api/stripe/webhook", { method: "POST", body: payload, headers });
}

const evtFor = (merchantId: string) =>
  JSON.stringify({
    type: "checkout.session.completed",
    data: { object: { client_reference_id: merchantId, customer: "cus_x", metadata: { plan: "growth", merchantId } } },
  });

test("webhook: a valid signature is accepted and the pipeline runs (unknown merchant → applied:false)", async () => {
  process.env.STRIPE_WEBHOOK_SECRET = SECRET;
  const payload = evtFor("mch_does_not_exist");
  const res = await POST(post(payload, signed(payload)));
  assert.equal(res.status, 200);
  const body = (await res.json()) as { received: boolean; applied: boolean; reason?: string };
  assert.equal(body.received, true);
  assert.equal(body.applied, false);
  assert.equal(body.reason, "merchant-not-found");
});

test("webhook: a bad or missing signature is rejected with 400 when a secret is set", async () => {
  process.env.STRIPE_WEBHOOK_SECRET = SECRET;
  const payload = evtFor("mch_x");
  assert.equal((await POST(post(payload, "t=1,v1=deadbeef"))).status, 400);
  assert.equal((await POST(post(payload))).status, 400); // no header
  assert.equal((await POST(post(payload, signed(payload, "whsec_wrong")))).status, 400); // wrong secret
});

test("webhook: fails closed in production when no secret is configured", async () => {
  delete process.env.STRIPE_WEBHOOK_SECRET;
  process.env.NODE_ENV = "production";
  const res = await POST(post(evtFor("mch_x")));
  assert.equal(res.status, 500);
});

test("webhook: dev without a secret accepts unsigned (testable against the seed)", async () => {
  delete process.env.STRIPE_WEBHOOK_SECRET;
  process.env.NODE_ENV = "test";
  const res = await POST(post(evtFor("mch_does_not_exist")));
  assert.equal(res.status, 200);
});

test("webhook: malformed JSON is 400; an event we don't act on is a clean 200 no-op", async () => {
  process.env.STRIPE_WEBHOOK_SECRET = SECRET;
  const bad = "{not json";
  assert.equal((await POST(post(bad, signed(bad)))).status, 400);

  const irrelevant = JSON.stringify({ type: "invoice.paid", data: { object: {} } });
  const res = await POST(post(irrelevant, signed(irrelevant)));
  assert.equal(res.status, 200);
  assert.equal(((await res.json()) as { applied: boolean }).applied, false);
});
