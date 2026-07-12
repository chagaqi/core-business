/**
 * Point-in-time logical backup: every MongoDB collection → one timestamped JSON
 * file under ./backups/ (git-ignored). READ-ONLY — it only runs find() queries,
 * so it is always safe to run against production.
 *
 * Run: npm run backup
 *      (→ node --env-file-if-exists=.env.local --import ./scripts/local-dns.mjs
 *         scripts/backup.mjs — same env/DNS setup as seed:mongo)
 *
 * Reads MONGODB_URI (+ MONGODB_DB, default "tideover") straight from the
 * environment. The collection set + doc shape mirror seed-mongo.mjs (ADR-0003:
 * the seed shape IS the production shape), so a backup restores cleanly with
 * mongoimport or by feeding a collection back through the seed path. See
 * docs/ops-backup.md for the full backup + restore runbook.
 */
import { mkdirSync, writeFileSync } from "fs";
import { fileURLToPath } from "url";
import { dirname, join } from "path";
import { MongoClient } from "mongodb";

const __dirname = dirname(fileURLToPath(import.meta.url));
const BACKUP_DIR = join(__dirname, "..", "backups");

// Same collections seed-mongo.mjs manages — keep the two lists in step.
const COLLECTIONS = [
  "merchants",
  "customers",
  "orders",
  "tickets",
  "gifts",
  "social",
  "status_views",
  "script_variants",
  "outcome_events",
  "merchant_updates",
  // The production status board — append-only, and it is the record of WHAT WE
  // TOLD A CUSTOMER AND WHEN. Losing it loses the merchant's chargeback exhibit,
  // so it is backed up like any other ledger.
  "production_statuses",
];

const uri = process.env.MONGODB_URI;
if (!uri) {
  console.error(
    "✗ MONGODB_URI is not set. A backup targets the live database — set it in .env.local, then: npm run backup",
  );
  process.exit(1);
}

const client = new MongoClient(uri, { serverSelectionTimeoutMS: 10000 });

try {
  await client.connect();
  const dbName = process.env.MONGODB_DB || "tideover";
  const db = client.db(dbName);

  const collections = {};
  const counts = {};
  for (const name of COLLECTIONS) {
    // Strip Mongo's _id so the dump matches the app/seed doc shape exactly.
    const docs = await db.collection(name).find({}, { projection: { _id: 0 } }).toArray();
    collections[name] = docs;
    counts[name] = docs.length;
  }

  const stamp = new Date().toISOString().replace(/[:.]/g, "-");
  const backup = { generatedAt: new Date().toISOString(), db: dbName, counts, collections };

  mkdirSync(BACKUP_DIR, { recursive: true });
  const out = join(BACKUP_DIR, `tideover-backup-${stamp}.json`);
  writeFileSync(out, JSON.stringify(backup, null, 2));

  const total = Object.values(counts).reduce((a, b) => a + b, 0);
  console.log(`✓ backup written: ${out}`);
  console.log(`  ${total} documents across ${COLLECTIONS.length} collections — ${JSON.stringify(counts)}`);
} catch (err) {
  console.error("✗ backup failed:", err instanceof Error ? err.message : err);
  process.exit(1);
} finally {
  await client.close();
}
