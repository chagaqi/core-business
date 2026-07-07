/**
 * Real-vs-demo mode resolution (ADR-0017). PURE and Edge-safe: reads only
 * process.env + does string work, imports nothing from next/headers, so it is
 * importable from the Edge middleware bundle. The request-scoped wrappers live
 * in lib/request-mode.ts (which does pull in next/headers).
 *
 * Two derivations share this file because they normalize the host identically
 * but treat the DEMO_MODE override differently:
 *   - resolveMode()  → the AUTH mode (middleware gate, isDemoMode). The legacy
 *     DEMO_MODE override wins here for backcompat: existing DEMO_MODE=false
 *     deploys keep the operator login on EVERY host.
 *   - isRealHost()   → the DATASTORE signal (which physical store to serve). The
 *     live store belongs to the live SUBDOMAIN, so this is host-only and the
 *     DEMO_MODE auth toggle never, by itself, repoints the datastore.
 */

export type Mode = "real" | "demo";

const DEFAULT_REAL_APP_HOST = "app.tideover.app";

/** The configured real-app host, normalized (lowercase, trimmed). */
function realAppHost(): string {
  return (process.env.REAL_APP_HOST ?? DEFAULT_REAL_APP_HOST).trim().toLowerCase();
}

/**
 * True iff `host` is the real app host. Normalizes the incoming host (lowercase,
 * strip any :port). No host (undefined/empty) is never the real app → false.
 */
export function isRealHost(host: string | undefined): boolean {
  if (!host) return false;
  const normalized = host.trim().toLowerCase().split(":")[0];
  return normalized === realAppHost();
}

/**
 * AUTH mode for a request host. Precedence (ADR-0017):
 *   1. DEMO_MODE="false" → "real"  (explicit env override, wins — backcompat)
 *   2. DEMO_MODE="true"  → "demo"  (explicit env override, other direction)
 *   3. else the host: the real app host → "real"; any other host or no host → "demo".
 */
export function resolveMode(host?: string): Mode {
  const override = process.env.DEMO_MODE;
  if (override === "false") return "real";
  if (override === "true") return "demo";
  return isRealHost(host) ? "real" : "demo";
}
