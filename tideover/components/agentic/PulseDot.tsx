import { clsx } from "clsx";

/**
 * PulseDot (ADR-0023) — the pre-first-token state: a single pulsing dot where the
 * agent's reply will appear. Swan's minimal waiting state; no skeletons, no spinners.
 */
export function PulseDot({ className }: { className?: string }) {
  return (
    <span
      role="status"
      aria-label="Working"
      className={clsx("inline-block h-2 w-2 animate-pulse rounded-full bg-terracotta", className)}
    />
  );
}
