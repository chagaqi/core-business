import { Reveal } from "@/components/ui/Reveal";
import { Button } from "@/components/ui/Button";
import { CalButton } from "@/components/booking/CalButton";

/**
 * Homepage hero. Headline + bolt-on/timeline-aware subhead, two CTAs, and a
 * trust line on the left; an animated presale message card on the right (a
 * day-58 dispute-risk complaint answered with calm, timeline-aware, human-
 * approved reassurance — a confidence band, never a hard date). Server
 * component; entrance motion comes from the client <Reveal> primitive.
 */
function ShieldCheck() {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" aria-hidden className="mt-px flex-none">
      <path
        d="M12 2 4 6v6c0 4.4 3.2 7.6 8 10 4.8-2.4 8-5.6 8-10V6l-8-4Z"
        stroke="#D9762F"
        strokeWidth="1.7"
        fill="rgba(217,118,47,0.08)"
        strokeLinejoin="round"
      />
      <path d="M9 12l2 2 4-4.5" stroke="#D9762F" strokeWidth="1.7" fill="none" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

const CHIPS = ["For 60–120 day presale waits", "Built for Kickstarter & BackerKit graduates"];

export function Hero() {
  return (
    <header
      className="relative overflow-hidden"
      style={{
        background:
          "radial-gradient(120% 80% at 82% -10%, rgba(217,118,47,0.16), transparent 58%), radial-gradient(120% 95% at 8% 8%, rgba(14,83,102,0.15), transparent 56%), linear-gradient(180deg,#FBF8F2 0%,#F4EEDA 100%)",
      }}
    >
      <div className="wrap flex flex-wrap items-center gap-10 py-16 md:gap-16 lg:py-24">
        {/* left */}
        <div className="min-w-[300px] flex-1 basis-[420px]">
          <Reveal index={0}>
            <div className="mb-6 flex flex-wrap gap-2.5">
              {CHIPS.map((c) => (
                <span
                  key={c}
                  className="inline-flex items-center rounded-full border border-[#D2E2E4] bg-accent-card px-3.5 py-2 text-[13px] font-semibold text-teal"
                >
                  {c}
                </span>
              ))}
            </div>
          </Reveal>

          <Reveal index={1}>
            <h1 className="mb-5 text-balance">Calm the wait. Keep the sale.</h1>
          </Reveal>

          <Reveal index={2}>
            <p className="mb-7 max-w-[560px] text-[clamp(17px,1.5vw,19px)] leading-relaxed text-slate">
              Tideover bolts onto the Gorgias, Tidio, or Intercom you already run, knows each order&rsquo;s real
              production timeline, and answers the long wait with calm, human, timeline-aware reassurance &mdash; so
              &ldquo;where&rsquo;s my order?&rdquo; doesn&rsquo;t become a refund. A bolt-on presale layer, not a
              rip-and-replace.
            </p>
          </Reveal>

          <Reveal index={3}>
            <div className="mb-7 flex flex-wrap items-center gap-4">
              <CalButton large>Get a free 15-min teardown</CalButton>
              <Button href="#how" variant="quiet">
                See how it works &rarr;
              </Button>
            </div>
          </Reveal>

          <Reveal index={4}>
            <div className="flex max-w-[540px] items-start gap-3 rounded-2xl border border-border bg-paper p-4 shadow-card">
              <ShieldCheck />
              <p className="m-0 text-[14.5px] leading-snug text-slate">
                <strong className="text-ink">No new helpdesk to install.</strong> Nothing to rip out. We work inside the
                tools you already have.
              </p>
            </div>
          </Reveal>
        </div>

        {/* right: reassurance reply card */}
        <div className="min-w-[290px] flex-1 basis-[380px]">
          <Reveal index={2}>
            <div className="overflow-hidden rounded-3xl border border-border bg-paper shadow-lift">
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
    </header>
  );
}
