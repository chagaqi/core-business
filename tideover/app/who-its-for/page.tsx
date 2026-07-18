import type { Metadata } from "next";
import { Nav } from "@/components/marketing/Nav";
import { HonestFit } from "@/components/marketing/HonestFit";
import { FinalCTA } from "@/components/marketing/FinalCTA";
import { Footer } from "@/components/marketing/Footer";
import { PaperStrata } from "@/components/marketing/paper/PaperStrata";
import { PaperEdge } from "@/components/marketing/paper/PaperEdge";

/**
 * /who-its-for — the disqualification page. Standalone: Nav + a short page
 * hero + the full <HonestFit/> (fit / not-yet cards — same component the Home
 * overview uses in its `condensed` form, so there is one source of truth for
 * this content) + a closing CTA + Footer. Public page, no auth.
 */
export const metadata: Metadata = {
  title: "Who it's for — Tideover",
  description:
    "Tideover is built for a specific kind of long wait: 60–120 day presale, Kickstarter, and made-to-order brands. Here's exactly who it's a fit for, and who should probably wait.",
};

export default function WhoItsForPage() {
  return (
    <>
      <Nav />
      <main>
        <section className="section relative overflow-hidden">
          <PaperStrata />
          <div className="wrap relative z-10 max-w-[820px]">
            <span className="kicker mb-3.5">Who it&rsquo;s for</span>
            <h1 className="mb-5 text-balance">Is it a fit? We&rsquo;d rather tell you now.</h1>
            <p className="m-0 max-w-[680px] text-[17px] leading-relaxed text-slate">
              Built for a specific kind of long wait, not every store. Here&rsquo;s exactly who this is a strong fit
              for, and who should probably hold off for now.
            </p>
          </div>
        </section>
        <HonestFit />
        <PaperEdge variant="wave" color="teal" />
        <FinalCTA />
      </main>
      <Footer />
    </>
  );
}
