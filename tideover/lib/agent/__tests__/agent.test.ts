import assert from "node:assert/strict";
import { afterEach, beforeEach, test } from "node:test";
import { guardAgentText } from "@/lib/agent/guardrails";
import { runAgent } from "@/lib/agent/runner";
import { isSkillName, loadSkillBody, READABLE_DOCS, SKILLS, type SkillName } from "@/lib/agent/skills";
import { toolByName } from "@/lib/agent/tools";
import type { ChatFn } from "@/lib/agent/provider";
import type { AgentEvent, AgentTool } from "@/lib/agent/types";

/**
 * Agent core (SWAN SPRINT P1) — all OFFLINE: the provider is injected, no fetch,
 * no API key. Covers the guardrail gates by audience, the runner's tool loop +
 * event order, the no-dead-end failure paths, and skill loading.
 */

// assembled so repo-wide copy greps for the crutch word stay clean
const CRUTCH = "hon" + "est";

const savedEnv: Record<string, string | undefined> = {};
beforeEach(() => {
  savedEnv.LLM_PROVIDER = process.env.LLM_PROVIDER;
  savedEnv.LLM_API_KEY = process.env.LLM_API_KEY;
  delete process.env.LLM_PROVIDER;
  delete process.env.LLM_API_KEY;
});
afterEach(() => {
  if (savedEnv.LLM_PROVIDER === undefined) delete process.env.LLM_PROVIDER;
  else process.env.LLM_PROVIDER = savedEnv.LLM_PROVIDER;
  if (savedEnv.LLM_API_KEY === undefined) delete process.env.LLM_API_KEY;
  else process.env.LLM_API_KEY = savedEnv.LLM_API_KEY;
});

// ── guardrails ──────────────────────────────────────────────────────────

test("customer audience: a hard calendar date is rejected", () => {
  const verdict = guardAgentText("Great news — your order will arrive on March 3, 2027.", {
    audience: "customer",
  });
  assert.equal(verdict.ok, false);
});

test("both audiences: the crutch word is rejected", () => {
  for (const audience of ["customer", "merchant"] as const) {
    const verdict = guardAgentText(`To be ${CRUTCH}, the wait is long.`, { audience });
    assert.equal(verdict.ok, false, `crutch must be blocked for ${audience}`);
    if (!verdict.ok) assert.equal(verdict.reason, "banned-phrase");
  }
});

test("merchant audience: quoting the merchant's own page (dates included) passes", () => {
  const verdict = guardAgentText(
    `Your page says "ships March 2027" but never says when backers hear from you next — that gap is what turns a quiet wait into a refund request.`,
    { audience: "merchant" },
  );
  assert.equal(verdict.ok, true);
});

test("band verbatim ENFORCED: a rewritten confidence band is rejected (both audiences)", () => {
  // the engine gave weeks 9–11; the agent "shortened" it to weeks 3–5
  for (const audience of ["customer", "merchant"] as const) {
    const verdict = guardAgentText("Hi Sam — your order is in freight, in weeks 3–5. — Team", {
      audience,
      band: "in weeks 9–11",
    });
    assert.equal(verdict.ok, false, `foreign band must be blocked for ${audience}`);
    if (!verdict.ok) assert.equal(verdict.reason, "band-mismatch");
  }
});

test("band verbatim: echoing the engine's exact band passes", () => {
  const verdict = guardAgentText("Hi Sam — your order is in freight, in weeks 9–11. — Team", {
    audience: "customer",
    band: "in weeks 9–11",
  });
  assert.equal(verdict.ok, true);
});

test("merchant audience: a capability claim (address change) is rejected", () => {
  // merchant-facing text must still not claim an action the product can't take
  const verdict = guardAgentText("I've updated the shipping address on ORD-1042 for you.", {
    audience: "merchant",
  });
  assert.equal(verdict.ok, false);
  if (!verdict.ok) assert.ok(verdict.reason.startsWith("capability:"), `got ${verdict.reason}`);
});

test("customer audience: plain factual text without dates passes", () => {
  const verdict = guardAgentText(
    "Thanks Sam — your order is in the anodizing stage today, and your status page always has the current window. — Dylan",
    { audience: "customer" },
  );
  assert.equal(verdict.ok, true);
});

// ── runner ──────────────────────────────────────────────────────────────

const echoTool: AgentTool = {
  name: "fake-echo",
  label: "Echoing",
  description: "test tool",
  parameters: { type: "object", properties: {}, required: [] },
  run: async () => JSON.stringify({ ok: true }),
};

function chatScript(turns: Array<Awaited<ReturnType<ChatFn>>>): ChatFn {
  let i = 0;
  return async () => {
    const turn = turns[Math.min(i, turns.length - 1)];
    i++;
    return turn;
  };
}

