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
  /**
   * Send an approved reply out through the channel. `externalId` is the vendor's
   * id for the delivered message, or null when the strategy assigns none (the
   * ManualAdapter — the operator pastes the reply into their own helpdesk).
   */
  sendReply(ticketId: string, text: string): Promise<{ externalId: string | null; sentAt: string }>;
  /** normalize an inbound webhook payload to our shape */
  normalizeInbound(raw: unknown): NormalizedTicket;
  /**
   * Verify a webhook signature (HMAC per vendor). `rawBody` MUST be the exact
   * bytes the vendor sent — re-serialized JSON breaks the HMAC — so the route
   * reads the body once as text and passes it here before any parsing.
   */
  verifyWebhook(rawBody: string, headers: Headers): Promise<boolean>;
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
