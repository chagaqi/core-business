import type { Metadata } from "next";
import { Nav } from "@/components/marketing/Nav";
import { Footer } from "@/components/marketing/Footer";
import { Button } from "@/components/ui/Button";
import { CAN_SEE, NEVER_SEE, REVOCATION } from "@/lib/security-content";

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
            <div className="mt-6">
              <Button href="/procurement" variant="ghost">
                Download the procurement packet
              </Button>
              <p className="mt-2 text-[13.5px] text-ink-mute">
                Everything on this page plus our sub-processors and data-handling, on one printable page to
                forward to a security or procurement reviewer.
              </p>
            </div>
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
                With AI drafting off (the default), buyer data leaves Tideover in one place: the status page
              </h3>
              <p className="m-0 text-[15px] leading-relaxed text-slate">
                {
                  "A status link you share with a buyer exposes only that one order's own low-sensitivity fields: the buyer's first name, order reference, region, the timeline, and a confidence band (never a hard delivery date). Email, lifetime value, risk score, and any other order are defined out of that function on purpose. It is a single, audited boundary in the code (getPublicStatus in lib/status.ts), so the status page cannot leak those excluded fields even if we wanted it to. Turn on AI drafting and there is exactly one more exit, covered next."
                }
              </p>
            </div>

            {/* AI drafting subprocessor boundary (ADR-0018) */}
            <div className="mt-[22px] rounded-[20px] border-l-[3px] border-teal bg-accent-card p-[26px]">
              <h3 className="mb-2 font-serif text-[20px] font-semibold text-teal">
                If you turn on AI drafting: one subprocessor
              </h3>
              <p className="m-0 text-[15px] leading-relaxed text-slate">
                {
                  "AI drafting is optional and off by default. When it is on, the ticket's subject and text — plus the buyer's first name, order stage, and timing band — are sent to DeepSeek (Hangzhou DeepSeek Artificial Intelligence Co., Ltd., servers in the People's Republic of China) to draft the reply; DeepSeek's own privacy policy governs its handling of that text. Email addresses, lifetime value, and payment data are never in the prompt. Every AI draft passes the same hard-date gate as a template draft, and a person approves it before anything sends. Leave the feature off and no ticket text leaves Tideover."
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
