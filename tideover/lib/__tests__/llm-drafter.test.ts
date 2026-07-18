import assert from "node:assert/strict";
import { afterEach, beforeEach, test } from "node:test";
import { DeterministicDrafter } from "@/lib/drafting/DeterministicDrafter";
import { getDrafter, LlmDrafter } from "@/lib/drafting/LlmDrafter";
import type { DraftContext } from "@/lib/drafting/ReplyDrafter";
import { getRepositories } from "@/lib/repositories";

/**
 * LlmDrafter (ADR-0018) — provider call, deterministic floor, and the ADR-0014
 * reply-QA gate. global.fetch is mocked in every configured test: nothing here
 * ever reaches the network, and no test reads a real key (the LLM_ env vars are
 * cleared before each test and restored after).
 */

// Fixed instant so the seed order's day-stage + confidence band are deterministic.
const NOW = new Date("2026-07-04T12:00:00.000Z");
const MERCHANT = "mch_lumen0001";

// Clean reply: passes the hard-date gate ("in weeks ..." is a band, not a date).
const CLEAN_LLM_REPLY =
  "Hey Sam — thanks for hanging in there. Your unit is on the production line and on schedule; " +
  "the current window still holds, in weeks 9–11. I'll message you the moment it moves to the next stage.\n\n— The Lumen Forge crew";

// Hard-date reply: MUST be rejected by the QA gate into the deterministic floor.
const HARD_DATE_LLM_REPLY = "Hey Sam — good news, your order arrives March 3, promise.";

async function fixtureCtx(): Promise<DraftContext> {
  const repos = getRepositories();
  const merchant = await repos.merchants.findById(MERCHANT);
  assert.ok(merchant, "seed merchant resolves");
  const tickets = await repos.tickets.list({ merchantId: MERCHANT });
  const ticket = tickets.find((t) => t.orderId);
  assert.ok(ticket, "seed has a ticket with an order");
  const order = await repos.orders.findById(ticket!.orderId);
  const customer = await repos.customers.findById(ticket!.customerId);
  assert.ok(order && customer, "seed order + customer resolve");
  return { ticket: ticket!, order: order!, customer: customer!, merchant: merchant!, now: NOW };
}

// ── env + fetch isolation ────────────────────────────────────────────────────
const realFetch = global.fetch;
const ENV_KEYS = ["LLM_PROVIDER", "LLM_API_KEY", "LLM_MODEL"] as const;
const savedEnv: Record<string, string | undefined> = {};

beforeEach(() => {
  for (const k of ENV_KEYS) {
    savedEnv[k] = process.env[k];
    delete process.env[k];
  }
});

afterEach(() => {
  global.fetch = realFetch;
  for (const k of ENV_KEYS) {
    if (savedEnv[k] === undefined) delete process.env[k];
    else process.env[k] = savedEnv[k];
  }
});

function configureDeepseek(): void {
  process.env.LLM_PROVIDER = "deepseek";
  process.env.LLM_API_KEY = "test-key-never-real";
  process.env.LLM_MODEL = "deepseek-chat";
}

interface CapturedCall {
  url?: string;
  init?: RequestInit;
}

function mockFetchContent(content: unknown, capture?: CapturedCall): void {
  global.fetch = (async (url: RequestInfo | URL, init?: RequestInit) => {
    if (capture) {
      capture.url = String(url);
      capture.init = init;
    }
    return new Response(JSON.stringify({ choices: [{ message: { content } }] }), { status: 200 });
  }) as typeof fetch;
}

// ── drafter selection ────────────────────────────────────────────────────────

test("LLM_PROVIDER unset → getDrafter() is the DeterministicDrafter (shipped posture)", async () => {
  const drafter = getDrafter();
  assert.ok(drafter instanceof DeterministicDrafter);
  const out = await drafter.draft(await fixtureCtx());
  assert.equal(out.draftedBy, "deterministic");
});

test("LLM_PROVIDER set but LLM_API_KEY missing → LlmDrafter serves the deterministic floor without calling fetch", async () => {
  process.env.LLM_PROVIDER = "deepseek";
  global.fetch = (async () => {
    throw new Error("fetch must not be called when unconfigured");
  }) as typeof fetch;
  const out = await getDrafter().draft(await fixtureCtx());
  assert.equal(out.draftedBy, "deterministic");
});

// ── happy path ───────────────────────────────────────────────────────────────

