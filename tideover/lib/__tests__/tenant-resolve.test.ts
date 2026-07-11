import assert from "node:assert/strict";
import { test } from "node:test";
import { GET } from "@/app/api/auth/tenant/route";
import { createMerchantFromIntake, type IntakeData } from "@/lib/onboarding";
import {
  TENANT_HINT_COOKIE,
  TENANT_RESOLVED_COOKIE,
  shouldResolveTenant,
} from "@/lib/auth-mode";
import { __setTenantSessionResolverForTests, type TenantSession } from "@/lib/tenant";

/**
 * Stale-hint recovery (GET /api/auth/tenant + the middleware decision).
 *
 * The trap this guards against: the tenant hint cookie lives 30 days, but a
 * seat can be removed under it — the browser then holds hint=1 for a login
 * that resolves NO merchant, and every /app surface dead-ends. The fix is
 * two-sided and both sides are pinned here:
 *   1. the resolver's no-workspace path CLEARS the hint (and stamps the
 *      short-lived resolved marker) on its /onboarding redirect, and
 *   2. the middleware re-resolves document navigations once the marker lapses
 *      (shouldResolveTenant), so the stale-hint login actually reaches the
 *      resolver instead of being pinned behind the hint short-circuit.
 */

const rand = () => Math.random().toString(36).slice(2);

function intake(over: Partial<IntakeData> = {}): IntakeData {
  return {
    brandName: `Resolve Co ${rand()}`,
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

const ENV_KEYS = ["DEMO_MODE", "AUTH0_DOMAIN"] as const;

/** real+auth0 resolution outside a request scope: DEMO_MODE=false forces real
 *  mode, any AUTH0_* var flips authMode() to "auth0" (both pure env reads). */
async function inRealAuth0Mode(fn: () => Promise<void>): Promise<void> {
  const saved = Object.fromEntries(ENV_KEYS.map((k) => [k, process.env[k]]));
  process.env.DEMO_MODE = "false";
  process.env.AUTH0_DOMAIN = "tideover-test.us.auth0.com";
  try {
    await fn();
  } finally {
    for (const k of ENV_KEYS) {
      const v = saved[k];
      if (v === undefined) delete process.env[k];
      else process.env[k] = v;
    }
    __setTenantSessionResolverForTests(null);
  }
}

function resolveReq(next = "/app/inbox"): Request {
  return new Request(
    `https://app.tideover.app/api/auth/tenant?next=${encodeURIComponent(next)}`,
  );
}

function setCookies(res: Response): string[] {
  return res.headers.getSetCookie();
}

test("stale hint, no workspace: resolver redirects to /onboarding AND clears the hint cookie", async () => {
  await inRealAuth0Mode(async () => {
    // A login that owns nothing and holds no invite — exactly the state of a
    // member whose seat was removed while their browser kept the 30-day hint.
    asSession({ sub: `auth0|removed-${rand()}`, email: `gone-${rand()}@example.com`, emailVerified: true });

    const res = await GET(resolveReq("/app/inbox"));
    assert.equal(res.status, 307);
    assert.equal(new URL(res.headers.get("location")!).pathname, "/onboarding");

    const cookies = setCookies(res);
    const hint = cookies.find((c) => c.startsWith(`${TENANT_HINT_COOKIE}=`));
    assert.ok(hint, "the stale hint cookie is rewritten");
    assert.match(hint!, /Max-Age=0|Expires=Thu, 01 Jan 1970/i, "…as a DELETION, ending the trap");
    const marker = cookies.find((c) => c.startsWith(`${TENANT_RESOLVED_COOKIE}=1`));
    assert.ok(marker, "the resolved marker is stamped so document navs don't re-loop");
  });
});

test("valid tenant: resolver continues to `next` and stamps hint + resolved marker", async () => {
  await inRealAuth0Mode(async () => {
    const ownerSub = `auth0|owner-${rand()}`;
    await createMerchantFromIntake(intake(), { ownerSub });
    asSession({ sub: ownerSub, email: `o-${rand()}@example.com`, emailVerified: true });

    const res = await GET(resolveReq("/app/inbox"));
    assert.equal(res.status, 307);
    assert.equal(new URL(res.headers.get("location")!).pathname, "/app/inbox");

    const cookies = setCookies(res);
    assert.ok(
      cookies.some((c) => c.startsWith(`${TENANT_HINT_COOKIE}=1`)),
      "hint cookie set",
    );
    assert.ok(
      cookies.some((c) => c.startsWith(`${TENANT_RESOLVED_COOKIE}=1`)),
      "resolved marker set",
    );
  });
});

test("open-redirect guard still holds: absolute/scheme-relative `next` falls back to /app", async () => {
  await inRealAuth0Mode(async () => {
    const ownerSub = `auth0|owner-${rand()}`;
    await createMerchantFromIntake(intake(), { ownerSub });
    asSession({ sub: ownerSub, email: `o-${rand()}@example.com`, emailVerified: true });

    const res = await GET(resolveReq("//evil.example.com/phish"));
    assert.equal(new URL(res.headers.get("location")!).pathname, "/app");
  });
});

test("middleware decision (shouldResolveTenant): stale hints re-resolve on document navs, browsing stays redirect-free", () => {
  // No hint → always resolve (unchanged first-visit routing).
  assert.equal(shouldResolveTenant({ hasHint: false, recentlyResolved: false, isDocumentNav: false }), true);
  assert.equal(shouldResolveTenant({ hasHint: false, recentlyResolved: true, isDocumentNav: true }), true);
  // Hint present: a document navigation with a LAPSED marker re-resolves —
  // this is the path that frees a removed member from the 30-day trap.
  assert.equal(shouldResolveTenant({ hasHint: true, recentlyResolved: false, isDocumentNav: true }), true);
  // Freshly resolved document nav passes straight through (no redirect loop).
  assert.equal(shouldResolveTenant({ hasHint: true, recentlyResolved: true, isDocumentNav: true }), false);
  // Client-side/RSC requests never bounce while the hint is present.
  assert.equal(shouldResolveTenant({ hasHint: true, recentlyResolved: false, isDocumentNav: false }), false);
});
