import { headers } from "next/headers";
import { isRealHost, resolveMode, type Mode } from "@/lib/mode";

/**
 * Request-scoped mode resolution (ADR-0017). Kept separate from the Edge-safe
 * lib/mode.ts precisely because it imports next/headers — which must never be
 * pulled into the middleware Edge bundle. Only Node-runtime server code
 * (lib/auth.ts, the repository seam) imports this file.
 *
 * The static `import { headers } from "next/headers"` is deliberate: it lets
 * Next wire headers() to the live request's async context in production. A
 * dynamic/createRequire import would load a DIFFERENT module instance whose
 * AsyncLocalStorage is never populated, so headers() would throw even inside a
 * real request — silently defeating host-based resolution. (The node --test
 * loader can't resolve the bare `next/headers` specifier; scripts/alias-hooks.mjs
 * maps it to the real file for the test/eval runners only.)
 *
 * Outside a request scope (scripts, tests, build-time module eval) headers()
 * throws; every reader below catches it and falls back to today's behavior.
 */

/** The incoming Host header, or undefined. THROWS outside a request scope. */
function requestHost(): string | undefined {
  return headers().get("host") ?? undefined;
}

/**
 * AUTH mode for the current request (backs lib/auth.ts isDemoMode). Honors the
 * DEMO_MODE override via resolveMode. Outside a request scope it falls back to
 * resolveMode(undefined) — i.e. env-only (DEMO_MODE) resolution.
 */
export function resolveModeFromRequest(): Mode {
  try {
    return resolveMode(requestHost());
  } catch {
    return resolveMode(undefined);
  }
}

/**
 * DATASTORE mode for the current request (ADR-0017 subdomain split). Bound to
 * the request HOST only: the live store belongs to the live subdomain, so the
 * DEMO_MODE auth override does NOT relocate the datastore. Outside a request
 * scope (scripts, tests, build) → "demo", i.e. today's DATA_DRIVER behavior
 * exactly. This is what keeps scripts/tests unchanged even when they set
 * DEMO_MODE=false to exercise the auth/ingest gates.
 */
export function resolveDatastoreModeFromRequest(): Mode {
  // Fail-safe (ADR-0017): an explicit DEMO_MODE=true forces demo for BOTH auth
  // and datastore, so "auth off" can never coincide with the live store — even on
  // the real host. Without this, host=app.tideover.app + DEMO_MODE=true would gate
  // auth OFF (resolveMode -> demo) yet keep the datastore host-real, serving live
  // data unauthenticated. Note the asymmetry is deliberate: DEMO_MODE=false does
  // NOT force the datastore to real (real still requires the real HOST), so
  // out-of-request scripts/tests that set DEMO_MODE=false to exercise the ingest
  // signature gate keep today's JSON-store behavior instead of throwing.
  if (process.env.DEMO_MODE === "true") return "demo";
  try {
    return isRealHost(requestHost()) ? "real" : "demo";
  } catch {
    return "demo";
  }
}
