import type { CustomerGroup } from "@/lib/types";

/**
 * Client-side CSV import (ADR-0010, Rung 0). A small, dependency-free CSV parser
 * plus a header-detection mapper for Kickstarter backer reports and BackerKit
 * exports. Pure + side-effect-free so it runs IN THE BROWSER — the raw file
 * never leaves the merchant's machine; only the mapped `MappedRow[]` is POSTed.
 *
 * LIMITATION (documented, per ADR-0010): fields are split per physical line, so
 * a newline embedded inside a quoted field is NOT supported. This is rare in
 * these exports and explicitly out of scope. Everything else is handled: quoted
 * fields, commas embedded inside quotes, and escaped `""` quotes.
 */

export interface ParsedCsv {
  headers: string[];
  rows: Record<string, string>[];
}

/**
 * The normalized, structured shape the import route accepts — the ONLY thing
 * that leaves the browser. `firstName`/`email` are always present (possibly
 * empty when the source row is malformed); the rest are omitted unless the
 * source actually carries them, so nothing is ever synthesized.
 */
export interface MappedRow {
  firstName: string;
  email: string;
  group?: CustomerGroup;
  orderValueCents?: number;
  disclosedEtaValue?: string;
  /** the source row's own id (KS backer number / BackerKit order id) — lets a
   *  re-import dedupe orders, not just customers. Undefined when the export
   *  carries no id column. */
  sourceKey?: string;
  /** where the disclosed ETA came from, per source: a KS export is the campaign
   *  page, a BackerKit export is the pledge-manager checkout. */
  etaSource?: "campaign-page" | "checkout";
  /** the order/pledge DATE the source row carried, normalized to an ISO instant
   *  (UTC midnight of the parsed day). Drives the imported order's real
   *  `fulfillmentStart`/`createdAt` so day-in-wait, stage, confidence, overdue,
   *  and the Visa dispute window are computed from when the backer actually
   *  pledged — NOT from import time. Undefined when the row carried no parseable
   *  date; the importer then falls back to now() and counts the row.
   *
   *  NOTE (cross-cutting): this field is only useful end-to-end if the
   *  /api/import Zod schema (app/api/import/route.ts) also accepts `orderDate` —
   *  Zod strips unknown keys, so without that companion change the browser POST
   *  drops this and the server sees no date. See handoff report. */
  orderDate?: string;
}

export type ImportFormat = "kickstarter" | "backerkit" | "unknown";

/**
 * Floor order value applied when an export row has no parseable pledge amount —
 * a sensible non-zero minimum so LTV/gift math has something to work with. Lives
 * here (client-safe) so the import preview and the server importer show the SAME
 * value; the merchant can correct it later. Never inflated beyond a floor.
 */
export const DEFAULT_ORDER_VALUE_CENTS = 5000;

/** Split one physical CSV line into fields (RFC-4180-ish; no embedded newlines). */
function splitLine(line: string): string[] {
  const fields: string[] = [];
  let field = "";
  let inQuotes = false;
  let i = 0;
  while (i < line.length) {
    const ch = line[i];
    if (inQuotes) {
      if (ch === '"') {
        if (line[i + 1] === '"') {
          // an escaped quote — collapse "" to a single literal "
          field += '"';
          i += 2;
          continue;
        }
        inQuotes = false;
        i += 1;
        continue;
      }
      field += ch;
      i += 1;
      continue;
    }
    // outside quotes: a quote only opens a quoted field at the field start
    if (ch === '"' && field === "") {
      inQuotes = true;
      i += 1;
      continue;
    }
    if (ch === ",") {
      fields.push(field);
      field = "";
      i += 1;
      continue;
    }
    field += ch;
    i += 1;
  }
  fields.push(field);
  return fields;
}

export function parseCsv(text: string): ParsedCsv {
  // Blank lines (including a trailing newline) are dropped; the first remaining
  // line is the header row. Note the embedded-newline limitation above.
  const lines = text.split(/\r\n|\r|\n/).filter((l) => l.trim() !== "");
  if (lines.length === 0) return { headers: [], rows: [] };
  const headers = splitLine(lines[0]).map((h) => h.trim());
  const rows = lines.slice(1).map((line) => {
    const cells = splitLine(line);
    const row: Record<string, string> = {};
    headers.forEach((h, idx) => {
      row[h] = (cells[idx] ?? "").trim();
    });
    return row;
  });
  return { headers, rows };
}

// ─── header-detection mapping ────────────────────────────────────────────────

interface AliasSet {
  name: string[];
  email: string[];
  tier: string[];
  amount: string[];
  eta: string[];
  id: string[];
  /** the order/pledge DATE column (distinct from `eta`, the delivery estimate). */
  date: string[];
}

/**
 * Order/pledge-DATE column aliases (case-insensitive), shared by both formats.
 * This is when the backer pledged/ordered — the anchor for the whole wait math —
 * NOT the delivery estimate (that's `eta`). Kickstarter reports carry "Pledged
 * At"/"Backed On"; BackerKit exports carry "Order Date"/"Collection Date".
 */
