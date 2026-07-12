/**
 * Per-vendor INGEST adapters (ADR-0021). The thing a helpdesk merchant actually
 * needs from us is not a send integration — it is a way for their tickets to get
 * IN. That path was one-size-fits-all (a Tideover HMAC over the raw body) and the
 * 10-merchant simulation proved it does not fit reality:
 *
 *   - GORGIAS cannot compute a per-request HMAC at all. Its HTTP Integration can
 *     attach STATIC key/value headers (and OAuth2), nothing body-derived.
 *   - HELP SCOUT signs with its OWN scheme: base64(HMAC-SHA1(rawBody, secret)) in
 *     `X-HelpScout-Signature`. The secret is one the MERCHANT supplies when they
 *     create the webhook (≤ 40 chars), which is what lets us hand them a derived
 *     value instead of storing one.
 *   - ZENDESK had no path at all. Its webhooks support merchant-configured
 *     Bearer/API-key auth headers; its own `X-Zendesk-Webhook-Signature` uses a
 *     secret ZENDESK generates, which we would have to STORE — so we take the
 *     bearer, which is per-merchant, long, random and needs no new field.
 *
 * So: one endpoint, one canonical body, but the AUTH is per vendor — the
 * strongest credential each vendor can actually produce. This module is the
 * registry of that fact. It holds no secrets and does no I/O; lib/ingest-auth.ts
 * verifies, lib/ingest-route.ts enforces.
 *
 * Deliberately NOT a `ChannelAdapter`: Ticket.channel stays `email` for every
 * canonical webhook (see lib/ingest-schema.ts). Widening the Channel union would
 * change ticket identity and engine inputs for zero user-visible gain — the
 * vendor matters at the DOOR, not in the pipeline.
 */

/** A helpdesk we ship first-class connect instructions + auth for. */
export type IngestVendor = "gorgias" | "zendesk" | "helpscout" | "generic";

/**
 * A credential a vendor is CAPABLE of sending.
 *
 * - `tideover-hmac`        X-Tideover-Signature: sha256=<hex HMAC-SHA256(rawBody)>
 *                          — the original scheme (ADR-0011). Strongest: replay of
 *                          a mutated body fails. Kept for anyone who can do it.
 * - `helpscout-hmac-sha1`  X-HelpScout-Signature: base64(HMAC-SHA1(rawBody))
 *                          — Help Scout's native scheme, verified with the secret
 *                          the merchant pasted into Help Scout (which we derived).
 * - `bearer`               Authorization: Bearer <long random per-merchant secret>
 *                          — a shared secret, not a body signature. Weaker (it is
 *                          replayable if TLS is broken or the secret leaks), but it
 *                          is what Gorgias and Zendesk can send, and it is strictly
 *                          stronger than the status quo, which is that those two
 *                          merchants CANNOT CONNECT AT ALL. Pair with
 *                          INGEST_IP_ALLOWLIST for defense in depth.
 */
export type IngestAuthScheme = "tideover-hmac" | "helpscout-hmac-sha1" | "bearer";

export interface IngestVendorSpec {
  vendor: IngestVendor;
  /** the `[channel]` label in /api/ingest/[channel]/[token]. Routing only. */
  channel: string;
  /** display name for the connect UI + health copy. */
  label: string;
  /**
   * Credentials this vendor can actually produce, STRONGEST FIRST. The route
   * accepts the first one that verifies; a vendor that sends none is rejected.
   */
  schemes: IngestAuthScheme[];
  /** the header the merchant's primary credential arrives in (for fix copy). */
  primaryHeader: string;
  /**
   * false when the vendor CANNOT template its request body, so the merchant has
   * no way to emit our canonical schema and we must read the vendor's own payload.
   * Help Scout is the case: its webhooks POST the conversation object, take it or
   * leave it. `normalizeNative` below is how we take it.
   */
  templatableBody: boolean;
  /**
   * Map this vendor's NATIVE payload onto the canonical schema, or null when the
   * payload isn't recognizable. Tried only after the canonical parse fails, so a
   * merchant who CAN template a body keeps the one-schema path and this is dead
   * code for them.
   */
  normalizeNative?: (json: unknown) => Record<string, unknown> | null;
}

