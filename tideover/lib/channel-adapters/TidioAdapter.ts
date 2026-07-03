import type { Channel, Ticket } from "@/lib/types";
import { inferSentiment, inferType } from "@/lib/channel-adapters/MockAdapter";
import {
  NotImplementedError,
  type ChannelAdapter,
  type NormalizedTicket,
} from "@/lib/channel-adapters/ChannelAdapter";

/**
 * TidioAdapter — bolt-on mode for Tidio. Stub + contract.
 * Auth: Tidio uses project API tokens (no OAuth dance); store per-merchant token.
 * Webhooks: Tidio "new conversation / new message" webhooks; verify via a shared
 *   secret query/header you configure in the Tidio panel.
 * Field map: conversation.id→externalId, visitor.email→customerEmail,
 *   message.content→body, created_at→createdAt.
 * Send: POST conversations/{id}/messages via the Tidio API with operator identity.
 */
export class TidioAdapter implements ChannelAdapter {
  readonly name: Channel = "tidio";

  async listTickets(_merchantId: string): Promise<Ticket[]> {
    throw new NotImplementedError("TidioAdapter", "listTickets");
  }

  async sendReply(_ticketId: string, _text: string): Promise<{ externalId: string; sentAt: string }> {
    void _text;
    throw new NotImplementedError("TidioAdapter", "sendReply");
  }

  normalizeInbound(raw: unknown): NormalizedTicket {
    const r = (raw ?? {}) as Record<string, any>;
    const subject = String(r?.subject ?? "Tidio conversation");
    const body = String(r?.message?.content ?? r?.body ?? "");
    return {
      merchantId: String(r?.merchantId ?? ""),
      externalId: r?.conversation_id ? String(r.conversation_id) : null,
      customerEmail: String(r?.visitor?.email ?? ""),
      orderRef: r?.order_id ? String(r.order_id) : null,
      subject,
      body,
      type: inferType(subject, body),
      sentiment: inferSentiment(subject, body),
      createdAt: String(r?.created_at ?? new Date().toISOString()),
      channel: "tidio",
    };
  }

  async verifyWebhook(req: Request): Promise<boolean> {
    const secret = process.env.TIDIO_WEBHOOK_SECRET;
    return Boolean(secret && req.headers.get("x-tidio-secret") === secret);
  }
}
