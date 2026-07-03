import assert from "node:assert/strict";
import { createHmac } from "node:crypto";
import { test } from "node:test";
import { verifySvix } from "@/lib/svix";
import { htmlToText, inboxAddressFor, INBOUND_DOMAIN } from "@/lib/inbound";
import { handleResendInbound, type InboundDeps } from "@/lib/inbound-route";
import { getRepositories } from "@/lib/repositories";
import type { ReceivedEmail } from "@/lib/inbound";

// ── Svix signature verification (ADR-0008) ───────────────────────────────────

const KEY_BYTES = Buffer.from("tideover-inbound-webhook-signing-key");
const SECRET = `whsec_${KEY_BYTES.toString("base64")}`;

function svixSign(rawBody: string, id: string, ts: string): string {
  return createHmac("sha256", KEY_BYTES).update(`${id}.${ts}.${rawBody}`).digest("base64");
}

function nowTs(): string {
  return String(Math.floor(Date.now() / 1000));
}

test("verifySvix accepts a correctly-signed payload", () => {
  const raw = JSON.stringify({ type: "email.received", data: { email_id: "e1" } });
  const id = "msg_2xy";
  const ts = nowTs();
  const headers = new Headers({
    "svix-id": id,
    "svix-timestamp": ts,
    "svix-signature": `v1,${svixSign(raw, id, ts)}`,
  });
  assert.equal(verifySvix(raw, headers, SECRET), true);
});

test("verifySvix accepts when the valid signature is one of several entries", () => {
  const raw = JSON.stringify({ hello: "world" });
  const id = "msg_multi";
  const ts = nowTs();
  const good = svixSign(raw, id, ts);
  const headers = new Headers({
    "svix-id": id,
    "svix-timestamp": ts,
    // an old-key signature (garbage here) space-joined with the current one
    "svix-signature": `v1,AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA= v1,${good}`,
  });
  assert.equal(verifySvix(raw, headers, SECRET), true);
});

test("verifySvix rejects a tampered signature", () => {
  const raw = JSON.stringify({ type: "email.received" });
  const id = "msg_bad";
  const ts = nowTs();
  const sig = svixSign(raw, id, ts);
  // flip the first char of the base64 signature
  const tampered = (sig[0] === "A" ? "B" : "A") + sig.slice(1);
  const headers = new Headers({
    "svix-id": id,
    "svix-timestamp": ts,
    "svix-signature": `v1,${tampered}`,
  });
  assert.equal(verifySvix(raw, headers, SECRET), false);
});

test("verifySvix rejects a body that does not match the signature", () => {
  const id = "msg_x";
  const ts = nowTs();
  const sig = svixSign(JSON.stringify({ a: 1 }), id, ts);
  const headers = new Headers({ "svix-id": id, "svix-timestamp": ts, "svix-signature": `v1,${sig}` });
  assert.equal(verifySvix(JSON.stringify({ a: 2 }), headers, SECRET), false);
});

test("verifySvix rejects a stale timestamp (> 5 min skew)", () => {
  const raw = JSON.stringify({ type: "email.received" });
  const id = "msg_stale";
  const staleTs = String(Math.floor(Date.now() / 1000) - 10 * 60); // 10 min ago
  const headers = new Headers({
    "svix-id": id,
    "svix-timestamp": staleTs,
    "svix-signature": `v1,${svixSign(raw, id, staleTs)}`, // correctly signed, but stale
  });
  assert.equal(verifySvix(raw, headers, SECRET), false);
});

test("verifySvix rejects when signature headers are missing", () => {
  assert.equal(verifySvix("{}", new Headers({}), SECRET), false);
});

// ── htmlToText fallback ──────────────────────────────────────────────────────

test("htmlToText strips markup and decodes entities", () => {
  const out = htmlToText("<p>Where is my order?</p><div>Getting &amp; worried</div>");
  assert.equal(out, "Where is my order?\nGetting & worried");
});

