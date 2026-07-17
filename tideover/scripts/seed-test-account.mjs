/**
 * Seed a fully-populated TEST workspace tied to a real Auth0 account, so the
 * owner can skip onboarding and test the real app (app.tideover.app) against
 * realistic data. Clones the demo's richest merchant (Lumen Forge) into the LIVE
 * database with:
 *   - ownerSub = TEST_OWNER_SUB (the Auth0 user_id), isDemo = false
 *   - createdAt = now (so the 14-day trial is active), plan/subscription = null
 *   - orders spread across every wait stage (day-5 … day-115, incl. overdue)
 *   - recent tickets + status views, status tokens re-signed for THIS env's
 *     STATUS_TOKEN_SECRET so the /status links work on prod
 *
 * ADDITIVE ONLY — upserts by id, never deletes. Targets MONGODB_DB_LIVE
 * (default tideover_live), the same db app.tideover.app reads.
 *
 * Run: TEST_OWNER_SUB="auth0|..." npm run seed:test-account
 *   (→ node --env-file-if-exists=.env.local --import ./scripts/local-dns.mjs
 *      scripts/seed-test-account.mjs — reads MONGODB_URI + STATUS_TOKEN_SECRET
 *      from .env.local; neither is printed.)
 */
import { createHmac } from "crypto";
import { readFileSync } from "fs";
import { fileURLToPath } from "url";
import { dirname, join } from "path";
import { MongoClient } from "mongodb";

const __dirname = dirname(fileURLToPath(import.meta.url));
const DATA = join(__dirname, "..", "lib", "data");
const read = (f) => JSON.parse(readFileSync(join(DATA, f), "utf8"));

const OWNER = process.env.TEST_OWNER_SUB;
if (!OWNER) {
  console.error('✗ TEST_OWNER_SUB is required. Find the Auth0 user_id (auth0|… or google-oauth2|…) and run:\n  TEST_OWNER_SUB="auth0|..." npm run seed:test-account');
  process.exit(1);
}
const uri = process.env.MONGODB_URI;
if (!uri) {
  console.error("✗ MONGODB_URI is not set (add it to .env.local).");
  process.exit(1);
}
const SRC = process.env.TEST_SRC_MERCHANT || "mch_lumen0001";
const SECRET = process.env.STATUS_TOKEN_SECRET || "dev-only-change-me";
const now = Date.now();
const DAY = 24 * 60 * 60 * 1000;
const iso = (ms) => new Date(ms).toISOString();
const resign = (token) => {
  const raw = String(token).split(".")[0];
  return `${raw}.${createHmac("sha256", SECRET).update(raw).digest("hex").slice(0, 10)}`;
};

// ── gather the source merchant's slice of the seed ───────────────────────────
const merchants = read("merchants.json");
const merchant = merchants.find((m) => m.id === SRC);
if (!merchant) {
  console.error(`✗ source merchant ${SRC} not found in the seed.`);
  process.exit(1);
}
const orders = read("orders.json").filter((o) => o.merchantId === SRC);
const custIds = new Set(orders.map((o) => o.customerId));
const customers = read("customers.json").filter((c) => custIds.has(c.id));
const tickets = read("tickets.json").filter((t) => t.merchantId === SRC);
const statusViews = read("status-views.json").filter((v) => v.merchantId === SRC);
const byMerchant = (f) => {
  try {
    return read(f).filter((x) => x.merchantId === SRC);
  } catch {
    return [];
  }
};
const gifts = byMerchant("gifts.json");
const variants = byMerchant("script-variants.json");
const outcomes = byMerchant("outcome-events.json");
const updates = byMerchant("merchant-updates.json");
const social = byMerchant("social-feed.json");

// ── retarget the merchant to the real owner + start the trial now ────────────
const testMerchant = {
  ...merchant,
  ownerSub: OWNER,
  isDemo: false,
  plan: null,
  subscriptionStatus: null,
  stripeCustomerId: null,
  createdAt: iso(now),
  baseline: merchant.baseline ? { ...merchant.baseline, capturedOn: iso(now) } : merchant.baseline,
  disclosedEtas: (merchant.disclosedEtas ?? []).map((d) => ({ ...d, disclosedAt: iso(now) })),
};

// ── spread orders across every wait stage, re-sign their tokens ──────────────
const winMax = merchant.fulfillmentWindowDays?.max ?? 100;
const daysBack = orders.map((_, i) => 5 + Math.round((110 * i) / Math.max(1, orders.length - 1))); // 5 → 115
const seededOrders = orders.map((o, i) => {
  const startMs = now - daysBack[i] * DAY;
  return {
    ...o,
    createdAt: iso(startMs - DAY),
    fulfillmentStart: iso(startMs),
    fulfillmentEnd: iso(startMs + winMax * DAY),
    statusToken: resign(o.statusToken),
    disclosedEta: o.disclosedEta ? { ...o.disclosedEta, disclosedAt: iso(startMs - DAY) } : o.disclosedEta,
  };
});

// ── recent inbound: tickets in the last week, views in the last few days ─────
const seededTickets = tickets.map((t, i) => ({ ...t, createdAt: iso(now - (i % 7) * DAY - 3600_000) }));
const seededViews = statusViews.map((v, i) => ({ ...v, token: resign(v.token), viewedAt: iso(now - (i % 3) * DAY) }));

// ── write (additive upsert) into the LIVE db ─────────────────────────────────
const client = new MongoClient(uri);
try {
  await client.connect();
  const db = client.db(process.env.MONGODB_DB_LIVE || "tideover_live");
  const upsert = async (coll, docs) => {
    if (docs.length === 0) return 0;
    await db.collection(coll).createIndex({ id: 1 }, { unique: true }).catch(() => {});
    const res = await db.collection(coll).bulkWrite(
      docs.map((doc) => ({ replaceOne: { filter: { id: doc.id }, replacement: doc, upsert: true } })),
      { ordered: false },
    );
    return res.upsertedCount + res.modifiedCount;
  };

  const wrote = {
    merchants: await upsert("merchants", [testMerchant]),
    customers: await upsert("customers", customers),
    orders: await upsert("orders", seededOrders),
    tickets: await upsert("tickets", seededTickets),
    status_views: await upsert("status_views", seededViews),
    gifts: await upsert("gifts", gifts),
    script_variants: await upsert("script_variants", variants),
    outcome_events: await upsert("outcome_events", outcomes),
    merchant_updates: await upsert("merchant_updates", updates),
    social: await upsert("social", social),
  };

  console.log(`✓ test workspace "${testMerchant.name}" (${testMerchant.id}) seeded into "${db.databaseName}" for owner ${OWNER}`);
  console.log(`  ${Object.entries(wrote).map(([k, v]) => `${k}:${v}`).join("  ")}`);
  console.log(`  orders span day-${daysBack[0]} … day-${daysBack[daysBack.length - 1]} (all stages + overdue); trial starts now.`);
  console.log("  Reload app.tideover.app/app — onboarding is bypassed.");
} catch (err) {
  console.error(`✗ seed-test-account failed: ${err instanceof Error ? err.message : String(err)}`);
  process.exitCode = 1;
} finally {
  await client.close();
}
