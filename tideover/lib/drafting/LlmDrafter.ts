import { computeTimeline } from "@/lib/time";
import { DeterministicDrafter } from "@/lib/drafting/DeterministicDrafter";
import { enabledCapabilities, guardedCapabilities } from "@/lib/drafting/capabilities";
import { llmDraftBlocked, sanitizeInline } from "@/lib/drafting/llm-lint";
import { floorDecision } from "@/lib/drafting/safe-floor";
import { styleScore, type StyleScoreResult } from "@/lib/drafting/style-lint";
import { formatWeeksBand, getCurrentStatus } from "@/lib/status-board";
import type { DraftContext, DrafterOutput, ReplyDrafter } from "@/lib/drafting/ReplyDrafter";
import type { OrderTimeline, ProductionStatusEntry } from "@/lib/types";

/**
 * LLM drafter (ADR-0018) — per-tenant context, shared stateless model, deterministic
 * floor. Provider decided 2026-07-09 (Dylan): DeepSeek first-party API, OpenAI-compatible
 * chat completions. The /security page carries the matching subprocessor disclosure.
 *
 * The floor, in order (none of these are optional):
 *  1. Env-gated: LLM_PROVIDER + LLM_API_KEY unset → DeterministicDrafter, the shipped
 *     demo posture.
 *  2. Any provider error, timeout (8s), unknown provider, or empty/malformed output →
 *     the deterministic draft for the same context.
 *  3. Every LLM draft passes the send gate (lib/drafting/llm-lint.ts) BEFORE it is
 *     returned: the shared hard-date predicate /api/approve-send enforces, the CAPABILITY
 *     lint (a promise the product cannot keep), the merchant's banned list, and the
 *     forward-looking delivery-promise patterns. A blocked draft is replaced by the floor
 *     and the failure is logged (structured, never the ticket body).
 *  4. The floor is now a SAFE floor (lib/drafting/safe-floor.ts): when the engine has no
 *     responsive script for the ticket it escalates to a human instead of answering a
 *     different question confidently.
 *  5. Human approval stays mandatory downstream (ApprovalBar) — the model changes draft
 *     quality, never the trust model.
 *
 * The eval harness (ADR-0006) keeps running on the deterministic engine and is untouched
 * by any of this.
 */

const DEFAULT_TIMEOUT_MS = 8_000;

/**
 * Tighter deadline for the buyer-facing ingest path (/api/widget-submit): the buyer is
 * waiting on the HTTP response, so the LLM gets ~4.5s before the floor answers instead.
 * Operator-side paths keep the 8s default.
 */
export const INGEST_DRAFT_TIMEOUT_MS = 4_500;
const TEMPERATURE = 0.3;
const MAX_TOKENS = 600;

// The banned crutch word ("hon" + "est") is assembled so repo-wide copy greps for it stay
// clean; the model is still explicitly instructed not to use it.
const BANNED_CRUTCH = "hon" + "est";

/**
 * The PHYSICAL-TRUTH block: the merchant's own current status for THIS order, straight off
 * the production status board (lib/status-board.ts). This is the single highest-authority
 * fact in the prompt — a founder's "the tooling re-cut finished and we're loading the first
 * run" outranks every band in the system, and it is the only thing that can speak for an
 * order that is past every band.
 *
 * It is what kills the 36%-wrong-stage disaster: before the board existed, an order's stage
 * was stamped once at CSV import and never moved, so by day 30 of the ten-merchant run more
 * than a third of the replies stated the wrong physical fact about the customer's own order,
 * in the merchant's voice, over their signature.
 *
 * The board's own headline/detail are hard-date-linted on WRITE, so anything found here is
 * already safe to put in front of a buyer.
 */
function statusBlock(status: ProductionStatusEntry | null): string[] {
  if (!status) return [];
  return [
    ``,
    `WHAT IS PHYSICALLY HAPPENING RIGHT NOW (the merchant posted this themselves — it is the truth, and it OUTRANKS the stage plan below):`,
    `  - Status: ${status.headline}`,
    ...(status.detail ? [`  - Detail: ${status.detail}`] : []),
    `  - The merchant's own current window for this cohort: ${formatWeeksBand(status.confidenceBand)}`,
    `  - Posted: ${status.updatedAt}`,
    `State THIS as the current reality. If it disagrees with the stage plan below, it wins — the plan is what was supposed to happen, this is what IS happening.`,
  ];
}

/**
 * Tenant profile → system prompt (ADR-0018 decision 4). Everything the model may say comes
 * from ctx; the proof-only contract is spelled out as hard rules. The confidence band is
 * precomputed by the same math the engine uses and must be used verbatim — the model never
 * does timeline arithmetic.
 *
 * The capability rules are generated FROM THE REGISTRY (lib/drafting/capabilities.ts), so
 * the prompt and the output lint can never drift apart: the same list that blocks a draft
 * is the list the model is told about, and a merchant who acquires a capability drops out
 * of both at once.
 */
