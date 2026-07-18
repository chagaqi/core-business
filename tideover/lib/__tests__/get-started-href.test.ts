import assert from "node:assert/strict";
import { test } from "node:test";

/**
 * GET_STARTED_HREF (ADR-0020) — the revenue CTAs' destination. On the www
 * marketing build a relative /onboarding is the DEMO sandbox, so with
 * NEXT_PUBLIC_REAL_APP_HOST set the constant must resolve to the real-app
 * host's onboarding. The pricing TierCard ("Start free trial") and the Home
 * Pilot card ("Start your 14-day free trial") both link this constant — the
 * env is read once at module load, hence the dynamic import AFTER setting it
 * (node --test runs each file in its own process, so nothing has imported
 * nav-data before this).
 */
test("GET_STARTED_HREF points at the real-app onboarding when NEXT_PUBLIC_REAL_APP_HOST is set", async () => {
  process.env.NEXT_PUBLIC_REAL_APP_HOST = "app.tideover.app";
  const { GET_STARTED_HREF } = await import("@/components/marketing/nav/nav-data");
  assert.equal(GET_STARTED_HREF, "https://app.tideover.app/onboarding");
});
