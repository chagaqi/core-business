import assert from "node:assert/strict";
import { test } from "node:test";
import {
  deriveWebhookSecret,
  signWebhookBody,
  verifyWebhookSig,
  SIGNATURE_HEADER,
} from "@/lib/webhook-secret";
import { CanonicalIngestSchema, normalizeCanonical } from "@/lib/ingest-schema";
import { handleCanonicalIngest } from "@/lib/ingest-route";
import { gorgiasHttpIntegration, zendeskTrigger, webhookIngestUrl } from "@/lib/ingest-templates";
import { getRepositories } from "@/lib/repositories";

/**
 * Per-merchant helpdesk webhook ingest (ADR-0011, task W2). Mirrors the seam
 * style of inbound.test.ts: the route core is exercised as a plain function with
 * a Web-standard Request, no Next runtime.
 */

// ── (a) signature verification ────────────────────────────────────────────────

test("verifyWebhookSig accepts a correct signature and rejects a bad one", () => {
  const secret = "test-merchant-secret";
  const raw = JSON.stringify({ external_id: "t1", body: "hi" });
  const good = `sha256=${signWebhookBody(raw, secret)}`;
  assert.equal(verifyWebhookSig(raw, good, secret), true);

  // bare hex (no prefix) also accepted
  assert.equal(verifyWebhookSig(raw, signWebhookBody(raw, secret), secret), true);

  // tampered signature
  const sig = signWebhookBody(raw, secret);
  const tampered = (sig[0] === "a" ? "b" : "a") + sig.slice(1);
  assert.equal(verifyWebhookSig(raw, `sha256=${tampered}`, secret), false);

  // right signature, different body → reject
  assert.equal(verifyWebhookSig(JSON.stringify({ external_id: "t2" }), good, secret), false);

  // wrong secret → reject
  assert.equal(verifyWebhookSig(raw, good, "other-secret"), false);

  // missing header / empty secret → reject
  assert.equal(verifyWebhookSig(raw, null, secret), false);
  assert.equal(verifyWebhookSig(raw, good, ""), false);
});

test("deriveWebhookSecret is deterministic and token-scoped", () => {
  delete process.env.WEBHOOK_ROOT_SECRET;
  const a = deriveWebhookSecret("tokenAAA");
  const b = deriveWebhookSecret("tokenAAA");
  const c = deriveWebhookSecret("tokenBBB");
  assert.equal(a, b, "same token → same secret");
  assert.notEqual(a, c, "different token → different secret");
  assert.match(a, /^[0-9a-f]{64}$/, "hex sha256");
});

// ── canonical schema + normalizer ─────────────────────────────────────────────

test("normalizeCanonical maps the canonical payload onto a NormalizedTicket", () => {
  const parsed = CanonicalIngestSchema.parse({
    external_id: "gorgias-991",
    customer_email: "buyer@example.com",
    subject: "where is my order",
    body: "It has been weeks and I'm getting worried about a refund/chargeback.",
    tags: ["presale"],
    order_ref: "ord_x",
    created_at: "2026-07-01T00:00:00.000Z",
  });
  const n = normalizeCanonical(parsed, "mch_test");
  assert.equal(n.merchantId, "mch_test");
  assert.equal(n.externalId, "gorgias-991");
  assert.equal(n.customerEmail, "buyer@example.com");
  assert.equal(n.orderRef, "ord_x");
  assert.equal(n.channel, "email");
  assert.equal(n.createdAt, "2026-07-01T00:00:00.000Z");
  assert.equal(n.type, "refund"); // keyword inference
  assert.equal(n.sentiment, "chargeback-threat");

  // created_at defaults to now when omitted
  const n2 = normalizeCanonical(
    CanonicalIngestSchema.parse({ external_id: "x", customer_email: "a@b.c", subject: "s", body: "b" }),
    "mch_test",
  );
  assert.ok(!Number.isNaN(Date.parse(n2.createdAt)));
  assert.equal(n2.orderRef, null);
});

// ── (5) template generators (pure) ────────────────────────────────────────────

