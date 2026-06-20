"use client";

import { useEffect } from "react";
import { motion, useReducedMotion, type Variants } from "framer-motion";
import Cal, { getCalApi } from "@calcom/embed-react";

const CAL_LINK = "bookthecall/firststrike";
const CAL_NAMESPACE = "firststrike";

/**
 * Brand accent pulled from the design tokens (tailwind.config.ts → colors.equip /
 * globals.css → --equip). Cal needs a literal hex, so mirror the token value
 * here: the cyan that powers the crest + every primary CTA glow.
 */
const BRAND = "#5EC8E6"; // = --equip

/**
 * The inline Cal calendar. Uses the default `Cal` export from
 * @calcom/embed-react (the inline component). Theming is applied two ways for
 * reliability: (1) the `config` prop on `<Cal>`, and (2) a one-time
 * `cal("ui", …)` on the namespace in `getCalApi`.
 *
 *  - `theme: "dark"` forces Cal's dark surface so the iframe matches the
 *    #070A12 deck instead of flashing a white calendar.
 *  - `cal-brand = #5EC8E6` recolors Cal's selected-date / primary-button accents
 *    to the brand cyan, matching `.btn-primary`.
 *  - `layout: "month_view"` per spec (parity with the old popup config).
 *  - `minHeight: 640px` keeps the month view from clipping.
 *
 * Exported so the dedicated `/book` landing page can reuse the exact same
 * inline calendar + Cal theming (namespace, calLink, dark/brand-cyan/month_view)
 * without duplicating the `getCalApi` wiring.
 */
export function BookCal() {
  useEffect(() => {
    let active = true;
    (async () => {
      const cal = await getCalApi({ namespace: CAL_NAMESPACE });
      if (!active) return;
      cal("ui", {
        theme: "dark",
        cssVarsPerTheme: {
          light: { "cal-brand": BRAND },
          dark: { "cal-brand": BRAND },
        },
        hideEventTypeDetails: false,
        layout: "month_view",
      });
    })();
    return () => {
      active = false;
    };
  }, []);

  return (
    <Cal
      namespace={CAL_NAMESPACE}
      calLink={CAL_LINK}
      id="book-cal"
      style={{ width: "100%", height: "100%", minHeight: "640px", overflow: "scroll" }}
      // `layout`/`theme` are the typed members of the Cal `config` prop. The
      // brand cyan (`cal-brand`) is fed through the one-time `cal("ui", …)` call
      // above — `cssVarsPerTheme` isn't part of the inline `config` prop's type.
      config={{
        layout: "month_view",
        theme: "dark",
      }}
    />
  );
}

/* ── cyan shield-check tick (reused from Hero's no-risk mark), color = --equip ── */
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

export interface BookCallProps {}

/**
 * #book — the inline booking section (Quest 06). Placed after FAQ and before the
 * Footer: objections handled → then the always-visible calendar.
 *
 * A conversion-wrapped section in the Command Deck idiom: a `.qhead` quest
 * marker, an H2, a lede, then a two-column `.panel` on desktop — left rail =
 * context (VSL slot + "what happens" list + reassurance + who-you-meet + trust
 * line), right = the inline `<Cal>` calendar. Collapses to one column under md.
 *
 * PROOF-ONLY: zero fabricated metrics, testimonials, logos, ratings, or
 * scarcity beyond the two real on-site facts ("capped at 5 brands," "no card").
 * The VSL is a literal placeholder until a real Loom exists.
 *
 * `data-quest`/`data-rare="equip"`/`data-xp` make GameChrome fire its scroll
 * toast, consistent with every other section. Entrance reveals respect
 * prefers-reduced-motion; the iframe itself is never animated.
 */
export default function BookCall({}: BookCallProps) {
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
    <section
      className="section"
      id="book"
      data-quest="Open the war room"
      data-rare="equip"
      data-xp="100"
      data-kicker="War room opened"
      style={{ scrollMarginTop: "84px" }}
    >
      <div className="wrap">
        <motion.div className="qhead" variants={reveal} custom={0} {...inView}>
          <span className="qmarker" aria-hidden="true">
            <svg width="30" height="30" viewBox="0 0 30 30" fill="none">
              <path
                d="M15 4 L24 15 L15 26 L6 15 Z"
                stroke="#5EC8E6"
                strokeWidth="1.6"
                strokeLinejoin="round"
              />
              <path d="M15 10 L20 15 L15 20 L10 15 Z" fill="#5EC8E6" />
            </svg>
          </span>
          <div className="qchip">
            <span className="q">Quest 06</span>
            <span className="s">Open the war room</span>
          </div>
        </motion.div>

        <motion.h2 variants={reveal} custom={1} {...inView}>
          Book your First Strike call.
        </motion.h2>

        <motion.p className="lede" variants={reveal} custom={2} {...inView}>
          Fifteen minutes. We point the weapon at your product, show you the angle we&rsquo;d swing
          first, and you decide if you want the free First Strike built. No deck, no pressure.
        </motion.p>

        {/* the booking panel — gold corner-bracket frame, two columns on md */}
        <motion.div
          className="panel mt-10 grid grid-cols-1 gap-0 p-0 md:grid-cols-[0.9fr_1.1fr]"
          variants={reveal}
          custom={3}
          {...inView}
        >
          <div className="win-title md:col-span-2">
            <span className="gem" aria-hidden="true" />
            War Room · Book the Call
            <span className="right">
              <span className="dot" aria-hidden="true" />
              15 min · no pitch
            </span>
          </div>

          {/* LEFT · context rail */}
          <div className="flex flex-col gap-6 border-b border-frame-soft p-[26px] md:border-b-0 md:border-r">
            {/* VSL / Loom placeholder — literal, no fake thumbnail, no autoplay */}
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
                <div className="font-mono text-[12px] uppercase tracking-[0.14em] text-gold">
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

            {/* reassurance line */}
            <p className="flex items-start gap-2 text-[13.5px] text-ink-mute">
              <span
                className="dot buff"
                style={{ marginTop: "5px" }}
                aria-hidden="true"
              />
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
              The free First Strike and the No-Risk Loadout carry the proof &mdash; not a logo wall.
              Capped at 5 brands.
            </p>
          </div>

          {/* RIGHT · the inline calendar */}
          <div className="min-h-[640px] p-[14px] md:p-5">
            <BookCal />
          </div>
        </motion.div>
      </div>
    </section>
  );
}
