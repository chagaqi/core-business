import { clsx } from "clsx";
import type { OrderTimeline } from "@/lib/types";

/**
 * The prominent, calm "where things stand" card. Shows timeline.confidenceBand
 * verbatim (already a band string like "ships in weeks 9–11" or an overdue
 * message). If overdue, we lean into the honest "running a little longer than
 * planned" tone instead of a chipper one. Always ends with a proof note so the
 * customer understands this is an honest window, never a hard date.
 */
export function ConfidenceBand({
  timeline,
  accent,
  compact = false,
}: {
  timeline: OrderTimeline;
  accent?: string;
  compact?: boolean;
}) {
  const overdue = timeline.overdue;

  return (
    <div
      className={clsx(
        "panel relative overflow-hidden",
        compact ? "p-5" : "p-6 md:p-7",
      )}
    >
      {/* accent edge */}
      <span
        aria-hidden
        className="absolute inset-y-0 left-0 w-1.5"
        style={{ background: overdue ? "var(--terracotta)" : accent ?? "var(--teal)" }}
      />

      <div className="pl-2.5">
        <p className="kicker mb-2" style={accent && !overdue ? { color: accent } : undefined}>
          {overdue ? "An honest update" : "Where your order is"}
        </p>

        {overdue ? (
          <p className={clsx("text-ink-mute", compact ? "mb-1.5 text-[13px]" : "mb-2 text-[14px]")}>
            This one is running a little longer than planned &mdash; and we&rsquo;d rather tell you
            straight than go quiet.
          </p>
        ) : null}

        <p
          className={clsx(
            "font-serif font-semibold leading-tight text-ink",
            compact ? "text-[22px]" : "text-[clamp(24px,3vw,32px)]",
          )}
        >
          {timeline.confidenceBand}
        </p>

        {!compact ? (
          <p className="mt-3 flex items-start gap-2 text-[13px] leading-relaxed text-ink-mute">
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" aria-hidden className="mt-0.5 flex-none">
              <path
                d="M12 2 4 6v6c0 4.4 3.2 7.6 8 10 4.8-2.4 8-5.6 8-10V6l-8-4Z"
                stroke="currentColor"
                strokeWidth="1.6"
                fill="none"
                strokeLinejoin="round"
              />
            </svg>
            An honest window based on current production pace &mdash; not a hard date. We&rsquo;ll
            update it the moment it moves.
          </p>
        ) : (
          <p className="mt-1.5 text-[12px] leading-snug text-ink-mute">
            An honest window based on current pace &mdash; not a hard date.
          </p>
        )}
      </div>
    </div>
  );
}
