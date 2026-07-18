import type { Metadata } from "next";
import Link from "next/link";
import { Nav } from "@/components/marketing/Nav";
import { Footer } from "@/components/marketing/Footer";
import { FinalCTA } from "@/components/marketing/FinalCTA";
import { Reveal } from "@/components/ui/Reveal";
import { PaperStrata } from "@/components/marketing/paper/PaperStrata";
import { PaperEdge } from "@/components/marketing/paper/PaperEdge";

/**
 * /guides/how-late-crowdfunding-delivery — SEO pillar #3 (GTM plan §9.1). Targets
 * "kickstarter late delivery statistics" and satellites, where the #1 result is a
 * 2012 CNN article (verified still ranking). Cites the real, load-bearing figures
 * from the plan's TAM research (Mollick/Wharton ~75% late; KS's own on-time study;
 * the ~9% never-deliver survey) — every one flagged for age, proof-only.
 *
 * The angle that funnels: late is the norm, not failure; the thing that decides the
 * outcome is comms, not the delay. Public page, no auth.
 */
export const metadata: Metadata = {
  title: "How Late Is Too Late? Crowdfunding Delivery Delay Statistics (2026) — Tideover",
  description:
    "What the research actually says about how often crowdfunding campaigns ship late, why late isn't the same as failed, and what separates a delayed project that survives from one that gets disputed.",
  alternates: { canonical: "/guides/how-late-crowdfunding-delivery" },
};

const GUIDE_CTA_POINTS: readonly string[] = [
  "Late is normal. Silence is the risk.",
  "Confidence-band ETAs, never a hard date",
  "A free 15-min teardown on your real tickets",
];

export default function HowLateGuide() {
  return (
    <>
      <Nav />
      <main>
        <section className="section relative overflow-hidden !pb-10">
          <PaperStrata />
          <div className="wrap relative z-10 max-w-[760px]">
            <span className="kicker mb-3.5">Guide</span>
            <h1 className="mb-5 text-balance">
              How late is too late? What the data says about crowdfunding delays.
            </h1>
            <p className="m-0 max-w-[680px] text-[17px] leading-relaxed text-slate">
              If your campaign is running behind, the first thing worth knowing is that you are the rule, not the
              exception. The research on this is old and thin, but it&rsquo;s consistent. Here&rsquo;s what it says,
              what it doesn&rsquo;t, and the one variable that actually decides whether a late project survives its
              wait.
            </p>
          </div>
        </section>

        <section className="section !pt-2">
          <div className="wrap max-w-[760px]">
            <Reveal index={0}>
              <div className="flex flex-col gap-8">
                <div>
                  <h2 className="mb-3 font-serif text-[24px] font-semibold text-ink">
                    Late is the norm, by a wide margin
                  </h2>
                  <p className="m-0 mb-3 text-[16px] leading-[1.75] text-slate">
                    The most-cited academic look at this is Ethan Mollick&rsquo;s Wharton research, which found that
                    the large majority of funded design and technology projects &mdash; on the order of three in four
                    &mdash; delivered later than their stated estimate. Kickstarter&rsquo;s own commissioned study put
                    on-time delivery at roughly a quarter of projects. Read together, the same picture: shipping on the
                    original date is the exception.
                  </p>
                  <p className="m-0 text-[16px] leading-[1.75] text-slate">
                    A word on these numbers, because we hold our own content to the same proof-only rule we hold the
                    product to: both studies are roughly a decade old, and no larger replication has replaced them. Use
                    them as direction, not as a fresh benchmark. What hasn&rsquo;t changed is the shape &mdash; physical
                    goods with real manufacturing take longer than founders estimate, almost every time.
                  </p>
                </div>

                <div>
                  <h2 className="mb-3 font-serif text-[24px] font-semibold text-ink">Late is not the same as failed</h2>
                  <p className="m-0 mb-3 text-[16px] leading-[1.75] text-slate">
                    The number founders actually fear is the never-delivers rate. The often-quoted figure &mdash;
                    around nine percent of projects &mdash; comes from a single Kickstarter-commissioned survey of tens
                    of thousands of backers, and it too is a decade old with no larger replication. Treat it as a rough
                    floor, not gospel.
                  </p>
                  <p className="m-0 text-[16px] leading-[1.75] text-slate">
                    The gap between those two numbers is the whole story. Most projects that run late still deliver.
                    &ldquo;Late&rdquo; and &ldquo;gone&rdquo; are different states, and the difference to a backer is not
                    the calendar. It&rsquo;s whether they can still hear from you.
                  </p>
                </div>

                <div>
                  <h2 className="mb-3 font-serif text-[24px] font-semibold text-ink">
                    The variable that decides the outcome
                  </h2>
                  <p className="m-0 mb-3 text-[16px] leading-[1.75] text-slate">
                    A late project that posts honest updates reads as a real thing that&rsquo;s hard. A late project
                    that goes quiet reads as a scam, and that&rsquo;s when backers stop waiting and go to their card
                    issuer. The delay isn&rsquo;t what breaks trust. The silence is.
                  </p>
                  <p className="m-0 mb-3 text-[16px] leading-[1.75] text-slate">
                    So &ldquo;how late is too late&rdquo; is the wrong question. A project can run months over and keep
                    every backer, and another can be two weeks late and hemorrhage disputes. What separates them is
                    whether the founder communicated more when they had less news, and whether they ever gave a hard
                    date they then missed twice.
                  </p>
                  <p className="m-0 text-[16px] leading-[1.75] text-slate">
                    Practically: announce a slip before the old date passes, give timing as a band rather than a date,
                    and send a short proof-of-life update on a schedule even when nothing has changed. We wrote the
                    exact messages for each of those moments, free &mdash;{" "}
                    <Link href="/templates" className="font-semibold text-teal underline underline-offset-2">
                      the Fulfillment Update Template Pack
                    </Link>
                    . And if a backer&rsquo;s already threatening a dispute, the guide to{" "}
                    <Link
                      href="/guides/kickstarter-chargeback-evidence"
                      className="font-semibold text-teal underline underline-offset-2"
                    >
                      chargeback evidence
                    </Link>{" "}
                    covers both winning it and avoiding it.
                  </p>
                </div>

                <p className="m-0 border-t border-border pt-6 text-[13.5px] italic leading-relaxed text-slate">
                  Figures above are drawn from the most-cited public studies (Mollick/Wharton; Kickstarter&rsquo;s own
                  commissioned research). Both are roughly a decade old with no larger replication; we cite them as
                  direction, not a current measurement.
                </p>
              </div>
            </Reveal>
          </div>
        </section>

        <PaperEdge variant="wave" color="teal" />
        <FinalCTA points={GUIDE_CTA_POINTS} />
      </main>
      <Footer />
    </>
  );
}
