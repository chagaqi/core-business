import { Reveal } from "@/components/ui/Reveal";
import { Button } from "@/components/ui/Button";
import { CalButton } from "@/components/booking/CalButton";
import { PaperStrata } from "@/components/marketing/paper/PaperStrata";
import { ImageSlot } from "@/components/marketing/paper/ImageSlot";

/**
 * Homepage hero — the above-the-fold BOLD PASS (HEADER-IA-SPEC §2).
 *
 * Layout decision: KEEP the two-panel split and jump the type scale, rather than
 * going full-center. The animated reply card on the right is our honest proof
 * device (real engine, sample data) — the show-don't-tell asset a centered
 * testimonial pattern can't give us. A centered hero would push the card below
 * the fold; the split lets a giant .display headline and the card share the fold
 * and each carry weight (spec §2.2, Fable-flagged: default is keep-the-card).
 *
 * Structure: honest 3-chip badge row → giant .display H1 with period-punch → one
 * tight subhead → one loud terracotta pill (+ quiet live-draft link) on the left;
 * the reassurance reply card on the right; a thin below-hero confidence strip of
 * true mechanism facts (our answer to their faked avatar/star strip) spanning
 * both. Backdrop: PaperStrata tide + a top wash + paper grain for a crafted fold.
 * Server component; entrance motion comes from the client <Reveal> primitive.
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
      {/* Signature paper device: layered strata backdrop (sand → sand-2 → light teal). */}
      <PaperStrata />
      {/* Bold-pass backdrop push: a soft top wash + fiber grain so the fold reads crafted, not flat. */}
      <div className="hero-wash" aria-hidden />
      <div className="paper-grain" aria-hidden />

      <div className="wrap relative z-10 py-16 lg:py-24">
        <div className="flex flex-wrap items-center gap-10 md:gap-16">
          {/* left */}
          <div className="min-w-[300px] flex-1 basis-[460px]">
            {/* Honest badge row (their star/avatar slot, our truth): real operator anchor,
                a verifiable live-demo link, and the proof-only pledge. No stars, no counts. */}
            <Reveal index={0}>
              <div className="mb-7 flex flex-wrap items-center gap-2.5">
                <span className="inline-flex items-center gap-2 rounded-full border border-[#D2E2E4] bg-accent-card px-3.5 py-2 text-[13px] font-semibold text-teal">
                  <WaveMark />
                  Built by a $2M-ops operator
                </span>
                <a
                  href="#demo"
                  className="inline-flex items-center gap-1.5 rounded-full border border-[#D2E2E4] bg-accent-card px-3.5 py-2 text-[13px] font-semibold text-teal transition-colors hover:border-teal/40 hover:bg-[#DCEAEC]"
                >
                  Live demo below &mdash; real engine, sample data
                  <CaretDown />
                </a>
                <span className="inline-flex items-center rounded-full border border-[#D2E2E4] bg-accent-card px-3.5 py-2 text-[13px] font-semibold text-teal">
                  No invented numbers. Ever.
                </span>
              </div>
            </Reveal>

            <Reveal index={1}>
              <h1 className="display mb-5 text-balance">Keep them waiting, not walking.</h1>
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

          {/* right: reassurance reply card — the proof device, kept as the hero's visual anchor */}
          <div className="relative min-w-[290px] flex-1 basis-[380px]">
            {/* ONE hero object slot: the paper boat riding the wave. Ships an image
                slot with a CSS/paper fallback; Dylan sources the papercraft art later. */}
            <div className="pointer-events-none absolute inset-x-0 -top-10 z-0 hidden opacity-95 lg:block" aria-hidden>
              <ImageSlot slotId="hero-boat" aspect="3/2" />
            </div>
            <Reveal index={2}>
              <div className="relative z-10 overflow-hidden rounded-3xl border border-border bg-paper shadow-lift">
                <div className="flex items-center justify-between gap-3 border-b border-accent-card bg-[#F3F8F8] px-5 py-4">
                  <div className="flex items-center gap-2.5">
                    <span className="flex h-9 w-9 items-center justify-center rounded-full bg-accent-card text-[14px] font-bold text-teal">
                      D
                    </span>
                    <div className="leading-tight">
                      <div className="text-[14px] font-semibold text-ink">Dana &mdash; order #4821</div>
                      <div className="text-[12px] text-ink-mute">Presale &middot; backer pledge</div>
                    </div>
                  </div>
                  <span className="rounded-full border border-[#D2E2E4] bg-accent-card px-3 py-1.5 text-[12px] font-semibold text-teal">
                    Day 58
                  </span>
                </div>

                <div className="flex flex-col gap-4 px-5 py-6">
                  <div className="max-w-[88%] self-start rounded-[16px_16px_16px_4px] bg-[#F1ECE0] px-4 py-3 text-[14.5px] leading-snug text-slate">
                    I ordered back in March and it&rsquo;s been almost two months. Starting to wonder if this is actually
                    coming, or if I should just ask for a refund.
                  </div>
                  <div className="max-w-[90%] self-end rounded-[16px_16px_4px_16px] bg-teal px-4 py-3.5 text-[14.5px] leading-relaxed text-ink-inverse">
                    Hey Dana &mdash; totally fair to wonder after this long, and I&rsquo;m really glad you reached out.
                    Your order&rsquo;s in the production batch that&rsquo;s{" "}
                    <strong className="text-white">currently tracking to ship in weeks 9&ndash;11</strong>. You&rsquo;re
                    on the list and nothing&rsquo;s stuck. I&rsquo;ll check back in the moment anything shifts.
                  </div>
                  <div className="flex items-center gap-2 self-end text-[11.5px] font-medium text-[#8A7A66]">
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" aria-hidden>
                      <path
                        d="M12 2 4 6v6c0 4.4 3.2 7.6 8 10 4.8-2.4 8-5.6 8-10V6l-8-4Z"
                        stroke="#D9762F"
                        strokeWidth="1.8"
                        fill="none"
                      />
                    </svg>
                    timeline-aware &middot; human-approved &middot; no hard date promised
                  </div>
                </div>
              </div>
            </Reveal>
          </div>
        </div>

        {/* Below-hero confidence strip — one calm, honest device spanning the fold. */}
        <Reveal index={5}>
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
