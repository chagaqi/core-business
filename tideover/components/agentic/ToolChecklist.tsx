import { clsx } from "clsx";

export type ChecklistStepState = "done" | "active" | "pending";

export interface ChecklistStep {
  label: string;
  state: ChecklistStepState;
  /** optional trailing detail, e.g. "×3" or "12 orders" — a fact, never decoration */
  note?: string;
}

/**
 * ToolChecklist (ADR-0023) — the "watch the agent work" timeline. Dot grammar from
 * the Swan frame analysis: muted dot = done, terracotta pulsing dot = active,
 * hollow dot = pending. Product surfaces may only feed this from REAL runner
 * events (SW1); scripted sequences are marketing-only with a SAMPLE label.
 */
export function ToolChecklist({ steps, className }: { steps: ChecklistStep[]; className?: string }) {
  const active = steps.find((s) => s.state === "active");
  return (
    <ol
      className={clsx("relative space-y-2 border-l border-border pl-4", className)}
      aria-label={active ? `Working: ${active.label}` : "Completed steps"}
    >
      {steps.map((step, i) => (
        <li key={`${step.label}-${i}`} className="relative flex items-baseline gap-2 text-[13px] leading-5">
          <span
            aria-hidden
            className={clsx(
              "absolute -left-[21px] top-[5px] h-2 w-2 rounded-full",
              step.state === "done" && "bg-ink-mute/60",
              step.state === "active" && "animate-pulse bg-terracotta",
              step.state === "pending" && "border border-border bg-paper",
            )}
          />
          <span
            className={clsx(
              step.state === "done" && "text-slate",
              step.state === "active" && "font-medium text-ink",
              step.state === "pending" && "text-ink-mute/70",
            )}
          >
            {step.label}
            {step.state === "active" ? <span className="sr-only"> (in progress)</span> : null}
          </span>
          {step.note ? <span className="text-[12px] text-ink-mute">{step.note}</span> : null}
        </li>
      ))}
    </ol>
  );
}
