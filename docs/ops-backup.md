# Backup & restore runbook (task F5)

Production runs on MongoDB Atlas (`DATA_DRIVER=mongo`). This is how the data is protected and recovered. Three layers, in order of preference.

## 1. Atlas cloud backups — the primary, enable this first

Atlas takes managed snapshots for you; nothing to run on our side.

- **Check/enable:** Atlas → your cluster → **Backup** tab.
  - **M10+** clusters: continuous cloud backup with point-in-time restore — turn it on, set retention (7–30 days is plenty).
  - **M2 / M5** (shared): daily snapshots — enable them.
  - **M0 (free):** **no backups at all.** If the cluster is M0, either upgrade to **M2** (a few dollars/month, gets daily snapshots) or rely on layer 2 below until you do. Do not run a real pilot on M0 without layer 2 running.
- **Restore:** Atlas → Backup → pick a snapshot → Restore. This is the fastest full recovery.

## 2. `npm run backup` — a portable point-in-time snapshot (works on any tier)

A read-only logical dump you can run anytime, including on M0 where Atlas has none.

```
cd tideover
npm run backup
```

Writes `backups/tideover-backup-<timestamp>.json` (git-ignored — it contains merchant data, never commit it) with every collection. It only runs `find()` queries, so it is always safe against production. Store the file somewhere durable (an external drive, a private cloud folder). **Run it daily during a pilot**, or before any risky migration/reseed.

**Restore from one of these files:**
- Per-collection with the Mongo tools: `mongoimport --uri="$MONGODB_URI" --collection=<name> --file=<extracted-collection>.json --jsonArray` (extract a collection array from the backup first), **or**
- Reset to the seed baseline (loses live data since the last seed): `npm run seed:mongo -- --force` — the seed shape is the production shape (ADR-0003), so this is a clean known-good state, not a real restore.

For a full binary dump/restore (fastest for large data), `mongodump`/`mongorestore` against `$MONGODB_URI` also work and don't need this app.

## 3. Automated nightly offsite — NEEDS-DYLAN (a destination + credentials)

Fully hands-off nightly backups to durable offsite storage need a destination we don't have yet:

- Pick a bucket (Cloudflare R2, AWS S3, or Backblaze B2 — R2 has no egress fees) and create a scoped write-only key.
- Then a scheduled job (a Vercel Cron like the existing `sweep-outcomes`, or a GitHub Action on a nightly schedule) runs the same dump as `npm run backup` and uploads it to the bucket.

This is the one piece I can't finish autonomously — it requires the bucket + credentials. Once you provide a destination + key, wiring the nightly upload is a one-tick build. **Until then, layer 1 (Atlas) is your automated backup and layer 2 (`npm run backup`) is your manual one** — set a daily reminder for layer 2 during a pilot if the cluster is M0.

## Recommendation

Enable Atlas backups now (layer 1). During a pilot, also run `npm run backup` daily and keep the files offsite (layer 2). Wire layer 3 the moment a real merchant's data is in play.
