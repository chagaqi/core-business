"use client";

import { clsx } from "clsx";
import { useState } from "react";

/**
 * DecisionCard (ADR-0023) — the one-question-at-a-time ask: bordered card, "n of N"
 * header, bold question, numbered options + "+ Other" free text. The one-at-a-time
 * rule is a usage rule (never render two at once), not a prop.
 */
export function DecisionCard({
  question,
  options,
  index,
  allowOther = true,
  selected = null,
  disabled = false,
  onSelect,
  className,
}: {
  question: string;
  options: string[];
  /** e.g. {n: 1, of: 3} → "1 of 3" header chip */
  index?: { n: number; of: number };
  allowOther?: boolean;
  /** the already-chosen answer, if the caller re-renders after selection */
  selected?: string | null;
  disabled?: boolean;
  onSelect: (choice: string) => void;
  className?: string;
}) {
  const [otherOpen, setOtherOpen] = useState(false);
  const [otherText, setOtherText] = useState("");
  const locked = disabled || selected !== null;

  return (
    <div className={clsx("panel p-4", className)}>
      {index ? (
        <div className="mb-2 text-[12px] font-medium text-ink-mute">
          {index.n} of {index.of}
        </div>
      ) : null}
      <p className="mb-3 text-[15px] font-semibold text-ink">{question}</p>
      <ol className="space-y-2">
        {options.map((option, i) => {
          const isSelected = selected === option;
          return (
            <li key={option}>
              <button
                type="button"
                disabled={locked && !isSelected}
                onClick={() => onSelect(option)}
                className={clsx(
                  "flex w-full items-baseline gap-2.5 rounded-[10px] border px-3.5 py-2.5 text-left text-[14px] transition-colors",
                  isSelected
                    ? "border-terracotta bg-terracotta/5 font-medium text-ink"
                    : "border-border bg-paper text-slate hover:bg-sand",
                  locked && !isSelected && "opacity-50",
                )}
              >
                <span className="text-[13px] font-semibold text-ink-mute">{i + 1}.</span>
                <span>{option}</span>
              </button>
            </li>
          );
        })}
      </ol>
      {allowOther && !locked ? (
        otherOpen ? (
          <form
            className="mt-2 flex gap-2"
            onSubmit={(e) => {
              e.preventDefault();
              if (otherText.trim()) onSelect(otherText.trim());
            }}
          >
            <input
              autoFocus
              value={otherText}
              onChange={(e) => setOtherText(e.target.value)}
              placeholder="Your answer"
              className="w-full rounded-[10px] border border-border bg-paper px-3.5 py-2.5 text-[14px] text-ink placeholder:text-ink-mute/60"
            />
            <button type="submit" className="btn btn-primary px-4 py-2 text-[13px]" disabled={!otherText.trim()}>
              Send
            </button>
          </form>
        ) : (
          <button
            type="button"
            onClick={() => setOtherOpen(true)}
            className="mt-2 text-[13px] text-ink-mute hover:text-ink"
          >
            + Other
          </button>
        )
      ) : null}
    </div>
  );
}
