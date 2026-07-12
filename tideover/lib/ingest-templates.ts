import { deriveWebhookSecret } from "@/lib/webhook-secret";
import { deriveBearerSecret, deriveHelpScoutSecret } from "@/lib/ingest-auth";
import {
  vendorSpec,
  type IngestAuthScheme,
  type IngestVendor,
} from "@/lib/channel-adapters/ingest-vendors";
import { resolveDatastoreModeFromRequest } from "@/lib/request-mode";
import type { Merchant } from "@/lib/types";

/**
 * Per-merchant, PER-VENDOR helpdesk setup artifacts (ADR-0011 §5, amended by
 * ADR-0021). Pure generators for the copy-paste config a merchant pastes into
 * Gorgias / Zendesk / Help Scout: the per-merchant ingest URL, the exact
 * credential THAT VENDOR CAN ACTUALLY SEND, the request body template (where one
 * is possible), and the plain-English steps including the tag rule that does the
 * presale routing.
 *
 * The old version shipped one instruction for everyone — "HMAC-SHA256 the body
 * with the signing secret, or leave it unsigned (demo mode accepts unsigned)" —
 * which was a dead end for two of the four vendors and quietly false for the rest
 * the moment the deploy went live. Each vendor now gets the truth about itself.
 */

export interface HelpdeskSetup {
  vendor: IngestVendor;
  label: string;
  /** the URL `[channel]` label; also the same-origin test path's segment. */
  channel: string;
  /** the per-merchant ingest endpoint the vendor POSTs to (absolute). */
  url: string;
  /** the same endpoint, relative — the connect panel's test button posts here. */
  path: string;
  /** which credential this vendor sends. */
  scheme: IngestAuthScheme;
  /** the header it travels in, e.g. "Authorization". */
  headerName: string;
  /** what the merchant types into the vendor's UI, e.g. "Bearer tdo_9f…". */
  headerValue: string;
  /** the naked credential, for a field that wants only the value. */
  credential: string;
  /** what that field is called in the vendor's UI. */
  credentialLabel: string;
  /** the canonical Tideover signing secret (still valid for any tool that can HMAC). */
  secret: string;
  /** the JSON body the merchant templates their ticket fields into. Empty when
   *  the vendor cannot template a body (Help Scout) — we read its own payload. */
  bodyTemplate: string;
  /** ordered, plain-English setup steps. */
  instructions: string[];
  /** the merchant's drop-at-edge tag rule, so the panel can show + test it. */
  presaleTags: string[];
}

export type ConnectKit = Record<IngestVendor, HelpdeskSetup>;

/** Base origin for the copy-paste webhook URL. Tied to the request's datastore
 *  mode (ADR-0017): a real merchant's ingest endpoint lives on the real host, so
 *  the URL they paste into their helpdesk must point there — not the demo default.
 *  Falls back to the APP_URL/demo default outside a request scope (tests/scripts). */
function baseUrl(): string {
  if (resolveDatastoreModeFromRequest() === "real") {
    return `https://${(process.env.REAL_APP_HOST ?? "app.tideover.app").replace(/\/$/, "")}`;
  }
  return (process.env.APP_URL ?? "https://www.tideover.app").replace(/\/$/, "");
}

/** The per-merchant ingest path: identity rides on the unguessable token. */
export function webhookIngestPath(inboxToken: string, channel = "webhook"): string {
  return `/api/ingest/${channel}/${inboxToken}`;
}

/** The per-merchant ingest URL: identity rides on the unguessable token path. */
export function webhookIngestUrl(inboxToken: string, channel = "webhook"): string {
  return `${baseUrl()}${webhookIngestPath(inboxToken, channel)}`;
}

/** Pretty-print a mapping object as the JSON body template. */
function bodyTemplate(map: Record<string, unknown>): string {
  return JSON.stringify(map, null, 2);
}

/** The tag the instructions tell the merchant to route on. */
function tagRule(merchant: Merchant): string {
  return merchant.presaleTags?.[0] ?? "presale";
}

function common(merchant: Merchant, vendor: IngestVendor) {
  const spec = vendorSpec(vendor);
  return {
    spec,
    url: webhookIngestUrl(merchant.inboxToken, spec.channel),
    path: webhookIngestPath(merchant.inboxToken, spec.channel),
    secret: deriveWebhookSecret(merchant.inboxToken),
    bearer: deriveBearerSecret(merchant.inboxToken),
    tag: tagRule(merchant),
    presaleTags: merchant.presaleTags ?? [],
  };
}