// ── Route: simulated email.received → ingest (demo path, stubbed body) ────────

function inboundRequest(payload: unknown): Request {
  return new Request("http://localhost/api/inbound/resend", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify(payload),
  });
}

function receivedEmail(over: Partial<ReceivedEmail> = {}): ReceivedEmail {
  return {
    from: "buyer@example.com",
    to: ["ignored@in.tideover.app"],
    subject: "where is my order??",
    text: "It's been weeks and I'm getting worried. Any update on my order?",
    html: null,
    ...over,
  };
}

test("route: email.received to a seeded merchant's inbox address ingests a ticket, and a redelivery de-dupes", async () => {
  process.env.DEMO_MODE = "true";
  delete process.env.RESEND_WEBHOOK_SECRET;

  const repos = getRepositories();
  const merchant = (await repos.merchants.list())[0];
  assert.ok(merchant?.inboxToken, "seeded merchant must carry an inboxToken");
  const address = inboxAddressFor(merchant.inboxToken);
  assert.ok(address.endsWith(`@${INBOUND_DOMAIN}`));

  const emailId = `email_ingest_${Date.now()}`;
  let fetchCalls = 0;
  const deps: InboundDeps = {
    fetchReceivedEmail: async (id) => {
      fetchCalls += 1;
      assert.equal(id, emailId);
      return receivedEmail({ to: [address] });
    },
  };

  const payload = {
    type: "email.received",
    created_at: new Date().toISOString(),
    data: {
      email_id: emailId,
      from: "buyer@example.com",
      to: [address],
      subject: "where is my order??",
    },
  };

  const res = await handleResendInbound(inboundRequest(payload), deps);
  assert.equal(res.status, 200);
  const body = (await res.json()) as { status: string; ticketId?: string };
  assert.equal(body.status, "ingested");
  assert.ok(body.ticketId);

  // assert via the repo: exactly the ticket we expect, on the email channel.
  const ticket = await repos.tickets.findByExternalId(merchant.id, "email", emailId);
  assert.ok(ticket, "a ticket must exist for the ingested email");
  assert.equal(ticket!.channel, "email");
  assert.equal(ticket!.externalId, emailId);
  assert.equal(ticket!.subject, "where is my order??");
  assert.equal(ticket!.type, "wismo");
  assert.ok(ticket!.draft, "ingest should auto-draft");
  assert.equal(fetchCalls, 1);

  // Resend retries: a redelivery of the SAME email_id must de-dupe, not double-create.
  const res2 = await handleResendInbound(inboundRequest(payload), deps);
  assert.equal(res2.status, 200);
  const body2 = (await res2.json()) as { status: string; ticketId?: string };
  assert.equal(body2.status, "duplicate");
  assert.equal(body2.ticketId, body.ticketId);
});

test("route: an unknown recipient yields no-match and never fetches or ingests", async () => {
  process.env.DEMO_MODE = "true";
  delete process.env.RESEND_WEBHOOK_SECRET;

  const repos = getRepositories();
  const emailId = `email_nomatch_${Date.now()}`;
  let fetchCalls = 0;
  const deps: InboundDeps = {
    fetchReceivedEmail: async () => {
      fetchCalls += 1;
      return receivedEmail();
    },
  };

  const payload = {
    type: "email.received",
    created_at: new Date().toISOString(),
    data: {
      email_id: emailId,
      from: "someone@example.com",
      to: ["definitely-not-a-real-token@in.tideover.app", "plain@customer.com"],
      subject: "hello",
    },
  };

  const res = await handleResendInbound(inboundRequest(payload), deps);
  assert.equal(res.status, 200);
  const body = (await res.json()) as { status: string };
  assert.equal(body.status, "no-match");
  assert.equal(fetchCalls, 0, "must not fetch the body when nothing routes");

  // no ticket anywhere for this email id
  const merchants = await repos.merchants.list();
  for (const m of merchants) {
    const t = await repos.tickets.findByExternalId(m.id, "email", emailId);
    assert.equal(t, null);
  }
});

