import assert from "node:assert/strict";
import { test } from "node:test";
import { resolveMode, isRealHost } from "@/lib/mode";

/**
 * Run `fn` with DEMO_MODE / REAL_APP_HOST forced to the given values (undefined
 * = unset), restoring the prior env afterwards so tests never leak into each
 * other or the wider suite.
 */
function withEnv(env: { DEMO_MODE?: string; REAL_APP_HOST?: string }, fn: () => void): void {
  const keys = ["DEMO_MODE", "REAL_APP_HOST"] as const;
  const saved = Object.fromEntries(keys.map((k) => [k, process.env[k]])) as Record<
    (typeof keys)[number],
    string | undefined
  >;
  try {
    for (const k of keys) {
      const v = env[k];
      if (v === undefined) delete process.env[k];
      else process.env[k] = v;
    }
    fn();
  } finally {
    for (const k of keys) {
      const v = saved[k];
      if (v === undefined) delete process.env[k];
      else process.env[k] = v;
    }
  }
}

test("resolveMode: the real app host (default) → real when DEMO_MODE is unset", () => {
  withEnv({ DEMO_MODE: undefined, REAL_APP_HOST: undefined }, () => {
    assert.equal(resolveMode("app.tideover.app"), "real");
  });
});

test("resolveMode: strips the :port before matching", () => {
  withEnv({ DEMO_MODE: undefined, REAL_APP_HOST: undefined }, () => {
    assert.equal(resolveMode("app.tideover.app:443"), "real");
    assert.equal(resolveMode("app.tideover.app:3000"), "real");
  });
});

test("resolveMode: host match is case-insensitive", () => {
  withEnv({ DEMO_MODE: undefined, REAL_APP_HOST: undefined }, () => {
    assert.equal(resolveMode("App.Tideover.App"), "real");
    assert.equal(resolveMode("APP.TIDEOVER.APP:8080"), "real");
  });
});

test("resolveMode: a non-real host → demo", () => {
  withEnv({ DEMO_MODE: undefined, REAL_APP_HOST: undefined }, () => {
    assert.equal(resolveMode("www.tideover.app"), "demo");
    assert.equal(resolveMode("tideover.vercel.app"), "demo");
    assert.equal(resolveMode("localhost:3000"), "demo");
  });
});

test("resolveMode: no host → demo (fail safe)", () => {
  withEnv({ DEMO_MODE: undefined, REAL_APP_HOST: undefined }, () => {
    assert.equal(resolveMode(undefined), "demo");
    assert.equal(resolveMode(""), "demo");
  });
});

test("resolveMode: DEMO_MODE=false overrides to real even on a non-real host", () => {
  withEnv({ DEMO_MODE: "false", REAL_APP_HOST: undefined }, () => {
    assert.equal(resolveMode("www.tideover.app"), "real");
    assert.equal(resolveMode(undefined), "real");
  });
});

test("resolveMode: DEMO_MODE=true overrides to demo even on the real host", () => {
  withEnv({ DEMO_MODE: "true", REAL_APP_HOST: undefined }, () => {
    assert.equal(resolveMode("app.tideover.app"), "demo");
  });
});

test("resolveMode: a custom REAL_APP_HOST is honored (and normalized)", () => {
  withEnv({ DEMO_MODE: undefined, REAL_APP_HOST: "operator.example.com" }, () => {
    assert.equal(resolveMode("operator.example.com"), "real");
    assert.equal(resolveMode("operator.example.com:443"), "real");
    assert.equal(resolveMode("app.tideover.app"), "demo"); // old default no longer matches
  });
});

test("isRealHost: host-only, ignores the DEMO_MODE override", () => {
  withEnv({ DEMO_MODE: "false", REAL_APP_HOST: undefined }, () => {
    // DEMO_MODE=false makes resolveMode() real, but the datastore signal is
    // host-only, so a non-real host is still NOT the real store.
    assert.equal(isRealHost("www.tideover.app"), false);
    assert.equal(isRealHost(undefined), false);
    assert.equal(isRealHost("app.tideover.app:443"), true);
  });
});
