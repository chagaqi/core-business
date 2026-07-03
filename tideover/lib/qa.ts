/**
 * Reply QA (ADR-0014, task E4) — a CHECKLIST of measured properties on the
 * drafted/edited reply, never a fabricated quality score.
 *
 * Four dimensions. TWO are AUTO (objective facts computed from the text):
 *  - noHardDate  — the HARD GATE. Reuses containsHardDate (lib/proof.ts), the
 *    same predicate /api/approve-send enforces server-side. A hard date makes a
 *    reply physically un-sendable; this surfaces it in the cockpit first.
 *  - personalized — the customer's first name appears in the reply.
 * TWO are GUIDANCE (informational reminders from simple deterministic keyword
 * heuristics, shown as prompts — NEVER a numeric pass/fail percentage, which
 * proof-only forbids):
 *  - acknowledgesWait — the reply names the wait.
 *  - specificToOrder  — the reply references the production stage / timeline.
 *
 * The module reports FACTS (hard-date present? name present? keyword present?),
 * so it stays proof-only. Only the hard-date row blocks the send.
 */
import { containsHardDate } from "@/lib/proof";

export type CheckKind = "auto" | "guidance";
export type CheckKey = "noHardDate" | "personalized" | "acknowledgesWait" | "specificToOrder";

/** One rendered checklist row: a measured fact plus how to present it. */
export interface ReplyCheckDimension {
  key: CheckKey;
  label: string;
  kind: CheckKind;
  /** the measured fact: true = property present (auto) / heuristic fired (guidance). */
  pass: boolean;
  /** true ONLY for the hard-date row — the single dimension that blocks a send. */
  blocking: boolean;
  /** short reminder shown when the property is absent; guidance rows always inform. */
  hint: string;
}

export interface ReplyChecks {
  /** AUTO + HARD GATE: no hard delivery date in the text. */
  noHardDate: boolean;
  /** AUTO: the customer's first name appears in the text. */
  personalized: boolean;
  /** GUIDANCE: the reply names the wait (keyword heuristic). */
  acknowledgesWait: boolean;
  /** GUIDANCE: the reply references the production stage / timeline (keyword heuristic). */
  specificToOrder: boolean;
  /** the four dimensions in display order, carrying their presentation metadata. */
  dimensions: ReplyCheckDimension[];
}

// Deterministic keyword heuristics for the two GUIDANCE dimensions. These are
// reminders, not a graded score — presence of any keyword flips the prompt to
// "met". Substring match on the lower-cased text.
const WAIT_KEYWORDS = [
  "wait",
  "waiting",
  "patience",
  "hang tight",
  "so long",
  "long time",
  "a while",
  "still",
  "a month in",
  "a week",
];

const ORDER_KEYWORDS = [
  // production-stage vocabulary
  "sourcing",
  "tooling",
  "production",
  "qc",
  "quality",
  "freight",
  "dispatch",
  // timeline / status vocabulary
  "stage",
  "window",
  "eta",
  "week",
  "schedule",
  "on schedule",
  "tracking",
  "next stage",
  "timeline",
];

function includesAny(haystack: string, needles: string[]): boolean {
  return needles.some((n) => haystack.includes(n));
}

/**
 * Score the four QA dimensions for a reply. Pure + deterministic — no I/O, no
 * randomness — so it is unit-testable and safe to run in the browser as the
 * operator edits. `firstName` is the customer's first name for the personalized
 * check; a blank name can never "pass" it.
 */
export function scoreReplyChecks({ text, firstName }: { text: string; firstName: string }): ReplyChecks {
  const lower = text.toLowerCase();
  const name = firstName.trim().toLowerCase();

  const noHardDate = !containsHardDate(text);
  const personalized = name.length > 0 && lower.includes(name);
  const acknowledgesWait = includesAny(lower, WAIT_KEYWORDS);
  const specificToOrder = includesAny(lower, ORDER_KEYWORDS);

  const dimensions: ReplyCheckDimension[] = [
    {
      key: "noHardDate",
      label: "No hard delivery date",
      kind: "auto",
      pass: noHardDate,
      blocking: true,
      hint: "Blocked — Tideover only sends confidence bands, never a promised date. Remove it to send.",
    },
    {
      key: "personalized",
      label: "Personalized",
      kind: "auto",
      pass: personalized,
      blocking: false,
      hint: "The customer's first name isn't in the reply.",
    },
    {
      key: "acknowledgesWait",
      label: "Acknowledges the wait",
      kind: "guidance",
      pass: acknowledgesWait,
      blocking: false,
      hint: "Guidance: consider naming the wait so it doesn't read like a brush-off.",
    },
    {
      key: "specificToOrder",
      label: "Specific to the order",
      kind: "guidance",
      pass: specificToOrder,
      blocking: false,
      hint: "Guidance: reference the production stage or timeline so it reads bespoke.",
    },
  ];

  return { noHardDate, personalized, acknowledgesWait, specificToOrder, dimensions };
}

/**
 * The one hard gate: a reply with a hard delivery date cannot be sent. Mirrors
 * the server-side assertNoHardDate enforcement in /api/approve-send — the UI
 * uses this to disable the send affordance, the server enforces it regardless.
 */
export function blocksSend(checks: ReplyChecks): boolean {
  return !checks.noHardDate;
}
