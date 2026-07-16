/**
 * Idempotent seed import: lib/data/*.json → MongoDB, bulk upsert on `id`.
 *
 * Run: npm run seed:mongo [-- --force]
 *      (→ node --env-file-if-exists=.env.local --import ./scripts/local-dns.mjs
 *         scripts/seed-mongo.mjs — see local-dns.mjs for the SRV/DNS caveat)
 *
 * Reads MONGODB_URI (+ MONGODB_DB, default "tideover") straight from the
 * environment — no dotenv; pass the env file via node's --env-file flag as
 * above. REFUSES to touch a database whose seed collections already contain
 * documents unless --force is given. Re-running with --force fully replaces
 * each seeded document by id (the seed shape IS the production doc shape,
 * ADR-0003), so the import is idempotent.
 *
 * PROD-WIPE GUARD (EN-19): --force's `deleteMany({})` clears an ENTIRE
 * collection, not just documents matching seed ids — safe against the demo DB
 * (which only ever holds our own seed docs) but a real pilot database pointed
 * at by the same MONGODB_URI would lose every live order/ticket/customer.
 * Before a --force run does anything destructive, it now refuses (independent
 * of --force) when either is true:
 *   - the resolved db name looks live: matches MONGODB_DB_LIVE if set, else the
 *     documented live default "tideover_live" (lib/repositories/mongo/client.ts) —
 *     same env var the mongo driver itself uses to pick the live database;
 *   - any seed collection already holds a document whose `id` is NOT one of
 *     this seed's own ids — i.e. real, non-seed data, however the script got
 *     pointed at that database.
 * Either condition requires the explicit --i-understand-this-wipes-live flag
 * in addition to --force. The documented demo reseed (`npm run seed:mongo`,
 * with or without --force, against the demo DB) is unaffected: re-running it
 * only ever finds the seed's own ids already in place, so neither condition
 * trips and no new flag is required.
 */
import { createHmac } from "crypto";
import { readFileSync } from "fs";
import { fileURLToPath } from "url";
import { dirname, join } from "path";
import { MongoClient } from "mongodb";

const __dirname = dirname(fileURLToPath(import.meta.url));
const DATA = join(__dirname, "..", "lib", "data");

const COLLECTIONS = [
  { name: "merchants", file: "merchants.json" },
  { name: "customers", file: "customers.json" },
  { name: "orders", file: "orders.json" },
  { name: "tickets", file: "tickets.json" },
  { name: "gifts", file: "gifts.json" },
  { name: "social", file: "social-feed.json" },
  { name: "status_views", file: "status-views.json" },
  { name: "script_variants", file: "script-variants.json" },
  { name: "outcome_events", file: "outcome-events.json" },
  { name: "merchant_updates", file: "merchant-updates.json" },
];

const uri = process.env.MONGODB_URI;
if (!uri) {
  console.error("✗ MONGODB_URI is not set (set it in .env.local, then: npm run seed:mongo)");
  process.exit(1);
}
const force = process.argv.includes("--force");
const acknowledgesLiveWipe = process.argv.includes("--i-understand-this-wipes-live");

