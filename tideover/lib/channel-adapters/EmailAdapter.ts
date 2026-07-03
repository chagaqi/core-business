import type { Channel, Ticket } from "@/lib/types";
import { inferSentiment, inferType } from "@/lib/channel-adapters/MockAdapter";
import {
  NotImplementedError,
  type ChannelAdapter,
  type NormalizedTicket,
} from "@/lib/channel-adapters/ChannelAdapter";

/**
 * EmailAdapter — bolt-on mode for email-only merchants (no helpdesk). Stub +
 * contract. This is the lowest-friction route: a forwarding alias
 * support+{slug}@{tideover_domain} receives a copy, and replies go out via
 * "send-as" the merchant's own support address (Gmail delegate or alias), so the
 * customer never sees a different sender. No password is ever needed.
 *
 * Inbound: parse the forwarded MIME (From/Subject/Text). Outbound: SMTP/API send
 * with From set to the merchant's support address (configured per merchant).
 */
export class EmailAdapter implements ChannelAdapter {
  readonly name: Channel = "email";

  async listTickets(_merchantId: string): Promise<Ticket[]> {
    throw new NotImplementedError("EmailAdapter", "listTickets");
  }

  async sendReply(_ticketId: string, _text: string): Promise<{ externalId: string; sentAt: string }> {
    void _text;
    throw new NotImplementedError("EmailAdapter", "sendReply");
  }

  normalizeInbound(raw: unknown): NormalizedTicket {
    const r = (raw ?? {}) as Record<string, any>;
    const subject = String(r?.subject ?? "");
    const body = String(r?.text ?? r?.body ?? "");
    return {
      merchantId: String(r?.merchantId ?? ""),
      externalId: r?.messageId ? String(r.messageId) : null,
      customerEmail: String(r?.from ?? r?.customerEmail ?? ""),
      orderRef: null,
      subject,
      body,
      type: inferType(subject, body),
      sentiment: inferSentiment(subject, body),
      createdAt: String(r?.date ?? new Date().toISOString()),
      channel: "email",
    };
  }

  async verifyWebhook(req: Request): Promise<boolean> {
    // Inbound-parse providers (e.g. SES/Mailgun/Postmark) sign their callbacks;
    // verify the provider signature here. Shared-secret check shown.
    const secret = process.env.EMAIL_INBOUND_SECRET;
    return Boolean(secret && req.headers.get("x-inbound-secret") === secret);
  }
}
