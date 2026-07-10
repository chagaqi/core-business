import assert from "node:assert/strict";
import { test } from "node:test";
import { createMerchantFromIntake, type IntakeData } from "@/lib/onboarding";
import { jsonRepositories } from "@/lib/repositories/json/repositories";
import { withTenantScope } from "@/lib/repositories/tenant-scope";
import {
  __setTenantScopeForTests,
  __setTenantSessionResolverForTests,
  type TenantSession,
} from "@/lib/tenant";
import { acceptPendingInvite, TEAM_SEAT_CAP } from "@/lib/team";
import { handleTeamDELETE, handleTeamPOST } from "@/lib/team-route";

/**
 * Seats capability: owner-managed invites (/api/team), login-time invite
 * claiming (lib/team.ts — verified email only), member tenancy through the
 * scoped seam, and the hard seat cap. Runs on the JSON driver; the Mongo
 * driver implements findByMemberOrOwnerSub behind the identical interface and
 * the scope wrapper under test sits ABOVE the driver.
 */

const rand = () => Math.random().toString(36).slice(2);

function intake(over: Partial<IntakeData> = {}): IntakeData {
  return {
    brandName: `Team Co ${rand()}`,
    voice: "warm and direct",
    tone: ["Warm"],
    banned: [],
    signoff: "— the team",
    helpdesk: "mock",
    preorderApp: "",
    windowMinDays: 90,
    windowMaxDays: 120,
    stages: [],
    ...over,
  };
}

function asSession(session: TenantSession | null): void {
  __setTenantSessionResolverForTests(session ? async () => session : async () => null);
}

function resetSession(): void {
  __setTenantSessionResolverForTests(null);
}

function post(body: unknown): Request {
  return new Request("http://test.local/api/team", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify(body),
  });
}

function del(body: unknown): Request {
  return new Request("http://test.local/api/team", {
    method: "DELETE",
    headers: { "content-type": "application/json" },
    body: JSON.stringify(body),
  });
}

test("invite → verified-email login attaches the member, removes the invite, and scopes them IN", async () => {
  const ownerSub = `auth0|owner-${rand()}`;
  const memberSub = `auth0|member-${rand()}`;
  const inviteEmail = `teammate-${rand()}@example.com`;
  const { merchant } = await createMerchantFromIntake(intake(), { ownerSub });

  try {
    // Owner adds the invite through the real handler.
    asSession({ sub: ownerSub, email: `owner-${rand()}@example.com`, emailVerified: true });
    const res = await handleTeamPOST(post({ email: inviteEmail.toUpperCase() }));
    assert.equal(res.status, 200);
    const stored = await jsonRepositories.merchants.findById(merchant.id);
    assert.deepEqual(
      stored!.pendingInvites?.map((i) => i.email),
      [inviteEmail.toLowerCase()],
      "invite is stored normalized",
    );

    // The invitee's first login with a VERIFIED matching email claims it.
    const claimed = await acceptPendingInvite({
      sub: memberSub,
      email: inviteEmail.toUpperCase(), // case-insensitive identity
      emailVerified: true,
    });
    assert.ok(claimed && "merchant" in claimed, "verified invitee attaches");
    assert.deepEqual(claimed.merchant.memberSubs, [memberSub]);
    assert.deepEqual(claimed.merchant.pendingInvites, [], "claimed invite is removed");

    // The member is scoped IN: the tenant seam resolves the workspace for them.
    const scoped = withTenantScope(jsonRepositories);
    __setTenantScopeForTests({ kind: "scoped", sub: memberSub });
    assert.equal((await scoped.merchants.findById(merchant.id))?.id, merchant.id);
    assert.equal((await scoped.merchants.findByMemberOrOwnerSub(memberSub))?.id, merchant.id);
    const listed = await scoped.merchants.list();
    assert.ok(listed.some((m) => m.id === merchant.id), "member sees the workspace in list()");
  } finally {
    __setTenantScopeForTests(null);
    resetSession();
  }
});

test("an UNVERIFIED email never claims an invite", async () => {
  const ownerSub = `auth0|owner-${rand()}`;
  const squatterSub = `auth0|squatter-${rand()}`;
  const inviteEmail = `invited-${rand()}@example.com`;
  const { merchant } = await createMerchantFromIntake(intake(), { ownerSub });
  await jsonRepositories.merchants.update(merchant.id, {
    pendingInvites: [{ email: inviteEmail, invitedAt: new Date().toISOString() }],
  });

  const claimed = await acceptPendingInvite({
    sub: squatterSub,
    email: inviteEmail,
    emailVerified: false,
  });
  assert.equal(claimed, null, "unverified email is not an identity — nothing attaches");
  const stored = await jsonRepositories.merchants.findById(merchant.id);
  assert.deepEqual(stored!.memberSubs, [], "no member attached");
  assert.equal(stored!.pendingInvites?.length, 1, "invite stays pending");
});

test("one merchant per user: an owner or member cannot accept another workspace's invite", async () => {
  const ownerA = `auth0|ownerA-${rand()}`;
  const ownerB = `auth0|ownerB-${rand()}`;
  const email = `poached-${rand()}@example.com`;
  await createMerchantFromIntake(intake(), { ownerSub: ownerA });
  const { merchant: b } = await createMerchantFromIntake(intake(), { ownerSub: ownerB });
  await jsonRepositories.merchants.update(b.id, {
    pendingInvites: [{ email, invitedAt: new Date().toISOString() }],
  });

  const claimed = await acceptPendingInvite({ sub: ownerA, email, emailVerified: true });
  assert.ok(claimed && "error" in claimed, "rejected with a clear error");
  const stored = await jsonRepositories.merchants.findById(b.id);
  assert.deepEqual(stored!.memberSubs, [], "no cross-workspace attach");
  assert.equal(stored!.pendingInvites?.length, 1, "invite not consumed");
});

