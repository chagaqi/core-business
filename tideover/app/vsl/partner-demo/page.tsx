import type { Metadata } from "next";
import { VslPlayer } from "@/components/vsl/VslPlayer";
import { TranscriptToggle } from "@/components/vsl/TranscriptToggle";
import { EmailCapture } from "@/components/vsl/EmailCapture";
import { CalButton } from "@/components/booking/CalButton";

export const metadata: Metadata = {
  title: "Partner-pitch demo — Tideover",
  description:
    "The 5–6 minute partner demo: the problem on a real setup, the same message answered two ways, how the concierge pilot works, the honest proof, and the founding terms.",
};

const TITLE = "Partner-pitch / demo video (5–6 min)";

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

export default function PartnerDemoPage() {
  return (
    <div className="flex flex-col gap-9">
      <div>
        <span className="kicker mb-3.5">VSL · Asset 3</span>
        <h1 className="mb-3 text-balance">Partner-pitch demo</h1>
        <p className="m-0 text-[17px] leading-relaxed text-slate">
          A &ldquo;watch before our call&rdquo; demo for a warm founder: the problem on their own setup, the same message
          answered two ways, and the free concierge pilot.
        </p>
      </div>

      <VslPlayer title={TITLE} />

      <TranscriptToggle>
        <div className="flex flex-col gap-4">
          <p>
            <strong>Hook (the mirror):</strong> &ldquo;Okay {`{{firstName}}`}, before our call I pulled up your setup.
            There are two spots in your {`{{leadTimeWeeks}}`}-week wait where you&rsquo;re leaking customers, and once you
            see them you can&rsquo;t un-see them. Screen&rsquo;s coming up.&rdquo;
          </p>
          <p>
            <strong>1. Frame + decision pre-frame:</strong> Quick frame so this isn&rsquo;t a sales ambush. I&rsquo;ll
            show you the problem on your own setup, how the concierge pilot works, and what proof I have and don&rsquo;t.
            By the end we&rsquo;ll both know if this fits, and I&rsquo;ll ask you straight whether it&rsquo;s a yes, a no,
            or a not-yet. If you&rsquo;re not the only call on that, tell me now and we&rsquo;ll loop in whoever is. If at
            any point it&rsquo;s not useful, say so and we stop. Let&rsquo;s look at your inbox.
          </p>
          <p>
            <strong>2. The problem, on their setup:</strong> You&rsquo;ve got {`{{product}}`} on a{" "}
            {`{{leadTimeWeeks}}`}-week wait, and you did the right thing. The ship window&rsquo;s written right here.
            Here&rsquo;s the trap. You&rsquo;ve got three groups who all think they&rsquo;re the same: your{" "}
            {`{{platform}}`} backers, your late pledges, your new Shopify preorders. Different timelines, identical to your
            helpdesk. So your agents are clicking into Shopify, then the order, then the preorder app, just to figure out
            who&rsquo;s who. And while you dig, the clock&rsquo;s running on someone&rsquo;s patience. Multiply that by a
            few hundred. The inbox becomes a pile of the same question, and somewhere in it is the customer about to
            dispute, and you can&rsquo;t tell which one. If this keeps running the way it does through your next wave, what
            does that cost you, in chargebacks and in time?
          </p>
          <p>
            <strong>3. The demo — same message, two answers:</strong> Here&rsquo;s the part that matters. Take this
            day-58 message: &ldquo;This is taking forever, I want a refund.&rdquo; A generic bot, or a rushed copy-paste,
            answers like this: &ldquo;Thanks for reaching out! Your order is a preorder and will ship by the estimated
            date. Let us know if you have questions!&rdquo; Technically correct, and it&rsquo;s exactly what makes them
            dispute. No acknowledgment of two months waiting, no new information, reads like a brush-off. Now the same
            message from the presale layer, which knows this is order number whatever, placed day 58, in final packing:
            &ldquo;Totally fair to feel that at the two-month mark. You&rsquo;ve been patient and I appreciate it. Your
            unit cleared QC this week and it&rsquo;s in the final packing run. Current ship window is 9 to 14 days, and
            I&rsquo;ll send tracking the moment it generates. Want me to flag it for priority dispatch so you&rsquo;re
            first out the door?&rdquo; Same customer, same facts. One makes a chargeback, one makes a fan. The system does
            this across the whole arc, each stage pulled from the order&rsquo;s real timeline. That&rsquo;s the idea.
          </p>
          <p>
            <strong>4. How the pilot works:</strong> Now how you&rsquo;d get this, because it&rsquo;s deliberately
            low-risk. No software to install, no bot to bet on. I run your presale support by hand, inside your existing
            inbox. Three steps. One: you give me read access and your real production schedule, and I map what a buyer
            should hear at each stage. No generic templates. Two: I draft every presale reply in your brand voice,
            timeline-accurate, and you approve it before it goes out. Nothing autonomous. Replies stay inside honest
            confidence bands like &ldquo;ships in weeks 9 to 11,&rdquo; never invented hard dates. I&rsquo;ve watched one
            bad timeline promise turn a backer into a chargeback. That&rsquo;s designed out. Three: I baseline your
            first-response time and your &ldquo;where&rsquo;s my order&rdquo; volume before I touch anything, then show
            you the before and after.
          </p>
          <p>
            <strong>5. Honest proof:</strong> Now the proof, straight. A &ldquo;we cut refunds by X percent&rdquo; case
            study needs a full presale cycle, 60 to 120 days, so it doesn&rsquo;t exist yet and I won&rsquo;t fake one.
            What a pilot shows you first are the honest leading indicators: faster replies, fewer repeat tickets. The
            refund numbers come after a first cohort finishes its wait. That&rsquo;s exactly why the pilot is free and run
            by hand: I&rsquo;d rather build the proof on your real inbox than claim it.
          </p>
          <p>
            <strong>6. The ask + founding terms:</strong> So the ask is simple. A free concierge pilot for one cycle. No
            software fee, no setup fee, no card. You approve every reply, you keep the entire reassurance library we
            build, and you lock the lowest price I&rsquo;ll ever offer if you continue. After the pilot, the founding
            intro is a hundred-ninety-nine to two-ninety-nine a month, and the productized version runs two-ninety-nine to
            four-ninety-nine, with no performance fee until a real case study exists. In exchange, I learn from your real
            inbox, and only if you&rsquo;re genuinely happy, an honest testimonial. You&rsquo;re a strong fit, with real
            buyers in the wait window right now. If you want in, I can send the one-page pilot agreement today and capture
            your baseline this week. Want me to send it?
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
