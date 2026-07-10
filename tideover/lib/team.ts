import { repositoriesForMode } from "@/lib/repositories";
import { resolveDatastoreModeFromRequest } from "@/lib/request-mode";
import type { TenantSession } from "@/lib/tenant";
import type { Merchant, TeamInvite } from "@/lib/types";

/**
 * Seats (teams) — the capability the pricing page sells as 1/3/10 seats.
 *
 * Model: Merchant.memberSubs (attached teammates, by Auth0 sub) +
 * Merchant.pendingInvites (outstanding invites, by email). The owner manages
 * both through /api/team; a pending invite is CLAIMED at login by
 * acceptPendingInvite below — no outbound email is involved, the owner shares
 * the sign-in link themselves.
 *
 * Hard cap: TEAM_SEAT_CAP total members + invites (the Scale tier's 10-seat
 * max). Per-plan seat-count enforcement (1 vs 3 vs 10) is deliberately
 * deferred to billing.
 */

export const TEAM_SEAT_CAP = 10;

/** Normalized email identity: trim + lowercase, the one comparison rule. */
export const normalizeEmail = (email: string): string => email.trim().toLowerCase();

export const memberSubsOf = (m: Merchant): string[] => m.memberSubs ?? [];
export const pendingInvitesOf = (m: Merchant): TeamInvite[] => m.pendingInvites ?? [];

/** Members + outstanding invites — what the cap counts. */
export const seatCountOf = (m: Merchant): number =>
  memberSubsOf(m).length + pendingInvitesOf(m).length;

export type AcceptInviteResult =
  | { merchant: Merchant }
  | { error: string }
  | null; // no claimable invite (or unverified email) — caller proceeds to onboarding

/**
 * Claim a pending invite for the just-logged-in user (called from
 * GET /api/auth/tenant when the session resolves NO merchant). On a match the
 * user's sub moves into memberSubs and the invite is removed.
 *
 * Fails closed on identity:
 *   - only a session whose email_verified claim is EXACTLY true may claim an
 *     invite (an unverified address could squat a teammate's seat);
 *   - one merchant per user: a sub that already owns or belongs to a merchant
 *     is rejected with a clear error, never re-attached.
 *
 * Runs against the UNSCOPED base driver deliberately: the claimer has no
 * merchant yet, so a tenant-scoped list() would be empty by definition and the
 * invite could never be found. The write is tightly constrained — it only ever
 * adds the session's OWN sub to the one merchant holding an exact
 * verified-email invite match.
 */
export async function acceptPendingInvite(session: TenantSession): Promise<AcceptInviteResult> {
  if (!session.email || session.emailVerified !== true) return null;
  const email = normalizeEmail(session.email);
  const repos = repositoriesForMode(resolveDatastoreModeFromRequest());

  const existing = await repos.merchants.findByMemberOrOwnerSub(session.sub);
  if (existing) {
    return { error: "this account already belongs to a workspace — one workspace per user" };
  }

  const all = await repos.merchants.list();
  const target = all.find((m) => pendingInvitesOf(m).some((i) => normalizeEmail(i.email) === email));
  if (!target) return null;

  const merchant = await repos.merchants.update(target.id, {
    memberSubs: [...memberSubsOf(target), session.sub],
    pendingInvites: pendingInvitesOf(target).filter((i) => normalizeEmail(i.email) !== email),
  });
  return { merchant };
}
