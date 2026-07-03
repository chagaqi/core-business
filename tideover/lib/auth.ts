import { cookies } from "next/headers";

/**
 * Mode + operator identity (ADR-0004). DEMO_MODE unset/true keeps every surface
 * open on seeded data; DEMO_MODE=false makes middleware.ts require the signed
 * session cookie (lib/session.ts) minted by /login. Single shared password —
 * per-operator identity/RBAC is a documented seam, post-revenue.
 */
const DEMO_OPERATOR_COOKIE = "tideover_demo_operator";

export function getDemoOperator(): string {
  const c = cookies().get(DEMO_OPERATOR_COOKIE);
  return c?.value || process.env.DEMO_OPERATOR_NAME || "Dylan";
}

export function isDemoMode(): boolean {
  return process.env.DEMO_MODE !== "false";
}
