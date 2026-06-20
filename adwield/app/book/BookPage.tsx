"use client";

import Link from "next/link";
import { motion, useReducedMotion, type Variants } from "framer-motion";
import { BookCal } from "@/components/BookCall";

/**
 * /book — the dedicated First Strike booking landing page.
 *
 * A focused, single-purpose conversion surface in the Command Deck idiom. It is
 * NOT the homepage: it carries its OWN minimal header (crest + wordmark → "/",
 * nothing else — no section menu, no hotbar) and does NOT mount GameChrome.
 *
 * Layout: minimal header → hero ("Book your First Strike call") → the booking
 * panel (left rail = VSL placeholder + "what happens" list + reassurance +
 * who-you're-meeting + trust line; right = the prominent inline <Cal> calendar)
 * → a brief restated No-Risk Loadout guarantee → a short 3–4 item call FAQ.
 *
 * PROOF-ONLY (HARD RULE 1): zero fabricated metrics, testimonials, logos,
 * ratings, "as seen in", or invented results. The VSL is a literal labeled
 * placeholder until a real Loom exists. The only on-surface facts are the two
 * real ones — "no card" and "capped at 5 brands".
 *
 * Voice = the locked Adwield brand kit (First Strike, loadout, crit, hit rate,
 * Knight/Forge) — premium operator-grade, never gamer-cheesy.
 *
 * Reduced-motion safe: every entrance reveal collapses to an opacity-only / zero
 * -duration transition under prefers-reduced-motion; the Cal iframe is never
 * animated. The page also degrades fine without JS for the static content.
 */

/* ── cyan shield-check tick (matches Hero's no-risk mark), color = --equip ── */
function CheckTick() {
  return (
    <svg
      width="16"
      height="16"
      viewBox="0 0 16 16"
      fill="none"
      aria-hidden="true"
      style={{ color: "var(--equip)", flex: "none", marginTop: "3px" }}
    >
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
  );
}

/* what happens on this call — proof-only, locked voice */
const CALL_POINTS: readonly string[] = [
  "We read your product, your reviews, and your current creative — live, on the call.",
  "You see the first angle we'd swing and why it beats your control.",
  "We scope your free First Strike — one battle-ready ad of your product, no card.",
  "If it's a fit, we map the loadout. If it's not, you keep the teardown either way.",
];

/* a short, call-specific FAQ — distinct from the homepage's full FAQ, tuned to
   the one decision in front of a prospect: should I book this call? Proof-only. */
const CALL_FAQ: readonly { q: string; a: string }[] = [
  {
    q: "How long is the call?",
    a: "Fifteen minutes. We point the weapon at your product, show you the first angle we'd swing, and you decide. No deck, no 60-minute discovery loop.",
  },
  {
    q: "Is this a sales pitch?",
    a: "No. There's no slide deck and no card. Worst case, you leave with a free teardown of your account and the angle we'd build first.",
  },
  {
    q: "Who am I actually talking to?",
    a: "The operator who'd build your loadout — not a closer, not an account manager. The person on the call is the person at the forge.",
  },
  {
    q: "What happens after I book?",
    a: "You pick a time below and get a calendar invite. Come with your store URL and your current best ad; we'll do the rest live.",
  },
];