test("/api/team is owner-only: members get 403, no session 401, no workspace 404", async () => {
  const ownerSub = `auth0|owner-${rand()}`;
  const memberSub = `auth0|member-${rand()}`;
  const { merchant } = await createMerchantFromIntake(intake(), { ownerSub });
  await jsonRepositories.merchants.update(merchant.id, { memberSubs: [memberSub] });

  try {
    // A MEMBER may not manage seats.
    asSession({ sub: memberSub, email: `m-${rand()}@example.com`, emailVerified: true });
    const asMember = await handleTeamPOST(post({ email: `x-${rand()}@example.com` }));
    assert.equal(asMember.status, 403);
    const asMemberDelete = await handleTeamDELETE(del({ sub: memberSub }));
    assert.equal(asMemberDelete.status, 403);

    // No session at all → 401.
    asSession(null);
    assert.equal((await handleTeamPOST(post({ email: "a@b.co" }))).status, 401);

    // A logged-in user with no workspace → 404.
    asSession({ sub: `auth0|nobody-${rand()}`, email: "n@b.co", emailVerified: true });
    assert.equal((await handleTeamPOST(post({ email: "a@b.co" }))).status, 404);

    // Nothing mutated by any of the above.
    const stored = await jsonRepositories.merchants.findById(merchant.id);
    assert.deepEqual(stored!.memberSubs, [memberSub]);
    assert.deepEqual(stored!.pendingInvites ?? [], []);
  } finally {
    resetSession();
  }
});

test("owner can remove an invite and a member; unknown targets 404", async () => {
  const ownerSub = `auth0|owner-${rand()}`;
  const memberSub = `auth0|member-${rand()}`;
  const inviteEmail = `pending-${rand()}@example.com`;
  const { merchant } = await createMerchantFromIntake(intake(), { ownerSub });
  await jsonRepositories.merchants.update(merchant.id, {
    memberSubs: [memberSub],
    pendingInvites: [{ email: inviteEmail, invitedAt: new Date().toISOString() }],
  });

  try {
    asSession({ sub: ownerSub, email: `o-${rand()}@example.com`, emailVerified: true });
    const inviteGone = await handleTeamDELETE(del({ email: inviteEmail }));
    assert.equal(inviteGone.status, 200);
    const memberGone = await handleTeamDELETE(del({ sub: memberSub }));
    assert.equal(memberGone.status, 200);
    const stored = await jsonRepositories.merchants.findById(merchant.id);
    assert.deepEqual(stored!.memberSubs, []);
    assert.deepEqual(stored!.pendingInvites, []);

    assert.equal((await handleTeamDELETE(del({ email: inviteEmail }))).status, 404);
    assert.equal((await handleTeamDELETE(del({ sub: memberSub }))).status, 404);
    assert.equal((await handleTeamDELETE(del({}))).status, 400, "email XOR sub is required");
  } finally {
    resetSession();
  }
});

test(`seat cap: members + invites stop at ${TEAM_SEAT_CAP}`, async () => {
  const ownerSub = `auth0|owner-${rand()}`;
  const { merchant } = await createMerchantFromIntake(intake(), { ownerSub });
  // 3 members + 6 invites = 9 seats used → one seat left.
  await jsonRepositories.merchants.update(merchant.id, {
    memberSubs: Array.from({ length: 3 }, (_, i) => `auth0|m${i}-${rand()}`),
    pendingInvites: Array.from({ length: 6 }, (_, i) => ({
      email: `seat${i}-${rand()}@example.com`,
      invitedAt: new Date().toISOString(),
    })),
  });

  try {
    asSession({ sub: ownerSub, email: `o-${rand()}@example.com`, emailVerified: true });
    const tenth = await handleTeamPOST(post({ email: `tenth-${rand()}@example.com` }));
    assert.equal(tenth.status, 200, "the 10th seat is allowed");
    const eleventh = await handleTeamPOST(post({ email: `eleventh-${rand()}@example.com` }));
    assert.equal(eleventh.status, 400, "the 11th seat is rejected");
    const body = (await eleventh.json()) as { error: string };
    assert.match(body.error, /seat limit/i, "cap rejection says why");
    const stored = await jsonRepositories.merchants.findById(merchant.id);
    assert.equal(
      (stored!.memberSubs?.length ?? 0) + (stored!.pendingInvites?.length ?? 0),
      TEAM_SEAT_CAP,
      "store holds exactly the cap",
    );
  } finally {
    resetSession();
  }
});

test("invite hygiene: bad email 400, duplicate invite 400, owner's own email 400", async () => {
  const ownerSub = `auth0|owner-${rand()}`;
  const ownerEmail = `owner-${rand()}@example.com`;
  const inviteEmail = `dupe-${rand()}@example.com`;
  await createMerchantFromIntake(intake(), { ownerSub });

  try {
    asSession({ sub: ownerSub, email: ownerEmail, emailVerified: true });
    assert.equal((await handleTeamPOST(post({ email: "not-an-email" }))).status, 400);
    assert.equal((await handleTeamPOST(post({ email: ownerEmail }))).status, 400);
    assert.equal((await handleTeamPOST(post({ email: inviteEmail }))).status, 200);
    assert.equal((await handleTeamPOST(post({ email: inviteEmail.toUpperCase() }))).status, 400);
  } finally {
    resetSession();
  }
});
