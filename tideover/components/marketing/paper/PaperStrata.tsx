import { clsx } from "clsx";

/**
 * PaperStrata — the layered paper-wave BACKDROP for the hero.
 *
 * Three stacked cut-paper wave strata (sand-2 → light-teal → deeper sea tint)
 * with a soft inter-layer drop-shadow, anchored low in its container as a calm
 * tide line. It absolutely fills its parent (which MUST be `position: relative`),
 * sits behind content (`-z-10` by default), and is `aria-hidden`.
 *
 * Motion: under `prefers-reduced-motion` it is fully static (the global
 * reduced-motion kill in globals.css disables the drift). Otherwise each stratum
 * drifts a few px on a long, offset ease-in-out loop — calm, never springy.
 * Pass `drift={false}` to opt out entirely. Zero JS.
 *
 * The wave paths intentionally overrun the viewBox horizontally (-120 → 1320)
 * so the drift never exposes a hard edge.
 */
export function PaperStrata({
  className,
  drift = true,
}: {
  className?: string;
  drift?: boolean;
}) {
  return (
    <div aria-hidden className={clsx("pointer-events-none absolute inset-0 -z-10 overflow-hidden", className)}>
      <svg viewBox="0 0 1200 600" preserveAspectRatio="none" style={{ display: "block", width: "100%", height: "100%" }}>
        {/* back stratum — sand-2, calmest, drifts most */}
        <g className={drift ? "paper-strata-drift-1" : undefined}>
          <path
            d="M-120 360 C180 320 420 400 700 360 C940 326 1120 396 1320 360 L1320 600 L-120 600 Z"
            style={{ fill: "var(--sand-2)" }}
          />
        </g>
        {/* mid stratum — light teal */}
        <g className={drift ? "paper-strata-drift-2" : undefined}>
          <path
            d="M-120 424 C180 386 440 460 720 420 C960 388 1140 456 1320 420 L1320 600 L-120 600 Z"
            style={{ fill: "var(--accent-card)", filter: "drop-shadow(0 -3px 4px rgba(17,37,42,0.05))" }}
          />
        </g>
        {/* front stratum — deeper sea tint (the shoreline) */}
        <g className={drift ? "paper-strata-drift-3" : undefined}>
          <path
            d="M-120 480 C200 446 460 512 740 476 C980 444 1160 508 1320 476 L1320 600 L-120 600 Z"
            style={{ fill: "#D2E2E4", filter: "drop-shadow(0 -3px 4px rgba(17,37,42,0.06))" }}
          />
        </g>
      </svg>
    </div>
  );
}
