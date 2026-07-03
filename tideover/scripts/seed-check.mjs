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

// every merchant must carry the isDemo flag (demo events never pollute real stats)
for (const m of merchants) {
  if (typeof m.isDemo !== "boolean") errors.push(`merchant ${m.id}: missing isDemo boolean`);
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
  `✓ seed-check passed: ${merchants.length} merchants, ${customers.length} customers, ${orders.length} orders, ${tickets.length} tickets, ${gifts.length} gifts, ${social.length} signals, ${statusViews.length} status views; all FKs + ${seen.size} unique signed tokens valid.`,
);
