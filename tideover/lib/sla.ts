import type { Sentiment, TicketStatus } from "@/lib/types";

/**
 * SLA first-response timers + attainment (ADR-0016, task C5).
 *
 * A support lead evaluates any support layer on the controls they'd demand
 * internally — first-response SLA timers with breach flags and an attainment
 * number. Tideover already stores the merchant's support windows
 * (`Merchant.slaWindows`) and each ticket's `firstResponseSec`, so every figure
 * here is a COMPUTED FACT, never an invented promise.
 *
 * Proof-only discipline:
 *  - the target is the merchant's own next support window (or a tighter,
 *    transparent escalated cap) — no fixed "4h" fiction that would breach at 2am;
 *  - the basis + thresholds are surfaced so a reviewer can check the math;
 *  - attainment carries its denominator and hides the rate below a small-n floor.
 *
 * Pure + deterministic: no I/O, `now` injectable. Timezones resolve through
 * native `Intl.DateTimeFormat({ timeZone })` — DST-correct, no date library, no
 * fragile fixed offsets.
 */

// ─── tunables (transparent — shown in the UI copy) ──────────────────────────
/** Escalated tickets (hostile / chargeback-threat) get a tighter cap. */
export const ESCALATED_TARGET_HOURS = 2;
/** A ticket this close to (or past) its target flips amber. */
export const NEAR_BREACH_MIN = 60;
/** Below this many answered tickets, attainment reads "collecting", not a rate. */
export const ATTAINMENT_MIN_N = 10;

const HOUR_MS = 3_600_000;
const MIN_MS = 60_000;

// ─── inputs ─────────────────────────────────────────────────────────────────
export interface SlaWindows {
  /** morning support-window start, "H:MM" 24h local (e.g. "9:00"). */
  amStart: string;
  /** afternoon support-window start, "H:MM" 24h local (e.g. "15:00"). */
  pmStart: string;
  /** short label ("ET" | "CET") or a raw IANA zone. */
  tz: string;
}

/**
 * The minimal ticket shape the SLA math needs. A real `Ticket` satisfies it
 * structurally, so call sites pass tickets straight through. Escalation is taken
 * from an explicit `priority` when present, else derived from `sentiment` with
 * the SAME rule the reassurance engine uses — so the timer and the draft agree.
 */
export interface SlaTicket {
  createdAt: string;
  firstResponseSec: number | null;
  status?: TicketStatus;
  sentiment?: Sentiment;
  priority?: "normal" | "escalated";
}

/** The escalation rule, shared verbatim with the reassurance engine. */
export function slaPriority(sentiment: Sentiment): "normal" | "escalated" {
  return sentiment === "hostile" || sentiment === "chargeback-threat" ? "escalated" : "normal";
}

function isEscalated(t: SlaTicket): boolean {
  if (t.priority) return t.priority === "escalated";
  return t.sentiment === "hostile" || t.sentiment === "chargeback-threat";
}

// ─── timezone resolution (native Intl, DST-correct) ─────────────────────────
/** Short merchant labels → IANA zones Intl understands. */
const TZ_LABELS: Record<string, string> = {
  ET: "America/New_York",
  EST: "America/New_York",
  EDT: "America/New_York",
  CT: "America/Chicago",
  MT: "America/Denver",
  PT: "America/Los_Angeles",
  CET: "Europe/Berlin",
  CEST: "Europe/Berlin",
  GMT: "Europe/London",
  BST: "Europe/London",
  UTC: "UTC",
};

/**
 * Resolve a merchant tz label to an IANA zone. Known short labels map through
 * the table; a value that already looks like an IANA name ("Area/City") passes
 * through; anything else falls back to a sane default rather than throwing.
 */
export function resolveTimeZone(tz: string): string {
  const mapped = TZ_LABELS[tz.trim().toUpperCase()];
  if (mapped) return mapped;
  if (tz.includes("/")) return tz;
  return "America/New_York";
}

/** ms offset (local wall time − UTC) that `timeZone` applies at `instantMs`. */
function tzOffsetMs(instantMs: number, timeZone: string): number {
  const parts = new Intl.DateTimeFormat("en-US", {
    timeZone,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hour12: false,
  }).formatToParts(new Date(instantMs));
  const f: Record<string, number> = {};
  for (const p of parts) if (p.type !== "literal") f[p.type] = Number(p.value);
  let hour = f.hour;
  if (hour === 24) hour = 0; // some engines render midnight as "24"
  const asUtc = Date.UTC(f.year, f.month - 1, f.day, hour, f.minute, f.second);
  return asUtc - instantMs;
}

/**
 * The UTC instant (ms) at which the wall clock in `timeZone` reads Y-M-D h:mi.
 * Two-step offset refinement so a DST transition on the target day resolves to
 * the correct instant.
 */
