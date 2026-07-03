import { clsx } from "clsx";
import { bandVariance } from "@/lib/time";
import { readableAccent } from "@/lib/color";
import type { OrderTimeline } from "@/lib/types";

/**
 * Elapsed-time framing shown ABOVE the confidence band: "Day N of your ~lo–hi-day
 * window", with a calm fill for the share of the honest window already spent.
 *
 * PROOF-ONLY DISCIPLINE (the whole point of this component):
 *  - This is ELAPSED TIME inside an honest window — NEVER "% complete" / "87%
 *    done". A completion bar implies a hard finish and false precision; a time
 *    bar only says "here's how far into the wait you are". There is no percent
 *    number and no calendar date anywhere — the ConfidenceBand stays the single
 *    source of the ship expectation.
 *  - OVERDUE orders never get a >100% or stuck-at-full numeric bar: a stalled bar
 *    manufactures the exact anxiety we exist to remove. We switch to a calm
 *    terracotta "final stretch" treatment with no numeric fill past full.
 *
 * Framing rationale (kept off-screen): visible progress toward a goal reliably
 * lowers *felt* wait — the goal-gradient effect, plus the "labor illusion" that
 * shown progress raises satisfaction even when the wait itself is unchanged
 * (Buell & Norton, "The Labor Illusion", Management Science 2011; cf. Uber's
 * map/ETA wait-psychology work). We show honest elapsed progress, never a
 * fabricated completion figure.
 */
export function WaitProgress({
  timeline,
  accent,
  compact = false,
}: {
  timeline: OrderTimeline;
  accent?: string;
  compact?: boolean;
}) {
  const { daysInWait, daysRemainingUpper, overdue } = timeline;
  // Any accent used as TEXT or a thin edge here must clear AA on the sand bg.
  const edge = accent ? readableAccent(accent) : "var(--teal)";

  // OVERDUE: we're past the honest window. Do NOT render a numeric window or a
  // full/stalled bar (that manufactures anxiety). A calm, forward-looking
  // "final stretch" note in the terracotta token instead — no number, no percent.
  if (overdue) {
    return (
      <div className={clsx("panel relative overflow-hidden", compact ? "p-4" : "p-5 md:p-6")}>
        <span
          aria-hidden
          className="absolute inset-y-0 left-0 w-1.5"
          style={{ background: "var(--terracotta)" }}
        />
        <div className="pl-2.5">
          <p className="kicker mb-2" style={{ color: "var(--terracotta-600)" }}>
            In the final stretch
          </p>
          <p className={clsx("text-ink", compact ? "text-[13.5px]" : "text-[15px] leading-relaxed")}>
            You&rsquo;re past the planned window and near the end &mdash; we&rsquo;ll keep you posted
            right here as it moves.
          </p>
          {/* Calm full bar, no number: a stalled/overflowing bar would create anxiety. */}
          <div
            className="mt-3 h-2 overflow-hidden rounded-full"
            style={{ background: "rgba(217,118,47,0.18)" }}
            aria-hidden
          >
            <div className="h-full w-full rounded-full" style={{ background: "var(--terracotta)" }} />
          </div>
        </div>
      </div>
    );
  }

  // Honest total-window bounds, derived ONLY from exposed numbers + the existing
  // band math (bandVariance) — no invented constants. hi = days already waited +
  // the band's remaining upper bound; lo = hi minus a variance re-derived from
  // the total window (bandVariance(hi)), floored at what's already elapsed (the
  // window can't be shorter than the wait so far). The upper bound matches the
  // confidence band exactly; the lower bound is this component's own framing.
  const hi = daysInWait + daysRemainingUpper;
  const variance = bandVariance(hi);
  const lo = Math.max(daysInWait, hi - variance);

  // Elapsed FRACTION of the window (spec): daysInWait / (daysInWait + upper),
  // clamped to [0,1]. Rendered as flex-grow ratios so no "%" ever hits the DOM.
  const fraction = hi > 0 ? Math.min(1, Math.max(0, daysInWait / hi)) : 0;
  const grow = Math.round(fraction * 1000);

  return (
    <div className={clsx("panel relative overflow-hidden", compact ? "p-4" : "p-5 md:p-6")}>
      <span aria-hidden className="absolute inset-y-0 left-0 w-1.5" style={{ background: edge }} />
      <div className="pl-2.5">
        <p className="flex flex-wrap items-baseline gap-x-2">
          <span
            className={clsx(
              "font-serif font-semibold text-ink",
              compact ? "text-[16px]" : "text-[19px]",
            )}
          >
            Day {daysInWait}
          </span>
          <span className={clsx("text-ink-mute", compact ? "text-[13px]" : "text-[14.5px]")}>
            {lo === hi ? `of your ~${hi}-day window` : `of your ~${lo}–${hi}-day window`}
          </span>
        </p>

        <div
          className="mt-3 flex h-2 overflow-hidden rounded-full bg-sand-2"
          role="img"
          aria-label={`Day ${daysInWait} of an estimated ${lo} to ${hi} day window`}
        >
          <div className="h-full rounded-full" style={{ flexGrow: grow, background: edge }} />
          <div className="h-full" style={{ flexGrow: 1000 - grow }} />
        </div>

        <p className={clsx("mt-2 text-ink-mute", compact ? "text-[12px]" : "text-[12.5px]")}>
          Time elapsed inside your honest window &mdash; not a completion estimate.
        </p>
      </div>
    </div>
  );
}
