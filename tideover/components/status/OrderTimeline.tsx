import { clsx } from "clsx";
import { StageDot } from "@/components/status/StageDot";
import type { OrderTimeline as OrderTimelineData } from "@/lib/types";

/**
 * Vertical production timeline built from PublicStatus.timeline.stages. Each row
 * is a dot + label + relative day band ("days 32–72", NEVER a calendar date) +
 * blurb. The active stage is highlighted. The day bands are relative to order
 * placement, so they read as honest progress markers, not promised dates.
 */
export function OrderTimeline({
  timeline,
  accent,
  compact = false,
}: {
  timeline: OrderTimelineData;
  accent?: string;
  compact?: boolean;
}) {
  return (
    <ol className="relative flex flex-col">
      {timeline.stages.map((stage, i) => {
        const last = i === timeline.stages.length - 1;
        const isActive = stage.state === "active";
        return (
          <li key={stage.key} className="relative flex gap-4 pb-1">
            {/* connector line */}
            {!last ? (
              <span
                aria-hidden
                className={clsx(
                  "absolute left-3 top-6 -ml-px w-0.5",
                  compact ? "bottom-1" : "bottom-0",
                  stage.state === "done" ? "bg-teal/40" : "bg-border",
                )}
              />
            ) : null}

            <StageDot state={stage.state} accent={isActive || stage.state === "done" ? accent : undefined} />

            <div className={clsx("min-w-0 flex-1", compact ? "pb-3" : "pb-6")}>
              <div className="flex flex-wrap items-baseline gap-x-2.5 gap-y-1">
                <span
                  className={clsx(
                    "text-[15px] font-semibold",
                    isActive ? "text-ink" : stage.state === "done" ? "text-slate" : "text-ink-mute",
                  )}
                >
                  {stage.label}
                </span>
                <span className="text-[12px] font-medium text-ink-mute">
                  days {stage.dayBand.from}&ndash;{stage.dayBand.to}
                </span>
                {isActive ? (
                  <span
                    className="inline-flex items-center rounded-full bg-terracotta/10 px-2 py-0.5 text-[11px] font-semibold text-terracotta-600"
                    style={accent ? { color: accent, background: `${accent}1a` } : undefined}
                  >
                    in progress now
                  </span>
                ) : null}
              </div>
              {!compact ? (
                <p
                  className={clsx(
                    "mt-1 text-[14px] leading-relaxed",
                    isActive ? "text-slate" : "text-ink-mute",
                  )}
                >
                  {stage.blurb}
                </p>
              ) : null}
            </div>
          </li>
        );
      })}
    </ol>
  );
}
