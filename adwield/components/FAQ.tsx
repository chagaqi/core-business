"use client";

import { motion, useReducedMotion, type Variants } from "framer-motion";

export interface FAQProps {}

interface QA {
  q: string;
  /** Answer rendered as React so inline <b> emphasis from the reference is kept. */
  a: React.ReactNode;
}

/** Reference Q&A copy, verbatim (Quest 05 — "For the skeptical operator"). */
const ITEMS: QA[] = [
  {
    q: "Isn't this just AI slop?",
    a: "No. The model is a production tool, not the strategist. Every loadout starts from a human hypothesis about why a buyer acts and ends with a human edit and an FTC/Meta-screened claim. Volume tests ideas fast — it doesn't flood your account. You greenlight the angles before anything ships.",
  },
  {
    q: "Why trust a newer shop?",
    a: "Don't trust it on faith — that's why the First Strike is free and the guarantee is locked. You see one real ad of your product before you pay; the first paid cycle has to beat your control or the next one's free. We carry the risk because we're new, not in spite of it.",
  },
  {
    q: "What if I already run 90 creatives a week?",
    a: "Then volume isn't your problem — hit rate is. Not how many you ship, but how many beat your control before they fatigue. We raise the rate of winners inside your existing pace. The First Strike shows the difference on one ad.",
  },
  {
    q: "How do you make 24 ads off 4 approvals?",
    a: (
      <>
        The 4 are <b>angles</b> — distinct hypotheses about why someone buys. Each becomes 6
        variations: different hooks, openers, edits, formats testing the same idea. You approve the
        four directions; the 24 are how we pressure-test each in the auction.
      </>
    ),
  },
  {
    q: "How much of my time does this take?",
    a: "On the Knight path, roughly a greenlight call every two weeks. You approve angles and read results; we handle production, launch, tagging, and the read. Equipping a weapon doesn't add a workflow.",
  },
  {
    q: "What does it cost?",
    a: "The First Strike is free — no card. The Knight retainer is quoted live against your volume and economics, month-to-month, capped at 5 brands. The Forge install is by application. Price isn't the lead — the winner is. We'd rather earn the retainer with a free ad first.",
  },
  {
    q: "Do I own the work — and who's this for?",
    a: "You own every video, win or lose, on every path. Built for functional-consumables brands at roughly $20–100K/mo — mushroom coffee, adaptogen gummies, functional beverages, greens, nootropics. Deliberately narrow: the judgment and economics are tuned to that buyer.",
  },
];

/**
 * #faq — Quest 05. Native <details>/<summary> disclosure (works without JS,
 * keyboard-accessible, keeps global focus states). The diamond "?" marker and
 * the plus→minus toggle are scoped CSS pseudo-elements; the section header, H2,
 * and the accordion list scroll-reveal via Framer Motion (reduced-motion-safe).
 */
export default function FAQ({}: FAQProps) {
  const reduce = useReducedMotion();

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
      id="faq"
      data-quest="Lore unlocked"
      data-rare="gold"
      data-xp="80"
      data-kicker="Codex updated"
    >
      {/* Scoped styling for the disclosure list — borders, the rotated "?" gem,
          and the plus→minus toggle that Tailwind can't express via pseudo-elements. */}
      <style>{`
        .faq-list details { border-bottom: 1px solid var(--frame-soft); }
        .faq-list details:first-child { border-top: 1px solid var(--frame-soft); }
        .faq-list summary {
          list-style: none; cursor: pointer; padding: 20px 16px;
          display: flex; align-items: center; gap: 14px;
          font-size: 17px; font-weight: 600; letter-spacing: -0.02em;
          transition: color .15s, background .15s;
        }
        .faq-list summary:hover { color: #fff; background: rgba(40,55,85,0.18); }
        .faq-list summary::-webkit-details-marker { display: none; }
        .faq-list summary .qm {
          flex: none; width: 18px; height: 18px; color: var(--gold);
          transform: rotate(45deg); border: 1px solid var(--gold-dim);
          display: flex; align-items: center; justify-content: center;
          font-family: var(--font-mono), ui-monospace, monospace; font-size: 10px;
        }
        .faq-list summary .qm span { transform: rotate(-45deg); }
        .faq-list summary .txt { flex: 1; }
        .faq-list summary .pm {
          flex: none; width: 22px; height: 22px; position: relative;
          color: var(--ink-mute); transition: color .15s;
        }
        .faq-list summary:hover .pm { color: var(--equip); }
        .faq-list summary .pm::before, .faq-list summary .pm::after {
          content: ""; position: absolute; background: currentColor; border-radius: 2px;
        }
        .faq-list summary .pm::before { left: 4px; right: 4px; top: 10px; height: 2px; }
        .faq-list summary .pm::after {
          top: 4px; bottom: 4px; left: 10px; width: 2px;
          transition: transform .2s, opacity .2s;
        }
        .faq-list details[open] summary .pm::after { transform: scaleY(0); opacity: 0; }
        .faq-list details[open] summary { color: #fff; background: rgba(40,55,85,0.12); }
        .faq-list .faq-a {
          padding: 0 16px 22px 48px; font-size: 15px; color: var(--ink-soft);
          max-width: 80ch; line-height: 1.62;
        }
        .faq-list .faq-a b { color: var(--ink); }
      `}</style>

      <div className="wrap">
        <motion.div className="qhead" variants={reveal} custom={0} {...inView}>
          <span className="qmarker" aria-hidden="true">
            <svg width="30" height="30" viewBox="0 0 30 30" fill="none">
              <path d="M8 5h14v12H13l-5 5z" stroke="#E3C778" strokeWidth="1.6" strokeLinejoin="round" />
              <path
                d="M12 9.5c0-1.4 1.2-2.2 3-2.2s3 .9 3 2.4c0 1.2-1 1.8-2.2 2.2-.6.2-.8.5-.8 1.1"
                stroke="#E3C778"
                strokeWidth="1.4"
                strokeLinecap="round"
                fill="none"
              />
              <circle cx="15" cy="15.5" r=".9" fill="#E3C778" />
            </svg>
          </span>
          <div className="qchip">
            <span className="q">Quest 05</span>
            <span className="s">For the skeptical operator</span>
          </div>
        </motion.div>

        <motion.h2 variants={reveal} custom={1} {...inView}>
          Questions a sharp founder asks.
        </motion.h2>

        <motion.div className="faq-list mt-9" variants={reveal} custom={2} {...inView}>
          {ITEMS.map((item) => (
            <details key={item.q}>
              <summary>
                <span className="qm" aria-hidden="true">
                  <span>?</span>
                </span>
                <span className="txt">{item.q}</span>
                <span className="pm" aria-hidden="true" />
              </summary>
              <div className="faq-a">{item.a}</div>
            </details>
          ))}
        </motion.div>
      </div>
    </section>
  );
}