test("happy path: LLM draft passes the ADR-0014 QA gate and is returned as draftedBy 'llm'", async () => {
  configureDeepseek();
  const capture: CapturedCall = {};
  mockFetchContent(CLEAN_LLM_REPLY, capture);

  const ctx = await fixtureCtx();
  const floor = await new DeterministicDrafter().draft(ctx);
  const out = await new LlmDrafter().draft(ctx);

  assert.equal(out.draftedBy, "llm");
  assert.equal(out.text, CLEAN_LLM_REPLY);
  // band + priority come from the engine's own math, never the model.
  assert.equal(out.confidenceBand, floor.confidenceBand);
  assert.equal(out.priority, floor.priority);

  // the provider call is shaped per ADR-0018: DeepSeek chat completions,
  // bearer key, low temperature, bounded tokens, no streaming.
  assert.equal(capture.url, "https://api.deepseek.com/chat/completions");
  const headers = capture.init?.headers as Record<string, string>;
  assert.equal(headers.authorization, "Bearer test-key-never-real");
  const body = JSON.parse(String(capture.init?.body)) as {
    model: string;
    temperature: number;
    max_tokens: number;
    stream: boolean;
    messages: Array<{ role: string; content: string }>;
  };
  assert.equal(body.model, "deepseek-chat");
  assert.equal(body.temperature, 0.3);
  assert.equal(body.max_tokens, 600);
  assert.equal(body.stream, false);
  // system prompt carries the tenant profile + the engine's verbatim band;
  // the ticket rides as the user message.
  const system = body.messages[0];
  const user = body.messages[1];
  assert.equal(system.role, "system");
  assert.ok(system.content.includes(ctx.merchant.brand.signoff), "system prompt carries the sign-off");
  assert.ok(system.content.includes(floor.confidenceBand), "system prompt carries the verbatim band");
  assert.ok(system.content.includes("NEVER state or imply a calendar date"), "proof-only contract present");
  assert.equal(user.role, "user");
  assert.ok(user.content.includes(ctx.ticket.body), "ticket body is the user message");
});

// ── the floor ────────────────────────────────────────────────────────────────

test("QA gate: a hard-date LLM draft ('arrives March 3') is rejected into the deterministic floor", async (t) => {
  configureDeepseek();
  mockFetchContent(HARD_DATE_LLM_REPLY);
  const warns: string[] = [];
  t.mock.method(console, "warn", (msg: string) => {
    warns.push(String(msg));
  });

  const ctx = await fixtureCtx();
  const floor = await new DeterministicDrafter().draft(ctx);
  const out = await new LlmDrafter().draft(ctx);

  assert.equal(out.draftedBy, "deterministic");
  assert.equal(out.text, floor.text);
  assert.notEqual(out.text, HARD_DATE_LLM_REPLY);

  // structured warn fired, and it never leaks the ticket or draft body.
  const rejection = warns.find((w) => w.includes("qa_reject_hard_date"));
  assert.ok(rejection, "QA rejection is logged");
  const parsed = JSON.parse(rejection!) as { at: string; event: string; merchantId: string };
  assert.equal(parsed.at, "LlmDrafter");
  assert.equal(parsed.merchantId, ctx.merchant.id);
  assert.ok(!rejection!.includes(HARD_DATE_LLM_REPLY), "draft body never logged");
  assert.ok(!rejection!.includes(ctx.ticket.body), "ticket body never logged");
});

test("timeout: a provider that never answers aborts at the deadline → deterministic floor", async (t) => {
  configureDeepseek();
  t.mock.method(console, "warn", () => {});
  global.fetch = ((_url: RequestInfo | URL, init?: RequestInit) =>
    new Promise<Response>((_resolve, reject) => {
      init?.signal?.addEventListener("abort", () => reject(new Error("aborted")));
    })) as typeof fetch;

  const out = await new LlmDrafter({ timeoutMs: 25 }).draft(await fixtureCtx());
  assert.equal(out.draftedBy, "deterministic");
});

test("malformed provider response (no choices / empty content) → deterministic floor", async (t) => {
  configureDeepseek();
  t.mock.method(console, "warn", () => {});
  const ctx = await fixtureCtx();

  global.fetch = (async () => new Response(JSON.stringify({}), { status: 200 })) as typeof fetch;
  assert.equal((await new LlmDrafter().draft(ctx)).draftedBy, "deterministic");

  mockFetchContent("   ");
  assert.equal((await new LlmDrafter().draft(ctx)).draftedBy, "deterministic");
});

test("provider HTTP error (429) → deterministic floor", async (t) => {
  configureDeepseek();
  t.mock.method(console, "warn", () => {});
  global.fetch = (async () => new Response("rate limited", { status: 429 })) as typeof fetch;
  const out = await new LlmDrafter().draft(await fixtureCtx());
  assert.equal(out.draftedBy, "deterministic");
});

test("unknown provider (e.g. 'anthropic' before it is wired) → clear not-configured path into the floor", async (t) => {
  process.env.LLM_PROVIDER = "anthropic";
  process.env.LLM_API_KEY = "test-key-never-real";
  const warns: string[] = [];
  t.mock.method(console, "warn", (msg: string) => {
    warns.push(String(msg));
  });
  global.fetch = (async () => {
    throw new Error("fetch must not be called for an unwired provider");
  }) as typeof fetch;

  const out = await new LlmDrafter().draft(await fixtureCtx());
  assert.equal(out.draftedBy, "deterministic");
  assert.ok(
    warns.some((w) => w.includes("no wired adapter")),
    "not-configured error surfaces in the structured warn",
  );
});
