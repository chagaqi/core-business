"use client";

import { Reveal } from "@/components/ui/Reveal";

/**
 * FAQ accordion using native <details>/<summary> (no JS state needed beyond the
 * browser's). Questions and answers come from the sales-page FAQ, on-voice and
 * proof-only: we say plainly what we can't prove yet.
 */
const FAQS: readonly { q: string; a: React.ReactNode }[] = [
  {
    q: "Do you actually have proof it reduces refunds?",
    a: "Not yet, and we won't pretend we do. A real refund number needs a full cycle, 60–120 days, which is the entire reason we're running founding pilots now. What we can show you during the pilot are leading indicators: faster first-response times, fewer repeat tickets, logged saves. The refund case study comes after your first cohort finishes its wait, built on your own data.",
  },
  {
    q: "How is this different from my helpdesk's AI add-on?",
    a: "Your helpdesk is an excellent generalist. Its AI treats “where's my order” as a shipping question and answers it the same whether you ship in 2 days or 120. It doesn't know which orders are presales, what stage they're in, or that the question means something different at day 7 versus day 89. Tideover is the specialist layer that fills that gap, and it plugs into your tools rather than replacing them.",
  },
  {
    q: "Is this just ChatGPT?",
    a: "No. The pilot doesn't require an LLM at all. Four deterministic engines do the work, and their math is on screen: the risk score shows the exact factors behind it, order value, how long the buyer has waited, sentiment, and production stage. Replies are assembled from an approved playbook keyed to where that order actually sits, so there's nothing to hallucinate. And it reads your real fulfillment window, which ChatGPT has no way to know.",
  },
  {
    q: "We already have a VA who answers tickets.",
    a: "Keep them. Tideover isn't a replacement, it's the cockpit that turns a general VA into a presale specialist. Each ticket arrives with a drafted reply in your voice, a risk score that shows its factors, and a gift suggestion when a save is worth it. Your VA reads the situation and approves in seconds, instead of clicking through Shopify and the preorder app to guess at a ship date. Same person, far better tools.",
  },
  {
    q: "What if your AI invents a ship date and makes things worse?",
    a: "It can't. During the pilot nothing goes out without your approval, and replies are constrained to confidence-band windows (“ships in weeks 9–11”), never invented hard dates. We lived the damage a bad timeline promise does to a brand. The check runs in code at send time, so a hard date physically cannot leave the system.",
  },
  {
    q: "We're juggling Kickstarter backers, late-pledges, and Shopify preorders at once. Can you handle that?",
    a: "That's the buyer we built this for. Three groups on three clocks in one inbox is the hardest version of the problem. We tag and separate the groups, map each to its real timeline, and make sure a backer never gets told a Shopify-preorder ship window.",
  },
  {
    q: "Will you make promises you can't keep?",
    a: "Never. We use confidence bands, “currently tracking for weeks 9–11,” not a hard date. Every novel reply is human-approved before it sends. A false delivery promise is the most damaging thing we could say, so we don't.",
  },
  {
    q: "We barely get chargebacks.",
    a: "Two things worth saying. First, rare doesn't mean cheap. A single dispute runs about $128 all-in once you count the fee, the product you re-ship, and the mark it leaves on a merchant account the card networks already watch closely for long delivery (Source: Mastercard 2025 State of Chargebacks). “Item not received” is the exact reason code a 90-day wait invites. Second, disputes were never the everyday cost. The everyday cost is WISMO volume: the same “where's my order?” asked hundreds of times across the wait. That's the bleed Tideover takes off your inbox, dispute or no dispute.",
  },
  {
    q: "You'll see our customers. What about data security?",
    a: (
      <>
        Less than you&rsquo;d think, and that&rsquo;s by design. The pilot is forward-only email: no OAuth, no
        passwords, no Shopify admin. We see only the tickets you forward, nothing else in your inbox. The public
        status page shows a buyer just their first name and a timeline, never their email or lifetime value. Revoking
        us is deleting that one forwarding rule. We don&rsquo;t hold SOC 2 and we don&rsquo;t claim certifications we
        haven&rsquo;t earned. What we can and can&rsquo;t see is laid out line by line on the{" "}
        <a className="link-quiet" href="/security">
          security page
        </a>
        .
      </>
    ),
  },
  {
    q: "What if you disappear mid-cycle? You're one person.",
    a: "Fair question, and the answer is built into how this works, not a promise. Your replies live in your own helpdesk, sent under your name, so the customer relationship was always yours. The status page is a separate hosted page, so switching it off never touches your store. And the whole integration is one email-forwarding rule you created, so ending it is deleting that rule. If Tideover vanished tomorrow you'd lose a tool, not your support.",
  },
  {
    q: "Why is it free? What's the catch?",
    a: "We need to author the playbooks alongside real merchants, and the only way to do that is on real orders. You get the work free, we earn the case study. The only ask is read access to do the work, and, if you're happy, a testimonial about the experience.",
  },
  {
    q: "Do I switch helpdesks or install anything?",
    a: "No. Tideover bolts onto the Gorgias, Tidio, or Intercom you already run. Nothing to rip out, no second inbox, no infra change. We work inside your existing setup and handle the presale tickets specifically.",
  },
  {
    q: "What happens after the wait ends?",
    a: "You pause. Tideover runs during the wait, so between cycles there's nothing to pay for and nothing to manage. When the next campaign or drop opens, you switch it back on for that cohort. Month to month, no annual lock-in.",
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