test("gorgias/zendesk templates carry the per-merchant URL, derived secret, canonical body", () => {
  delete process.env.WEBHOOK_ROOT_SECRET;
  const merchant = { id: "mch_x", inboxToken: "tok_123" } as Parameters<typeof gorgiasHttpIntegration>[0];

  const g = gorgiasHttpIntegration(merchant);
  assert.ok(g.url.endsWith("/api/ingest/gorgias/tok_123"));
  assert.equal(g.secret, deriveWebhookSecret("tok_123"));
  const gbody = JSON.parse(g.bodyTemplate) as Record<string, unknown>;
  for (const key of ["external_id", "customer_email", "subject", "body", "tags"]) {
    assert.ok(key in gbody, `gorgias body maps ${key}`);
  }
  assert.equal(gbody.external_id, "{{ticket.id}}");
  assert.ok(g.instructions.length > 0);

  const z = zendeskTrigger(merchant);
  assert.ok(z.url.endsWith("/api/ingest/zendesk/tok_123"));
  const zbody = JSON.parse(z.bodyTemplate) as Record<string, unknown>;
  assert.equal(zbody.customer_email, "{{ticket.requester.email}}");
  assert.equal(webhookIngestUrl("tok_123"), g.url.replace("/gorgias/", "/webhook/"));
});

// ── (b)(c) route core ─────────────────────────────────────────────────────────

function ingestRequest(payload: unknown, headers: Record<string, string> = {}): Request {
  return new Request("http://localhost/api/ingest/webhook/tok", {
    method: "POST",
    headers: { "content-type": "application/json", ...headers },
    body: typeof payload === "string" ? payload : JSON.stringify(payload),
  });
}

test("route: a canonical payload to a seeded merchant's token ingests, and a redelivery de-dupes", async () => {
  process.env.DEMO_MODE = "true";
  delete process.env.WEBHOOK_ROOT_SECRET;

  const repos = getRepositories();
  const merchant = (await repos.merchants.list())[0];
  assert.ok(merchant?.inboxToken, "seeded merchant must carry an inboxToken");

  const externalId = `wh_${Date.now()}_${Math.random().toString(36).slice(2)}`;
  const payload = {
    external_id: externalId,
    customer_email: "buyer@example.com",
    subject: "where is my order??",
    body: "It's been weeks and I'm getting worried. Any update?",
    tags: ["presale"],
    created_at: new Date().toISOString(),
  };

  const res = await handleCanonicalIngest(ingestRequest(payload), "webhook", merchant.inboxToken);
  assert.equal(res.status, 200);
  const body = (await res.json()) as { status: string; ticketId?: string };
  assert.equal(body.status, "ingested");
  assert.ok(body.ticketId);

  const ticket = await repos.tickets.findByExternalId(merchant.id, "email", externalId);
  assert.ok(ticket, "a ticket must exist for the ingested webhook");
  assert.equal(ticket!.channel, "email");
  assert.equal(ticket!.externalId, externalId);
  assert.equal(ticket!.subject, "where is my order??");
  assert.equal(ticket!.type, "wismo");
  // buyer@example.com matches no seeded backer and no order_ref, so ingest must
  // NOT borrow a stranger's order (the old data-provenance bug). It ties the ticket
  // to a placeholder customer keyed by the real sender, order-less + flagged for
  // manual match, with no order-derived draft.
  assert.equal(ticket!.orderId, "", "unmatched inbound must not attach a stranger's order");
  assert.ok(ticket!.tags.includes("presale:unmatched"), "unmatched inbound is flagged for manual match");
  assert.ok(!ticket!.draft, "no order → no order-derived draft");
  const sender = await repos.customers.findById(ticket!.customerId);
  assert.equal(sender?.email, "buyer@example.com", "ticket is tied to its real sender, not a stranger");

  // redelivery of the SAME external_id de-dupes, not double-creates
  const res2 = await handleCanonicalIngest(ingestRequest(payload), "webhook", merchant.inboxToken);
  assert.equal(res2.status, 200);
  const body2 = (await res2.json()) as { status: string; ticketId?: string };
  assert.equal(body2.status, "duplicate");
  assert.equal(body2.ticketId, body.ticketId);
});

