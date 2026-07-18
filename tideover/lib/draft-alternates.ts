import { containsHardDate } from "@/lib/proof";

/**
 * C2 — Draft alternates {standard, brief, de-escalate}.
 *
 * The operator can toggle between three views of the SAME reassurance reply before
 * approving/sending. All three are derived, never invented:
 *
 *  - `standard`    — the reassurance engine's draftText, exactly as it ships today.
 *  - `deEscalate`  — the engine's draftText recomputed with the ticket's sentiment
 *                    overridden to the highest-distress path (chargeback-threat).
 *                    The engine itself is untouched — only its INPUT changes — so
 *                    the 55 goldens + 52,440 invariants stay byte-stable. draftText
 *                    is currently sentiment-invariant, so this typically equals
 *                    `standard`; that is acceptable (proof-only: surface only what
 *                    the engine actually produces, never a fabricated calmer reply).
 *  - `brief`       — a deterministic, proof-preserving shortening of `standard`.
 *
 * This module is pure string logic (no engine/repo imports beyond the proof
 * guard) so it is trivially unit-testable. The engine calls that produce
 * `standard` and `deEscalate` live in the service wrapper (`getDraftAlternates`).
 */

export interface DraftAlternates {
  standard: string;
  brief: string;
  deEscalate: string;
}

export interface AlternatesContext {
  /** the reassurance engine's draftText for the ticket's real sentiment (ships as-is). */
  standard: string;
  /** the engine's draftText recomputed with sentiment overridden to chargeback-threat. */
  deEscalate: string;
  /**
   * The exact band phrase embedded in `standard` that the shortener must never
   * drop or truncate — the engine's resolved `eta_band` (see `embeddedBandPhrase`).
   */
  bandPhrase: string;
  /** the merchant sign-off the engine appends to every draft (`brand.signoff`). */
  signoff: string;
}

/**
 * The reassurance engine's overdue `eta_band` phrase, mirrored verbatim from
 * lib/engines/reassurance.ts. The engine is frozen (golden/invariant coverage),
 * so this literal is stable. Used only to LOCATE the band inside a standard draft
 * for the brief shortener — it never edits engine output.
 */
export const OVERDUE_ETA_PHRASE = "as soon as it's ready, and I'll update you the moment it moves";

/**
 * The band phrase actually embedded in a draft body — the engine's resolved
 * `eta_band`. For an on-track order this is `confidenceBand` minus its leading
 * "ships " (e.g. "in weeks 9–11"); for an overdue order the engine substitutes a
 * grammatically-neutral phrase instead of the sentence-form band. Deriving it the
 * same way the engine does keeps the shortener aligned without importing engine
 * internals.
 */
export function embeddedBandPhrase(confidenceBand: string, overdue: boolean): string {
  return overdue ? OVERDUE_ETA_PHRASE : confidenceBand.replace(/^ships\s+/i, "");
}

/**
 * Split a single-paragraph draft body into sentences, preserving terminal
 * punctuation. Splits only on . ! ? followed by whitespace or end-of-string —
 * colons, em-dashes and en-dashed number ranges ("weeks 9–11") are NOT boundaries.
 */
function splitSentences(body: string): string[] {
  const matches = body.match(/[^.!?]+[.!?]+(?=\s|$)|[^.!?]+$/g);
  return (matches ?? [body]).map((s) => s.trim()).filter(Boolean);
}

/**
 * Deterministic proof-preserving shortener of the STANDARD draft. Keeps the
 * opening line (greeting/acknowledgement) and the sentence carrying the
 * confidence band / ETA, keeps the sign-off verbatim, and drops only the middle
 * elaboration. It NEVER drops or truncates the band and NEVER introduces a hard
 * date — the result is re-checked with `containsHardDate`, and ANY doubt
 * (missing band, unlocatable sign-off, self-check trip, or a result no shorter
 * than the original) falls back to returning `standard` unchanged.
 */
export function shortenToBrief(
  standard: string,
  { bandPhrase, signoff }: { bandPhrase: string; signoff: string },
): string {
  if (!bandPhrase || !standard.includes(bandPhrase)) return standard;

  // Separate the sign-off (the engine appends it as `\n\n${signoff}`) from the body.
  const marker = `\n\n${signoff}`;
  let body: string;
  let tail: string;
  if (signoff && standard.endsWith(marker)) {
    body = standard.slice(0, standard.length - marker.length);
    tail = marker;
  } else {
    const idx = standard.lastIndexOf("\n\n");
    if (idx === -1) return standard; // can't isolate a sign-off → don't risk shortening.
    body = standard.slice(0, idx);
    tail = standard.slice(idx);
  }

  const sentences = splitSentences(body);
  if (sentences.length <= 1) return standard; // nothing safe to drop.

  const bandIdx = sentences.findIndex((s) => s.includes(bandPhrase));
  if (bandIdx === -1) return standard; // band sits across a boundary → don't shorten.

  // Keep the greeting (first sentence) + the band-bearing sentence, in order.
  const keep = new Set<number>([0, bandIdx]);
  const kept = sentences.filter((_, i) => keep.has(i));
  if (kept.length === sentences.length) return standard; // nothing was dropped.

  const brief = `${kept.join(" ")}${tail}`;

  // Proof-only self-checks: the band must survive, no hard date may appear, and a
  // "brief" must never be longer than the standard it shortened.
  if (!brief.includes(bandPhrase)) return standard;
  if (containsHardDate(brief)) return standard;
  if (brief.length > standard.length) return standard;
  return brief;
}

/**
 * Assemble the three alternates from already-computed engine outputs. Pure: the
 * caller (the service wrapper) performs the two engine calls that produce
 * `standard` and `deEscalate`; this only shortens the standard into `brief`.
 */
export function generateAlternates(ctx: AlternatesContext): DraftAlternates {
  return {
    standard: ctx.standard,
    brief: shortenToBrief(ctx.standard, { bandPhrase: ctx.bandPhrase, signoff: ctx.signoff }),
    deEscalate: ctx.deEscalate,
  };
}
