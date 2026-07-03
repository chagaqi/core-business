import { assertNoHardDate } from "@/lib/proof";
import { DeterministicDrafter } from "@/lib/drafting/DeterministicDrafter";
import type { DraftContext, DrafterOutput, ReplyDrafter } from "@/lib/drafting/ReplyDrafter";

/**
 * Optional LLM drafter for NOVEL replies (cases the playbook doesn't cover).
 * Env-gated (LLM_PROVIDER + LLM_API_KEY) and intentionally NOT wired live in the
 * demo. When unconfigured it falls back to the deterministic drafter so the app
 * never breaks. The production prompt is constrained to honest confidence bands;
 * every LLM draft is still run through assertNoHardDate and still requires human
 * approval before send (no autonomous novel sends — ever).
 */
export class LlmDrafter implements ReplyDrafter {
  readonly kind = "llm" as const;
  private fallback = new DeterministicDrafter();

  private configured(): boolean {
    return Boolean(process.env.LLM_PROVIDER && process.env.LLM_API_KEY);
  }

  async draft(ctx: DraftContext): Promise<DrafterOutput> {
    if (!this.configured()) {
      return this.fallback.draft(ctx);
    }
    // PRODUCTION SKETCH (not executed in demo):
    //   const band = computeTimeline(ctx.order, ctx.merchant).confidenceBand;
    //   const system = buildPresaleSystemPrompt(ctx.merchant); // voice + banned + band rule
    //   const text = await callModel({ model: process.env.LLM_MODEL, system, user: ctx.ticket.body });
    //   assertNoHardDate(text);
    //   return { text, confidenceBand: band, priority: ..., draftedBy: "llm" };
    // Until wired, defer to deterministic to keep the contract honest:
    const out = await this.fallback.draft(ctx);
    assertNoHardDate(out.text);
    return out;
  }
}

/** select the active drafter from env. */
export function getDrafter(): ReplyDrafter {
  return process.env.LLM_PROVIDER ? new LlmDrafter() : new DeterministicDrafter();
}
