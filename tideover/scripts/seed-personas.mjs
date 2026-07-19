/**
 * Seed 5 ICP TEST PERSONAS into the live db so Dylan can role-play the product as
 * different customers (see docs/personas/*.md for the actor briefings). Each persona
 * is the demo's richest merchant (Lumen Forge) CLONED, re-id'd (so all 5 coexist),
 * and varied: name/voice/window, orders clustered at that persona's wait-day, and a
 * ticket spread at that persona's "heat". Mock ownerSubs keep them out of your view
 * until you --activate one.
 *
 * ADDITIVE ONLY — upserts by id, never deletes. Targets MONGODB_DB_LIVE (tideover_live).
 *
 *   Dry run (no DB, validate):  npm run seed:personas -- --dry-run
 *   Seed all 5:                 TEST_OWNER_SUB="google-oauth2|..." npm run seed:personas
 *   Become a persona to test:   TEST_OWNER_SUB="google-oauth2|..." npm run seed:personas -- --activate hardware
 *     (sets YOUR sub on that persona's merchant + a mock sub on the others, so logging
 *      in lands you in that workspace. Re-run with a different key to switch.)
 */
import { createHmac } from "crypto";
import { readFileSync } from "fs";
import { fileURLToPath } from "url";
import { dirname, join } from "path";
import { MongoClient } from "mongodb";

const __dirname = dirname(fileURLToPath(import.meta.url));
const DATA = join(__dirname, "..", "lib", "data");
const read = (f) => { try { return JSON.parse(readFileSync(join(DATA, f), "utf8")); } catch { return []; } };

const DRY = process.argv.includes("--dry-run");
const activateIdx = process.argv.indexOf("--activate");
const ACTIVATE = activateIdx >= 0 ? process.argv[activateIdx + 1] : null;

const now = Date.now();
const DAY = 24 * 60 * 60 * 1000;
const iso = (ms) => new Date(ms).toISOString();
const SRC = process.env.TEST_SRC_MERCHANT || "mch_lumen0001";

// ── persona configs (mirror docs/personas/*.md) ──────────────────────────────
// heat picks a slice of the ticket ladder (0=calmest … 9=chargeback threat).
const PERSONAS = [
  { key: "boardgame", name: "Ironwood Reckoning", voice: "Warm tabletop-studio insider, a little self-deprecating; talks in pledges and components, never 'orders' and 'valued backer'.", winMin: 60, winMax: 110, waitDay: 55, orders: 14, aov: 11000, heat: [0, 4] },
  { key: "hardware", name: "Volt Field Charger", voice: "Plain, technical, no fluff. A stressed solo engineer who hates anything that sounds like a corporate autoresponder.", winMin: 60, winMax: 95, waitDay: 90, orders: 14, aov: 14900, heat: [2, 10] },
  { key: "apparel", name: "Meridian Knitwear", voice: "Warm, personal, handmade. Over-communicates; a wrong-feeling message reads as cold.", winMin: 60, winMax: 90, waitDay: 30, orders: 12, aov: 8500, heat: [0, 5] },
  { key: "overrun", name: "Aetheric Engines", voice: "Exhausted, in damage control. A manufacturer failed and comms went dark; backers are hostile.", winMin: 90, winMax: 120, waitDay: 130, orders: 14, aov: 9000, heat: [4, 10] },
  { key: "solo", name: "Tidewrack Zines", voice: "Intimate, artisan, handmade-and-personal; tiny operation, $38 zines, wants nothing corporate.", winMin: 40, winMax: 60, waitDay: 20, orders: 8, aov: 3800, heat: [0, 3] },
];
const mockSub = (key) => `persona|${key}`;
const rid = (prefix, key, s) => `${prefix}_${createHmac("sha256", "tideover-persona").update(key + "|" + s).digest("hex").slice(0, 12)}`;
const slugify = (s) => s.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");

// Inclusive-band stage resolution (mirrors lib/time.ts resolveStageFromBands), inlined
// to keep this plain-node like the other seed scripts.
const OVERRUN = "overrun";
function resolveStage(stages, days) {
  if (!stages?.length) return OVERRUN;
  const d = Math.max(0, days);
  for (const s of stages) if (d >= s.dayBand.from && d <= s.dayBand.to) return s.key;
  const earliest = stages.reduce((a, b) => (b.dayBand.from < a.dayBand.from ? b : a));
  if (d < earliest.dayBand.from) return earliest.key;
  const latestCeil = stages.reduce((a, b) => (b.dayBand.to > a.dayBand.to ? b : a));
  if (d > latestCeil.dayBand.to) return OVERRUN;
  const opened = stages.filter((s) => d >= s.dayBand.from);
  return (opened.reduce((a, b) => (a === null || b.dayBand.from > a.dayBand.from ? b : a), null) ?? earliest).key;
}

