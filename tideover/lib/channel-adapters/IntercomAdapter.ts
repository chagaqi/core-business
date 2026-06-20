import { createHmac, timingSafeEqual } from "crypto";
import type { Channel, Ticket } from "@/lib/types";
import { inferSentiment, inferType } from "@/lib/channel-adapters/MockAdapter";
import {
  NotImplementedError,
  type ChannelAdapter,
  type NormalizedTicket,
  type OAuthTokens,
} from "@/lib/channel-adapters/ChannelAdapter";

/**
 * IntercomAdapter — bolt-on mode for Intercom. Stub + contract.
 * OAuth: https://app.intercom.com/oauth?client_id=...&redirect_uri={APP}/api/oauth/intercom/callback
 *   Exchange at POST https://api.intercom.io/auth/eagle/token.
 * Webhooks: Intercom signs with `X-Hub-Signature` (sha1 HMAC) over the raw body
 *   using the client secret (verified below).
 * Field map: conversation.id→externalId, contacts.email→customerEmail,
 *   conversation_parts...body→body, created_at(unix)→createdAt.
 * Send: POST /conversations/{id}/reply { message_type:'comment', type:'admin', body }.
 */
export class IntercomAdapter implements ChannelAdapter {
  readonly name: Channel = "intercom";

  async listTickets(_merchantId: string): Promise<Ticket[]> {
    throw new NotImplementedError("IntercomAdapter", "listTickets");
  }

  async sendReply(_ticketId: string, _text: string): Promise<{ externalId: string; sentAt: string }> {
    void _text;
    throw new NotImplementedError("IntercomAdapter", "sendReply");
  }

  normalizeInbound(raw: unknown): NormalizedTicket {
    const r = (raw ?? {}) as Record<string, any>;
    const data = r?.data?.item ?? r;
    const subject = String(data?.source?.subject ?? "Intercom conversation");
    const body = String(data?.source?.body ?? r?.body ?? "");
    const unix = Number(data?.created_at ?? 0);
    return {
      merchantId: String(r?.merchantId ?? ""),
      externalId: data?.id ? String(data.id) : null,
      customerEmail: String(data?.source?.author?.email ?? ""),
      orderRef: null,
      subject,
      body,
      type: inferType(subject, body),
      sentiment: inferSentiment(subject, body),
      createdAt: unix ? new Date(unix * 1000).toISOString() : new Date().toISOString(),
      channel: "intercom",
    };
  }

  async verifyWebhook(req: Request): Promise<boolean> {
    const secret = process.env.INTERCOM_CLIENT_SECRET;
    const sig = req.headers.get("x-hub-signature");
    if (!secret || !sig) return false;
    const body = await req.clone().text();
    const expected = "sha1=" + createHmac("sha1", secret).update(body).digest("hex");
    try {
      return timingSafeEqual(Buffer.from(sig), Buffer.from(expected));
    } catch {
      return false;
    }
  }

  async authCallback(_code: string): Promise<OAuthTokens> {
    throw new NotImplementedError("IntercomAdapter", "authCallback");
  }
}
