import { jsonRepositories } from "@/lib/repositories/json/repositories";
import type { Repositories } from "@/lib/repositories/types";

/**
 * Repository factory. Switches on DATA_DRIVER so MongoDB Atlas can be wired in
 * later (lib/repositories/mongo) without touching a single call site.
 *
 *   DATA_DRIVER=mock  (default) → JSON-backed in-memory store
 *   DATA_DRIVER=mongo           → MongoDB (skeleton; see lib/repositories/mongo)
 */
export function getRepositories(): Repositories {
  const driver = process.env.DATA_DRIVER ?? "mock";
  switch (driver) {
    case "mongo":
      // Intentionally not wired for the seeded demo. The mongo/ skeleton maps
      // the same Repositories interface to collections + indexes. Throw loudly
      // rather than silently fall back, so a misconfigured deploy is obvious.
      throw new Error(
        "DATA_DRIVER=mongo is not wired in the demo. See lib/repositories/mongo/README for the production swap.",
      );
    case "mock":
    default:
      return jsonRepositories;
  }
}

export type { Repositories } from "@/lib/repositories/types";
