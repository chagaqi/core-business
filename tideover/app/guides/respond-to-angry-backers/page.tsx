import type { Metadata } from "next";
import Link from "next/link";
import { Nav } from "@/components/marketing/Nav";
import { Footer } from "@/components/marketing/Footer";
import { FinalCTA } from "@/components/marketing/FinalCTA";
import { Reveal } from "@/components/ui/Reveal";
import { PaperStrata } from "@/components/marketing/paper/PaperStrata";
import { PaperEdge } from "@/components/marketing/paper/PaperEdge";

/**
 * /guides/respond-to-angry-backers — SEO pillar #4 (GTM plan §9.1). Targets "how to
 * respond to angry kickstarter backers", where only single-creator anecdote blogs
 * rank and nobody organizes the replies by severity tier. That structure mirrors the
 * product's risk-scored inbox, so it's authentic and it funnels to /templates.
 * Public page, no auth.
 */
export const metadata: Metadata = {
  title: "How to Respond to Angry Kickstarter Backers, by Severity — Tideover",
  description:
    "The reply that calms a frustrated backer is the wrong reply for one threatening a chargeback. A tiered playbook for responding to upset crowdfunding and preorder backers, from venting to trust-collapse.",
  alternates: { canonical: "/guides/respond-to-angry-backers" },
};

const GUIDE_CTA_POINTS: readonly string[] = [
  "Answer the angriest backer first",
  "Acknowledge, take it private, never defensive",
  "A free 15-min teardown on your real tickets",
];

const TIERS: readonly { tier: string; label: string; need: string; move: string; fail: string }[] = [
  {
    tier: "1",
    label: "Frustrated (venting)",
    need: "To be heard. They're not asking for anything yet, they're registering that the wait hurts.",
    move: "Acknowledge the wait first, plainly, with no apology-spam. Then one concrete status detail and an honest band. That's usually the whole fix.",
    fail: "Leading with the reason it's late. It reads as a defense and escalates them to the next tier.",
  },
  {
    tier: "2",
    label: "Demanding (refund or action)",
    need: "A real answer, not a runaround. They want to know their options are being taken seriously.",
    move: "Give a straight yes or a straight no, then immediately offer the real thing you can do (priority dispatch, a goodwill add-on, a refund if you offer them). Never a warm non-answer.",
    fail: "Hiding behind the policy without offering an alternative. A straight no plus a genuine option disputes far less than a soft dodge.",
  },
  {
    tier: "3",
    label: "Threatening (chargeback or public post)",
    need: "A human, faster than the bank. A chargeback threat is usually a plea, not a decision.",
    move: "Offer the direct line before they think of their card issuer. Ask what would make it right, and answer honestly whether you can. Move a public thread to a DM in two sentences, no defensiveness where others read.",
    fail: "Arguing the wait, or going quiet to 'let them cool off.' Silence here is what turns the threat into an actual dispute.",
  },
  {
    tier: "4",
    label: "Trust collapsed (“this is a scam”)",
    need: "Proof, not persuasion. You cannot argue someone out of believing they've been scammed.",
    move: "A real name and a real dated photo of the real thing. “I'm [name], I ran [credibility], here's where your order actually is.” Then offer whatever proof they need.",
    fail: "Getting offended. Offense reads as guilt. Proof and a name read as a founder who's still here.",
  },
];

export default function AngryBackersGuide() {
  return (
    <>
      <Nav />
      <main>
        <section className="section relative overflow-hidden !pb-10">
          <PaperStrata />
          <div className="wrap relative z-10 max-w-[760px]">
            <span className="kicker mb-3.5">Guide</span>
            <h1 className="mb-5 text-balance">How to respond to angry backers, by how angry they are.</h1>
            <p className="m-0 max-w-[680px] text-[17px] leading-relaxed text-slate">
              The reply that calms a frustrated backer is the wrong reply for one threatening a chargeback. Most
              advice hands you a single tone for all of them, which is why the day-60 refund email so often goes
              sideways. Sort the upset backer by severity first, then answer <em>that</em>. Four tiers, from venting
              to trust-collapse.
            </p>
          </div>
        </section>

        <section className="section !pt-2">
          <div className="wrap max-w-[760px]">
            <Reveal index={0}>
              <p className="m-0 mb-8 text-[16px] leading-[1.75] text-slate">
                One rule runs through all four: <strong className="text-ink">acknowledge the wait before you explain
                it.</strong> The backer already knows it&rsquo;s late. Leading with your reasons reads as a defense.
                Leading with &ldquo;you&rsquo;ve been waiting, I see it&rdquo; reads as a person. Everything below is
                that rule, tuned to how hot the ticket is.
              </p>
            </Reveal>
            <div className="flex flex-col gap-5">
              {TIERS.map((t, i) => (
                <Reveal key={t.tier} index={i}>
                  <article className="panel p-7">
                    <div className="mb-4 flex items-baseline gap-3">
                      <span className="flex-none font-serif text-[15px] font-semibold text-terracotta">
                        Tier {t.tier}
                      </span>
                      <h2 className="m-0 font-serif text-[20px] font-semibold text-teal">{t.label}</h2>
                    </div>
                    <dl className="m-0 flex flex-col gap-2.5 text-[15px] leading-[1.7]">
                      <div>
                        <dt className="inline font-semibold text-ink">What they need: </dt>
                        <dd className="m-0 inline text-slate">{t.need}</dd>
                      </div>
                      <div>
                        <dt className="inline font-semibold text-ink">The move: </dt>
                        <dd className="m-0 inline text-slate">{t.move}</dd>
                      </div>
                      <div>
                        <dt className="inline font-semibold text-ink">The failure: </dt>
                        <dd className="m-0 inline text-slate">{t.fail}</dd>
                      </div>
                    </dl>
                  </article>
                </Reveal>
              ))}
            </div>

            <Reveal index={0}>
              <div className="mt-9">
                <h2 className="mb-3 font-serif text-[24px] font-semibold text-ink">
                  Why the tier is worth reading before you reply
                </h2>
                <p className="m-0 mb-3 text-[16px] leading-[1.75] text-slate">
                  Two backers can send the same &ldquo;where is my order&rdquo; and be in completely different places.
                  One is curious. One is drafting a dispute. Answer them the same and you calm the wrong one. This is
                  the case for triaging your inbox by severity and wait-stage, and answering the highest-risk backer
                  first, which is exactly how a risk-scored presale inbox sorts the queue.
                </p>
                <p className="m-0 text-[16px] leading-[1.75] text-slate">
                  The paste-ready version of every reply above is in{" "}
                  <Link href="/templates" className="font-semibold text-teal underline underline-offset-2">
                    the Fulfillment Update Template Pack
                  </Link>{" "}
                  (templates 9 through 12 cover the four tiers). And if a threat has already reached
                  &ldquo;I&rsquo;m calling my bank,&rdquo; the{" "}
                  <Link
                    href="/guides/kickstarter-chargeback-evidence"
                    className="font-semibold text-teal underline underline-offset-2"
                  >
                    chargeback-evidence guide
                  </Link>{" "}
                  covers what to keep and how to win it.
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
