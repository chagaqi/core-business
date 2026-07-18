import assert from "node:assert/strict";
import { test } from "node:test";
import {
  deriveBearerSecret,
  deriveHelpScoutSecret,
  signHelpScoutBody,
  verifyBearer,
  verifyHelpScoutSig,
  verifyIngestAuth,
  ipAllowed,
  clientIpFrom,
  HELPSCOUT_SIGNATURE_HEADER,
  BEARER_HEADER,
} from "@/lib/ingest-auth";
import { deriveWebhookSecret, signWebhookBody, SIGNATURE_HEADER } from "@/lib/webhook-secret";
import {
  specForChannel,
  expandTags,
  tagsAllowed,
  vendorSpec,
  INGEST_CHANNELS,
} from "@/lib/channel-adapters/ingest-vendors";
import { handleCanonicalIngest } from "@/lib/ingest-route";
import { helpdeskSetups } from "@/lib/ingest-templates";
import {
  getIngestHealth,
  resetIngestHealth,
  ingestFixFor,
  UNKNOWN_TOKEN_BUCKET,
} from "@/lib/ingest-health";
import { deriveIngestStatus } from "@/lib/setup-status";
import { getRepositories } from "@/lib/repositories";

/**
 * ADR-0021 — per-vendor webhook auth + the ingest health signal.
 *
 * THE BUG (verified in the 10-merchant simulation): production ingest demanded a
 * Tideover HMAC-SHA256 that Gorgias cannot compute and Help Scout does not
 * produce, and Zendesk had no route at all. Four of ten merchants — 17,450
 * orders, the two best-paying among them — would have run at DEMO_MODE=false with
 * a permanently 401'ing webhook and a cockpit that looked calm and healthy.
 *
 * These tests pin BOTH halves: each vendor's real credential is accepted in
 * PRODUCTION mode, a bad one is still refused (and now counted), and the state
 * where nothing arrives is an alarm rather than silence.
 */

/** Swap env vars (computed keys bypass the readonly NODE_ENV typing) and restore. */
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

/** The live posture: production, DEMO_MODE unset, a real root secret. */
const LIVE = { NODE_ENV: "production", DEMO_MODE: undefined, WEBHOOK_ROOT_SECRET: "root-live-0021" };

function req(path: string, body: string, headers: Record<string, string> = {}): Request {
  return new Request(`http://localhost${path}`, {
    method: "POST",
    headers: { "content-type": "application/json", ...headers },
    body,
  });
}

function payload(extra: Record<string, unknown> = {}) {
  return {
    external_id: `wh_${Date.now()}_${Math.random().toString(36).slice(2)}`,
    customer_email: "buyer@example.com",
    subject: "where is my order",
    body: "It has been weeks. Any update?",
    tags: ["presale"],
    ...extra,
  };
}

// ── (1) credential derivation ────────────────────────────────────────────────

test("derived credentials are deterministic, token-scoped, and independent of each other", () => {
  delete process.env.WEBHOOK_ROOT_SECRET;

  const bearerA = deriveBearerSecret("tokenAAA");
  const bearerB = deriveBearerSecret("tokenBBB");
  assert.equal(bearerA, deriveBearerSecret("tokenAAA"), "same token → same bearer");
  assert.notEqual(bearerA, bearerB, "different token → different bearer");
  assert.match(bearerA, /^tdo_[0-9a-f]{64}$/);

  const hs = deriveHelpScoutSecret("tokenAAA");
  assert.equal(hs, deriveHelpScoutSecret("tokenAAA"));
  assert.notEqual(hs, deriveHelpScoutSecret("tokenBBB"));
  assert.ok(hs.length <= 40, "Help Scout caps a webhook secret key at 40 characters");
  assert.equal(hs.length, 32);

  // Domain separation: no credential is derivable from another, so a leaked
  // bearer (which travels in a header on every request) does not yield the HMAC
  // signing key.
  const hmacSecret = deriveWebhookSecret("tokenAAA");
  assert.notEqual(bearerA.replace("tdo_", ""), hmacSecret);
  assert.notEqual(hs, hmacSecret.slice(0, 32));

  // Rotating the root rotates every credential.
  process.env.WEBHOOK_ROOT_SECRET = "rotated";
  assert.notEqual(deriveBearerSecret("tokenAAA"), bearerA);
  assert.notEqual(deriveHelpScoutSecret("tokenAAA"), hs);
  delete process.env.WEBHOOK_ROOT_SECRET;
});

