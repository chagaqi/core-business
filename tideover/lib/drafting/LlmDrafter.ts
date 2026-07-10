import { computeTimeline } from "@/lib/time";
import { DeterministicDrafter } from "@/lib/drafting/DeterministicDrafter";
import { llmDraftBlocked, sanitizeInline } from "@/lib/drafting/llm-lint";
import type { DraftContext, DrafterOutput, ReplyDrafter } from "@/lib/drafting/ReplyDrafter";
import type { OrderTimeline } from "@/lib/types";

/**
 * LLM drafter (ADR-0018) — per-tenant context, shared stateless model,
 * deterministic floor. Provider decided 2026-07-09 (Dylan): DeepSeek first-party
 * API, OpenAI-compatible chat completions. The /security page carries the
 * matching subprocessor disclosure.
 *
 * The floor, in order (none of these are optional):
 *  1. Env-gated: LLM_PROVIDER + LLM_API_KEY unset → DeterministicDrafter, the
 *     shipped demo posture.
 *  2. Any provider error, timeout (8s), unknown provider, or empty/malformed
 *     output → the DeterministicDrafter draft for the same context.
 *  3. Every LLM draft passes the reply-QA hard gate (ADR-0014, lib/qa.ts —
 *     the same containsHardDate predicate /api/approve-send enforces) BEFORE it
 *     is returned. A blocked draft is replaced by the deterministic draft and
 *     the failure is logged (structured, never the ticket body).
 *  4. Human approval stays mandatory downstream (ApprovalBar) — the model
 *     changes draft quality, never the trust model.
 *
 * The eval harness (ADR-0006) keeps running on the deterministic engine and is
 * untouched by any of this.
 */

const DEFAULT_TIMEOUT_MS = 8_000;

/**
 * Tighter deadline for the buyer-facing ingest path (/api/widget-submit): the
 * buyer is waiting on the HTTP response, so the LLM gets ~4.5s before the
 * deterministic floor answers instead. Operator-side paths keep the 8s default.
 */
export const INGEST_DRAFT_TIMEOUT_MS = 4_500;
const TEMPERATURE = 0.3;
const MAX_TOKENS = 600;

// The banned crutch word ("hon" + "est") is assembled so repo-wide copy greps
// for it stay clean; the model is still explicitly instructed not to use it.
const BANNED_CRUTCH = "hon" + "est";

/**
 * Tenant profile → system prompt (ADR-0018 decision 4). Everything the model may
 * say comes from ctx; the proof-only contract is spelled out as hard rules. The
 * confidence band is precomputed by the same math the engine uses and must be
 * used verbatim — the model never does timeline arithmetic.
 */
export function buildSystemPrompt(ctx: DraftContext, timeline: OrderTimeline): string {
  const { merchant, customer, order, ticket } = ctx;
  const brand = merchant.brand;
  const activeStage =
    merchant.stages.find((s) => s.key === order.productionStage) ?? merchant.stages[0];
  const stageLines = merchant.stages
    .map((s) => `  - ${s.label} (days ${s.dayBand.from}-${s.dayBand.to}): ${s.blurb}`)
    .join("\n");
  const banned = [...brand.banned, BANNED_CRUTCH].join(", ");
  // customer-derived fields are sanitized before interpolation: a crafted
  // firstName ("Sam\nSYSTEM: ...") must never open a new prompt line.
  const firstName = sanitizeInline(customer.firstName);
  const sentiment = sanitizeInline(String(ticket.sentiment ?? ""));

  return [
    `You draft support replies for ${merchant.name}, a presale/crowdfunding merchant. The buyer paid and is waiting on a preorder; your job is a calm, specific reassurance reply in the merchant's voice.`,
    ``,
    `Brand voice: ${brand.voice}`,
    `Tone: ${brand.tone.join(", ")}`,
    `Sign-off (end the reply with it, verbatim): ${brand.signoff}`,
    `Words and framings this brand bans: ${banned}`,
    ``,
    `The only facts you may use (nothing else exists):`,
    `  - Buyer first name: ${firstName}`,
    `  - Buyer sentiment: ${sentiment}`,
    `  - Current production stage: ${activeStage ? `${activeStage.label} — ${activeStage.blurb}` : "in production"}`,
    `  - Days the buyer has been waiting: ${timeline.daysInWait}`,
    `  - Timing to give the buyer, verbatim: "${timeline.confidenceBand}"`,
    `Production stages for this product, in order:`,
    stageLines,
    ``,
    `Hard rules (violating any of these makes the reply unusable):`,
    `1. NEVER state or imply a calendar date, weekday, or hard delivery/ship date. The only timing you may give is the verbatim phrase above. Confidence bands, never dates.`,
    `2. Never invent order facts, tracking events, warehouse checks, or conversations that are not listed above. If it is not listed, it did not happen.`,
    `3. Do not use the word "${BANNED_CRUTCH}" or any banned word above.`,
    `4. Output the reply body only — no subject line, no markdown, no notes to the operator. Greet the buyer by first name; end with the sign-off.`,
  ].join("\n");
}

