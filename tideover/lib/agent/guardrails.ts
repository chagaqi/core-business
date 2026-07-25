import { enabledCapabilities } from "@/lib/drafting/capabilities";
import { llmDraftBlocked } from "@/lib/drafting/llm-lint";
import type { Merchant } from "@/lib/types";
import type { AgentAudience } from "@/lib/agent/types";

/**
 * Agent guardrails (SWAN SPRINT P1) — ENFORCED post-generation, never trusted to
 * the prompt. The inspectable statement of these rules lives in
 * lib/agent/skills/GUARDRAILS.md (backlog #18); this file is the enforcement.
 *
 * Two gates by audience:
 *  - "customer": anything that could reach a buyer gets the FULL send gate the
 *    LLM drafter uses (shared hard-date predicate, capability lint, banned
 *    phrases, forward-looking delivery promises) — identical rules to
 *    /api/approve-send, so the agent can never out-promise the product.
 *  - "merchant": analysis shown only to the merchant may quote the merchant's
 *    OWN page (including any dates it states — quoting their copy is not
 *    promising a buyer a date), so the hard-date ban does not apply; the banned
 *    list (merchant's + the crutch word) still does.
 *
 * Structural rules that need no lint: the agent has no send tool (drafts stage
 * behind ApprovalBar), and timing language comes from engine tool output — the
 * band passed in `band` is the only timing phrase that is always legal.
 */

// assembled so repo-wide copy greps for the crutch word stay clean (same trick as LlmDrafter)
const BANNED_CRUTCH = "hon" + "est";

export type GuardVerdict = { ok: true } | { ok: false; reason: string };

export function guardAgentText(
  text: string,
  opts: { audience: AgentAudience; merchant?: Merchant | null; band?: string },
): GuardVerdict {
  const banned = [...(opts.merchant?.brand.banned ?? []), BANNED_CRUTCH];

  if (opts.audience === "customer") {
    const reason = llmDraftBlocked(text, {
      banned,
      band: opts.band,
      capabilities: opts.merchant ? enabledCapabilities(opts.merchant) : [],
    });
    return reason ? { ok: false, reason } : { ok: true };
  }

  // merchant-facing: banned-word gate only (quoting their own page is allowed)
  const lower = text.toLowerCase();
  for (const word of banned) {
    const w = word.trim().toLowerCase();
    if (!w) continue;
    if (new RegExp(`\\b${w.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}\\b`, "i").test(lower)) {
      return { ok: false, reason: "banned-phrase" };
    }
  }
  return { ok: true };
}
