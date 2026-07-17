import assert from "node:assert/strict";
import { test } from "node:test";
import { NextRequest } from "next/server";
import { config, middleware } from "@/middleware";
import { AUTH0_ENV_VARS } from "@/lib/auth-mode";

/**
 * ADR-0020 middleware: the matcher must keep covering every operator surface
 * (a dropped entry here IS an auth bypass), demo hosts must stay untouched,
 * password mode must behave exactly as before Auth0 landed, and a partial
 * Auth0 config must fail CLOSED with a 500 — never fall open or fall back.
 */

/** The pre-ADR-0020 operator surfaces. Removing ANY of these = auth bypass. */
const LEGACY_MATCHER = [
  "/app/:path*",
  "/api/approve-send",
  "/api/draft",
  "/api/export",
  "/api/gift-catalog/:path*",
  "/api/gift-send",
  "/api/escalate",
  "/api/social-signal-feed",
  "/api/orders/:path*",
  "/api/onboarding",
  "/api/analyze",
  "/api/import",
  "/api/updates",
  "/api/setup-status",
  "/api/variants/promote",
];

/** ADR-0020 additions: the SDK's /auth/* routes + the login-gated wizard page,
 *  plus the seats-management API (owner-only /api/team — gated like every
 *  other operator API and stamped with the tenant-scope marker). */
const ADR_0020_ADDITIONS = ["/auth/:path*", "/onboarding", "/api/team"];

/** Evidence-pack JSON export (M2 gap-fill): operator-gated like /api/export,
 *  tenant-scoped through the merchants seam inside assembleEvidencePack. */
const EVIDENCE_ADDITIONS = ["/api/evidence/:path*"];

/** The self-serve settings API (owner-only PATCH /api/settings) — gated and
 *  tenant-scope-stamped exactly like /api/team. */
const SETTINGS_ADDITIONS = ["/api/settings"];

/** The app-subdomain root: "/" runs middleware so the real host can redirect its
 *  bare root into /app (app-only). Demo hosts still pass "/" through untouched. */
const ROOT_ADDITION = ["/"];

/** Billing (ADR-0022): owner-gated checkout + portal. The Stripe WEBHOOK is
 *  deliberately NOT here — it self-authenticates on its signature, like ingest. */
const BILLING_ADDITIONS = ["/api/billing/:path*"];

const ENV_KEYS = ["DEMO_MODE", "REAL_APP_HOST", ...AUTH0_ENV_VARS] as const;

async function withEnv(env: Record<string, string>, fn: () => Promise<void>): Promise<void> {
  const saved = Object.fromEntries(ENV_KEYS.map((k) => [k, process.env[k]]));
  try {
    for (const k of ENV_KEYS) {
      if (env[k] === undefined) delete process.env[k];
      else process.env[k] = env[k];
    }
    await fn();
  } finally {
    for (const k of ENV_KEYS) {
      const v = saved[k];
      if (v === undefined) delete process.env[k];
      else process.env[k] = v;
    }
  }
}

function req(path: string, host: string): NextRequest {
  return new NextRequest(`https://${host}${path}`, { headers: { host } });
}

/** NextResponse.next() marks pass-through with this header. */
function passesThrough(res: Response): boolean {
  return res.headers.get("x-middleware-next") === "1";
}

test("matcher regression: every legacy operator surface is still covered", () => {
  for (const entry of LEGACY_MATCHER) {
    assert.ok(config.matcher.includes(entry), `matcher lost operator surface: ${entry}`);
  }
});

test("matcher: exactly the legacy list + the ADR-0020 + evidence + settings additions, nothing else", () => {
  assert.deepEqual(
    [...config.matcher].sort(),
    [...LEGACY_MATCHER, ...ADR_0020_ADDITIONS, ...EVIDENCE_ADDITIONS, ...SETTINGS_ADDITIONS, ...ROOT_ADDITION, ...BILLING_ADDITIONS].sort(),
  );
});

test("app subdomain is app-only: real host '/' redirects into /app; demo host '/' stays marketing", async () => {
  await withEnv({}, async () => {
    const real = await middleware(req("/", "app.tideover.app"));
    assert.equal(real.status, 307, "real-host root redirects");
    assert.equal(new URL(real.headers.get("location") ?? "").pathname, "/app", "…into /app, which then gates to login");
    const demo = await middleware(req("/", "www.tideover.app"));
    assert.ok(passesThrough(demo), "the www root stays the marketing home");
  });
});

