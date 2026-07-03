import { draftReassurance } from "@/lib/engines/reassurance";
import type { DraftContext, DrafterOutput, ReplyDrafter } from "@/lib/drafting/ReplyDrafter";

/**
 * The default drafter — pure rules + the merchant's playbook. No API key, fully
 * deterministic, and the moat: it encodes the day-stage reassurance language.
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
    return {
      text: r.draftText,
      confidenceBand: r.confidenceBand,
      priority: r.priority,
      draftedBy: this.kind,
    };
  }
}
