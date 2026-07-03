import type { Metadata } from "next";
import { Nav } from "@/components/marketing/Nav";
import { Footer } from "@/components/marketing/Footer";

/**
 * /security — the data-map page for prospects and their legal/ops reviewers.
 * Proof-only: every line describes what the code in this repo actually does
 * (see lib/status.ts, app/api/ticket-ingest/route.ts, middleware.ts,
 * lib/session.ts, lib/types.ts, lib/channel-adapters/*). No certifications,
 * no "bank-level" claims — data minimization by architecture is the whole story.
 * Public page: not listed in middleware.ts's matcher, so it renders with no auth.
 */
export const metadata: Metadata = {
  title: "Security & data — Tideover",
  description:
    "Exactly what Tideover can and can't see, how to cut us off in one action per integration, and how non-presale data is dropped before it touches a database.",
};

const CAN_SEE: readonly { title: string; body: string }[] = [
  {
    title: "The presale tickets you route to us",
    body: "The subject and body text of the support messages you forward or webhook to Tideover, the customer's email address, an order reference if the message carries one, and when it was sent. That is the message you chose to send us — nothing more from your inbox.",
  },
  {
    title: "The order and customer details needed to match a ticket to a real timeline",
    body: "For the orders and customers you route or import: first name, email, order value, region, production stage, and the delivery estimate disclosed at purchase. We use these to compute the timeline and risk you see, and the reassurance the buyer sees. Not your whole store — only what a routed ticket needs.",
  },
  {
    title: "Status-page view metadata, for dispute evidence",
    body: "When a buyer opens a status link you shared, we log the time, a shortened browser user-agent, and only the first two octets of their IP address (e.g. \"203.0\", never the full address). It is a factual \"notified on X, viewed on Y\" record, kept as chargeback evidence.",
  },
];

const NEVER_SEE: readonly { title: string; body: string }[] = [
  {
    title: "Card or payment data",
    body: "Tideover never touches checkout or a payment processor. Card numbers, bank details, and payment credentials live with Shopify, Kickstarter, and your processor. There is no code path in Tideover that reads them.",
  },
  {
    title: "Your Shopify admin",
    body: "Running the pilot needs no app install, no admin password, and no OAuth into your store. The forwarding and webhook rungs move tickets to us without granting any access to your Shopify admin.",
  },
  {
    title: "Your full customer list",
    body: "We only receive the customers attached to the tickets you route, plus any export you deliberately choose to import. Tideover never performs a bulk pull of your store's customer database.",
  },
  {
    title: "Passwords",
    body: "No integration rung asks for a login. Forwarding aliases, webhooks with a shared secret, and least-privilege API keys are the only mechanisms — never your password.",
  },
  {
    title: "Anything outside the tickets you send us",
    body: "Messages you don't route never reach us. Where you scope us to presale tags, anything that isn't presale is discarded at the edge before it is ever stored (see below).",
  },
];

const REVOCATION: readonly { rung: string; grants: string; cutoff: string }[] = [
  {
    rung: "0 — CSV import",
    grants: "The order/customer fields from a file you upload yourself.",
    cutoff: "Nothing recurring to revoke — stop uploading, and email us to delete the imported records.",
  },
  {
    rung: "1 — Email forwarding",
    grants: "A copy of the presale mail your forwarding rule sends to a Tideover alias.",
    cutoff: "Delete the forwarding rule in your mail settings. Mail stops reaching us immediately.",
  },
  {
    rung: "2 — Helpdesk webhook",
    grants: "Presale ticket events your helpdesk fires at our ingest URL (e.g. a Gorgias HTTP integration).",
    cutoff: "Deactivate or delete the webhook or trigger in your helpdesk. No further events reach us.",
  },
  {
    rung: "3 — Write-back API key",
    grants: "A least-privilege agent-user key so approved replies post back inside your helpdesk.",
    cutoff: "Reset the API key (invalidates instantly) or delete the Tideover agent user.",
  },
  {
    rung: "Optional — Shopify custom app",
    grants: "Read-only order data, if you ever create a custom app with read_orders.",
    cutoff: "Uninstall the custom app from your Shopify admin.",
  },
];

function CheckIcon() {
  return (
    <span className="mt-px flex-none font-bold text-[#2E7D6E]" aria-hidden>
      &#10003;
    </span>
  );
}

function BarIcon() {
  return (
    <span className="mt-px flex-none font-bold text-[#B5836A]" aria-hidden>
      &mdash;
    </span>
  );
}

