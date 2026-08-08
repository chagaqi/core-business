# Tideover HQ — published board

**https://claude.ai/code/artifact/ea2656ef-f42b-4329-b416-d22c90baf3e0**

Private to Dylan unless shared from the page's share menu. Browse all artifacts at `claude.ai/code/artifacts`.

## How this stays current

`mission-control/tideover-hq.html` in this repo is the **source of truth** — Claude edits it every sprint tick. The artifact is a published snapshot of that file.

**To refresh it:** tell Claude "republish the board". The build step is:

```
node -e "<transform>"   # scratchpad/tideover-hq-artifact.html
Artifact(file_path: <that file>, url: https://claude.ai/code/artifact/ea2656ef-f42b-4329-b416-d22c90baf3e0)
```

Passing that `url` keeps the same link. Omitting it mints a new one.

## What the published copy changes (and why)

1. **Repo-relative links become plain paths.** `../docs/...` can't resolve from the artifact's origin, so they render as `<code>` paths to open locally. Absolute links (Vercel, Auth0, localhost) still work — localhost ones need `npm run dev` running.
2. **Scraped prospect emails are redacted.** Two third-party business addresses appear in the build log; an artifact is shareable, so they're stripped from the published copy. The local file keeps them.
3. **Checkbox/approval state is per-site.** The board stores your ticks in browser storage, so ticks on the artifact and ticks in the local file are separate. Use one or the other as your working copy — or keep using `NOTES-FOR-CLAUDE.md`, which Claude can actually read.
