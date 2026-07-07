import { deriveWebhookSecret } from "@/lib/webhook-secret";
import { resolveDatastoreModeFromRequest } from "@/lib/request-mode";
import type { Merchant } from "@/lib/types";

/**
 * Per-merchant helpdesk setup artifacts (ADR-0011, task W2 §5). Pure generators
 * for the copy-paste config a merchant pastes into Gorgias / Zendesk: the
 * per-merchant ingest URL, the derived signing secret, the JSON body template
 * mapping that vendor's ticket variables onto the canonical schema, and the
 * plain-English steps (including the tag rule that does the presale routing).
 *
 * Vendor-agnostic by design: any helpdesk that can POST a templated JSON body on
 * a ticket event works — these two are the ones we ship first-class copy for.
 */

export interface HelpdeskSetup {
  /** the per-merchant ingest endpoint the vendor POSTs to. */
  url: string;
  /** the derived signing secret the merchant configures (or omits in demo). */
  secret: string;
  /** the JSON body the merchant templates their ticket fields into. */
  bodyTemplate: string;
  /** ordered, plain-English setup steps. */
  instructions: string[];
}

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

/** The per-merchant ingest URL: identity rides on the unguessable token path. */
export function webhookIngestUrl(inboxToken: string, channel = "webhook"): string {
  return `${baseUrl()}/api/ingest/${channel}/${inboxToken}`;
}

/** Pretty-print a mapping object as the JSON body template. */
function bodyTemplate(map: Record<string, unknown>): string {
  return JSON.stringify(map, null, 2);
}

/**
 * Gorgias HTTP Integration. Gorgias templates the request body with
 * `{{ticket.*}}` variables on a rule; map them onto the canonical schema.
 */
export function gorgiasHttpIntegration(merchant: Merchant): HelpdeskSetup {
  const url = webhookIngestUrl(merchant.inboxToken, "gorgias");
  const secret = deriveWebhookSecret(merchant.inboxToken);
  return {
    url,
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
      "Paste the JSON body below as the request body template.",
      "Add a Rule: when a ticket is tagged `presale`, trigger this HTTP integration.",
      "If your plan can sign requests, HMAC-SHA256 the body with the signing secret and send it as the X-Tideover-Signature: sha256=<hex> header. Otherwise leave it unsigned (demo mode accepts unsigned).",
    ],
  };
}

/**
 * Zendesk trigger + webhook. Zendesk exposes ticket fields as
 * `{{ticket.*}}` placeholders in a webhook body; map them onto the schema.
 */
export function zendeskTrigger(merchant: Merchant): HelpdeskSetup {
  const url = webhookIngestUrl(merchant.inboxToken, "zendesk");
  const secret = deriveWebhookSecret(merchant.inboxToken);
  return {
    url,
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
      "In Zendesk, create a Webhook (Admin Center → Apps and integrations → Webhooks) pointing at the URL below, method POST, JSON.",
      `Set the endpoint URL to ${url}.`,
      "Create a Trigger: when a ticket's tags contain `presale`, notify the webhook with the JSON body below.",
      "Paste the JSON body below as the webhook's request body.",
      "If you enable webhook signing, HMAC-SHA256 the body with the signing secret and send it as the X-Tideover-Signature: sha256=<hex> header. Otherwise leave it unsigned (demo mode accepts unsigned).",
    ],
  };
}
