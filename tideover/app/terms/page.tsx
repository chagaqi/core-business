import type { Metadata } from "next";
import { Nav } from "@/components/marketing/Nav";
import { Footer } from "@/components/marketing/Footer";

/**
 * /terms — plain-English terms of service for the pilot-stage product. Pilot
 * terms mirror the sales page (free one cycle, no lock-in, keep-your-scripts).
 * Proof-only: no outcome guarantees; drafts are human-approved by the merchant;
 * not legal/financial advice. Dates are literal publish-time placeholders.
 * Public page: not in middleware.ts's matcher, so it renders with no auth.
 */
export const metadata: Metadata = {
  title: "Terms — Tideover",
  description:
    "Plain-English terms for the Tideover founding-partner pilot: what the service is, the free-cycle pilot terms, acceptable use, disclaimers, and liability at pilot scale.",
};

interface Section {
  heading: string;
  paras: readonly string[];
  bullets?: readonly string[];
}

const SECTIONS: readonly Section[] = [
  {
    heading: "1. What Tideover is",
    paras: [
      "Tideover is a presale-support layer for merchants with long fulfillment waits. It reads each order's real production timeline and drafts calm, day-stage reassurance, bolted onto the helpdesk you already run or shown as a native Tideover status surface. The playbooks and the measurement are the product; the drafting is a means to them.",
    ],
  },
  {
    heading: "2. The founding-partner pilot",
    paras: ["These are the pilot terms, and they match what the sales page says:"],
    bullets: [
      "Free for one full presale cycle. No card required to start.",
      "No lock-in. You can stop at any time, and you can cut off each integration in one action (see the Security page).",
      "Keep your scripts on exit. The reassurance playbooks and scripts generated during your pilot are yours to keep and use, with or without Tideover.",
      "Any later paid plan is opt-in, and any performance-based fee is deferred until a real, completed-cohort case study exists.",
    ],
  },
  {
    heading: "3. Human approval",
    paras: [
      "Tideover drafts replies; it does not speak to your customers on its own. Every reply that reaches a customer during the pilot is reviewed and approved by you or your team before it is sent. The drafting engine also refuses to promise hard delivery dates — it works in confidence bands by design.",
    ],
  },
  {
    heading: "4. Acceptable use",
    paras: ["When you use Tideover, you agree that:"],
    bullets: [
      "You route only data you have the right to route, and you remain responsible for the lawful basis of routing it.",
      "You will not use Tideover to send unlawful, deceptive, or spam messages, or to harass anyone.",
      "You will not use it to make delivery promises you cannot keep. (The product will not send a hard date regardless.)",
      "You will not attempt to breach, overload, or reverse-engineer the service, or use it to store data it was not designed to hold.",
    ],
  },
  {
    heading: "5. No guarantee of outcomes",
    paras: [
      "Tideover helps you respond faster and more consistently and keeps a factual record of your customer communications. It does not guarantee any specific dispute, chargeback, refund, retention, or delivery outcome. Reassurance uses confidence bands, never hard dates. The service is provided on an \"as is\" and \"as available\" basis, without warranties of any kind to the extent permitted by law.",
    ],
  },
  {
    heading: "6. Not legal or financial advice",
    paras: [
      "Tideover is a support tool, not a law firm or a financial adviser. Nothing in the product, its drafts, or its documentation is legal, financial, tax, or regulatory advice — including anything touching chargebacks, disputes, the US FTC Mail or Internet Order Rule, or customs and VAT. The dispute-evidence records Tideover keeps are informational; whether and how you use them is your decision. Consult your own qualified advisers.",
    ],
  },
  {
    heading: "7. Limitation of liability",
    paras: [
      "To the maximum extent permitted by law, Tideover and its operator are not liable for indirect, incidental, special, or consequential damages, or for lost profits, revenue, or data. Our total aggregate liability for any claim relating to the service is limited to the amount you paid us for it in the three months before the claim — which, for the free pilot, is zero. This reflects the early, pilot-stage nature of the service.",
    ],
  },
  {
    heading: "8. Your data",
    paras: [
      "How Tideover handles data is governed by the Privacy page. In short: you are the data controller, Tideover is your processor, and you can have your routed data exported or deleted on request or when your account ends.",
    ],
  },
  {
    heading: "9. Availability and changes to the service",
    paras: [
      "Tideover is pilot-stage software and is provided on a reasonable-efforts basis. Features may change, and the service may be interrupted or discontinued. We will give notice of material changes that affect active pilots.",
    ],
  },
  {
    heading: "10. Changes to these terms",
    paras: [
      "If we change these terms, we will update this page and move the date below. Continuing to use Tideover after a change means you accept the updated terms.",
    ],
  },
  {
    heading: "11. Contact",
    paras: ["Questions about these terms go to hello@tideover.app."],
  },
];

export default function TermsPage() {
  return (
    <>
      <Nav />
      <main>
        <section className="section">
          <div className="wrap max-w-[760px]">
            <span className="kicker mb-3.5">Terms</span>
            <h1 className="mb-4 text-balance">Terms of service</h1>
            <p className="m-0 text-[16px] leading-relaxed text-slate">
              {
                "Plain English. These cover the founding-partner pilot and how the Tideover product is meant to be used. They are written for an early-stage tool and say so where it matters."
              }
            </p>
            <p className="mt-4 text-[14px] font-semibold text-ink-mute">Last updated: [DATE &mdash; set at publish]</p>
            <nav aria-label="Legal pages" className="mt-5 flex flex-wrap gap-x-4 gap-y-1 text-[14px] text-ink-mute">
              <a className="link-quiet" href="/privacy">
                Privacy
              </a>
              <span className="font-semibold text-teal">Terms</span>
              <a className="link-quiet" href="/security">
                Security
              </a>
            </nav>
          </div>
        </section>

        <section className="section pt-0">
          <div className="wrap max-w-[760px]">
            <div className="flex flex-col gap-10">
              {SECTIONS.map((s) => (
                <div key={s.heading}>
                  <h2 className="mb-3 font-serif text-[22px] font-semibold text-ink">{s.heading}</h2>
                  <div className="flex flex-col gap-3">
                    {s.paras.map((p, i) => (
                      <p key={i} className="m-0 text-[15.5px] leading-relaxed text-slate">
                        {p}
                      </p>
                    ))}
                    {s.bullets ? (
                      <ul className="m-0 mt-1 flex list-none flex-col gap-2.5 p-0">
                        {s.bullets.map((b) => (
                          <li key={b} className="flex items-start gap-2.5 text-[15px] leading-relaxed text-slate">
                            <span className="mt-[9px] h-[5px] w-[5px] flex-none rounded-full bg-teal-300" aria-hidden />
                            {b}
                          </li>
                        ))}
                      </ul>
                    ) : null}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>
      </main>
      <Footer />
    </>
  );
}