// ── native payload readers ──────────────────────────────────────────────────

function str(v: unknown): string {
  return typeof v === "string" ? v : typeof v === "number" ? String(v) : "";
}

/** Tags arrive as `["presale"]` (v1) or `[{ id, tag: "presale" }]` (Mailbox 2.0). */
function readTags(v: unknown): string[] {
  if (!Array.isArray(v)) return [];
  return v
    .map((t) => (typeof t === "string" ? t : str((t as { tag?: unknown })?.tag)))
    .filter(Boolean);
}

/**
 * Help Scout's conversation webhook (`convo.created`, `convo.customer.reply.created`).
 * Its body is NOT configurable, so this reads what Help Scout actually sends. The
 * customer's words live in the first `customer`-type thread under `_embedded`;
 * `preview` is the fallback when threads aren't embedded on the event.
 */
function normalizeHelpScout(json: unknown): Record<string, unknown> | null {
  const c = json as Record<string, any> | null;
  if (!c || typeof c !== "object") return null;
  const id = str(c.id) || str(c.number);
  if (!id) return null;

  const threads: any[] = Array.isArray(c?._embedded?.threads) ? c._embedded.threads : [];
  const customerThread = threads.find((t) => t?.type === "customer") ?? threads[0];
  const bodyHtml = str(customerThread?.body);
  const email =
    str(c?.customer?.email) ||
    str(c?.primaryCustomer?.email) ||
    str(customerThread?.createdBy?.email);

  return {
    external_id: `hs-${id}`,
    customer_email: email,
    subject: str(c.subject),
    body: stripHtml(bodyHtml) || str(c.preview),
    tags: readTags(c.tags),
    created_at: str(c.createdAt) || undefined,
  };
}

/** Gorgias's native ticket payload — insurance for a merchant who wires the raw
 *  webhook instead of the templated HTTP integration. */
function normalizeGorgiasNative(json: unknown): Record<string, unknown> | null {
  const t = json as Record<string, any> | null;
  if (!t || typeof t !== "object") return null;
  const id = str(t.id);
  if (!id) return null;
  const body =
    str(t?.last_message?.body_text) ||
    stripHtml(str(t?.last_message?.body_html)) ||
    str(t?.messages?.[t.messages.length - 1]?.body_text);
  return {
    external_id: `gorgias-${id}`,
    customer_email: str(t?.customer?.email),
    subject: str(t.subject),
    body,
    tags: readTags(t.tags),
    ...(str(t?.meta?.order_id) ? { order_ref: str(t.meta.order_id) } : {}),
    created_at: str(t.created_datetime) || undefined,
  };
}

