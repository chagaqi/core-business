/**
 * Validates seed referential integrity + status-token uniqueness/signature.
 * Exits non-zero on any problem so CI / `npm run verify` fails loudly.
 */
import { createHmac } from "crypto";
import { readFileSync } from "fs";
import { fileURLToPath } from "url";
import { dirname, join } from "path";

const __dirname = dirname(fileURLToPath(import.meta.url));
const DATA = join(__dirname, "..", "lib", "data");
const load = (n) => JSON.parse(readFileSync(join(DATA, `${n}.json`), "utf8"));

const merchants = load("merchants");
const customers = load("customers");
const orders = load("orders");
const tickets = load("tickets");
const gifts = load("gifts");
const social = load("social-feed");
const statusViews = load("status-views");
const scriptVariants = load("script-variants");
const outcomeEvents = load("outcome-events");
const merchantUpdates = load("merchant-updates");

const SECRET = process.env.STATUS_TOKEN_SECRET || "dev-only-change-me";
const sign = (raw) => createHmac("sha256", SECRET).update(raw).digest("hex").slice(0, 10);

const errors = [];
const mids = new Set(merchants.map((m) => m.id));
const cids = new Set(customers.map((c) => c.id));
const oids = new Set(orders.map((o) => o.id));
const gids = new Set(gifts.map((g) => g.id));

const fk = (label, val, set) => {
  if (!set.has(val)) errors.push(`${label} references missing id: ${val}`);
};

for (const c of customers) {
  fk(`customer ${c.id}.merchantId`, c.merchantId, mids);
  for (const oid of c.orderIds) fk(`customer ${c.id}.orderIds`, oid, oids);
}
const DISCLOSE_SOURCES = new Set(["campaign-page", "checkout", "update"]);
const ISO_RE = /^\d{4}-\d{2}-\d{2}T/;
for (const o of orders) {
  fk(`order ${o.id}.merchantId`, o.merchantId, mids);
  fk(`order ${o.id}.customerId`, o.customerId, cids);
  // ADR-0005: disclosedEta is optional, but must be well-formed where present.
  if (o.disclosedEta !== undefined) {
    const d = o.disclosedEta;
    if (typeof d !== "object" || d === null) {
      errors.push(`order ${o.id}.disclosedEta: not an object`);
    } else {
      if (typeof d.value !== "string" || !d.value) errors.push(`order ${o.id}.disclosedEta.value: missing/blank`);
      if (!DISCLOSE_SOURCES.has(d.source)) errors.push(`order ${o.id}.disclosedEta.source: invalid (${d.source})`);
      if (typeof d.disclosedAt !== "string" || !ISO_RE.test(d.disclosedAt)) errors.push(`order ${o.id}.disclosedEta.disclosedAt: not ISO`);
    }
  }
  if (o.campaignName !== undefined && typeof o.campaignName !== "string") errors.push(`order ${o.id}.campaignName: not a string`);
  if (o.wave !== undefined && typeof o.wave !== "string") errors.push(`order ${o.id}.wave: not a string`);
}
for (const t of tickets) {
  fk(`ticket ${t.id}.merchantId`, t.merchantId, mids);
  fk(`ticket ${t.id}.customerId`, t.customerId, cids);
  fk(`ticket ${t.id}.orderId`, t.orderId, oids);
}
for (const g of gifts) fk(`gift ${g.id}.merchantId`, g.merchantId, mids);
for (const s of social) fk(`social ${s.id}.merchantId`, s.merchantId, mids);
// ADR-0005: every status-view FK must resolve, and the row must be well-formed.
const svIds = new Set();
for (const v of statusViews) {
  fk(`status-view ${v.id}.orderId`, v.orderId, oids);
  fk(`status-view ${v.id}.merchantId`, v.merchantId, mids);
  if (typeof v.token !== "string" || !v.token) errors.push(`status-view ${v.id}.token: missing/blank`);
  if (typeof v.viewedAt !== "string" || !ISO_RE.test(v.viewedAt)) errors.push(`status-view ${v.id}.viewedAt: not ISO`);
  if (v.ipPrefix !== undefined && !/^\d{1,3}\.\d{1,3}$/.test(v.ipPrefix)) errors.push(`status-view ${v.id}.ipPrefix: not a two-octet prefix (${v.ipPrefix})`);
  if (svIds.has(v.id)) errors.push(`duplicate status-view id: ${v.id}`);
  svIds.add(v.id);
}
for (const m of merchants) for (const gid of m.giftCatalogIds) fk(`merchant ${m.id}.giftCatalogIds`, gid, gids);

