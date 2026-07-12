import type {
  Customer,
  DraftedBy,
  Merchant,
  Order,
  ProductionStatusEntry,
  Ticket,
} from "@/lib/types";

/**
 * ReplyDrafter — the seam for swapping deterministic template drafting for an
 * optional LLM that drafts novel replies. The deterministic drafter requires no
 * API key and powers the entire demo; the LLM drafter is env-gated.
 */
export interface DraftContext {
  ticket: Ticket;
  order: Order;
  customer: Customer;
  merchant: Merchant;
  now?: Date;
  /**
   * The merchant's own current word on what is PHYSICALLY happening to this order
   * (lib/status-board.ts getCurrentStatus — the most specific scoped status that
   * applies). The drafter resolves it itself when the caller does not supply it;
   * a caller that already holds it passes it to save the read.
   *
   * This is the physical-truth source for the prompt. Before it existed, the stage
   * was stamped once at CSV import and never moved, and 36% of the replies in the
   * ten-merchant run stated the WRONG physical fact about the customer's own order.
   */
  status?: ProductionStatusEntry | null;
}

export interface DrafterOutput {
  text: string;
  confidenceBand: string;
  priority: "normal" | "escalated";
  draftedBy: DraftedBy;
  /**
   * The drafting layer declined to answer: the reply is a human-escalation holding
   * line, not an answer (lib/drafting/safe-floor.ts). Set when the deterministic
   * engine has no responsive script for the ticket — an operator has to take it.
   */
  needsHuman?: boolean;
  /** why it was not answered. Operator-facing, never customer-facing. */
  unansweredReason?: "unsupported-request" | "no-script-for-type" | "unsafe-script" | "status-question";
  /** what the customer asked for that the product cannot do (capability keys). */
  requestedCapabilities?: string[];
}

export interface ReplyDrafter {
  readonly kind: DraftedBy;
  draft(ctx: DraftContext): Promise<DrafterOutput>;
}
