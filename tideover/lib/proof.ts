/**
 * Proof-only guardrails. Tideover never fabricates metrics/testimonials and
 * never promises a hard delivery date. These helpers make that enforceable at
 * runtime; scripts/proof-lint.mjs enforces it across source at build time.
 */

/** literal placeholder string used wherever a real case study would go. */
export const CASE_STUDY_PLACEHOLDER =
  "[CASE STUDY PLACEHOLDER — refund-reduction delta, post first completed cohort]";

// matches things that look like a specific calendar date / hard ship date
const HARD_DATE_PATTERNS: RegExp[] = [
  /\b\d{4}-\d{2}-\d{2}\b/, // 2026-07-14
  /\b(?:jan|feb|mar|apr|may|jun|jul|aug|sep|oct|nov|dec)[a-z]*\.?\s+\d{1,2}(?:st|nd|rd|th)?\b/i,
  /\b\d{1,2}\/\d{1,2}\/\d{2,4}\b/, // 7/14/26
  /\bships?\s+on\s+\w/i, // "ships on ..."
  /\bguarantee\w*\s+(?:delivery|ship|arrival)\b/i,
];

/** true if the text contains a hard date / hard delivery promise. */
export function containsHardDate(text: string): boolean {
  return HARD_DATE_PATTERNS.some((re) => re.test(text));
}

/**
 * Assert a customer-facing reply uses only honest confidence bands. Throws in
 * dev so a bad template fails loudly before it can reach a customer.
 */
export function assertNoHardDate(text: string): void {
  if (containsHardDate(text)) {
    throw new Error(
      `proof-only violation: reply appears to contain a hard delivery date. Use a confidence band instead. Text: ${text.slice(0, 140)}…`,
    );
  }
}

/** format an external statistic with its required source citation. */
export function citedStat(stat: string, source: string): string {
  return `${stat} (Source: ${source})`;
}
