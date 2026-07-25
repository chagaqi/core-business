"use client";

import { clsx } from "clsx";
import { useEffect, useRef, useState } from "react";

/**
 * StreamingText (ADR-0023) — streamed agent prose with a caret while text is arriving.
 *
 * Two modes:
 *  - live (default): the parent re-renders with a growing `text` as runner events
 *    arrive; `active` shows the caret. This is the only mode product surfaces use.
 *  - typewriter: self-advances through a FULL string word-by-word. Scripted-replay
 *    surfaces only (marketing demo, dev gallery) — never presented as live work.
 *
 * prefers-reduced-motion: typewriter renders the full text immediately; the caret
 * still marks activity (state, not motion).
 */
export function StreamingText({
  text,
  active = false,
  typewriter = false,
  speedMs = 60,
  onDone,
  className,
}: {
  text: string;
  active?: boolean;
  typewriter?: boolean;
  speedMs?: number;
  onDone?: () => void;
  className?: string;
}) {
  const [wordCount, setWordCount] = useState(typewriter ? 0 : Number.POSITIVE_INFINITY);
  const words = text.split(/(\s+)/); // keep whitespace tokens so layout is stable
  const doneRef = useRef(false);

  useEffect(() => {
    if (!typewriter) return;
    doneRef.current = false;
    setWordCount(0);
    if (typeof window !== "undefined" && window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      setWordCount(Number.POSITIVE_INFINITY);
      doneRef.current = true;
      onDone?.();
      return;
    }
    const timer = setInterval(() => {
      setWordCount((n) => {
        if (n >= words.length) {
          clearInterval(timer);
          if (!doneRef.current) {
            doneRef.current = true;
            onDone?.();
          }
          return n;
        }
        // advance past whitespace tokens in the same tick so cadence is per-word
        return words[n]?.trim() === "" ? n + 2 : n + 1;
      });
    }, speedMs);
    return () => clearInterval(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps -- restart only when the script changes
  }, [text, typewriter, speedMs]);

  const visible = typewriter ? words.slice(0, wordCount).join("") : text;
  const streaming = active || (typewriter && wordCount < words.length);

  return (
    <span className={clsx("whitespace-pre-wrap text-[15px] leading-relaxed text-ink", className)}>
      {visible}
      {streaming ? (
        <span aria-hidden className="ml-0.5 inline-block h-[1em] w-[2px] translate-y-[2px] animate-pulse bg-terracotta" />
      ) : null}
    </span>
  );
}
