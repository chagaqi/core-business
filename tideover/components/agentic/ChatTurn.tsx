import type { ReactNode } from "react";
import { clsx } from "clsx";

/**
 * ChatTurn (ADR-0023) — the two voices of an agentic surface. Agent turns are
 * plain ink text behind a small teal wave avatar (a consistent left gutter, like
 * Swan's transcript rhythm); user turns are right-aligned light-teal bubbles.
 */
export function ChatTurn({ role, children, className }: { role: "agent" | "user"; children: ReactNode; className?: string }) {
  if (role === "user") {
    return (
      <div className={clsx("flex justify-end", className)}>
        <div className="max-w-[85%] rounded-xl bg-accent-card px-3.5 py-2 text-[14px] leading-relaxed text-ink">
          {children}
        </div>
      </div>
    );
  }
  return (
    <div className={clsx("flex gap-3", className)}>
      <span
        aria-hidden
        className="mt-0.5 grid h-7 w-7 shrink-0 place-items-center rounded-full bg-teal text-ink-inverse"
      >
        <svg width="14" height="14" viewBox="0 0 16 16" fill="none" aria-hidden>
          <path
            d="M1 10c2 -2.5 4 -2.5 6 0s4 2.5 6 0"
            stroke="currentColor"
            strokeWidth="1.7"
            strokeLinecap="round"
          />
          <path
            d="M1 6c2 -2.5 4 -2.5 6 0s4 2.5 6 0"
            stroke="currentColor"
            strokeWidth="1.7"
            strokeLinecap="round"
            opacity="0.55"
          />
        </svg>
      </span>
      <div className="min-w-0 flex-1 space-y-2 text-[15px] leading-relaxed text-ink">{children}</div>
    </div>
  );
}

/**
 * DraftArtifact (ADR-0023) — the typographic line between the agent TALKING and a
 * thing the agent WROTE: drafted replies render indented, muted, italic (Swan's
 * convention), with an optional non-italic header naming what the draft is.
 */
export function DraftArtifact({ title, children, className }: { title?: string; children: ReactNode; className?: string }) {
  return (
    <figure className={clsx("border-l-2 border-border pl-4", className)}>
      {title ? <figcaption className="mb-1 text-[13px] font-semibold not-italic text-ink">{title}</figcaption> : null}
      <div className="text-[14px] italic leading-relaxed text-slate">{children}</div>
    </figure>
  );
}
