import { MongoClient, type Db } from "mongodb";

/**
 * Lazy MongoDB connection (ADR-0003). Nothing runs at import time — the first
 * repository call connects, so builds without MONGODB_URI never touch the
 * network. The Db promise is cached on globalThis (mirrors json/store.ts) so
 * serverless invocations and Next.js HMR reuse one client instead of leaking.
 * Index creation piggybacks on the connect, so it runs once per process.
 */
const KEY = "__tideover_mongo__";

const COLLECTIONS = [
  "merchants",
  "orders",
  "customers",
  "tickets",
  "gifts",
  "social",
  "status_views",
  "script_variants",
  "outcome_events",
] as const;

async function ensureIndexes(db: Db): Promise<void> {
  await Promise.all(
    COLLECTIONS.map(async (name) => {
      const col = db.collection(name);
      // Domain `id` is the real key; Mongo's _id never leaves the driver.
      await col.createIndex({ id: 1 }, { unique: true });
      if (name !== "merchants") await col.createIndex({ merchantId: 1 });
      // ADR-0008: inbound email routing resolves an address local-part →
      // merchant; the token is unique per merchant and looked up on every hit.
      if (name === "merchants") await col.createIndex({ inboxToken: 1 }, { unique: true });
      if (name === "orders") await col.createIndex({ statusToken: 1 });
      // Idempotency backstop: a truly-concurrent vendor redelivery can slip
      // past the pre-lookup in ingestTicket, so bind dedupe to a DB constraint.
      // sparse so tickets without an externalId aren't indexed on null.
      if (name === "tickets") {
        await col.createIndex(
          { merchantId: 1, channel: 1, externalId: 1 },
          { unique: true, sparse: true },
        );
      }
      // Append-only view log (ADR-0005): non-unique — a customer may view a
      // status page many times; listByOrder reads by order in viewedAt order.
      if (name === "status_views") await col.createIndex({ orderId: 1, viewedAt: 1 });
      // Outcome ledger (ADR-0007). Variant id is the unique key (covered by the
      // generic {id:1} unique index above). Outcome events are append-only, so
      // index the rollup access pattern non-uniquely.
      if (name === "outcome_events") {
        await col.createIndex({ merchantId: 1, variantId: 1, kind: 1, observedAt: 1 });
      }
    }),
  );
}

async function connect(): Promise<Db> {
  const uri = process.env.MONGODB_URI;
  if (!uri) {
    throw new Error("DATA_DRIVER=mongo requires MONGODB_URI (see .env.local)");
  }
  // ignoreUndefined: never serialize undefined as null. Note the drivers do
  // NOT agree on explicitly-undefined patch values (the JSON driver's
  // spread-then-stringify drops the key; this driver retains the stored
  // value) — the Repositories contract forbids them (see types.ts).
  // serverSelectionTimeoutMS: fail fast on serverless instead of hanging a
  // request for the 30s driver default.
  const client = await new MongoClient(uri, {
    ignoreUndefined: true,
    serverSelectionTimeoutMS: 8000,
  }).connect();
  const db = client.db(process.env.MONGODB_DB || "tideover");
  try {
    await ensureIndexes(db);
  } catch (err) {
    // Don't leak the connected client when index creation fails — the cache
    // eviction below forgets this promise, so nothing would ever close it.
    await client.close().catch(() => {});
    throw err;
  }
  return db;
}

const g = globalThis as unknown as { [KEY]?: Promise<Db> };

export function getDb(): Promise<Db> {
  if (!g[KEY]) {
    // Drop a failed connect from the cache so a transient outage doesn't
    // poison every later request in this process.
    g[KEY] = connect().catch((err: unknown) => {
      g[KEY] = undefined;
      throw err;
    });
  }
  return g[KEY];
}
