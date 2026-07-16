/**
 * THE STRUNK LAYER — deterministic sentence-mechanics scorer (VOICE-ENGINE-SPEC.md §6).
 *
 * Pure, synchronous, no LLM call. Scores and flags a draft's mechanics — it never
 * blocks, never rewrites, and never gates a send (§6.2/6.3): the truth gates in
 * lib/qa.ts and lib/drafting/llm-lint.ts are the only things allowed to stop a draft.
 * This module only measures. The word/phrase lists below are verbatim from §6.1 and
 * are not meant to be extended here — that's a spec change, not a code change.
 *
 * All matching is case-insensitive and word-boundary matched.
 */

export type StyleRule =
  | "needless"
  | "plain-word"
  | "leech"
  | "hedge"
  | "passive"
  | "long-sentence"
  | "long-paragraph";

export interface StyleFlag {
  rule: StyleRule;
  match: string;
  weight: number;
}

export interface StyleScoreResult {
  score: number;
  flags: StyleFlag[];
}

// ─── word lists, verbatim (§6.1 S1/S6/S7/S8) ────────────────────────────────

const NEEDLESS_PHRASES = [
  "due to the fact that",
  "in order to",
  "at this point in time",
  "at the present time",
  "for the purpose of",
  "in the event that",
  "please be advised",
  "please do not hesitate",
  "it is important to note that",
  "as previously mentioned",
  "at your earliest convenience",
  "kindly",
  "we would like to inform you",
  "in a timely manner",
];

const PLAIN_WORD_TARGETS = ["utilize", "facilitate", "commence", "endeavor", "aforementioned", "herein", "therein"];

const LEECH_WORDS = ["very", "quite", "rather", "really", "fairly", "extremely"];

const HEDGE_TERMS = ["maybe", "perhaps", "possibly", "it seems", "we think", "we believe"];

/** irregular past participles the \w+ed heuristic below would otherwise miss. */
const IRREGULAR_PARTICIPLES = [
  "made",
  "sent",
  "shipped",
  "delayed",
  "told",
  "given",
  "taken",
  "held",
  "kept",
  "built",
  "posted",
  "done",
  "put",
  "set",
  "paid",
];

/** be-form + optional -ly adverb + past participle. A heuristic, not a parser. */
const PASSIVE_RE = new RegExp(
  `\\b(?:is|are|was|were|been|being|be)\\b(?:\\s+\\w+ly\\b)?\\s+(?:\\w+ed|${IRREGULAR_PARTICIPLES.join("|")})\\b`,
  "gi",
);

function escapeRe(s: string): string {
  return s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

/** every case-insensitive, word-boundary match of `phrase` in `text`, in document order. */
function findMatches(text: string, phrase: string): Array<{ index: number; text: string }> {
  const re = new RegExp(`\\b${escapeRe(phrase)}\\b`, "gi");
  return [...text.matchAll(re)].map((m) => ({ index: m.index ?? 0, text: m[0] }));
}

function flagsFor(text: string, phrases: string[], rule: StyleRule, weight: number): StyleFlag[] {
  const flags: StyleFlag[] = [];
  for (const phrase of phrases) {
    for (const m of findMatches(text, phrase)) flags.push({ rule, match: m.text, weight });
  }
  return flags;
}

// ─── sentence / paragraph structure ──────────────────────────────────────────

function splitSentences(text: string): string[] {
  return text
    .replace(/\n+/g, " ")
    .split(/(?<=[.!?])\s+/)
    .map((s) => s.trim())
    .filter(Boolean);
}

function splitParagraphs(text: string): string[] {
  return text
    .split(/\n{2,}/)
    .map((p) => p.trim())
    .filter(Boolean);
}

function wordCount(sentence: string): number {
  return sentence.split(/\s+/).filter(Boolean).length;
}

// ─── the scorer (§6.2) ────────────────────────────────────────────────────

/**
 * styleScore(text) → { score, flags }. score = clamp(100 - 4 * Σ(flag weights), 0, 100).
 * Never a gate — callers log the number (see LlmDrafter's `style_score` event); nothing
 * reads it to decide whether a draft ships.
 */
export function styleScore(text: string): StyleScoreResult {
  const flags: StyleFlag[] = [];

  flags.push(...flagsFor(text, NEEDLESS_PHRASES, "needless", 3));
  flags.push(...flagsFor(text, PLAIN_WORD_TARGETS, "plain-word", 2));
  flags.push(...flagsFor(text, LEECH_WORDS, "leech", 1));

  // S8: one hedge per reply is free. Every instance after the first — across all hedge
  // terms, in document order — is weighted.
  const hedgeMatches = HEDGE_TERMS.flatMap((term) => findMatches(text, term)).sort((a, b) => a.index - b.index);
  for (const m of hedgeMatches.slice(1)) flags.push({ rule: "hedge", match: m.text, weight: 2 });

  for (const m of text.matchAll(PASSIVE_RE)) flags.push({ rule: "passive", match: m[0], weight: 2 });

  for (const sentence of splitSentences(text)) {
    if (wordCount(sentence) > 30) flags.push({ rule: "long-sentence", match: sentence, weight: 2 });
  }

  // S9: paragraphs are units — but only measurable when the text actually has \n\n
  // paragraph structure. A single-block reply never trips this rule.
  if (text.includes("\n\n")) {
    for (const paragraph of splitParagraphs(text)) {
      if (splitSentences(paragraph).length > 3) flags.push({ rule: "long-paragraph", match: paragraph, weight: 1 });
    }
  }

  const totalWeight = flags.reduce((sum, f) => sum + f.weight, 0);
  const score = Math.max(0, Math.min(100, 100 - 4 * totalWeight));
  return { score, flags };
}
