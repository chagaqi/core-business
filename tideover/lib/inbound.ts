/**
 * Resend inbound email plumbing (ADR-0008) — the "integration = one forwarding
 * rule" wedge. A merchant points their support alias at
 * `<inboxToken>@in.tideover.app`; Resend receives it, POSTs a metadata-only
 * webhook, and the full body is fetched on demand via the Received-Emails API.
 *
 * The body fetch is an INJECTABLE seam (`FetchReceivedEmail`) so the route is
 * unit-testable with a stub — no live Resend call in tests.
 */

/** The dedicated inbound subdomain. A separate host from the sending domain
 *  (`mail.tideover.app`) so inbound receipt never collides with outbound DKIM. */
export const INBOUND_DOMAIN = "in.tideover.app";

/** The per-merchant forwarding address the merchant sets one rule to. */
export function inboxAddressFor(inboxToken: string): string {
  return `${inboxToken}@${INBOUND_DOMAIN}`;
}

export interface ReceivedEmail {
  from: string;
  to: string[];
  subject: string;
  text: string | null;
  html: string | null;
}

/** The body-fetch seam. Default impl hits Resend; tests inject a stub. */
export type FetchReceivedEmail = (emailId: string) => Promise<ReceivedEmail>;

/**
 * Default impl: GET https://api.resend.com/emails/receiving/{emailId} with the
 * SAME RESEND_API_KEY already used for sending. Returns the normalized body
 * fields the ingest needs. Throws on a missing key or non-2xx so the route can
 * surface a retryable failure to Resend.
 */
export const fetchReceivedEmail: FetchReceivedEmail = async (emailId) => {
  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey) throw new Error("RESEND_API_KEY is required to fetch inbound email bodies");
  const res = await fetch(
    `https://api.resend.com/emails/receiving/${encodeURIComponent(emailId)}`,
    { headers: { Authorization: `Bearer ${apiKey}` } },
  );
  if (!res.ok) throw new Error(`Resend received-email fetch failed: ${res.status}`);
  const data = (await res.json()) as Record<string, unknown>;
  const to = Array.isArray(data.to)
    ? data.to.map(String)
    : data.to
      ? [String(data.to)]
      : [];
  return {
    from: String(data.from ?? ""),
    to,
    subject: String(data.subject ?? ""),
    text: data.text != null ? String(data.text) : null,
    html: data.html != null ? String(data.html) : null,
  };
};

/**
 * Minimal HTML→text fallback for when Resend delivers only an html part. Strips
 * script/style, turns block-level closers + <br> into newlines, drops remaining
 * tags, and decodes the handful of entities that actually show up in support
 * mail. Not a full parser — a body good enough for type/sentiment inference and
 * operator review.
 */
export function htmlToText(html: string | null): string {
  if (!html) return "";
  return html
    .replace(/<style[\s\S]*?<\/style>/gi, "")
    .replace(/<script[\s\S]*?<\/script>/gi, "")
    .replace(/<br\s*\/?>/gi, "\n")
    .replace(/<\/(p|div|h[1-6]|li|tr|blockquote)>/gi, "\n")
    .replace(/<[^>]+>/g, "")
    .replace(/&nbsp;/gi, " ")
    .replace(/&amp;/gi, "&")
    .replace(/&lt;/gi, "<")
    .replace(/&gt;/gi, ">")
    .replace(/&quot;/gi, '"')
    .replace(/&#39;/gi, "'")
    .replace(/[ \t]+\n/g, "\n")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
}
