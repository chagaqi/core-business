import { clsx } from "clsx";
import type { ReactNode } from "react";
import type { RiskColor } from "@/lib/types";

/** Risk pill — maps engine RiskColor to the .pill-* classes. `title` adds a
 *  non-color severity channel (a11y): risk is otherwise conveyed by hue alone,
 *  so callers pass a worded label ("High refund-risk (72)") exposed to hover +
 *  screen readers. */
export function RiskBadge({
  color,
  children,
  title,
}: {
  color: RiskColor;
  children: ReactNode;
  title?: string;
}) {
  return (
    <span
      title={title}
      aria-label={title}
      className={clsx(
        "pill",
        color === "red" && "pill-red",
        color === "amber" && "pill-amber",
        color === "green" && "pill-green",
      )}
    >
      <span
        aria-hidden
        className="inline-block h-1.5 w-1.5 rounded-full"
        style={{ background: "currentColor" }}
      />
      {children}
    </span>
  );
}

/** Neutral tag chip for groups/stages/tags. */
export function Tag({ children }: { children: ReactNode }) {
  return (
    <span className="inline-flex items-center rounded-full border border-border bg-sand px-2.5 py-0.5 text-[11px] font-medium text-slate">
      {children}
    </span>
  );
}
