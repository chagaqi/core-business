"use client";

import { useEffect, useRef, useState } from "react";
import {
  motion,
  useInView,
  useReducedMotion,
  type Variants,
} from "framer-motion";

/**
 * FatigueWall — Quest 01 · "The Problem".
 *
 * Recreated faithfully from the approved "Command Deck" reference
 * (_newestsite-source.html, #fatigue): the H2, three fatigue points, and the
 * "Combat Log" panel with the inline decay-curve SVG + animated "Winner HP"
 * enemy bar. The "~7" week figure counts up on scroll-in (a descriptive
 * number, not a proof metric). All motion respects prefers-reduced-motion.
 */
export type FatigueWallProps = Record<string, never>;

/** Cubic ease-out matched to the reference's reveal curve. */
const EASE_OUT = [0.2, 0.7, 0.2, 1] as const;

/** Reveal variants mirroring the reference `.rv` (translateY 24px -> 0). */
const revealVariants: Variants = {
  hidden: { opacity: 0, y: 24 },
  show: (i: number) => ({
    opacity: 1,
    y: 0,
    transition: { duration: 0.7, ease: EASE_OUT, delay: i * 0.07 },
  }),
};

/** A scroll-reveal wrapper. `i` drives the staggered delay (reference --i*70ms). */
function Reveal({
  children,
  i = 0,
  className,
  ariaHidden,
}: {
  children: React.ReactNode;
  i?: number;
  className?: string;
  ariaHidden?: boolean;
}) {
  const reduce = useReducedMotion();
  return (
    <motion.div
      className={className}
      aria-hidden={ariaHidden}
      custom={i}
      variants={reduce ? undefined : revealVariants}
      initial={reduce ? false : "hidden"}
      whileInView={reduce ? undefined : "show"}
      viewport={{ once: true, amount: 0.25 }}
    >
      {children}
    </motion.div>
  );
}

/** Count-up that ticks to `to` on first scroll-in (reference cubic ease-out). */
function CountUp({ to, prefix = "" }: { to: number; prefix?: string }) {
  const reduce = useReducedMotion();
  const ref = useRef<HTMLSpanElement>(null);
  const inView = useInView(ref, { once: true, amount: 0.6 });
  const [value, setValue] = useState(reduce ? to : 0);

  useEffect(() => {
    if (reduce || !inView) return;
    const duration = 900;
    let raf = 0;
    let start: number | null = null;
    const step = (ts: number) => {
      if (start === null) start = ts;
      const t = Math.min(1, (ts - start) / duration);
      const eased = 1 - Math.pow(1 - t, 3);
      setValue(Math.round(to * eased));
      if (t < 1) raf = requestAnimationFrame(step);
    };
    raf = requestAnimationFrame(step);
    return () => cancelAnimationFrame(raf);
  }, [inView, reduce, to]);

  return (
    <span ref={ref} className="cu">
      {prefix}
      {value}
    </span>
  );
}

const FATIGUE_POINTS: { n: string; lead: string; body: string }[] = [
  {
    n: "01",
    lead: "A clock, not a coin flip.",
    body: "Today's winner is already decaying. The only question is what's armed when it breaks.",
  },
  {
    n: "02",
    lead: "Short on hands, not ideas.",
    body: "A lean team runs out of production capacity long before it runs out of angles.",
  },
  {
    n: "03",
    lead: "The wall doesn't wait.",
    body: "Miss one refresh and CPA drifts up while you scramble to shoot the next thing.",
  },
];

