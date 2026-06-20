"use client";

import { motion, useReducedMotion, type Variants } from "framer-motion";
import CalButton from "@/components/CalButton";

/**
 * FirstStrike — `#first-strike`.
 *
 * The free "First Strike" offer: one battle-ready ad of the prospect's product,
 * built and delivered before any money changes hands. Faithful rebuild of the
 * approved "Command Deck" reference: legendary (crit/amber) tag + headline, lede,
 * and the gold/amber `fs-card` panel containing 3 numbered steps and a CTA column
 * with a crit CalButton + a quiet "Book a call instead" CalButton.
 *
 * Section-specific styling (the amber wash, the legendary tag, the rotated step
 * numbers, the split grid) is rebuilt with Tailwind arbitrary values matching the
 * reference pixel-for-pixel; shared chrome (.panel, .win-title, .lede) reuses the
 * ported globals.css classes.
 */
export interface FirstStrikeProps {
  /** Optional extra classes on the <section>. */
  className?: string;
}

const STEPS: { n: string; title: string; copy: string }[] = [
  {
    n: "1",
    title: "Point us at your product.",
    copy: "Just the URL. We read your site, your reviews, and what your buyers actually say.",
  },
  {
    n: "2",
    title: "We forge one battle-ready ad.",
    copy: "A real, production-grade creative of your product — angle, hook, edit. No mockup.",
  },
  {
    n: "3",
    title: "You watch it, free.",
    copy: "No card, no call. If it's not sharp, you've lost nothing but the link.",
  },
];

export default function FirstStrike({ className }: FirstStrikeProps) {
  const reduce = useReducedMotion();

  // Scroll-reveal: rise + fade, staggered by index. Reduced motion → final state only.
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
      id="first-strike"
      className={`section border-t border-frame-soft${className ? ` ${className}` : ""}`}
      style={{
        background:
          "radial-gradient(900px 400px at 16% 0%, rgba(244,162,59,0.10), transparent 64%)",
      }}
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
          <span className="inline-flex items-center gap-[9px] font-mono text-[11px] uppercase tracking-[0.16em] text-crit border border-[rgba(244,162,59,0.45)] bg-[rgba(244,162,59,0.08)] px-3 py-[5px] rounded-[7px]">
            <span className="dot crit" aria-hidden="true" />
            First Strike · Free
          </span>
        </motion.div>

        <motion.h2
          variants={reveal}
          custom={1}
          initial="hidden"
          whileInView="show"
          viewport={{ once: true, amount: 0.4 }}
        >
          One real ad of <span className="text-crit">your</span> product. Free, before you
          pay anything.
        </motion.h2>

        <motion.p
          className="lede"
          variants={reveal}
          custom={2}
          initial="hidden"
          whileInView="show"
          viewport={{ once: true, amount: 0.4 }}
        >
          We pull from your real site and real reviews and forge one made-for-you ad — same grade
          as a paid cycle. You watch it work before any money moves. The free ad is the pitch.
        </motion.p>

        <motion.div
          className="panel mt-10 grid grid-cols-1 md:grid-cols-2 gap-0 !border-[rgba(244,162,59,0.4)]"
          variants={reveal}
          custom={3}
          initial="hidden"
          whileInView="show"
          viewport={{ once: true, amount: 0.2 }}
        >
          <div className="win-title md:col-span-2 !text-crit bg-[linear-gradient(180deg,rgba(244,162,59,0.16),transparent)]">
            <span
              className="gem !bg-crit"
              style={{ boxShadow: "0 0 9px var(--crit-glow)" }}
              aria-hidden="true"
            />
            Reward · First Strike (Free)
            <span className="right">
              <span className="dot crit" aria-hidden="true" />
              no card · no pitch
            </span>
          </div>

          <div className="md:col-span-2 grid grid-cols-1 md:grid-cols-2 gap-[26px] md:gap-9 items-center p-[30px]">
            <ol className="flex flex-col list-none p-0 m-0">
              {STEPS.map((s, i) => (
                <li
                  key={s.n}
                  className={`flex gap-[15px] py-[14px] ${
                    i < STEPS.length - 1 ? "border-b border-frame-soft" : ""
                  }`}
                >
                  <span className="mono flex-none grid place-items-center w-[34px] h-[34px] rotate-45 border border-[rgba(244,162,59,0.5)] bg-[rgba(244,162,59,0.07)] text-crit text-[13px] font-semibold">
                    <span className="-rotate-45">{s.n}</span>
                  </span>
                  <span className="block">
                    <b className="block text-[15px] font-semibold mb-[3px]">{s.title}</b>
                    <span className="block text-[14px] leading-[1.5] text-ink-soft">{s.copy}</span>
                  </span>
                </li>
              ))}
            </ol>

            <div className="flex flex-col items-start gap-[14px] md:border-l border-t md:border-t-0 border-frame-soft pt-[26px] md:pt-0 md:pl-9">
              <div className="text-[22px] font-bold tracking-[-0.02em] leading-[1.15]">
                See the weapon before you equip it.
              </div>
              <p className="text-[14px] text-ink-soft">
                The clean way to judge us — one real ad of your product, on the table, at zero cost.
                Every cycle you wait, the Fatigue Wall gets closer.
              </p>
              <CalButton variant="crit" large>
                Claim your First Strike
              </CalButton>
              <CalButton variant="quiet">
                Book a call instead{" "}
                <span className="arrow" aria-hidden="true">
                  →
                </span>
              </CalButton>
            </div>
          </div>
        </motion.div>
      </div>
    </section>
  );
}