export default function BookPage() {
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
    viewport: { once: true, amount: 0.2 },
  } as const;

  return (
    <>
      {/* ── MINIMAL HEADER — crest + wordmark → "/", nothing else ──────────── */}
      <header className="nav">
        <div className="wrap nav-inner">
          <Link href="/" className="brand" aria-label="Adwield home">
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
          </Link>

          {/* a single quiet "back" link — no menu, no booking CTA (you're already here) */}
          <Link
            href="/"
            className="mono text-[12px] uppercase tracking-[0.12em] text-ink-mute no-underline hover:text-white"
          >
            ← Back to base
          </Link>
        </div>
      </header>

      <main id="top">
        {/* ── HERO ──────────────────────────────────────────────────────────── */}
        <section className="hero">
          <div className="wrap">
            <motion.span
              className="kicker"
              variants={reveal}
              custom={0}
              {...inView}
            >
              <span className="dot" aria-hidden="true" />
              War room · 15 min · no pitch
            </motion.span>

            <motion.h1
              className="mt-5 max-w-[20ch] text-[clamp(33px,5.7vw,58px)] font-[740] leading-[1.03] tracking-[-0.03em]"
              variants={reveal}
              custom={1}
              {...inView}
            >
              Book your{" "}
              <span className="text-equip [text-shadow:0_0_26px_rgba(94,200,230,0.35)]">
                First Strike
              </span>{" "}
              call.
            </motion.h1>

            <motion.p
              className="hero-sub"
              variants={reveal}
              custom={2}
              {...inView}
            >
              Fifteen minutes. We point the weapon at your product, show you the angle we&rsquo;d
              swing first, and you decide if you want the free First Strike built &mdash; one
              battle-ready ad of your product, no card.
            </motion.p>

            <motion.div
              className="tagline"
              variants={reveal}
              custom={3}
              {...inView}
            >
              <span>More hits.</span>
              <span className="sep">·</span>
              <span>More crits.</span>
              <span className="sep">·</span>
              <span>Every two weeks.</span>
            </motion.div>
          </div>
        </section>

        {/* ── THE BOOKING PANEL — context rail + the prominent inline calendar ── */}
        <section className="pb-[40px] pt-2">
          <div className="wrap">
            <motion.div
              className="panel grid grid-cols-1 gap-0 p-0 md:grid-cols-[0.9fr_1.1fr]"
              variants={reveal}
              custom={4}
              {...inView}
            >
              <div className="win-title md:col-span-2">
                <span className="gem" aria-hidden="true" />
                War Room · Book the Call
                <span className="right">
                  <span className="dot" aria-hidden="true" />
                  15 min · no card
                </span>
              </div>

              {/* LEFT · context rail */}
              <div className="flex flex-col gap-6 border-b border-frame-soft p-[26px] md:border-b-0 md:border-r">
                {/* 90-sec VSL / Loom placeholder — literal, no fake thumbnail, no autoplay */}
                <div
                  className="relative grid aspect-video place-items-center rounded-[5px] border border-dashed border-frame text-center"
                  style={{
                    backgroundImage:
                      "repeating-linear-gradient(135deg, transparent, transparent 11px, rgba(190,220,255,0.02) 11px, rgba(190,220,255,0.02) 22px)",
                  }}
                >
                  <span
                    className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 opacity-25"
                    aria-hidden="true"
                  >
                    <svg width="46" height="46" viewBox="0 0 46 46" fill="none">
                      <circle cx="23" cy="23" r="21" stroke="#5EC8E6" strokeWidth="1.3" />
                      <path d="M19 16 L31 23 L19 30 Z" fill="#5EC8E6" />
                    </svg>
                  </span>
                  <div className="relative">
                    <div className="mono text-[12px] uppercase tracking-[0.14em] text-gold">
                      [ 90-SEC LOOM PLACEHOLDER ]
                    </div>
                    <p className="mt-2 text-[13px] text-ink-mute">
                      A 90-second walkthrough of how a First Strike gets built &mdash; drops in here.
                    </p>
                  </div>
                </div>

                {/* What happens on this call */}
                <div>
                  <div className="mono mb-3 text-[11px] uppercase tracking-[0.14em] text-equip">
                    What happens on this call
                  </div>
                  <ul className="m-0 flex list-none flex-col gap-[11px] p-0">
                    {CALL_POINTS.map((point) => (
                      <li key={point} className="flex items-start gap-[10px]">
                        <CheckTick />
                        <span className="text-[14px] leading-[1.5] text-ink-soft">{point}</span>
                      </li>
                    ))}
                  </ul>
                </div>

                {/* reassurance line — no-pitch / no-card */}
                <p className="flex items-start gap-2 text-[13.5px] text-ink-mute">
                  <span className="dot buff" style={{ marginTop: "5px" }} aria-hidden="true" />
                  No pitch deck, no obligation, no card. Worst case, you leave with a free teardown of
                  your account.
                </p>

                {/* who you're meeting */}
                <div>
                  <p className="text-[14px] leading-[1.5] text-ink">
                    You&rsquo;re meeting the operator who&rsquo;ll actually build it &mdash; not a
                    closer, not an account manager.
                  </p>
                  <span className="mono mt-2 inline-flex items-center gap-2 text-[11px] uppercase tracking-[0.12em] text-ink-mute">
                    <span className="dot" aria-hidden="true" />
                    Founder · runs your first loadout
                  </span>
                </div>

                {/* trust line — proof-only, NO metrics/logos/ratings */}
                <p className="mono mt-auto pt-2 text-[11px] leading-[1.5] tracking-[0.04em] text-ink-mute">
                  The free First Strike and the No-Risk Loadout carry the proof &mdash; not a logo
                  wall. Capped at 5 brands.
                </p>
              </div>

              {/* RIGHT · the inline calendar (given prominence) */}
              <div className="min-h-[640px] p-[14px] md:p-5">
                <BookCal />
              </div>
            </motion.div>
          </div>
        </section>

        {/* ── THE NO-RISK LOADOUT — guarantee, restated briefly ─────────────── */}
        <section className="section">
          <div className="wrap">
            <motion.div className="qhead" variants={reveal} custom={0} {...inView}>
              <span className="inline-flex items-center gap-[9px] rounded-[7px] border border-[rgba(124,224,176,0.4)] bg-[rgba(124,224,176,0.07)] px-3 py-[5px] font-mono text-[11px] uppercase tracking-[0.14em] text-buff">
                <span
                  className="dot buff"
                  style={{ background: "var(--buff)", boxShadow: "0 0 10px rgba(124,224,176,.5)" }}
                  aria-hidden="true"
                />
                The No-Risk Loadout
              </span>
            </motion.div>

            <motion.h2 variants={reveal} custom={1} {...inView}>
              Beat your control or the next cycle&rsquo;s free.
            </motion.h2>

            <motion.p className="lede" variants={reveal} custom={2} {...inView}>
              The risk stays on us. Within 30 days, our creative beats your current best ad on
              hook-rate / hold-rate and your CPA holds flat or better &mdash; measured against your
              own control, in your own account. If it doesn&rsquo;t, your next 24-variation cycle is
              free. Month-to-month, cancel anytime, and you keep every video either way.
            </motion.p>
          </div>
        </section>

        {/* ── A SHORT CALL FAQ — tuned to the one decision: book the call ───── */}
        <section className="section">
          <style>{`
            .bookfaq details { border-bottom: 1px solid var(--frame-soft); }
            .bookfaq details:first-child { border-top: 1px solid var(--frame-soft); }
            .bookfaq summary {
              list-style: none; cursor: pointer; padding: 20px 16px;
              display: flex; align-items: center; gap: 14px;
              font-size: 17px; font-weight: 600; letter-spacing: -0.02em;
              transition: color .15s, background .15s;
            }
            .bookfaq summary:hover { color: #fff; background: rgba(40,55,85,0.18); }
            .bookfaq summary::-webkit-details-marker { display: none; }
            .bookfaq summary .qm {
              flex: none; width: 18px; height: 18px; color: var(--gold);
              transform: rotate(45deg); border: 1px solid var(--gold-dim);
              display: flex; align-items: center; justify-content: center;
              font-family: var(--font-mono), ui-monospace, monospace; font-size: 10px;
            }
            .bookfaq summary .qm span { transform: rotate(-45deg); }
            .bookfaq summary .txt { flex: 1; }
            .bookfaq summary .pm {
              flex: none; width: 22px; height: 22px; position: relative;
              color: var(--ink-mute); transition: color .15s;
            }
            .bookfaq summary:hover .pm { color: var(--equip); }
            .bookfaq summary .pm::before, .bookfaq summary .pm::after {
              content: ""; position: absolute; background: currentColor; border-radius: 2px;
            }
            .bookfaq summary .pm::before { left: 4px; right: 4px; top: 10px; height: 2px; }
            .bookfaq summary .pm::after {
              top: 4px; bottom: 4px; left: 10px; width: 2px;
              transition: transform .2s, opacity .2s;
            }
            .bookfaq details[open] summary .pm::after { transform: scaleY(0); opacity: 0; }
            .bookfaq details[open] summary { color: #fff; background: rgba(40,55,85,0.12); }
            .bookfaq .faq-a {
              padding: 0 16px 22px 48px; font-size: 15px; color: var(--ink-soft);
              max-width: 80ch; line-height: 1.62;
            }
          `}</style>

          <div className="wrap">
            <motion.div className="qhead" variants={reveal} custom={0} {...inView}>
              <span className="qmarker" aria-hidden="true">
                <svg width="30" height="30" viewBox="0 0 30 30" fill="none">
                  <path
                    d="M8 5h14v12H13l-5 5z"
                    stroke="#E3C778"
                    strokeWidth="1.6"
                    strokeLinejoin="round"
                  />
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
                <span className="q">Before you book</span>
                <span className="s">Quick questions</span>
              </div>
            </motion.div>

            <motion.h2 variants={reveal} custom={1} {...inView}>
              What to expect on the call.
            </motion.h2>

            <motion.div className="bookfaq mt-9" variants={reveal} custom={2} {...inView}>
              {CALL_FAQ.map((item) => (
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
      </main>
    </>
  );
}
