import { clsx } from "clsx";

/**
 * CornerFold — the small terracotta origami corner-fold accent for cards.
 *
 * A folded paper dog-ear absolutely pinned to one corner of a `position:
 * relative` card (the S7 belief blocks + pricing tiers). Terracotta is the brand
 * accent flourish here (plan §3.2 #6 / §S7) — a decorative fold, never a
 * danger/caution signal. Purely decorative: `aria-hidden`, zero JS.
 *
 * The fold is a right-triangle keyed into the card corner, with a lighter crease
 * highlight along the hypotenuse and a soft cast shadow for lift.
 */
type Corner = "tl" | "tr" | "bl" | "br";

// Triangle path (in a 40×40 space) and crease line per corner. The right-angle
// vertex sits in the card corner; the hypotenuse is the fold crease.
const FOLD: Record<Corner, { flap: string; crease: string; pos: string }> = {
  tl: { flap: "M0 0 L40 0 L0 40 Z", crease: "M40 0 L0 40", pos: "top-0 left-0" },
  tr: { flap: "M40 0 L0 0 L40 40 Z", crease: "M0 0 L40 40", pos: "top-0 right-0" },
  bl: { flap: "M0 40 L40 40 L0 0 Z", crease: "M40 40 L0 0", pos: "bottom-0 left-0" },
  br: { flap: "M40 40 L0 40 L40 0 Z", crease: "M0 40 L40 0", pos: "bottom-0 right-0" },
};

export function CornerFold({
  corner = "tr",
  size = 26,
  className,
}: {
  corner?: Corner;
  size?: number;
  className?: string;
}) {
  const { flap, crease, pos } = FOLD[corner];
  return (
    <svg
      className={clsx("pointer-events-none absolute", pos, className)}
      width={size}
      height={size}
      viewBox="0 0 40 40"
      role="presentation"
      aria-hidden
      style={{ filter: "drop-shadow(0 1px 2px rgba(17,37,42,0.18))" }}
    >
      <path d={flap} style={{ fill: "var(--terracotta)" }} />
      <path d={crease} style={{ stroke: "var(--terracotta-300)", strokeWidth: 1.2, fill: "none" }} strokeLinecap="round" />
    </svg>
  );
}
