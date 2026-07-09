import { Reveal } from "@/components/ui/Reveal";
import { Button } from "@/components/ui/Button";
import { PricingLadder, GuaranteeBox } from "@/components/marketing/PricingParts";

/**
 * The founding-partner pilot — a dark section. Headline + "what's included"
 * checklist on one side, the value ladder + guarantee on the other.
 * Pricing and the deferred performance fee come straight from the locked offer.
 * CTA uses the ondark button variant.
 *
 * The value ladder (held figures) and the guarantee box are extracted into
 * <PricingLadder/> / <GuaranteeBox/> (PricingParts.tsx) so this Home section and
 * the standalone /pricing page share one source of truth for the numbers.
 */
const INCLUDED: readonly string[] = [
  "Works inside your helpdesk — nothing to migrate.",
  "Timeline-aware, human-approved replies in two fixed daily windows.",
  "A day-by-day reassurance playbook, built from your real tickets.",
  "Leading-indicator measurement vs. your own clean baseline.",
  "Logged “saves” — anxious buyers who stayed aboard.",
  "Founder-led, by hand, for one full presale cycle.",
];

export function Pilot() {
  return (
    <section id="pricing" className="section section-dark scroll-mt-20">
      <div className="wrap">
        <Reveal index={0}>
          <div className="mb-11 max-w-[720px]">
            <span className="kicker mb-3.5" style={{ color: "#E9B486" }}>
              The founding-partner pilot
            </span>
            <h2 className="mb-4 text-balance">We&rsquo;ll run your presale support by hand for one cycle. Free.</h2>
            <p className="m-0 text-[17px] leading-relaxed" style={{ color: "#BDD4D2" }}>
              Concierge first. The founder and our drafting system run your presale support manually, inside your own
              helpdesk &mdash; capturing the day-by-day reassurance language that works, measured against a clean
              baseline.
            </p>
          </div>
        </Reveal>

        {/* Value ladder — mechanics only: the old inline pill strip, now a 3-card
            tier row rising like a tide. Numbers HELD; shared with /pricing. */}
        <Reveal index={1}>
          <PricingLadder />
        </Reveal>

        <div className="grid grid-cols-1 items-start gap-[22px] md:grid-cols-2">
          {/* included card */}
          <Reveal index={2}>
            <div
              className="rounded-[22px] p-[30px]"
              style={{ background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.14)" }}
            >
              <span
                className="mb-5 inline-flex items-center rounded-full px-3.5 py-1.5 text-[13px] font-bold"
                style={{ background: "#E9B486", color: "#5A2D14" }}
              >
                Free &middot; one full cycle
              </span>
              <h3 className="mb-5 font-serif text-[22px] font-semibold" style={{ color: "#F4F9F8" }}>
                What&rsquo;s included
              </h3>
              <ul className="m-0 flex list-none flex-col gap-3.5 p-0">
                {INCLUDED.map((item) => (
                  <li key={item} className="flex items-start gap-3 text-[15px] leading-snug" style={{ color: "#D7E6E4" }}>
                    <span className="mt-px flex-none font-bold" style={{ color: "#E9B486" }} aria-hidden>
                      &#10003;
                    </span>
                    {item}
                  </li>
                ))}
              </ul>
              <div className="mt-7">
                <Button href="/book" variant="ondark">
                  Apply for a founding-partner pilot &rarr;
                </Button>
              </div>
            </div>
          </Reveal>

          {/* guarantee — kept adjacent to the ladder; shared with /pricing */}
          <Reveal index={3}>
            <GuaranteeBox />
          </Reveal>
        </div>
      </div>
    </section>
  );
}
