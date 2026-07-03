import { buildSeed, type SeedData } from "@/lib/data/seed";

/**
 * Process-wide in-memory store seeded from the generated JSON. Writes persist
 * for the life of the server process (so the demo's approve→send, onboarding
 * create, etc. are visible across requests) but never touch disk — restart =
 * pristine deterministic data. A globalThis cache survives Next.js HMR/route
 * module reloads in dev.
 */
const KEY = "__tideover_store__";

type Store = SeedData;

function create(): Store {
  return buildSeed();
}

const g = globalThis as unknown as { [KEY]?: Store };
export const store: Store = g[KEY] ?? (g[KEY] = create());