export default function FatigueWall(_props: FatigueWallProps) {
  void _props;
  const reduce = useReducedMotion();

  // The "Winner HP" enemy bar fills from 0 -> 28% once the panel enters view.
  const hpRef = useRef<HTMLDivElement>(null);
  const hpInView = useInView(hpRef, { once: true, amount: 0.5 });
  const hpFilled = reduce ? true : hpInView;

  return (
    <section
      className="section"
      id="fatigue"
      data-quest="Debuff detected"
      data-rare="danger"
      data-xp="100"
      data-kicker="Threat sighted"
    >
      <div className="wrap">
        <Reveal className="qhead">
          <span className="qmarker" aria-hidden="true">
            <svg width="30" height="30" viewBox="0 0 30 30" fill="none">
              <path
                d="M15 3 26 21H4z"
                stroke="#E3C778"
                strokeWidth="1.6"
                strokeLinejoin="round"
              />
              <path
                d="M15 10v5M15 17.5v.5"
                stroke="#E3C778"
                strokeWidth="1.8"
                strokeLinecap="round"
              />
            </svg>
          </span>
          <div className="qchip">
            <span className="q">Quest 01</span>
            <span className="s">The Problem</span>
          </div>
        </Reveal>

        <Reveal i={1}>
          <h2>Every winning ad dies on a clock.</h2>
        </Reveal>

        <div className="fatigue-grid">
          <Reveal i={2}>
            <p className="lede">
              Your best creative isn&apos;t permanent. Around{" "}
              <strong>
                week <CountUp to={7} prefix="~" />
              </strong>{" "}
              a winner stops beating its own past self — the Fatigue Wall — and a
              two-person team can&apos;t test replacements fast enough to stay ahead
              of it.
            </p>
            <div className="fatigue-points">
              {FATIGUE_POINTS.map((pt) => (
                <div className="fpt" key={pt.n}>
                  <span className="mk mono" aria-hidden="true">
                    <span>{pt.n}</span>
                  </span>
                  <span>
                    <b>{pt.lead}</b> {pt.body}
                  </span>
                </div>
              ))}
            </div>
          </Reveal>

          <Reveal i={3} className="panel" ariaHidden>
            <div className="win-title">
              <span
                className="gem"
                style={{
                  background: "var(--danger)",
                  boxShadow: "0 0 9px rgba(242,102,107,.5)",
                }}
                aria-hidden="true"
              />
              Combat Log · Creative vs. Control
            </div>
            <div className="chart-inner">
              <div className="chart-head">
                <span>Performance over time</span>
                <span>0 → 10 wk</span>
              </div>
              <svg
                viewBox="0 0 460 240"
                width="100%"
                role="img"
                aria-label="Decay curve: a winning ad fades by week 7, with a fresh creative re-equipped to stay above control."
              >
                <defs>
                  <linearGradient id="fatigueFade" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0" stopColor="rgba(94,200,230,0.2)" />
                    <stop offset="1" stopColor="rgba(94,200,230,0)" />
                  </linearGradient>
                </defs>
                <g stroke="rgba(150,190,225,0.07)" strokeWidth="1">
                  <line x1="40" y1="30" x2="40" y2="200" />
                  <line x1="40" y1="200" x2="440" y2="200" />
                  <line x1="40" y1="155" x2="440" y2="155" />
                  <line x1="40" y1="110" x2="440" y2="110" />
                  <line x1="40" y1="65" x2="440" y2="65" />
                </g>
                <line
                  x1="40"
                  y1="155"
                  x2="440"
                  y2="155"
                  stroke="rgba(190,220,255,0.3)"
                  strokeWidth="1.5"
                  strokeDasharray="4 5"
                />
                <text
                  x="44"
                  y="148"
                  fill="#76819A"
                  fontSize="10"
                  fontFamily="ui-monospace,monospace"
                >
                  CONTROL
                </text>
                <path
                  d="M40 152 C 110 64, 150 54, 200 64 C 250 74, 280 108, 320 158 C 350 190, 390 204, 440 210 L440 200 L40 200 Z"
                  fill="url(#fatigueFade)"
                />
                <motion.path
                  d="M40 152 C 110 64, 150 54, 200 64 C 250 74, 280 108, 320 158 C 350 190, 390 204, 440 210"
                  fill="none"
                  stroke="#5EC8E6"
                  strokeWidth="2.4"
                  strokeLinecap="round"
                  initial={reduce ? false : { pathLength: 0 }}
                  whileInView={reduce ? undefined : { pathLength: 1 }}
                  viewport={{ once: true, amount: 0.5 }}
                  transition={{ duration: 1.4, ease: EASE_OUT }}
                />
                <line
                  x1="320"
                  y1="30"
                  x2="320"
                  y2="200"
                  stroke="rgba(244,162,59,0.5)"
                  strokeWidth="1.2"
                  strokeDasharray="3 4"
                />
                <circle cx="320" cy="158" r="3.5" fill="#F4A23B" />
                <text
                  x="320"
                  y="24"
                  fill="#F4A23B"
                  fontSize="10"
                  fontFamily="ui-monospace,monospace"
                  textAnchor="middle"
                >
                  ~WK 7
                </text>
                <motion.path
                  d="M300 182 C 340 116, 380 86, 440 84"
                  fill="none"
                  stroke="#5EC8E6"
                  strokeWidth="2.2"
                  strokeDasharray="2 5"
                  strokeLinecap="round"
                  opacity="0.85"
                  initial={reduce ? false : { pathLength: 0 }}
                  whileInView={reduce ? undefined : { pathLength: 1 }}
                  viewport={{ once: true, amount: 0.5 }}
                  transition={{ duration: 1.1, ease: EASE_OUT, delay: 0.5 }}
                />
                <circle cx="300" cy="182" r="3" fill="#5EC8E6" />
                <text
                  x="356"
                  y="76"
                  fill="#AEB8C8"
                  fontSize="10"
                  fontFamily="ui-monospace,monospace"
                >
                  FRESH RELOAD
                </text>
              </svg>
              <div className="enemy-hp" ref={hpRef}>
                <span>Winner HP</span>
                <span className="ehp-track">
                  <span
                    className="ehp-fill"
                    style={{ width: hpFilled ? "28%" : "0%" }}
                  />
                </span>
                <span style={{ color: "var(--danger)" }}>28%</span>
              </div>
            </div>
          </Reveal>
        </div>
      </div>
    </section>
  );
}
