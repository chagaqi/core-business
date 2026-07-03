import type { Customer, DraftedBy, Merchant, Order, Ticket } from "@/lib/types";

/**
 * ReplyDrafter — the seam for swapping deterministic template drafting for an
 * optional LLM that drafts novel replies. The deterministic drafter requires no
 * API key and powers the entire demo; the LLM drafter is env-gated and stubbed.
 */
export interface DraftContext {
  ticket: Ticket;
  order: Order;
  customer: Customer;
  merchant: Merchant;
  now?: Date;
}

export interface DrafterOutput {
  text: string;
  confidenceBand: string;
  priority: "normal" | "escalated";
  draftedBy: DraftedBy;
}

export interface ReplyDrafter {
  readonly kind: DraftedBy;
  draft(ctx: DraftContext): Promise<DrafterOutput>;
}
