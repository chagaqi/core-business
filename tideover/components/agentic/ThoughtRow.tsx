import { clsx } from "clsx";
import type { ReactNode } from "react";

/**
 * ThoughtRow (ADR-0023) — the collapsed "Thought & used N tools" disclosure that sits
 * above an agent turn. A finished ToolChecklist collapses into one of these so the
 * transcript stays scannable while every past step stays inspectable. Native
 * <details> — no JS, server-safe, same pattern as the marketing FAQ.
 */
export function ThoughtRow({
  toolCount,
  label,
  children,
  defaultOpen = false,
  className,
}: {
  /** number of tool calls behind this turn; omit for a pure "Thought for a moment" row */
  toolCount?: number;
  /** overrides the generated label entirely when provided */
  label?: string;
  children?: ReactNode;
  defaultOpen?: boolean;
  className?: string;
}) {
  const text =
    label ??
    (toolCount && toolCount > 0
      ? `Thought & used ${toolCount} tool${toolCount === 1 ? "" : "s"}`
      : "Thought for a moment");
  return (
    <details className={clsx("group text-[13px] text-ink-mute", className)} open={defaultOpen}>
      <summary className="flex cursor-pointer list-none items-center gap-1.5 select-none [&::-webkit-details-marker]:hidden">
        <span
          aria-hidden
          className="inline-block text-[10px] transition-transform duration-150 group-open:rotate-90"
        >
          ▶
        </span>
        {text}
      </summary>
      {children ? <div className="mt-2 pl-4">{children}</div> : null}
    </details>
  );
}