test("verifyBearer accepts the exact secret in any wrapper, rejects everything else", () => {
  const secret = "tdo_abc123";
  assert.equal(verifyBearer(`Bearer ${secret}`, secret), true);
  assert.equal(verifyBearer(`bearer ${secret}`, secret), true, "case-insensitive scheme");
  assert.equal(verifyBearer(`Token ${secret}`, secret), true, "Zendesk API-key wording");
  assert.equal(verifyBearer(secret, secret), true, "bare value");
  assert.equal(verifyBearer(`Bearer ${secret}x`, secret), false);
  assert.equal(verifyBearer("Bearer ", secret), false);
  assert.equal(verifyBearer(null, secret), false);
  assert.equal(verifyBearer(`Bearer ${secret}`, ""), false);
});

test("verifyHelpScoutSig verifies Help Scout's own base64(HMAC-SHA1) over the raw body", () => {
  const secret = "hs-secret-key";
  const raw = JSON.stringify({ id: 1, subject: "hi" });
  const sig = signHelpScoutBody(raw, secret);
  assert.match(sig, /^[A-Za-z0-9+/]+=*$/, "base64, not hex — this is Help Scout's format");

  assert.equal(verifyHelpScoutSig(raw, sig, secret), true);
  assert.equal(verifyHelpScoutSig(raw, sig, "other-secret"), false);
  assert.equal(verifyHelpScoutSig(JSON.stringify({ id: 2 }), sig, secret), false, "body tamper");
  assert.equal(verifyHelpScoutSig(raw, null, secret), false);
});

// ── (2) per-vendor auth: accept what the vendor CAN send ─────────────────────

test("verifyIngestAuth: each vendor's real credential is accepted in PRODUCTION mode", async () => {
  await withEnv(LIVE, async () => {
    const token = "tok_vendor";
    const raw = JSON.stringify(payload());

    // GORGIAS — cannot HMAC. Sends a static Authorization header. This is the
    // credential that was impossible before ADR-0021.
    const gorgias = verifyIngestAuth({
      rawBody: raw,
      headers: new Headers({ [BEARER_HEADER]: `Bearer ${deriveBearerSecret(token)}` }),
      inboxToken: token,
      spec: specForChannel("gorgias")!,
    });
    assert.deepEqual(gorgias, { ok: true, scheme: "bearer" });

    // ZENDESK — same shape, and it had no route at all before.
    const zendesk = verifyIngestAuth({
      rawBody: raw,
      headers: new Headers({ [BEARER_HEADER]: `Bearer ${deriveBearerSecret(token)}` }),
      inboxToken: token,
      spec: specForChannel("zendesk")!,
    });
    assert.deepEqual(zendesk, { ok: true, scheme: "bearer" });

    // HELP SCOUT — its OWN scheme, its own header, its own algorithm.
    const helpscout = verifyIngestAuth({
      rawBody: raw,
      headers: new Headers({
        [HELPSCOUT_SIGNATURE_HEADER]: signHelpScoutBody(raw, deriveHelpScoutSecret(token)),
      }),
      inboxToken: token,
      spec: specForChannel("helpscout")!,
    });
    assert.deepEqual(helpscout, { ok: true, scheme: "helpscout-hmac-sha1" });

    // GENERIC — the original ADR-0011 HMAC path, unchanged and still preferred.
    const generic = verifyIngestAuth({
      rawBody: raw,
      headers: new Headers({
        [SIGNATURE_HEADER]: `sha256=${signWebhookBody(raw, deriveWebhookSecret(token))}`,
      }),
      inboxToken: token,
      spec: specForChannel("webhook")!,
    });
    assert.deepEqual(generic, { ok: true, scheme: "tideover-hmac" });
  });
});

