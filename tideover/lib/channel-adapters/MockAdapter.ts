import { createHash } from "crypto";
import { newId } from "@/lib/ids";
import { getRepositories } from "@/lib/repositories";
import type { Channel, Sentiment, Ticket, TicketType } from "@/lib/types";
import type {
  ChannelAdapter,
  DateRange,
  NormalizedTicket,
} from "@/lib/channel-adapters/ChannelAdapter";

/**
 * MockAdapter — the fully working adapter that powers the seeded demo and the
 * native Tideover surface (the embeddable widget + /status page submissions).
 * Reads/writes through the repository layer; no external calls, no auth.
 */

const WISMO = ["update", "where is", "tracking", "shipped", "ship", "any news"];
const REFUND = ["refund", "cancel", "money back", "chargeback", "dispute", "scam"];
const DEPOSIT = ["deposit", "balance", "remaining payment"];

export function inferType(subject: string, body: string): TicketType {
  const t = `${subject} ${body}`.toLowerCase();
  if (REFUND.some((k) => t.includes(k))) return "refund";
  if (DEPOSIT.some((k) => t.includes(k))) return "deposit";
  if (WISMO.some((k) => t.includes(k))) return "wismo";
  return "other";
}

export function inferSentiment(subject: string, body: string): Sentiment {
  const t = `${subject} ${body}`.toLowerCase();
  if (/(charge\s?back|dispute|scam|fraud|last\s+(warning|chance))/.test(t)) return "chargeback-threat";
  if (/(ridiculous|furious|angry|unacceptable|terrible|never again)/.test(t)) return "hostile";
  if (/(worried|anxious|forever|still waiting|frustrat|concerned|getting nervous)/.test(t)) return "anxious";
  return "calm";
}

export class MockAdapter implements ChannelAdapter {
  readonly name: Channel = "mock";

  async listTickets(merchantId: string, _range?: DateRange): Promise<Ticket[]> {
    void _range;
    const repos = getRepositories();
    return repos.tickets.list({ merchantId });
  }

  async sendReply(ticketId: string, text: string): Promise<{ externalId: string; sentAt: string }> {
    void ticketId;
    void text;
    const sentAt = new Date().toISOString();
    const externalId = newId("tkt").replace("tkt_", "mock_send_");
    return { externalId, sentAt };
  }

  normalizeInbound(raw: unknown): NormalizedTicket {
    const r = (raw ?? {}) as Record<string, unknown>;
    const subject = String(r.subject ?? "");
    const body = String(r.body ?? "");
    const customerEmail = String(r.customerEmail ?? "");
    const merchantId = String(r.merchantId ?? "");
    const orderId = r.orderId ? String(r.orderId) : "";
    // No vendor event id on the native surface, so derive a deterministic one
    // from the content — identical redelivery dedupes to the same ticket. The
    // widget subject is constant, so merchantId + orderId are hashed too, or the
    // same customer asking the same text about two orders would collide.
    const externalId = r.externalId
      ? String(r.externalId)
      : "mock_" +
        createHash("sha256")
          .update(`${merchantId}\n${orderId}\n${subject}\n${customerEmail}\n${body}`)
          .digest("hex")
          .slice(0, 16);
    return {
      merchantId,
      externalId,
      customerEmail,
      orderRef: orderId || null,
      subject,
      body,
      type: inferType(subject, body),
      sentiment: inferSentiment(subject, body),
      createdAt: new Date().toISOString(),
      channel: "mock",
    };
  }

  async verifyWebhook(_rawBody: string, _headers: Headers): Promise<boolean> {
    void _rawBody;
    void _headers;
    return true; // native surface; the route gates this channel on DEMO_MODE
  }
}