test("demo host: middleware passes everything through untouched", async () => {
  await withEnv({}, async () => {
    for (const path of ["/app/inbox", "/api/draft", "/onboarding", "/auth/login"]) {
      const res = await middleware(req(path, "www.tideover.app"));
      assert.ok(passesThrough(res), `demo host must stay open: ${path}`);
    }
  });
});

test("real host + password mode (no AUTH0 vars): behavior unchanged", async () => {
  await withEnv({}, async () => {
    const host = "app.tideover.app";
    // no session cookie → API 401s, pages redirect to /login?next=…
    const api = await middleware(req("/api/draft", host));
    assert.equal(api.status, 401);
    const page = await middleware(req("/app/inbox", host));
    assert.equal(page.status, 307);
    const loc = new URL(page.headers.get("location") ?? "");
    assert.equal(loc.pathname, "/login");
    assert.equal(loc.searchParams.get("next"), "/app/inbox");
    // the two auth0-only matcher additions pass through in password mode:
    // /onboarding stays public (as before ADR-0020), /auth/* has no route
    assert.ok(passesThrough(await middleware(req("/onboarding", host))));
    assert.ok(passesThrough(await middleware(req("/auth/login", host))));
  });
});

test("FAIL CLOSED: real host + partial Auth0 config → explicit 500, never open, never password", async () => {
  await withEnv({ AUTH0_DOMAIN: "tideover-test.us.auth0.com" }, async () => {
    const host = "app.tideover.app";
    const api = await middleware(req("/api/draft", host));
    assert.equal(api.status, 500);
    assert.deepEqual(await api.json(), { error: "auth misconfigured" });
    const page = await middleware(req("/app/inbox", host));
    assert.equal(page.status, 500);
    assert.ok(!passesThrough(page), "a misconfigured gate must not pass through");
    const loc = page.headers.get("location");
    assert.equal(loc, null, "a misconfigured gate must not redirect to the password login");
  });
});

test("auth0 mode, full config, no session: API 401s; pages redirect to /auth/login with returnTo", async () => {
  await withEnv(
    {
      AUTH0_DOMAIN: "tideover-test.us.auth0.com",
      AUTH0_CLIENT_ID: "client_abc123",
      AUTH0_CLIENT_SECRET: "secret_abc123",
      AUTH0_SECRET: "0123456789abcdef0123456789abcdef0123456789abcdef0123456789abcdef",
      APP_BASE_URL: "https://app.tideover.app",
    },
    async () => {
      const host = "app.tideover.app";
      const api = await middleware(req("/api/draft", host));
      assert.equal(api.status, 401);
      const page = await middleware(req("/app/inbox", host));
      assert.equal(page.status, 307);
      const loc = new URL(page.headers.get("location") ?? "");
      assert.equal(loc.pathname, "/auth/login");
      assert.equal(loc.searchParams.get("returnTo"), "/app/inbox");
    },
  );
});

test("auth0 sign-out: /auth/logout is served by the SDK AND clears the tenant hint + resolved marker", async () => {
  await withEnv(
    {
      AUTH0_DOMAIN: "tideover-test.us.auth0.com",
      AUTH0_CLIENT_ID: "client_abc123",
      AUTH0_CLIENT_SECRET: "secret_abc123",
      AUTH0_SECRET: "0123456789abcdef0123456789abcdef0123456789abcdef0123456789abcdef",
      APP_BASE_URL: "https://app.tideover.app",
    },
    async () => {
      const host = "app.tideover.app";
      const logout = new NextRequest(`https://${host}/auth/logout`, {
        headers: { host, cookie: "tideover_tenant=1; tideover_tenant_res=1" },
      });
      const res = await middleware(logout);
      // The SDK answers the mounted route itself (a redirect out to the IdP
      // logout) — the middleware must not pass through or 401 here.
      assert.ok(!passesThrough(res), "/auth/logout is handled, not passed through");
      const cookies = res.headers.getSetCookie();
      const hint = cookies.find((c) => c.startsWith("tideover_tenant="));
      assert.ok(hint, "sign-out rewrites the tenant hint cookie");
      assert.match(
        hint!,
        /Max-Age=0|Expires=Thu, 01 Jan 1970/i,
        "…as a DELETION — the next login on this browser must re-resolve tenancy",
      );
      const marker = cookies.find((c) => c.startsWith("tideover_tenant_res="));
      assert.ok(marker, "sign-out rewrites the resolved marker cookie");
      assert.match(marker!, /Max-Age=0|Expires=Thu, 01 Jan 1970/i, "…also as a deletion");
    },
  );
});