test("verifyIngestAuth: a wrong or missing credential is refused for every vendor", async () => {
  await withEnv(LIVE, async () => {
    const token = "tok_vendor";
    const raw = JSON.stringify(payload());

    for (const channel of ["gorgias", "zendesk", "helpscout", "webhook"]) {
      const spec = specForChannel(channel)!;
      // nothing sent at all
      assert.deepEqual(
        verifyIngestAuth({ rawBody: raw, headers: new Headers(), inboxToken: token, spec }),
        { ok: false, reason: "missing-credential" },
        `${channel}: no credential must be refused`,
      );
      // another merchant's bearer
      const wrong = verifyIngestAuth({
        rawBody: raw,
        headers: new Headers({ [BEARER_HEADER]: `Bearer ${deriveBearerSecret("someone-else")}` }),
        inboxToken: token,
        spec,
      });
      assert.equal(wrong.ok, false, `${channel}: another merchant's bearer must be refused`);
    }

    // Help Scout signature made with the wrong key
    const badHs = verifyIngestAuth({
      rawBody: raw,
      headers: new Headers({ [HELPSCOUT_SIGNATURE_HEADER]: signHelpScoutBody(raw, "wrong") }),
      inboxToken: token,
      spec: specForChannel("helpscout")!,
    });
    assert.deepEqual(badHs, { ok: false, reason: "bad-signature" });

    // a valid signature over a DIFFERENT body (replay with a mutated payload)
    const replay = verifyIngestAuth({
      rawBody: JSON.stringify(payload()),
      headers: new Headers({
        [SIGNATURE_HEADER]: `sha256=${signWebhookBody(raw, deriveWebhookSecret(token))}`,
      }),
      inboxToken: token,
      spec: specForChannel("webhook")!,
    });
    assert.deepEqual(replay, { ok: false, reason: "bad-signature" });
  });
});

test("verifyIngestAuth FAILS CLOSED: production with no root secret refuses every vendor", async () => {
  // The launch posture is host-derived mode with DEMO_MODE deliberately unset. A
  // deploy that forgets WEBHOOK_ROOT_SECRET must refuse everything, not fall back
  // to the demo branch: with an empty root, every derived credential is computable
  // from the PUBLIC url token, so accepting would be accepting a forgeable secret.
  await withEnv(
    { NODE_ENV: "production", DEMO_MODE: undefined, WEBHOOK_ROOT_SECRET: undefined },
    async () => {
      const token = "tok_vendor";
      const raw = JSON.stringify(payload());
      for (const channel of INGEST_CHANNELS) {
        const spec = specForChannel(channel)!;
        // even a credential derived from the (empty) root is refused
        const res = verifyIngestAuth({
          rawBody: raw,
          headers: new Headers({ [BEARER_HEADER]: `Bearer ${deriveBearerSecret(token)}` }),
          inboxToken: token,
          spec,
        });
        assert.deepEqual(res, { ok: false, reason: "no-root-secret" }, `${channel} must fail closed`);
      }
    },
  );
});

test("verifyIngestAuth: the demo/seeded path still accepts unauthenticated payloads", async () => {
  await withEnv({ NODE_ENV: undefined, DEMO_MODE: undefined, WEBHOOK_ROOT_SECRET: undefined }, async () => {
    const res = verifyIngestAuth({
      rawBody: "{}",
      headers: new Headers(),
      inboxToken: "tok",
      spec: specForChannel("gorgias")!,
    });
    assert.deepEqual(res, { ok: true, scheme: "demo-unsigned" });
  });
});

// ── (3) optional IP allowlist ────────────────────────────────────────────────

