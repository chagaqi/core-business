import { MongoClient, type Db } from "mongodb";
import { resolveDatastoreModeFromRequest } from "@/lib/request-mode";

/**
 * Lazy MongoDB connection (ADR-0003, ADR-0017). Nothing runs at import time —
 * the first repository call connects, so builds without MONGODB_URI never touch
 * the network. Db promises are cached on globalThis (mirrors json/store.ts) so
 * serverless invocations and Next.js HMR reuse clients instead of leaking.
 * Index creation piggybacks on the connect, so it runs once per db per process.
 *
 * The datastore split (ADR-0017) means one process can serve two physical
 * databases — the live store on the real subdomain and the demo store on every
 * other host — so the cache is keyed BY DB NAME rather than a single slot.
 */
const KEY = "__tideover_mongo__";

/**
 * Physical database for the current request's datastore mode (ADR-0017). Real
 * (the live subdomain) → MONGODB_DB_LIVE (default "tideover_live"), kept
 * strictly separate from the demo store so pilot data never mixes with seeded
 * sample data. Demo/dev/scripts → MONGODB_DB (default "tideover"), i.e. today's
 * behavior byte-for-byte. Host-only (see resolveDatastoreModeFromRequest), so
 * the DEMO_MODE auth toggle never repoints the database.
 */
function activeDbName(): string {
  return resolveDatastoreModeFromRequest() === "real"
    ? process.env.MONGODB_DB_LIVE ?? "tideover_live"
    : process.env.MONGODB_DB || "tideover";
}

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
  "merchant_updates",
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
      // Workshop updates (ADR-0009): the feed reads a merchant's recent updates
      // newest-first, so index the (merchantId, createdAt) access pattern.
      if (name === "merchant_updates") await col.createIndex({ merchantId: 1, createdAt: -1 });
    }),
  );
}

async function connect(dbName: string): Promise<Db> {
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
  const db = client.db(dbName);
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

const g = globalThis as unknown as { [KEY]?: Map<string, Promise<Db>> };

export function getDb(): Promise<Db> {
  if (!g[KEY]) g[KEY] = new Map<string, Promise<Db>>();
  const cache = g[KEY];
  const name = activeDbName();
  let entry = cache.get(name);
  if (!entry) {
    // Drop a failed connect from the cache so a transient outage doesn't
    // poison every later request to this db in this process.
    entry = connect(name).catch((err: unknown) => {
      cache.delete(name);
      throw err;
    });
    cache.set(name, entry);
  }
  return entry;
}
