import assert from "node:assert/strict";
import { afterEach, beforeEach, test } from "node:test";
import { getDeliverer, EmailDeliverer, NoopDeliverer } from "@/lib/delivery";

const realFetch = global.fetch;
const ENV = ["DELIVERY_MODE", "RESEND_API_KEY", "EMAIL_FROM"] as const;
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

const msg = {
  to: "backer@example.com",
  subject: "Your order status",
  html: "<p>Here's your status page.</p>",
  unsubscribeUrl: "https://www.tideover.app/unsubscribe/abc.def",
};

// ── selection is safe-by-default ────────────────────────────────────────────────

test("getDeliverer: defaults to Noop; only DELIVERY_MODE=email + a configured sender opts into real send", () => {
  for (const k of ENV) delete process.env[k];
  assert.equal(getDeliverer().kind, "noop", "unset → noop");

  process.env.DELIVERY_MODE = "email"; // but no sender configured
  assert.equal(getDeliverer().kind, "noop", "mode on but no sender → still noop (safe)");

  process.env.RESEND_API_KEY = "test-key";
  process.env.EMAIL_FROM = "updates@mail.tideover.app";
  assert.equal(getDeliverer().kind, "email", "mode on + sender configured → email");
});

// ── Noop never fabricates a receipt ─────────────────────────────────────────────

test("NoopDeliverer: reports manual, never delivered", async () => {
  const r = await new NoopDeliverer().deliver();
  assert.deepEqual(r, { delivered: false, channel: "manual", reason: "manual-send" });
});

// ── EmailDeliverer sends with a one-click unsubscribe ───────────────────────────

test("EmailDeliverer: a 200 send is delivered and carries List-Unsubscribe + a footer link", async () => {
  process.env.RESEND_API_KEY = "test-key";
  process.env.EMAIL_FROM = "updates@mail.tideover.app";
  let captured: Record<string, unknown> = {};
  global.fetch = (async (_url: unknown, init: { body: string }) => {
    captured = JSON.parse(init.body);
    return new Response(JSON.stringify({ id: "eml_9" }), { status: 200 });
  }) as unknown as typeof fetch;

  const r = await new EmailDeliverer().deliver(msg);
  assert.deepEqual(r, { delivered: true, channel: "email", id: "eml_9" });
  const headers = captured.headers as Record<string, string>;
  assert.equal(headers["List-Unsubscribe"], `<${msg.unsubscribeUrl}>`, "one-click unsubscribe header");
  assert.equal(headers["List-Unsubscribe-Post"], "List-Unsubscribe=One-Click");
  assert.ok(String(captured.html).includes(msg.unsubscribeUrl), "footer unsubscribe link present");
});

test("EmailDeliverer: an unconfigured sender surfaces as not-delivered, never throws", async () => {
  for (const k of ENV) delete process.env[k];
  const r = await new EmailDeliverer().deliver(msg);
  assert.equal(r.delivered, false);
  assert.equal(r.channel, "email");
  assert.equal(r.reason, "not-configured");
});