test("route: non-email.received events are ignored with 200", async () => {
  process.env.DEMO_MODE = "true";
  delete process.env.RESEND_WEBHOOK_SECRET;
  const deps: InboundDeps = { fetchReceivedEmail: async () => receivedEmail() };
  const res = await handleResendInbound(
    inboundRequest({ type: "email.delivered", data: { email_id: "x" } }),
    deps,
  );
  assert.equal(res.status, 200);
  assert.equal(((await res.json()) as { status: string }).status, "ignored");
});

test("route: a configured secret with no/invalid signature is rejected 401 (bare)", async () => {
  process.env.DEMO_MODE = "true";
  process.env.RESEND_WEBHOOK_SECRET = SECRET;
  try {
    const deps: InboundDeps = { fetchReceivedEmail: async () => receivedEmail() };
    const res = await handleResendInbound(
      inboundRequest({ type: "email.received", data: { email_id: "y", to: [] } }),
      deps,
    );
    assert.equal(res.status, 401);
    assert.equal(res.headers.get("content-type"), null); // bare, no JSON body
  } finally {
    delete process.env.RESEND_WEBHOOK_SECRET;
  }
});

test("route (live mode): an unsigned webhook cannot inject a ticket — fails closed", async () => {
  // The #1 security guarantee (ADR-0008): with DEMO_MODE=false and no secret,
  // the unsigned-accept branch is unreachable and a forged/unsigned webhook is
  // rejected before any parse — no ticket is ever created.
  process.env.DEMO_MODE = "false";
  delete process.env.RESEND_WEBHOOK_SECRET;
  try {
    const repos = getRepositories();
    const merchant = (await repos.merchants.list())[0];
    const address = inboxAddressFor(merchant.inboxToken);
    let fetched = false;
    const deps: InboundDeps = {
      fetchReceivedEmail: async () => {
        fetched = true;
        return receivedEmail();
      },
    };
    const payload = {
      type: "email.received",
      created_at: new Date().toISOString(),
      data: { email_id: `forged_${Date.now()}`, from: "attacker@evil.com", to: [address], subject: "inject me" },
    };
    // No svix-* headers at all → forged/unsigned.
    const res = await handleResendInbound(inboundRequest(payload), deps);
    assert.equal(res.status, 401);
    assert.equal(fetched, false); // never reached the body fetch or ingest
  } finally {
    delete process.env.DEMO_MODE;
  }
});

test("route: a correctly-signed payload passes the gate and ingests", async () => {
  process.env.DEMO_MODE = "true";
  process.env.RESEND_WEBHOOK_SECRET = SECRET;
  try {
    const repos = getRepositories();
    const merchant = (await repos.merchants.list())[0];
    const address = inboxAddressFor(merchant.inboxToken);
    const emailId = `email_signed_${Date.now()}`;
    const payload = {
      type: "email.received",
      created_at: new Date().toISOString(),
      data: { email_id: emailId, from: "buyer2@example.com", to: [address], subject: "any update?" },
    };
    const raw = JSON.stringify(payload);
    const id = "msg_signed";
    const ts = nowTs();
    const req = new Request("http://localhost/api/inbound/resend", {
      method: "POST",
      headers: {
        "content-type": "application/json",
        "svix-id": id,
        "svix-timestamp": ts,
        "svix-signature": `v1,${svixSign(raw, id, ts)}`,
      },
      body: raw,
    });
    const deps: InboundDeps = { fetchReceivedEmail: async () => receivedEmail({ to: [address] }) };
    const res = await handleResendInbound(req, deps);
    assert.equal(res.status, 200);
    assert.equal(((await res.json()) as { status: string }).status, "ingested");
    const ticket = await repos.tickets.findByExternalId(merchant.id, "email", emailId);
    assert.ok(ticket);
  } finally {
    delete process.env.RESEND_WEBHOOK_SECRET;
  }
});
