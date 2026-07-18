# Release ritual

Boring on purpose, so shipping is never scary. Every change to production follows
these steps. Most are one command; the whole thing is a few minutes.

## The steps

1. **Gate green (local).** From `tideover/`:
   ```
   npm run verify && npm test
   ```
   `verify` = seed-check → proof-lint → eval (52k invariants + goldens) → lint → build.
   Nothing ships if this is red.

2. **Land it.** Push the feature branch, open/refresh the PR into `main`. CI
   (`.github/workflows/ci.yml`) re-runs `verify` + `test`; the `main` ruleset
   requires it green before merge. Never push to `main` directly.

3. **Deploy.** Production deploys from the local `tideover/` tree via the Vercel
   CLI (the Vercel creds live on Dylan's machine):
   ```
   vercel --prod --yes
   ```
   The live public site is **https://www.tideover.app** (the `*.vercel.app`
   deployment URL sits behind Vercel SSO — don't share or smoke that one).

4. **Smoke the live site.**
   ```
   npm run smoke
   ```
   Hits www.tideover.app: key pages 200, the status API returns JSON, and — the
   proof-only tripwire — the rendered customer status page carries a confidence
   band and **no hard calendar date**. Non-zero exit = something's wrong; roll
   back (re-deploy the previous commit) before debugging forward.

5. **Record it.** Add a dated entry to `CHANGELOG.md` (newest first) and a
   one-line note in `mission-control/NOTES-FOR-CLAUDE.md`.

## Data-layer notes

- Production runs on **MongoDB Atlas** (`DATA_DRIVER=mongo`). After a seed-schema
  change, re-seed Atlas before the deploy that reads it:
  ```
  npm run seed:mongo -- --force
  ```
- The JSON driver (default when `DATA_DRIVER` is unset) is the demo/dev path;
  writes there are in-memory and reset on restart.

## Rollback

`vercel --prod` from the previous good commit, then `npm run smoke` to confirm.
Vercel also keeps prior deployments — promoting an older one in the dashboard is
the fastest path if the tree is mid-change.

## Uptime monitoring (the dead-man switch)

`GET /api/health` (public, no auth) returns **200 `{status:"ok"}`** when the app is
up and the data driver is reachable, and **503 `{status:"degraded"}`** when the DB
can't be reached. It leaks nothing sensitive — just up/down + the driver name.

Point a free external monitor at it so a prod outage pages you instead of a
prospect finding it:

1. Sign up for UptimeRobot / Cronitor / BetterStack (free tiers are enough).
2. Add an **HTTP(s)** monitor on `https://www.tideover.app/api/health`, interval
   1–5 min.
3. Alert condition: **status code is not 200** (a 503 or a timeout both mean
   degraded). Send the alert to your email/phone.

That external ping *is* the dead-man switch: if the app or MongoDB goes down, the
monitor stops seeing 200s and notifies you. Nothing to run on our side.