/**
 * Gorgias HTTP Integration. Gorgias templates the request body with
 * `{{ticket.*}}` variables on a rule, and attaches STATIC custom headers — it
 * cannot compute a signature over the body, which is why the credential is a
 * long random per-merchant bearer rather than an HMAC (ADR-0021).
 */
export function gorgiasHttpIntegration(merchant: Merchant): HelpdeskSetup {
  const { spec, url, path, secret, bearer, tag, presaleTags } = common(merchant, "gorgias");
  return {
    vendor: "gorgias",
    label: spec.label,
    channel: spec.channel,
    url,
    path,
    scheme: "bearer",
    headerName: "Authorization",
    headerValue: `Bearer ${bearer}`,
    credential: bearer,
    credentialLabel: "Connection secret (Gorgias custom header)",
    secret,
    bodyTemplate: bodyTemplate({
      external_id: "{{ticket.id}}",
      customer_email: "{{ticket.customer.email}}",
      subject: "{{ticket.subject}}",
      body: "{{ticket.messages.last.body_text}}",
      tags: ["{{ticket.tags}}"],
      order_ref: "{{ticket.meta.order_id}}",
      created_at: "{{ticket.created_datetime}}",
    }),
    instructions: [
      "In Gorgias, open Settings → Integrations → HTTP Integration and add a new one.",
      `Set the URL to ${url}, method POST, content-type application/json.`,
      "Under Headers, add exactly one custom header — name `Authorization`, value `Bearer <your connection secret>` (copy it from the field above). This is what proves the request is yours; without it Tideover refuses the ticket.",
      "Paste the JSON body below as the request body template.",
      `Add a Rule: when a ticket is tagged \`${tag}\`, trigger this HTTP integration.`,
      "Press Send a test event below. It runs the same check a real ticket runs, so a green result means Gorgias will get through.",
    ],
    presaleTags,
  };
}

/**
 * Zendesk trigger + webhook. Zendesk lets you author the webhook body with
 * `{{ticket.*}}` placeholders and lets you set the webhook's authentication to
 * "Bearer token" / "API key" — a static header, exactly like Gorgias. (Zendesk's
 * OWN `X-Zendesk-Webhook-Signature` uses a secret ZENDESK generates, which we
 * would have to store per merchant; the bearer is per-merchant, long, random and
 * needs no new field. See ADR-0021 §Alternatives.)
 *
 * Note `{{ticket.tags}}` renders as ONE space-separated string — the route splits
 * it (ingest-vendors.expandTags), which is what un-breaks multi-tag Zendesk shops.
 */
export function zendeskTrigger(merchant: Merchant): HelpdeskSetup {
  const { spec, url, path, secret, bearer, tag, presaleTags } = common(merchant, "zendesk");
  return {
    vendor: "zendesk",
    label: spec.label,
    channel: spec.channel,
    url,
    path,
    scheme: "bearer",
    headerName: "Authorization",
    headerValue: `Bearer ${bearer}`,
    credential: bearer,
    credentialLabel: "Connection secret (Zendesk bearer token)",
    secret,
    bodyTemplate: bodyTemplate({
      external_id: "{{ticket.id}}",
      customer_email: "{{ticket.requester.email}}",
      subject: "{{ticket.title}}",
      body: "{{ticket.description}}",
      tags: ["{{ticket.tags}}"],
      order_ref: "{{ticket.ticket_field_option_title_<order_id>}}",
      created_at: "{{ticket.created_at_with_timestamp}}",
    }),
    instructions: [
      "In Zendesk, go to Admin Center → Apps and integrations → Webhooks → Create webhook.",
      `Set the Endpoint URL to ${url}, Request method POST, Request format JSON.`,
      "Set Authentication to `Bearer token` and paste your connection secret (the field above) as the token. Zendesk then sends it as the Authorization header on every call — that is what Tideover checks.",
      `Create a Trigger (Admin Center → Objects and rules → Triggers): when a ticket's tags contain \`${tag}\`, run the action "Notify active webhook" and select this webhook.`,
      "Paste the JSON body below into the trigger's webhook body.",
      "Press Send a test event below to confirm the endpoint and secret before you trust the queue.",
    ],
    presaleTags,
  };
}

