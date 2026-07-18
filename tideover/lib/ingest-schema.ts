import { z } from "zod";
import { inferSentiment, inferType } from "@/lib/channel-adapters/MockAdapter";
import type { NormalizedTicket } from "@/lib/channel-adapters/ChannelAdapter";

/**
 * The canonical Tideover push payload (ADR-0011, task W2). ONE ingest shape:
 * every helpdesk's webhook body is templated by the *merchant's* helpdesk to
 * emit this schema, so one endpoint + one normalizer replaces N bespoke vendor
 * adapters. The merchant maps their ticket fields onto these keys; Tideover
 * never reverse-engineers each vendor's native payload.
 *
 *   { external_id, customer_email, subject, body, tags?, order_ref?, created_at? }
 *
 * `tags` rides along so the drop-at-edge filter (Merchant.presaleTags) can
 * discard a payload whose tags don't match — a backstop even though the
 * merchant's own rule should only send tagged tickets.
 */
export const CanonicalIngestSchema = z.object({
  /** the vendor's own ticket id — the idempotency key (ingestTicket dedupes on it). */
  external_id: z.string().min(1),
  customer_email: z.string(),
  subject: z.string(),
  body: z.string(),
  /** presale tags the merchant's helpdesk stamped; used only for drop-at-edge. */
  tags: z.array(z.string()).optional(),
  /** optional order id/reference to attach the ticket to. */
  order_ref: z.string().optional(),
  /** ISO 8601; defaults to now when the helpdesk omits it. */
  created_at: z.string().optional(),
});

export type CanonicalIngest = z.infer<typeof CanonicalIngestSchema>;

/**
 * Normalize a validated canonical payload to the pipeline's NormalizedTicket.
 * Channel is `email` — the webhook flows the identical hardened pipeline as the
 * email-forward rung (ADR-0008), so idempotency and drafting are shared and no
 * new Channel enum / adapter is introduced. Type + sentiment reuse the same
 * Mock/Email keyword inference every other channel uses. Tags are intentionally
 * NOT carried here: the drop-at-edge filter runs in the route against the raw
 * canonical `tags`, before normalization.
 */
export function normalizeCanonical(payload: CanonicalIngest, merchantId: string): NormalizedTicket {
  const { subject, body } = payload;
  return {
    merchantId,
    externalId: payload.external_id,
    customerEmail: payload.customer_email,
    orderRef: payload.order_ref ?? null,
    subject,
    body,
    type: inferType(subject, body),
    sentiment: inferSentiment(subject, body),
    createdAt: payload.created_at ?? new Date().toISOString(),
    channel: "email",
  };
}
