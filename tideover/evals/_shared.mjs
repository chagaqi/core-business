/**
 * Shared helpers for the engine eval harness (ADR-0006, task OS4).
 *
 * These are used by BOTH the authoritative invariant sweep (invariants.mjs) and
 * the golden regression runner (golden.mjs) so the proof-only checks are defined
 * once and applied identically. Seed JSON is read straight from disk (like
 * scripts/seed-check.mjs) — the engine import graph is pure TS with no JSON, so
 * this sidesteps ESM JSON-attribute concerns while still exercising real data.
 */
import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const HERE = dirname(fileURLToPath(import.meta.url));
const DATA = join(HERE, "..", "lib", "data");

export const DAY_MS = 86_400_000;

/** matches an unresolved single `{merge_field}` or a `{{handlebars}}` token. */
export const MERGE_FIELD_RE = /\{[a-zA-Z_]+\}|\{\{.*?\}\}/;

/** load the full seed straight from lib/data/*.json + id-indexed maps. */
export function loadSeed() {
  const load = (n) => JSON.parse(readFileSync(join(DATA, `${n}.json`), "utf8"));
  const merchants = load("merchants");
  const customers = load("customers");
  const orders = load("orders");
  const tickets = load("tickets");
  const gifts = load("gifts");
  const social = load("social-feed");

  const index = (arr) => new Map(arr.map((x) => [x.id, x]));
  return {
    merchants,
    customers,
    orders,
    tickets,
    gifts,
    social,
    byMerchant: index(merchants),
    byCustomer: index(customers),
    byOrder: index(orders),
    byGift: index(gifts),
  };
}

/** the gift catalog a merchant actually draws from (index.ts passes this in). */
export function catalogFor(merchant, gifts) {
  const ids = new Set(merchant.giftCatalogIds);
  return gifts.filter((g) => ids.has(g.id));
}

/**
 * Build a `now` that yields an exact `days` daysInWait for this order.
 * computeTimeline reads daysInWait as round((now - fulfillmentStart)/DAY), so
 * offsetting from fulfillmentStart gives a precise, deterministic value.
 */
export function nowForDaysInWait(order, days) {
  return new Date(Date.parse(order.fulfillmentStart) + days * DAY_MS);
}

/**
 * Return the first banned word that SURVIVES in `text`, or null. Mirrors the
 * word-boundary, case-insensitive, escaped matching the reassurance engine uses
 * to strip banned words — so this is a faithful "did stripping actually work"
 * check, not a looser substring guess.
 */
export function bannedSurvivor(text, banned) {
  for (const word of banned) {
    const re = new RegExp(`\\b${word.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}\\b`, "gi");
    if (re.test(text)) return word;
  }
  return null;
}

/** parse a "N–M" numeric window out of a confidence band, or null if none. */
export function parseBandRange(text) {
  const m = text.match(/(\d+)\s*[–—-]\s*(\d+)/);
  if (!m) return null;
  return { lo: Number(m[1]), hi: Number(m[2]) };
}

/** true if the band reads as a relative window (days/weeks) or the overdue line. */
export function isRelativeWindow(text) {
  return /\b(day|days|week|weeks)\b/i.test(text) || /longer than planned/i.test(text);
}