/**
 * Help Scout webhook. Help Scout CANNOT template a request body — it POSTs its
 * own conversation object — and it signs every payload itself with
 * `X-HelpScout-Signature: base64(HMAC-SHA1(rawBody, secretKey))`. The secret key
 * is one the MERCHANT supplies when creating the webhook (max 40 chars), so we
 * hand them a derived 32-char value to paste, verify Help Scout's own signature
 * with it, and read Help Scout's own payload shape
 * (ingest-vendors.normalizeHelpScout). Nothing is stored on our side.
 */
export function helpScoutWebhook(merchant: Merchant): HelpdeskSetup {
  const { spec, url, path, secret, tag, presaleTags } = common(merchant, "helpscout");
  const hsSecret = deriveHelpScoutSecret(merchant.inboxToken);
  return {
    vendor: "helpscout",
    label: spec.label,
    channel: spec.channel,
    url,
    path,
    scheme: "helpscout-hmac-sha1",
    headerName: "X-HelpScout-Signature",
    headerValue: "(Help Scout sends this automatically once the Secret Key is set)",
    credential: hsSecret,
    credentialLabel: "Secret Key (paste into Help Scout)",
    secret,
    // Help Scout gives you no body field. There is nothing to paste.
    bodyTemplate: "",
    instructions: [
      "In Help Scout, open Manage → Apps → Webhooks and click Create Webhook.",
      `Set the Callback URL to ${url}.`,
      "Paste the Secret Key above into Help Scout's Secret Key field, exactly as shown — all 32 characters, no spaces. Help Scout signs every payload with it and Tideover verifies that signature; a wrong key means every ticket is refused.",
      "Under Events, tick `Conversation Created` and `Customer Replied`.",
      "Help Scout sends its own conversation payload — there is no request body to configure, and nothing to paste. Tideover reads it directly.",
      `Help Scout has no per-tag webhook filter, so it will send every conversation. Your presale tag rule does the filtering on our side: tickets that don't carry \`${tag}\` are dropped at the door and never stored.`,
      "Press Send a test event below to confirm the URL and Secret Key before you trust the queue.",
    ],
    presaleTags,
  };
}

/**
 * Any other tool. The original ADR-0011 path, unchanged: HMAC-SHA256 the raw body
 * with the signing secret and send it as X-Tideover-Signature. The strongest
 * scheme we accept — a captured payload cannot be mutated and replayed.
 */
export function genericWebhook(merchant: Merchant): HelpdeskSetup {
  const { spec, url, path, secret, bearer, tag, presaleTags } = common(merchant, "generic");
  return {
    vendor: "generic",
    label: spec.label,
    channel: spec.channel,
    url,
    path,
    scheme: "tideover-hmac",
    headerName: "X-Tideover-Signature",
    headerValue: "sha256=<hex HMAC-SHA256 of the raw body>",
    credential: secret,
    credentialLabel: "Signing secret",
    secret,
    bodyTemplate: bodyTemplate({
      external_id: "<your ticket id>",
      customer_email: "<customer email>",
      subject: "<ticket subject>",
      body: "<the customer's message>",
      tags: ["<ticket tags>"],
      order_ref: "<order number, if you have it>",
      created_at: "<ISO 8601 timestamp>",
    }),
    instructions: [
      `Have your tool POST JSON to ${url}.`,
      "Sign the EXACT raw request body with HMAC-SHA256 using the signing secret above, hex-encode it, and send it as `X-Tideover-Signature: sha256=<hex>`. Sign the bytes you actually send — re-serializing or pretty-printing the body before signing is the usual cause of a rejected webhook.",
      `If your tool cannot compute a signature, it can instead send \`Authorization: Bearer ${bearer}\` — a shared secret rather than a body signature, and the same credential Gorgias and Zendesk use.`,
      "Map your ticket fields onto the JSON body below.",
      `Only send tickets tagged \`${tag}\` — anything else is dropped at the door and never stored.`,
      "Press Send a test event below to confirm the wiring.",
    ],
    presaleTags,
  };
}

/** The whole connect kit for one merchant — every vendor, ready to render. */
export function helpdeskSetups(merchant: Merchant): ConnectKit {
  return {
    gorgias: gorgiasHttpIntegration(merchant),
    zendesk: zendeskTrigger(merchant),
    helpscout: helpScoutWebhook(merchant),
    generic: genericWebhook(merchant),
  };
}
