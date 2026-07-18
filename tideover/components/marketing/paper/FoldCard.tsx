"use client";

import { motion, useReducedMotion, type Variants } from "framer-motion";
import type { ReactNode } from "react";

/**
 * FoldCard — the signature paper reveal for the marketing surfaces.
 *
 * A card enters by UNFOLDING: it starts tipped back from its top edge
 * (rotateX from -8deg, transform-origin top) with a shallow shadow, then
 * flattens into place as its shadow deepens to the resting elevation — the
 * cut-paper motif coming to rest, not a generic fade-up. On hover the sheet
 * lifts a few px to the next shadow step; on press it settles back down.
 *
 * This is the card-level companion to <Reveal> (which keeps the plain rise for
 * text). Motion is transform + opacity + box-shadow only, fires once on first
 * scroll into view, reserves its own layout box (rotateX/y never shift the grid
 * → zero CLS), and collapses to a static, fully-visible resting state under
 * prefers-reduced-motion. SSR-safe: the server renders the `hidden` state and
 * the client runs the reveal on mount — the same contract as <Reveal>.
 *
 * Shadow scale mirrors --elev-1..3 in globals.css (kept as literals here so
 * framer-motion can interpolate them; all four are 2-layer for smooth tweening).
 */

// Folded/closed — barely lifted off the page while tipped back.
const FLAT = "0 0px 1px rgba(17,37,42,0.03), 0 3px 12px -10px rgba(17,37,42,0.12)";
// Resting elevations (= --elev-1 / a touch above for anchor cards).
const REST = "0 1px 2px rgba(17,37,42,0.05), 0 12px 28px -18px rgba(17,37,42,0.20)";
const REST_STRONG = "0 2px 6px rgba(17,37,42,0.06), 0 24px 46px -22px rgba(17,37,42,0.28)";
// Hover steps (= --elev-2 / --elev-3).
const HOVER = "0 3px 8px rgba(17,37,42,0.07), 0 30px 54px -24px rgba(17,37,42,0.30)";
const HOVER_STRONG = "0 4px 10px rgba(17,37,42,0.07), 0 34px 60px -26px rgba(17,37,42,0.34)";

const EASE = [0.2, 0.7, 0.2, 1] as const;

export function FoldCard({
  children,
  index = 0,
  className,
  as = "div",
  href,
  id,
  hover = true,
  lift = "card",
  shadow = true,
  amount = 0.2,
}: {
  children: ReactNode;
  /** Stagger position among siblings (adds index * 75ms to the reveal). */
  index?: number;
  className?: string;
  as?: "div" | "li";
  /** Renders a <motion.a> when set (same-page anchors / deep links). */
  href?: string;
  id?: string;
  /** Hover-lift + press. Off for display anchors (hero card, demo capture). */
  hover?: boolean;
  /** Resting elevation band — "strong" for the hero/demo anchor cards. */
  lift?: "card" | "strong";
  /** Animate the paper shadow. Off for flat elements (e.g. badge chips). */
  shadow?: boolean;
  /** Fraction of the element in view before the reveal fires. */
  amount?: number;
}) {
  const reduce = useReducedMotion();
  const rest = lift === "strong" ? REST_STRONG : REST;
  const hoverShadow = lift === "strong" ? HOVER_STRONG : HOVER;

  const variants: Variants = {
    hidden: reduce
      ? { opacity: 1, ...(shadow && { boxShadow: rest }) }
      : { opacity: 0, y: 16, rotateX: -8, ...(shadow && { boxShadow: FLAT }) },
    show: {
      opacity: 1,
      y: 0,
      rotateX: 0,
      ...(shadow && { boxShadow: rest }),
      transition: reduce ? { duration: 0 } : { duration: 0.7, delay: index * 0.075, ease: EASE },
    },
  };

  const whileHover =
    reduce || !hover
      ? undefined
      : { y: -4, ...(shadow && { boxShadow: hoverShadow }), transition: { duration: 0.3, ease: EASE } };
  const whileTap = reduce || !hover ? undefined : { y: -1, transition: { duration: 0.12, ease: EASE } };

  // transformPerspective is a framer-motion style key (self-perspective for the
  // 3D fold), so this object is intentionally not typed as CSSProperties.
  const style = { transformOrigin: "top center", transformPerspective: 1000 };

  const common = {
    id,
    className,
    style,
    variants,
    initial: "hidden" as const,
    whileInView: "show" as const,
    whileHover,
    whileTap,
    viewport: { once: true, amount },
  };

  if (href) {
    return (
      <motion.a href={href} {...common}>
        {children}
      </motion.a>
    );
  }
  const Tag = motion[as];
  return <Tag {...common}>{children}</Tag>;
}
