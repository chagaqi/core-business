"use client";

import { clsx } from "clsx";

/**
 * Onboarding wizard shell chrome — presentation only. The wizard owns step state
 * and passes `current` plus an `onJump` used by completed steps to navigate back.
 *
 *  - ProgressRail: the desktop vertical named rail (one step per row, connector
 *    line, number → check on completion). Terracotta is reserved for the single
 *    forward action (design rule D1), so the ACTIVE marker is teal, not terracotta.
 *  - MobileProgress: the collapsed "Step N of M · <name>" bar + segmented meter
 *    shown under 768px, where the vertical rail is hidden.
 */

type StepState = "done" | "active" | "upcoming";

function stateOf(i: number, current: number): StepState {
  return i < current ? "done" : i === current ? "active" : "upcoming";
}

export function ProgressRail({
  steps,
  current,
  onJump,
}: {
  steps: string[];
  current: number;
  onJump: (i: number) => void;
}) {
  return (
    <nav aria-label="Onboarding steps">
      <ol className="flex flex-col">
        {steps.map((label, i) => {
          const state = stateOf(i, current);
          const done = state === "done";
          const active = state === "active";
          const last = i === steps.length - 1;

          const row = (
            <>
              <span className="flex flex-col items-center">
                <span
                  className={clsx(
                    "flex h-7 w-7 flex-none items-center justify-center rounded-full text-[12.5px] font-semibold",
                    done && "bg-risk-green text-white",
                    active && "bg-teal text-ink-inverse",
                    state === "upcoming" && "border border-border bg-paper text-ink-mute",
                  )}
                >
                  {done ? "✓" : i + 1}
                </span>
                {!last ? <span aria-hidden className="mt-1.5 w-px flex-1 bg-border" /> : null}
              </span>
              <span
                className={clsx(
                  "pt-1 text-[13.5px] leading-tight",
                  last ? "pb-1" : "pb-6",
                  active && "font-semibold text-ink",
                  done && "font-medium text-ink",
                  state === "upcoming" && "text-ink-mute",
                )}
              >
                {label}
              </span>
            </>
          );

          return (
            <li key={label} aria-current={active ? "step" : undefined}>
              {done ? (
                <button
                  type="button"
                  onClick={() => onJump(i)}
                  className="flex w-full items-stretch gap-3 rounded-lg text-left transition hover:opacity-75"
                >
                  {row}
                </button>
              ) : (
                <div className="flex items-stretch gap-3">{row}</div>
              )}
            </li>
          );
        })}
      </ol>
    </nav>
  );
}

export function MobileProgress({ steps, current }: { steps: string[]; current: number }) {
  return (
    <div className="mb-6">
      <p className="mb-2 text-[13px] font-semibold text-ink">
        <span className="text-ink-mute">
          Step {current + 1} of {steps.length}
        </span>{" "}
        · {steps[current]}
      </p>
      <ol className="flex gap-1.5" aria-hidden>
        {steps.map((label, i) => {
          const state = stateOf(i, current);
          return (
            <li
              key={label}
              className={clsx(
                "h-1.5 flex-1 rounded-full",
                state === "done" && "bg-risk-green",
                state === "active" && "bg-teal",
                state === "upcoming" && "bg-border",
              )}
            />
          );
        })}
      </ol>
    </div>
  );
}
