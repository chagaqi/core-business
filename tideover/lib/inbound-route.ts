import { verifySvix } from "@/lib/svix";
import {
  fetchReceivedEmail as defaultFetchReceivedEmail,
  htmlToText,
  INBOUND_DOMAIN,
  type FetchReceivedEmail,
} from "@/lib/inbound";
import { getRepositories } from "@/lib/repositories";
import { ingestTicket } from "@/lib/service";
import { inferSentiment, inferType } from "@/lib/channel-adapters/MockAdapter";
import type { NormalizedTicket } from "@/lib/channel-adapters/ChannelAdapter";

/**
 * Injectable core for POST /api/inbound/resend — the Resend inbound webhook
 * (ADR-0008), the "integration = one forwarding rule" wedge. This lives in lib/
 * (not the route file) so the body-fetch seam can be stubbed in unit tests and
 * so a Next route file exports only its handler.
 *
 * Order of operations mirrors app/api/ticket-ingest/route.ts (read raw ONCE →
 * verify signature over the RAW bytes → parse → route → ingest):
 *
 *   1. raw = req.text() once.
 *   2. Svix signature: in demo mode with no RESEND_WEBHOOK_SECRET set, accept
 *      unsigned (mirrors the ADR-0004 mock gate so the seeded/test path works);
 *      otherwise verifySvix MUST pass or 401 (bare).
 *   3. JSON.parse (400 on malformed); only `email.received` is acted on — other
 *      event types are acked 200 and ignored.
 *   4. For each `data.to` at @in.tideover.app, resolve the local-part →
 *      merchant. Unknown addresses are skipped; no match at all → 200 no-match
 *      (never an error — a stray forward mustn't make Resend retry forever).
 *   5. Fetch the body once (the webhook is metadata-only), normalize, and run
 *      the EXISTING hardened ingest per matched merchant: idempotency on
 *      (merchantId, "email", email_id) makes a Resend redelivery a no-op.
 *
 * Fast-ACK: at most one Resend body-fetch + bounded repo work, then 200.
 *
 * Uses the Web-standard Response (not next/server) so it is exercisable in unit
 * tests without the Next runtime; Next 14 App Router accepts a plain Response.
 */

export interface InboundDeps {
  fetchReceivedEmail: FetchReceivedEmail;
}

const DOMAIN_SUFFIX = `@${INBOUND_DOMAIN.toLowerCase()}`;

/** Pull the bare address out of a possible `"Name <token@host>"` recipient. */
function extractEmail(raw: string): string {
  const angled = raw.match(/<([^>]+)>/);
  return (angled ? angled[1] : raw).trim().toLowerCase();
}

/** local-part for an @in.tideover.app recipient, or null if not one of ours. */
function inboxTokenFromRecipient(raw: string): string | null {
  const email = extractEmail(raw);
  if (!email.endsWith(DOMAIN_SUFFIX)) return null;
  const local = email.slice(0, email.length - DOMAIN_SUFFIX.length);
  return local || null;
}

export async function handleResendInbound(
  req: Request,
  deps: InboundDeps = { fetchReceivedEmail: defaultFetchReceivedEmail },
): Promise<Response> {
  const raw = await req.text();

  // ── signature gate (over the raw bytes, before any parse) ──────────────────
  // The unsigned-accept path exists only for the seeded demo/test. It fails
  // CLOSED in a production build even if DEMO_MODE and the secret are both
  // unset, so a misconfigured deploy can never take forged webhooks.
  const secret = process.env.RESEND_WEBHOOK_SECRET;
  const demo = process.env.DEMO_MODE !== "false" && process.env.NODE_ENV !== "production";
  if (demo && !secret) {
    // demo/test path: seeded data, no live Resend secret — accept unsigned.
  } else if (!verifySvix(raw, req.headers, secret ?? "")) {
    return new Response(null, { status: 401 });
  }

  let event: unknown;
  try {
    event = JSON.parse(raw);
  } catch {
    return Response.json({ error: "invalid JSON" }, { status: 400 });
  }

  const ev = (event ?? {}) as { type?: unknown; created_at?: unknown; data?: unknown };
  // Resend sends many event types on one endpoint; only inbound receipt matters.
  if (ev.type !== "email.received") {
    return Response.json({ status: "ignored" });
  }

  const data = (ev.data ?? {}) as {
    email_id?: unknown;
    from?: unknown;
    to?: unknown;
    subject?: unknown;
  };
  const emailId = data.email_id ? String(data.email_id) : "";
  // Cap recipients (DoS hardening): a real inbound email addresses a handful of
  // recipients; anything past that is bounded work, not a lookup storm.
  const recipients = (Array.isArray(data.to) ? data.to.map(String) : []).slice(0, 20);
  if (!emailId || recipients.length === 0) {
    return Response.json({ error: "invalid body" }, { status: 400 });
  }

  // Resolve every recipient at our inbound domain to a merchant; dedupe so a
  // single email addressed twice to the same merchant ingests once.
  const repos = getRepositories();
  const seen = new Set<string>();
  const matched: Array<{ id: string }> = [];
  for (const recipient of recipients) {
    const token = inboxTokenFromRecipient(recipient);
    if (!token) continue;
    const merchant = await repos.merchants.findByInboxToken(token);
    if (!merchant || seen.has(merchant.id)) continue;
    seen.add(merchant.id);
    matched.push({ id: merchant.id });
  }
  if (matched.length === 0) {
    return Response.json({ status: "no-match" });
  }

  // Metadata-only webhook → fetch the body once (same email for every match).
  const body = await deps.fetchReceivedEmail(emailId);
  const subject = body.subject || (data.subject ? String(data.subject) : "");
  const text = body.text ?? htmlToText(body.html);
  const customerEmail = String(data.from ?? body.from ?? "");
  const createdAt =
    typeof ev.created_at === "string" && ev.created_at
      ? ev.created_at
      : new Date().toISOString();

  const results: Array<{ merchantId: string; status: string; ticketId?: string }> = [];
  for (const m of matched) {
    const normalized: NormalizedTicket = {
      merchantId: m.id,
      externalId: emailId,
      customerEmail,
      orderRef: null,
      subject,
      body: text,
      type: inferType(subject, text),
      sentiment: inferSentiment(subject, text),
      createdAt,
      channel: "email",
    };
    const result = await ingestTicket(normalized);
    if ("error" in result) {
      results.push({ merchantId: m.id, status: "error" });
    } else if (result.duplicate) {
      results.push({ merchantId: m.id, status: "duplicate", ticketId: result.ticket.id });
    } else {
      results.push({ merchantId: m.id, status: "ingested", ticketId: result.ticket.id });
    }
  }

  const status = results.some((r) => r.status === "ingested")
    ? "ingested"
    : results.every((r) => r.status === "duplicate")
      ? "duplicate"
      : "error";

  return Response.json({
    status,
    ...(results.length === 1 ? { ticketId: results[0].ticketId } : {}),
    results,
  });
}