const DATE_ALIASES = [
  "pledge date",
  "pledged at",
  "pledged on",
  "backing date",
  "backed on",
  "order date",
  "collection date",
  "collected at",
  "completed at",
  "charged at",
  "created at",
  "date",
];

/** Kickstarter backer-report column aliases (case-insensitive). */
const KS_ALIASES: AliasSet = {
  name: ["backer name", "name", "backer", "full name", "first name"],
  email: ["email", "email address", "backer email", "contact email"],
  tier: ["reward title", "reward", "reward name", "tier", "pledge title", "pledged"],
  amount: ["pledge amount", "pledge", "amount", "reward minimum", "pledge amount ($)"],
  eta: [
    "estimated delivery",
    "estimated delivery date",
    "delivery estimate",
    "estimated shipping",
    "eta",
  ],
  id: ["backer number", "backer uid", "backer id", "backer #"],
  date: DATE_ALIASES,
};

/** BackerKit export column aliases (case-insensitive). */
const BK_ALIASES: AliasSet = {
  name: ["first name", "backer name", "name", "shipping name", "full name"],
  email: ["email", "email address", "backer email"],
  tier: ["pledge level", "reward", "reward title", "product", "line item", "variation"],
  amount: ["pledge total", "order total", "total", "amount", "pledge amount"],
  eta: ["estimated delivery", "estimated ship date", "estimated shipping", "eta"],
  id: ["order id", "order number", "backer id", "external id", "backerkit id"],
  date: DATE_ALIASES,
};

/** Header fingerprints unique-ish to each format, used for auto-detection. */
const KS_SIGNATURE = [
  "reward title",
  "reward minimum",
  "pledge amount",
  "backer number",
  "backer uid",
  "pledged status",
];
const BK_SIGNATURE = [
  "pledge level",
  "pledge total",
  "order total",
  "backerkit order id",
];

export function detectFormat(headers: string[]): ImportFormat {
  const h = headers.map((x) => x.toLowerCase().trim());
  const hasKs = KS_SIGNATURE.some((s) => h.includes(s));
  const hasBk = BK_SIGNATURE.some((s) => h.includes(s));
  if (hasBk && !hasKs) return "backerkit";
  if (hasKs) return "kickstarter"; // KS aliases are broader; prefer them when ambiguous
  return "unknown";
}

/** Build a case-insensitive value lookup for one parsed row. */
function lowerKeyed(row: Record<string, string>): Record<string, string> {
  const out: Record<string, string> = {};
  for (const [k, v] of Object.entries(row)) out[k.toLowerCase().trim()] = v;
  return out;
}

/** First non-empty aliased value for a row, or undefined. */
function pick(keyed: Record<string, string>, aliases: string[]): string | undefined {
  for (const a of aliases) {
    const v = keyed[a.toLowerCase()];
    if (v !== undefined && v.trim() !== "") return v.trim();
  }
  return undefined;
}

function firstToken(name: string): string {
  const t = name.trim().split(/\s+/)[0];
  return t ?? "";
}

/**
 * Parse a money string ("$45.00", "1,234.56", "45") to integer cents.
 * Best-effort: strips currency symbols/commas; returns undefined when there's
 * no parseable non-negative number. Never guesses a value.
 */
export function parseMoneyToCents(raw?: string): number | undefined {
  if (!raw) return undefined;
  const cleaned = raw.replace(/[^0-9.]/g, "");
  if (cleaned === "" || cleaned === ".") return undefined;
  const n = Number(cleaned);
  if (!Number.isFinite(n) || n < 0) return undefined;
  return Math.round(n * 100);
}

const MONTHS: Record<string, number> = {
  jan: 1, january: 1,
  feb: 2, february: 2,
  mar: 3, march: 3,
  apr: 4, april: 4,
  may: 5,
  jun: 6, june: 6,
  jul: 7, july: 7,
  aug: 8, august: 8,
  sep: 9, sept: 9, september: 9,
  oct: 10, october: 10,
  nov: 11, november: 11,
  dec: 12, december: 12,
};

/** Build a UTC-midnight ISO instant from y/m/d, rejecting out-of-range/overflow
 *  dates (e.g. Feb 31). Undefined when the calendar date is invalid. */
function utcIso(y: number, m: number, d: number): string | undefined {
  if (!Number.isInteger(y) || m < 1 || m > 12 || d < 1 || d > 31) return undefined;
  const dt = new Date(Date.UTC(y, m - 1, d));
  if (Number.isNaN(dt.getTime())) return undefined;
  // reject rollover (Date.UTC normalizes Feb 31 → Mar 2, etc.)
  if (dt.getUTCFullYear() !== y || dt.getUTCMonth() !== m - 1 || dt.getUTCDate() !== d) {
    return undefined;
  }
  return dt.toISOString();
}

