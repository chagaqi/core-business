import assert from "node:assert/strict";
import { test } from "node:test";
import { authMode, auth0ConfigMissing, AUTH0_ENV_VARS } from "@/lib/auth-mode";

/**
 * ADR-0020 auth-mode selection. The rule under test: NO Auth0 vars = the
 * legacy password mode, ANY Auth0 var = auth0 mode — so a PARTIAL config is
 * auth0-with-missing-vars (the middleware's fail-closed 500), never a silent
 * downgrade to the shared password.
 */

const FULL: Record<string, string> = {
  AUTH0_DOMAIN: "tideover-test.us.auth0.com",
  AUTH0_CLIENT_ID: "client_abc123",
  AUTH0_CLIENT_SECRET: "secret_abc123",
  AUTH0_SECRET: "0123456789abcdef0123456789abcdef0123456789abcdef0123456789abcdef",
  APP_BASE_URL: "https://app.tideover.app",
};

/** Force the five AUTH0 vars to `env` (absent key = unset), restore after. */
function withAuthEnv(env: Record<string, string>, fn: () => void): void {
  const saved = Object.fromEntries(AUTH0_ENV_VARS.map((k) => [k, process.env[k]]));
  try {
    for (const k of AUTH0_ENV_VARS) {
      if (env[k] === undefined) delete process.env[k];
      else process.env[k] = env[k];
    }
    fn();
  } finally {
    for (const k of AUTH0_ENV_VARS) {
      const v = saved[k];
      if (v === undefined) delete process.env[k];
      else process.env[k] = v;
    }
  }
}

test("no AUTH0_* vars → password mode (Auth0 ships dark)", () => {
  withAuthEnv({}, () => {
    assert.equal(authMode(), "password");
    assert.deepEqual(auth0ConfigMissing(), [...AUTH0_ENV_VARS]);
  });
});

test("full AUTH0_* set → auth0 mode, nothing missing", () => {
  withAuthEnv(FULL, () => {
    assert.equal(authMode(), "auth0");
    assert.deepEqual(auth0ConfigMissing(), []);
  });
});

test("FAIL CLOSED: one var alone flips to auth0 mode with the rest reported missing", () => {
  withAuthEnv({ AUTH0_DOMAIN: FULL.AUTH0_DOMAIN }, () => {
    assert.equal(authMode(), "auth0", "a partial config must NOT downgrade to password mode");
    assert.deepEqual(auth0ConfigMissing(), [
      "AUTH0_CLIENT_ID",
      "AUTH0_CLIENT_SECRET",
      "AUTH0_SECRET",
      "APP_BASE_URL",
    ]);
  });
});

test("FAIL CLOSED: four of five set (one typo'd away) → auth0 mode, the gap named", () => {
  const partial = { ...FULL };
  delete partial.APP_BASE_URL;
  withAuthEnv(partial, () => {
    assert.equal(authMode(), "auth0");
    assert.deepEqual(auth0ConfigMissing(), ["APP_BASE_URL"]);
  });
});

test("whitespace-only values count as unset", () => {
  withAuthEnv({ AUTH0_DOMAIN: "   " }, () => {
    assert.equal(authMode(), "password");
  });
  withAuthEnv({ ...FULL, AUTH0_CLIENT_SECRET: "  " }, () => {
    assert.equal(authMode(), "auth0");
    assert.deepEqual(auth0ConfigMissing(), ["AUTH0_CLIENT_SECRET"]);
  });
});
