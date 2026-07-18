import assert from "node:assert/strict";
import { test } from "node:test";
import { AlreadyOnboardedError, createMerchantFromIntake, type IntakeData } from "@/lib/onboarding";
import { getRepositories } from "@/lib/repositories";
import { jsonRepositories } from "@/lib/repositories/json/repositories";
import { withTenantScope } from "@/lib/repositories/tenant-scope";
import { __setTenantScopeForTests, findMerchantByOwnerSub } from "@/lib/tenant";
import { AUTH0_ENV_VARS } from "@/lib/auth-mode";
import { approveSend, escalateTicket, getQueue, promoteVariant } from "@/lib/service";

/**
 * ADR-0020 tenancy: ownerSub stamping, one-merchant-per-user, and the
 * isolation seam (user A can never read user B's merchant). Runs against the
 * JSON driver; the Mongo driver implements findByOwnerSub / create / update
 * behind the identical Repositories interface (see mongo/repositories.ts),
 * and the scope wrapper under test here sits ABOVE the driver, so it is the
 * same code path in production.
 */

const rand = () => Math.random().toString(36).slice(2);

function intake(over: Partial<IntakeData> = {}): IntakeData {
  return {
    brandName: `Tenant Co ${rand()}`,
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

test("createMerchantFromIntake stamps ownerSub; findByOwnerSub returns it (json driver)", async () => {
  const { merchant } = await createMerchantFromIntake(intake(), { ownerSub: "auth0|test" });
  assert.equal(merchant.ownerSub, "auth0|test");

  // the STORED record carries the stamp, not just the returned object
  const stored = await jsonRepositories.merchants.findById(merchant.id);
  assert.equal(stored?.ownerSub, "auth0|test");

  // repo method (the driver seam) and the lib/tenant helper both resolve it
  const bySub = await jsonRepositories.merchants.findByOwnerSub("auth0|test");
  assert.equal(bySub?.id, merchant.id);
  const viaHelper = await findMerchantByOwnerSub("auth0|test");
  assert.equal(viaHelper?.id, merchant.id);
});

test("one merchant per user: a second create for the same sub throws AlreadyOnboardedError", async () => {
  const sub = `auth0|dup-${rand()}`;
  const { merchant } = await createMerchantFromIntake(intake(), { ownerSub: sub });
  await assert.rejects(
    () => createMerchantFromIntake(intake(), { ownerSub: sub }),
    (err: unknown) => {
      assert.ok(err instanceof AlreadyOnboardedError);
      assert.equal(err.merchantId, merchant.id);
      return true;
    },
  );
});

test("ownerless create (demo sandbox / password mode) stamps null and matches no sub", async () => {
  const { merchant } = await createMerchantFromIntake(intake());
  assert.equal(merchant.ownerSub, null);
  assert.equal(await jsonRepositories.merchants.findByOwnerSub("auth0|nobody"), null);
});

test("ISOLATION: user A cannot read user B's merchant through the scoped repositories", async () => {
  const subA = `auth0|userA-${rand()}`;
  const subB = `auth0|userB-${rand()}`;
  const { merchant: a } = await createMerchantFromIntake(intake(), { ownerSub: subA });
  const { merchant: b } = await createMerchantFromIntake(intake(), { ownerSub: subB });

  const scoped = withTenantScope(jsonRepositories);
  __setTenantScopeForTests({ kind: "scoped", sub: subA });
  try {
    // A sees A…
    assert.equal((await scoped.merchants.findById(a.id))?.id, a.id);
    // …and NEVER B — by id, slug, inbox token, sub, or list
    assert.equal(await scoped.merchants.findById(b.id), null);
    assert.equal(await scoped.merchants.findBySlug(b.slug), null);
    assert.equal(await scoped.merchants.findByInboxToken(b.inboxToken), null);
    assert.equal(await scoped.merchants.findByOwnerSub(subB), null);
    const listed = await scoped.merchants.list();
    assert.ok(listed.length >= 1);
    assert.ok(listed.every((m) => m.ownerSub === subA), "list() leaks a foreign or seed merchant");
    assert.ok(listed.some((m) => m.id === a.id));
    // writes: A cannot touch B, and cannot re-assign ownership of A
    await assert.rejects(() => scoped.merchants.update(b.id, { name: "hijacked" }));
    const renamed = await scoped.merchants.update(a.id, { name: "Renamed", ownerSub: subB });
    assert.equal(renamed.ownerSub, subA, "ownerSub must not be patchable through the scoped surface");
  } finally {
    __setTenantScopeForTests(null);
  }

  // B's merchant is untouched
  assert.equal((await jsonRepositories.merchants.findById(b.id))?.name, b.name);
});

test("ISOLATION: a MEMBER of merchant A is scoped in for A but can never read merchant B", async () => {
  const ownerA = `auth0|ownerA-${rand()}`;
  const ownerB = `auth0|ownerB-${rand()}`;
  const memberA = `auth0|memberA-${rand()}`;
  const { merchant: a } = await createMerchantFromIntake(intake(), { ownerSub: ownerA });
  const { merchant: b } = await createMerchantFromIntake(intake(), { ownerSub: ownerB });
  await jsonRepositories.merchants.update(a.id, { memberSubs: [memberA] });

  const scoped = withTenantScope(jsonRepositories);
  __setTenantScopeForTests({ kind: "scoped", sub: memberA });
  try {
    // scoped IN for A (seats)…
    assert.equal((await scoped.merchants.findById(a.id))?.id, a.id);
    assert.equal((await scoped.merchants.findByMemberOrOwnerSub(memberA))?.id, a.id);
    // …and NEVER B, on any read
    assert.equal(await scoped.merchants.findById(b.id), null);
    assert.equal(await scoped.merchants.findBySlug(b.slug), null);
    assert.equal(await scoped.merchants.findByInboxToken(b.inboxToken), null);
    const listed = await scoped.merchants.list();
    assert.ok(listed.some((m) => m.id === a.id), "member sees their own workspace");
    assert.ok(!listed.some((m) => m.id === b.id), "member never sees a foreign workspace");
    // writes: a member cannot touch B, and cannot rewrite A's seat lists
    await assert.rejects(() => scoped.merchants.update(b.id, { name: "hijacked" }));
    const patched = await scoped.merchants.update(a.id, {
      name: "Member Renamed",
      memberSubs: [memberA, "auth0|smuggled"],
      pendingInvites: [{ email: "smuggled@x.co", invitedAt: new Date().toISOString() }],
    });
    assert.equal(patched.name, "Member Renamed", "a member may edit workspace settings");
    assert.deepEqual(patched.memberSubs, [memberA], "seat lists are owner-only writes");
    assert.deepEqual(patched.pendingInvites ?? [], [], "invites are owner-only writes");
  } finally {
    __setTenantScopeForTests(null);
  }
});

test("DENIED scope (operator marker without a session) reads nothing and writes nothing", async () => {
  const sub = `auth0|denied-${rand()}`;
  const { merchant } = await createMerchantFromIntake(intake(), { ownerSub: sub });
  const scoped = withTenantScope(jsonRepositories);
  __setTenantScopeForTests({ kind: "denied" });
  try {
    assert.equal(await scoped.merchants.findById(merchant.id), null);
    assert.deepEqual(await scoped.merchants.list(), []);
    await assert.rejects(() => scoped.merchants.update(merchant.id, { name: "x" }));
  } finally {
    __setTenantScopeForTests(null);
  }
});

test("demo/password stays untouched: without AUTH0_* vars getRepositories() applies NO tenant scope", () => {
  for (const k of AUTH0_ENV_VARS) assert.equal(process.env[k], undefined, `${k} leaked into test env`);
  // The merchants repository is the tenant seam. In password mode it must be the
  // driver's own object, unwrapped — that is what "no scoping" means. (`orders`
  // IS wrapped, unconditionally and in every mode, because it resolves the live
  // production stage on read; that is not a tenancy concern.)
  const repos = getRepositories();
  assert.equal(repos.merchants, jsonRepositories.merchants, "password mode must not scope the merchants seam");
  assert.equal(repos.tickets, jsonRepositories.tickets);
  assert.equal(repos.customers, jsonRepositories.customers);
});

// ─── service-layer isolation: the tickets repo is NOT tenant-scoped, so every
// service mutation must dead-end at the SCOPED merchants seam. These tests run
// the real service fns as a scoped foreign session (a sub that owns a
// DIFFERENT merchant) against a victim ticket whose merchant never matches.
const SAFE_REPLY =
  "Thanks for your patience — your order is on schedule and moving through production. I'll flag the moment it ships.";
const LUMEN = "mch_lumen0001"; // seeded demo merchant (no ownerSub → foreign to any scoped sub)

/** Run `fn` as a scoped request for `sub`, with auth0 mode active so
 *  getRepositories() wraps the driver — the exact production seam. Restores
 *  env + scope afterward so later tests stay in password/unscoped mode. */
async function asScopedForeign<T>(sub: string, fn: () => Promise<T>): Promise<T> {
  const saved = Object.fromEntries(AUTH0_ENV_VARS.map((k) => [k, process.env[k]]));
  for (const k of AUTH0_ENV_VARS) process.env[k] = "test-value";
  __setTenantScopeForTests({ kind: "scoped", sub });
  try {
    return await fn();
  } finally {
    __setTenantScopeForTests(null);
    for (const k of AUTH0_ENV_VARS) {
      const v = saved[k];
      if (v === undefined) delete process.env[k];
      else process.env[k] = v;
    }
  }
}

async function attackerSub(): Promise<string> {
  const sub = `auth0|attacker-${rand()}`;
  await createMerchantFromIntake(intake(), { ownerSub: sub });
  return sub;
}

test("ISOLATION: foreign approveSend is denied on BOTH paths — no sent-text read, no mutation", async () => {
  const attacker = await attackerSub();
  const queue = await getQueue(LUMEN);
  const victim = queue.find((r) => r.ticket.status !== "sent")?.ticket;
  assert.ok(victim, "seeded merchant has an unsent ticket");
  const replyCount = async () =>
    (await jsonRepositories.outcomeEvents.listByMerchant(LUMEN)).filter(
      (e) => e.kind === "reply_sent" && e.ticketId === victim!.id,
    ).length;
  const eventsBefore = await replyCount();

  // (a) unsent path: the write is denied and NOTHING about the ticket changes.
  const denied = await asScopedForeign(attacker, () => approveSend(victim!.id, SAFE_REPLY));
  assert.deepEqual(denied, { error: "ticket not found" });
  const after = await jsonRepositories.tickets.findById(victim!.id);
  assert.equal(after!.status, victim!.status, "foreign approve must not change status");
  assert.equal(after!.sent, undefined, "foreign approve must not stamp a sent record");
  assert.equal(await replyCount(), eventsBefore, "foreign approve must not record a reply_sent event");

  // (b) sent path: deliver legitimately (unscoped), then a foreign re-approve
  // must NOT get the stored reply text back — the read itself is denied.
  const sent = await approveSend(victim!.id, SAFE_REPLY);
  assert.ok("ticket" in sent, "legitimate unscoped send delivers");
  const deniedRead = await asScopedForeign(attacker, () => approveSend(victim!.id, SAFE_REPLY));
  assert.deepEqual(deniedRead, { error: "ticket not found" });
});

test("ISOLATION: foreign escalateTicket is denied — tags unmutated", async () => {
  const attacker = await attackerSub();
  const queue = await getQueue(LUMEN);
  const victim = queue[0]?.ticket;
  assert.ok(victim, "seeded merchant has a queue ticket");
  const tagsBefore = [...victim!.tags];

  const denied = await asScopedForeign(attacker, () => escalateTicket(victim!.id, "Mallory"));
  assert.deepEqual(denied, { error: "ticket not found" });
  const after = await jsonRepositories.tickets.findById(victim!.id);
  assert.deepEqual(after!.tags, tagsBefore, "foreign escalate must not touch tags");
});

test("ISOLATION: foreign promoteVariant is denied — no variant created", async () => {
  const attacker = await attackerSub();
  const queue = await getQueue(LUMEN);
  const victim = queue[0]?.ticket;
  assert.ok(victim, "seeded merchant has a queue ticket");
  const before = (await jsonRepositories.scriptVariants.listByMerchant(LUMEN)).length;

  const denied = await asScopedForeign(attacker, () => promoteVariant(victim!.id, SAFE_REPLY));
  assert.deepEqual(denied, { error: "ticket not found" });
  const after = (await jsonRepositories.scriptVariants.listByMerchant(LUMEN)).length;
  assert.equal(after, before, "foreign promote must not create a variant");
});

test("with AUTH0_* set, scripts/tests outside a request scope still pass through unscoped", async () => {
  const saved = Object.fromEntries(AUTH0_ENV_VARS.map((k) => [k, process.env[k]]));
  for (const k of AUTH0_ENV_VARS) process.env[k] = "test-value";
  try {
    const sub = `auth0|script-${rand()}`;
    const { merchant } = await createMerchantFromIntake(intake(), { ownerSub: sub });
    const repos = getRepositories();
    assert.notEqual(repos, jsonRepositories, "auth0 mode wraps the repositories");
    // outside a request scope there is no operator marker → unscoped fallback
    assert.equal((await repos.merchants.findById(merchant.id))?.id, merchant.id);
    const all = await repos.merchants.list();
    assert.ok(all.some((m) => m.ownerSub === undefined || m.ownerSub === null), "seed merchants stay visible to scripts");
  } finally {
    for (const k of AUTH0_ENV_VARS) {
      const v = saved[k];
      if (v === undefined) delete process.env[k];
      else process.env[k] = v;
    }
  }
});
