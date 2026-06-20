"use client";

import { Reveal } from "@/components/ui/Reveal";

/**
 * FAQ accordion using native <details>/<summary> (no JS state needed beyond the
 * browser's). Questions and answers come from the sales-page FAQ, on-voice and
 * proof-only: we say plainly what we can't prove yet.
 */
const FAQS: readonly { q: string; a: string }[] = [
  {
    q: "Do you actually have proof it reduces refunds?",
    a: "Not yet, and we won't pretend we do. A real refund number needs a full cycle, 60–120 days, which is the entire reason we're running founding pilots now. What we can show you during the pilot are honest leading indicators: faster first-response times, fewer repeat tickets, logged saves. The refund case study comes after your first cohort finishes its wait, built on your own data.",
  },
  {
    q: "How is this different from my helpdesk's AI add-on?",
    a: "Your helpdesk is an excellent generalist. Its AI treats “where's my order” as a shipping question and answers it the same whether you ship in 2 days or 120. It doesn't know which orders are presales, what stage they're in, or that the question means something different at day 7 versus day 89. Tideover is the specialist layer that fills that gap, and it plugs into your tools rather than replacing them.",
  },
  {
    q: "What if your AI invents a ship date and makes things worse?",
    a: "It can't. During the pilot nothing goes out without your approval, and replies are constrained to honest confidence-band windows (“ships in weeks 9–11”), never invented hard dates. We lived the damage a bad timeline promise does to a brand.",
  },
  {
    q: "We're juggling Kickstarter backers, late-pledges, and Shopify preorders at once. Can you handle that?",
    a: "That's the buyer we built this for. Three groups on three clocks in one inbox is the hardest version of the problem. We tag and separate the groups, map each to its real timeline, and make sure a backer never gets told a Shopify-preorder ship window.",
  },
  {
    q: "Will you make promises you can't keep?",
    a: "Never. We use honest confidence bands — “currently tracking for weeks 9–11,” not a hard date. Every novel reply is human-approved before it sends. A false delivery promise is the most damaging thing we could say, so we don't.",
  },
  {
    q: "Why is it free? What's the catch?",
    a: "We need to author the playbooks alongside real merchants, and the only honest way to do that is on real orders. You get the work free, we earn the case study. The only ask is read access to do the work, and, if you're happy, an honest testimonial about the experience.",
  },
  {
    q: "Do I switch helpdesks or install anything?",
    a: "No. Tideover bolts onto the Gorgias, Tidio, or Intercom you already run. Nothing to rip out, no second inbox, no infra change — we work inside your existing setup and handle the presale tickets specifically.",
  },
  {
    q: "What does it cost after the pilot?",
    a: "The pilot is free: no software fee, no setup fee, no card. On proof, the founding-partner intro is roughly $199–$499/mo, scaling to $799–$999+/mo as volume grows. Any performance fee waits until there's a real case study to stand on.",
  },
];

export function FAQ() {
  return (
    <section id="faq" className="section scroll-mt-20">
      <div className="wrap max-w-[860px]">
        <Reveal index={0}>
          <div className="mb-9">
            <span className="kicker mb-3.5">Questions</span>
            <h2 className="m-0">Answered plainly.</h2>
          </div>
        </Reveal>

        <Reveal index={1}>
          <div>
            {FAQS.map((item) => (
              <details key={item.q} className="group border-t border-border last:border-b">
                <summary className="flex cursor-pointer list-none items-center justify-between gap-4 py-[22px] font-serif text-[18.5px] font-semibold text-teal [&::-webkit-details-marker]:hidden">
                  {item.q}
                  <span
                    className="flex-none text-[24px] font-light leading-none text-terracotta transition-transform group-open:rotate-45"
                    aria-hidden
                  >
                    +
                  </span>
                </summary>
                <div className="max-w-[720px] px-1 pb-6 text-[15.5px] leading-[1.7] text-slate">{item.a}</div>
              </details>
            ))}
          </div>
        </Reveal>
      </div>
    </section>
  );
}
