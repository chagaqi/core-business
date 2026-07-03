# MongoDB driver (ADR-0003)

Implements the `Repositories` interface (`lib/repositories/types.ts`) against
MongoDB. Selected by `DATA_DRIVER=mongo` in `getRepositories()`; JSON stays the
default. **No call site changes** — semantics match the JSON driver 1:1.

## Wiring

- `client.ts` — lazy connect on first repository call (never at import/build
  time). `MongoClient` promise cached on `globalThis` so serverless invocations
  and dev HMR reuse one client. Env: `MONGODB_URI` (required), `MONGODB_DB`
  (default `tideover`). Indexes are created once per process on connect:
  unique `id` per collection, `merchantId` on merchant-scoped collections,
  `statusToken` on orders.
- `repositories.ts` — documents are the domain objects verbatim (ISO-date
  strings, prefixed-nanoid `id`, integer cents). Mongo `_id` stays an ObjectId
  and never escapes: reads project `{_id: 0}`, inserts write copies. `update`
  is a top-level `$set` (= the JSON driver's shallow merge) and throws
  `not found: <id>` like the JSON driver.

## Collections (1:1 with `lib/types.ts`)

`merchants`, `orders`, `customers`, `tickets`, `gifts`, `social`
(seeded from `lib/data/social-feed.json`).

## Exact-semantics notes

- `orders.findByToken` narrows on the indexed `<raw>.` prefix, then applies the
  JSON driver's verify-and-compare predicate (`lib/ids.ts`).
- `customers.findByEmail` compares lowercased emails in JS, same predicate as
  the JSON driver, so unicode casing can't diverge.
- No unique index on `slug` or `{merchantId, email}` — the JSON driver never
  rejects duplicates, and the drivers must not diverge.

## Seeding

`npm run seed:mongo` (→ `node --env-file-if-exists=.env.local --import
./scripts/local-dns.mjs scripts/seed-mongo.mjs`) bulk-upserts
`lib/data/*.json` by `id`; refuses a non-empty database without `--force`.
`npm run smoke:mongo` does a connect→insert→read→delete round-trip. Then flip
`DATA_DRIVER=mongo`.

## Local DNS caveat (mongodb+srv://)

Some machines run a local DNS proxy (127.0.0.1) that refuses the SRV/TXT
lookups Node's c-ares resolver issues for `mongodb+srv://` URIs, even though
the OS resolver works. The mongo npm scripts preload
`scripts/local-dns.mjs`, which points `dns.setServers` at public resolvers
(8.8.8.8 / 1.1.1.1) for those scripts only. For local dev with
`DATA_DRIVER=mongo` (the Next.js app itself), either set
`NODE_OPTIONS="--import ./scripts/local-dns.mjs"` or use a non-SRV
`mongodb://` URI. Vercel is unaffected.
