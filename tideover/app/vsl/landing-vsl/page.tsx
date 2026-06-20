import type { Metadata } from "next";
import { VslPlayer } from "@/components/vsl/VslPlayer";
import { TranscriptToggle } from "@/components/vsl/TranscriptToggle";
import { EmailCapture } from "@/components/vsl/EmailCapture";
import { CalButton } from "@/components/booking/CalButton";

export const metadata: Metadata = {
  title: "Landing-page VSL — Tideover",
  description:
    "The 3–4 minute landing-page VSL: the presale wait, why generic helpdesks fail it, the presale-specialist layer, and the honest founding-pilot offer. Proof-only.",
};

const TITLE = "Landing-page VSL (3–4 min)";

function HonestProofBox() {
  return (
    <div className="rounded-2xl border border-border bg-sand-2 p-7">
      <h3 className="mb-2.5 font-serif text-[19px] font-semibold text-ink">The straight talk on proof</h3>
      <p className="m-0 text-[15px] leading-relaxed text-slate">
        A &ldquo;we cut refunds by X percent&rdquo; case study needs a full presale cycle, 60 to 120 days, so it
        doesn&rsquo;t exist yet and we won&rsquo;t fake one. What a pilot shows you first are the honest leading
        indicators: faster replies, fewer repeat tickets. The refund numbers come after a first cohort finishes its wait.
        No invented metrics, no testimonials, no logos.
      </p>
    </div>
  );
}

export default function LandingVslPage() {
  return (
    <div className="flex flex-col gap-9">
      <div>
        <span className="kicker mb-3.5">VSL · Asset 2</span>
        <h1 className="mb-3 text-balance">Landing-page VSL</h1>
        <p className="m-0 text-[17px] leading-relaxed text-slate">
          The full argument for warm traffic: the wait, why helpdesks miss it, the specialist layer, and the free
          founding-partner pilot.
        </p>
      </div>

      <VslPlayer title={TITLE} />

      <TranscriptToggle>
        <div className="flex flex-col gap-4">
          <p>
            <strong>Cold-open (the reframe):</strong> &ldquo;Your presale buyers don&rsquo;t get cold feet. They need
            someone to tide them over the wait. Whether a backer gets carried calmly through 90 days or files a
            chargeback and calls you a scam usually comes down to whether anyone said the right thing at the right moment.
            Let me show you where that happens.&rdquo;
          </p>
          <p>
            <strong>Problem:</strong> Here&rsquo;s the setup. You run a presale. The cash comes in, that&rsquo;s the hard
            part. But the moment it clears, a 60-to-120-day clock starts, and the paid-but-waiting window is where it goes
            wrong. The inbox floods. Your helpdesk can&rsquo;t tell which orders are even preorders. And the buyers who
            can&rsquo;t get a calm, specific answer don&rsquo;t wait. They dispute. Industry benchmarks put presale-heavy
            stores at five-to-ten times the &ldquo;where is my order&rdquo; tickets during a long wait (Source: YepAI
            2026, industry benchmark), and every chargeback runs fifteen to twenty-five dollars in fees before you lose
            the product and the customer (Source: card-network dispute fee range).
          </p>
          <p>
            <strong>Why helpdesks fail:</strong> So why doesn&rsquo;t your helpdesk just handle this? It&rsquo;s built
            for in-stock support, so it treats &ldquo;where is my order&rdquo; as a one-off shipping question. Answer,
            close, done. But a presale is a months-long wait, and the buyer&rsquo;s mood moves through it. Curious at day
            12 needs a different answer than restless at day 40, or the day-89 buyer who&rsquo;s one email from a
            chargeback. A generic bot gives all three the same canned line. That&rsquo;s when trust breaks.
          </p>
          <p>
            <strong>The approach:</strong> Tideover is a presale-specialist layer that bolts onto the inbox you already
            run. It reads each order&rsquo;s real production timeline and drafts a calm, human reply tuned to where that
            buyer sits in the wait. Day 12, someone&rsquo;s nervous it didn&rsquo;t go through, so they get a calm
            confirmation and a clear ship window. Day 58, &ldquo;I want a refund,&rdquo; so they get an honest read on the
            wait and a real production update. Day 89, &ldquo;last chance before I dispute,&rdquo; the highest-stakes
            save: an honest tracking update and a real reason to wait one more day, so it goes to them and not their bank.
            Same inbox, different replies, because now your support knows the difference.
          </p>
          <p>
            <strong>Credibility (proof-only):</strong> I&rsquo;m Chaga, not a CS-software salesperson. I ran fulfillment,
            in-house shipping, and the &ldquo;where is my order&rdquo; comms for a physical-goods brand. I&rsquo;ve sent
            the day-60 refund email that works and the one that makes it worse. What calms an anxious buyer versus what
            makes them hit dispute, that&rsquo;s the whole product.
          </p>
          <p>
            And here&rsquo;s the straight talk. A &ldquo;we cut refunds by X percent&rdquo; case study needs a full
            presale cycle, 60 to 120 days, so it doesn&rsquo;t exist yet and I won&rsquo;t fake one. What a pilot shows
            you first are the honest leading indicators: faster replies, fewer repeat tickets. The refund numbers come
            after a first cohort finishes its wait. You&rsquo;ll know where the proof stands at every step.
          </p>
          <p>
            <strong>Offer + CTA:</strong> So here&rsquo;s what I&rsquo;m doing. I&rsquo;m running a small first cohort of
            founding partners&rsquo; presale support by hand, inside the tools they already use. Free for one cycle. No
            software to install, and you approve every reply before it goes out. If you convert after, the founding intro
            is a hundred-ninety-nine to two-ninety-nine a month, and the productized version runs two-ninety-nine to
            four-ninety-nine, with no performance fee until a real case study exists. If you graduated off crowdfunding
            onto Shopify and you&rsquo;ve got real buyers in the wait window now, book the free 15-minute teardown below.
            I&rsquo;ll show you where buyers are most likely to bail and tell you honestly whether a pilot is worth your
            time. Operator to operator. Talk soon.
          </p>
        </div>
      </TranscriptToggle>

      <HonestProofBox />

      <EmailCapture />

      <div>
        <CalButton large>Get a free 15-min teardown</CalButton>
      </div>
    </div>
  );
}
