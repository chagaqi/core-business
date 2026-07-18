import assert from "node:assert/strict";
import { test } from "node:test";
import { formatBaseline, formatCaptureDate, formatSeconds } from "@/lib/baseline";
import type { Merchant } from "@/lib/types";

// ── formatSeconds: boundaries + carry ──────────────────────────────────────
test("formatSeconds humanizes the spec example 7h 30m", () => {
  assert.equal(formatSeconds(27000), "7h 30m");
});

test("formatSeconds omits the hour when under an hour", () => {
  assert.equal(formatSeconds(1800), "30m");
});

test("formatSeconds omits the minute when it lands on a whole hour", () => {
  assert.equal(formatSeconds(3600), "1h");
  assert.equal(formatSeconds(7200), "2h");
});

test("formatSeconds rounds to the nearest minute and carries a 59s overflow", () => {
  // 3599s ≈ 60 rounded minutes → must carry to "1h", never "0h 60m"
  assert.equal(formatSeconds(3599), "1h");
  // 19000s = 5h + 1000s(16.67m) → rounds to 17m
  assert.equal(formatSeconds(19000), "5h 17m");
});

test("formatSeconds clamps zero, negative, and non-finite input to 0m", () => {
  assert.equal(formatSeconds(0), "0m");
  assert.equal(formatSeconds(-500), "0m");
  assert.equal(formatSeconds(Number.NaN), "0m");
  assert.equal(formatSeconds(Number.POSITIVE_INFINITY), "0m");
});

test("formatSeconds rounds a sub-minute value up to 1m", () => {
  assert.equal(formatSeconds(59), "1m");
  assert.equal(formatSeconds(90), "2m"); // 1.5 min → rounds to 2
});

// ── formatCaptureDate ──────────────────────────────────────────────────────
test("formatCaptureDate renders a readable UTC date", () => {
  assert.equal(formatCaptureDate("2026-05-29T03:40:55.994Z"), "May 29, 2026");
});

// ── formatBaseline: the full assembler on a fixture ─────────────────────────
const FIXTURE: Pick<Merchant, "name" | "isDemo" | "baseline"> = {
  name: "Lumen Forge",
  isDemo: true,
  baseline: {
    capturedOn: "2026-05-29T03:40:55.994Z",
    medianFrtSec: 27000,
    wismoPer100Orders: 150,
    ticketsPerWeek: 38,
    repeatWismoPct: 62,
  },
};

test("formatBaseline carries through the merchant identity + demo flag", () => {
  const out = formatBaseline(FIXTURE);
  assert.equal(out.merchantName, "Lumen Forge");
  assert.equal(out.isDemo, true);
  assert.equal(out.capturedOn, "May 29, 2026");
  assert.equal(out.capturedOnIso, "2026-05-29T03:40:55.994Z");
});

test("formatBaseline humanizes all four metrics in order with a gloss each", () => {
  const out = formatBaseline(FIXTURE);
  assert.deepEqual(
    out.metrics.map((m) => m.key),
    ["medianFrt", "wismoPer100", "ticketsPerWeek", "repeatWismo"],
  );
  assert.deepEqual(
    out.metrics.map((m) => m.value),
    ["7h 30m", "150 per 100 orders", "38 / week", "62%"],
  );
  for (const m of out.metrics) {
    assert.ok(m.label.length > 0, `metric ${m.key} has a label`);
    assert.ok(m.gloss.length > 0, `metric ${m.key} has a gloss`);
  }
});

test("formatBaseline never emits a projected improvement, percentage-delta, or hard date", () => {
  const out = formatBaseline(FIXTURE);
  const blob = [
    out.merchantName,
    out.capturedOn,
    ...out.metrics.flatMap((m) => [m.label, m.value, m.gloss]),
  ]
    .join(" ")
    .toLowerCase();
  // no outcome / improvement framing — this is the before-picture only
  for (const banned of ["fewer", "reduction", "reduce", "cut ", "improve", "faster", "we'll", "projected", "guarantee"]) {
    assert.ok(!blob.includes(banned), `baseline copy must not contain "${banned}"`);
  }
  // no hard calendar date (YYYY-MM-DD) anywhere in the humanized values
  assert.ok(!/\d{4}-\d{2}-\d{2}/.test(blob), "no ISO hard date leaks into display copy");
});
