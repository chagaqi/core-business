import assert from "node:assert/strict";
import { test } from "node:test";
import {
  relativeLuminance,
  contrastRatio,
  ensureReadable,
  readableAccent,
  parseHex,
  toHex,
  SURFACE_BG,
} from "@/lib/color";

test("relativeLuminance is 1 for white and 0 for black", () => {
  assert.ok(Math.abs(relativeLuminance("#ffffff") - 1) < 1e-9);
  assert.equal(relativeLuminance("#000000"), 0);
});

test("parseHex expands 3-digit hex and tolerates a missing #", () => {
  assert.deepEqual(parseHex("#fff"), { r: 255, g: 255, b: 255 });
  assert.deepEqual(parseHex("0e5366"), { r: 14, g: 83, b: 102 });
});

test("toHex round-trips to a canonical lowercase string", () => {
  assert.equal(toHex(parseHex("#0E5366")), "#0e5366");
});

test("contrastRatio black-on-white is the WCAG max of 21, identical colors are 1", () => {
  assert.equal(Math.round(contrastRatio("#000000", "#ffffff")), 21);
  assert.equal(contrastRatio("#ffffff", "#ffffff"), 1);
  // symmetric regardless of argument order
  assert.equal(contrastRatio("#000", "#fff"), contrastRatio("#fff", "#000"));
});

test("ensureReadable leaves a dark accent that already passes AA untouched", () => {
  // Sea-teal on sand ≈ 8:1, well past AA — returned normalized, never darkened.
  assert.ok(contrastRatio("#0E5366", SURFACE_BG) >= 4.5);
  const out = ensureReadable("#0E5366", SURFACE_BG);
  assert.equal(out, "#0e5366");
});

test("ensureReadable darkens a LIGHT accent until it clears AA", () => {
  const light = "#E9B486"; // warm tan ≈ 1.7:1 on sand — fails AA badly
  assert.ok(contrastRatio(light, SURFACE_BG) < 4.5);
  const out = ensureReadable(light, SURFACE_BG);
  assert.notEqual(out, "#e9b486"); // it actually changed
  assert.ok(contrastRatio(out, SURFACE_BG) >= 4.5); // and now passes
});

test("readableAccent defaults to the sand surface background", () => {
  assert.equal(readableAccent("#E9B486"), ensureReadable("#E9B486", SURFACE_BG));
  assert.ok(contrastRatio(readableAccent("#E9B486"), SURFACE_BG) >= 4.5);
});
