import { Reveal } from "@/components/ui/Reveal";
import { Button } from "@/components/ui/Button";
import { GET_STARTED_HREF } from "@/components/marketing/nav/nav-data";
import { PricingSummary, GuaranteeBox } from "@/components/marketing/PricingParts";

/**
 * Home pricing section — a dark section, still anchored at #pricing for the
 * nav. Compact 3-tier summary (name + monthly price + one-liner) rendered from
 * the SAME shared PLANS source of truth as /pricing, so the figures cannot
 * drift, plus the guarantee and the trial CTA.
 *
 * The pilot offer is off all public pricing surfaces (2026-07-09) — it lives
 * on as an off-page lead magnet, so the old pilot card and its framing are gone.
 * The guarantee box survives with only its pilot reference retired.
 */
export function Pilot() {
  return (
    <section id="pricing" className="section section-dark scroll-mt-20">
      <div className="wrap">
        <Reveal index={0}>
          <div className="mb-11 max-w-[720px]">
            <span className="kicker mb-3.5" style={{ color: "#E9B486" }}>
              Pricing
            </span>
            <h2 className="mb-4 text-balance">Priced by the presale orders you&rsquo;re carrying.</h2>
            <p className="m-0 text-[17px] leading-relaxed" style={{ color: "#BDD4D2" }}>
              Three plans, sized by seats and the orders in your wait window. Every one starts with a 14-day free
              trial &mdash; no card required, nothing auto-bills when it ends.
            </p>
          </div>
        </Reveal>

        {/* Compact tier summary — shared figures with /pricing. */}
        <Reveal index={1}>
          <PricingSummary />
        </Reveal>

        <div className="grid grid-cols-1 items-start gap-[22px] md:grid-cols-2">
          {/* guarantee — kept adjacent to the tiers; shared with /pricing */}
          <Reveal index={2}>
            <GuaranteeBox />
          </Reveal>

          {/* CTA card — trial first, full table one click away */}
          <Reveal index={3}>
            <div
              className="flex h-full flex-col justify-center rounded-[22px] p-[30px]"
              style={{ background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.14)" }}
            >
              <h3 className="mb-3 font-serif text-[22px] font-semibold" style={{ color: "#F4F9F8" }}>
                Try it on your own queue
              </h3>
              <p className="mb-6 mt-0 text-[15px] leading-relaxed" style={{ color: "#C7DAD8" }}>
                Import your backers, see the risk scores and drafted replies on your real tickets, and decide with
                the evidence in front of you.
              </p>
              <div className="flex flex-wrap items-center gap-4">
                {/* GET_STARTED_HREF (ADR-0020): the real onboarding lives on the
                    real-app host — a relative /onboarding on www is the demo
                    sandbox, not signup. */}
                <Button href={GET_STARTED_HREF} variant="ondark">
                  Start your 14-day free trial &rarr;
                </Button>
                <a className="text-[14.5px] font-semibold underline underline-offset-4" style={{ color: "#F4F9F8" }} href="/pricing">
                  Compare plans
                </a>
              </div>
            </div>
          </Reveal>
        </div>
      </div>
    </section>
  );
}
