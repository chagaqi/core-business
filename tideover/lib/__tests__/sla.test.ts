import assert from "node:assert/strict";
import { test } from "node:test";
import {
  ATTAINMENT_MIN_N,
  computeSlaAttainment,
  formatSlaDuration,
  resolveTimeZone,
  slaChip,
  slaTarget,
  ticketSlaState,
  type SlaTicket,
  type SlaWindows,
} from "@/lib/sla";

// July → ET is EDT (UTC−4): 9:00 ET = 13:00Z, 15:00 ET = 19:00Z.
const ET: SlaWindows = { amStart: "9:00", pmStart: "15:00", tz: "ET" };
// July → CET is CEST (UTC+2): 8:30 CET = 06:30Z, 14:30 CET = 12:30Z.
const CET: SlaWindows = { amStart: "8:30", pmStart: "14:30", tz: "CET" };

const ticket = (createdAt: string, extra: Partial<SlaTicket> = {}): SlaTicket => ({
  createdAt,
  firstResponseSec: null,
  status: "open",
  sentiment: "calm",
  ...extra,
});

// ─── tz resolution ──────────────────────────────────────────────────────────
test("resolveTimeZone maps short labels, passes IANA through, defaults unknowns", () => {
  assert.equal(resolveTimeZone("ET"), "America/New_York");
  assert.equal(resolveTimeZone("cet"), "Europe/Berlin");
  assert.equal(resolveTimeZone("Europe/Paris"), "Europe/Paris");
  assert.equal(resolveTimeZone("banana"), "America/New_York");
});

// ─── next-window target (ET): morning / afternoon / after-hours arrivals ─────
test("ET morning arrival before the am window is due that morning", () => {
  // 11:00Z = 07:00 ET, before 9:00 → next window is 9:00 ET (13:00Z).
  const r = slaTarget(ticket("2026-07-06T11:00:00.000Z"), ET);
  assert.equal(r.target, "2026-07-06T13:00:00.000Z");
  assert.equal(r.basis, "next-window");
});

test("ET midday arrival between windows is due the afternoon window", () => {
  // 15:00Z = 11:00 ET, after 9:00 & before 15:00 → next is 15:00 ET (19:00Z).
  const r = slaTarget(ticket("2026-07-06T15:00:00.000Z"), ET);
  assert.equal(r.target, "2026-07-06T19:00:00.000Z");
  assert.equal(r.basis, "next-window");
});

test("ET after-hours arrival rolls to the next morning window", () => {
  // 23:00Z = 19:00 ET, after 15:00 → next is tomorrow 9:00 ET (next-day 13:00Z).
  const r = slaTarget(ticket("2026-07-06T23:00:00.000Z"), ET);
  assert.equal(r.target, "2026-07-07T13:00:00.000Z");
  assert.equal(r.basis, "next-window");
});

test("target strictly after createdAt: arriving exactly at am window rolls to pm", () => {
  // 13:00Z = 9:00 ET exactly → the 9:00 candidate is not strictly after, so pm.
  const r = slaTarget(ticket("2026-07-06T13:00:00.000Z"), ET);
  assert.equal(r.target, "2026-07-06T19:00:00.000Z");
});

// ─── next-window target (CET) ────────────────────────────────────────────────
test("CET morning arrival is due the 8:30 window (06:30Z in CEST)", () => {
  // 05:00Z = 07:00 CEST, before 8:30 → next is 8:30 CET (06:30Z).
  const r = slaTarget(ticket("2026-07-06T05:00:00.000Z"), CET);
  assert.equal(r.target, "2026-07-06T06:30:00.000Z");
  assert.equal(r.basis, "next-window");
});

test("CET afternoon arrival rolls to next-morning 8:30", () => {
  // 13:00Z = 15:00 CEST, after 14:30 → next morning 8:30 CET (next-day 06:30Z).
  const r = slaTarget(ticket("2026-07-06T13:00:00.000Z"), CET);
  assert.equal(r.target, "2026-07-07T06:30:00.000Z");
});

// ─── escalated tighter cap ───────────────────────────────────────────────────
test("escalated ticket takes the 2h cap when it is sooner than the window", () => {
  // 05:00Z = 01:00 ET; window is 9:00 ET (13:00Z, 8h out). Cap = +2h = 07:00Z.
  const viaSentiment = slaTarget(
    ticket("2026-07-06T05:00:00.000Z", { sentiment: "chargeback-threat" }),
    ET,
  );
  assert.equal(viaSentiment.target, "2026-07-06T07:00:00.000Z");
  assert.equal(viaSentiment.basis, "escalated");

  // explicit priority takes the same path.
  const viaPriority = slaTarget(
    ticket("2026-07-06T05:00:00.000Z", { priority: "escalated" }),
    ET,
  );
  assert.equal(viaPriority.target, "2026-07-06T07:00:00.000Z");
  assert.equal(viaPriority.basis, "escalated");
});

test("escalated ticket keeps the window when the window is sooner than 2h", () => {
  // 12:00Z = 08:00 ET, window 9:00 ET (13:00Z) is 1h out; cap (+2h = 14:00Z) later.
  const r = slaTarget(ticket("2026-07-06T12:00:00.000Z", { sentiment: "hostile" }), ET);
  assert.equal(r.target, "2026-07-06T13:00:00.000Z");
  assert.equal(r.basis, "next-window");
});

test("a normal ticket never uses the escalated cap", () => {
  const r = slaTarget(ticket("2026-07-06T05:00:00.000Z", { sentiment: "anxious" }), ET);
  assert.equal(r.target, "2026-07-06T13:00:00.000Z");
  assert.equal(r.basis, "next-window");
});

