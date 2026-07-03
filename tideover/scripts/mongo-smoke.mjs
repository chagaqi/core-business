/**
 * Mongo connectivity smoke test: insert → read → delete round-trip in a
 * scratch collection. Prints PASS/FAIL and exits non-zero on failure.
 *
 * Run: npm run smoke:mongo
 *      (→ node --env-file-if-exists=.env.local --import ./scripts/local-dns.mjs
 *         scripts/mongo-smoke.mjs — see local-dns.mjs for the SRV/DNS caveat)
 *
 * Reads MONGODB_URI (+ MONGODB_DB, default "tideover") straight from the
 * environment — no dotenv; pass the env file via node's --env-file flag.
 */
import { MongoClient } from "mongodb";

const uri = process.env.MONGODB_URI;
if (!uri) {
  console.error("FAIL: MONGODB_URI is not set (set it in .env.local, then: npm run smoke:mongo)");
  process.exit(1);
}

const client = new MongoClient(uri, { serverSelectionTimeoutMS: 10000 });
try {
  await client.connect();
  const db = client.db(process.env.MONGODB_DB || "tideover");
  const col = db.collection("_smoke");
  const id = `smoke_${Date.now()}_${Math.random().toString(36).slice(2)}`;

  await col.insertOne({ id, at: new Date().toISOString() });
  const read = await col.findOne({ id }, { projection: { _id: 0 } });
  if (!read || read.id !== id) throw new Error("read-back mismatch after insert");
  const del = await col.deleteOne({ id });
  if (del.deletedCount !== 1) throw new Error("delete did not remove the scratch doc");
  // leave no scratch collection behind (best-effort; PASS doesn't depend on it)
  await db.dropCollection("_smoke").catch(() => {});

  console.log(`PASS: insert→read→delete round-trip OK on "${col.dbName}._smoke"`);
} catch (err) {
  console.error(`FAIL: ${err instanceof Error ? err.message : String(err)}`);
  process.exitCode = 1;
} finally {
  await client.close();
}