export default function SecurityPage() {
  return (
    <>
      <Nav />
      <main>
        <section className="section">
          <div className="wrap max-w-[820px]">
            <span className="kicker mb-3.5">Security &amp; data</span>
            <h1 className="mb-5 text-balance">What Tideover can see &mdash; and what it can&rsquo;t.</h1>
            <p className="m-0 max-w-[680px] text-[17px] leading-relaxed text-slate">
              {
                "This page is for you and whoever reviews tools before you adopt them. It describes how Tideover actually handles data, in plain terms. We hold as little as the job needs, we drop what isn't presale before it lands in a database, and every integration has a single action that cuts us off. That is the design, not a policy we promise to follow later."
              }
            </p>
            <nav aria-label="Legal pages" className="mt-6 flex flex-wrap gap-x-4 gap-y-1 text-[14px] text-ink-mute">
              <a className="link-quiet" href="/privacy">
                Privacy
              </a>
              <a className="link-quiet" href="/terms">
                Terms
              </a>
              <span className="font-semibold text-teal">Security</span>
            </nav>
          </div>
        </section>

        {/* Data map: can see vs never sees */}
        <section className="section section-sand2 pt-0">
          <div className="wrap">
            <div className="grid grid-cols-1 items-start gap-[22px] md:grid-cols-2">
              <div className="h-full rounded-[20px] border border-[#D6E5E0] bg-paper p-[30px] shadow-card">
                <h2 className="mb-2 font-serif text-[24px] font-semibold text-teal">What Tideover can see</h2>
                <p className="mb-6 text-[14px] leading-snug text-ink-mute">
                  {"Only the data a routed presale ticket actually needs."}
                </p>
                <ul className="m-0 flex list-none flex-col gap-5 p-0">
                  {CAN_SEE.map((item) => (
                    <li key={item.title} className="flex items-start gap-3">
                      <CheckIcon />
                      <span>
                        <span className="block text-[15.5px] font-semibold text-ink">{item.title}</span>
                        <span className="mt-1 block text-[14.5px] leading-relaxed text-slate">{item.body}</span>
                      </span>
                    </li>
                  ))}
                </ul>
              </div>

              <div className="h-full rounded-[20px] border border-border bg-sand-2 p-[30px]">
                <h2 className="mb-2 font-serif text-[24px] font-semibold text-[#9A6B45]">What Tideover never sees</h2>
                <p className="mb-6 text-[14px] leading-snug text-ink-mute">
                  {"No code path in Tideover reaches any of this."}
                </p>
                <ul className="m-0 flex list-none flex-col gap-5 p-0">
                  {NEVER_SEE.map((item) => (
                    <li key={item.title} className="flex items-start gap-3">
                      <BarIcon />
                      <span>
                        <span className="block text-[15.5px] font-semibold text-ink">{item.title}</span>
                        <span className="mt-1 block text-[14.5px] leading-relaxed text-slate">{item.body}</span>
                      </span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>

            {/* Public status-page boundary */}
            <div className="mt-[22px] rounded-[20px] border-l-[3px] border-teal bg-accent-card p-[26px]">
              <h3 className="mb-2 font-serif text-[20px] font-semibold text-teal">
                The one place buyer data leaves Tideover: the status page
              </h3>
              <p className="m-0 text-[15px] leading-relaxed text-slate">
                {
                  "A status link you share with a buyer exposes only that one order's own low-sensitivity fields: the buyer's first name, order reference, region, the timeline, and a confidence band (never a hard delivery date). Email, lifetime value, risk score, and any other order are defined out of that function on purpose. It is a single, audited boundary in the code (getPublicStatus in lib/status.ts), so the status page cannot leak those excluded fields even if we wanted it to."
                }
              </p>
            </div>
          </div>
        </section>

        {/* Revocation table */}
        <section className="section">
          <div className="wrap max-w-[900px]">
            <span className="kicker mb-3.5">How to fire us</span>
            <h2 className="mb-4 text-balance">One action cuts Tideover off, per rung.</h2>
            <p className="mb-8 max-w-[680px] text-[16px] leading-relaxed text-slate">
              {
                "You grant access in rungs, lowest-trust first, and you take it back the same way. Here is the exact one action that severs each rung. We would rather tell you how to fire us than pretend you can't."
              }
            </p>
            <div className="overflow-x-auto rounded-[16px] border border-border bg-paper shadow-card">
              <table className="w-full min-w-[640px] border-collapse text-left align-top">
                <caption className="sr-only">Revocation table: how to cut Tideover off at each integration rung</caption>
                <thead>
                  <tr className="border-b border-border bg-sand-2">
                    <th className="p-4 text-[12px] font-semibold uppercase tracking-[0.08em] text-ink-mute">Rung</th>
                    <th className="p-4 text-[12px] font-semibold uppercase tracking-[0.08em] text-ink-mute">
                      What it grants Tideover
                    </th>
                    <th className="p-4 text-[12px] font-semibold uppercase tracking-[0.08em] text-ink-mute">
                      How you cut us off
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {REVOCATION.map((r) => (
                    <tr key={r.rung} className="border-b border-border last:border-b-0">
                      <td className="p-4 text-[14.5px] font-semibold text-ink">{r.rung}</td>
                      <td className="p-4 text-[14.5px] leading-relaxed text-slate">{r.grants}</td>
                      <td className="p-4 text-[14.5px] font-medium leading-relaxed text-teal">{r.cutoff}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </section>

        {/* Drop-at-edge */}
        <section className="section section-sand2">
          <div className="wrap max-w-[820px]">
            <span className="kicker mb-3.5">Drop-at-edge</span>
            <h2 className="mb-4 text-balance">Non-presale data is discarded before it touches a database.</h2>
            <div className="flex flex-col gap-4 text-[16px] leading-relaxed text-slate">
              <p className="m-0">
                {
                  "Helpdesk webhooks are not tag-aware on the way out, so they can send us tickets that have nothing to do with presale. We handle that at the edge, before anything is stored."
                }
              </p>
              <p className="m-0">
                {
                  "When you scope Tideover to your presale tags, every incoming payload is checked against that allow-list. A payload whose tags don't match is acknowledged with a 200 and then dropped — it is never written to the database and never drafted. The only trace is a log line recording that a non-matching event was discarded."
                }
              </p>
              <p className="m-0">
                {
                  "Order of operations is deliberate: we verify the vendor's signature over the exact raw bytes received, then parse the message, then apply the tag filter, then persist. We never parse or store untrusted input before it is authenticated. So the promise \"we drop what isn't presale before it touches a database\" is a real code path (app/api/ticket-ingest/route.ts), not a line of copy."
                }
              </p>
            </div>
          </div>
        </section>

        {/* Operator login */}
        <section className="section">
          <div className="wrap max-w-[820px]">
            <span className="kicker mb-3.5">Operator access</span>
            <h2 className="mb-4 text-balance">How your operators log in.</h2>
            <div className="flex flex-col gap-4 text-[16px] leading-relaxed text-slate">
              <p className="m-0">
                {
                  "The dashboard and cockpit — where drafts are reviewed and approved — sit behind a signed session cookie. In production, every operator page and operator API is gated by middleware: a request without a valid, unexpired, correctly-signed session is redirected to sign-in or refused."
                }
              </p>
              <p className="m-0">
                {
                  "The session is an HMAC-signed token minted from a server-side secret. Rotating that secret revokes every active session immediately; changing the operator password stops new sign-ins. The public pages — this one, your buyers' status links, and the marketing site — are intentionally not gated, so nothing a buyer needs is ever behind a login."
                }
              </p>
            </div>
          </div>
        </section>

        {/* Proof-only "what we don't claim" box */}
        <section className="section section-sand2 pt-0">
          <div className="wrap max-w-[820px]">
            <div className="rounded-[20px] border border-border bg-paper p-[30px] shadow-card">
              <h2 className="mb-3 font-serif text-[22px] font-semibold text-ink">What we don&rsquo;t claim</h2>
              <div className="flex flex-col gap-4 text-[15px] leading-relaxed text-slate">
                <p className="m-0">
                  {
                    "Tideover is a pilot-stage product, and we won't dress it up as more. We do not hold SOC 2. We have not completed a third-party penetration test or security audit. We don't claim \"bank-level\" or \"military-grade\" encryption, and we don't claim to be \"GDPR compliant\" or to carry any certification."
                  }
                </p>
                <p className="m-0">
                  {
                    "What we can tell you is everything above: what we store, what we drop, and how you cut us off in one action. The safety here is structural — we hold as little as the job needs — rather than a badge we point at."
                  }
                </p>
              </div>
            </div>

            <div className="mt-8">
              <h3 className="mb-2 font-serif text-[19px] font-semibold text-teal">Questions?</h3>
              <p className="m-0 text-[15px] leading-relaxed text-slate">
                Send them to{" "}
                <a className="link-quiet" href="mailto:hello@tideover.app">
                  hello@tideover.app
                </a>{" "}
                and I&rsquo;ll answer them myself.
              </p>
              <p className="mt-3 m-0 text-[15px] font-semibold text-ink">&mdash; Dylan</p>
            </div>
          </div>
        </section>
      </main>
      <Footer />
    </>
  );
}
