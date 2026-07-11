import { Button } from "@/components/ui/Button";
import { CalButton } from "@/components/booking/CalButton";
import { OrigamiScene } from "@/components/marketing/paper/OrigamiScene";

/**
 * Homepage hero — a full-bleed origami ocean.
 *
 * The entire fold is the landscape: sand-paper sky above, a code-drawn papercraft
 * sea (<OrigamiScene/>) bleeding edge to edge across the lower half, with a small
 * boat riding the waves off-centre. The value prop sits LARGE and centred in the
 * sky; a single terracotta CTA plus a ghost secondary; one muted credibility
 * line; a folded-paper scroll cue at the bottom edge. Nothing sits over the
 * water — text is on the sky only, at AA contrast (ink on sand).
 *
 * Motion is 100% CSS (no JS): the ocean assembles, the boat settles, then the
 * copy rises (see .oc-* in globals.css). The scene is the page's single ambient
 * element. Under prefers-reduced-motion the global kill zeroes it and the whole
 * landscape + all copy render complete and static. The SVG is inline (no fetch)
 * so the headline text is the LCP, and the section reserves 100svh → zero CLS.
 *
 * The reassurance reply-card is gone from the fold (Dylan, 2026-07-10); the live
 * proof lives in the DemoCenterpiece section below (#demo — the ghost CTA target).
 * The confidence strip has moved below the fold. Copy is proof-only, existing
 * approved strings, lightly re-flowed to fit — no new claims.
 */
function StripTick() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" aria-hidden className="mt-px flex-none">
      <path d="M20 6 9 17l-5-5" stroke="#0E5366" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

// Honest mechanism facts, never social proof — now the first beat below the fold.
const STRIP = ["Works inside your current helpdesk", "Nothing to rip out", "Every reply waits for your approval"];

export function Hero() {
  return (
    <>
      <header
        className="relative min-h-[100svh] overflow-hidden max-[640px]:min-h-[88svh]"
        style={{ background: "linear-gradient(180deg, #FBF8F2 0%, #F6F2EA 34%, #EAF1F0 64%, #DCE9E9 100%)" }}
      >
        <div className="paper-grain" aria-hidden />
        <OrigamiScene />

        {/* Copy — centred in the sky region, never over the water. */}
        <div className="relative z-10 mx-auto flex max-w-[1100px] flex-col items-center px-6 pt-[clamp(66px,10vh,140px)] text-center max-[640px]:pt-[58px]">
          <h1 className="display oc-rise m-0 max-w-[14ch]" style={{ animationDelay: "0.85s" }}>
            Navigate choppy waters. Tide your customers over.
          </h1>
          <p
            className="oc-rise mt-5 max-w-[52ch] text-[clamp(15px,1.5vw,19px)] leading-relaxed text-slate"
            style={{ animationDelay: "1s" }}
          >
            Reads each order&rsquo;s real timeline and drafts the calm reply in your voice, ready for your approval.
          </p>
          <div
            className="oc-rise mt-8 flex flex-wrap items-center justify-center gap-x-5 gap-y-4"
            style={{ animationDelay: "1.12s" }}
          >
            <CalButton large className="btn-pill">
              Get a free 15-min teardown{" "}
              <span className="cta-arrow" aria-hidden>
                &rarr;
              </span>
            </CalButton>
            <Button href="#demo" variant="ghost" large className="btn-pill">
              See a live draft &darr;
            </Button>
          </div>
          <p className="oc-rise mt-[18px] text-[13px] text-[#54666A]" style={{ animationDelay: "1.22s" }}>
            Built by a $2M-ops operator. No invented numbers, ever.
          </p>
        </div>

        {/* Folded-paper scroll cue, bobbing at the bottom edge of the scene. */}
        <div className="oc-cue" aria-hidden>
          <svg width="30" height="30" viewBox="0 0 24 24" fill="none">
            <path d="M5 9l7 7 7-7" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" />
            <path d="M5 4l7 7 7-7" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" opacity="0.4" />
          </svg>
        </div>
      </header>

      {/* Confidence strip — one calm, honest device, now the first beat below the fold. */}
      <div className="wrap border-t border-border py-7">
        <ul className="m-0 flex flex-wrap items-center gap-x-7 gap-y-3 p-0 text-[14px] font-medium text-slate">
          {STRIP.map((item) => (
            <li key={item} className="inline-flex items-center gap-2">
              <StripTick />
              {item}
            </li>
          ))}
        </ul>
      </div>
    </>
  );
}
