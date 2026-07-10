import { jsonRepositories } from "@/lib/repositories/json/repositories";
import { mongoRepositories } from "@/lib/repositories/mongo/repositories";
import { withTenantScope } from "@/lib/repositories/tenant-scope";
import { resolveDatastoreModeFromRequest } from "@/lib/request-mode";
import { authMode } from "@/lib/auth-mode";
import type { Mode } from "@/lib/mode";
import type { Repositories } from "@/lib/repositories/types";

/**
 * Repository factory (ADR-0003, ADR-0017). The datastore mode is derived per
 * call from the request host (the live subdomain → "real", every other host and
 * anything outside a request scope → "demo"), so no call site knows which
 * backend it is talking to.
 *
 *   demo → today's behavior EXACTLY: DATA_DRIVER switch —
 *          unset | json | mock → JSON in-memory store (default), mongo → MongoDB
 *          against MONGODB_DB (default "tideover").
 *   real → the mongo driver bound to the LIVE database (MONGODB_DB_LIVE, default
 *          "tideover_live"; the db name is selected inside the mongo client).
 *          A real request with no MONGODB_URI THROWS — it must NEVER fall back
 *          to the JSON/demo store, because a live pilot silently writing to an
 *          in-memory or demo store is pilot data loss.
 *
 * The two backends (jsonRepositories, mongoRepositories) are module-level
 * singletons — one lazy cached datastore per mode — and the mongo driver only
 * connects on the first repository call, so demo/JSON runs and builds never
 * touch the network.
 */

/**
 * Resolve the repositories for an already-decided mode. Split out from
 * getRepositories() so the real-mode guard is unit-testable without fabricating
 * a live request scope (resolveDatastoreModeFromRequest reads next/headers,
 * which only resolves inside the Next runtime).
 */
export function repositoriesForMode(mode: Mode): Repositories {
  if (mode === "real") {
    if (!process.env.MONGODB_URI) {
      throw new Error(
        "real mode requires MONGODB_URI: refusing to serve the live app from the demo/JSON store — that would be pilot data loss. Set MONGODB_URI (and MONGODB_DB_LIVE).",
      );
    }
    return mongoRepositories;
  }
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

export function getRepositories(): Repositories {
  const repos = repositoriesForMode(resolveDatastoreModeFromRequest());
  // ADR-0020: with Auth0 accounts configured, every repo access runs through
  // the tenant-scope wrapper. The wrapper re-resolves the request's scope per
  // call and passes through UNSCOPED everywhere except marked operator
  // requests with a live session — so demo hosts, public surfaces, cron,
  // scripts and tests behave exactly as before. Password mode ("auth0" vars
  // absent) skips the wrapper entirely.
  return authMode() === "auth0" ? withTenantScope(repos) : repos;
}

export type { Repositories } from "@/lib/repositories/types";
