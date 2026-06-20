import { Reveal } from "@/components/ui/Reveal";
import { CalButton } from "@/components/booking/CalButton";

/**
 * Final CTA — a dark, centered close. The tide-comes-in headline, a calm
 * reassurance subhead, the primary booking CTA, and three supporting points.
 */
const POINTS: readonly string[] = [
  "No new helpdesk to install",
  "Free founding-partner pilot",
  "Talk to the operator, not a queue",
];

export function FinalCTA() {
  return (
    <section className="section section-dark">
      <div className="wrap max-w-[820px] text-center">
        <Reveal index={0}>
          <svg width="44" height="44" viewBox="0 0 32 32" fill="none" aria-hidden className="mx-auto mb-5">
            <path d="M2 23 Q9 17 16 23 T30 23" stroke="#E9B486" strokeWidth="2.1" fill="none" strokeLinecap="round" />
            <path d="M5 17 Q11 12 16 17 T27 17" stroke="#E9B486" strokeWidth="2.1" fill="none" strokeLinecap="round" opacity="0.66" />
            <path d="M8 11 Q12.5 7 16 11 T24 11" stroke="#E9B486" strokeWidth="2.1" fill="none" strokeLinecap="round" opacity="0.4" />
          </svg>
        </Reveal>

        <Reveal index={1}>
          <h2 className="mb-4 text-balance">The tide always comes in. Their order is coming.</h2>
        </Reveal>

        <Reveal index={2}>
          <p className="mx-auto mb-8 max-w-[560px] text-[17px] leading-relaxed" style={{ color: "#BDD4D2" }}>
            Start with a free 15-minute presale-support teardown &mdash; a real operator looking at your real support, no
            pitch. We&rsquo;ll tell you honestly whether we can help.
          </p>
        </Reveal>

        <Reveal index={3}>
          <CalButton variant="ondark" large>
            Get a free 15-min teardown
          </CalButton>
        </Reveal>

        <Reveal index={4}>
          <div className="mt-8 flex flex-wrap justify-center gap-x-7 gap-y-2.5 text-[14px]" style={{ color: "#A9C5C2" }}>
            {POINTS.map((p) => (
              <span key={p} className="inline-flex items-center gap-2">
                <span style={{ color: "#E9B486" }}>&bull;</span>
                {p}
              </span>
            ))}
          </div>
        </Reveal>
      </div>
    </section>
  );
}
