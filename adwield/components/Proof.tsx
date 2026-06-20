"use client";

import { motion, useReducedMotion, type Variants } from "framer-motion";

export interface ProofProps {}

/**
 * #proof — Honest Proof section (Quest 04).
 *
 * PROOF-ONLY (hard rule): the headline number is a literal "—%" placeholder and
 * is NEVER animated/counted to a value. The reference's `data-to="47"` count-up
 * is intentionally dropped. No fabricated metrics, testimonials, logos, or
 * ratings — the case-study block stays the literal "[ CASE STUDY PLACEHOLDER ]".
 */
export default function Proof({}: ProofProps) {
  const reduce = useReducedMotion();

  // Scroll-reveal: rise + fade with a per-item stagger (mirrors the reference's
  // `--i * 70ms`). Fully disabled under prefers-reduced-motion (final state only).
  const reveal: Variants = {
    hidden: reduce ? { opacity: 1 } : { opacity: 0, y: 24 },
    show: (i: number) => ({
      opacity: 1,
      y: 0,
      transition: reduce
        ? { duration: 0 }
        : { duration: 0.7, delay: i * 0.07, ease: [0.2, 0.7, 0.2, 1] },
    }),
  };

  const inView = {
    initial: "hidden",
    whileInView: "show",
    viewport: { once: true, amount: 0.3 },
  } as const;

  return (
    <section
      className="section"
      id="proof"
      data-quest="Inspecting the data"
      data-rare="gold"
      data-xp="90"
      data-kicker="Records examined"
    >
      <div className="wrap">
        <motion.div className="qhead" variants={reveal} custom={0} {...inView}>
          <span className="qmarker" aria-hidden="true">
            <svg width="30" height="30" viewBox="0 0 30 30" fill="none">
              <circle cx="13" cy="13" r="8" stroke="#E3C778" strokeWidth="1.6" />
              <path d="m19 19 6 6" stroke="#E3C778" strokeWidth="1.6" strokeLinecap="round" />
            </svg>
          </span>
          <div className="qchip">
            <span className="q">Quest 04</span>
            <span className="s">Honest Proof</span>
          </div>
        </motion.div>

        <motion.h2 variants={reveal} custom={1} {...inView}>
          No logo wall. The free ad and the guarantee are the proof.
        </motion.h2>

        <motion.p className="lede" variants={reveal} custom={2} {...inView}>
          We&rsquo;d rather show you than tell you. The First Strike proves it on your product;
          the teardowns prove how we think. And here&rsquo;s the one real number we have &mdash;
          labeled honestly.
        </motion.p>

        <div className="mt-10 grid grid-cols-1 items-stretch gap-[22px] md:grid-cols-2">
          <motion.div className="panel p-[26px]" variants={reveal} custom={3} {...inView}>
            <div className="mb-[14px] font-mono text-[11px] uppercase tracking-[0.12em] text-ink-mute">
              Hold-rate · founder&rsquo;s own small test
            </div>
            {/* PROOF-ONLY: literal "—%" placeholder, NOT animated to any number. */}
            <div className="flex items-baseline gap-[14px]">
              <span
                className="cu font-mono text-[46px] font-semibold leading-none tracking-[-0.02em] text-gold"
                style={{ textShadow: "0 0 20px var(--gold-glow)" }}
                aria-label="Result placeholder — no number claimed yet"
              >
                &mdash;%
              </span>
              <span className="text-[14px] text-ink-soft">3-second hold-rate, single creative</span>
            </div>
            <p className="mt-[14px] text-[13px] leading-[1.5] text-ink-mute">
              One ad, one small test off the founder&rsquo;s own account. Not a portfolio, not a
              paid-client result &mdash; a single honest data point. Your numbers get measured in
              your account, against your control.
            </p>
          </motion.div>

          <motion.div className="panel p-[26px]" variants={reveal} custom={4} {...inView}>
            <div className="mb-[14px] font-mono text-[11px] uppercase tracking-[0.12em] text-ink-mute">
              How we show judgment
            </div>
            <div className="flex items-baseline gap-[14px]">
              <span
                className="font-mono text-[30px] tracking-[-0.01em] text-equip"
                style={{ textShadow: "0 0 20px var(--equip-glow)" }}
              >
                Teardowns
              </span>
            </div>
            <p className="mt-[14px] text-[13px] leading-[1.5] text-ink-mute">
              Before there&rsquo;s a track record, judgment is the product. We read your account and
              your competitors&rsquo; creative out loud &mdash; what&rsquo;s winning, what&rsquo;s
              fatiguing, the angle we&rsquo;d swing first. You see how we think before you decide.
            </p>
          </motion.div>
        </div>

        <motion.div
          className="mt-[22px] rounded-[5px] border border-dashed border-frame p-[30px] text-center"
          style={{
            backgroundImage:
              "repeating-linear-gradient(135deg, transparent, transparent 11px, rgba(190,220,255,0.02) 11px, rgba(190,220,255,0.02) 22px)",
          }}
          variants={reveal}
          custom={5}
          {...inView}
        >
          <div className="font-mono text-[13px] uppercase tracking-[0.14em] text-gold">
            [ CASE STUDY PLACEHOLDER ]
          </div>
          <p className="mx-auto mt-3 max-w-[60ch] text-[14px] leading-[1.55] text-ink-mute">
            Founding-partner deltas land here &mdash; control vs. winner on hook-rate, hold-rate,
            and CPA-flat, baseline measured first. Slots are limited and real; once the wins are
            documented, the proof replaces this block.
          </p>
        </motion.div>
      </div>
    </section>
  );
}
