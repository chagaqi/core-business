"use client";

import type { ReactNode } from "react";

/**
 * A collapsible transcript block built on native <details>/<summary>. The full
 * script is passed as children so each VSL page can render its own transcript.
 */
export function TranscriptToggle({
  children,
  label = "Read the full transcript",
}: {
  children: ReactNode;
  label?: string;
}) {
  return (
    <details className="group rounded-2xl border border-border bg-paper">
      <summary className="flex cursor-pointer list-none items-center justify-between gap-4 px-6 py-5 text-[16px] font-semibold text-teal [&::-webkit-details-marker]:hidden">
        {label}
        <span
          className="flex-none text-[22px] font-light leading-none text-terracotta transition-transform group-open:rotate-45"
          aria-hidden
        >
          +
        </span>
      </summary>
      <div className="border-t border-border px-6 py-6 text-[15px] leading-[1.7] text-slate">{children}</div>
    </details>
  );
}
