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
    return {
      merchantId: String(r.merchantId ?? ""),
      externalId: r.externalId ? String(r.externalId) : null,
      customerEmail: String(r.customerEmail ?? ""),
      orderRef: r.orderId ? String(r.orderId) : null,
      subject,
      body,
      type: inferType(subject, body),
      sentiment: inferSentiment(subject, body),
      createdAt: new Date().toISOString(),
      channel: "mock",
    };
  }

  async verifyWebhook(_req: Request): Promise<boolean> {
    void _req;
    return true; // native surface; trust boundary handled by app auth + token
  }
}
