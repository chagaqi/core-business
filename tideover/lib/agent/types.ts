/**
 * Agent core types (SWAN SPRINT P1, ADR-0023). The runner emits AgentEvents;
 * UI surfaces (ToolChecklist, StreamingText) and the repl render them. Tools
 * are least-privilege: each skill declares which tools it may call.
 */

export interface AgentContext {
  /** tenant scope for every repository-backed tool; unset = tools that need it error */
  merchantId?: string;
  now?: Date;
}

export interface AgentTool {
  /** tideover-verb-noun (Swan's convention) */
  name: string;
  /** human checklist line, present tense: "Reading the page" */
  label: string;
  /** derive a per-call label from the parsed args ("Reading tideover.app/pricing") */
  labelFor?: (args: Record<string, unknown>) => string;
  /**
   * hard per-run call ceiling, ENFORCED by the runner (a skill's prose rule is
   * guidance; this is the guardrail). Exceeding calls return a tool error.
   */
  maxCalls?: number;
  /** for the model — prescriptive about WHEN to call it */
  description: string;
  /** JSON Schema for arguments (OpenAI function-calling shape) */
  parameters: Record<string, unknown>;
  /** returns a JSON string for the model; throws only on programmer error */
  run(args: Record<string, unknown>, ctx: AgentContext): Promise<string>;
}

export type AgentEvent =
  | { type: "tool_started"; id: string; tool: string; label: string }
  | { type: "tool_done"; id: string; tool: string; label: string; ok: boolean; note?: string }
  | { type: "text_delta"; text: string }
  | { type: "guardrail_rejected"; reason: string }
  | { type: "turn_done"; text: string; toolCount: number }
  | { type: "agent_error"; message: string };

/** Who reads the final text — decides which guardrail gate applies (see guardrails.ts). */
export type AgentAudience = "merchant" | "customer";