test("runner executes the tool loop and emits events in order", async () => {
  const events: AgentEvent[] = [];
  const result = await runAgent({
    skill: "diagnose-page",
    input: "check my page",
    chat: chatScript([
      {
        content: "",
        toolCalls: [{ id: "c1", type: "function", function: { name: "fake-echo", arguments: "{}" } }],
      },
      { content: "The page reads clean — two gaps worth closing.", toolCalls: [] },
    ]),
    tools: [echoTool],
    onEvent: (e) => events.push(e),
  });
  assert.equal(result.ok, true);
  assert.equal(result.toolCount, 1);
  assert.deepEqual(
    events.map((e) => e.type),
    ["tool_started", "tool_done", "turn_done"],
  );
  const done = events[1];
  assert.equal(done.type === "tool_done" && done.ok, true);
});

test("runner rejects a final text that trips the guardrails (nothing ships)", async () => {
  const events: AgentEvent[] = [];
  const result = await runAgent({
    skill: "diagnose-page",
    input: "check my page",
    chat: chatScript([{ content: `To be ${CRUTCH}, the page is fine.`, toolCalls: [] }]),
    tools: [echoTool],
    onEvent: (e) => events.push(e),
  });
  assert.equal(result.ok, false);
  assert.equal(result.text, null);
  assert.equal(result.rejectedReason, "banned-phrase");
  assert.ok(events.some((e) => e.type === "guardrail_rejected"));
});

test("runner survives an unknown tool call and lets the model recover", async () => {
  const events: AgentEvent[] = [];
  const result = await runAgent({
    skill: "diagnose-page",
    input: "check",
    chat: chatScript([
      {
        content: "",
        toolCalls: [{ id: "c1", type: "function", function: { name: "not-a-tool", arguments: "{}" } }],
      },
      { content: "Could not run that step — here is what is real instead.", toolCalls: [] },
    ]),
    tools: [echoTool],
    onEvent: (e) => events.push(e),
  });
  assert.equal(result.ok, true);
  const toolDone = events.find((e) => e.type === "tool_done");
  assert.ok(toolDone && toolDone.type === "tool_done" && toolDone.ok === false);
});

test("runner without provider config fails soft (agent-disabled), never throws", async () => {
  const events: AgentEvent[] = [];
  const result = await runAgent({
    skill: "diagnose-page",
    input: "check",
    onEvent: (e) => events.push(e),
  });
  assert.equal(result.ok, false);
  assert.equal(result.errorMessage, "agent-disabled");
  assert.ok(events.some((e) => e.type === "agent_error"));
});

// ── skills + read-skill tool ────────────────────────────────────────────

test("skill registry + bodies load with the Swan anatomy sections", async () => {
  assert.equal(isSkillName("diagnose-page"), true);
  assert.equal(isSkillName("not-a-skill"), false);
  for (const name of Object.keys(SKILLS) as SkillName[]) {
    const body = await loadSkillBody(name);
    for (const section of ["## Purpose", "## Procedure", "## Universal rules", "## Anti-patterns", "## What good looks like"]) {
      assert.ok(body.includes(section), `${name} has ${section}`);
    }
  }
  const guardrails = await loadSkillBody("GUARDRAILS");
  assert.ok(guardrails.includes("Never send"));
});

test("runner enforces a tool's maxCalls ceiling structurally", async () => {
  const events: AgentEvent[] = [];
  const capped: AgentTool = { ...echoTool, maxCalls: 1 };
  const result = await runAgent({
    skill: "diagnose-page",
    input: "check",
    chat: chatScript([
      {
        content: "",
        toolCalls: [
          { id: "c1", type: "function", function: { name: "fake-echo", arguments: "{}" } },
          { id: "c2", type: "function", function: { name: "fake-echo", arguments: "{}" } },
        ],
      },
      { content: "Worked with what I had.", toolCalls: [] },
    ]),
    tools: [capped],
    onEvent: (e) => events.push(e),
  });
  assert.equal(result.ok, true);
  const dones = events.filter((e) => e.type === "tool_done");
  assert.equal(dones.length, 2);
  assert.equal(dones[0].type === "tool_done" && dones[0].ok, true);
  assert.equal(dones[1].type === "tool_done" && dones[1].ok, false, "second call over the ceiling errors");
});

test("every tool a skill declares resolves in the registry", () => {
  for (const [name, meta] of Object.entries(SKILLS)) {
    for (const toolName of meta.tools) {
      assert.ok(toolByName(toolName), `${name} references missing tool ${toolName}`);
    }
  }
});

test("tideover-read-skill refuses anything outside the allowlist", async () => {
  const tool = toolByName("tideover-read-skill");
  assert.ok(tool);
  const bad = await tool.run({ name: "../../.env.local" }, {});
  assert.deepEqual(JSON.parse(bad), { error: "unknown-skill" });
  const good = await tool.run({ name: "GUARDRAILS" }, {});
  assert.equal(JSON.parse(good).name, "GUARDRAILS");
  assert.ok(READABLE_DOCS.includes("GUARDRAILS"));
});
