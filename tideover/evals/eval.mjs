/**
 * Engine eval entry point (ADR-0006, task OS4).
 *
 * Runs both layers in order — the authoritative invariant sweep, then the golden
 * regression — each in its own child so their process.exit codes stay isolated.
 * Both use the same node flags the "test" script uses (--experimental-strip-types
 * + register-hooks) so the @/ alias + TS load work. Exits nonzero if EITHER
 * layer fails; runs both regardless so a single command surfaces every problem.
 *
 * Wired into `npm run eval`, which is part of `npm run verify` and CI.
 */
import { spawnSync } from "node:child_process";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const HERE = dirname(fileURLToPath(import.meta.url));
const NODE_FLAGS = ["--experimental-strip-types", "--import", "./scripts/register-hooks.mjs"];
const LAYERS = ["invariants.mjs", "golden.mjs"];

let failed = false;
for (const layer of LAYERS) {
  const res = spawnSync(process.execPath, [...NODE_FLAGS, join(HERE, layer)], {
    stdio: "inherit",
    cwd: join(HERE, ".."), // project root (tideover) — register-hooks path is relative to it.
  });
  if (res.status !== 0) failed = true;
}

process.exit(failed ? 1 : 0);
