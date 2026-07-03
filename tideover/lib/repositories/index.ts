import { jsonRepositories } from "@/lib/repositories/json/repositories";
import { mongoRepositories } from "@/lib/repositories/mongo/repositories";
import type { Repositories } from "@/lib/repositories/types";

/**
 * Repository factory. Switches on DATA_DRIVER; no call site knows which
 * backend it's talking to.
 *
 *   DATA_DRIVER unset | json | mock → JSON-backed in-memory store (default)
 *   DATA_DRIVER=mongo               → MongoDB (ADR-0003)
 *
 * The mongo driver is lazy — it only connects on the first repository call —
 * so builds and JSON-mode runs never touch the network.
 */
export function getRepositories(): Repositories {
  const driver = process.env.DATA_DRIVER ?? "json";
  switch (driver) {
    case "mongo":
      return mongoRepositories;
    case "json":
    case "mock":
    default:
      return jsonRepositories;
  }
}

export type { Repositories } from "@/lib/repositories/types";
