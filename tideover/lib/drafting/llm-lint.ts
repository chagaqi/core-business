import { capabilityCommitment, type CapabilityKey } from "@/lib/drafting/capabilities";
import { blocksSend, scoreReplyChecks } from "@/lib/qa";

/**
 * THE SEND GATE for LLM output (ADR-0018 hardening, rebuilt after the ten-merchant
 * run — docs/sim-2026-07-12).
 *
 * lib/proof.ts's containsHardDate (5 regexes) is the shared hard gate that
 * /api/approve-send and the cockpit enforce, and it is frozen with the eval harness.
 * Everything else lives HERE and runs only on LLM output.
 *
 * WHAT THE RUN PROVED THE OLD GATE WAS.
 *
 * 1. IT BLOCKED FOR THE WRONG REASON. The old rule ANDed two regexes across the WHOLE
 *    document: `DAYS_WINDOW && GUARANTEE_VERB`. On the p09 address draft, DAYS_WINDOW
 *    matched the model quoting the customer's own wait back at her as empathy ("two
 *    moves in 105 days is a lot") and GUARANTEE_VERB matched "ships" — which is inside
 *    OUR OWN confidence-band token ("ships in weeks 5–7") and therefore fires on 122 of
 *    136 drafts. The live rule was really "block any draft that says 'in N days'
 *    anywhere". A promise is not a co-occurrence. It is a FORWARD-LOOKING COMMITMENT
 *    about THIS order, and it is now matched as one: a delivery verb and a bounded
 *    window ADJACENT, inside a single sentence, with the engine's own band language
 *    masked out first and therefore always legal.
 *
 * 2. IT HAD NO CONCEPT OF A PROMISE WE CANNOT KEEP. The genuinely dangerous line in the
 *    run was not a date — it was "We'll send a confirmation when your address is updated
 *    in our system", against a domain model with no address field. Five drafts made that
 *    class of promise. The capability lint (lib/drafting/capabilities.ts) is now the
 *    FIRST thing checked after the hard-date gate.
 *
 * 3. THE MERCHANT'S BANNED WORDS WERE PROMPT-ONLY. `merchant.brand.banned` was injected
 *    into the system prompt and never checked afterwards; p02 shipped "as soon as" with
 *    "soon" on its banned list, and p04 banned "on schedule" and got "on track". The list
 *    is now enforced on the output, word-boundary aware and regex-safe.
 *
 * A draft failing ANY check is replaced by the SAFE floor (lib/drafting/safe-floor.ts) —
 * which, unlike the old floor, refuses to answer a question it has no script for rather
 * than answering a different question confidently.
 *
 * The one shape that must never trip is the engine's own confidence band ("ships in
 * weeks 9–11", "in 9–14 days", "in the next day or two") — masked below, and pinned by
 * a test that runs every real reassurance-engine output in the seed through this gate.
 */

export type CapabilityReason = `capability:${CapabilityKey}`;

export type LlmLintReason =
  | "hard-date"
  | "weekday-promise"
  | "days-window-guarantee"
  | "ordinal-date"
  | "day-month-date"
  | "holiday-season-promise"
  | "immediate-day-promise"
  | "period-end-promise"
  | "numeric-date"
  | "banned-phrase"
  | CapabilityReason;

export interface LlmLintOptions {
  /** merchant.brand.banned — enforced on the OUTPUT now, not just in the prompt. */
  banned?: string[];
  /** the engine's verbatim confidence band. Always legal, whatever shape it takes. */
  band?: string;
  /** capability keys this merchant ACTUALLY has (see capabilities.ts). Default: none. */
  capabilities?: Iterable<CapabilityKey | string>;
}

// ─── the engine's own language, always legal ────────────────────────────────

/**
 * The band shapes lib/time.ts formatBand can emit, plus the weeks band the status board
 * renders. These are the product's SANCTIONED timing language — the model is instructed
 * to quote them verbatim — so they are masked out of the text BEFORE any promise pattern
 * runs. This is what makes "ships in 9–14 days" legal and "ships in 14 days" a promise.
 */
const BAND_SHAPES: RegExp[] = [
  /\b(?:in|within)\s+weeks?\s+\d+\s*[–—-]\s*\d+/gi, // "in weeks 9–11"
  /\bweeks?\s+\d+\s*[–—-]\s*\d+/gi, // "weeks 9–11" (status board / disclosed ETA)
  /\b(?:in|within)\s+\d+\s*[–—-]\s*\d+\s+(?:days?|weeks?|months?)/gi, // "in 9–14 days"
  /\b(?:in|within)\s+about\s+\d+\s+(?:days?|weeks?|months?)/gi, // "in about 3 weeks"
  /\babout\s+\d+\s+weeks?\b/gi,
  /\bin\s+the\s+next\s+day\s+or\s+two\b/gi,
  /\brunning\s+a\s+little\s+longer\s+than\s+planned\b/gi, // the overdue band
];

