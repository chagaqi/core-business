/**
 * PaperEdge — the site-wide section-divider primitive (the S1–S12 boundaries).
 *
 * A single inline-SVG "sheet of paper tearing into the next section" edge, in
 * three variants: a smooth `wave`, a jagged `torn` tear, and a depth-y
 * `wave-layered` (three offset crests). The `color` is a palette tint so the
 * edge reads as the *next* section's paper bleeding up into the current one;
 * `flip` mirrors it vertically for a top-of-section edge.
 *
 * Purely decorative — `aria-hidden`, zero JS, and crisp at any width
 * (`preserveAspectRatio="none"` over a generous 1200-wide viewBox; the vector
 * stretches without rasterizing). Placement is the caller's job: drop it flush
 * at a section boundary with `color` set to the adjoining section's background.
 */

type PaperTint = "sand" | "sand-2" | "paper" | "accent-card" | "teal" | "teal-700";

const TINT: Record<PaperTint, string> = {
  sand: "var(--sand)",
  "sand-2": "var(--sand-2)",
  paper: "var(--paper)",
  "accent-card": "var(--accent-card)",
  teal: "var(--teal)",
  "teal-700": "var(--teal-700)",
};

export type PaperEdgeVariant = "wave" | "torn" | "wave-layered";

export function PaperEdge({
  variant = "wave",
  color = "sand",
  flip = false,
  height,
  className,
}: {
  variant?: PaperEdgeVariant;
  color?: PaperTint;
  flip?: boolean;
  height?: number;
  className?: string;
}) {
  const fill = TINT[color];
  const vbH = variant === "wave-layered" ? 90 : 56;

  return (
    <svg
      className={className}
      role="presentation"
      aria-hidden
      viewBox={`0 0 1200 ${vbH}`}
      preserveAspectRatio="none"
      style={{
        display: "block",
        width: "100%",
        height: height ?? vbH,
        transform: flip ? "scaleY(-1)" : undefined,
      }}
    >
      {variant === "wave" && (
        <path d="M0 24 C200 8 360 44 600 26 C840 8 1000 44 1200 26 L1200 56 L0 56 Z" style={{ fill }} />
      )}

      {variant === "torn" && (
        <path
          d="M0 22 L70 34 L150 16 L240 38 L330 20 L430 40 L540 18 L650 36 L760 20 L880 40 L1000 18 L1110 36 L1200 24 L1200 56 L0 56 Z"
          style={{ fill }}
        />
      )}

      {variant === "wave-layered" && (
        <>
          <path
            d="M0 22 C220 6 400 40 600 24 C820 8 1010 40 1200 24 L1200 90 L0 90 Z"
            style={{ fill: "var(--sand-2)" }}
          />
          <path
            d="M0 38 C220 22 400 56 600 40 C820 24 1010 56 1200 40 L1200 90 L0 90 Z"
            style={{ fill: "var(--accent-card)", filter: "drop-shadow(0 -2px 2px rgba(17,37,42,0.05))" }}
          />
          <path
            d="M0 54 C220 38 400 72 600 56 C820 40 1010 72 1200 56 L1200 90 L0 90 Z"
            style={{ fill, filter: "drop-shadow(0 -2px 2px rgba(17,37,42,0.06))" }}
          />
        </>
      )}
    </svg>
  );
}
