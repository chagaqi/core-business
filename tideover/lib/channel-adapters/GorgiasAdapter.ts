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
 * GorgiasAdapter — bolt-on mode for Gorgias. Stub with the full production
 * contract documented inline. Enable by supplying GORGIAS_CLIENT_ID/SECRET and a
 * per-merchant access token, then implement listTickets/sendReply against the
 * Gorgias REST API.
 *
 * OAuth: redirect to https://{domain}.gorgias.com/oauth/authorize
 *   ?client_id=...&response_type=code&scope=tickets:read tickets:write&redirect_uri={APP}/api/oauth/gorgias/callback
 *   Exchange code at POST https://{domain}.gorgias.com/oauth/token.
 * Webhooks: Gorgias signs payloads with HMAC-SHA256 in `X-Gorgias-Signature`
 *   over the raw body using the integration secret (verified below).
 * Field map: ticket.id→externalId, customer.email→customerEmail, subject→subject,
 *   last_message.body_text→body, created_datetime→createdAt.
 * Send: POST /api/tickets/{id}/messages { body_html, channel, via, from_agent:true }.
 */
export class GorgiasAdapter implements ChannelAdapter {
  readonly name: Channel = "gorgias";

  async listTickets(_merchantId: string): Promise<Ticket[]> {
    throw new NotImplementedError("GorgiasAdapter", "listTickets");
  }

  async sendReply(_ticketId: string, _text: string): Promise<{ externalId: string; sentAt: string }> {
    void _text;
    throw new NotImplementedError("GorgiasAdapter", "sendReply");
  }

  normalizeInbound(raw: unknown): NormalizedTicket {
    const r = (raw ?? {}) as Record<string, any>;
    const subject = String(r?.subject ?? "");
    const body = String(r?.last_message?.body_text ?? r?.body ?? "");
    return {
      merchantId: String(r?.merchantId ?? ""),
      externalId: r?.id ? String(r.id) : null,
      customerEmail: String(r?.customer?.email ?? ""),
      orderRef: r?.meta?.order_id ? String(r.meta.order_id) : null,
      subject,
      body,
      type: inferType(subject, body),
      sentiment: inferSentiment(subject, body),
      createdAt: String(r?.created_datetime ?? new Date().toISOString()),
      channel: "gorgias",
    };
  }

  async verifyWebhook(req: Request): Promise<boolean> {
    const secret = process.env.GORGIAS_WEBHOOK_SECRET;
    const sig = req.headers.get("x-gorgias-signature");
    if (!secret || !sig) return false;
    const body = await req.clone().text();
    const expected = createHmac("sha256", secret).update(body).digest("hex");
    try {
      return timingSafeEqual(Buffer.from(sig), Buffer.from(expected));
    } catch {
      return false;
    }
  }

  authStartUrl(merchantId: string): string {
    const base = process.env.APP_URL ?? "";
    return `${base}/api/oauth/gorgias/start?merchant=${encodeURIComponent(merchantId)}`;
  }

  async authCallback(_code: string): Promise<OAuthTokens> {
    throw new NotImplementedError("GorgiasAdapter", "authCallback");
  }
}
