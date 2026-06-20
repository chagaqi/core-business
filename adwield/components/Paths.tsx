"use client";

import { motion, useReducedMotion, type Variants } from "framer-motion";
import CalButton from "@/components/CalButton";

/**
 * Paths — `#paths` ("Choose Your Path", Quest 03).
 *
 * The two-class selector. Faithful rebuild of the approved "Command Deck"
 * reference: a gold quest header, headline + lede, then two `.panel` path cards
 * side-by-side —
 *   • Knight  (Path A · Done-For-You,  equip/cyan)  → CalButton "Hire your Knight"
 *   • Forge   (Path B · Done-With-You, epic/violet) → ghost CalButton "Build your Forge"
 *
 * There is NO third self-serve / endgame option by design. Card hover lift +
 * rarity-tinted glow is rebuilt with Framer Motion (whileHover) and a CSS shadow
 * on the panel, both gated behind useReducedMotion().
 */
export interface PathsProps {
  /** Optional extra classes on the <section>. */
  className?: string;
}

export default function Paths({ className }: PathsProps) {
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

  // Card hover-lift; disabled under reduced motion.
  const hover = reduce ? undefined : { y: -4 };

  return (
    <section
      id="paths"
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
          <span className="qmarker" aria-hidden="true">
            <svg width="30" height="30" viewBox="0 0 30 30" fill="none">
              <path
                d="M15 3.5 26.5 10v10L15 26.5 3.5 20V10z"
                stroke="#E3C778"
                strokeWidth="1.6"
                strokeLinejoin="round"
              />
              <path d="M11 15h8M15 11v8" stroke="#E3C778" strokeWidth="1.5" strokeLinecap="round" />
            </svg>
          </span>
          <div className="qchip">
            <span className="q">Quest 03</span>
            <span className="s">Choose Your Path</span>
          </div>
        </motion.div>

        <motion.h2
          variants={reveal}
          custom={1}
          initial="hidden"
          whileInView="show"
          viewport={{ once: true, amount: 0.4 }}
        >
          Two ways to wield it.
        </motion.h2>

        <motion.p
          className="lede"
          variants={reveal}
          custom={2}
          initial="hidden"
          whileInView="show"
          viewport={{ once: true, amount: 0.4 }}
        >
          One weapon, two operators — have us run the full loadout for you, or install it in your
          own domain and own it outright.
        </motion.p>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-[22px] mt-[42px]">
          {/* ---- Path A · Knight (DFY, equip/cyan) ---- */}
          <motion.article
            className="panel knight p-0 flex flex-col"
            variants={reveal}
            custom={3}
            initial="hidden"
            whileInView="show"
            viewport={{ once: true, amount: 0.2 }}
            whileHover={hover}
          >
            <div className="win-title">
              <span className="gem" aria-hidden="true" />
              Class A · Done-For-You
            </div>
            <div className="p-6 flex flex-col flex-1">
              <div className="flex items-center gap-[13px]">
                <span
                  className="flex-none grid place-items-center w-[46px] h-[46px] rotate-45 border border-frame text-equip bg-[radial-gradient(circle_at_50%_30%,rgba(40,55,85,0.6),rgba(11,17,29,0.7))]"
                  style={{ boxShadow: "0 0 22px -8px var(--equip-glow)" }}
                  aria-hidden="true"
                >
                  <span className="-rotate-45">
                    <svg width="22" height="22" viewBox="0 0 24 24" fill="none">
                      <path
                        d="M12 2 19 5v6c0 4.5-3 7.6-7 9-4-1.4-7-4.5-7-9V5Z"
                        stroke="currentColor"
                        strokeWidth="1.5"
                        strokeLinejoin="round"
                      />
                      <path
                        d="M12 7v8M8.5 11h7"
                        stroke="currentColor"
                        strokeWidth="1.5"
                        strokeLinecap="round"
                      />
                    </svg>
                  </span>
                </span>
                <div>
                  <span className="mono block text-[10.5px] uppercase tracking-[0.14em] text-ink-mute">
                    Path A
                  </span>
                  <h3 className="text-[22px] mt-[3px] tracking-[-0.025em]">Hire a Maxed-Out Knight</h3>
                </div>
              </div>
              <div className="text-[15px] font-semibold mt-[14px] text-equip">We wield it for you.</div>
              <p className="text-[14.5px] text-ink-soft mt-3 leading-[1.58]">
                A max-level operator runs the full loadout inside your account. You greenlight
                angles and watch the crits land — no hiring, no headcount, no learning curve.
              </p>
              <ul className="mono mt-[18px] flex flex-col gap-[10px] list-none p-0 m-0">
                {[
                  "A max-level operator on your account",
                  "4 angles × 24 variations, every two weeks",
                  "Launched + tagged in your own account",
                  "You greenlight angles — you watch the crits land",
                  "Beat your control or the next cycle's free",
                ].map((b) => (
                  <li key={b} className="flex items-start gap-[10px] text-[13px] leading-[1.45] text-ink-soft">
                    <span
                      className="flex-none mt-[5px] w-[6px] h-[6px] rotate-45 bg-equip"
                      style={{ boxShadow: "0 0 8px var(--equip-glow)" }}
                      aria-hidden="true"
                    />
                    <span>{b}</span>
                  </li>
                ))}
              </ul>
              <div className="mt-auto pt-[22px]">
                <CalButton variant="primary">Hire your Knight</CalButton>
                <div className="mono text-[11px] text-ink-mute tracking-[0.04em] mt-[14px] flex items-center gap-2">
                  <span className="dot" aria-hidden="true" />
                  Retainer quoted live · capped at 5 brands
                </div>
              </div>
            </div>
          </motion.article>

          {/* ---- Path B · Forge (DWY, epic/violet) ---- */}
          <motion.article
            className="panel forge p-0 flex flex-col"
            variants={reveal}
            custom={4}
            initial="hidden"
            whileInView="show"
            viewport={{ once: true, amount: 0.2 }}
            whileHover={hover}
          >
            <div className="win-title">
              <span
                className="gem"
                style={{ background: "var(--epic)", boxShadow: "0 0 9px var(--epic-glow)" }}
                aria-hidden="true"
              />
              Class B · Done-With-You
            </div>
            <div className="p-6 flex flex-col flex-1">
              <div className="flex items-center gap-[13px]">
                <span
                  className="flex-none grid place-items-center w-[46px] h-[46px] rotate-45 border border-frame text-epic bg-[radial-gradient(circle_at_50%_30%,rgba(40,55,85,0.6),rgba(11,17,29,0.7))]"
                  style={{ boxShadow: "0 0 22px -8px var(--epic-glow)" }}
                  aria-hidden="true"
                >
                  <span className="-rotate-45">
                    <svg width="22" height="22" viewBox="0 0 24 24" fill="none">
                      <path
                        d="M4 14h16l-2 7H6Z"
                        stroke="currentColor"
                        strokeWidth="1.5"
                        strokeLinejoin="round"
                      />
                      <path
                        d="M9 14c0-3 1.5-4 1.5-6S9 5 9 5M14.5 14c0-2.5 1.2-3.4 1.2-5"
                        stroke="currentColor"
                        strokeWidth="1.5"
                        strokeLinecap="round"
                      />
                    </svg>
                  </span>
                </span>
                <div>
                  <span className="mono block text-[10.5px] uppercase tracking-[0.14em] text-ink-mute">
                    Path B
                  </span>
                  <h3 className="text-[22px] mt-[3px] tracking-[-0.025em]">
                    Build a Forge in Your Domain
                  </h3>
                </div>
              </div>
              <div className="text-[15px] font-semibold mt-[14px] text-epic">
                The weapon stays yours.
              </div>
              <p className="text-[14.5px] text-ink-soft mt-3 leading-[1.58]">
                We install the Adwield Forge inside your domain — your tools, your account, your crew
                — and train your team to wield it. When we&rsquo;re done, the capability doesn&rsquo;t
                leave with us.
              </p>
              <ul className="mono mt-[18px] flex flex-col gap-[10px] list-none p-0 m-0">
                {[
                  "The Adwield Forge installed in your domain",
                  "Your tools, your account, your crew",
                  "We train your team to run the loadout",
                  "Same 4×24 cadence, run in-house",
                  "The weapon stays yours — you don't rent it",
                ].map((b) => (
                  <li key={b} className="flex items-start gap-[10px] text-[13px] leading-[1.45] text-ink-soft">
                    <span
                      className="flex-none mt-[5px] w-[6px] h-[6px] rotate-45 bg-epic"
                      style={{ boxShadow: "0 0 8px var(--epic-glow)" }}
                      aria-hidden="true"
                    />
                    <span>{b}</span>
                  </li>
                ))}
              </ul>
              <div className="mt-auto pt-[22px]">
                <CalButton variant="ghost">Build your Forge — by application</CalButton>
                <div className="mono text-[11px] text-ink-mute tracking-[0.04em] mt-[14px] flex items-center gap-2">
                  <span className="dot epic" aria-hidden="true" />
                  Founding cohort · opens after the first documented wins
                </div>
              </div>
            </div>
          </motion.article>
        </div>
      </div>
    </section>
  );
}
