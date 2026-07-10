import { blocksSend, scoreReplyChecks } from "@/lib/qa";

/**
 * LLM-OUTPUT-ONLY extended lint (ADR-0018 hardening). lib/proof.ts's
 * containsHardDate (5 regexes) is the shared hard gate that /api/approve-send
 * and the cockpit enforce, and it is frozen with the eval harness — so the
 * extra patterns a prompt-injected model can slip through ("it will arrive by
 * Friday", "within 5 business days, promise", "on the 21st", "3rd of March")
 * live HERE and run only on LLM output. A draft failing ANY check falls back
 * to the DeterministicDrafter, which never emits these shapes.
 *
 * Deliberately aggressive: a false positive costs one deterministic fallback,
 * a false negative is a dated promise in a buyer's inbox. The one shape that
 * must never trip is the engine's own confidence band ("ships in weeks 9–11",
 * "in 9–14 days", "in the next day or two") — pinned by tests against real
 * DeterministicDrafter outputs.
 */

export type LlmLintReason =
  | "hard-date"
  | "weekday-promise"
  | "days-window-guarantee"
  | "ordinal-date"
  | "day-month-date"
  | "holiday-season-promise"
  | "immediate-day-promise"
  | "period-end-promise"
  | "numeric-date";

// Full names plus preposition-guarded abbreviations ("by Fri.", "next Tues").
// The guard prepositions in WEEKDAY_PROMISE keep bare words like "satisfy"
// (sat) or "sunlight" (sun) from ever being reachable.
const WEEKDAY =
  "(?:monday|tuesday|wednesday|thursday|friday|saturday|sunday|mon|tues?|weds?|thur?s?|fri|sat|sun)\\.?";

// month names + abbreviations, day-first order ("3 March", "3rd of Mar").
// "may" is only matched with an ordinal suffix or "of" so "these 3 may ship
// later" can never trip it.
const MONTH_NO_MAY =
  "(?:jan(?:uary)?|feb(?:ruary)?|mar(?:ch)?|apr(?:il)?|jun(?:e)?|jul(?:y)?|aug(?:ust)?|sept?(?:ember)?|oct(?:ober)?|nov(?:ember)?|dec(?:ember)?)";

/** "by Friday", "on Monday", "this Friday", "next Tuesday" — weekday promises. */
const WEEKDAY_PROMISE = new RegExp(`\\b(?:by|on|before|until|this|next|coming)\\s+${WEEKDAY}\\b`, "i");

// "by/within/in N (business) days|weeks|months" — a bounded window stated as
// a limit, digits or spelled quantities ("within three weeks", "in a few
// days"). The engine's own band is always a RANGE with a dash ("in 9–14
// days", "ships in weeks 9–11"): the dash sits between the preposition and
// the quantity (or the unit precedes the number), so this never matches it.
const QUANTITY =
  "(?:\\d+|one|two|three|four|five|six|seven|eight|nine|ten|eleven|twelve|a\\s+couple\\s+of|a\\s+few|an?)";
const DAYS_WINDOW = new RegExp(
  `\\b(?:by|within|inside|in)\\s+(?:the\\s+)?(?:next\\s+)?${QUANTITY}\\s+(?:business\\s+|working\\s+|calendar\\s+)?(?:days?|weeks?|months?)\\b`,
  "i",
);

// a delivery commitment verb — only blocks when paired with DAYS_WINDOW, so
// plain reassurance vocabulary can't false-positive on its own. Includes
// present/future indicative delivery verbs ("ships within 5 business days"
// is a promise even without "guarantee").
const GUARANTEE_VERB =
  /\b(?:guarantee\w*|promise\w*|assur\w*|commit\w*|ships?|arrives?|lands?|delivers?|will\s+(?:arrive|ship|deliver|land|be\s+(?:delivered|shipped|there|with\s+you|at\s+your\s+door)))\b/i;