// Ticket ladder, coldest → hottest ({n} = customer first name).
const TEMPLATES = [
  { type: "wismo", sentiment: "calm", subject: "Any update on my order?", body: "Hi {n} here — just checking in on where mine is in the queue. No rush, thanks!" },
  { type: "wismo", sentiment: "calm", subject: "Rough shipping window?", body: "Hey! Could you tell me roughly when mine might ship? Really excited for it." },
  { type: "other", sentiment: "calm", subject: "Address change", body: "Hi — I moved since I pledged. Can you update my shipping address before it goes out?" },
  { type: "wismo", sentiment: "anxious", subject: "Getting a little worried", body: "It's gone quiet and I haven't heard anything in a while. Is everything still on track?" },
  { type: "wismo", sentiment: "anxious", subject: "Still coming?", body: "Backed this a while ago and it's been silent. Just want to make sure mine didn't slip through." },
  { type: "wismo", sentiment: "frustrated", subject: "This is taking forever", body: "Honestly losing patience. Every estimate has slipped. What is actually going on?" },
  { type: "refund", sentiment: "frustrated", subject: "Thinking about a refund", body: "If this can't ship soon I think I want to cancel and get my money back. What are my options?" },
  { type: "wismo", sentiment: "hostile", subject: "Where is it??", body: "Way past when this was due. I want a real answer, not another vague 'soon'." },
  { type: "wismo", sentiment: "hostile", subject: "Absolutely unacceptable", body: "This is a joke at this point. Months late, no communication. When does this ship?" },
  { type: "refund", sentiment: "chargeback-threat", subject: "Filing a dispute", body: "Waited long enough with nothing to show for it. If I don't get a firm resolution I'm disputing the charge." },
];

// ── build every persona's records (pure; no DB) ──────────────────────────────
const merchants = read("merchants.json");
const src = merchants.find((m) => m.id === SRC);
if (!src) { console.error(`✗ source merchant ${SRC} not in seed.`); process.exit(1); }
const srcOrders = read("orders.json").filter((o) => o.merchantId === SRC);
const srcCustomers = read("customers.json");
const srcGifts = read("gifts.json").filter((g) => g.merchantId === SRC);

function buildPersona(p) {
  const mid = `mch_persona_${p.key}`;
  // clone + override the merchant
  const stages = (src.stages ?? []).map((s) => ({ ...s })); // keep valid stage bands
  const merchant = {
    ...src, id: mid, name: p.name, slug: slugify(p.name), isDemo: false,
    ownerSub: mockSub(p.key), plan: null, subscriptionStatus: null, stripeCustomerId: null,
    memberSubs: [], pendingInvites: [],
    brand: { ...src.brand, voice: p.voice, logoText: p.name, signoff: `— ${p.name}` },
    fulfillmentWindowDays: { min: p.winMin, max: p.winMax },
    createdAt: iso(now),
    giftCatalogIds: [],
    disclosedEtas: (src.disclosedEtas ?? []).map((d) => ({ ...d, disclosedAt: iso(now) })),
  };
  // gifts, re-id'd to this persona
  const gifts = srcGifts.slice(0, 5).map((g) => ({ ...g, id: rid("gft", p.key, g.id), merchantId: mid }));
  merchant.giftCatalogIds = gifts.map((g) => g.id);

  // orders clustered at the persona's wait-day, with a small spread; re-id + remap FKs
  const picked = srcOrders.slice(0, p.orders);
  const custMap = new Map();
  const customers = [];
  const orders = picked.map((o, i) => {
    const spread = Math.round((i / Math.max(1, picked.length - 1)) * 15) - 10; // -10 … +5
    const wait = Math.max(1, p.waitDay + spread);
    const startMs = now - wait * DAY;
    const oid = rid("ord", p.key, o.id);
    // clone/remap the customer
    let cid = custMap.get(o.customerId);
    if (!cid) {
      const sc = srcCustomers.find((c) => c.id === o.customerId);
      cid = rid("cus", p.key, o.customerId);
      custMap.set(o.customerId, cid);
      customers.push({ ...(sc ?? { firstName: "Alex", email: "x@example.com", ltvCents: p.aov }), id: cid, merchantId: mid, orderIds: [oid], email: `${cid}@example.com` });
    }
    return {
      ...o, id: oid, merchantId: mid, customerId: cid, orderValueCents: p.aov,
      createdAt: iso(startMs - DAY), fulfillmentStart: iso(startMs), fulfillmentEnd: iso(startMs + p.winMax * DAY),
      productionStage: resolveStage(stages, wait), preorderEtaSource: "manual", statusToken: null,
    };
  });

  // tickets from the persona's heat slice, hottest on the longest-waiting order
  const slice = TEMPLATES.slice(p.heat[0], p.heat[1]);
  const byWaitDesc = [...orders].sort((a, b) => new Date(a.fulfillmentStart) - new Date(b.fulfillmentStart)); // oldest start = longest wait first
  const tickets = slice.map((t, i) => {
    const order = byWaitDesc[i % byWaitDesc.length];
    const cust = customers.find((c) => c.id === order.customerId);
    const id = rid("tkt", p.key, `${order.id}_${i}`);
    return {
      id, merchantId: mid, customerId: order.customerId, orderId: order.id, channel: "email",
      externalId: `persona_${id}`, subject: t.subject, body: t.body.replace("{n}", cust?.firstName || "there"),
      type: t.type, sentiment: t.sentiment, createdAt: iso(now - i * 5 * 3600_000 - 1800_000),
      firstResponseSec: null, status: "open", tags: [],
    };
  });

  return { merchant, customers, orders, gifts, tickets };
}