test("ipAllowed: off by default, exact + CIDR when on", () => {
  assert.equal(ipAllowed(null, []), true, "empty list = feature off = allow");
  assert.equal(ipAllowed("1.2.3.4", []), true);

  assert.equal(ipAllowed("1.2.3.4", ["1.2.3.4"]), true);
  assert.equal(ipAllowed("1.2.3.5", ["1.2.3.4"]), false);
  assert.equal(ipAllowed("52.10.5.9", ["52.10.0.0/16"]), true);
  assert.equal(ipAllowed("52.11.5.9", ["52.10.0.0/16"]), false);
  assert.equal(ipAllowed(null, ["1.2.3.4"]), false, "no IP + a list on = refuse");
});

test("ipAllowed blocks a request from outside the allowlist through the real gate", async () => {
  await withEnv({ ...LIVE, INGEST_IP_ALLOWLIST: "203.0.113.0/24" }, async () => {
    const token = "tok_vendor";
    const raw = JSON.stringify(payload());
    const headers = new Headers({
      [BEARER_HEADER]: `Bearer ${deriveBearerSecret(token)}`,
      "x-forwarded-for": "198.51.100.7, 10.0.0.1",
    });
    assert.equal(clientIpFrom(headers), "198.51.100.7");
    assert.deepEqual(
      verifyIngestAuth({ rawBody: raw, headers, inboxToken: token, spec: specForChannel("gorgias")! }),
      { ok: false, reason: "ip-not-allowed" },
    );

    // an allowed IP with the same credential passes
    const ok = verifyIngestAuth({
      rawBody: raw,
      headers: new Headers({
        [BEARER_HEADER]: `Bearer ${deriveBearerSecret(token)}`,
        "x-forwarded-for": "203.0.113.9",
      }),
      inboxToken: token,
      spec: specForChannel("gorgias")!,
    });
    assert.equal(ok.ok, true);
  });
});

// ── (4) tag handling — the silent Zendesk discard ────────────────────────────

test("expandTags splits the one space-joined string Zendesk actually sends", () => {
  // {{ticket.tags}} renders as ONE string. A 3-seat Zendesk shop tags every
  // ticket twice, so EVERY ticket used to miss the presale filter and be
  // silently 200-discarded.
  assert.deepEqual(expandTags(["presale vip"]).sort(), ["presale", "presale vip", "vip"]);
  assert.deepEqual(expandTags(["presale,vip"]).sort(), ["presale", "presale,vip", "vip"]);
  assert.deepEqual(expandTags(["Presale"]), ["presale"], "case-folded");
  assert.deepEqual(expandTags([]), []);
  assert.deepEqual(expandTags(undefined), []);

  assert.equal(tagsAllowed(["presale vip"], ["presale"]), true, "the bug: this used to be false");
  assert.equal(tagsAllowed(["billing refund"], ["presale"]), false, "still drops unrelated tags");
  assert.equal(tagsAllowed(undefined, ["presale"]), false, "untagged is still dropped");
  assert.equal(tagsAllowed(undefined, undefined), true, "no filter = accept everything");
});

// ── (5) the health signal ────────────────────────────────────────────────────

test("ingestFixFor names the vendor's own screen and field", () => {
  const gorgias = ingestFixFor({ kind: "rejected", reason: "missing-credential", channel: "gorgias" });
  assert.match(gorgias, /Gorgias/);
  assert.match(gorgias, /Authorization: Bearer/);

  const hs = ingestFixFor({ kind: "rejected", reason: "bad-signature", channel: "helpscout" });
  assert.match(hs, /Secret Key/);

  assert.match(ingestFixFor({ kind: "discarded", channel: "zendesk" }), /tag rule/i);
  assert.match(ingestFixFor({ kind: "invalid", channel: "zendesk" }), /body template/i);
});

test("deriveIngestStatus: a connected merchant from whom NOTHING has ever arrived is an ALARM", () => {
  // This is the whole point. The old integrationHealth returned { quiet: false }
  // here — it was coded to stay silent about the only merchant who is broken.
  resetIngestHealth("m1");
  const status = deriveIngestStatus({
    isDemo: false,
    presaleTags: ["presale"],
    lastInboundAt: null,
    health: getIngestHealth("m1"),
  });
  assert.equal(status.level, "alarm");
  assert.match(status.headline, /Nothing has ever arrived/i);
  assert.ok(status.fix, "an alarm must always carry a fix");
  assert.equal(status.badge, "No inbound ever");
});

