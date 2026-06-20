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
for (const o of orders) {
  fk(`order ${o.id}.merchantId`, o.merchantId, mids);
  fk(`order ${o.id}.customerId`, o.customerId, cids);
}
for (const t of tickets) {
  fk(`ticket ${t.id}.merchantId`, t.merchantId, mids);
  fk(`ticket ${t.id}.customerId`, t.customerId, cids);
  fk(`ticket ${t.id}.orderId`, t.orderId, oids);
}
for (const g of gifts) fk(`gift ${g.id}.merchantId`, g.merchantId, mids);
for (const s of social) fk(`social ${s.id}.merchantId`, s.merchantId, mids);
for (const m of merchants) for (const gid of m.giftCatalogIds) fk(`merchant ${m.id}.giftCatalogIds`, gid, gids);

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
  `✓ seed-check passed: ${merchants.length} merchants, ${customers.length} customers, ${orders.length} orders, ${tickets.length} tickets, ${gifts.length} gifts, ${social.length} signals; all FKs + ${seen.size} unique signed tokens valid.`,
);