// "before the holidays", "in time for Christmas", "by early spring" — a
// season or shopping holiday used as a delivery bound. Blocks without verb
// pairing: the engine never anchors to calendar events, so any hit is a
// model-invented promise.
const HOLIDAY_SEASON_PROMISE =
  /\b(?:by|before|until|around|in\s+time\s+for|ahead\s+of|this|next)\s+(?:the\s+)?(?:early\s+|mid-?|late\s+)?(?:holidays?|holiday\s+season|christmas|xmas|black\s+friday|cyber\s+monday|thanksgiving|new\s+year(?:'s)?(?:\s+eve)?|easter|halloween|valentine'?s(?:\s+day)?|mother'?s\s+day|father'?s\s+day|spring|summer|fall|autumn|winter)\b/i;

// "by tomorrow", "arrives today", "shipping tonight" — immediate-day promises.
const IMMEDIATE_DAY_PROMISE =
  /\b(?:by|before|until)\s+(?:tomorrow|tonight|today)\b|\b(?:arriv|ship|deliver|land)\w*\s+(?:tomorrow|tonight|today)\b/i;

// "by the end of the week/month/quarter/year" — a period boundary as a bound.
const PERIOD_END_PROMISE =
  /\b(?:by|before|until|at)\s+(?:the\s+)?end\s+of\s+(?:the\s+|this\s+|next\s+)?(?:day|week|month|quarter|year)\b/i;

// "by 12/25", "on 3/14" — year-less numeric dates the shared slash-date
// regex (which requires a year) misses.
const NUMERIC_DATE = /\b(?:by|on|before|until|around)\s+\d{1,2}\/\d{1,2}(?:\/\d{2,4})?\b/i;

/** "on the 21st", "by the 3rd", "the 15th" — ordinal calendar dates. */
const ORDINAL_DATE = /\b(?:the|on|by|before|until|around)\s+(?:the\s+)?\d{1,2}\s*(?:st|nd|rd|th)\b/i;

/** day-first month dates the shared month-first regex misses: "3 March", "3rd of Mar", "1st of May". */
const DAY_MONTH_DATE = new RegExp(
  `\\b\\d{1,2}(?:st|nd|rd|th)?\\s+(?:of\\s+)?${MONTH_NO_MAY}\\b|\\b\\d{1,2}(?:st|nd|rd|th)\\s+(?:of\\s+)?may\\b|\\b\\d{1,2}\\s+of\\s+may\\b`,
  "i",
);

/**
 * The full send-gate for an LLM draft: the shared blocksSend hard gate
 * (containsHardDate via lib/qa.ts — identical to /api/approve-send) PLUS the
 * extended patterns above. Returns the first failing reason, or null when the
 * draft is clean. Callers treat ANY non-null as "use the deterministic floor".
 */
export function llmDraftBlocked(text: string): LlmLintReason | null {
  if (blocksSend(scoreReplyChecks({ text, firstName: "" }))) return "hard-date";
  if (WEEKDAY_PROMISE.test(text)) return "weekday-promise";
  if (DAYS_WINDOW.test(text) && GUARANTEE_VERB.test(text)) return "days-window-guarantee";
  if (ORDINAL_DATE.test(text)) return "ordinal-date";
  if (DAY_MONTH_DATE.test(text)) return "day-month-date";
  if (HOLIDAY_SEASON_PROMISE.test(text)) return "holiday-season-promise";
  if (IMMEDIATE_DAY_PROMISE.test(text)) return "immediate-day-promise";
  if (PERIOD_END_PROMISE.test(text)) return "period-end-promise";
  if (NUMERIC_DATE.test(text)) return "numeric-date";
  return null;
}

/**
 * Injection dampener for customer-derived fields interpolated into the system
 * prompt (firstName arrives from ticket ingest / CSV import). Strips newlines
 * and control characters so a crafted value can never open a new prompt line,
 * collapses whitespace, and caps length. Cheap, lossless for real names.
 */
export function sanitizeInline(value: string, maxLength = 120): string {
  return (
    value
      // eslint-disable-next-line no-control-regex -- stripping control chars is the point
      .replace(/[\u0000-\u001f\u007f-\u009f\u2028\u2029]+/g, " ")
      .replace(/\s+/g, " ")
      .trim()
      .slice(0, maxLength)
  );
}
