import { Nav } from "@/components/marketing/Nav";
import { Hero } from "@/components/marketing/Hero";
import { LongWait } from "@/components/marketing/LongWait";
import { HowItWorks } from "@/components/marketing/HowItWorks";
import { HonestFit } from "@/components/marketing/HonestFit";
import { Pilot } from "@/components/marketing/Pilot";
import { FAQ } from "@/components/marketing/FAQ";
import { FinalCTA } from "@/components/marketing/FinalCTA";
import { Footer } from "@/components/marketing/Footer";

/**
 * Tideover marketing homepage — a tightened OVERVIEW, not the full site. A
 * server component that composes the sticky nav and the section stack:
 * Hero → LongWait (the problem) → a condensed HowItWorks (4 feature cards,
 * linking out to /how-it-works for the full routing diagram + comparison
 * table) → a HonestFit teaser (header + link to /who-its-for) → Pilot (the
 * pricing/offer section, anchored `#pricing` for the nav) → FAQ → FinalCTA.
 * The deep-dive content (full HowItWorks, Operator founder story, full
 * HonestFit) now lives on their own standalone pages so each can carry its
 * own nav + footer. Nav and FAQ are client components; everything else is
 * server-rendered, with entrance motion handled by the shared <Reveal>.
 */
export default function HomePage() {
  return (
    <>
      <Nav />
      <main>
        <Hero />
        <LongWait />
        <HowItWorks condensed />
        <HonestFit condensed />
        <Pilot />
        <FAQ />
        <FinalCTA />
      </main>
      <Footer />
    </>
  );
}
