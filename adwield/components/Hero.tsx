"use client";

import type { ReactNode } from "react";
import { motion, useReducedMotion } from "framer-motion";
import CalButton from "@/components/CalButton";

/* ── staggered reveal, mirroring the reference's `--i * 70ms` cascade ── */
interface RevealProps {
  children: ReactNode;
  /** Stagger step (the reference's `--i`). Each step adds 70ms of delay. */
  index?: number;
  className?: string;
}

function Reveal({ children, index = 0, className }: RevealProps) {
  const reduce = useReducedMotion();
  if (reduce) {
    return <div className={className}>{children}</div>;
  }
  return (
    <motion.div
      className={className}
      initial={{ opacity: 0, y: 24 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-10% 0px" }}
      transition={{
        duration: 0.7,
        ease: [0.2, 0.7, 0.2, 1],
        delay: index * 0.07,
      }}
    >
      {children}
    </motion.div>
  );
}

export interface HeroProps {}

/**
 * The hero: kicker chip, big H1 with the cyan "critical strikes" accent, the mono
 * tagline (More hits · More crits · Every two weeks), hero-sub, the CTA row (a
 * CalButton First-Strike + a quiet anchor to #examples), and the no-risk line.
 *
 * The old 4-slot "Equipped Kit" HUD panel has been removed — the Loadout Wall
 * (`<AdExamples/>`) now leads directly under the hero so the first row of example
 * tiles sits above the fold on desktop, taking the place the kit box used to hold.
 * The four HUD stat terms (hit rate / crit / loadout / The Fatigue Wall) still
 * live on the page in the Loadout + Fatigue Wall sections. Entrance animations
 * cascade like the reference and respect prefers-reduced-motion.
 */
export default function Hero(_: HeroProps) {
  return (
    <section
      className="hero"
      data-quest="The Quest Begins"
      data-rare="gold"
      data-xp="25"
      data-kicker="Quest accepted"
    >
      <div className="wrap">
        <Reveal index={0}>
          <span className="kicker">
            <span className="dot" aria-hidden="true" />
            The AI-native ad-creative engine · functional consumables
          </span>
        </Reveal>

        <Reveal index={1}>
          <h1>
            Equip us as your secret weapon — raise your hit rate, land more{" "}
            <span className="equip">critical strikes</span> in the ad auction.
          </h1>
        </Reveal>

        <Reveal index={2}>
          <div className="tagline mono">
            <span>More hits.</span>
            <span className="sep">·</span>
            <span>More crits.</span>
            <span className="sep">·</span>
            <span>Every two weeks.</span>
          </div>
        </Reveal>

        <Reveal index={3}>
          <p className="hero-sub">
            You don&apos;t hire an agency. You equip a weapon — a fresh winner live
            in your account before the last one breaks, reloaded every two weeks.
          </p>
        </Reveal>

        <Reveal index={4}>
          <div className="hero-cta">
            <CalButton variant="primary" large>
              Claim your First Strike
            </CalButton>
            <a href="#examples" className="link-quiet">
              See the loadout wall{" "}
              <span className="arrow" aria-hidden="true">
                →
              </span>
            </a>
          </div>
        </Reveal>

        <Reveal index={5}>
          <p className="norisk">
            <svg width="15" height="15" viewBox="0 0 16 16" fill="none" aria-hidden="true">
              <path
                d="M8 1.5 13.5 4v4c0 3.4-2.4 5.6-5.5 6.5C4.9 13.6 2.5 11.4 2.5 8V4Z"
                stroke="currentColor"
                strokeWidth="1.3"
                strokeLinejoin="round"
              />
              <path
                d="m5.8 8 1.6 1.6L10.4 6.4"
                stroke="currentColor"
                strokeWidth="1.3"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
            No card. No deck. One real ad of your product — before you spend a coin.
          </p>
        </Reveal>
      </div>
    </section>
  );
}