/**
 * Parse a KS/BackerKit order/pledge date to an ISO instant (UTC midnight of the
 * parsed day), or undefined when nothing parses. Deterministic and
 * timezone-independent: dates are read component-by-component and pinned to UTC
 * so the same CSV yields the same instant on any machine (day-granular waits
 * don't need sub-day precision). Formats handled:
 *   - ISO date / datetime: "2026-03-01", "2026-03-01T12:00:00Z",
 *     and KS "Pledged At" style "2015-08-19 14:22:07 -0700" (date part taken)
 *   - US numeric: "3/15/2026", "03/15/26", "3-15-2026" (M/D/Y; auto-swaps to
 *     D/M/Y when the first field is clearly a day > 12)
 *   - month-name: "March 2026", "March 15, 2026", "Mar 15 2026", "15 March 2026"
 * Junk like "weeks 9–11", "free", or "" returns undefined (never guessed).
 */
export function parseDate(raw?: string): string | undefined {
  if (!raw) return undefined;
  const s = raw.trim();
  if (s === "") return undefined;

  // ISO date or datetime (take the leading yyyy-mm-dd; ignore any time/zone).
  let m = s.match(/^(\d{4})-(\d{1,2})-(\d{1,2})/);
  if (m) return utcIso(+m[1], +m[2], +m[3]);

  // US numeric M/D/Y (2- or 4-digit year), separated by / - or .
  m = s.match(/^(\d{1,2})[/\-.](\d{1,2})[/\-.](\d{2,4})\b/);
  if (m) {
    let a = +m[1];
    let b = +m[2];
    let y = +m[3];
    if (y < 100) y += 2000;
    // KS/BackerKit are US-format (M/D/Y); only reinterpret as D/M/Y when the
    // first field can't be a month but the second can.
    if (a > 12 && b <= 12) {
      const t = a;
      a = b;
      b = t;
    }
    return utcIso(y, a, b);
  }

  // "15 March 2026" / "15 Mar 2026"
  m = s.match(/^(\d{1,2})\s+([A-Za-z]+)\.?,?\s+(\d{4})$/);
  if (m) {
    const mo = MONTHS[m[2].toLowerCase()];
    return mo ? utcIso(+m[3], mo, +m[1]) : undefined;
  }

  // "March 2026" / "March 15, 2026" / "Mar 15 2026"
  m = s.match(/^([A-Za-z]+)\.?\s+(?:(\d{1,2})(?:st|nd|rd|th)?,?\s+)?(\d{4})$/);
  if (m) {
    const mo = MONTHS[m[1].toLowerCase()];
    return mo ? utcIso(+m[3], mo, m[2] ? +m[2] : 1) : undefined;
  }

  return undefined;
}

/**
 * Coarse group hint from a reward/tier label. Only returns a group when the
 * label clearly indicates one; otherwise undefined so the importer applies its
 * format default (ks-backer for a Kickstarter import). Never invents a group.
 */
function groupFromTier(tier?: string): CustomerGroup | undefined {
  if (!tier) return undefined;
  const t = tier.toLowerCase();
  if (/pre-?order|preorder/.test(t)) return "new-preorder";
  if (/late|pledge\s*manager|post-?campaign/.test(t)) return "late-pledge";
  return undefined;
}

function mapWith(
  row: Record<string, string>,
  a: AliasSet,
  etaSource: "campaign-page" | "checkout",
): MappedRow {
  const keyed = lowerKeyed(row);
  const email = (pick(keyed, a.email) ?? "").trim();
  const nameRaw = pick(keyed, a.name) ?? "";
  const firstName = firstToken(nameRaw) || (email ? email.split("@")[0] : "");
  const orderValueCents = parseMoneyToCents(pick(keyed, a.amount));
  const group = groupFromTier(pick(keyed, a.tier));
  const disclosedEtaValue = pick(keyed, a.eta);
  const sourceKey = (pick(keyed, a.id) ?? "").trim();
  const orderDate = parseDate(pick(keyed, a.date));

  const mapped: MappedRow = { firstName, email };
  if (group) mapped.group = group;
  if (orderValueCents !== undefined) mapped.orderValueCents = orderValueCents;
  if (disclosedEtaValue) {
    mapped.disclosedEtaValue = disclosedEtaValue;
    mapped.etaSource = etaSource;
  }
  if (sourceKey) mapped.sourceKey = sourceKey;
  if (orderDate) mapped.orderDate = orderDate;
  return mapped;
}

export function mapKickstarterRow(row: Record<string, string>): MappedRow {
  return mapWith(row, KS_ALIASES, "campaign-page");
}

export function mapBackerkitRow(row: Record<string, string>): MappedRow {
  return mapWith(row, BK_ALIASES, "checkout");
}

/**
 * Detect the export format from the headers and map every row. `unknown` falls
 * back to the (broader) Kickstarter alias set as a best effort.
 */
export function mapRows(parsed: ParsedCsv): { format: ImportFormat; rows: MappedRow[] } {
  const format = detectFormat(parsed.headers);
  const mapper = format === "backerkit" ? mapBackerkitRow : mapKickstarterRow;
  return { format, rows: parsed.rows.map(mapper) };
}