test("route: an unknown token yields 404 and never ingests", async () => {
  process.env.DEMO_MODE = "true";
  delete process.env.WEBHOOK_ROOT_SECRET;

  const externalId = `wh_unknown_${Date.now()}`;
  const res = await handleCanonicalIngest(
    ingestRequest({ external_id: externalId, customer_email: "x@y.z", subject: "s", body: "b" }),
    "webhook",
    "definitely-not-a-real-inbox-token",
  );
  assert.equal(res.status, 404);

  const repos = getRepositories();
  for (const m of await repos.merchants.list()) {
    assert.equal(await repos.tickets.findByExternalId(m.id, "email", externalId), null);
  }
});

test("route: an unknown channel is rejected 400", async () => {
  process.env.DEMO_MODE = "true";
  delete process.env.WEBHOOK_ROOT_SECRET;
  const repos = getRepositories();
  const merchant = (await repos.merchants.list())[0];
  const res = await handleCanonicalIngest(
    ingestRequest({ external_id: "x", customer_email: "a@b.c", subject: "s", body: "b" }),
    "ftp",
    merchant.inboxToken,
  );
  assert.equal(res.status, 400);
});

test("route: a malformed / off-schema body is rejected 400", async () => {
  process.env.DEMO_MODE = "true";
  delete process.env.WEBHOOK_ROOT_SECRET;
  const repos = getRepositories();
  const merchant = (await repos.merchants.list())[0];

  const bad = await handleCanonicalIngest(ingestRequest("{not json"), "webhook", merchant.inboxToken);
  assert.equal(bad.status, 400);

  // valid JSON but missing required external_id
  const offschema = await handleCanonicalIngest(
    ingestRequest({ customer_email: "a@b.c", subject: "s", body: "b" }),
    "webhook",
    merchant.inboxToken,
  );
  assert.equal(offschema.status, 400);
});

test("route (live mode): an unsigned/forged POST is rejected and no ticket is created — fails closed", async () => {
  // The #1 guarantee (ADR-0011): with DEMO_MODE=false and a root secret set, the
  // unsigned-accept branch is unreachable; a forged/unsigned webhook is rejected
  // before any parse. And identity is bound to the URL token + the token-derived
  // secret, so a captured body cannot be replayed at another merchant's token.
  process.env.DEMO_MODE = "false";
  process.env.WEBHOOK_ROOT_SECRET = "root-secret-live";
  try {
    const repos = getRepositories();
    const merchant = (await repos.merchants.list())[0];
    const externalId = `wh_forged_${Date.now()}`;
    const payload = {
      external_id: externalId,
      customer_email: "attacker@evil.com",
      subject: "inject me",
      body: "no signature",
    };

    // (1) no signature header at all → 401
    const unsigned = await handleCanonicalIngest(
      ingestRequest(payload),
      "webhook",
      merchant.inboxToken,
    );
    assert.equal(unsigned.status, 401);

    // (2) a signature made with the WRONG secret → 401
    const forged = await handleCanonicalIngest(
      ingestRequest(payload, { [SIGNATURE_HEADER]: `sha256=${signWebhookBody(JSON.stringify(payload), "wrong")}` }),
      "webhook",
      merchant.inboxToken,
    );
    assert.equal(forged.status, 401);

    // no ticket was ever created
    assert.equal(await repos.tickets.findByExternalId(merchant.id, "email", externalId), null);

    // (3) a correctly-signed POST passes the gate and ingests
    const raw = JSON.stringify(payload);
    const secret = deriveWebhookSecret(merchant.inboxToken);
    const signed = await handleCanonicalIngest(
      new Request("http://localhost/api/ingest/webhook/tok", {
        method: "POST",
        headers: { "content-type": "application/json", [SIGNATURE_HEADER]: `sha256=${signWebhookBody(raw, secret)}` },
        body: raw,
      }),
      "webhook",
      merchant.inboxToken,
    );
    assert.equal(signed.status, 200);
    assert.equal(((await signed.json()) as { status: string }).status, "ingested");
    assert.ok(await repos.tickets.findByExternalId(merchant.id, "email", externalId));
  } finally {
    delete process.env.DEMO_MODE;
    delete process.env.WEBHOOK_ROOT_SECRET;
  }
});