test("deriveIngestStatus: not-yet-connected is idle, demo is never an alarm, delivering is ok", () => {
  resetIngestHealth("m2");
  const idle = deriveIngestStatus({
    isDemo: false,
    presaleTags: [],
    lastInboundAt: null,
    health: getIngestHealth("m2"),
  });
  assert.equal(idle.level, "idle", "nothing wired yet is not an error");

  const demo = deriveIngestStatus({
    isDemo: true,
    presaleTags: ["presale"],
    lastInboundAt: null,
    health: getIngestHealth("m2"),
  });
  assert.equal(demo.level, "idle", "seeded demo data must never raise a production alarm");

  const now = new Date("2026-07-12T00:00:00.000Z");
  const ok = deriveIngestStatus(
    {
      isDemo: false,
      presaleTags: ["presale"],
      lastInboundAt: "2026-07-12T00:00:00.000Z",
      health: getIngestHealth("m2"),
    },
    now,
  );
  assert.equal(ok.level, "ok");

  const quiet = deriveIngestStatus(
    {
      isDemo: false,
      presaleTags: ["presale"],
      lastInboundAt: "2026-07-01T00:00:00.000Z",
      health: getIngestHealth("m2"),
    },
    now,
  );
  assert.equal(quiet.level, "alarm");
  assert.match(quiet.headline, /No inbound in 11 days/);
});

// ── (6) THE PROOF: real vendor-shaped POSTs through the real route, in prod ──

test("PROOF — a Gorgias-shaped POST (static bearer) INGESTS in production mode", async () => {
  await withEnv(LIVE, async () => {
    const repos = getRepositories();
    const merchant = (await repos.merchants.list())[0];
    resetIngestHealth(merchant.id);
    await repos.merchants.update(merchant.id, { presaleTags: ["presale"] });

    // Exactly what a Gorgias HTTP Integration sends: a templated canonical body
    // and ONE static custom header. No signature — it cannot compute one.
    const body = JSON.stringify(payload({ tags: ["presale"] }));
    const setups = helpdeskSetups((await repos.merchants.findById(merchant.id))!);
    const res = await handleCanonicalIngest(
      req(setups.gorgias.path, body, {
        authorization: `Bearer ${setups.gorgias.credential}`,
      }),
      "gorgias",
      merchant.inboxToken,
    );

    assert.equal(res.status, 200, "Gorgias must be able to connect in production");
    const json = (await res.json()) as { status: string; ticketId?: string };
    assert.equal(json.status, "ingested");
    assert.ok(json.ticketId);

    const health = getIngestHealth(merchant.id);
    assert.equal(health.counts.rejected, 0);
    assert.equal(health.counts.accepted + health.counts.unmatched, 1);
  });
});

test("PROOF — a Help-Scout-shaped POST (its own HMAC-SHA1 over its own payload) INGESTS in production mode", async () => {
  await withEnv(LIVE, async () => {
    const repos = getRepositories();
    const merchant = (await repos.merchants.list())[0];
    resetIngestHealth(merchant.id);
    await repos.merchants.update(merchant.id, { presaleTags: ["presale"] });

    // Help Scout CANNOT template a body — it POSTs its own conversation object,
    // and signs it with base64(HMAC-SHA1(rawBody, secretKey)) where secretKey is
    // the value the merchant pasted into Help Scout (which we derived for them).
    const conversation = {
      id: 987654,
      number: 4321,
      subject: "Any news on my keyboard?",
      preview: "It has been 61 days.",
      createdAt: "2026-07-10T09:00:00.000Z",
      customer: { id: 5, first: "Ada", last: "L", email: "buyer@example.com" },
      tags: [{ id: 1, tag: "presale" }, { id: 2, tag: "group-buy" }],
      _embedded: {
        threads: [
          {
            id: 1,
            type: "customer",
            body: "<p>It has been 61 days and I have heard nothing.</p>",
            createdAt: "2026-07-10T09:00:00.000Z",
          },
        ],
      },
    };
    const raw = JSON.stringify(conversation);
    const setups = helpdeskSetups((await repos.merchants.findById(merchant.id))!);
    const res = await handleCanonicalIngest(
      req(setups.helpscout.path, raw, {
        [HELPSCOUT_SIGNATURE_HEADER]: signHelpScoutBody(raw, setups.helpscout.credential),
      }),
      "helpscout",
      merchant.inboxToken,
    );

    assert.equal(res.status, 200, "Help Scout must be able to connect in production");
    const json = (await res.json()) as { status: string; ticketId?: string };
    assert.ok(json.status === "ingested" || json.status === "duplicate", `got ${json.status}`);

    // Its NATIVE payload was read: the html thread became the ticket body.
    const ticket = await repos.tickets.findByExternalId(merchant.id, "email", "hs-987654");
    assert.ok(ticket, "the Help Scout conversation must have become a ticket");
    assert.match(ticket!.body, /61 days/);
    assert.ok(!ticket!.body.includes("<p>"), "html must be stripped");
    assert.equal(ticket!.subject, "Any news on my keyboard?");
  });
});

