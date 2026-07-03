import type { Metadata } from "next";
import { Nav } from "@/components/marketing/Nav";
import { Footer } from "@/components/marketing/Footer";

/**
 * /privacy — plain-English privacy policy for the Tideover product. Proof-only:
 * sub-processors are named only where they are real dependencies of this repo
 * (Vercel deploy target, MongoDB Atlas via the mongo driver, Cal.com via
 * @calcom/embed-react, Resend configured-but-not-yet-active for future email).
 * Dates are literal publish-time placeholders — never a fabricated
 * "last updated". Public page: not in middleware.ts's matcher.
 */
export const metadata: Metadata = {
  title: "Privacy — Tideover",
  description:
    "How Tideover handles the tickets and order data merchants route to us: what we collect, why, who processes it, how long we keep it, and how to have it deleted.",
};

interface Section {
  heading: string;
  paras: readonly string[];
  bullets?: readonly string[];
}

const SECTIONS: readonly Section[] = [
  {
    heading: "Who controls your data, and who processes it",
    paras: [
      "If you are a merchant using Tideover, you are the data controller for your customers' personal data. You decide what to route to us and why.",
      "Tideover is a data processor. We handle the support tickets and order data you route to us, on your instructions, to draft and (where you enable it) help send reassurance to your customers on your behalf. We do not use your customers' data for our own purposes.",
    ],
  },
  {
    heading: "What we collect, and why",
    paras: ["We collect only what a routed presale ticket needs to be understood and answered:"],
    bullets: [
      "Support ticket content you route to us — subject, body text, the customer's email, an order reference if present, and the time it was sent — so we can match the ticket to the right order and draft a reply.",
      "Order and customer records you route or import — first name, email, order value, region, production stage, and the delivery estimate disclosed at purchase — so we can compute the timeline and risk you see and the reassurance the buyer sees.",
      "Status-page view metadata — the time a status link was opened, a shortened browser user-agent, and only the first two octets of the viewer's IP address (never the full address) — kept as a factual record of when a buyer was notified and viewed their status, usable as dispute evidence.",
      "Operator account data — the sign-in state for your team members who review drafts, held in a signed session cookie.",
    ],
  },
  {
    heading: "What we do not collect",
    paras: [
      "We do not collect card numbers, bank details, or any payment data — those stay with your store and your payment processor. We do not ask for your store password, and we do not pull your full customer list. We do not run third-party advertising or cross-site tracking cookies in the product.",
    ],
  },
  {
    heading: "Cookies",
    paras: [
      "The product uses a single first-party session cookie for logged-in operators. It is httpOnly and signed, and it exists only to keep an operator signed in. Our marketing site embeds Cal.com to let you book a call; that embed is subject to Cal.com's own privacy terms.",
    ],
  },
  {
    heading: "Sub-processors",
    paras: [
      "We use a small set of third parties to run the service. We name them all, and we will update this list before adding another:",
    ],
    bullets: [
      "Vercel — application hosting.",
      "MongoDB Atlas — database storage on the production data path.",
      "Cal.com — the booking embed on our marketing site.",
      "Resend — configured for future transactional email (e.g. status notifications). It is not active in the pilot: Tideover sends no email to your customers today, and pilot replies are reviewed and sent by you. Listed here in advance of activation.",
    ],
  },
  {
    heading: "How long we keep it",
    paras: [
      "We keep routed tickets and the order and customer records they depend on for as long as your pilot or account is active. Status-page view logs are append-only evidence records, kept for the same period. When you no longer need a record, or when your account ends, we delete it (see below).",
    ],
  },
  {
    heading: "Deleting or exporting your data",
    paras: [
      "You can ask us to export or delete the data you have routed to us at any time by emailing hello@tideover.app, and we will act on the request within a reasonable period. When your account ends, we delete the data you routed to us. Because you are the controller, you can also cut the flow at the source at any time — the Security page lists the one action that revokes each integration.",
    ],
  },
  {
    heading: "Where your data is processed",
    paras: [
      "Tideover is operated from the United States, and your data is processed by the sub-processors named above. If you route data about people in other regions, you remain their controller and are responsible for the lawful basis of routing it to us as your processor.",
    ],
  },
  {
    heading: "Outbound email and CAN-SPAM",
    paras: [
      "If Tideover ever helps send email on your behalf, each message will identify the sender (your brand), include a valid physical postal address, and honor opt-out requests promptly, consistent with the US CAN-SPAM Act.",
      "A valid physical postal address is legally required on commercial email. Ours is 54 Beasley Dr, Unit 3, Kitchener, ON, Canada, and it appears on every commercial message we send.",
    ],
  },
  {
    heading: "Children",
    paras: [
      "Tideover is a business tool and is not directed to children. We do not knowingly collect personal data from children.",
    ],
  },
  {
    heading: "Changes to this policy",
    paras: [
      "If we change how we handle data, we will update this page and move the date below. Material changes that affect merchants will be communicated directly.",
    ],
  },
  {
    heading: "Contact",
    paras: [
      "Questions about privacy, or a deletion or export request, go to hello@tideover.app. Physical address: 54 Beasley Dr, Unit 3, Kitchener, ON, Canada.",
    ],
  },
];

export default function PrivacyPage() {
  return (
    <>
      <Nav />
      <main>
        <section className="section">
          <div className="wrap max-w-[760px]">
            <span className="kicker mb-3.5">Privacy</span>
            <h1 className="mb-4 text-balance">Privacy policy</h1>
            <p className="m-0 text-[16px] leading-relaxed text-slate">
              {
                "Plain English, no boilerplate maze. This describes how the Tideover product handles the tickets and order data merchants route to us."
              }
            </p>
            <p className="mt-4 text-[14px] font-semibold text-ink-mute">Last updated: July 3, 2026</p>
            <nav aria-label="Legal pages" className="mt-5 flex flex-wrap gap-x-4 gap-y-1 text-[14px] text-ink-mute">
              <span className="font-semibold text-teal">Privacy</span>
              <a className="link-quiet" href="/terms">
                Terms
              </a>
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
