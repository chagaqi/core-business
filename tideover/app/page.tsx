import { Nav } from "@/components/marketing/Nav";
import { Hero } from "@/components/marketing/Hero";
import { CapabilityShowcase } from "@/components/marketing/CapabilityShowcase";
import { TrustStrip } from "@/components/marketing/TrustStrip";
import { LongWait } from "@/components/marketing/LongWait";
import { DemoCenterpiece } from "@/components/marketing/DemoCenterpiece";
import { HowItWorks } from "@/components/marketing/HowItWorks";
import { ObjectionBlocks } from "@/components/marketing/ObjectionBlocks";
import { Operator } from "@/components/marketing/Operator";
import { Pilot } from "@/components/marketing/Pilot";
import { FAQ } from "@/components/marketing/FAQ";
import { FinalCTA } from "@/components/marketing/FinalCTA";
import { Footer } from "@/components/marketing/Footer";
import { PaperEdge } from "@/components/marketing/paper/PaperEdge";

/**
 * Tideover marketing homepage — the full conversion staircase (redesign plan §2).
 * Server component composing the sticky nav and the section stack in the plan's
 * order: Hero (emotional hook) → CapabilityShowcase (make it concrete) →
 * TrustStrip (credibility + stack fit) → LongWait (the problem, felt) →
 * DemoCenterpiece (watch chaos become calm; #demo, the hero's "See a live draft"
 * target) → HowItWorks (condensed depth) → ObjectionBlocks (kill the top three
 * objections) → Operator (the founder peak, moved onto home) → Pilot (the offer,
 * #pricing) → FAQ → FinalCTA. The deep-dive routes (/how-it-works, /who-its-for)
 * still own the uncondensed HowItWorks / HonestFit; Operator is shared.
 *
 * Paper/tide restraint: PaperStrata backdrop lives in Hero; corner-fold is used
 * by the objection/tier cards. Here we place just three PaperEdge dividers at the
 * beats the plan calls out — the S1 hero tear, the light→dark hand-off into the
 * pilot, and the S11 crest into the final CTA — never one per seam. Nav and FAQ
 * are client components; entrance motion is the shared <Reveal>.
 */
export default function HomePage() {
  return (
    <>
      <Nav />
      <main>
        <Hero />
        <PaperEdge variant="torn" color="sand" />
        <CapabilityShowcase />
        <TrustStrip />
        <LongWait />
        <DemoCenterpiece />
        <HowItWorks condensed />
        <ObjectionBlocks />
        <Operator />
        <PaperEdge variant="wave" color="teal" />
        <Pilot />
        <FAQ />
        <PaperEdge variant="wave" color="teal" />
        <FinalCTA />
      </main>
      <Footer />
    </>
  );
}
