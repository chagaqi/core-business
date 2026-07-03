import type { Metadata } from "next";
import { VslPlayer } from "@/components/vsl/VslPlayer";
import { TranscriptToggle } from "@/components/vsl/TranscriptToggle";
import { EmailCapture } from "@/components/vsl/EmailCapture";
import { CalButton } from "@/components/booking/CalButton";

export const metadata: Metadata = {
  title: "Cold Loom — Tideover",
  description:
    "A under-90-second cold Loom for crowdfunding founders mid-fulfillment: the support wave that hits during the long presale wait, and the one ask — a free 15-minute teardown.",
};

const TITLE = "Cold Loom — founder mid-fulfillment (under 90s)";

export default function ColdLoomPage() {
  return (
    <div className="flex flex-col gap-9">
      <div>
        <span className="kicker mb-3.5">VSL · Asset 1</span>
        <h1 className="mb-3 text-balance">Cold Loom</h1>
        <p className="m-0 text-[17px] leading-relaxed text-slate">
          A short, personal cold video for a founder still in the fulfillment wait. One ask: book a 15-minute teardown.
        </p>
      </div>

      <VslPlayer title={TITLE} />

      <TranscriptToggle>
        <div className="flex flex-col gap-4">
          <p>
            <strong>Hook (looking at your page):</strong> &ldquo;Hey {`{{firstName}}`}, 60 seconds. I&rsquo;m looking at{" "}
            {`{{campaign}}`} right now [scroll their page], and I had one thought about what&rsquo;s about to hit your
            inbox once these ship.&rdquo;
          </p>
          <p>
            <strong>Body:</strong> &ldquo;Here&rsquo;s the pattern. I lived it. The campaign funds, that&rsquo;s the hard
            part, congrats. But the second the money clears, a {`{{leadTimeWeeks}}`}-week clock starts, and that&rsquo;s
            where it goes sideways.
          </p>
          <p>
            [Scroll to their shipping note.] You wrote the ship date everywhere. People still forget. So your inbox
            becomes the same question two hundred times, and you&rsquo;re copy-pasting all day.
          </p>
          <p>
            The volume isn&rsquo;t the dangerous part. A generic helpdesk can&rsquo;t even tell which of these are
            preorders. The curious buyer at day 12 needs a different answer than the one threatening to dispute at day 89.
            Same canned line to both. Get it wrong and they don&rsquo;t wait. They file a chargeback and call you a scam.
            I&rsquo;ve watched that hit a Stripe account.
          </p>
          <p>
            So here&rsquo;s what I want: 15 minutes to look at how your presale support runs today and show you the two or
            three moments where you&rsquo;re most likely to lose people. I&rsquo;d rather map your actual inbox than pitch
            you. If it&rsquo;s useful, great. If not, you&rsquo;re out 15 minutes. Link&rsquo;s below. Rooting for{" "}
            {`{{brand}}`}.&rdquo;
          </p>
        </div>
      </TranscriptToggle>

      <EmailCapture />

      <div>
        <CalButton large>Get a free 15-min teardown</CalButton>
      </div>
    </div>
  );
}
