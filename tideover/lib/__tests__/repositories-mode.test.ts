import assert from "node:assert/strict";
import { test } from "node:test";
import { getRepositories, repositoriesForMode } from "@/lib/repositories";
import { jsonRepositories } from "@/lib/repositories/json/repositories";
import { resolveDatastoreModeFromRequest } from "@/lib/request-mode";

/** Set an env var to a value (or delete it) and restore afterwards. */
function withEnv(env: Record<string, string | undefined>, fn: () => void): void {
  const saved: Record<string, string | undefined> = {};
  for (const k of Object.keys(env)) saved[k] = process.env[k];
  try {
    for (const [k, v] of Object.entries(env)) {
      if (v === undefined) delete process.env[k];
      else process.env[k] = v;
    }
    fn();
  } finally {
    for (const [k, v] of Object.entries(saved)) {
      if (v === undefined) delete process.env[k];
      else process.env[k] = v;
    }
  }
}

test("real mode requires MONGODB_URI — it throws rather than fall back to the demo/JSON store", () => {
  withEnv({ MONGODB_URI: undefined }, () => {
    assert.throws(() => repositoriesForMode("real"), /MONGODB_URI/);
  });
});

test("demo mode resolves to the JSON store by default, with no MONGODB_URI", () => {
  withEnv({ MONGODB_URI: undefined, DATA_DRIVER: undefined }, () => {
    assert.equal(repositoriesForMode("demo"), jsonRepositories);
  });
});

test("getRepositories() outside a request scope uses the demo store — even under DEMO_MODE=false", () => {
  // There is no Next request context here, so the datastore mode falls back to
  // demo. DEMO_MODE=false is an AUTH override and must NOT repoint the datastore;
  // this is exactly what keeps scripts and the ingest/auth tests on the JSON
  // store (and green) even when they set DEMO_MODE=false.
  withEnv({ MONGODB_URI: undefined, DATA_DRIVER: undefined, DEMO_MODE: "false" }, () => {
    assert.equal(getRepositories(), jsonRepositories);
  });
});

test("fail-safe: DEMO_MODE=true forces the DATASTORE to demo before the host is even read — auth-off can never coincide with the live store", () => {
  // The guard returns "demo" ahead of requestHost(), so this holds regardless of
  // request scope. Closes the ADR-0017 decoupling hole: host=app.tideover.app +
  // DEMO_MODE=true (auth off) must not serve the live database.
  withEnv({ DEMO_MODE: "true" }, () => {
    assert.equal(resolveDatastoreModeFromRequest(), "demo");
  });
  // And with MONGODB_URI present, getRepositories still resolves the demo store,
  // never the live one, under DEMO_MODE=true.
  withEnv({ DEMO_MODE: "true", MONGODB_URI: undefined, DATA_DRIVER: undefined }, () => {
    assert.equal(getRepositories(), jsonRepositories);
  });
});
