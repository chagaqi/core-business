import { Nav } from "@/components/marketing/Nav";
import { Hero } from "@/components/marketing/Hero";
import { LongWait } from "@/components/marketing/LongWait";
import { HowItWorks } from "@/components/marketing/HowItWorks";
import { Pilot } from "@/components/marketing/Pilot";
import { HonestFit } from "@/components/marketing/HonestFit";
import { Operator } from "@/components/marketing/Operator";
import { FAQ } from "@/components/marketing/FAQ";
import { FinalCTA } from "@/components/marketing/FinalCTA";
import { Footer } from "@/components/marketing/Footer";

/**
 * Tideover marketing homepage. A server component that composes the sticky nav
 * and the section stack. Nav and FAQ are client components; everything else is
 * server-rendered, with entrance motion handled by the shared <Reveal>.
 */
export default function HomePage() {
  return (
    <>
      <Nav />
      <main>
        <Hero />
        <LongWait />
        <HowItWorks />
        <Pilot />
        <HonestFit />
        <Operator />
        <FAQ />
        <FinalCTA />
        <Footer />
      </main>
    </>
  );
}
