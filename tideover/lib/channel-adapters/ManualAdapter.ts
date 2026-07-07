import type { Channel } from "@/lib/types";
import {
  NotImplementedError,
  type ChannelAdapter,
  type NormalizedTicket,
} from "@/lib/channel-adapters/ChannelAdapter";

/**
 * ManualAdapter — "your helpdesk, pasted by you."
 *
 * The send strategy for a REAL merchant until a true write-back integration
 * (Zendesk/Gorgias per INTEGRATIONS-GUIDE.md) ships. Unlike the MockAdapter it
 * SIMULATES nothing: `sendReply` returns `{ externalId: null, sentAt: <now> }` —
 * a *real* record of a *real* human action. The operator approves the reply, the
 * cockpit copies it, and the human pastes it into their own helpdesk; no external
 * system assigns an id, so `externalId` is null (never a fabricated one).
 *
 * Inbound never arrives through this adapter — a real ticket comes in on the
 * merchant's actual channel adapter (Gorgias/Email/…). So read/normalize/verify
 * are not this adapter's job and stay stubbed.
 */
export class ManualAdapter implements ChannelAdapter {
  readonly name: Channel = "manual";

  async sendReply(ticketId: string, text: string): Promise<{ externalId: string | null; sentAt: string }> {
    void ticketId;
    void text;
    // The real instant the operator approved-and-copied the reply. No external id:
    // the delivery is the human paste, which no vendor stamps.
    return { externalId: null, sentAt: new Date().toISOString() };
  }

  async listTickets(): Promise<never> {
    throw new NotImplementedError("ManualAdapter", "listTickets");
  }

  normalizeInbound(_raw: unknown): NormalizedTicket {
    void _raw;
    throw new NotImplementedError("ManualAdapter", "normalizeInbound");
  }

  async verifyWebhook(_rawBody: string, _headers: Headers): Promise<boolean> {
    void _rawBody;
    void _headers;
    throw new NotImplementedError("ManualAdapter", "verifyWebhook");
  }
}
