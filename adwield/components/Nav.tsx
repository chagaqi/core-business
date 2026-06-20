"use client";

import Link from "next/link";
import { motion, useReducedMotion } from "framer-motion";

export interface NavProps {}

/**
 * Minimal sticky top HUD for a one-pager: the gold/cyan crest + mono "adwield"
 * wordmark on the left, and ONE always-available primary CTA on the right that
 * routes to the dedicated `/book` page.
 *
 * The in-page section menu and the decorative player-plate (LVL ring + HP/XP
 * bars) were intentionally removed — section jumping is already served by
 * GameChrome's left quest-rail and the bottom hotbar, and the XP/level fantasy
 * lives in GameChrome's toasts/cast-bar. GameChrome reads `#xpPlate`/`#lvlNum`/
 * `#lvlRing` only "if present", so dropping the plate is null-safe.
 *
 * The CTA is a Next.js `<Link href="/book">` (not a popup trigger and not an
 * anchor): booking now lives on its own `/book` route. `data-xp` keeps
 * GameChrome's XP-float firing on click. A subtle entrance respects
 * prefers-reduced-motion.
 */
export default function Nav(_: NavProps) {
  const reduce = useReducedMotion();

  return (
    <motion.header
      className="nav"
      initial={reduce ? false : { y: -66, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ duration: 0.55, ease: [0.2, 0.7, 0.2, 1] }}
    >
      <div className="wrap nav-inner">
        <a href="#top" className="brand" aria-label="Adwield home">
          <svg
            className="crest"
            width="27"
            height="27"
            viewBox="0 0 32 32"
            fill="none"
            aria-hidden="true"
          >
            <path
              d="M16 2.5 L28 9 V23 L16 29.5 L4 23 V9 Z"
              stroke="#5EC8E6"
              strokeWidth="1.4"
              strokeLinejoin="round"
            />
            <path d="M16 9 L22 22 H19.2 L16 14.6 L12.8 22 H10 Z" fill="#5EC8E6" />
            <path d="M13 19 H19" stroke="#0B0D12" strokeWidth="1.4" />
          </svg>
          <span className="wordmark mono">adwield</span>
        </a>

        <div className="nav-cta">
          <Link href="/book" className="btn btn-primary nav-book" data-xp="40">
            Claim First Strike
          </Link>
        </div>
      </div>
    </motion.header>
  );
}
