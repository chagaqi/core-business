import type { Channel, Sentiment, Ticket, TicketType } from "@/lib/types";

/**
 * ChannelAdapter — the integration seam that lets Tideover run in BOTH modes:
 * bolted onto a merchant's existing helpdesk (Gorgias/Tidio/Intercom/Email) AND
 * a native Tideover surface (Mock). Every adapter implements the same contract,
 * so the ingest→draft→approve→send pipeline is channel-agnostic.
 */

export interface NormalizedTicket {
  merchantId: string;
  externalId: string | null;
  customerEmail: string;
  orderRef: string | null;
  subject: string;
  body: string;
  type: TicketType;
  sentiment: Sentiment;
  createdAt: string;
  channel: Channel;
}

export interface OAuthTokens {
  accessToken: string;
  refreshToken: string;
  expiresAt: string;
}

export interface DateRange {
  from: string;
  to: string;
}

export interface ChannelAdapter {
  readonly name: Channel;
  /** read tickets (baseline snapshot + live queue) */
  listTickets(merchantId: string, range?: DateRange): Promise<Ticket[]>;
  /** send an approved reply out through the channel */
  sendReply(ticketId: string, text: string): Promise<{ externalId: string; sentAt: string }>;
  /** normalize an inbound webhook payload to our shape */
  normalizeInbound(raw: unknown): NormalizedTicket;
  /** verify a webhook signature (HMAC per vendor) */
  verifyWebhook(req: Request): Promise<boolean>;
  /** OAuth begin (optional; stubbed for third parties) */
  authStartUrl?(merchantId: string): string;
  /** OAuth code exchange (optional; stubbed for third parties) */
  authCallback?(code: string): Promise<OAuthTokens>;
}

export class NotImplementedError extends Error {
  constructor(adapter: string, method: string) {
    super(
      `${adapter}.${method} is a documented stub. Wire it with vendor OAuth + webhook credentials to enable the bolt-on mode for this helpdesk.`,
    );
    this.name = "NotImplementedError";
  }
}
