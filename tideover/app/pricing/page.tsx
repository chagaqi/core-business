import type { Metadata } from "next";
import { Nav } from "@/components/marketing/Nav";
import { Footer } from "@/components/marketing/Footer";
import { FinalCTA } from "@/components/marketing/FinalCTA";
import { Reveal } from "@/components/ui/Reveal";
import { PaperStrata } from "@/components/marketing/paper/PaperStrata";
import { PaperEdge } from "@/components/marketing/paper/PaperEdge";
import { ANNUAL_LABEL, GuaranteeBox, PLANS, usd } from "@/components/marketing/PricingParts";
import { PricingTiers } from "@/components/marketing/PricingTiers";

/**
 * /pricing — the standalone pricing page, restructured Swan-style (2026-07-09):
 * tier cards with seats + order caps, checkmark feature lists laddered with
 * "Everything in X, plus:", a monthly/annual toggle (annual = 2 months free),
 * free-trial CTAs, a Beyond Scale custom card, a seats explainer, and a
 * pricing-only FAQ. The old free-cycle offer is off all public pricing
 * surfaces, so the shared FinalCTA gets a trial-framed points set below.
 *
 * NUMBERS LOCKED: the tier cards render from the shared PLANS array in
 * PricingParts.tsx — the exact figures the Home pricing section summarizes
 * (one source of truth, nothing can drift). Proof-only: the Growth badge is
 * "Recommended", never a popularity claim; every listed feature is a shipped
 * module (grounding table in PricingParts.tsx). Public page, no auth.
 *
 * Paper treatment: light PaperStrata hero into the light tier grid, a wave
 * edge into the dark guarantee block, a torn-sand edge back up into the light
 * pricing FAQ, then the shared FinalCTA.
 */
export const metadata: Metadata = {
  title: "Pricing — Tideover",
  description: `Plans from ${usd(PLANS[0].monthly)}/mo, sized by seats and the presale orders in your wait window. 14-day free trial, no card required. Annual is ${ANNUAL_LABEL}.`,
};

// FinalCTA points for this page: trial-framed, never contradicting the tiers.
const PRICING_CTA_POINTS: readonly string[] = [
  "No new helpdesk to install",
  "14-day free trial, no card required",
  "Talk to the operator, not a queue",
];

// Pricing-only questions: trial mechanics, caps, plan changes, annual.
const PRICING_FAQ: readonly { q: string; a: string }[] = [
  {
    q: "What happens when the trial ends?",
    a: "We contact you. There's no card on file, so nothing auto-bills: you pick a plan when the trial has shown you enough, or you walk away and owe nothing.",
  },
  {
    q: "What counts toward the order cap?",
    a: "Presale orders currently in the wait window. Once an order ships and its wait ends, it stops counting, so your delivered history never eats the cap.",
  },
  {
    q: "Can I change plans later?",
    a: "Yes, any time — from the billing page in your dashboard. Upgrades and downgrades run through Stripe, which handles the prorated difference for you.",
  },
  {
    q: "Do you offer annual billing?",
    a: `Yes, and it's ${ANNUAL_LABEL}: ${PLANS.map((p) => `${usd(p.annual)} for ${p.name}`).join(", ")} per year. The toggle above shows both views.`,
  },
  {
    q: "What happens if I go over my cap?",
    a: "We reach out about the next tier. Nothing hard-stops mid-wait: your queue keeps working and your customers keep getting answers while we sort it out.",
  },
];

export default function PricingPage() {
  return (
    <>
      <Nav />
      <main>
        {/* Page hero — light, sets the trial terms before any number. */}
        <section className="section relative overflow-hidden !pb-10">
          <PaperStrata />
          <div className="wrap relative z-10 max-w-[820px]">
            <span className="kicker mb-3.5">Pricing</span>
            <h1 className="mb-5 text-balance">Sized by the orders in your wait window.</h1>
            <p className="m-0 max-w-[680px] text-[17px] leading-relaxed text-slate">
              Every plan starts with a 14-day free trial, no card required. Nothing auto-bills when it ends &mdash;
              we talk first.
            </p>
          </div>
        </section>

        {/* Tier cards + billing toggle — the shared source of truth. */}
        <section className="pb-16">
          <div className="wrap">
            <Reveal index={0}>
              <PricingTiers />
            </Reveal>

            {/* Seats explainer — promoted out of the FAQ, next to the cards. */}
            <Reveal index={1}>
              <div className="panel mx-auto mt-9 max-w-[720px] p-7">
                <h2 className="mb-3 font-serif text-[20px] font-semibold text-teal">What counts as a seat?</h2>
                <p className="m-0 text-[15px] leading-relaxed text-slate">
                  A seat is a teammate who works the queue: drafting, approving replies, sending goodwill gifts. Add
                  their email on the Team page; when they sign up with it, they land in your workspace. Customer
                  status pages and everything your buyers see stay unlimited and free on every plan. You are never
                  charged for the people checking on their orders.
                </p>
              </div>
            </Reveal>
          </div>
        </section>

        <PaperEdge variant="wave" color="teal" />

        {/* Dark block — the guarantee, kept adjacent to the tiers. */}
        <section className="section section-dark scroll-mt-20">
          <div className="wrap max-w-[860px]">
            <Reveal index={0}>
              <GuaranteeBox />
            </Reveal>
          </div>
        </section>

        {/* Pricing-only FAQ — trial, caps, plan changes, annual. */}
        <section className="section scroll-mt-20 relative">
          <PaperEdge
            variant="torn"
            color="sand"
            height={38}
            className="pointer-events-none absolute inset-x-0 top-0 -translate-y-full"
          />
          <div className="wrap max-w-[860px]">
            <Reveal index={0}>
              <div className="mb-9">
                <span className="kicker mb-3.5">Billing questions</span>
                <h2 className="m-0">Just the money questions.</h2>
              </div>
            </Reveal>

            <Reveal index={1}>
              <div>
                {PRICING_FAQ.map((item) => (
                  <details key={item.q} className="group border-t border-border last:border-b">
                    <summary className="flex cursor-pointer list-none items-center justify-between gap-4 py-[22px] font-serif text-[18.5px] font-semibold text-teal [&::-webkit-details-marker]:hidden">
                      {item.q}
                      <span
                        className="flex-none text-[24px] font-light leading-none text-terracotta transition-transform duration-300 ease-[cubic-bezier(0.34,1.5,0.6,1)] group-open:rotate-45"
                        aria-hidden
                      >
                        +
                      </span>
                    </summary>
                    <div className="faq-answer max-w-[720px] px-1 pb-6 text-[15.5px] leading-[1.7] text-slate">{item.a}</div>
                  </details>
                ))}
              </div>
            </Reveal>
          </div>
        </section>

        <PaperEdge variant="wave" color="teal" />
        <FinalCTA points={PRICING_CTA_POINTS} />
      </main>
      <Footer />
    </>
  );
}