function wallTimeToUtc(
  y: number,
  mo: number,
  d: number,
  h: number,
  mi: number,
  timeZone: string,
): number {
  const guess = Date.UTC(y, mo - 1, d, h, mi, 0);
  const o1 = tzOffsetMs(guess, timeZone);
  let inst = guess - o1;
  const o2 = tzOffsetMs(inst, timeZone);
  if (o2 !== o1) inst = guess - o2;
  return inst;
}

/** The calendar Y-M-D shown by `timeZone` at `instantMs`. */
function localYmd(instantMs: number, timeZone: string): { y: number; mo: number; d: number } {
  const parts = new Intl.DateTimeFormat("en-US", {
    timeZone,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).formatToParts(new Date(instantMs));
  const f: Record<string, number> = {};
  for (const p of parts) if (p.type !== "literal") f[p.type] = Number(p.value);
  return { y: f.year, mo: f.month, d: f.day };
}

function parseHm(hm: string): { h: number; m: number } {
  const [h, m] = hm.split(":");
  return { h: Number(h), m: Number(m ?? 0) };
}

// ─── target ─────────────────────────────────────────────────────────────────
export type SlaBasis = "next-window" | "escalated";

export interface SlaTargetResult {
  /** ISO instant the first response is due. */
  target: string;
  /** what set the target: the next support window, or the tighter escalated cap. */
  basis: SlaBasis;
}

/**
 * The first-response SLA target for a ticket.
 *
 * Base rule: the next `amStart`/`pmStart` window occurrence STRICTLY AFTER
 * `createdAt`, in the merchant's timezone. A ticket arriving before the morning
 * window is due that morning; one arriving mid-afternoon is due next morning.
 *
 * Escalated tickets get the SOONER of that window or `createdAt +
 * ESCALATED_TARGET_HOURS` — the transparent priority tier real teams run.
 *
 * Depends only on `createdAt` + the windows (not on "now").
 */
export function slaTarget(ticket: SlaTicket, slaWindows: SlaWindows): SlaTargetResult {
  const tz = resolveTimeZone(slaWindows.tz);
  const createdMs = new Date(ticket.createdAt).getTime();
  const am = parseHm(slaWindows.amStart);
  const pm = parseHm(slaWindows.pmStart);

  const { y, mo, d } = localYmd(createdMs, tz);
  const candidates: number[] = [];
  // Same local day plus the next two — always enough for a strictly-after window
  // (tomorrow's morning is at most ~48h out), robust across month/year edges and
  // DST (each candidate is resolved through wallTimeToUtc independently).
  for (let dayOffset = 0; dayOffset <= 2; dayOffset++) {
    const day = new Date(Date.UTC(y, mo - 1, d + dayOffset));
    const cy = day.getUTCFullYear();
    const cmo = day.getUTCMonth() + 1;
    const cd = day.getUTCDate();
    for (const w of [am, pm]) {
      const inst = wallTimeToUtc(cy, cmo, cd, w.h, w.m, tz);
      if (inst > createdMs) candidates.push(inst);
    }
  }
  candidates.sort((a, b) => a - b);
  const windowMs = candidates[0];

  if (isEscalated(ticket)) {
    const cappedMs = createdMs + ESCALATED_TARGET_HOURS * HOUR_MS;
    if (cappedMs < windowMs) {
      return { target: new Date(cappedMs).toISOString(), basis: "escalated" };
    }
  }
  return { target: new Date(windowMs).toISOString(), basis: "next-window" };
}

// ─── per-ticket state ───────────────────────────────────────────────────────
export type SlaState = "ok" | "amber" | "breach";

export interface OpenSlaState {
  answered: false;
  state: SlaState;
  target: string;
  basis: SlaBasis;
  /** whole minutes from now to target; negative once breached. */
  minutesToTarget: number;
}

export interface AnsweredSlaState {
  answered: true;
  met: boolean;
  target: string;
  basis: SlaBasis;
  /** the measured response time and the allowed budget, both seconds. */
  responseSec: number;
  budgetSec: number;
}

export type SlaStateResult = OpenSlaState | AnsweredSlaState;

/**
 * The SLA state for one ticket.
 *
 * OPEN (`firstResponseSec == null`): a live countdown to the target — `ok` with
 * room, `amber` within `NEAR_BREACH_MIN` of it, `breach` once past.
 *
 * ANSWERED (`firstResponseSec != null`): met/missed measured against the same
 * target — met when the response landed inside the target budget
 * (`firstResponseSec ≤ target − createdAt`).
 */
export function ticketSlaState(
  ticket: SlaTicket,
  slaWindows: SlaWindows,
  now: Date,
): SlaStateResult {
  const { target, basis } = slaTarget(ticket, slaWindows);
  const targetMs = new Date(target).getTime();
  const createdMs = new Date(ticket.createdAt).getTime();

  if (ticket.firstResponseSec != null) {
    const budgetSec = Math.max(0, Math.round((targetMs - createdMs) / 1000));
    return {
      answered: true,
      met: ticket.firstResponseSec <= budgetSec,
      target,
      basis,
      responseSec: ticket.firstResponseSec,
      budgetSec,
    };
  }

  const nowMs = now.getTime();
  const minutesToTarget = Math.round((targetMs - nowMs) / MIN_MS);
  let state: SlaState;
  if (nowMs > targetMs) state = "breach";
  else if (minutesToTarget <= NEAR_BREACH_MIN) state = "amber";
  else state = "ok";
  return { answered: false, state, target, basis, minutesToTarget };
}

// ─── attainment ─────────────────────────────────────────────────────────────
export interface SlaAttainment {
  /** answered tickets in scope (firstResponseSec != null). */
  answered: number;
  /** of those, how many met their target. */
  met: number;
  /** met / answered — null below ATTAINMENT_MIN_N, so a tiny sample shows no %. */
  rate: number | null;
}

/**
 * Attainment over the answered tickets: met / answered. Deterministic — the
 * per-ticket target depends only on createdAt + the windows, so no `now` is
 * needed. Below ATTAINMENT_MIN_N answered tickets the rate is gated to null and
 * the surface shows "collecting (n=X)" instead of a headline percentage.
 */
export function computeSlaAttainment(
  tickets: SlaTicket[],
  slaWindows: SlaWindows,
): SlaAttainment {
  // `now` is irrelevant on the answered branch of ticketSlaState; epoch is fine.
  const epoch = new Date(0);
  let answered = 0;
  let met = 0;
  for (const t of tickets) {
    if (t.firstResponseSec == null) continue;
    answered += 1;
    const st = ticketSlaState(t, slaWindows, epoch);
    if (st.answered && st.met) met += 1;
  }
  const rate = answered >= ATTAINMENT_MIN_N ? met / answered : null;
  return { answered, met, rate };
}

// ─── display (pure, serializable — safe to hand to a client component) ───────
export type SlaTone = "ok" | "amber" | "red" | "met" | "missed";

export interface SlaChipView {
  tone: SlaTone;
  /** short chip label, e.g. "SLA 2h 10m" / "due in 40m" / "overdue 1d 4h". */
  label: string;
  /** the target basis spelled out, for the chip's title/tooltip. */
  title: string;
}

/** Compact, calm duration: "40m", "2h 10m", "1d 4h". Floored at "1m". */
export function formatSlaDuration(totalMinutes: number): string {
  const mins = Math.max(0, Math.round(totalMinutes));
  if (mins < 60) return `${Math.max(1, mins)}m`;
  const h = Math.floor(mins / 60);
  const m = mins % 60;
  if (h < 24) return m ? `${h}h ${m}m` : `${h}h`;
  const d = Math.floor(h / 24);
  const rh = h % 24;
  return rh ? `${d}d ${rh}h` : `${d}d`;
}

const BASIS_PHRASE: Record<SlaBasis, string> = {
  "next-window": "First response due by the next support window",
  escalated: `Escalated — first response due within ${ESCALATED_TARGET_HOURS}h`,
};

/**
 * Build the serializable chip descriptor for a ticket's SLA state. Pure over the
 * state so it can be computed on the server and handed to the client queue.
 */
export function slaChip(state: SlaStateResult): SlaChipView {
  if (state.answered) {
    const answeredIn = formatSlaDuration(state.responseSec / 60);
    const budget = formatSlaDuration(state.budgetSec / 60);
    return {
      tone: state.met ? "met" : "missed",
      label: state.met ? "SLA met" : "SLA missed",
      title: `${BASIS_PHRASE[state.basis]}. Answered in ${answeredIn} of a ${budget} target.`,
    };
  }
  const dur = formatSlaDuration(Math.abs(state.minutesToTarget));
  if (state.state === "breach") {
    return {
      tone: "red",
      label: `overdue ${dur}`,
      title: `${BASIS_PHRASE[state.basis]}. Past target by ${dur}.`,
    };
  }
  if (state.state === "amber") {
    return {
      tone: "amber",
      label: `due in ${dur}`,
      title: `${BASIS_PHRASE[state.basis]}. Within ${NEAR_BREACH_MIN}m of target.`,
    };
  }
  return {
    tone: "ok",
    label: `SLA ${dur}`,
    title: `${BASIS_PHRASE[state.basis]}. ${dur} to target.`,
  };
}