const built = PERSONAS.map(buildPersona);

// ── dry-run: validate + print, no DB ─────────────────────────────────────────
if (DRY) {
  console.log("DRY RUN — no database touched.\n");
  for (let i = 0; i < built.length; i++) {
    const b = built[i], p = PERSONAS[i];
    const overdue = b.orders.filter((o) => new Date(o.fulfillmentEnd).getTime() < now).length;
    console.log(`${p.key.padEnd(10)} ${b.merchant.name.padEnd(22)} day-${p.waitDay} win ${p.winMin}-${p.winMax}  | ${b.orders.length} orders (${overdue} overdue), ${b.customers.length} customers, ${b.tickets.length} tickets, ${b.gifts.length} gifts`);
    console.log(`  stages seen: ${[...new Set(b.orders.map((o) => o.productionStage))].join(", ")}`);
    console.log(`  ticket heat: ${b.tickets.map((t) => t.sentiment).join(", ")}`);
  }
  console.log("\n✓ built cleanly. Run without --dry-run (with TEST_OWNER_SUB + MONGODB_URI) to seed.");
  process.exit(0);
}

// ── DB paths (seed / activate) ───────────────────────────────────────────────
const uri = process.env.MONGODB_URI;
if (!uri) { console.error("✗ MONGODB_URI not set (add it to .env.local, or use --dry-run)."); process.exit(1); }
const OWNER = process.env.TEST_OWNER_SUB;
if (!OWNER) { console.error('✗ TEST_OWNER_SUB required (your Auth0 user_id), e.g. TEST_OWNER_SUB="google-oauth2|..."'); process.exit(1); }

const client = new MongoClient(uri);
try {
  await client.connect();
  const db = client.db(process.env.MONGODB_DB_LIVE || "tideover_live");

  if (ACTIVATE) {
    const target = PERSONAS.find((p) => p.key === ACTIVATE);
    if (!target) { console.error(`✗ unknown persona "${ACTIVATE}" (${PERSONAS.map((p) => p.key).join(", ")})`); process.exit(1); }
    for (const p of PERSONAS) {
      const sub = p.key === ACTIVATE ? OWNER : mockSub(p.key);
      await db.collection("merchants").updateOne({ id: `mch_persona_${p.key}` }, { $set: { ownerSub: sub } });
    }
    console.log(`✓ activated "${target.name}" for ${OWNER}. Log in at app.tideover.app/app — you're now this persona. Re-run --activate <key> to switch.`);
    process.exit(0);
  }

  // seed: guard against clobbering a real non-persona merchant, then additive upsert
  const upsert = async (coll, docs) => {
    if (!docs.length) return 0;
    await db.collection(coll).createIndex({ id: 1 }, { unique: true }).catch(() => {});
    const res = await db.collection(coll).bulkWrite(docs.map((d) => ({ replaceOne: { filter: { id: d.id }, replacement: d, upsert: true } })), { ordered: false });
    return res.upsertedCount + res.modifiedCount;
  };
  for (const b of built) {
    const existing = await db.collection("merchants").findOne({ id: b.merchant.id });
    if (existing && existing.ownerSub && existing.ownerSub !== OWNER && !existing.ownerSub.startsWith("persona|")) {
      console.error(`✗ ${b.merchant.id} belongs to ${existing.ownerSub} — refusing to overwrite a non-persona owner.`); process.exit(1);
    }
    const wrote = {
      merchants: await upsert("merchants", [b.merchant]), customers: await upsert("customers", b.customers),
      orders: await upsert("orders", b.orders), gifts: await upsert("gifts", b.gifts), tickets: await upsert("tickets", b.tickets),
    };
    console.log(`  ${b.merchant.name.padEnd(22)} ${Object.entries(wrote).map(([k, v]) => `${k}:${v}`).join(" ")}`);
  }
  console.log(`\n✓ 5 personas seeded into "${db.databaseName}". Next: --activate <key> to become one (${PERSONAS.map((p) => p.key).join(", ")}). Briefings: docs/personas/*.md`);
} catch (err) {
  console.error(`✗ seed-personas failed: ${err instanceof Error ? err.message : String(err)}`);
  process.exitCode = 1;
} finally {
  await client.close();
}
