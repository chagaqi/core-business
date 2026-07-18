import type { Metadata } from "next";
import Link from "next/link";
import { Nav } from "@/components/marketing/Nav";
import { Footer } from "@/components/marketing/Footer";
import { FinalCTA } from "@/components/marketing/FinalCTA";
import { Reveal } from "@/components/ui/Reveal";
import { PaperStrata } from "@/components/marketing/paper/PaperStrata";
import { PaperEdge } from "@/components/marketing/paper/PaperEdge";

/**
 * /guides/kickstarter-chargeback-evidence — SEO pillar #1 (GTM plan §9.1). The
 * weakest open SERP in the sweep ("kickstarter chargeback dispute evidence": KS's
 * generic page, a Quora thread, a Medium listicle — no structured guide exists).
 * It mirrors the product's evidence-pack feature, so it's authentic and it funnels
 * into /templates + the pilot.
 *
 * Proof-only: general dispute mechanics + operator experience, never fabricated
 * card-network policy or a legal guarantee. It tells the reader to confirm specifics
 * with their own processor. Public page, no auth. Long-form editorial = the ranking
 * body; keep the headings query-shaped.
 */
export const metadata: Metadata = {
  title: "Kickstarter Chargeback Evidence: What to Keep and How to Win the Dispute — Tideover",
  description:
    "A practical guide to defending a crowdfunding chargeback during a long fulfillment wait: what counts as evidence, how to assemble the paper trail, and how to avoid the dispute in the first place.",
  alternates: { canonical: "/guides/kickstarter-chargeback-evidence" },
};

const GUIDE_CTA_POINTS: readonly string[] = [
  "The evidence pack, assembled per order",
  "Confidence-band ETAs, never a hard date",
  "A free 15-min teardown on your real tickets",
];