test("route: drop-at-edge discards a payload whose tags miss the merchant's presaleTags", async () => {
  process.env.DEMO_MODE = "true";
  delete process.env.WEBHOOK_ROOT_SECRET;

  const repos = getRepositories();
  const merchants = await repos.merchants.list();
  const merchant = merchants[merchants.length - 1]; // a dedicated merchant for this test
  await repos.merchants.update(merchant.id, { presaleTags: ["presale"] });

  const externalId = `wh_dropped_${Date.now()}`;
  const res = await handleCanonicalIngest(
    ingestRequest({
      external_id: externalId,
      customer_email: "buyer@example.com",
      subject: "billing question",
      body: "unrelated to presale",
      tags: ["billing", "vip"], // no match → dropped at edge
    }),
    "webhook",
    merchant.inboxToken,
  );
  assert.equal(res.status, 200);
  assert.equal(((await res.json()) as { status: string }).status, "discarded");
  // discarded means NEVER persisted
  assert.equal(await repos.tickets.findByExternalId(merchant.id, "email", externalId), null);

  // a matching tag on the same merchant DOES ingest
  const externalId2 = `wh_kept_${Date.now()}`;
  const kept = await handleCanonicalIngest(
    ingestRequest({
      external_id: externalId2,
      customer_email: "buyer@example.com",
      subject: "where is my order",
      body: "any update?",
      tags: ["presale"],
    }),
    "webhook",
    merchant.inboxToken,
  );
  assert.equal(((await kept.json()) as { status: string }).status, "ingested");
  assert.ok(await repos.tickets.findByExternalId(merchant.id, "email", externalId2));

  // An UNTAGGED payload is also dropped when presaleTags is configured — honors
  // the onboarding promise "untagged tickets never reach us".
  const externalId3 = `wh_untagged_${Date.now()}`;
  const untagged = await handleCanonicalIngest(
    ingestRequest({ external_id: externalId3, customer_email: "buyer@example.com", subject: "hi", body: "no tags here" }),
    "webhook",
    merchant.inboxToken,
  );
  assert.equal(((await untagged.json()) as { status: string }).status, "discarded");
  assert.equal(await repos.tickets.findByExternalId(merchant.id, "email", externalId3), null);
});

/** Swap env vars (computed keys, so the readonly NODE_ENV typing is bypassed the
 *  same way health.test.ts does) and restore them after the test body. */
async function withEnv(vars: Record<string, string | undefined>, fn: () => Promise<void>) {
  const prev: Record<string, string | undefined> = {};
  for (const key of Object.keys(vars)) prev[key] = process.env[key];
  for (const [key, val] of Object.entries(vars)) {
    if (val === undefined) delete process.env[key];
    else process.env[key] = val;
  }
  try {
    await fn();
  } finally {
    for (const [key, val] of Object.entries(prev)) {
      if (val === undefined) delete process.env[key];
      else process.env[key] = val;
    }
  }
}

test("route (LAUNCH CONFIG): production + DEMO_MODE unset + no root secret rejects unsigned — fails closed", async () => {
  // The go-live posture is host-based mode with DEMO_MODE deliberately UNSET.
  // The gate must not read that as demo: under NODE_ENV=production an unsigned
  // POST is 401 even when WEBHOOK_ROOT_SECRET is also missing (misconfigured
  // deploy), matching the .env.example posture and the resend inbound route.
  await withEnv({ NODE_ENV: "production", DEMO_MODE: undefined, WEBHOOK_ROOT_SECRET: undefined }, async () => {
    const repos = getRepositories();
    const merchant = (await repos.merchants.list())[0];
    const externalId = `wh_prod_unset_${Date.now()}`;
    const res = await handleCanonicalIngest(
      ingestRequest({ external_id: externalId, customer_email: "attacker@evil.com", subject: "s", body: "b" }),
      "webhook",
      merchant.inboxToken,
    );
    assert.equal(res.status, 401);
    assert.equal(await repos.tickets.findByExternalId(merchant.id, "email", externalId), null);
  });
});

