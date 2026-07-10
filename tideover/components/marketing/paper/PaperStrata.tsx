"use client";

import { useEffect, useRef, useState } from "react";
import { clsx } from "clsx";
import { motion, useReducedMotion, useScroll, useTransform } from "framer-motion";

/**
 * PaperStrata — the layered paper-wave BACKDROP for the hero.
 *
 * Three stacked cut-paper wave strata (sand-2 → light-teal → deeper sea tint)
 * with soft inter-layer drop-shadows, anchored low as a calm tide line. It fills
 * its parent (which MUST be `position: relative`), sits behind content (`-z-10`),
 * and is `aria-hidden`.
 *
 * Depth: as the hero scrolls, each stratum drifts DOWN at a different rate (back
 * sheet most, front least — ~0.04–0.07 of scroll delta), so the layers separate
 * and read as distinct sheets rather than one flat backdrop. Transform-only, and
 * each layer overflows the container's bottom so the shift never exposes an edge.
 *
 * Motion:
 *  - Scroll parallax (this file) is disabled under prefers-reduced-motion AND on
 *    mobile (≤768px), where it costs more than it gives.
 *  - The slow ambient drift is CSS (paper-strata-drift-*), the ONE ambient loop
 *    on the page, and is killed globally by prefers-reduced-motion.
 * Pass `drift={false}` to opt out of the ambient loop. Pass `parallax={false}`
 * to opt out of the scroll depth.
 *
 * SSR-safe: motion values initialise to 0, so the server and pre-hydration
 * render match the resting position (no shift, no flash).
 */

// Each stratum: its wave path (overrunning the viewBox horizontally so drift
// never shows an edge), fill, inter-layer shadow, ambient-drift class, and the
// px it travels over the hero scroll (back travels most for depth separation).
const STRATA = [
  {
    d: "M-120 360 C180 320 420 400 700 360 C940 326 1120 396 1320 360 L1320 600 L-120 600 Z",
    fill: "var(--sand-2)",
    filter: undefined as string | undefined,
    drift: "paper-strata-drift-1",
    travel: 40,
  },
  {
    d: "M-120 424 C180 386 440 460 720 420 C960 388 1140 456 1320 420 L1320 600 L-120 600 Z",
    fill: "var(--accent-card)",
    filter: "drop-shadow(0 -3px 4px rgba(17,37,42,0.05))",
    drift: "paper-strata-drift-2",
    travel: 26,
  },
  {
    d: "M-120 480 C200 446 460 512 740 476 C980 444 1160 508 1320 476 L1320 600 L-120 600 Z",
    fill: "#D2E2E4",
    filter: "drop-shadow(0 -3px 4px rgba(17,37,42,0.06))",
    drift: "paper-strata-drift-3",
    travel: 12,
  },
] as const;

export function PaperStrata({
  className,
  drift = true,
  parallax = true,
}: {
  className?: string;
  drift?: boolean;
  parallax?: boolean;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const reduce = useReducedMotion();
  const [mobile, setMobile] = useState(false);

  useEffect(() => {
    const mq = window.matchMedia("(max-width: 768px)");
    const on = () => setMobile(mq.matches);
    on();
    mq.addEventListener("change", on);
    return () => mq.removeEventListener("change", on);
  }, []);

  const { scrollYProgress } = useScroll({ target: ref, offset: ["start start", "end start"] });
  // Hooks must run unconditionally; the gate is applied at the style level below.
  const y0 = useTransform(scrollYProgress, [0, 1], [0, STRATA[0].travel]);
  const y1 = useTransform(scrollYProgress, [0, 1], [0, STRATA[1].travel]);
  const y2 = useTransform(scrollYProgress, [0, 1], [0, STRATA[2].travel]);
  const ys = [y0, y1, y2];

  const off = reduce || mobile || !parallax;

  return (
    <div
      ref={ref}
      aria-hidden
      className={clsx("pointer-events-none absolute inset-0 -z-10 overflow-hidden", className)}
    >
      {STRATA.map((s, i) => (
        // Each layer overflows the container bottom (h-[120%]) so its downward
        // parallax never exposes a gap under the tide.
        <motion.div key={i} className="absolute inset-x-0 top-0 h-[120%]" style={{ y: off ? 0 : ys[i] }}>
          <svg viewBox="0 0 1200 600" preserveAspectRatio="none" style={{ display: "block", width: "100%", height: "100%" }}>
            <g className={drift ? s.drift : undefined}>
              <path d={s.d} style={{ fill: s.fill, filter: s.filter }} />
            </g>
          </svg>
        </motion.div>
      ))}
    </div>
  );
}
