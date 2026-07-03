import { clsx } from "clsx";

/** Horizontal step indicator for the onboarding wizard. */
export function Stepper({ steps, current }: { steps: string[]; current: number }) {
  return (
    <ol className="flex flex-wrap items-center gap-2">
      {steps.map((label, i) => {
        const state = i < current ? "done" : i === current ? "active" : "upcoming";
        return (
          <li key={label} className="flex items-center gap-2">
            <span
              className={clsx(
                "flex h-6 w-6 items-center justify-center rounded-full text-[12px] font-semibold",
                state === "done" && "bg-teal text-ink-inverse",
                state === "active" && "bg-terracotta text-white",
                state === "upcoming" && "border border-border bg-paper text-ink-mute",
              )}
            >
              {state === "done" ? "✓" : i + 1}
            </span>
            <span className={clsx("text-[12px]", state === "active" ? "font-semibold text-ink" : "text-ink-mute")}>
              {label}
            </span>
            {i < steps.length - 1 ? <span className="mx-1 h-px w-5 bg-border" aria-hidden /> : null}
          </li>
        );
      })}
    </ol>
  );
}