test("route (LAUNCH CONFIG): production + DEMO_MODE unset + root secret set requires a valid signature", async () => {
  await withEnv({ NODE_ENV: "production", DEMO_MODE: undefined, WEBHOOK_ROOT_SECRET: "root-secret-prod" }, async () => {
    const repos = getRepositories();
    const merchant = (await repos.merchants.list())[0];
    const externalId = `wh_prod_signed_${Date.now()}`;
    const payload = { external_id: externalId, customer_email: "buyer@example.com", subject: "s", body: "b" };

    // unsigned → 401
    const unsigned = await handleCanonicalIngest(ingestRequest(payload), "webhook", merchant.inboxToken);
    assert.equal(unsigned.status, 401);

    // correctly signed → ingests
    const raw = JSON.stringify(payload);
    const signed = await handleCanonicalIngest(
      ingestRequest(raw, { [SIGNATURE_HEADER]: `sha256=${signWebhookBody(raw, deriveWebhookSecret(merchant.inboxToken))}` }),
      "webhook",
      merchant.inboxToken,
    );
    assert.equal(signed.status, 200);
    assert.equal(((await signed.json()) as { status: string }).status, "ingested");
  });
});

test("route (demo/dev): DEMO_MODE unset outside production still accepts unsigned — seeded/test path unchanged", async () => {
  await withEnv({ NODE_ENV: undefined, DEMO_MODE: undefined, WEBHOOK_ROOT_SECRET: undefined }, async () => {
    const repos = getRepositories();
    const merchant = (await repos.merchants.list())[0];
    const externalId = `wh_dev_unset_${Date.now()}`;
    const res = await handleCanonicalIngest(
      ingestRequest({ external_id: externalId, customer_email: "buyer@example.com", subject: "s", body: "b" }),
      "webhook",
      merchant.inboxToken,
    );
    assert.equal(res.status, 200);
    assert.equal(((await res.json()) as { status: string }).status, "ingested");
  });
});

test("route (demo + root secret): once WEBHOOK_ROOT_SECRET is set, unsigned is rejected even in demo", async () => {
  // Mirrors .env.example: "with the root set it requires a valid signature".
  await withEnv({ NODE_ENV: undefined, DEMO_MODE: "true", WEBHOOK_ROOT_SECRET: "root-secret-demo" }, async () => {
    const repos = getRepositories();
    const merchant = (await repos.merchants.list())[0];
    const externalId = `wh_demo_secret_${Date.now()}`;
    const payload = { external_id: externalId, customer_email: "buyer@example.com", subject: "s", body: "b" };

    const unsigned = await handleCanonicalIngest(ingestRequest(payload), "webhook", merchant.inboxToken);
    assert.equal(unsigned.status, 401);

    const raw = JSON.stringify(payload);
    const signed = await handleCanonicalIngest(
      ingestRequest(raw, { [SIGNATURE_HEADER]: `sha256=${signWebhookBody(raw, deriveWebhookSecret(merchant.inboxToken))}` }),
      "webhook",
      merchant.inboxToken,
    );
    assert.equal(signed.status, 200);
  });
});

test("route (live mode): fails closed when WEBHOOK_ROOT_SECRET is unset (no forgeable-secret path)", async () => {
  const repos = getRepositories();
  const merchant = (await repos.merchants.list())[0];
  process.env.DEMO_MODE = "false";
  delete process.env.WEBHOOK_ROOT_SECRET; // misconfigured live deploy
  try {
    // Even a request "signed" with the empty-root-derived secret is rejected,
    // because the route refuses to verify at all without a root secret.
    const raw = JSON.stringify({ external_id: "x", customer_email: "a@b.com", subject: "s", body: "b" });
    const forgeable = signWebhookBody(raw, deriveWebhookSecret(merchant.inboxToken));
    const res = await handleCanonicalIngest(
      new Request(`http://localhost/api/ingest/webhook/${merchant.inboxToken}`, {
        method: "POST",
        headers: { "content-type": "application/json", [SIGNATURE_HEADER]: `sha256=${forgeable}` },
        body: raw,
      }),
      "webhook",
      merchant.inboxToken,
    );
    assert.equal(res.status, 401);
  } finally {
    delete process.env.DEMO_MODE;
  }
});