// ── ADR-0007: script variants — FKs, unique ids, well-formed identity. ──
const DAY_STAGES = new Set(["day-7", "day-30", "day-60", "day-89"]);
const PROD_STAGES = new Set(["sourcing", "tooling", "production", "qc", "freight", "dispatch"]);
const VARIANT_SOURCES = new Set(["library", "merchant-default", "operator-promoted"]);
const VARIANT_STATUS = new Set(["active", "retired"]);
const vids = new Set();
for (const v of scriptVariants) {
  fk(`script-variant ${v.id}.merchantId`, v.merchantId, mids);
  if (vids.has(v.id)) errors.push(`duplicate script-variant id: ${v.id}`);
  vids.add(v.id);
  if (!DAY_STAGES.has(v.stageKey)) errors.push(`script-variant ${v.id}.stageKey: invalid (${v.stageKey})`);
  if (v.productionStage !== null && !PROD_STAGES.has(v.productionStage)) errors.push(`script-variant ${v.id}.productionStage: invalid (${v.productionStage})`);
  if (typeof v.text !== "string" || !v.text) errors.push(`script-variant ${v.id}.text: missing/blank`);
  if (!VARIANT_SOURCES.has(v.source)) errors.push(`script-variant ${v.id}.source: invalid (${v.source})`);
  if (!VARIANT_STATUS.has(v.status)) errors.push(`script-variant ${v.id}.status: invalid (${v.status})`);
  if (typeof v.isDefault !== "boolean") errors.push(`script-variant ${v.id}.isDefault: not a boolean`);
  if (typeof v.createdAt !== "string" || !ISO_RE.test(v.createdAt)) errors.push(`script-variant ${v.id}.createdAt: not ISO`);
}

// ── ADR-0007: outcome events — every event references a real
// variant/order/customer/merchant/ticket; append-only rows are well-formed. ──
const tids = new Set(tickets.map((t) => t.id));
const OE_KINDS = new Set([
  "reply_sent", "customer_replied", "reopened", "csat_up", "csat_down",
  "refund_requested", "chargeback", "resolved_quiet",
]);
const oeIds = new Set();
for (const e of outcomeEvents) {
  fk(`outcome-event ${e.id}.merchantId`, e.merchantId, mids);
  fk(`outcome-event ${e.id}.orderId`, e.orderId, oids);
  fk(`outcome-event ${e.id}.customerId`, e.customerId, cids);
  fk(`outcome-event ${e.id}.ticketId`, e.ticketId, tids);
  fk(`outcome-event ${e.id}.variantId`, e.variantId, vids);
  if (oeIds.has(e.id)) errors.push(`duplicate outcome-event id: ${e.id}`);
  oeIds.add(e.id);
  if (!OE_KINDS.has(e.kind)) errors.push(`outcome-event ${e.id}.kind: invalid (${e.kind})`);
  if (!DAY_STAGES.has(e.stageKey)) errors.push(`outcome-event ${e.id}.stageKey: invalid (${e.stageKey})`);
  if (typeof e.observedAt !== "string" || !ISO_RE.test(e.observedAt)) errors.push(`outcome-event ${e.id}.observedAt: not ISO`);
  if (e.meta !== undefined && e.meta.editedRatio !== undefined) {
    const r = e.meta.editedRatio;
    if (typeof r !== "number" || Number.isNaN(r) || r < 0 || r > 1) errors.push(`outcome-event ${e.id}.meta.editedRatio: out of [0,1] (${r})`);
  }
}

