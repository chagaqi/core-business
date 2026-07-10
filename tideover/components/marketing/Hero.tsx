import { Reveal } from "@/components/ui/Reveal";
import { Button } from "@/components/ui/Button";
import { CalButton } from "@/components/booking/CalButton";
import { FoldCard } from "@/components/marketing/paper/FoldCard";
import { OrigamiScene } from "@/components/marketing/paper/OrigamiScene";

/**
 * Homepage hero — the origami signature moment.
 *
 * A split fold: the value prop on the left (giant .display headline, honest
 * badge chips, one terracotta CTA), a code-drawn papercraft boat riding folded
 * paper waves on the right (<OrigamiScene/>, inline SVG, CSS-animated). The
 * scene IS the page's single ambient element — the deliberate exception to the
 * one-ambient-element rule; everything else stays at rest.
 *
 * The old reassurance reply-card is removed from the fold (Dylan, 2026-07-10) —
 * the live proof now lives in the DemoCenterpiece section below (#demo, the
 * "See a live draft" target). Copy is proof-only, unchanged in claim.
 *
 * Layout: on mobile the scene sits above the copy in a bounded 4:3 panel; on
 * desktop it takes the right column. The headline text is the LCP (the SVG is
 * inline, no fetch), contrast is AA (ink on sand, never text over the scene),
 * and the panel reserves its aspect box so there is zero CLS.
 */
function WaveMark() {
  return (
    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" aria-hidden className="flex-none">
      <path d="M2 9c2.5-2.6 5-2.6 7.5 0S14.5 11.6 17 9s4.5-2.6 5 0" stroke="#0E5366" strokeWidth="1.7" strokeLinecap="round" fill="none" />
      <path d="M2 15c2.5-2.6 5-2.6 7.5 0S14.5 17.6 17 15s4.5-2.6 5 0" stroke="#0E5366" strokeWidth="1.7" strokeLinecap="round" fill="none" opacity="0.5" />
    </svg>
  );
}

function CaretDown() {
  return (
    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" aria-hidden className="flex-none">
      <path d="M6 9l6 6 6-6" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function StripTick() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" aria-hidden className="mt-px flex-none">
      <path d="M20 6 9 17l-5-5" stroke="#0E5366" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

// Below-hero confidence strip — honest mechanism facts, never social proof. Our
// substitute for their avatar/rating strip (spec §2.3 doctrine).
const STRIP = ["Works inside your current helpdesk", "Nothing to rip out", "Every reply waits for your approval"];

export function Hero() {
  return (
    <header className="relative overflow-hidden bg-sand">
      {/* Soft top wash + fiber grain so the fold reads crafted, not flat. */}
      <div className="hero-wash" aria-hidden />
      <div className="paper-grain" aria-hidden />

      <div className="wrap relative z-10 py-14 lg:py-24">
        <div className="grid items-center gap-10 lg:grid-cols-[1.1fr_0.9fr] lg:gap-16">
          {/* right on desktop, top on mobile: the origami scene */}
          <div className="order-1 lg:order-2">
            <div
              className="relative aspect-[4/3] w-full overflow-hidden rounded-[28px] border border-border"
              style={{
                background: "linear-gradient(180deg, #FBF8F2 0%, #EDF3F3 56%, #E4EEF0 100%)",
                boxShadow: "var(--elev-2)",
              }}
            >
              <OrigamiScene />
            </div>
          </div>

          {/* left on desktop, below the scene on mobile: the copy */}
          <div className="order-2 lg:order-1">
            {/* Honest badge chips — each folds in from its top edge, staggered. */}
            <div className="mb-7 flex flex-wrap items-center gap-2.5">
              <FoldCard
                index={0}
                hover={false}
                shadow={false}
                className="inline-flex items-center gap-2 rounded-full border border-[#D2E2E4] bg-accent-card px-3.5 py-2 text-[13px] font-semibold text-teal"
              >
                <WaveMark />
                Built by a $2M-ops operator
              </FoldCard>
              <FoldCard
                index={1}
                hover={false}
                shadow={false}
                href="#demo"
                className="inline-flex items-center gap-1.5 rounded-full border border-[#D2E2E4] bg-accent-card px-3.5 py-2 text-[13px] font-semibold text-teal transition-colors hover:border-teal/40 hover:bg-[#DCEAEC]"
              >
                Live demo below &mdash; real engine, sample data
                <CaretDown />
              </FoldCard>
              <FoldCard
                index={2}
                hover={false}
                shadow={false}
                className="inline-flex items-center rounded-full border border-[#D2E2E4] bg-accent-card px-3.5 py-2 text-[13px] font-semibold text-teal"
              >
                No invented numbers. Ever.
              </FoldCard>
            </div>

            <Reveal index={1}>
              <h1 className="display mb-5 text-balance">Navigate choppy waters. Tide your customers over.</h1>
            </Reveal>

            <Reveal index={2}>
              <p className="mb-8 max-w-[560px] text-[clamp(17px,1.6vw,20px)] leading-relaxed text-slate">
                It reads each order&rsquo;s real production timeline and drafts the calm, no-false-promises reply
                &mdash; in your voice, for your approval.
              </p>
            </Reveal>

            <Reveal index={3}>
              <div className="flex flex-wrap items-center gap-x-5 gap-y-4">
                <CalButton large className="btn-pill">
                  Get a free 15-min teardown{" "}
                  <span className="cta-arrow" aria-hidden>
                    &rarr;
                  </span>
                </CalButton>
                <Button href="#demo" variant="quiet">
                  See a live draft &darr;
                </Button>
              </div>
            </Reveal>
          </div>
        </div>

        {/* Below-hero confidence strip — one calm, honest device spanning the fold. */}
        <Reveal index={4}>
          <div className="mt-12 border-t border-border pt-6 lg:mt-16">
            <ul className="m-0 flex flex-wrap items-center gap-x-7 gap-y-3 p-0 text-[14px] font-medium text-slate">
              {STRIP.map((item) => (
                <li key={item} className="inline-flex items-center gap-2">
                  <StripTick />
                  {item}
                </li>
              ))}
            </ul>
          </div>
        </Reveal>
      </div>
    </header>
  );
}
