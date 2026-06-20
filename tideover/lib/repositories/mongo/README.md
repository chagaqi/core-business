# MongoDB driver (production swap — skeleton)

The demo runs on the JSON driver. To go to production, implement the
`Repositories` interface (`lib/repositories/types.ts`) against MongoDB Atlas and
return it from `getRepositories()` when `DATA_DRIVER=mongo`. **No call site
changes** — every surface, engine caller, and API route already depends only on
the interface.

## Collections (1:1 with `lib/types.ts`)

| Collection  | `_id`            | Key indexes |
|-------------|------------------|-------------|
| `merchants` | `mch_*`          | `slug` (unique) |
| `orders`    | `ord_*`          | `merchantId`, `customerId`, `statusTokenKey` (unique) |
| `customers` | `cus_*`          | `merchantId`, `{merchantId, email}` (unique) |
| `tickets`   | `tkt_*`          | `merchantId`, `status`, `customerId`, `orderId`, `createdAt` |
| `gifts`     | `gft_*`          | `merchantId` |
| `social`    | `sig_*`          | `merchantId`, `postedAt` |

## Notes
- Store the **HMAC lookup key** (`raw` half of the status token) as a separate
  indexed field `statusTokenKey` so `findByToken` is an indexed point query
  rather than a scan-and-verify (the JSON driver scans because n is tiny).
- Money stays integer cents. Dates stay ISO strings (or BSON dates — pick one and
  keep the type mapping in this module).
- Use a single `MongoClient` cached on `globalThis` (mirror `json/store.ts`) to
  survive serverless invocations / HMR.
- Reads: `findById`/`list*` map to `findOne`/`find().toArray()`. Writes: `create`
  → `insertOne`, `update` → `findOneAndUpdate({_id}, {$set: patch}, {returnDocument:'after'})`.

## Migration
Seed → Atlas is a one-shot import of `lib/data/*.json` (or `buildSeed()` output)
into the collections above, then flip `DATA_DRIVER=mongo`. The seed shape is
already the production document shape.
