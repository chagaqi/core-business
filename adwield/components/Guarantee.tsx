"use client";

import { motion, useReducedMotion, type Variants } from "framer-motion";

/**
 * Guarantee — `#guarantee` ("The No-Risk Loadout").
 *
 * Faithful rebuild of the approved "Command Deck" reference. All chrome is
 * buff/green: the buff tag, the headline ("Beat your control or the next cycle's
 * free."), the locked guarantee quote panel (verbatim copy, green accent rail),
 * and three buff guarantee-point panels.
 *
 * No CTA here by design — this section states the promise; booking lives in the
 * neighbouring FirstStrike / Paths / FAQ sections.
 */
export interface GuaranteeProps {
  /** Optional extra classes on the <section>. */
  className?: string;
}

const POINTS: { label: string; copy: string }[] = [
  {
    label: "The metric we control",
    copy: "Hook-rate and hold-rate are what creative actually moves — that's the bar we hold.",
  },
  {
    label: "CPA holds, measured",
    copy: "Flat or better against your own control, read in your own account — not a dashboard you can't see.",
  },
  {
    label: "You keep every video",
    copy: "Win, lose, or cancel, the work is yours. Month-to-month, nothing leaves with us.",
  },
];

// Buff (green) dot — inline style mirrors the reference's per-dot override.
const BUFF_DOT: React.CSSProperties = {
  background: "var(--buff)",
  boxShadow: "0 0 10px rgba(124,224,176,.5)",
};

export default function Guarantee({ className }: GuaranteeProps) {
  const reduce = useReducedMotion();

  const reveal: Variants = {
    hidden: reduce ? { opacity: 1 } : { opacity: 0, y: 18 },
    show: (i: number) =>
      reduce
        ? { opacity: 1 }
        : {
            opacity: 1,
            y: 0,
            transition: { duration: 0.5, delay: i * 0.07, ease: [0.2, 0.7, 0.3, 1] },
          },
  };

  return (
    <section
      id="guarantee"
      className={`section border-t border-frame-soft${className ? ` ${className}` : ""}`}
    >
      <div className="wrap">
        <motion.div
          className="qhead"
          variants={reveal}
          custom={0}
          initial="hidden"
          whileInView="show"
          viewport={{ once: true, amount: 0.4 }}
        >
          <span className="inline-flex items-center gap-[9px] font-mono text-[11px] uppercase tracking-[0.14em] text-buff border border-[rgba(124,224,176,0.4)] bg-[rgba(124,224,176,0.07)] px-3 py-[5px] rounded-[7px]">
            <span className="dot" style={BUFF_DOT} aria-hidden="true" />
            The No-Risk Loadout
          </span>
        </motion.div>

        <motion.h2
          variants={reveal}
          custom={1}
          initial="hidden"
          whileInView="show"
          viewport={{ once: true, amount: 0.4 }}
        >
          Beat your control or the next cycle&rsquo;s free.
        </motion.h2>

        <motion.figure
          className="panel mt-[34px] p-0"
          variants={reveal}
          custom={2}
          initial="hidden"
          whileInView="show"
          viewport={{ once: true, amount: 0.2 }}
        >
          <div className="win-title !text-buff bg-[linear-gradient(180deg,rgba(124,224,176,0.12),transparent)]">
            <span className="gem" style={BUFF_DOT} aria-hidden="true" />
            Active Buff · No-Risk Loadout
            <span className="right">duration · 30 days</span>
          </div>
          <blockquote className="relative px-[18px] py-7 sm:px-8 before:content-[''] before:absolute before:left-0 before:top-6 before:bottom-6 before:w-[3px] before:bg-buff before:shadow-[0_0_16px_rgba(124,224,176,.5)]">
            <p className="text-[16.5px] sm:text-[18.5px] leading-[1.62] text-ink tracking-[-0.01em] pl-[18px]">
              &ldquo;Within 30 days, our creative beats your current best ad on{" "}
              <span className="text-buff font-semibold">hook-rate / hold-rate</span> (3-second +
              thumbstop) <span className="text-buff font-semibold">AND</span> your CPA holds flat or
              better — measured against your own control, in your own account, with the head-to-head
              data on the table. If it doesn&rsquo;t, your next 24-variation cycle is free.
              Month-to-month, cancel anytime, and you keep every video either way.&rdquo;
            </p>
          </blockquote>
        </motion.figure>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-[18px] mt-6">
          {POINTS.map((pt, i) => (
            <motion.div
              key={pt.label}
              className="panel p-5"
              variants={reveal}
              custom={3 + i}
              initial="hidden"
              whileInView="show"
              viewport={{ once: true, amount: 0.3 }}
            >
              <div className="mono text-[11px] uppercase tracking-[0.12em] text-buff flex items-center gap-2">
                <span className="dot" style={BUFF_DOT} aria-hidden="true" />
                {pt.label}
              </div>
              <p className="text-[14px] text-ink-soft mt-[11px] leading-[1.5]">{pt.copy}</p>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
