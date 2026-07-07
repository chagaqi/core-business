import assert from "node:assert/strict";
import { test } from "node:test";
import {
  detectFormat,
  mapBackerkitRow,
  mapKickstarterRow,
  mapRows,
  parseCsv,
  parseDate,
  parseMoneyToCents,
} from "@/lib/csv";

// ── parseCsv: quoted fields, embedded commas, escaped quotes ──────────────────

test("parseCsv keeps a comma embedded inside a quoted field", () => {
  const { headers, rows } = parseCsv('name,note\n"Doe, Jane",hello');
  assert.deepEqual(headers, ["name", "note"]);
  assert.equal(rows.length, 1);
  assert.equal(rows[0].name, "Doe, Jane"); // the comma did NOT split the field
  assert.equal(rows[0].note, "hello");
});

test('parseCsv collapses an escaped "" quote to a single literal quote', () => {
  const { rows } = parseCsv('quote\n"she said ""hi"""');
  assert.equal(rows.length, 1);
  assert.equal(rows[0].quote, 'she said "hi"');
});

test("parseCsv tolerates CRLF line endings and a trailing newline", () => {
  const { headers, rows } = parseCsv("a,b\r\n1,2\r\n");
  assert.deepEqual(headers, ["a", "b"]);
  assert.equal(rows.length, 1);
  assert.deepEqual(rows[0], { a: "1", b: "2" });
});

// ── format detection ──────────────────────────────────────────────────────────

test("detectFormat recognizes a Kickstarter backer report from its headers", () => {
  const headers = ["Backer Number", "Backer Name", "Email", "Reward Title", "Pledge Amount", "Estimated Delivery"];
  assert.equal(detectFormat(headers), "kickstarter");
});

test("detectFormat recognizes a BackerKit export, and unknown headers fall through", () => {
  assert.equal(detectFormat(["First Name", "Email", "Pledge Level", "Pledge Total"]), "backerkit");
  assert.equal(detectFormat(["foo", "bar"]), "unknown");
});

// ── mapping ───────────────────────────────────────────────────────────────────

test("mapKickstarterRow maps name/email/amount/eta and defaults group to undefined", () => {
  const row = {
    "Backer Name": "Jane Doe",
    Email: "jane@example.com",
    "Reward Title": "Early Bird — 1 Lantern",
    "Pledge Amount": "$59.00",
    "Estimated Delivery": "March 2026",
  };
  const m = mapKickstarterRow(row);
  assert.equal(m.firstName, "Jane"); // first token of the backer name
  assert.equal(m.email, "jane@example.com");
  assert.equal(m.orderValueCents, 5900); // "$59.00" → cents
  assert.equal(m.disclosedEtaValue, "March 2026"); // captured only because present
  assert.equal(m.group, undefined); // a plain reward tier implies no group override
});

test("mapping infers a group hint only from a clearly-labeled tier", () => {
  const late = mapKickstarterRow({ Name: "Al", Email: "a@x.com", "Reward Title": "Late Pledge — Add-on" });
  assert.equal(late.group, "late-pledge");
  const pre = mapBackerkitRow({ "First Name": "Bo", Email: "b@x.com", "Pledge Level": "Pre-order bundle" });
  assert.equal(pre.group, "new-preorder");
});

test("a malformed row (no email, no name) is mapped gracefully to empty, never throws", () => {
  const m = mapKickstarterRow({ Random: "x", Notes: "y" });
  assert.equal(m.email, ""); // caller (import) skips rows with no email
  assert.equal(m.firstName, "");
  assert.equal(m.orderValueCents, undefined);
  assert.equal(m.disclosedEtaValue, undefined);
});

test("parseMoneyToCents handles symbols, thousands separators, and rejects junk", () => {
  assert.equal(parseMoneyToCents("$1,234.56"), 123456);
  assert.equal(parseMoneyToCents("45"), 4500);
  assert.equal(parseMoneyToCents(""), undefined);
  assert.equal(parseMoneyToCents("free"), undefined);
  assert.equal(parseMoneyToCents(undefined), undefined);
});

test("mapRows detects the format and maps every parsed row end-to-end", () => {
  const csv =
    'Backer Name,Email,Reward Title,Pledge Amount,Estimated Delivery\n' +
    '"Smith, Ada",ada@example.com,Standard,"$40.00",weeks 9–11\n' +
    "Bo Li,bo@example.com,Standard,$40.00,";
  const { format, rows } = mapRows(parseCsv(csv));
  assert.equal(format, "kickstarter");
  assert.equal(rows.length, 2);
  assert.equal(rows[0].firstName, "Smith,"); // first whitespace token of the quoted name
  assert.equal(rows[0].email, "ada@example.com");
  assert.equal(rows[0].disclosedEtaValue, "weeks 9–11");
  assert.equal(rows[1].disclosedEtaValue, undefined); // empty ETA cell → omitted
});

// ── date parsing (the central import fix) ───────────────────────────────────

test("parseDate reads ISO date, ISO datetime, and KS pledged-at style", () => {
  assert.equal(parseDate("2026-03-01"), "2026-03-01T00:00:00.000Z");
  assert.equal(parseDate("2026-03-01T14:22:07Z"), "2026-03-01T00:00:00.000Z");
  // KS "Pledged At": "yyyy-mm-dd hh:mm:ss ±zone" → date part, timezone-independent
  assert.equal(parseDate("2015-08-19 14:22:07 -0700"), "2015-08-19T00:00:00.000Z");
});

test("parseDate reads US numeric M/D/Y (2- and 4-digit years) and dashes", () => {
  assert.equal(parseDate("3/15/2026"), "2026-03-15T00:00:00.000Z");
  assert.equal(parseDate("03/15/26"), "2026-03-15T00:00:00.000Z");
  assert.equal(parseDate("3-15-2026"), "2026-03-15T00:00:00.000Z");
  // day-first when the first field can't be a month
  assert.equal(parseDate("25/12/2026"), "2026-12-25T00:00:00.000Z");
});

test("parseDate reads month-name formats", () => {
  assert.equal(parseDate("March 2026"), "2026-03-01T00:00:00.000Z"); // no day → 1st
  assert.equal(parseDate("March 15, 2026"), "2026-03-15T00:00:00.000Z");
  assert.equal(parseDate("Mar 15 2026"), "2026-03-15T00:00:00.000Z");
  assert.equal(parseDate("15 March 2026"), "2026-03-15T00:00:00.000Z");
});

test("parseDate returns undefined for junk, ETA bands, and impossible dates", () => {
  assert.equal(parseDate(undefined), undefined);
  assert.equal(parseDate(""), undefined);
  assert.equal(parseDate("weeks 9–11"), undefined); // an ETA band is not a date
  assert.equal(parseDate("free"), undefined);
  assert.equal(parseDate("2026-02-31"), undefined); // rejects calendar overflow
});

test("mapping captures the order/pledge date column as an ISO orderDate", () => {
  const ks = mapKickstarterRow({
    "Backer Name": "Jane Doe",
    Email: "jane@example.com",
    "Pledged At": "2026-01-04 09:00:00 -0500",
  });
  assert.equal(ks.orderDate, "2026-01-04T00:00:00.000Z");

  const bk = mapBackerkitRow({
    "First Name": "Bo",
    Email: "bo@example.com",
    "Order Date": "March 15, 2026",
  });
  assert.equal(bk.orderDate, "2026-03-15T00:00:00.000Z");

  // no date column → orderDate omitted (importer falls back to now + counts it)
  const none = mapKickstarterRow({ Email: "x@example.com" });
  assert.equal(none.orderDate, undefined);
});
