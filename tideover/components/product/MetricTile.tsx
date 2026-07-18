import { clsx } from "clsx";
import type { ReactNode } from "react";

/**
 * Stat card for the dashboard. `proof` applies the muted, labeled styling that
 * signals a measured-against-baseline number (never a fabricated outcome).
 *
 * `unmeasured` is the other half of that discipline, and it is the one the product
 * was missing. A metric the product cannot yet measure must not render a zero — a
 * zero looks like a RESULT ("we deflected nothing", "you have no money at risk"),
 * and a result we did not measure is a lie whatever its value. So an unmeasured
 * tile says so in the value slot, and `sublabel` carries the sentence that names
 * WHAT WOULD MAKE IT REAL. A merchant staring at a blank is owed the next action.
 */
export function MetricTile({
  label,
  value,
  sublabel,
  delta,
  proof = false,
  info,
  unmeasured = false,
}: {
  label: string;
  value: ReactNode;
  sublabel?: ReactNode;
  delta?: { text: string; tone: "up" | "down" | "flat" };
  proof?: boolean;
  /** Optional plain-language gloss shown as a hover/`title` tooltip on the label
   *  (e.g. spelling out a jargon metric like WISMO). */
  info?: string;
  /**
   * No measurement exists yet. `value` is ignored, "Not yet measured" is shown in
   * its place, and `sublabel` is rendered in full as the explanation — never
   * truncated next to a fake number.
   */
  unmeasured?: boolean;
}) {
  return (
    <div className={clsx("panel flex flex-col gap-1 p-4", proof && "bg-sand")}>
      <span
        title={info}
        className={clsx(
          "text-[11px] font-semibold uppercase tracking-wider text-ink-mute",
          info && "cursor-help",
        )}
      >
        {label}
      </span>

      {unmeasured ? (
        <>
          <span className="font-serif text-[19px] leading-tight text-ink-mute">
            Not yet measured
          </span>
          {sublabel ? (
            <span className="mt-1 text-[12px] leading-relaxed text-ink-mute">{sublabel}</span>
          ) : null}
        </>
      ) : (
        <>
          <span className="font-serif text-[30px] leading-none text-ink">{value}</span>
          <div className="mt-1 flex flex-wrap items-center gap-2">
            {delta ? (
              <span
                className={clsx(
                  "text-[12px] font-semibold",
                  delta.tone === "up" && "text-risk-green",
                  delta.tone === "down" && "text-risk-red",
                  delta.tone === "flat" && "text-ink-mute",
                )}
              >
                {delta.text}
              </span>
            ) : null}
            {sublabel ? <span className="text-[12px] text-ink-mute">{sublabel}</span> : null}
          </div>
        </>
      )}
    </div>
  );
}