test("PROOF — a bad payload is REJECTED and COUNTED, and /app/setup's status turns to alarm", async () => {
  await withEnv(LIVE, async () => {
    const repos = getRepositories();
    const merchants = await repos.merchants.list();
    const merchant = merchants[merchants.length - 1];
    resetIngestHealth(merchant.id);
    await repos.merchants.update(merchant.id, { presaleTags: ["presale"] });

    const body = JSON.stringify(payload());
    const externalId = (JSON.parse(body) as { external_id: string }).external_id;

    // (a) no credential at all — the Gorgias merchant who never added the header
    const missing = await handleCanonicalIngest(req("/x", body), "gorgias", merchant.inboxToken);
    assert.equal(missing.status, 401);

    // (b) another merchant's bearer
    const forged = await handleCanonicalIngest(
      req("/x", body, { authorization: `Bearer ${deriveBearerSecret("not-your-token")}` }),
      "gorgias",
      merchant.inboxToken,
    );
    assert.equal(forged.status, 401);

    // nothing was written
    assert.equal(await repos.tickets.findByExternalId(merchant.id, "email", externalId), null);

    // and it is COUNTED, with the reason and a copy-paste fix — the merchant is
    // no longer looking at a calm empty queue.
    const health = getIngestHealth(merchant.id);
    assert.equal(health.counts.rejected, 2);
    assert.equal(health.lastFailure?.kind, "rejected");
    assert.equal(health.lastFailure?.reason, "bad-bearer");
    assert.match(health.lastFailure!.fix, /connection secret/i);

    const status = deriveIngestStatus({
      isDemo: false,
      presaleTags: merchant.presaleTags,
      lastInboundAt: null,
      health,
    });
    assert.equal(status.level, "alarm", "a rejecting webhook must be an ALARM on /app/setup");
    assert.match(status.headline, /turned away/i);
    assert.ok(status.fix);
    assert.equal(status.badge, "Ingest failing");
  });
});