/** Minimal HTML → text. Vendors send `<p>…</p>` bodies; the engine wants words. */
function stripHtml(html: string): string {
  if (!html) return "";
  return html
    .replace(/<style[\s\S]*?<\/style>/gi, "")
    .replace(/<script[\s\S]*?<\/script>/gi, "")
    .replace(/<br\s*\/?>/gi, "\n")
    .replace(/<\/p>/gi, "\n\n")
    .replace(/<[^>]+>/g, "")
    .replace(/&nbsp;/gi, " ")
    .replace(/&amp;/gi, "&")
    .replace(/&lt;/gi, "<")
    .replace(/&gt;/gi, ">")
    .replace(/&quot;/gi, '"')
    .replace(/&#39;/gi, "'")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
}

const SPECS: Record<IngestVendor, IngestVendorSpec> = {
  gorgias: {
    vendor: "gorgias",
    channel: "gorgias",
    label: "Gorgias",
    // Gorgias HTTP Integrations attach static headers. No body signature exists.
    schemes: ["bearer", "tideover-hmac"],
    primaryHeader: "Authorization",
    templatableBody: true,
    normalizeNative: normalizeGorgiasNative,
  },
  zendesk: {
    vendor: "zendesk",
    channel: "zendesk",
    label: "Zendesk",
    // Zendesk webhook auth: "Bearer token" / "API key" → a static header.
    schemes: ["bearer", "tideover-hmac"],
    primaryHeader: "Authorization",
    templatableBody: true,
  },
  helpscout: {
    vendor: "helpscout",
    channel: "helpscout",
    label: "Help Scout",
    // Help Scout always signs; the bearer is a fallback for a proxy in front.
    schemes: ["helpscout-hmac-sha1", "bearer", "tideover-hmac"],
    primaryHeader: "X-HelpScout-Signature",
    // Help Scout webhooks are NOT templatable — it sends its conversation object.
    templatableBody: false,
    normalizeNative: normalizeHelpScout,
  },
  generic: {
    vendor: "generic",
    channel: "webhook",
    label: "Any other tool",
    // The original ADR-0011 path, unchanged, plus the bearer for tools that
    // cannot sign. Signature is preferred and tried first.
    schemes: ["tideover-hmac", "bearer"],
    primaryHeader: "X-Tideover-Signature",
    templatableBody: true,
  },
};

/** Every `[channel]` the ingest route will route (unknown → 400). `email` is the
 *  legacy label a merchant may already have pasted into a webhook tool; it maps
 *  to the generic spec so an existing integration keeps working. */
export const INGEST_CHANNEL_SPECS: Record<string, IngestVendorSpec> = {
  gorgias: SPECS.gorgias,
  zendesk: SPECS.zendesk,
  helpscout: SPECS.helpscout,
  webhook: SPECS.generic,
  email: SPECS.generic,
};

export const INGEST_CHANNELS: readonly string[] = Object.keys(INGEST_CHANNEL_SPECS);

/** The four vendors we ship connect instructions for, in display order. */
export const INGEST_VENDORS: readonly IngestVendor[] = [
  "gorgias",
  "zendesk",
  "helpscout",
  "generic",
];

export function vendorSpec(vendor: IngestVendor): IngestVendorSpec {
  return SPECS[vendor];
}

/** Resolve a URL `[channel]` label → its vendor spec, or null when unknown. */
export function specForChannel(channel: string): IngestVendorSpec | null {
  return INGEST_CHANNEL_SPECS[channel] ?? null;
}

/** Hard cap on tags considered — a payload cannot make us do unbounded work. */
const MAX_TAGS = 64;

/**
 * Expand a payload's `tags` into every form the drop-at-edge filter should match.
 *
 * THE BUG THIS FIXES (sim finding B3, persona p06): Zendesk renders `{{ticket.tags}}`
 * as ONE space-separated string, so a ticket tagged `presale vip` arrives as
 * `["presale vip"]` and matches the merchant's `presale` filter on NOTHING. Every
 * multi-tag ticket was silently 200-discarded — and multi-tag routing is exactly
 * how a 3-seat Zendesk shop works. Gorgias/Help Scout can comma-join the same way.
 *
 * So we keep the ORIGINAL entries (a real tag may legitimately contain a space)
 * AND add the whitespace/comma-split pieces. The union only ever makes a match
 * MORE likely, so it can turn a silent drop into a delivery but can never let an
 * untagged ticket through: a ticket tagged `billing` gains no `presale` here.
 * Comparison is case-folded for the same reason (`Presale` ≠ `presale` was a
 * silent, invisible drop).
 */
export function expandTags(tags: readonly string[] | undefined): string[] {
  if (!tags || tags.length === 0) return [];
  const out = new Set<string>();
  for (const raw of tags.slice(0, MAX_TAGS)) {
    const whole = String(raw).trim().toLowerCase();
    if (whole) out.add(whole);
    for (const piece of whole.split(/[\s,;]+/)) {
      const t = piece.trim();
      if (t) out.add(t);
    }
    if (out.size >= MAX_TAGS) break;
  }
  return [...out];
}

/**
 * Drop-at-edge (ADR-0011 §4, hardened): true when the payload may be ingested.
 * With no presaleTags configured, everything is accepted. With them configured,
 * an untagged payload is still dropped — that is the onboarding promise.
 */
export function tagsAllowed(
  payloadTags: readonly string[] | undefined,
  presaleTags: readonly string[] | undefined,
): boolean {
  if (!presaleTags || presaleTags.length === 0) return true;
  const allowed = new Set(expandTags(presaleTags));
  return expandTags(payloadTags).some((t) => allowed.has(t));
}
