import type { Metadata } from "next";
import { Nav } from "@/components/marketing/Nav";
import { Footer } from "@/components/marketing/Footer";
import { FinalCTA } from "@/components/marketing/FinalCTA";
import { Reveal } from "@/components/ui/Reveal";
import { PaperStrata } from "@/components/marketing/paper/PaperStrata";
import { PaperEdge } from "@/components/marketing/paper/PaperEdge";
import { PricingLadder, GuaranteeBox } from "@/components/marketing/PricingParts";

/**
 * /pricing — the standalone pricing page (Dylan, 2026-07-09: "our own pricing
 * page"). Mechanics from the SWAN pricing playbook (§5): a real tier row, a
 * "how the deferred fee works" explainer promoted out of the FAQ, the guarantee
 * kept adjacent, and a billing-only FAQ under the table.
 *
 * NUMBERS HELD: the tier row and guarantee are the shared <PricingLadder/> /
 * <GuaranteeBox/> primitives — the exact same held figures the Home <Pilot/>
 * section renders (one source of truth). Every other figure/answer here is
 * lifted verbatim from Pilot.tsx / the Home FAQ; nothing new is invented (no
 * per-tier order caps, no "most popular" — the tier-2 line stays the
 * trigger-conditioned recommendation). Public page, no auth.
 *
 * Paper treatment mirrors /how-it-works: a light PaperStrata hero, a wave edge
 * into the dark pricing block (where the ladder colours belong), a torn-sand
 * edge back up into the light billing FAQ, then the shared FinalCTA → /book.
 */
export const metadata: Metadata = {
  title: "Pricing — Tideover",
  description:
    "Start free with a founding-partner pilot. You only move to paid once it proves out on your own tickets, and any performance fee is deferred until a real case study exists.",
};

// Billing-only questions, lifted verbatim from the Home FAQ (kept there too):
// the four that are purely about money and setup mechanics.
const BILLING_FAQ: readonly { q: string; a: string }[] = [
  {
    q: "What does it cost after the pilot?",
    a: "The pilot is free: no software fee, no setup fee, no card. On proof, the founding-partner intro is roughly $199–$499/mo, scaling to $799–$999+/mo as volume grows. Any performance fee waits until there's a real case study to stand on.",
  },
  {
    q: "Why is it free? What's the catch?",
    a: "We need to author the playbooks alongside real merchants, and the only way to do that is on real orders. You get the work free, we earn the case study. The only ask is read access to do the work, and, if you're happy, a testimonial about the experience.",
  },
  {
    q: "What happens after the wait ends?",
    a: "You pause. Tideover runs during the wait, so between cycles there's nothing to pay for and nothing to manage. When the next campaign or drop opens, you switch it back on for that cohort. Month to month, no annual lock-in.",
  },
  {
    q: "Do I switch helpdesks or install anything?",
    a: "No. Tideover bolts onto the Gorgias, Tidio, or Intercom you already run. Nothing to rip out, no second inbox, no infra change. We work inside your existing setup and handle the presale tickets specifically.",
  },
];

export default function PricingPage() {
  return (
    <>
      <Nav />
      <main>
        {/* Page hero — light, no numbers. */}
        <section className="section relative overflow-hidden">
          <PaperStrata />
          <div className="wrap relative z-10 max-w-[820px]">
            <span className="kicker mb-3.5">Pricing</span>
            <h1 className="mb-5 text-balance">Priced on proof, not on promises.</h1>
            <p className="m-0 max-w-[680px] text-[17px] leading-relaxed text-slate">
              Start free with a founding-partner pilot. You only move to paid once it proves out on your own tickets,
              and any performance fee waits for a real case study.
            </p>
          </div>
        </section>

        <PaperEdge variant="wave" color="teal" />

        {/* Dark pricing block — the tier row, the deferred-fee explainer, the guarantee. */}
        <section className="section section-dark scroll-mt-20">
          <div className="wrap">
            <Reveal index={0}>
              <PricingLadder />
            </Reveal>

            <div className="mt-[22px] grid grid-cols-1 items-start gap-[22px] md:grid-cols-2">
              {/* How the deferred fee works — the #1 pricing objection, promoted
                  out of the FAQ. Copy lifted from Pilot.tsx / the Home FAQ. */}
              <Reveal index={1}>
                <div
                  className="rounded-[22px] p-7"
                  style={{ background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.14)" }}
                >
                  <h3 className="mb-3.5 font-serif text-[20px] font-semibold" style={{ color: "#F4F9F8" }}>
                    How the deferred fee works
                  </h3>
                  <p className="m-0 text-[15px] leading-relaxed" style={{ color: "#C7DAD8" }}>
                    The pilot is free: no software fee, no setup fee, no card. You only move to proof-pricing once the
                    pilot proves out on your own tickets. Any performance fee is deferred until a real case study
                    exists.
                  </p>
                </div>
              </Reveal>

              {/* The guarantee — shared with the Home pilot section. */}
              <Reveal index={2}>
                <GuaranteeBox />
              </Reveal>
            </div>
          </div>
        </section>

        {/* Billing-only FAQ — the money/setup mechanics, directly under the table. */}
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
                {BILLING_FAQ.map((item) => (
                  <details key={item.q} className="group border-t border-border last:border-b">
                    <summary className="flex cursor-pointer list-none items-center justify-between gap-4 py-[22px] font-serif text-[18.5px] font-semibold text-teal [&::-webkit-details-marker]:hidden">
                      {item.q}
                      <span
                        className="flex-none text-[24px] font-light leading-none text-terracotta transition-transform group-open:rotate-45"
                        aria-hidden
                      >
                        +
                      </span>
                    </summary>
                    <div className="max-w-[720px] px-1 pb-6 text-[15.5px] leading-[1.7] text-slate">{item.a}</div>
                  </details>
                ))}
              </div>
            </Reveal>
          </div>
        </section>

        <PaperEdge variant="wave" color="teal" />
        <FinalCTA />
      </main>
      <Footer />
    </>
  );
}
