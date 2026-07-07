import { clsx } from "clsx";
import type { ReactNode } from "react";

/**
 * Stat card for the dashboard. `proof` applies the muted, labeled styling that
 * signals a measured-against-baseline number (never a fabricated outcome).
 */
export function MetricTile({
  label,
  value,
  sublabel,
  delta,
  proof = false,
  info,
}: {
  label: string;
  value: ReactNode;
  sublabel?: ReactNode;
  delta?: { text: string; tone: "up" | "down" | "flat" };
  proof?: boolean;
  /** Optional plain-language gloss shown as a hover/`title` tooltip on the label
   *  (e.g. spelling out a jargon metric like WISMO). */
  info?: string;
}) {
  return (
    <div
      className={clsx(
        "panel flex flex-col gap-1 p-4",
        proof && "bg-sand",
      )}
    >
      <span
        title={info}
        className={clsx(
          "text-[11px] font-semibold uppercase tracking-wider text-ink-mute",
          info && "cursor-help",
        )}
      >
        {label}
      </span>
      <span className="font-serif text-[30px] leading-none text-ink">{value}</span>
      <div className="mt-1 flex items-center gap-2">
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
        {sublabel ? (
          <span className="text-[12px] text-ink-mute">{sublabel}</span>
        ) : null}
      </div>
    </div>
  );
}
