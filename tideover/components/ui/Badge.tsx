import { clsx } from "clsx";
import type { ReactNode } from "react";
import type { RiskColor } from "@/lib/types";

/** Risk pill — maps engine RiskColor to the .pill-* classes. */
export function RiskBadge({ color, children }: { color: RiskColor; children: ReactNode }) {
  return (
    <span
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