test("PROOF — the connect panel's test event runs the real gate and writes nothing", async () => {
  await withEnv(LIVE, async () => {
    const repos = getRepositories();
    const merchants = await repos.merchants.list();
    const merchant = merchants[merchants.length - 1];
    resetIngestHealth(merchant.id);
    await repos.merchants.update(merchant.id, { presaleTags: ["presale"] });
    const setups = helpdeskSetups((await repos.merchants.findById(merchant.id))!);

    const testBody = JSON.stringify({
      test: true,
      external_id: "tideover-test-1",
      customer_email: "connection-test@tideover.app",
      subject: "Tideover connection test",
      body: "This is a Tideover connection test.",
      tags: ["presale"],
    });

    // an UNAUTHENTICATED test is refused exactly like a real ticket
    const unauthed = await handleCanonicalIngest(req("/x", testBody), "zendesk", merchant.inboxToken);
    assert.equal(unauthed.status, 401, "the test must not have a back door");

    // the authenticated test passes the gate and the tag rule, and stops
    const res = await handleCanonicalIngest(
      req(setups.zendesk.path, testBody, {
        authorization: `Bearer ${setups.zendesk.credential}`,
      }),
      "zendesk",
      merchant.inboxToken,
    );
    assert.equal(res.status, 200);
    const json = (await res.json()) as { status: string; authScheme?: string };
    assert.equal(json.status, "test-ok");
    assert.equal(json.authScheme, "bearer");
    assert.equal(
      await repos.tickets.findByExternalId(merchant.id, "email", "tideover-test-1"),
      null,
      "a connection test must never put a synthetic ticket in a real queue",
    );

    // a test whose tags miss the merchant's rule reports the DROP, not success
    const dropped = await handleCanonicalIngest(
      req(
        setups.zendesk.path,
        JSON.stringify({
          test: true,
          external_id: "tideover-test-2",
          customer_email: "connection-test@tideover.app",
          subject: "s",
          body: "b",
          tags: ["billing"],
        }),
        { authorization: `Bearer ${setups.zendesk.credential}` },
      ),
      "zendesk",
      merchant.inboxToken,
    );
    assert.equal(((await dropped.json()) as { status: string }).status, "discarded");
  });
});

test("a Zendesk multi-tag ticket (one space-joined string) now lands instead of being silently dropped", async () => {
  await withEnv(LIVE, async () => {
    const repos = getRepositories();
    const merchants = await repos.merchants.list();
    const merchant = merchants[merchants.length - 1];
    resetIngestHealth(merchant.id);
    await repos.merchants.update(merchant.id, { presaleTags: ["presale"] });
    const setups = helpdeskSetups((await repos.merchants.findById(merchant.id))!);

    const externalId = `zd_${Date.now()}`;
    const body = JSON.stringify({
      external_id: externalId,
      customer_email: "buyer@example.com",
      subject: "where is my order",
      body: "any update?",
      // exactly what {{ticket.tags}} renders as for a 3-seat shop
      tags: ["presale vip urgent"],
    });
    const res = await handleCanonicalIngest(
      req(setups.zendesk.path, body, { authorization: `Bearer ${setups.zendesk.credential}` }),
      "zendesk",
      merchant.inboxToken,
    );
    assert.equal(((await res.json()) as { status: string }).status, "ingested");
    assert.ok(await repos.tickets.findByExternalId(merchant.id, "email", externalId));
  });
});

test("an unknown token 404s and is counted in the ops bucket (a helpdesk pointed at a dead URL)", async () => {
  await withEnv(LIVE, async () => {
    resetIngestHealth(UNKNOWN_TOKEN_BUCKET);
    const res = await handleCanonicalIngest(
      req("/x", JSON.stringify(payload())),
      "gorgias",
      "definitely-not-a-real-inbox-token",
    );
    assert.equal(res.status, 404);
    const health = getIngestHealth(UNKNOWN_TOKEN_BUCKET);
    assert.equal(health.counts.rejected, 1);
    assert.equal(health.recent[0]?.reason, "unknown-token");
  });
});

test("the vendor registry declares only credentials the vendor can actually produce", () => {
  // A regression here means we shipped instructions a merchant physically cannot
  // follow — the exact failure ADR-0021 exists to prevent.
  assert.ok(
    !vendorSpec("gorgias").schemes.includes("helpscout-hmac-sha1"),
    "Gorgias does not speak Help Scout's scheme",
  );
  assert.equal(vendorSpec("gorgias").schemes[0], "bearer", "Gorgias cannot HMAC a body");
  assert.equal(vendorSpec("zendesk").schemes[0], "bearer");
  assert.equal(vendorSpec("helpscout").schemes[0], "helpscout-hmac-sha1");
  assert.equal(vendorSpec("generic").schemes[0], "tideover-hmac", "the strongest scheme stays first");
  assert.equal(vendorSpec("helpscout").templatableBody, false, "Help Scout has no body field");
  assert.equal(vendorSpec("gorgias").templatableBody, true);
});