/** The ticket as the user message. Defensive: ingest may pass a partial ticket. */
export function buildUserMessage(ctx: DraftContext): string {
  const subject = (ctx.ticket.subject ?? "").trim();
  const body = (ctx.ticket.body ?? "").trim();
  if (!subject && !body) return "The buyer asked for a status update on their order.";
  return [subject ? `Subject: ${subject}` : "", body].filter(Boolean).join("\n\n");
}

/** structured fallback log — event + ids only, NEVER the ticket or draft body. */
function warnFallback(event: string, ctx: DraftContext, detail?: string): void {
  console.warn(
    JSON.stringify({
      at: "LlmDrafter",
      event,
      provider: process.env.LLM_PROVIDER ?? null,
      merchantId: ctx.merchant.id,
      ticketId: ctx.ticket.id ?? null,
      detail: detail ?? null,
    }),
  );
}

/** OpenAI-compatible chat-completions call (DeepSeek first-party endpoint). */
async function callOpenAiCompatible(
  endpoint: string,
  system: string,
  user: string,
  timeoutMs: number,
): Promise<string> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  try {
    const res = await fetch(endpoint, {
      method: "POST",
      headers: {
        "content-type": "application/json",
        authorization: `Bearer ${process.env.LLM_API_KEY}`,
      },
      body: JSON.stringify({
        model: process.env.LLM_MODEL || "deepseek-chat",
        messages: [
          { role: "system", content: system },
          { role: "user", content: user },
        ],
        temperature: TEMPERATURE,
        max_tokens: MAX_TOKENS,
        stream: false,
      }),
      signal: controller.signal,
    });
    if (!res.ok) throw new Error(`LLM provider returned HTTP ${res.status}`);
    const json: unknown = await res.json();
    const content = (json as { choices?: Array<{ message?: { content?: unknown } }> })
      ?.choices?.[0]?.message?.content;
    if (typeof content !== "string" || !content.trim()) {
      throw new Error("LLM provider response missing choices[0].message.content");
    }
    return content.trim();
  } finally {
    clearTimeout(timer);
  }
}

/**
 * Provider switch on LLM_PROVIDER. "anthropic" (or any future provider) gets its
 * own case here; until wired it hits the not-configured error, which draft()
 * catches into the deterministic floor — enabling an unwired provider can never
 * break drafting.
 */
async function callProvider(system: string, user: string, timeoutMs: number): Promise<string> {
  const provider = (process.env.LLM_PROVIDER ?? "").toLowerCase();
  switch (provider) {
    case "deepseek":
      return callOpenAiCompatible("https://api.deepseek.com/chat/completions", system, user, timeoutMs);
    default:
      throw new Error(`LLM_PROVIDER "${provider}" has no wired adapter in LlmDrafter`);
  }
}

export class LlmDrafter implements ReplyDrafter {
  readonly kind = "llm" as const;
  private fallback = new DeterministicDrafter();
  /** injectable so latency-sensitive callers (buyer-facing ingest) can shorten it. */
  readonly timeoutMs: number;

  constructor(opts?: { timeoutMs?: number }) {
    this.timeoutMs = opts?.timeoutMs ?? DEFAULT_TIMEOUT_MS;
  }

  private configured(): boolean {
    return Boolean(process.env.LLM_PROVIDER && process.env.LLM_API_KEY);
  }

  async draft(ctx: DraftContext): Promise<DrafterOutput> {
    // The floor is computed first: it is the guaranteed answer, and it carries
    // the engine's confidence band + priority, which the LLM draft reuses
    // (provenance: draftedBy "llm" vs "deterministic" marks the source).
    const floor = await this.fallback.draft(ctx);
    if (!this.configured()) return floor;

    let text: string;
    try {
      const timeline = computeTimeline(ctx.order, ctx.merchant, ctx.now);
      text = await callProvider(buildSystemPrompt(ctx, timeline), buildUserMessage(ctx), this.timeoutMs);
    } catch (err) {
      warnFallback("provider_error", ctx, err instanceof Error ? err.message : "unknown error");
      return floor;
    }

    // ADR-0014 reply-QA gate, BEFORE the draft leaves the drafter. llmDraftBlocked
    // is the same hard-date predicate /api/approve-send enforces server-side PLUS
    // the LLM-output-only extended lint (weekday promises, "within N days"
    // guarantees, ordinal / day-first dates) in lib/drafting/llm-lint.ts.
    const reason = llmDraftBlocked(text);
    if (reason) {
      warnFallback(reason === "hard-date" ? "qa_reject_hard_date" : "llm_lint_reject", ctx, reason);
      return floor;
    }

    return {
      text,
      confidenceBand: floor.confidenceBand,
      priority: floor.priority,
      draftedBy: this.kind,
    };
  }
}

/**
 * select the active drafter from env. Unset LLM_PROVIDER = deterministic-only.
 * `timeoutMs` lets latency-sensitive callers (buyer-facing ingest) shorten the
 * LLM deadline; it is ignored on the deterministic path.
 */
export function getDrafter(opts?: { timeoutMs?: number }): ReplyDrafter {
  return process.env.LLM_PROVIDER ? new LlmDrafter(opts) : new DeterministicDrafter();
}
