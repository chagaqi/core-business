import assert from "node:assert/strict";
import { test } from "node:test";
import { createRateLimiter, clientIp } from "@/lib/rate-limit";

test("createRateLimiter allows `max` hits per window, rejects the overflow, keys independently", () => {
  const limited = createRateLimiter(3, 60_000);
  for (let i = 0; i < 3; i++) assert.equal(limited("a"), false, `hit ${i + 1} under the cap`);
  assert.equal(limited("a"), true, "4th hit inside the window is rejected");
  assert.equal(limited("a"), true, "stays rejected for the rest of the window");
  // a different key has its own window
  assert.equal(limited("b"), false);
});

test("createRateLimiter resets after the window elapses", () => {
  const limited = createRateLimiter(1, 5); // 5ms window so the test is fast
  assert.equal(limited("k"), false);
  assert.equal(limited("k"), true);
  const start = Date.now();
  while (Date.now() - start < 10) {
    /* busy-wait past the window (deterministic, no timers/mocks needed) */
  }
  assert.equal(limited("k"), false, "a hit after the window opens a fresh one");
});

test("clientIp takes the first x-forwarded-for hop and falls back to 'local'", () => {
  const withHeader = new Request("http://localhost/x", {
    headers: { "x-forwarded-for": " 203.0.113.9 , 10.0.0.1" },
  });
  assert.equal(clientIp(withHeader), "203.0.113.9");
  assert.equal(clientIp(new Request("http://localhost/x")), "local");
});
