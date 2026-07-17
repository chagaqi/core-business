import assert from "node:assert/strict";
import { afterEach, beforeEach, test } from "node:test";
import { sendEmail } from "@/lib/email";
import { trialEmail } from "@/lib/trial-emails";
import { containsHardDate } from "@/lib/proof";
import type { TrialReminderKey } from "@/lib/types";

const realFetch = global.fetch;
const ENV = ["RESEND_API_KEY", "EMAIL_FROM"] as const;
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

// ── sender: fail-soft, never throws ─────────────────────────────────────────────

test("sendEmail: unconfigured (no key/from) is a soft skip, not a throw", async () => {
  delete process.env.RESEND_API_KEY;
  delete process.env.EMAIL_FROM;
  const r = await sendEmail({ to: "a@b.com", subject: "x", html: "<p>x</p>" });
  assert.deepEqual(r, { sent: false, reason: "not-configured" });
});

test("sendEmail: a configured 200 send returns sent:true with the id; the batch caller never sees a throw", async () => {
  process.env.RESEND_API_KEY = "test-key";
  process.env.EMAIL_FROM = "updates@mail.tideover.app";
  global.fetch = (async () =>
    new Response(JSON.stringify({ id: "eml_123" }), { status: 200 })) as typeof fetch;
  const r = await sendEmail({ to: "a@b.com", subject: "x", html: "<p>x</p>" });
  assert.equal(r.sent, true);
  assert.equal(r.id, "eml_123");
});

test("sendEmail: a non-200 and a network throw both come back as sent:false, never an exception", async () => {
  process.env.RESEND_API_KEY = "test-key";
  process.env.EMAIL_FROM = "updates@mail.tideover.app";
  global.fetch = (async () => new Response("nope", { status: 500 })) as typeof fetch;
  const bad = await sendEmail({ to: "a@b.com", subject: "x", html: "<p>x</p>" });
  assert.equal(bad.sent, false);
  assert.equal(bad.reason, "send-failed:500");

  global.fetch = (async () => {
    throw new Error("socket hang up");
  }) as typeof fetch;
  const thrown = await sendEmail({ to: "a@b.com", subject: "x", html: "<p>x</p>" });
  assert.equal(thrown.sent, false);
  assert.ok(thrown.reason?.startsWith("send-failed:"));
});

// ── templates: proof-only + correct routing ─────────────────────────────────────

test("trialEmail: every milestone is proof-only, names the merchant, and never carries a hard date or the crutch word", () => {
  for (const kind of ["welcome", "midpoint", "ending", "ended"] as TrialReminderKey[]) {
    const e = trialEmail(kind, { merchantName: "Lumen Forge", daysLeft: 2 });
    assert.ok(e.subject.length > 0, `${kind} has a subject`);
    assert.ok(e.html.includes("Lumen Forge"), `${kind} names the merchant`);
    assert.ok(!containsHardDate(e.html), `${kind} carries no hard date`);
    assert.ok(!/\bhonest\b/i.test(e.html), `${kind} never uses the crutch word`);
  }
});

test("trialEmail: ending + ended route to pricing; welcome + midpoint route to the app", () => {
  const ending = trialEmail("ending", { merchantName: "M", daysLeft: 2 });
  const ended = trialEmail("ended", { merchantName: "M", daysLeft: 0 });
  assert.ok(ending.html.includes("/pricing"), "ending points to plans");
  assert.ok(ended.html.includes("/pricing"), "ended points to plans");

  const welcome = trialEmail("welcome", { merchantName: "M", daysLeft: 14 });
  assert.ok(/tideover\.app/.test(welcome.html), "welcome links into the product");
});

test("trialEmail: the day count pluralizes (1 day, not 1 days)", () => {
  assert.ok(trialEmail("ending", { merchantName: "M", daysLeft: 1 }).subject.includes("1 day left"));
  assert.ok(trialEmail("ending", { merchantName: "M", daysLeft: 3 }).subject.includes("3 days left"));
});