export default function ChargebackEvidenceGuide() {
  return (
    <>
      <Nav />
      <main>
        <section className="section relative overflow-hidden !pb-10">
          <PaperStrata />
          <div className="wrap relative z-10 max-w-[760px]">
            <span className="kicker mb-3.5">Guide</span>
            <h1 className="mb-5 text-balance">
              Kickstarter chargeback evidence: what to keep, and how to win the dispute.
            </h1>
            <p className="m-0 max-w-[680px] text-[17px] leading-relaxed text-slate">
              A backer disputes their pledge three months into the wait. You can fight it, and you can win, but only
              with the right paper trail. Here&rsquo;s what actually counts as evidence, how to assemble it, and the
              cheaper move: never needing it. Written from running fulfillment and the where&rsquo;s-my-order inbox for
              a physical-goods brand through long waits, not from a legal template site.
            </p>
          </div>
        </section>

        <section className="section !pt-2">
          <div className="wrap max-w-[760px]">
            <Reveal index={0}>
              <div className="prose-guide flex flex-col gap-8">
                <div>
                  <h2 className="mb-3 font-serif text-[24px] font-semibold text-ink">
                    What a chargeback on a preorder actually is
                  </h2>
                  <p className="m-0 mb-3 text-[16px] leading-[1.75] text-slate">
                    When a backer disputes, they&rsquo;re not emailing you. They&rsquo;re telling their bank the charge
                    was wrong, and the bank pulls the money back first and asks questions later. On a crowdfunding
                    pledge or a preorder mid-wait, the reason code is almost always some version of{" "}
                    <em>&ldquo;product not received.&rdquo;</em> Technically true: it hasn&rsquo;t shipped yet. Your job
                    in the dispute is to show that wasn&rsquo;t a surprise, wasn&rsquo;t a scam, and isn&rsquo;t
                    abandonment.
                  </p>
                  <p className="m-0 text-[16px] leading-[1.75] text-slate">
                    You get one response, called a representment. You submit evidence, the bank decides. The specifics
                    of format and deadline are set by your payment processor, so confirm those with them directly. What
                    doesn&rsquo;t change is what persuades: proof the buyer knew the wait, and proof you kept your side
                    of it.
                  </p>
                </div>

                <div>
                  <h2 className="mb-3 font-serif text-[24px] font-semibold text-ink">
                    The five pieces of evidence that actually matter
                  </h2>
                  <p className="m-0 mb-4 text-[16px] leading-[1.75] text-slate">
                    A dispute is won or lost on whether you can show the buyer agreed to a wait and you communicated
                    through it. Five things carry that:
                  </p>
                  <ol className="m-0 flex list-none flex-col gap-4 p-0">
                    {[
                      ["The disclosed delivery window.", "The campaign page or product page where the estimated delivery was stated, ideally with the date it was published. This is the single most important exhibit: it proves the buyer knew a wait was coming when they paid. Screenshot it the day you launch, because campaign pages get edited."],
                      ["The terms they accepted.", "Your refund and fulfillment terms as they read at checkout. \"No refunds once production is committed\" only helps you if it was visible before they paid, not added after the dispute."],
                      ["Every update you sent.", "The timestamped trail of your proactive updates: the day-30 status, the day-60 check-in, the delay announcement. This is what separates a real brand from a vanished one. A buyer who received five honest updates has a weak \"I was abandoned\" claim."],
                      ["Proof of production.", "A dated photo or supplier record showing the thing exists and is moving. Not a promise. Evidence that the money bought a real object that is on its way."],
                      ["Proof you were reachable.", "The support thread showing you answered, offered options, and never went dark. \"I tried to contact the seller and got nothing\" is the backer's strongest line. Your reply history kills it."],
                    ].map(([h, d], i) => (
                      <li key={i} className="panel p-5">
                        <span className="mr-2 font-serif text-[15px] font-semibold text-terracotta">{i + 1}</span>
                        <span className="font-serif text-[17px] font-semibold text-teal">{h}</span>
                        <p className="m-0 mt-2 text-[15px] leading-[1.7] text-slate">{d}</p>
                      </li>
                    ))}
                  </ol>
                </div>

                <div>
                  <h2 className="mb-3 font-serif text-[24px] font-semibold text-ink">How to assemble the pack</h2>
                  <p className="m-0 mb-3 text-[16px] leading-[1.75] text-slate">
                    The mistake is trying to build this the night the dispute lands, digging through a helpdesk and an
                    old campaign page under a 7-day clock. By then the update history is scattered and the campaign
                    page may have changed. Build it as you go instead:
                  </p>
                  <ul className="m-0 flex list-disc flex-col gap-2 pl-5 text-[15.5px] leading-[1.7] text-slate">
                    <li>Screenshot the disclosed window and terms at launch, and again after any edit.</li>
                    <li>Keep every proactive update where you can pull it by order, not buried in a broadcast tool.</li>
                    <li>Save one dated production photo per stage. It doubles as a proof-of-life update to backers.</li>
                    <li>Never delete a support thread with a waiting buyer, even a resolved one.</li>
                  </ul>
                  <p className="m-0 mt-3 text-[16px] leading-[1.75] text-slate">
                    Assembled per order, this is a five-minute submission instead of a frantic night. It&rsquo;s exactly
                    the artifact Tideover keeps automatically for every order: the disclosed window, the full update
                    trail, and the reachability record, ready to export the moment a dispute lands.
                  </p>
                </div>

                <div>
                  <h2 className="mb-3 font-serif text-[24px] font-semibold text-ink">
                    The cheaper win: not needing it
                  </h2>
                  <p className="m-0 mb-3 text-[16px] leading-[1.75] text-slate">
                    Winning a representment still costs you the fee, the hours, and often the customer. The real win is
                    the dispute that never happens. Backers rarely dispute because the wait is long. They dispute
                    because it went <em>quiet</em>, and silence got read as &ldquo;I&rsquo;ve been scammed.&rdquo;
                  </p>
                  <p className="m-0 mb-3 text-[16px] leading-[1.75] text-slate">
                    Two habits prevent most of them. Announce a delay <em>before</em> the promised date passes, not
                    after. And give timing as a band (&ldquo;ships in the next few weeks&rdquo;), never a hard date that
                    becomes the screenshot in the next dispute when it slips. A second broken date is what turns a
                    frustrated backer into a disputing one.
                  </p>
                  <p className="m-0 text-[16px] leading-[1.75] text-slate">
                    We wrote the exact messages for this, free:{" "}
                    <Link href="/templates" className="font-semibold text-teal underline underline-offset-2">
                      the Fulfillment Update Template Pack
                    </Link>{" "}
                    &mdash; 17 paste-ready messages for the wait, including the delay announcement and the chargeback-
                    threat reply that pulls a backer back from their bank.
                  </p>
                </div>

                <p className="m-0 border-t border-border pt-6 text-[13.5px] italic leading-relaxed text-slate">
                  This is operator experience, not legal advice. Dispute rules, evidence formats, and deadlines are set
                  by your payment processor and the card networks. Confirm the specifics for your account with them.
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
