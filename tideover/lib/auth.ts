import { cookies } from "next/headers";

/**
 * DEMO auth only. The product surfaces (/app/*) are gated by a single demo
 * operator cookie set on first visit — enough to demonstrate the product without
 * a login wall. PRODUCTION must replace this with real auth (NextAuth/Clerk) +
 * per-merchant RBAC (an operator may only see merchants they're assigned to).
 * Documented as a flagged follow-up in TIDEOVER-PLAN.md.
 */
const COOKIE = "tideover_demo_operator";

export function getDemoOperator(): string {
  const c = cookies().get(COOKIE);
  return c?.value || process.env.DEMO_OPERATOR_NAME || "Chaga";
}

export function isDemoMode(): boolean {
  // Always true in this seeded build; kept as a seam so production can flip it.
  return true;
}
