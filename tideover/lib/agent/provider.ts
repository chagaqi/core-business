/**
 * Provider adapter (SWAN SPRINT P1) — OpenAI-compatible streaming chat with tool
 * calling. Reuses the exact env pair LlmDrafter runs on (LLM_PROVIDER +
 * LLM_API_KEY, DeepSeek first-party endpoint — Dylan 2026-07-24) and keeps the
 * same provider-switch seam: a future provider is a new case here, never a
 * rewrite. Errors throw; the runner catches into its no-dead-end path.
 */

export interface ProviderToolCall {
  id: string;
  type: "function";
  function: { name: string; arguments: string };
}

export type ChatMessage =
  | { role: "system" | "user"; content: string }
  | { role: "assistant"; content: string | null; tool_calls?: ProviderToolCall[] }
  | { role: "tool"; content: string; tool_call_id: string };

export interface ToolSchema {
  type: "function";
  function: { name: string; description: string; parameters: Record<string, unknown> };
}

export interface ChatResult {
  content: string;
  toolCalls: ProviderToolCall[];
}

export type ChatFn = (opts: {
  messages: ChatMessage[];
  tools: ToolSchema[];
  timeoutMs: number;
  onTextDelta?: (text: string) => void;
}) => Promise<ChatResult>;

const TEMPERATURE = 0.3;
const MAX_TOKENS = 2_000;

export function agentConfigured(): boolean {
  return Boolean(process.env.LLM_PROVIDER && process.env.LLM_API_KEY);
}

/** parse one OpenAI-compatible SSE chunk line's delta into the accumulators */
interface PartialCall {
  id: string;
  name: string;
  args: string;
}

async function streamOpenAiCompatible(
  endpoint: string,
  opts: Parameters<ChatFn>[0],
): Promise<ChatResult> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), opts.timeoutMs);
  try {
    const res = await fetch(endpoint, {
      method: "POST",
      headers: {
        "content-type": "application/json",
        authorization: `Bearer ${process.env.LLM_API_KEY}`,
      },
      body: JSON.stringify({
        model: process.env.LLM_MODEL || "deepseek-chat",
        messages: opts.messages,
        ...(opts.tools.length > 0 ? { tools: opts.tools } : {}),
        temperature: TEMPERATURE,
        max_tokens: MAX_TOKENS,
        stream: true,
      }),
      signal: controller.signal,
    });
    if (!res.ok || !res.body) throw new Error(`LLM provider returned HTTP ${res.status}`);

    const reader = res.body.getReader();
    const decoder = new TextDecoder();
    let buffer = "";
    let content = "";
    const calls = new Map<number, PartialCall>();

    const handleLine = (line: string) => {
      const trimmed = line.trim();
      if (!trimmed.startsWith("data:")) return;
      const payload = trimmed.slice(5).trim();
      if (!payload || payload === "[DONE]") return;
      let json: unknown;
      try {
        json = JSON.parse(payload);
      } catch {
        return; // partial/garbled chunk — the [DONE] contract means we can skip safely
      }
      const delta = (json as {
        choices?: Array<{
          delta?: {
            content?: string | null;
            tool_calls?: Array<{
              index: number;
              id?: string;
              function?: { name?: string; arguments?: string };
            }>;
          };
        }>;
      })?.choices?.[0]?.delta;
      if (!delta) return;
      if (typeof delta.content === "string" && delta.content) {
        content += delta.content;
        opts.onTextDelta?.(delta.content);
      }
      for (const frag of delta.tool_calls ?? []) {
        const call = calls.get(frag.index) ?? { id: "", name: "", args: "" };
        if (frag.id) call.id = frag.id;
        if (frag.function?.name) call.name += frag.function.name;
        if (frag.function?.arguments) call.args += frag.function.arguments;
        calls.set(frag.index, call);
      }
    };

    for (;;) {
      const { done, value } = await reader.read();
      if (done) break;
      buffer += decoder.decode(value, { stream: true });
      const lines = buffer.split("\n");
      buffer = lines.pop() ?? "";
      for (const line of lines) handleLine(line);
    }
    handleLine(buffer);

    const toolCalls: ProviderToolCall[] = [...calls.entries()]
      .sort(([a], [b]) => a - b)
      .map(([i, c]) => ({
        id: c.id || `call_${i}`,
        type: "function" as const,
        function: { name: c.name, arguments: c.args || "{}" },
      }))
      .filter((c) => c.function.name);

    return { content: content.trim(), toolCalls };
  } finally {
    clearTimeout(timer);
  }
}

/** Provider switch — same shape as LlmDrafter.callProvider. */
export const providerChat: ChatFn = (opts) => {
  const provider = (process.env.LLM_PROVIDER ?? "").toLowerCase();
  switch (provider) {
    case "deepseek":
      return streamOpenAiCompatible("https://api.deepseek.com/chat/completions", opts);
    default:
      return Promise.reject(new Error(`LLM_PROVIDER "${provider}" has no wired agent adapter`));
  }
};
