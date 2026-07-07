/**
 * Escalation self-flag (UX-10 / EN-25).
 *
 * "Escalate" is a persisted, operator-owned follow-up flag — NOT a manager
 * notification (nothing is dispatched to anyone). It rides the ticket's existing
 * `tags` array, reusing the same tag pattern as `gift-sent:*` so it works on both
 * repository drivers with NO new schema field.
 *
 * Tag shape:  escalated-by:{operator}:{iso}[:{reason}]
 *   - {operator}  the operator who flagged it (sanitized: no colons/newlines)
 *   - {iso}       the flag instant, a full ISO-8601 timestamp
 *   - {reason}    an optional short free-text note (single line, capped)
 *
 * Parsing anchors on the fixed ISO-8601 shape in the middle so the leading
 * operator and trailing reason are recovered unambiguously even though the ISO
 * itself contains colons.
 */

export const ESCALATION_TAG_PREFIX = "escalated-by:";

/** Longest reason we keep on the tag — a flag note, not an essay. */
const REASON_MAX = 200;

/** Strip colons/newlines so a segment can't corrupt the tag's delimiters. */
function sanitizeSegment(raw: string): string {
  return raw.replace(/[:\n\r]+/g, " ").trim();
}

/** Reason may contain colons (it's the trailing segment) but stays single-line. */
function sanitizeReason(raw: string): string {
  return raw.replace(/[\n\r]+/g, " ").trim().slice(0, REASON_MAX);
}

/** Build a well-formed escalation tag. `at` accepts a Date or an ISO string. */
export function formatEscalationTag(operator: string, at: Date | string, reason?: string): string {
  const op = sanitizeSegment(operator) || "operator";
  const iso = typeof at === "string" ? at : at.toISOString();
  const base = `${ESCALATION_TAG_PREFIX}${op}:${iso}`;
  const r = reason ? sanitizeReason(reason) : "";
  return r ? `${base}:${r}` : base;
}

/** True for any escalation tag (cheap prefix check — mirrors gift-sent:*). */
export function isEscalationTag(tag: string): boolean {
  return tag.startsWith(ESCALATION_TAG_PREFIX);
}

/** True when a ticket carries at least one escalation flag. */
export function isFlagged(tags: readonly string[]): boolean {
  return tags.some(isEscalationTag);
}

const ISO_8601 = "\\d{4}-\\d{2}-\\d{2}T\\d{2}:\\d{2}:\\d{2}(?:\\.\\d+)?Z";
// operator is non-greedy up to the colon that precedes the ISO instant; reason
// (if any) is everything after the ISO's trailing "Z".
const ESCALATION_RE = new RegExp(`^escalated-by:(.*?):(${ISO_8601})(?::(.*))?$`);

export interface ParsedEscalation {
  operator: string;
  /** ISO-8601 instant the flag was set. */
  at: string;
  reason?: string;
}

/** Parse a well-formed escalation tag, or null if it isn't one. */
export function parseEscalationTag(tag: string): ParsedEscalation | null {
  const m = ESCALATION_RE.exec(tag);
  if (!m) return null;
  const reason = m[3] && m[3].length > 0 ? m[3] : undefined;
  return reason ? { operator: m[1], at: m[2], reason } : { operator: m[1], at: m[2] };
}