// ── ADR-0009: merchant workshop updates — FKs, unique ids, well-formed, and
// (proof-only) NO hard delivery date in the text. Patterns mirror lib/proof.ts
// containsHardDate exactly so the seed can't ship a date the runtime would reject.
const HARD_DATE_PATTERNS = [
  /\b\d{4}-\d{2}-\d{2}\b/,
  /\b(?:jan|feb|mar|apr|may|jun|jul|aug|sep|oct|nov|dec)[a-z]*\.?\s+\d{1,2}(?:st|nd|rd|th)?\b/i,
  /\b\d{1,2}\/\d{1,2}\/\d{2,4}\b/,
  /\bships?\s+on\s+\w/i,
  /\bguarantee\w*\s+(?:delivery|ship|arrival)\b/i,
];
const containsHardDate = (t) => HARD_DATE_PATTERNS.some((re) => re.test(t));
const updIds = new Set();
for (const u of merchantUpdates) {
  fk(`merchant-update ${u.id}.merchantId`, u.merchantId, mids);
  if (updIds.has(u.id)) errors.push(`duplicate merchant-update id: ${u.id}`);
  updIds.add(u.id);
  if (typeof u.text !== "string" || !u.text.trim()) errors.push(`merchant-update ${u.id}.text: missing/blank`);
  else if (containsHardDate(u.text)) errors.push(`merchant-update ${u.id}.text: contains a hard delivery date (proof-only violation)`);
  if (typeof u.createdAt !== "string" || !ISO_RE.test(u.createdAt)) errors.push(`merchant-update ${u.id}.createdAt: not ISO`);
  if (u.imageUrl !== undefined && (typeof u.imageUrl !== "string" || !/^https?:\/\//.test(u.imageUrl))) errors.push(`merchant-update ${u.id}.imageUrl: not an http(s) URL`);
  if (u.hidden !== undefined && typeof u.hidden !== "boolean") errors.push(`merchant-update ${u.id}.hidden: not a boolean`);
}

// every merchant must carry the isDemo flag (demo events never pollute real stats)
for (const m of merchants) {
  if (typeof m.isDemo !== "boolean") errors.push(`merchant ${m.id}: missing isDemo boolean`);
}

// ADR-0008: every merchant needs a present, non-blank, unique inbound token
// (the local-part of <inboxToken>@in.tideover.app — the email-ingest routing key).
const inboxTokens = new Set();
for (const m of merchants) {
  if (typeof m.inboxToken !== "string" || !m.inboxToken.trim()) {
    errors.push(`merchant ${m.id}: missing/blank inboxToken`);
    continue;
  }
  if (inboxTokens.has(m.inboxToken)) errors.push(`duplicate merchant inboxToken: ${m.inboxToken}`);
  inboxTokens.add(m.inboxToken);
}

// token uniqueness + signature
const seen = new Set();
for (const o of orders) {
  const [raw, mac] = String(o.statusToken).split(".");
  if (!raw || !mac) errors.push(`order ${o.id}: malformed status token`);
  else if (sign(raw) !== mac) errors.push(`order ${o.id}: bad token signature`);
  if (seen.has(o.statusToken)) errors.push(`duplicate status token: ${o.statusToken}`);
  seen.add(o.statusToken);
}

// volume floor: at least one merchant ≥30 tickets (proof requires measurable delta)
const byMerchant = {};
for (const t of tickets) byMerchant[t.merchantId] = (byMerchant[t.merchantId] || 0) + 1;
if (!Object.values(byMerchant).some((n) => n >= 30)) {
  errors.push("no merchant meets the ≥30-ticket volume floor for measurable baseline");
}

if (errors.length) {
  console.error(`✗ seed-check failed (${errors.length}):`);
  for (const e of errors) console.error("  - " + e);
  process.exit(1);
}
console.log(
  `✓ seed-check passed: ${merchants.length} merchants, ${customers.length} customers, ${orders.length} orders, ${tickets.length} tickets, ${gifts.length} gifts, ${social.length} signals, ${statusViews.length} status views, ${scriptVariants.length} script variants, ${outcomeEvents.length} outcome events, ${merchantUpdates.length} merchant updates; all FKs + ${seen.size} unique signed tokens valid.`,
);
