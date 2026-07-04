import { clsx } from "clsx";
import type { SlaChipView, SlaTone } from "@/lib/sla";

/**
 * SLA countdown chip (ADR-0016, C5). Pure presentational — no client hooks — so
 * it renders in the server-side inbox detail AND inside the "use client" queue.
 * The value is computed server-side (lib/sla), so this only maps tone → styling.
 *
 * `title` carries the target basis ("…due by the next support window") as a
 * native tooltip, keeping the proof (what set the target) one hover away.
 */

const TONE_CLASS: Record<SlaTone, string> = {
  ok: "border-border bg-sand text-ink-mute",
  amber: "border-terracotta-600/25 bg-[rgba(217,118,47,0.1)] text-terracotta-600",
  red: "border-risk-red/25 bg-[rgba(192,70,59,0.1)] text-risk-red",
  met: "border-risk-green/25 bg-[rgba(62,142,110,0.1)] text-risk-green",
  missed: "border-risk-red/25 bg-[rgba(192,70,59,0.1)] text-risk-red",
};

export function SlaChip({ chip, className }: { chip: SlaChipView; className?: string }) {
  return (
    <span
      title={chip.title}
      className={clsx(
        "inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-[11px] font-semibold tabular-nums",
        TONE_CLASS[chip.tone],
        className,
      )}
    >
      <ClockIcon />
      {chip.label}
    </span>
  );
}

/** Small clock glyph — inherits currentColor from the chip tone. */
function ClockIcon() {
  return (
    <svg
      width="11"
      height="11"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2.5"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      className="shrink-0"
    >
      <circle cx="12" cy="12" r="9" />
      <path d="M12 7v5l3 2" />
    </svg>
  );
}
