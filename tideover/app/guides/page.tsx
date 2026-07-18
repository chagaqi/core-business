import type { Metadata } from "next";
import Link from "next/link";
import { Nav } from "@/components/marketing/Nav";
import { Footer } from "@/components/marketing/Footer";
import { FinalCTA } from "@/components/marketing/FinalCTA";
import { Reveal } from "@/components/ui/Reveal";
import { PaperStrata } from "@/components/marketing/paper/PaperStrata";
import { PaperEdge } from "@/components/marketing/paper/PaperEdge";

/**
 * /guides — the index/hub for the SEO pillar guides (GTM plan §9.1). Internal-link
 * hub that passes authority between the pillars and down to /templates + the pilot
 * CTA. New pillars get a row here as they ship. Public page, no auth.
 */
export const metadata: Metadata = {
  title: "Guides for the Presale Wait — Tideover",
  description:
    "Practical, operator-written guides for the 60–120 day wait between a funded campaign and delivery: chargeback evidence, delay statistics, and responding to angry backers.",
  alternates: { canonical: "/guides" },
};

const GUIDES: readonly { href: string; title: string; blurb: string }[] = [
  {
    href: "/guides/kickstarter-chargeback-evidence",
    title: "Kickstarter chargeback evidence: what to keep, and how to win the dispute",
    blurb: "The five pieces of evidence that decide a crowdfunding dispute, how to assemble the pack before you need it, and the cheaper move of never needing it.",
  },
  {
    href: "/guides/how-late-crowdfunding-delivery",
    title: "How late is too late? What the data says about crowdfunding delays",
    blurb: "Late is the norm, not failure. What the research actually shows, why late isn't the same as gone, and the one variable that decides whether a delayed project survives.",
  },
  {
    href: "/guides/respond-to-angry-backers",
    title: "How to respond to angry backers, by how angry they are",
    blurb: "The reply that calms a frustrated backer is wrong for one threatening a chargeback. A four-tier playbook, from venting to trust-collapse.",
  },
];

export default function GuidesIndex() {
  return (
    <>
      <Nav />
      <main>
        <section className="section relative overflow-hidden !pb-10">
          <PaperStrata />
          <div className="wrap relative z-10 max-w-[760px]">
            <span className="kicker mb-3.5">Guides</span>
            <h1 className="mb-5 text-balance">Field guides for the presale wait.</h1>
            <p className="m-0 max-w-[680px] text-[17px] leading-relaxed text-slate">
              The 60&ndash;120 days between a funded campaign and a delivered order is where most of the hard support
              lives, and almost nobody writes about it honestly. These are the guides we wished existed, written from
              running the where&rsquo;s-my-order inbox for a physical-goods brand.
            </p>
          </div>
        </section>

        <section className="section !pt-2">
          <div className="wrap max-w-[760px]">
            <div className="flex flex-col gap-5">
              {GUIDES.map((g, i) => (
                <Reveal key={g.href} index={i}>
                  <Link href={g.href} className="panel block p-7 transition-colors hover:border-teal">
                    <h2 className="mb-2 font-serif text-[20px] font-semibold text-teal">{g.title}</h2>
                    <p className="m-0 text-[15px] leading-relaxed text-slate">{g.blurb}</p>
                  </Link>
                </Reveal>
              ))}
            </div>

            <Reveal index={0}>
              <p className="m-0 mt-8 text-[16px] leading-relaxed text-slate">
                Want the messages instead of the theory?{" "}
                <Link href="/templates" className="font-semibold text-teal underline underline-offset-2">
                  The Fulfillment Update Template Pack
                </Link>{" "}
                is 17 paste-ready backer messages for every point in the wait, free.
              </p>
            </Reveal>
          </div>
        </section>

        <PaperEdge variant="wave" color="teal" />
        <FinalCTA points={["Guides written by an operator, not a content team", "Confidence-band ETAs, never a hard date", "A free 15-min teardown on your real tickets"]} />
      </main>
      <Footer />
    </>
  );
}
