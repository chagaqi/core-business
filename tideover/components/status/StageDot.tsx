import { clsx } from "clsx";

/**
 * The timeline dot for a single production stage. Three states:
 *  - done: filled teal with a check
 *  - active: terracotta with a soft pulse (current stage)
 *  - upcoming: hollow, muted
 * `accent` lets the merchant's primary color tint the active state so the page
 * still feels like the merchant's own.
 */
export function StageDot({
  state,
  accent,
}: {
  state: "done" | "active" | "upcoming";
  accent?: string;
}) {
  if (state === "done") {
    return (
      <span
        aria-hidden
        className="relative z-10 flex h-6 w-6 flex-none items-center justify-center rounded-full bg-teal text-[12px] font-semibold text-ink-inverse"
        style={accent ? { background: accent } : undefined}
      >
        <svg width="13" height="13" viewBox="0 0 24 24" fill="none">
          <path d="M5 12.5l4 4L19 7" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      </span>
    );
  }

  if (state === "active") {
    return (
      <span aria-hidden className="relative z-10 flex h-6 w-6 flex-none items-center justify-center">
        <span
          className="absolute inline-flex h-6 w-6 animate-ping rounded-full bg-terracotta opacity-40 motion-reduce:hidden"
          style={accent ? { background: accent } : undefined}
        />
        <span
          className="relative inline-flex h-3.5 w-3.5 rounded-full bg-terracotta ring-4 ring-terracotta/15"
          style={accent ? { background: accent } : undefined}
        />
      </span>
    );
  }

  return (
    <span
      aria-hidden
      className={clsx(
        "relative z-10 flex h-6 w-6 flex-none items-center justify-center rounded-full",
        "border-2 border-border bg-paper",
      )}
    >
      <span className="inline-block h-1.5 w-1.5 rounded-full bg-border" />
    </span>
  );
}
