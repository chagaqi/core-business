/**
 * Shared security & data-handling content — the single source of truth behind
 * /security, /privacy, and the /procurement packet. Extracted here so the three
 * surfaces can never drift: change a line once and every page that forwards it
 * to a reviewer updates together.
 *
 * Proof-only: every entry describes what the code in this repo actually does
 * (lib/status.ts, app/api/ticket-ingest/route.ts, middleware.ts, lib/session.ts,
 * lib/types.ts, lib/channel-adapters/*). No certifications, no "bank-level"
 * claims — data minimization by architecture is the whole story.
 */

export interface DataItem {
  title: string;
  body: string;
}

export interface RevocationRung {
  rung: string;
  grants: string;
  cutoff: string;
}

export interface SubProcessor {
  name: string;
  role: string;
}

/** What a routed presale ticket actually needs — the only data Tideover holds. */
export const CAN_SEE: readonly DataItem[] = [
  {
    title: "The presale tickets you route to us",
    body: "The subject and body text of the support messages your helpdesk webhook routes to Tideover, the customer's email address, an order reference if the message carries one, and when it was sent. That is the message you chose to send us — nothing more from your inbox.",
  },
  {
    title: "The order and customer details needed to match a ticket to a real timeline",
    body: "For the orders and customers you route or import: first name, email, order value, region, production stage, and the delivery estimate disclosed at purchase. We use these to compute the timeline and risk you see, and the reassurance the buyer sees. Not your whole store — only what a routed ticket needs.",
  },
  {
    title: "Status-page view metadata, for dispute evidence",
    body: "When a buyer opens a status link you shared, we log the time, a shortened browser user-agent, and only the first two octets of their IP address (e.g. \"203.0\", never the full address). It is a factual \"notified on X, viewed on Y\" record, kept as chargeback evidence.",
  },
];

/** No code path in Tideover reaches any of this. */
export const NEVER_SEE: readonly DataItem[] = [
  {
    title: "Card or payment data",
    body: "Tideover never touches checkout or a payment processor. Card numbers, bank details, and payment credentials live with Shopify, Kickstarter, and your processor. There is no code path in Tideover that reads them.",
  },
  {
    title: "Your Shopify admin",
    body: "Running the pilot needs no app install, no admin password, and no OAuth into your store. The CSV and webhook rungs move your data to us without granting any access to your Shopify admin.",
  },
  {
    title: "Your full customer list",
    body: "We only receive the customers attached to the tickets you route, plus any export you deliberately choose to import. Tideover never performs a bulk pull of your store's customer database.",
  },
  {
    title: "Passwords",
    body: "No integration rung asks for a login. CSV files you export yourself and helpdesk webhooks with a shared secret are the only mechanisms — never your password.",
  },
  {
    title: "Anything outside the tickets you send us",
    body: "Messages you don't route never reach us. Where you scope us to presale tags, anything that isn't presale is discarded at the edge before it is ever stored (see below).",
  },
];

/** One action severs each integration rung — how a reviewer cuts Tideover off. */
export const REVOCATION: readonly RevocationRung[] = [
  {
    rung: "0 — CSV import",
    grants: "The order/customer fields from a file you upload yourself.",
    cutoff: "Nothing recurring to revoke — stop uploading, and email us to delete the imported records.",
  },
  {
    rung: "1 — Helpdesk webhook",
    grants: "Presale ticket events your helpdesk fires at our ingest URL (e.g. a Gorgias HTTP integration or Zendesk trigger), authenticated with a shared secret.",
    cutoff: "Deactivate or delete the webhook or trigger in your helpdesk. No further events reach us.",
  },
  {
    rung: "Future — Write-back API key",
    grants: "Nothing today: approved replies are sent by you, from your own helpdesk. If a direct write-back integration ships, it would use a least-privilege agent-user key you create.",
    cutoff: "Nothing to revoke until it exists. If you ever create such a key, resetting it (invalidates instantly) or deleting the agent user cuts it off.",
  },
  {
    rung: "Optional — Shopify custom app",
    grants: "Read-only order data, if you ever create a custom app with read_orders.",
    cutoff: "Uninstall the custom app from your Shopify admin.",
  },
];

/**
 * Real third-party dependencies of this repo — named in advance of adding any
 * other. Rendered on /privacy as "<name> — <role>" and on the packet as a list.
 */
export const SUB_PROCESSORS: readonly SubProcessor[] = [
  { name: "Vercel", role: "application hosting." },
  { name: "MongoDB Atlas", role: "database storage on the production data path." },
  {
    name: "Auth0 (Okta)",
    role: "operator sign-in for the live app: it processes your team's account emails and credentials to run the login. It never receives your customers' data or the tickets you route to us.",
  },
  { name: "Cal.com", role: "the booking embed on our marketing site." },
  {
    name: "Resend",
    role: "configured for future transactional email (e.g. status notifications). It is not active in the pilot: Tideover sends no email to your customers today, and pilot replies are reviewed and sent by you. Listed here in advance of activation.",
  },
  {
    name: "DeepSeek (Hangzhou DeepSeek Artificial Intelligence Co., Ltd.)",
    role: "AI reply drafting — optional and off by default. When you turn it on, the ticket's subject and text, the buyer's first name, the production stage, and the timing band are sent to DeepSeek's servers in the People's Republic of China to draft the reply; DeepSeek's own privacy policy governs that text. Email addresses, order values, and payment data are never in the prompt, and a person approves every AI draft before it sends. Leave the feature off and no ticket text is sent.",
  },
];

/** How long routed data is kept. */
export const RETENTION =
  "We keep routed tickets and the order and customer records they depend on for as long as your pilot or account is active. Status-page view logs are append-only evidence records, kept for the same period. When you no longer need a record, or when your account ends, we delete it (see below).";

/** How a merchant exports or deletes the data they routed to us. */
export const DELETION_EXPORT =
  "You can ask us to export or delete the data you have routed to us at any time by emailing contact@tideover.app, and we will act on the request within a reasonable period. When your account ends, we delete the data you routed to us. Because you are the controller, you can also cut the flow at the source at any time — the Security page lists the one action that revokes each integration.";

/** Contact + physical postal address (CAN-SPAM requirement), used site-wide. */
export const CONTACT_EMAIL = "contact@tideover.app";
export const POSTAL_ADDRESS = "54 Beasley Dr, Unit 3, Kitchener, ON, Canada";
