"use client";

import Link from "next/link";
import { Logo } from "@/components/ui/Logo";
import { Reveal } from "@/components/ui/Reveal";
import { BookCal } from "@/components/booking/BookCal";

/**
 * /book — the dedicated teardown-booking page. Minimal header (Logo + back link),
 * a focused hero, and a two-column panel: a context rail (what happens on the
 * call, reassurance, who you meet, proof-only trust line) and the inline Cal
 * calendar. Mirrors the Adwield BookPage structure in Tideover's warm voice and
 * tokens. PROOF-ONLY: no fabricated metrics, testimonials, logos, or ratings.
 */
function CheckTick() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden className="mt-0.5 flex-none">
      <path
        d="M12 2 4 6v6c0 4.4 3.2 7.6 8 10 4.8-2.4 8-5.6 8-10V6l-8-4Z"
        stroke="#0E5366"
        strokeWidth="1.6"
        fill="rgba(14,83,102,0.06)"
        strokeLinejoin="round"
      />
      <path d="M9 12l2 2 4-4.5" stroke="#0E5366" strokeWidth="1.6" fill="none" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

const CALL_POINTS: readonly string[] = [
  "We look at how your presale tickets are handled today — live, on the call.",
  "We point to the two or three moments in the wait where buyers are most likely to bail.",
  "We tell you honestly whether a free founding-partner pilot is worth your time.",
  "If it's a fit, we map the pilot. If it's not, you keep the teardown either way.",
];

export default function BookPage() {
  return (
    <>
      {/* minimal header */}
      <header
        className="sticky top-0 z-50 border-b border-border"
        style={{ background: "rgba(251,248,242,0.82)", backdropFilter: "saturate(140%) blur(12px)", WebkitBackdropFilter: "saturate(140%) blur(12px)" }}
      >
        <div className="wrap flex items-center justify-between py-3.5">
          <Logo />
          <Link
            href="/"
            className="text-[13px] font-medium text-ink-mute no-underline transition-colors hover:text-teal"
          >
            &larr; Back
          </Link>
        </div>
      </header>

      <main id="top">
        {/* hero */}
        <section className="pb-2 pt-14">
          <div className="wrap max-w-[820px] text-center">
            <Reveal index={0}>
              <span className="kicker mb-4 justify-center">
                <span className="h-1.5 w-1.5 rounded-full bg-terracotta" aria-hidden />
                15 min &middot; no pitch &middot; no card
              </span>
            </Reveal>
            <Reveal index={1}>
              <h1 className="mb-4 text-balance">Get a free 15-min presale-support teardown.</h1>
            </Reveal>
            <Reveal index={2}>
              <p className="mx-auto max-w-[560px] text-[clamp(16px,1.5vw,18px)] leading-relaxed text-slate">
                A real operator looks at your real presale support, shows you where buyers are most likely to bail, and
                tells you honestly whether a pilot is worth your time. No deck, no obligation.
              </p>
            </Reveal>
          </div>
        </section>

        {/* booking panel */}
        <section className="pb-16 pt-6">
          <div className="wrap">
            <Reveal index={3}>
              <div className="panel grid grid-cols-1 gap-0 overflow-hidden p-0 md:grid-cols-[0.9fr_1.1fr]">
                {/* LEFT · context rail */}
                <div className="flex flex-col gap-6 border-b border-border p-7 md:border-b-0 md:border-r">
                  <div>
                    <div className="mb-3 text-[11px] font-semibold uppercase tracking-[0.14em] text-teal">
                      What happens on this call
                    </div>
                    <ul className="m-0 flex list-none flex-col gap-3 p-0">
                      {CALL_POINTS.map((point) => (
                        <li key={point} className="flex items-start gap-2.5">
                          <CheckTick />
                          <span className="text-[14.5px] leading-snug text-slate">{point}</span>
                        </li>
                      ))}
                    </ul>
                  </div>

                  <p className="flex items-start gap-2 text-[13.5px] text-ink-mute">
                    <span className="mt-1.5 h-1.5 w-1.5 flex-none rounded-full bg-[#2E7D6E]" aria-hidden />
                    No pitch deck, no obligation, no card. Worst case, you leave with a free teardown of your presale
                    support.
                  </p>

                  <div>
                    <p className="text-[14px] leading-snug text-ink">
                      You&rsquo;re meeting the operator who answered the day-60 &ldquo;I want a refund&rdquo; email
                      himself &mdash; not a closer, not a queue.
                    </p>
                    <span className="mt-2 inline-flex items-center gap-2 text-[11px] uppercase tracking-[0.12em] text-ink-mute">
                      <span className="h-1.5 w-1.5 rounded-full bg-teal" aria-hidden />
                      Founder &middot; runs your pilot by hand
                    </span>
                  </div>

                  <p className="mt-auto pt-2 text-[11px] leading-relaxed tracking-[0.04em] text-ink-mute">
                    The free pilot and the honest leading indicators carry the proof &mdash; not a logo wall, not an
                    invented number. We&rsquo;ll never show you a result we can&rsquo;t stand behind.
                  </p>
                </div>

                {/* RIGHT · inline calendar */}
                <div className="min-h-[640px] p-3.5 md:p-5">
                  <BookCal />
                </div>
              </div>
            </Reveal>
          </div>
        </section>
      </main>
    </>
  );
}
