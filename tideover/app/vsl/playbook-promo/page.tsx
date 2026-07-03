import type { Metadata } from "next";
import { VslPlayer } from "@/components/vsl/VslPlayer";
import { TranscriptToggle } from "@/components/vsl/TranscriptToggle";
import { EmailCapture } from "@/components/vsl/EmailCapture";
import { CalButton } from "@/components/booking/CalButton";

export const metadata: Metadata = {
  title: "Presale Anxiety Playbook promo — Tideover",
  description:
    "An under-90-second promo for the free Presale Anxiety Playbook: what to say to a presale buyer at day 7, 30, 60, and 89, and how to keep ship windows honest.",
};

const TITLE = "“Presale Anxiety Playbook” promo (under 90s)";

export default function PlaybookPromoPage() {
  return (
    <div className="flex flex-col gap-9">
      <div>
        <span className="kicker mb-3.5">VSL · Asset 4</span>
        <h1 className="mb-3 text-balance">Presale Anxiety Playbook promo</h1>
        <p className="m-0 text-[17px] leading-relaxed text-slate">
          A short promo that drives downloads of the free playbook &mdash; the exact reassurance moves for each stage of
          the wait.
        </p>
      </div>

      <VslPlayer title={TITLE} />

      <TranscriptToggle>
        <div className="flex flex-col gap-4">
          <p>
            <strong>Hook:</strong> &ldquo;I wrote down the exact thing to say to a presale buyer at day 7, day 30, day
            60, and day 89. The difference between a refund and a loyal customer. And I&rsquo;m giving it away.
            Here&rsquo;s what&rsquo;s in it.&rdquo;
          </p>
          <p>
            <strong>Body:</strong> Quick context. I ran fulfillment and the customer comms during long order waits for a
            physical-goods brand. The biggest mistake I see crowdfunding founders make on Shopify isn&rsquo;t a bad
            product. It&rsquo;s saying the wrong thing at the wrong stage of the wait, and turning a patient backer into a
            chargeback. So I put the whole arc into one free playbook. Inside:
          </p>
          <ul className="m-0 flex list-disc flex-col gap-2 pl-5">
            <li>The four stages of a presale buyer, and what&rsquo;s going on in their head at each.</li>
            <li>
              The exact reassurance moves for day 7, day 30, day 60, and day 89, including the day-89 &ldquo;last chance
              before I dispute&rdquo; message, the hardest one to get right.
            </li>
            <li>
              The confidence-band trick for honest ship windows without promising a hard date you can&rsquo;t keep.
            </li>
            <li>A simple way to tell preorder tickets apart from in-stock ones so your support stops guessing.</li>
          </ul>
          <p>
            Built from real merchant pain and what I learned answering those emails myself. Free, no catch, link&rsquo;s
            here. Grab it before your next drop ships. And if you want help running this in your actual inbox, there&rsquo;s
            a way to do that inside too. Go get it.
          </p>
        </div>
      </TranscriptToggle>

      <EmailCapture cta="Grab the free playbook" />

      <div>
        <CalButton large>Get a free 15-min teardown</CalButton>
      </div>
    </div>
  );
}
