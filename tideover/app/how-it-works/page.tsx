import type { Metadata } from "next";
import { Nav } from "@/components/marketing/Nav";
import { HowItWorks } from "@/components/marketing/HowItWorks";
import { Operator } from "@/components/marketing/Operator";
import { FinalCTA } from "@/components/marketing/FinalCTA";
import { Footer } from "@/components/marketing/Footer";

/**
 * /how-it-works — the deep-dive on the presale-specialist layer. Standalone
 * page: Nav + a short page hero + the full <HowItWorks/> (feature cards,
 * routing diagram, comparison table — same component the Home overview uses
 * in its `condensed` form, so there is one source of truth for this content)
 * + the Operator founder story + a closing CTA + Footer. Public page, no auth.
 */
export const metadata: Metadata = {
  title: "How it works — Tideover",
  description:
    "How Tideover bolts onto the helpdesk you already run, reads each order's real production timeline, and drafts calm, human-approved, day-stage reassurance — versus a generic helpdesk AI.",
};

export default function HowItWorksPage() {
  return (
    <>
      <Nav />
      <main>
        <section className="section">
          <div className="wrap max-w-[820px]">
            <span className="kicker mb-3.5">How it works</span>
            <h1 className="mb-5 text-balance">The presale-specialist layer, in full.</h1>
            <p className="m-0 max-w-[680px] text-[17px] leading-relaxed text-slate">
              Everything Tideover does once it&rsquo;s bolted onto your helpdesk &mdash; how it plugs in, how it
              reads each order&rsquo;s real timeline, and how it stacks up against a generic helpdesk AI.
            </p>
          </div>
        </section>
        <HowItWorks />
        <Operator />
        <FinalCTA />
      </main>
      <Footer />
    </>
  );
}
