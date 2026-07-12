import { enabledCapabilities } from "@/lib/drafting/capabilities";
import { safeFloor } from "@/lib/drafting/safe-floor";
import { draftReassurance } from "@/lib/engines/reassurance";
import type { DraftContext, DrafterOutput, ReplyDrafter } from "@/lib/drafting/ReplyDrafter";

/**
 * The default drafter — pure rules + the merchant's playbook. No API key, fully
 * deterministic, and the moat: it encodes the day-stage reassurance language.
 *
 * It is ALSO the floor under every LLM draft (LlmDrafter holds one), which is why it
 * now runs its output through the safe floor (lib/drafting/safe-floor.ts). The engine
 * answers exactly one question — "where is my order, and how long" — and in the
 * ten-merchant run it answered every OTHER question with that same answer: a
 * refund-save script fired at a calm address change, "your tracking is generating" for
 * an order still in manufacturing. When the engine has no responsive script, this
 * drafter now hands the ticket to a human instead of speaking confidently past the
 * customer.
 *
 * The engine itself (lib/engines/reassurance.ts) is untouched — the eval harness reads
 * it directly, so no golden moves because of anything here.
 */
export class DeterministicDrafter implements ReplyDrafter {
  readonly kind = "deterministic" as const;

  async draft(ctx: DraftContext): Promise<DrafterOutput> {
    const r = draftReassurance({
      order: ctx.order,
      merchant: ctx.merchant,
      firstName: ctx.customer.firstName,
      sentiment: ctx.ticket.sentiment,
      now: ctx.now,
    });
    const engine: DrafterOutput = {
      text: r.draftText,
      confidenceBand: r.confidenceBand,
      priority: r.priority,
      draftedBy: this.kind,
    };
    return safeFloor(ctx, engine, enabledCapabilities(ctx.merchant));
  }
}
