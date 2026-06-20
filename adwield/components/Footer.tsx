"use client";

import { motion, useReducedMotion, type Variants } from "framer-motion";
import CalButton from "@/components/CalButton";

export interface FooterProps {}

/**
 * Site footer — crest + wordmark, the locked tagline, the positioning blurb,
 * three link columns, and the proof-honest legal block (kept verbatim).
 *
 * HARD RULE 2: every booking CTA (Claim First Strike / Hire your Knight /
 * Build your Forge / Book a call) renders <CalButton variant="quiet"> — never a
 * merge-field anchor. Section anchors (#fatigue, #faq, #top…) stay plain links.
 */
export default function Footer({}: FooterProps) {
  const reduce = useReducedMotion();

  const reveal: Variants = {
    hidden: reduce ? { opacity: 1 } : { opacity: 0, y: 24 },
    show: {
      opacity: 1,
      y: 0,
      transition: reduce ? { duration: 0 } : { duration: 0.7, ease: [0.2, 0.7, 0.2, 1] },
    },
  };

  return (
    <footer className="relative z-[2] mt-[10px] border-t border-frame-soft bg-[rgba(8,12,20,0.6)] pb-9 pt-[60px]">
      <div className="wrap">
        <motion.div
          className="grid grid-cols-1 gap-8 min-[640px]:grid-cols-2 min-[900px]:grid-cols-[1.4fr_1fr_1fr_1fr]"
          variants={reveal}
          initial="hidden"
          whileInView="show"
          viewport={{ once: true, amount: 0.2 }}
        >
          {/* Brand column */}
          <div>
            <a
              href="#top"
              className="inline-flex items-center gap-[11px] text-ink no-underline"
              aria-label="Adwield home"
            >
              <svg
                width="24"
                height="24"
                viewBox="0 0 32 32"
                fill="none"
                aria-hidden="true"
                style={{ filter: "drop-shadow(0 0 8px rgba(94,200,230,0.45))" }}
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
              <span className="text-[18px] font-bold tracking-[-0.03em]">adwield</span>
            </a>

            <div className="mt-[18px] inline-flex flex-wrap items-center gap-3 font-mono text-[13px] tracking-[0.04em] text-ink-soft">
              <span>More hits.</span>
              <span className="text-gold">·</span>
              <span>More crits.</span>
              <span className="text-gold">·</span>
              <span>Every two weeks.</span>
            </div>

            <p className="mt-4 max-w-[34ch] text-[13.5px] leading-[1.55] text-ink-mute">
              The AI-native ad-creative engine for functional-consumables brands. You don&rsquo;t hire
              an agency &mdash; you equip a weapon.
            </p>
          </div>

          {/* The Weapon — section anchors */}
          <nav className="flex flex-col" aria-label="The Weapon">
            <h2 className="mb-4 font-mono text-[11px] font-medium uppercase tracking-[0.14em] text-gold">
              The Weapon
            </h2>
            <a className="block py-[5px] text-[14px] text-ink-soft no-underline hover:text-white" href="#fatigue">
              The Fatigue Wall
            </a>
            <a className="block py-[5px] text-[14px] text-ink-soft no-underline hover:text-white" href="#loadout">
              The Loadout
            </a>
            <a className="block py-[5px] text-[14px] text-ink-soft no-underline hover:text-white" href="#guarantee">
              The Guarantee
            </a>
            <a className="block py-[5px] text-[14px] text-ink-soft no-underline hover:text-white" href="#proof">
              Honest Proof
            </a>
          </nav>

          {/* Get Equipped — booking CTAs (CalButton only) */}
          <nav className="flex flex-col items-start" aria-label="Get Equipped">
            <h2 className="mb-4 font-mono text-[11px] font-medium uppercase tracking-[0.14em] text-gold">
              Get Equipped
            </h2>
            <CalButton variant="quiet" className="py-[5px] text-[14px]">
              Claim First Strike
            </CalButton>
            <CalButton variant="quiet" className="py-[5px] text-[14px]">
              Hire your Knight
            </CalButton>
            <CalButton variant="quiet" className="py-[5px] text-[14px]">
              Build your Forge
            </CalButton>
            <CalButton variant="quiet" className="py-[5px] text-[14px]">
              Book a call
            </CalButton>
          </nav>

          {/* Contact — booking goes through Cal; the rest are anchors */}
          <nav className="flex flex-col items-start" aria-label="Contact">
            <h2 className="mb-4 font-mono text-[11px] font-medium uppercase tracking-[0.14em] text-gold">
              Contact
            </h2>
            <CalButton variant="quiet" className="py-[5px] text-[14px]">
              Book a call
            </CalButton>
            <a className="block py-[5px] text-[14px] text-ink-soft no-underline hover:text-white" href="#faq">
              FAQ
            </a>
            <a className="block py-[5px] text-[14px] text-ink-soft no-underline hover:text-white" href="#top">
              adwield.com
            </a>
          </nav>
        </motion.div>

        <motion.div
          className="mt-[46px] max-w-[96ch] border-t border-frame-soft pt-6 text-[12px] leading-[1.65] text-ink-mute"
          variants={reveal}
          initial="hidden"
          whileInView="show"
          viewport={{ once: true, amount: 0.2 }}
        >
          Hit rate and crits describe the aim and the mechanism, not a guaranteed or past result.
          Every figure on this page is a target to measure, in your own account, against your own
          control. No prior paid-ads track record is claimed. Where a guarantee applies, the terms
          in the guarantee section govern. Adwield works with functional-consumables brands only.
          Produced-creative claims are substantiation-gated and FTC/Meta-screened before they ship.
          <div className="mt-5 flex flex-wrap justify-between gap-[14px] font-mono tracking-[0.04em]">
            <span>© 2026 Adwield · adwield.com</span>
            <span>Functional consumables · capped at 5 brands</span>
          </div>
        </motion.div>
      </div>
    </footer>
  );
}
