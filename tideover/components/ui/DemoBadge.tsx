/**
 * Persistent SAMPLE DATA marker for interactive demo surfaces.
 *
 * A small, FIXED corner pill (bottom-right, pointer-events:none) that stays
 * visible in any screenshot of a demo environment, so a screenshot of the hosted
 * demo can never circulate as a real merchant's live data. It is deliberately
 * distinct from the big diagonal `.ev-watermark` print overlay on the proof
 * artifacts (baseline / evidence / scripts): that one guards printed PDFs; this
 * is the lightweight, always-on marker for the interactive screens. The two do
 * not overlap — the watermark is centered, this pill sits in the bottom-right
 * corner — so they coexist cleanly on the three pages that carry both.
 *
 * Styling lives in globals.css (`.demo-badge`) to match the `.ev-watermark`
 * pattern. Presentational only, so it renders as a server component.
 *
 * GATING is the caller's job (this component never reads env or data):
 *  - app/app/layout.tsx → rendered when DEMO_MODE !== "false" (the whole hosted
 *    operator app is sample data; a real pilot sets DEMO_MODE=false → no badge).
 *  - /status/[token]    → rendered when the order's merchant.isDemo is true
 *    (per-merchant, so it's correct on any deployment).
 */
export function DemoBadge() {
  return (
    <span
      className="demo-badge"
      role="note"
      aria-label="Sample data — demo environment"
    >
      Sample data
    </span>
  );
}