const client = new MongoClient(uri);
try {
  await client.connect();
  const db = client.db(process.env.MONGODB_DB || "tideover");

  // Read every seed file once, up front — needed for the write pass below, and
  // (when --force is given) to tell "this db holds only our own seed ids" apart
  // from "this db holds real data" before anything destructive runs.
  const seeded = COLLECTIONS.map(({ name, file }) => ({
    name,
    file,
    docs: JSON.parse(readFileSync(join(DATA, file), "utf8")),
  }));

  // Status tokens are HMAC-signed (lib/ids.ts): `<raw>.<sig>`, sig = first 10
  // hex chars of HMAC-SHA256(raw, STATUS_TOKEN_SECRET || dev fallback). The
  // committed seed is signed with the DEV fallback so local dev/tests verify
  // with no env. A deployed environment holds its own STATUS_TOKEN_SECRET, so
  // tokens must be RE-SIGNED at import time or every seeded /status link 404s
  // there (found 2026-07-16: prod demo status links dead since the go-live
  // secrets landed 07-11). With the fallback secret this is a byte-identical
  // no-op, so local seeding and seed-check are unaffected.
  const SIGNED_TOKEN_FIELDS = { orders: "statusToken", status_views: "token" };
  const tokenSecret = process.env.STATUS_TOKEN_SECRET || "dev-only-change-me";
  const resign = (token) => {
    const raw = String(token).split(".")[0];
    return `${raw}.${createHmac("sha256", tokenSecret).update(raw).digest("hex").slice(0, 10)}`;
  };
  let resigned = 0;
  for (const { name, docs } of seeded) {
    const field = SIGNED_TOKEN_FIELDS[name];
    if (!field) continue;
    for (const doc of docs) {
      if (typeof doc[field] !== "string" || !doc[field].includes(".")) continue;
      const next = resign(doc[field]);
      if (next !== doc[field]) resigned++;
      doc[field] = next;
    }
  }
  console.log(
    resigned > 0
      ? `  tokens: re-signed ${resigned} status token(s) for this environment's STATUS_TOKEN_SECRET`
      : "  tokens: signatures already match this environment (no re-sign needed)",
  );

  if (!force) {
    let existing = 0;
    for (const { name } of seeded) existing += await db.collection(name).countDocuments();
    if (existing > 0) {
      console.error(
        `✗ refusing: database "${db.databaseName}" already holds ${existing} documents across seed collections. Re-run with --force to upsert anyway.`,
      );
      process.exit(1);
    }
  } else if (!acknowledgesLiveWipe) {
    const liveDbName = (process.env.MONGODB_DB_LIVE ?? "tideover_live").toLowerCase();
    const looksLive = db.databaseName.toLowerCase() === liveDbName;

    let foreignDocs = 0;
    for (const { name, docs } of seeded) {
      const seedIds = docs.map((d) => d.id);
      // No seed ids for this collection (an empty seed file) → ANY existing
      // document in it is, by definition, not one of ours.
      const filter = seedIds.length > 0 ? { id: { $nin: seedIds } } : {};
      foreignDocs += await db.collection(name).countDocuments(filter);
    }

    if (looksLive || foreignDocs > 0) {
      console.error(
        `✗ refusing --force: database "${db.databaseName}" ${
          looksLive
            ? "looks like the LIVE database (name matches MONGODB_DB_LIVE / \"tideover_live\")"
            : `already holds ${foreignDocs} document(s) that aren't this seed's own ids`
        }. --force deletes every existing document in each seed collection before reseeding — re-run with --i-understand-this-wipes-live if that is really what you want.`,
      );
      process.exit(1);
    }
  }

  for (const { name, file, docs } of seeded) {
    if (docs.length === 0) {
      console.log(`  ${name}: skipped (0 in ${file})`);
      continue;
    }
    const col = db.collection(name);
    // same index the app driver creates lazily — harmless if it already exists
    await col.createIndex({ id: 1 }, { unique: true });
    // --force means "make the collection match the seed exactly": clear first
    // so ids that left the seed can't linger from an earlier import.
    if (force) await col.deleteMany({});
    const res = await col.bulkWrite(
      docs.map((doc) => ({
        replaceOne: { filter: { id: doc.id }, replacement: doc, upsert: true },
      })),
      { ordered: true },
    );
    console.log(
      `  ${name}: ${res.upsertedCount} inserted, ${res.modifiedCount} replaced (${docs.length} in ${file})`,
    );
  }
  console.log(`✓ seeded "${db.databaseName}" from lib/data/*.json`);
} catch (err) {
  console.error(`✗ seed-mongo failed: ${err instanceof Error ? err.message : String(err)}`);
  process.exitCode = 1;
} finally {
  await client.close();
}
