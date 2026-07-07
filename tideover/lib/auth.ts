import { cookies } from "next/headers";
import { resolveModeFromRequest } from "@/lib/request-mode";

/**
 * Mode + operator identity (ADR-0004, ADR-0017). Mode is now derived from the
 * request host (the demo surface vs the real app subdomain); the demo surface
 * keeps every surface open on seeded data, while the real app requires the
 * signed session cookie (lib/session.ts) minted by /login. DEMO_MODE=false still
 * forces the real (gated) mode for backcompat. Single shared password —
 * per-operator identity/RBAC is a documented seam, post-revenue.
 */
const DEMO_OPERATOR_COOKIE = "tideover_demo_operator";

export function getDemoOperator(): string {
  const c = cookies().get(DEMO_OPERATOR_COOKIE);
  return c?.value || process.env.DEMO_OPERATOR_NAME || "Dylan";
}

export function isDemoMode(): boolean {
  return resolveModeFromRequest() === "demo";
}