function escapeRe(s: string): string {
  return s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

/**
 * Replace every occurrence of the engine's own band language with a neutral token, so a
 * promise pattern can never fire ON the thing we told the model to say. The caller's
 * `band` (the exact string in the prompt) is masked first, then the general shapes.
 */
export function maskBands(text: string, band?: string): string {
  let out = text;
  const b = band?.trim();
  if (b) out = out.replace(new RegExp(escapeRe(b), "gi"), " [band] ");
  for (const re of BAND_SHAPES) out = out.replace(re, " [band] ");
  return out;
}

// ─── date lexicon (unchanged catches) ───────────────────────────────────────

// Full names plus preposition-guarded abbreviations ("by Fri.", "next Tues").
const WEEKDAY =
  "(?:monday|tuesday|wednesday|thursday|friday|saturday|sunday|mon|tues?|weds?|thur?s?|fri|sat|sun)\\.?";

// month names + abbreviations, day-first order ("3 March", "3rd of Mar").
const MONTH_NO_MAY =
  "(?:jan(?:uary)?|feb(?:ruary)?|mar(?:ch)?|apr(?:il)?|jun(?:e)?|jul(?:y)?|aug(?:ust)?|sept?(?:ember)?|oct(?:ober)?|nov(?:ember)?|dec(?:ember)?)";

/** "by Friday", "on Monday", "this Friday", "next Tuesday" — weekday promises. */
const WEEKDAY_PROMISE = new RegExp(`\\b(?:by|on|before|until|this|next|coming)\\s+${WEEKDAY}\\b`, "i");

// "before the holidays", "in time for Christmas", "by early spring".
const HOLIDAY_SEASON_PROMISE =
  /\b(?:by|before|until|around|in\s+time\s+for|ahead\s+of|this|next)\s+(?:the\s+)?(?:early\s+|mid-?|late\s+)?(?:holidays?|holiday\s+season|christmas|xmas|black\s+friday|cyber\s+monday|thanksgiving|new\s+year(?:'s)?(?:\s+eve)?|easter|halloween|valentine'?s(?:\s+day)?|mother'?s\s+day|father'?s\s+day|spring|summer|fall|autumn|winter)\b/i;

// "by tomorrow", "arrives today", "shipping tonight".
const IMMEDIATE_DAY_PROMISE =
  /\b(?:by|before|until)\s+(?:tomorrow|tonight|today)\b|\b(?:arriv|ship|deliver|land)\w*\s+(?:tomorrow|tonight|today)\b/i;

// "by the end of the week/month/quarter/year".
const PERIOD_END_PROMISE =
  /\b(?:by|before|until|at)\s+(?:the\s+)?end\s+of\s+(?:the\s+|this\s+|next\s+)?(?:day|week|month|quarter|year)\b/i;

// "by 12/25", "on 3/14" — year-less numeric dates the shared slash-date regex misses.
const NUMERIC_DATE = /\b(?:by|on|before|until|around)\s+\d{1,2}\/\d{1,2}(?:\/\d{2,4})?\b/i;

/** "on the 21st", "by the 3rd", "the 15th" — ordinal calendar dates. */
const ORDINAL_DATE = /\b(?:the|on|by|before|until|around)\s+(?:the\s+)?\d{1,2}\s*(?:st|nd|rd|th)\b/i;

/** day-first month dates: "3 March", "3rd of Mar", "1st of May". */
const DAY_MONTH_DATE = new RegExp(
  `\\b\\d{1,2}(?:st|nd|rd|th)?\\s+(?:of\\s+)?${MONTH_NO_MAY}\\b|\\b\\d{1,2}(?:st|nd|rd|th)\\s+(?:of\\s+)?may\\b|\\b\\d{1,2}\\s+of\\s+may\\b`,
  "i",
);

// ─── the forward-looking delivery promise (rebuilt) ─────────────────────────

const QUANTITY =
  "(?:\\d+|one|two|three|four|five|six|seven|eight|nine|ten|eleven|twelve|a\\s+couple\\s+of|a\\s+few|an?)";

/** a bounded window stated as a limit: "within 5 business days", "in two weeks". */
const WINDOW = `(?:by|within|inside|in)\\s+(?:the\\s+)?(?:next\\s+)?${QUANTITY}\\s+(?:business\\s+|working\\s+|calendar\\s+)?(?:days?|weeks?|months?)`;

/** a physical delivery event happening TO THIS ORDER. */
const DELIVERY = `(?:ship(?:s|ping|ped)?|arriv(?:e|es|ing)|deliver(?:s|y|ed|ing)?|land(?:s|ing)?|dispatch(?:es|ed|ing)?|go(?:es|ing)?\\s+out|leav(?:e|es|ing)|be\\s+(?:there|delivered|shipped|dispatched|with\\s+you|in\\s+your\\s+hands|at\\s+your\\s+door))`;

/** the language of a guarantee, in any voice. */
const COMMIT = `(?:guarantee\\w*|promis\\w*|assur\\w*|commit\\w*|count\\s+on\\s+it|you\\s+have\\s+my\\s+word|for\\s+sure|no\\s+later\\s+than)`;

/** up to three words of slack between the two halves of the promise. */
const GAP = "(?:\\s+[\\w'’,-]+){0,3}\\s+";

/** "ships within 5 business days", "will arrive in 3 days", "dispatch by 10 days". */
const PROMISE_VERB_FIRST = new RegExp(`\\b${DELIVERY}${GAP}${WINDOW}\\b`, "i");
/** "in 3 days it will arrive" — the same promise, stated backwards. */
const PROMISE_WINDOW_FIRST = new RegExp(`\\b${WINDOW}${GAP}(?:will\\s+|you'll\\s+|it'll\\s+|it\\s+)?${DELIVERY}\\b`, "i");
/** a window and a guarantee in the same sentence: "within 5 business days, promise." */
const WINDOW_RE = new RegExp(`\\b${WINDOW}\\b`, "i");
const COMMIT_RE = new RegExp(`\\b${COMMIT}\\b`, "i");

/** Sentence-scoped, because a promise lives in a sentence — never across a document. */
function sentences(text: string): string[] {
  return text.split(/(?<=[.!?;:])\s+|\n+/).filter((s) => s.trim().length > 0);
}

/**
 * Is there a forward-looking delivery commitment with a bounded window? Runs on
 * band-masked text: the engine's own band is never a promise, whatever it contains.
 */
function hasDeliveryPromise(masked: string): boolean {
  for (const s of sentences(masked)) {
    if (PROMISE_VERB_FIRST.test(s)) return true;
    if (PROMISE_WINDOW_FIRST.test(s)) return true;
    if (WINDOW_RE.test(s) && COMMIT_RE.test(s)) return true;
  }
  return false;
}

// ─── the merchant's banned list, enforced ───────────────────────────────────

/**
 * The first banned phrase present in the text, or null. Word-boundary aware where the
 * phrase has word edges (so "soon" catches "as soon as" but not "spoon"), and plain
 * substring where it does not (a merchant bans "!!" — `\b!!\b` can never match, which is
 * exactly the bug in the engine's own stripBanned). Regex-safe: the merchant types this.
 */
export function bannedPhraseIn(text: string, banned: string[] | undefined): string | null {
  for (const raw of banned ?? []) {
    const phrase = raw.trim();
    if (!phrase) continue;
    const lead = /^\w/.test(phrase) ? "\\b" : "";
    const tail = /\w$/.test(phrase) ? "\\b" : "";
    if (new RegExp(`${lead}${escapeRe(phrase)}${tail}`, "i").test(text)) return phrase;
  }
  return null;
}

// ─── the gate ───────────────────────────────────────────────────────────────

/**
 * The full send-gate for an LLM draft. Order is deliberate:
 *   1. the shared hard-date gate (identical to /api/approve-send);
 *   2. the CAPABILITY lint — a promise we cannot keep is the worst thing we can send,
 *      and it must be reported as itself, not misdiagnosed as a date;
 *   3. the merchant's banned list;
 *   4. the date lexicon + the forward-looking delivery promise.
 * Returns the first failing reason, or null. Any non-null → the SAFE floor.
 */
export function llmDraftBlocked(text: string, opts: LlmLintOptions = {}): LlmLintReason | null {
  if (blocksSend(scoreReplyChecks({ text, firstName: "" }))) return "hard-date";

  const capability = capabilityCommitment(text, opts.capabilities ?? []);
  if (capability) return `capability:${capability.key}`;

  if (bannedPhraseIn(text, opts.banned)) return "banned-phrase";

  const masked = maskBands(text, opts.band);
  if (WEEKDAY_PROMISE.test(masked)) return "weekday-promise";
  if (hasDeliveryPromise(masked)) return "days-window-guarantee";
  if (ORDINAL_DATE.test(masked)) return "ordinal-date";
  if (DAY_MONTH_DATE.test(masked)) return "day-month-date";
  if (HOLIDAY_SEASON_PROMISE.test(masked)) return "holiday-season-promise";
  if (IMMEDIATE_DAY_PROMISE.test(masked)) return "immediate-day-promise";
  if (PERIOD_END_PROMISE.test(masked)) return "period-end-promise";
  if (NUMERIC_DATE.test(masked)) return "numeric-date";
  return null;
}

/** The banned phrase that fired, for the structured warn. Merchant config, never buyer text. */
export function bannedPhraseFor(text: string, banned: string[] | undefined): string | null {
  return bannedPhraseIn(text, banned);
}

/**
 * Injection dampener for customer-derived fields interpolated into the system prompt
 * (firstName arrives from ticket ingest / CSV import). Strips newlines and control
 * characters so a crafted value can never open a new prompt line, collapses whitespace,
 * and caps length. Cheap, lossless for real names.
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
