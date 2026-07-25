import { guardAgentText } from "@/lib/agent/guardrails";
import { buildAgentSystemPrompt } from "@/lib/agent/prompt";
import { agentConfigured, providerChat, type ChatFn, type ChatMessage, type ToolSchema } from "@/lib/agent/provider";
import { SKILLS, loadSkillBody, type SkillName } from "@/lib/agent/skills";
import { toolByName } from "@/lib/agent/tools";
import type { AgentEvent, AgentTool } from "@/lib/agent/types";
import { getRepositories } from "@/lib/repositories";
import type { Merchant } from "@/lib/types";

/**
 * Agent runner (SWAN SPRINT P1) — the tool loop. Emits AgentEvents so the UI
 * ToolChecklist/StreamingText (ADR-0023) can show REAL work, never a script.
 *
 * No-dead-end contract: this function never throws. Provider failure, an
 * unconfigured env, or a guardrail rejection all return {ok:false, ...} and the
 * calling surface falls back to its deterministic path.
 *
 * Guardrails: the final text passes guardAgentText with the skill's audience
 * BEFORE it is returned. The band from the most recent tideover-draft-reply
 * result is passed through so the engine's own band phrase is always legal
 * (same rule the LLM drafter's send gate uses).
 */

const DEFAULT_TIMEOUT_MS = 60_000;
const DEFAULT_MAX_TURNS = 6;
const MAX_TOOL_CALLS = 12;

export interface RunAgentOptions {
  skill: SkillName;
  /** the merchant's message / the input (e.g. a URL for diagnose-page) */
  input: string;
  merchantId?: string;
  onEvent?: (event: AgentEvent) => void;
  /** injectable provider for tests; defaults to the DeepSeek adapter */
  chat?: ChatFn;
  /** injectable tool set for tests; defaults to the skill's allowlisted CORE_TOOLS */
  tools?: AgentTool[];
  maxTurns?: number;
  timeoutMs?: number;
  now?: Date;
}

export interface RunAgentResult {
  ok: boolean;
  /** the guarded final text; null when rejected or errored */
  text: string | null;
  toolCount: number;
  rejectedReason?: string;
  errorMessage?: string;
}

/** structured log — event + ids only, NEVER prompt/draft bodies (LlmDrafter convention) */
function warnAgent(event: string, detail?: string, merchantId?: string): void {
  console.warn(JSON.stringify({ at: "AgentRunner", event, merchantId: merchantId ?? null, detail: detail ?? null }));
}

export async function runAgent(opts: RunAgentOptions): Promise<RunAgentResult> {
  const emit = opts.onEvent ?? (() => {});
  const chat = opts.chat ?? providerChat;
  const fail = (message: string): RunAgentResult => {
    emit({ type: "agent_error", message });
    return { ok: false, text: null, toolCount: 0, errorMessage: message };
  };

  if (!opts.chat && !agentConfigured()) return fail("agent-disabled");

  try {
    const meta = SKILLS[opts.skill];
    const skillTools: AgentTool[] =
      opts.tools ??
      meta.tools.map((name) => {
        const tool = toolByName(name);
        if (!tool) throw new Error(`skill ${opts.skill} references unknown tool ${name}`);
        return tool;
      });
    const schemas: ToolSchema[] = skillTools.map((t) => ({
      type: "function",
      function: { name: t.name, description: t.description, parameters: t.parameters },
    }));

    let merchant: Merchant | null = null;
    if (opts.merchantId) {
      merchant = await getRepositories().merchants.findById(opts.merchantId);
      if (!merchant) return fail("merchant-not-found");
    }

    const system = buildAgentSystemPrompt({ skillBody: await loadSkillBody(opts.skill), merchant });
    const messages: ChatMessage[] = [
      { role: "system", content: system },
      { role: "user", content: opts.input },
    ];

    const ctx = { merchantId: opts.merchantId, now: opts.now };
    let toolCount = 0;
    const callsPerTool = new Map<string, number>();
    let lastBand: string | undefined;
    const maxTurns = opts.maxTurns ?? DEFAULT_MAX_TURNS;
    const timeoutMs = opts.timeoutMs ?? DEFAULT_TIMEOUT_MS;

    for (let turn = 0; turn < maxTurns; turn++) {
      const result = await chat({
        messages,
        tools: schemas,
        timeoutMs,
        onTextDelta: (text) => emit({ type: "text_delta", text }),
      });

      if (result.toolCalls.length === 0) {
        const text = result.content;
        if (!text) return fail("empty-response");
        const verdict = guardAgentText(text, { audience: meta.audience, merchant, band: lastBand });
        if (!verdict.ok) {
          warnAgent("guardrail_rejected", verdict.reason, opts.merchantId);
          emit({ type: "guardrail_rejected", reason: verdict.reason });
          return { ok: false, text: null, toolCount, rejectedReason: verdict.reason };
        }
        emit({ type: "turn_done", text, toolCount });
        return { ok: true, text, toolCount };
      }

      messages.push({ role: "assistant", content: result.content || null, tool_calls: result.toolCalls });

      for (const call of result.toolCalls) {
        toolCount++;
        if (toolCount > MAX_TOOL_CALLS) return fail("tool-budget-exhausted");
        const tool = skillTools.find((t) => t.name === call.function.name);

        // parse args BEFORE emitting so the checklist line can name its target
        let args: Record<string, unknown> = {};
        let argsOk = true;
        try {
          args = JSON.parse(call.function.arguments || "{}") as Record<string, unknown>;
        } catch {
          argsOk = false;
        }
        let label = tool?.label ?? call.function.name;
        if (tool?.labelFor && argsOk) {
          try {
            label = tool.labelFor(args);
          } catch {
            /* fall back to the static label */
          }
        }
        emit({ type: "tool_started", id: call.id, tool: call.function.name, label });

        let output: string;
        let ok = true;
        if (!tool) {
          ok = false;
          output = JSON.stringify({ error: `unknown tool ${call.function.name}` });
        } else {
          const used = (callsPerTool.get(tool.name) ?? 0) + 1;
          callsPerTool.set(tool.name, used);
          if (!argsOk) {
            ok = false;
            output = JSON.stringify({ error: "malformed-arguments" });
          } else if (tool.maxCalls && used > tool.maxCalls) {
            // the skill's prose ceiling, enforced structurally
            ok = false;
            output = JSON.stringify({
              error: `tool-call-limit: ${tool.name} allows at most ${tool.maxCalls} calls per run — work with what you have`,
            });
          } else {
            try {
              output = await tool.run(args, ctx);
              ok = !output.startsWith(`{"error"`);
            } catch (err) {
              ok = false;
              output = JSON.stringify({ error: err instanceof Error ? err.message : "tool-failed" });
              warnAgent("tool_error", `${call.function.name}: ${output.slice(0, 120)}`, opts.merchantId);
            }
          }
          if (ok && tool.name === "tideover-draft-reply") {
            try {
              const parsed = JSON.parse(output) as { confidenceBand?: string };
              if (typeof parsed.confidenceBand === "string") lastBand = parsed.confidenceBand;
            } catch {
              /* band stays unset — guard simply has no legal-band carve-out */
            }
          }
        }
        emit({ type: "tool_done", id: call.id, tool: call.function.name, label, ok });
        messages.push({ role: "tool", content: output, tool_call_id: call.id });
      }
    }
    return fail("max-turns-exhausted");
  } catch (err) {
    const message = err instanceof Error ? err.message : "agent-failed";
    warnAgent("runner_error", message, opts.merchantId);
    return fail(message);
  }
}
