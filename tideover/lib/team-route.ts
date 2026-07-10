import { z } from "zod";
import { getRepositories } from "@/lib/repositories";
import { getTenantSession } from "@/lib/tenant";
import {
  TEAM_SEAT_CAP,
  memberSubsOf,
  normalizeEmail,
  pendingInvitesOf,
  seatCountOf,
} from "@/lib/team";
import type { Merchant } from "@/lib/types";

/**
 * Injectable core for POST/DELETE /api/team — owner-only seat management
 * (invite by email, remove invite, remove member). Lives in lib/ (not the
 * route file) so the handlers are unit-testable without the Next runtime, and
 * uses the Web-standard Response for the same reason (same discipline as
 * lib/ingest-route.ts / lib/inbound-route.ts).
 *
 * Authorization is two-layered:
 *   1. the caller's merchant resolves from THEIR session sub only
 *      (findByMemberOrOwnerSub — no merchant id is accepted from the client,
 *      so a foreign workspace can't even be named);
 *   2. mutations require ownerSub === session sub — members get 403. The
 *      tenant seam additionally strips seat-list patches from non-owners.
 *
 * Invite acceptance itself happens at the invitee's next login
 * (lib/team.ts acceptPendingInvite, via /api/auth/tenant).
 */

function json(status: number, body: unknown): Response {
  return Response.json(body, { status });
}

function teamView(merchant: Merchant) {
  return {
    ownerSub: merchant.ownerSub ?? null,
    members: memberSubsOf(merchant),
    invites: pendingInvitesOf(merchant),
    seatCap: TEAM_SEAT_CAP,
  };
}

type OwnerContext = { merchant: Merchant; ownEmail: string | null };

/** Session → own merchant → owner check. Returns a ready error Response on any miss. */
async function resolveOwner(): Promise<OwnerContext | Response> {
  const session = await getTenantSession();
  if (!session) return json(401, { error: "sign in required to manage the team" });
  const merchant = await getRepositories().merchants.findByMemberOrOwnerSub(session.sub);
  if (!merchant) return json(404, { error: "no workspace for this account" });
  if (merchant.ownerSub !== session.sub) {
    return json(403, { error: "only the workspace owner can manage seats" });
  }
  return { merchant, ownEmail: session.email ? normalizeEmail(session.email) : null };
}

// Pragmatic shape check (local@domain.tld) rather than z.string().email(),
// whose regex rejects real-but-unusual addresses (e.g. single-letter TLDs).
// The invite is claimed only by a VERIFIED login for this exact address, so
// over-validating here buys nothing and can lock out a legitimate teammate.
const EMAIL_SHAPE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const InviteBody = z.object({ email: z.string().trim().regex(EMAIL_SHAPE) });

/** POST /api/team — add a pending invite by email (owner only). */
export async function handleTeamPOST(req: Request): Promise<Response> {
  const ctx = await resolveOwner();
  if (ctx instanceof Response) return ctx;
  const parsed = InviteBody.safeParse(await req.json().catch(() => null));
  if (!parsed.success) return json(400, { error: "enter a valid email address" });

  const email = normalizeEmail(parsed.data.email);
  const { merchant, ownEmail } = ctx;
  if (ownEmail && email === ownEmail) {
    return json(400, { error: "that address is your own sign-in email — the owner already has a seat" });
  }
  if (pendingInvitesOf(merchant).some((i) => normalizeEmail(i.email) === email)) {
    return json(400, { error: "that address already has a pending invite" });
  }
  if (seatCountOf(merchant) >= TEAM_SEAT_CAP) {
    return json(400, {
      error: `seat limit reached — ${TEAM_SEAT_CAP} seats is the Scale plan maximum. Remove a member or pending invite first.`,
    });
  }

  const updated = await getRepositories().merchants.update(merchant.id, {
    pendingInvites: [...pendingInvitesOf(merchant), { email, invitedAt: new Date().toISOString() }],
  });
  return json(200, teamView(updated));
}

const RemoveBody = z.union([
  z.object({ email: z.string().trim().min(1), sub: z.undefined().optional() }),
  z.object({ sub: z.string().trim().min(1), email: z.undefined().optional() }),
]);

/** DELETE /api/team — remove a pending invite (by email) or a member (by sub). Owner only. */
export async function handleTeamDELETE(req: Request): Promise<Response> {
  const ctx = await resolveOwner();
  if (ctx instanceof Response) return ctx;
  const parsed = RemoveBody.safeParse(await req.json().catch(() => null));
  if (!parsed.success) {
    return json(400, { error: "pass exactly one of email (invite) or sub (member)" });
  }

  const { merchant } = ctx;
  const body = parsed.data;
  if ("email" in body && typeof body.email === "string") {
    const email = normalizeEmail(body.email);
    const invites = pendingInvitesOf(merchant);
    const remaining = invites.filter((i) => normalizeEmail(i.email) !== email);
    if (remaining.length === invites.length) return json(404, { error: "invite not found" });
    const updated = await getRepositories().merchants.update(merchant.id, {
      pendingInvites: remaining,
    });
    return json(200, teamView(updated));
  }

  const sub = (body as { sub: string }).sub;
  const members = memberSubsOf(merchant);
  if (!members.includes(sub)) return json(404, { error: "member not found" });
  const updated = await getRepositories().merchants.update(merchant.id, {
    memberSubs: members.filter((m) => m !== sub),
  });
  return json(200, teamView(updated));
}