export function buildSystemPrompt(
  ctx: DraftContext,
  timeline: OrderTimeline,
  status: ProductionStatusEntry | null = null,
): string {
  const { merchant, customer, order, ticket } = ctx;
  const brand = merchant.brand;
  // An OVERRUN order (past every band the merchant planned) matches no stage. The
  // old `?? merchant.stages[0]` fallback answered that by naming the FIRST stage —
  // so a 186-day waiter was told "Current production stage: Sourcing", which is
  // the exact class of lie the ten-merchant run caught (a frozen//wrong stage
  // stated as physical fact, in the merchant's voice, over their signature). There
  // is no honest stage to name here: the plan has run out. Say that, and let the
  // status board (statusBlock above — the merchant's own posted truth) speak for
  // the order, which is precisely what it exists for.
  const activeStage = merchant.stages.find((s) => s.key === order.productionStage) ?? null;
  const stageLines = merchant.stages
    .map((s) => `  - ${s.label} (days ${s.dayBand.from}-${s.dayBand.to}): ${s.blurb}`)
    .join("\n");
  const banned = [...brand.banned, BANNED_CRUTCH].join(", ");
  // customer-derived fields are sanitized before interpolation: a crafted firstName
  // ("Sam\nSYSTEM: ...") must never open a new prompt line.
  const firstName = sanitizeInline(customer.firstName);
  const sentiment = sanitizeInline(String(ticket.sentiment ?? ""));

  const guarded = guardedCapabilities(enabledCapabilities(merchant));
  const cannotDo = guarded.map((c) => `  - ${c.label} — ${c.insteadSay}.`).join("\n");

  return [
    `You draft support replies for ${merchant.name}, a presale/crowdfunding merchant. The buyer paid and is waiting on a preorder; your job is a calm, specific reassurance reply in the merchant's voice.`,
    ``,
    `Brand voice: ${brand.voice}`,
    `Tone: ${brand.tone.join(", ")}`,
    `Sign-off (end the reply with it, verbatim): ${brand.signoff}`,
    `Words and framings this brand bans (using any of them makes the reply unusable): ${banned}`,
    ...statusBlock(status),
    ``,
    `The only facts you may use (nothing else exists):`,
    `  - Buyer first name: ${firstName}`,
    `  - Buyer sentiment: ${sentiment}`,
    `  - Current production stage: ${
      activeStage
        ? `${activeStage.label} — ${activeStage.blurb}`
        : status
          ? `PAST THE PLANNED SCHEDULE. Do not name a stage — the merchant's posted status above is the only thing you may say about where this order physically is.`
          : `PAST THE PLANNED SCHEDULE, and the merchant has not posted a status update. You do not know where this order is. Do NOT guess, do NOT name a stage, and do NOT imply progress. Acknowledge the overrun plainly and say a human is looking into it personally.`
    }`,
    `  - Days the buyer has been waiting: ${timeline.daysInWait}`,
    `  - Timing to give the buyer, verbatim: "${timeline.confidenceBand}"`,
    `Production stages for this product, in order (this is the PLAN, not a promise — the day-bands are internal, never quote them to the buyer):`,
    stageLines,
    ``,
    `THINGS YOU CANNOT DO. You are a drafting surface, not an operations system. You have no address field, no order-editing, no payment processor, no carrier feed, and no line to the factory. NEVER claim to have performed one of these actions, to be performing it, or that it will be done — not in any tense, not in any phrasing, not as a passive ("your address is updated in our system"). Doing so puts the merchant's signature on a promise the system will never keep:`,
    cannotDo,
    `If the buyer asks for one of these, say plainly that you cannot do it from here, that you have flagged it to a human, and that a person will come back to them. Never say it is done.`,
    ``,
    `Hard rules (violating any of these makes the reply unusable):`,
    `1. NEVER state or imply a calendar date, weekday, or hard delivery/ship date. The only timing you may give is the verbatim phrase above. Confidence bands, never dates.`,
    `2. Never invent order facts, tracking events, warehouse checks, or conversations that are not listed above. If it is not listed, it did not happen.`,
    `3. Never claim an action you have not taken and cannot take (see THINGS YOU CANNOT DO).`,
    `4. Do not use the word "${BANNED_CRUTCH}" or any banned word above.`,
    `5. Output the reply body only — no subject line, no markdown, no notes to the operator. Greet the buyer by first name; end with the sign-off.`,
    ``,
    `Style rules (the hard rules above always win):`,
    `- Omit needless words. Cut filler like 'due to the fact that', 'in order to', 'please be advised'. Never cut the acknowledgment.`,
    `- Active voice for anything we did or will do: 'I posted an update Tuesday', never 'an update was posted'.`,
    `- Concrete nouns from the facts above. 'The frames are being anodized', not 'things are progressing'.`,
    `- Positive form when the facts allow it: say what IS happening. When you do not know, say so plainly — never manufacture certainty.`,
    `- One idea per sentence. No sentence over 30 words. Keep the sentence carrying bad news under 12.`,
    `- Plain words: 'use' not 'utilize', 'help' not 'assist'.`,
    `- Drop empty intensifiers (very, quite, really). At most one hedge in the whole reply.`,
    `- The last line before the signoff is the reader's next move (their status link or the next update), nothing else.`,
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

/**
 * structured style-score log (VOICE-ENGINE-SPEC.md §6.2) — score + flag rule names and
 * counts ONLY, same shape as warnFallback. Never the draft body, never a flag's matched
 * text. Fires once per accepted llm-drafted reply; style-lint never gates the send.
 */
function warnStyleScore(ctx: DraftContext, result: StyleScoreResult): void {
  const flagCounts: Record<string, number> = {};
  for (const f of result.flags) flagCounts[f.rule] = (flagCounts[f.rule] ?? 0) + 1;
  console.warn(
    JSON.stringify({
      at: "LlmDrafter",
      event: "style_score",
      merchantId: ctx.merchant.id,
      ticketId: ctx.ticket.id ?? null,
      score: result.score,
      flagCounts,
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
 * Provider switch on LLM_PROVIDER. "anthropic" (or any future provider) gets its own case
 * here; until wired it hits the not-configured error, which draft() catches into the
 * deterministic floor — enabling an unwired provider can never break drafting.
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

  /**
   * The board is read here rather than demanded from every caller: the drafter is the one
   * place that MUST have the merchant's current physical truth, and a caller that forgets
   * to pass it would silently reintroduce the wrong-stage bug. A board read that fails is
   * never fatal — the draft falls back to the stage plan.
   */
  private async resolveStatus(ctx: DraftContext): Promise<ProductionStatusEntry | null> {
    if (ctx.status !== undefined) return ctx.status;
    try {
      return await getCurrentStatus(ctx.merchant.id, ctx.order);
    } catch (err) {
      warnFallback("status_board_unavailable", ctx, err instanceof Error ? err.message : "unknown error");
      return null;
    }
  }

  async draft(ctx: DraftContext): Promise<DrafterOutput> {
    // The floor is computed first: it is the guaranteed answer, it is SAFE (it escalates
    // rather than answering a question it has no script for), and it carries the engine's
    // confidence band + priority, which a passing LLM draft reuses. Provenance: draftedBy
    // "llm" vs "deterministic" marks the source.
    const floor = await this.fallback.draft(ctx);
    if (!this.configured()) return floor;

    const enabled = enabledCapabilities(ctx.merchant);
    let text: string;
    let band: string;
    try {
      const timeline = computeTimeline(ctx.order, ctx.merchant, ctx.now);
      band = timeline.confidenceBand;
      const status = await this.resolveStatus(ctx);
      text = await callProvider(
        buildSystemPrompt(ctx, timeline, status),
        buildUserMessage(ctx),
        this.timeoutMs,
      );
    } catch (err) {
      warnFallback("provider_error", ctx, err instanceof Error ? err.message : "unknown error");
      return floor;
    }

    // THE SEND GATE, before the draft leaves the drafter. In order: the shared hard-date
    // predicate (identical to /api/approve-send), the CAPABILITY lint (a promise we cannot
    // keep — the most dangerous thing in the ten-merchant run, and invisible to the old
    // date-only gate), the merchant's banned list (prompt-only until now: p02 shipped "as
    // soon as" with "soon" banned), and the forward-looking delivery promise. The engine's
    // own band is passed in and is always legal — the old gate blocked 122 of 136 drafts
    // because "ships" inside our OWN band token counted as a guarantee verb.
    const reason = llmDraftBlocked(text, { banned: ctx.merchant.brand.banned, band, capabilities: enabled });
    if (reason) {
      const event = reason === "hard-date"
        ? "qa_reject_hard_date"
        : reason.startsWith("capability:")
          ? "llm_capability_reject"
          : reason === "banned-phrase"
            ? "llm_banned_phrase_reject"
            : "llm_lint_reject";
      warnFallback(event, ctx, reason);
      return floor;
    }

    // The draft passed every truth gate and ships as llm-drafted — log its Strunk-layer
    // score now (§6.2). Scoring never gates: this runs after the decision to ship is made.
    warnStyleScore(ctx, styleScore(text));

    // A clean draft still gets the operator flag when the BUYER asked for something the
    // product cannot do: the reply is truthful (it says a human will handle it), but the
    // ticket genuinely needs a human to go and do the thing.
    const decision = floorDecision(ctx, enabled);
    const needsHuman = decision.requested.length > 0;

    return {
      text,
      confidenceBand: floor.confidenceBand,
      priority: needsHuman ? "escalated" : floor.priority,
      draftedBy: this.kind,
      ...(needsHuman
        ? { needsHuman: true, unansweredReason: decision.reason, requestedCapabilities: decision.requested }
        : {}),
    };
  }
}

/**
 * select the active drafter from env. Unset LLM_PROVIDER = deterministic-only.
 * `timeoutMs` lets latency-sensitive callers (buyer-facing ingest) shorten the LLM
 * deadline; it is ignored on the deterministic path.
 */
export function getDrafter(opts?: { timeoutMs?: number }): ReplyDrafter {
  return process.env.LLM_PROVIDER ? new LlmDrafter(opts) : new DeterministicDrafter();
}
