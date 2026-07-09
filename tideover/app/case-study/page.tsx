import type { Metadata } from "next";
import { Nav } from "@/components/marketing/Nav";
import { Footer } from "@/components/marketing/Footer";
import { CaseStudySampleBanner, CaseStudyTemplate } from "@/components/marketing/CaseStudyTemplate";

/**
 * /case-study — the honest case-study TEMPLATE (sample). Public page, no auth.
 *
 * A persistent SAMPLE banner sits above the shared Nav so the framing is the
 * first thing seen; then the full case-study anatomy renders with every metric,
 * quote, and outcome as a designed placeholder slot. Goes live for real the day
 * the first pilot cohort closes (real numbers only); doubles as a pitch-call
 * asset in the meantime. Reachable via the footer Company column, never the
 * header (per the header/IA decision — no nav item until a real cohort exists).
 */
export const metadata: Metadata = {
  title: "Case study (sample) — Tideover",
  description:
    "The template our first completed pilot fills in. Every metric, quote, and outcome is a placeholder slot — the anatomy of the case study we publish, with real numbers only, the day cohort one closes.",
};

export default function CaseStudyPage() {
  return (
    <>
      <CaseStudySampleBanner />
      <Nav />
      <main>
        <CaseStudyTemplate />
      </main>
      <Footer />
    </>
  );
}
