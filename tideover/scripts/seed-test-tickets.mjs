/**
 * Populate a real test workspace's INBOX so the owner can finish DN3 testing.
 * Finds the merchant owned by TEST_OWNER_SUB and attaches a realistic spread of
 * backer tickets to its existing orders — varied type + sentiment, the hottest
 * ones on the longest-waiting orders so risk scoring reads true. Deterministic
 * ids → idempotent (re-running updates the same tickets, never piles up dupes).
 *
 * ADDITIVE ONLY, targets MONGODB_DB_LIVE (default tideover_live).
 *
 * Run: TEST_OWNER_SUB="google-oauth2|..." npm run seed:test-tickets
 */
import { createHmac } from "crypto";
import { MongoClient } from "mongodb";

const OWNER = process.env.TEST_OWNER_SUB;
if (!OWNER) {
  console.error('✗ TEST_OWNER_SUB is required (the Auth0 user_id). e.g.\n  TEST_OWNER_SUB="google-oauth2|..." npm run seed:test-tickets');
  process.exit(1);
}
const uri = process.env.MONGODB_URI;
if (!uri) { console.error("✗ MONGODB_URI not set (add it to .env.local)."); process.exit(1); }

const now = Date.now();
const DAY = 24 * 60 * 60 * 1000;
const tid = (orderId) => `tkt_t${createHmac("sha256", "tideover-test").update(OWNER + orderId).digest("hex").slice(0, 11)}`;

// Ticket templates, roughly coldest → hottest. `{n}` = the customer's first name.
const TEMPLATES = [
  { type: "wismo", sentiment: "calm", subject: "Any update on my order?", body: "Hi {n} here — just checking in on where my chair is in the queue. No rush, thanks!" },
  { type: "wismo", sentiment: "calm", subject: "Shipping timeline?", body: "Hey! Could you tell me roughly when mine might ship? Excited for it." },
  { type: "wismo", sentiment: "anxious", subject: "Getting a little worried", body: "It's been a while since the last update and I haven't heard anything. Is everything still on track?" },
  { type: "wismo", sentiment: "anxious", subject: "Still coming?", body: "I backed this a while ago and it's gone quiet. Just want to make sure my order didn't fall through the cracks." },
  { type: "wismo", sentiment: "frustrated", subject: "This is taking forever", body: "Honestly starting to lose patience here. Every estimate has slipped. What is actually going on with fulfillment?" },
  { type: "wismo", sentiment: "frustrated", subject: "Where is it??", body: "Way past when this was supposed to arrive. I'd like a real answer, not another vague 'soon'." },
  { type: "other", sentiment: "calm", subject: "Need to change my address", body: "Hi — I moved since I pledged. Can you update the shipping address on my order before it goes out?" },
  { type: "refund", sentiment: "frustrated", subject: "Considering a refund", body: "If this can't ship in the next little while I think I want to cancel and get my money back. What are my options?" },
  { type: "wismo", sentiment: "hostile", subject: "Absolutely unacceptable", body: "This is a joke at this point. Months late, no communication. I want to know exactly when this ships or I'm done." },
  { type: "refund", sentiment: "chargeback-threat", subject: "Filing a dispute", body: "I've waited long enough with nothing to show for it. If I don't get a firm resolution I'm disputing the charge with my bank." },
];

const client = new MongoClient(uri);
try {
  await client.connect();
  const db = client.db(process.env.MONGODB_DB_LIVE || "tideover_live");
  const merchant = await db.collection("merchants").findOne({ ownerSub: OWNER });
  if (!merchant) { console.error(`✗ no merchant for owner ${OWNER}. Complete onboarding first, or use seed:test-account.`); process.exit(1); }

  // longest-waiting first, so the hottest templates land on the most overdue orders
  const orders = await db
    .collection("orders")
    .find({ merchantId: merchant.id })
    .sort({ fulfillmentStart: 1 })
    .limit(TEMPLATES.length * 2)
    .toArray();
  if (orders.length === 0) { console.error("✗ merchant has no orders to attach tickets to."); process.exit(1); }

  const customers = new Map(
    (await db.collection("customers").find({ merchantId: merchant.id }).toArray()).map((c) => [c.id, c]),
  );

  const tickets = [];
  for (let i = 0; i < Math.min(orders.length, TEMPLATES.length); i++) {
    const order = orders[i];
    const t = TEMPLATES[i];
    const cust = customers.get(order.customerId);
    const name = cust?.firstName || "there";
    const id = tid(order.id);
    tickets.push({
      id,
      merchantId: merchant.id,
      customerId: order.customerId,
      orderId: order.id,
      channel: "email",
      externalId: `test_${id}`,
      subject: t.subject,
      body: t.body.replace("{n}", name),
      type: t.type,
      sentiment: t.sentiment,
      createdAt: new Date(now - i * 6 * 3600_000 - 1800_000).toISOString(), // staggered over the last ~2.5 days
      firstResponseSec: null,
      status: "open",
      tags: [],
    });
  }

  await db.collection("tickets").createIndex({ id: 1 }, { unique: true }).catch(() => {});
  const res = await db.collection("tickets").bulkWrite(
    tickets.map((doc) => ({ replaceOne: { filter: { id: doc.id }, replacement: doc, upsert: true } })),
    { ordered: false },
  );
  console.log(`✓ ${tickets.length} tickets on "${merchant.name}" (${merchant.id}) — ${res.upsertedCount} new, ${res.modifiedCount} refreshed`);
  console.log(`  spread: ${TEMPLATES.map((t) => t.sentiment).slice(0, tickets.length).join(", ")}`);
  console.log("  Reload app.tideover.app/app/inbox — the queue is populated (AI drafts on open).");
} catch (err) {
  console.error(`✗ seed-test-tickets failed: ${err instanceof Error ? err.message : String(err)}`);
  process.exitCode = 1;
} finally {
  await client.close();
}