// ─── open-ticket amber / breach boundaries ───────────────────────────────────
// Base ticket: 11:00Z arrival → target 13:00Z.
const openBase = ticket("2026-07-06T11:00:00.000Z");
const at = (iso: string) => ticketSlaState(openBase, ET, new Date(iso));

test("open state is ok with more than NEAR_BREACH_MIN to target", () => {
  const s = at("2026-07-06T11:30:00.000Z"); // 90m out
  assert.equal(s.answered, false);
  if (!s.answered) {
    assert.equal(s.state, "ok");
    assert.equal(s.minutesToTarget, 90);
  }
});

test("open state flips amber exactly at the NEAR_BREACH_MIN boundary (60m)", () => {
  const s = at("2026-07-06T12:00:00.000Z"); // 60m out
  assert.equal(s.answered, false);
  if (!s.answered) assert.equal(s.state, "amber");
});

test("open state is still ok one minute outside the amber window (61m)", () => {
  const s = at("2026-07-06T11:59:00.000Z"); // 61m out
  if (!s.answered) assert.equal(s.state, "ok");
});

test("open state at exactly the target is amber, not yet breached", () => {
  const s = at("2026-07-06T13:00:00.000Z"); // 0m
  if (!s.answered) {
    assert.equal(s.state, "amber");
    assert.equal(s.minutesToTarget, 0);
  }
});

test("open state breaches once past the target", () => {
  const s = at("2026-07-06T13:01:00.000Z"); // 1m past
  if (!s.answered) {
    assert.equal(s.state, "breach");
    assert.equal(s.minutesToTarget, -1);
  }
});

// ─── answered met / missed ───────────────────────────────────────────────────
test("answered ticket met when the response lands inside the target budget", () => {
  // 11:00Z → target 13:00Z → budget = 7200s.
  const met = ticketSlaState(
    ticket("2026-07-06T11:00:00.000Z", { firstResponseSec: 3600, status: "sent" }),
    ET,
    new Date("2026-07-09T00:00:00.000Z"),
  );
  assert.equal(met.answered, true);
  if (met.answered) {
    assert.equal(met.budgetSec, 7200);
    assert.equal(met.met, true);
  }
});

test("answered ticket met exactly at the budget boundary, missed one second past", () => {
  const now = new Date("2026-07-09T00:00:00.000Z");
  const exactly = ticketSlaState(
    ticket("2026-07-06T11:00:00.000Z", { firstResponseSec: 7200, status: "sent" }),
    ET,
    now,
  );
  const over = ticketSlaState(
    ticket("2026-07-06T11:00:00.000Z", { firstResponseSec: 7201, status: "sent" }),
    ET,
    now,
  );
  if (exactly.answered) assert.equal(exactly.met, true);
  if (over.answered) assert.equal(over.met, false);
});

// ─── attainment + small-n gating ─────────────────────────────────────────────
function answered(count: number, metCount: number): SlaTicket[] {
  // 11:00Z arrivals (budget 7200s). "met" → fast reply; "missed" → far past budget.
  return Array.from({ length: count }, (_, i) =>
    ticket("2026-07-06T11:00:00.000Z", {
      status: "sent",
      firstResponseSec: i < metCount ? 120 : 999_999,
    }),
  );
}

test("attainment gates the rate to null below the small-n floor", () => {
  const a = computeSlaAttainment(answered(ATTAINMENT_MIN_N - 1, ATTAINMENT_MIN_N - 1), ET);
  assert.equal(a.answered, ATTAINMENT_MIN_N - 1);
  assert.equal(a.met, ATTAINMENT_MIN_N - 1);
  assert.equal(a.rate, null);
});

test("attainment reports the rate at or above the floor", () => {
  const a = computeSlaAttainment(answered(10, 8), ET);
  assert.equal(a.answered, 10);
  assert.equal(a.met, 8);
  assert.equal(a.rate, 0.8);
});

test("attainment counts only answered tickets, ignoring open ones", () => {
  const tickets = [
    ...answered(10, 10),
    ticket("2026-07-06T11:00:00.000Z"), // open — firstResponseSec null
    ticket("2026-07-06T23:00:00.000Z"), // open — firstResponseSec null
  ];
  const a = computeSlaAttainment(tickets, ET);
  assert.equal(a.answered, 10);
  assert.equal(a.met, 10);
  assert.equal(a.rate, 1);
});

// ─── display helpers ─────────────────────────────────────────────────────────
test("formatSlaDuration renders minutes, hours, and days compactly", () => {
  assert.equal(formatSlaDuration(40), "40m");
  assert.equal(formatSlaDuration(0), "1m");
  assert.equal(formatSlaDuration(60), "1h");
  assert.equal(formatSlaDuration(130), "2h 10m");
  assert.equal(formatSlaDuration(60 * 24), "1d");
  assert.equal(formatSlaDuration(60 * 31), "1d 7h");
});

test("slaChip labels each state and spells the basis in the tooltip", () => {
  const okChip = slaChip(at("2026-07-06T10:00:00.000Z")); // ok, 3h out
  assert.equal(okChip.tone, "ok");
  assert.match(okChip.label, /^SLA /);
  assert.match(okChip.title, /next support window/i);

  const amberChip = slaChip(at("2026-07-06T12:30:00.000Z")); // 30m out
  assert.equal(amberChip.tone, "amber");
  assert.match(amberChip.label, /^due in /);

  const breachChip = slaChip(at("2026-07-06T15:00:00.000Z")); // 2h past
  assert.equal(breachChip.tone, "red");
  assert.match(breachChip.label, /^overdue /);

  const escChip = slaChip(
    ticketSlaState(
      ticket("2026-07-06T05:00:00.000Z", { sentiment: "chargeback-threat" }),
      ET,
      new Date("2026-07-06T06:00:00.000Z"),
    ),
  );
  assert.match(escChip.title, /Escalated/i);
});
