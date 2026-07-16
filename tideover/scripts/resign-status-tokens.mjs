/**
 * One-off surgical repair: re-sign every seeded status token in the DEMO
 * database with this environment's STATUS_TOKEN_SECRET. No deletes, no
 * reseed — updates exactly two fields (orders.statusToken, status_views.token)
 * in place, and only on documents whose id matches the committed seed.
 *
 * Why it exists (2026-07-16): the committed seed's tokens are signed with the
 * dev fallback secret. When the go-live secrets landed in Vercel (07-11),
 * verifyStatusToken started recomputing signatures with the REAL secret, so
 * every demo /status link 404'd from the 07-12 deploy onward. seed-mongo.mjs
 * now re-signs at import time; this script repairs a database seeded before
 * that fix without touching anything else in it.
 *
 * Run: npm run resign:status-tokens          (dry run — reports, writes nothing)
 *      npm run resign:status-tokens -- --apply
 *
 * Requires MONGODB_URI (+ MONGODB_DB, default "tideover") and the TARGET
 * environment's STATUS_TOKEN_SECRET in the env (--env-file=.env.local).
 * REFUSES the live database (MONGODB_DB_LIVE / "tideover_live") outright —
 * live tokens are minted under the real secret and are already correct.
 */
import { createHmac } from "crypto";
import { readFileSync } from "fs";
import { fileURLToPath } from "url";
import { dirname, join } from "path";
import { MongoClient } from "mongodb";

const __dirname = dirname(fileURLToPath(import.meta.url));
const DATA = join(__dirname, "..", "lib", "data");

const TARGETS = [
  { name: "orders", file: "orders.json", field: "statusToken" },
  { name: "status_views", file: "status-views.json", field: "token" },
];

const uri = process.env.MONGODB_URI;
if (!uri) {
  console.error("✗ MONGODB_URI is not set (set it in .env.local, then: npm run resign:status-tokens)");
  process.exit(1);
}
const apply = process.argv.includes("--apply");
const secretIsSet = Boolean(process.env.STATUS_TOKEN_SECRET);
const tokenSecret = process.env.STATUS_TOKEN_SECRET || "dev-only-change-me";
if (!secretIsSet) {
  console.warn(
    "! STATUS_TOKEN_SECRET is not set in this env — re-signing with the DEV fallback. That only makes sense against a local database.",
  );
}

const resign = (token) => {
  const raw = String(token).split(".")[0];
  return `${raw}.${createHmac("sha256", tokenSecret).update(raw).digest("hex").slice(0, 10)}`;
};

const client = new MongoClient(uri);
try {
  await client.connect();
  const db = client.db(process.env.MONGODB_DB || "tideover");

  const liveDbName = (process.env.MONGODB_DB_LIVE ?? "tideover_live").toLowerCase();
  if (db.databaseName.toLowerCase() === liveDbName) {
    console.error(
      `✗ refusing outright: "${db.databaseName}" is the LIVE database. Live tokens are minted under the real secret and are already valid — there is nothing for this script to fix there.`,
    );
    process.exit(1);
  }

  let changed = 0;
  let alreadyValid = 0;
  let missing = 0;
  for (const { name, file, field } of TARGETS) {
    const seedDocs = JSON.parse(readFileSync(join(DATA, file), "utf8"));
    const col = db.collection(name);
    for (const seedDoc of seedDocs) {
      if (typeof seedDoc[field] !== "string" || !seedDoc[field].includes(".")) continue;
      const raw = seedDoc[field].split(".")[0];
      // Match by seed id AND the token's stable raw prefix — never touch a
      // document whose token isn't the one the seed put there.
      const existing = await col.findOne(
        { id: seedDoc.id, [field]: { $regex: `^${raw}\\.` } },
        { projection: { [field]: 1 } },
      );
      if (!existing) {
        missing++;
        continue;
      }
      const next = resign(existing[field]);
      if (next === existing[field]) {
        alreadyValid++;
        continue;
      }
      if (apply) await col.updateOne({ id: seedDoc.id }, { $set: { [field]: next } });
      changed++;
    }
    console.log(`  ${name}: scanned ${seedDocs.length} seed doc(s)`);
  }

  console.log(
    `${apply ? "✓ applied" : "DRY RUN (nothing written; re-run with -- --apply)"}: ${changed} token(s) ${apply ? "re-signed" : "would be re-signed"}, ${alreadyValid} already valid, ${missing} seed doc(s) not found in "${db.databaseName}"`,
  );
  if (missing > 0) {
    console.warn(
      "! some seed documents are missing from this database — a full demo reseed (npm run seed:mongo -- --force) may be the better repair; it now re-signs at import.",
    );
  }
} catch (err) {
  console.error(`✗ resign-status-tokens failed: ${err instanceof Error ? err.message : String(err)}`);
  process.exitCode = 1;
} finally {
  await client.close();
}
