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
 */
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
];

const uri = process.env.MONGODB_URI;
if (!uri) {
  console.error("✗ MONGODB_URI is not set (set it in .env.local, then: npm run seed:mongo)");
  process.exit(1);
}
const force = process.argv.includes("--force");

const client = new MongoClient(uri);
try {
  await client.connect();
  const db = client.db(process.env.MONGODB_DB || "tideover");

  if (!force) {
    let existing = 0;
    for (const { name } of COLLECTIONS) existing += await db.collection(name).countDocuments();
    if (existing > 0) {
      console.error(
        `✗ refusing: database "${db.databaseName}" already holds ${existing} documents across seed collections. Re-run with --force to upsert anyway.`,
      );
      process.exit(1);
    }
  }

  for (const { name, file } of COLLECTIONS) {
    const docs = JSON.parse(readFileSync(join(DATA, file), "utf8"));
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
