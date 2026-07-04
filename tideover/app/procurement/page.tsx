import type { Metadata } from "next";
import { PrintButton } from "@/app/app/orders/[orderId]/evidence/PrintButton";
import {
  CAN_SEE,
  NEVER_SEE,
  REVOCATION,
  SUB_PROCESSORS,
  RETENTION,
  DELETION_EXPORT,
  CONTACT_EMAIL,
  POSTAL_ADDRESS,
} from "@/lib/security-content";

/**
 * /procurement — the Security & Data-Handling Packet (T3). One print-optimized
 * page a prospect forwards to their security/procurement reviewer, so a
 * data-handling review never stalls the deal.
 *
 * It ASSEMBLES facts Tideover already states on /security and /privacy into a
 * single forwardable document. It does NOT restate them from memory: the arrays
 * come from lib/security-content.ts, the same source those pages render, so the
 * packet can never drift from the live pages.
 *
 * Proof-only: every line describes real behavior in this repo (lib/status.ts,
 * app/api/ticket-ingest/route.ts, middleware.ts, lib/session.ts). No SOC 2, no
 * ISO, no "bank-level", no invented audit or compliance claim — the honesty is
 * the credibility. Standards (CAN-SPAM) are cited only as context the merchant's
 * own counsel applies, never as a Tideover certification.
 *
 * PUBLIC page: not listed in middleware.ts's matcher, so it renders with no
 * operator auth even in live mode — it is a sales doc, not a gated surface.
 * Reuses the .evpack print isolation + PrintButton from the evidence pack.
 */
export const metadata: Metadata = {
  title: "Security & data-handling packet — Tideover",
  description:
    "The single printable document to forward to your security or procurement reviewer: exactly what Tideover can and can't see, how to cut every integration off, who processes your data, and what we do and don't claim.",
};

// A plain publish date — the day this packet's text was set. NOT a fabricated
// "last audited" or "last pen-tested" date; Tideover holds no such audit.
const PUBLISHED = "July 4, 2026";

const POSTURE: readonly { title: string; body: string }[] = [
  {
    title: "Data minimization by architecture, not by policy",
    body:
      "Tideover holds only what a routed presale ticket needs (see above). The one place buyer data leaves the system — a status link you share — is a single narrow function (getPublicStatus in lib/status.ts) that exposes only that order's first name, order reference, region, timeline, and a confidence band. Email, lifetime value, risk score, and every other order are defined out of that function, so the status page cannot leak them even by mistake.",
  },
  {
    title: "Presale-only, dropped at the edge",
    body:
      "When you scope Tideover to your presale tags, the ingest endpoint verifies the vendor's signature over the exact raw bytes received, then parses, then checks the payload against your tag allow-list, then persists. A non-matching payload is acknowledged with a 200 and discarded before it is ever written to a database or drafted — the only trace is a log line. Untrusted input is never parsed or stored before it is authenticated (app/api/ticket-ingest/route.ts).",
  },
  {
    title: "Single-operator auth model (ADR-0004)",
    body:
      "The cockpit and dashboards sit behind a signed session cookie. In live mode, middleware on the edge gates every operator page and API: a request without a valid, unexpired, HMAC-SHA256-signed session (keyed with a server-side AUTH_SECRET) is redirected to sign-in or refused. Rotating that secret revokes every active session immediately; changing the operator password stops new sign-ins. Public surfaces — this packet, buyers' status links, and the marketing site — are intentionally never gated.",
  },
  {
    title: "Append-only status-view evidence log",
    body:
      "When a buyer opens a status link, Tideover records the time, a shortened browser user-agent, and only the first two octets of their IP address (e.g. \"203.0\", never the full address). These are append-only records kept as factual \"notified on X, viewed on Y\" chargeback evidence — not a behavioral profile.",
  },
  {
    title: "No payment, admin, or password access",
    body:
      "There is no code path in Tideover that reads card or payment data, your Shopify admin, your full customer list, or any password. Integrations are forwarding aliases, webhooks with a shared secret, and least-privilege API keys only. Each rung is revocable in one action (see the ladder above).",
  },
  {
    title: "Proof-only doctrine (ADR-0002)",
    body:
      "Tideover's copy and product never state a fabricated metric, testimonial, rating, logo count, or hard delivery date; a linter (scripts/proof-lint.mjs) enforces it in CI. This packet is written under the same rule — it describes behavior, and names real sub-processors, rather than pointing at a badge.",
  },
];

// Cited by name only where they are real, current dependencies of this repo.
const KEY_ADRS: readonly { id: string; what: string }[] = [
  { id: "ADR-0002", what: "the repository seam + the proof-only doctrine every later decision assumes" },
  { id: "ADR-0004", what: "the operator auth model described above (env-gated demo + HMAC-cookie session)" },
  { id: "ADR-0005", what: "the disclosed-ETA + status-view logging schema (dispute evidence)" },
  { id: "ADR-0011", what: "per-merchant helpdesk webhook ingest, tag-routed and signature-verified" },
];

export default function ProcurementPacketPage() {
  return (
    <div className="evpack">
      {/* Toolbar — never printed */}
      <div className="no-print mb-6 flex flex-wrap items-center justify-between gap-3">
        <p className="text-[12px] text-ink-mute">Public document · forward freely to your reviewer</p>
        <PrintButton />
      </div>

      {/* Document header */}
      <header className="ev-section mb-6">
        <p className="kicker">Security &amp; data-handling packet</p>
        <h1 className="ev-doc-title mt-1 text-ink">Tideover — Security &amp; Data-Handling Packet</h1>
        <p className="mt-2 text-[12.5px] text-ink-mute">
          Published {PUBLISHED} · Tideover (pilot stage). This is a plain publish date, not an audit date.
        </p>
        <p className="mt-3 max-w-[68ch] text-[13.5px] leading-relaxed text-slate">
          This is the one document to forward to whoever reviews tools before you adopt them. It assembles, on a
          single printable page, what tideover.app/security and tideover.app/privacy already state: exactly what
          Tideover can and cannot see, how to cut every integration off, who processes your data, how long it is
          kept, and what we do and do not claim. Every line describes real behavior in the Tideover codebase.
        </p>
      </header>

      {/* What Tideover can / cannot see */}
      <section className="ev-section mb-5">
        <p className="ev-label mb-2">What Tideover can — and cannot — see</p>
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          <div className="ev-card">
            <h2 className="mb-1 font-serif text-[17px] font-semibold text-teal">Can see</h2>
            <p className="ev-meta mb-3">Only the data a routed presale ticket actually needs.</p>
            <ul className="m-0 flex list-none flex-col gap-3 p-0">
              {CAN_SEE.map((item) => (
                <li key={item.title}>
                  <span className="block text-[13.5px] font-semibold text-ink">{item.title}</span>
                  <span className="mt-0.5 block text-[13px] leading-relaxed text-slate">{item.body}</span>
                </li>
              ))}
            </ul>
          </div>
          <div className="ev-card">
            <h2 className="mb-1 font-serif text-[17px] font-semibold text-[#9A6B45]">Never sees</h2>
            <p className="ev-meta mb-3">No code path in Tideover reaches any of this.</p>
            <ul className="m-0 flex list-none flex-col gap-3 p-0">
              {NEVER_SEE.map((item) => (
                <li key={item.title}>
                  <span className="block text-[13.5px] font-semibold text-ink">{item.title}</span>
                  <span className="mt-0.5 block text-[13px] leading-relaxed text-slate">{item.body}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </section>

      {/* How to cut us off */}
      <section className="ev-section mb-5">
        <p className="ev-label mb-2">How to cut us off — one action per integration rung</p>
        <div className="ev-card p-0">
          <div className="overflow-x-auto">
            <table className="w-full min-w-[560px] border-collapse text-left align-top">
              <caption className="sr-only">Revocation ladder: how to cut Tideover off at each integration rung</caption>
              <thead>
                <tr className="ev-entry">
                  <th className="px-4 py-3 text-[10.5px] font-semibold uppercase tracking-[0.08em] text-ink-mute">
                    Rung
                  </th>
                  <th className="px-4 py-3 text-[10.5px] font-semibold uppercase tracking-[0.08em] text-ink-mute">
                    What it grants Tideover
                  </th>
                  <th className="px-4 py-3 text-[10.5px] font-semibold uppercase tracking-[0.08em] text-ink-mute">
                    How you cut us off
                  </th>
                </tr>
              </thead>
              <tbody>
                {REVOCATION.map((r) => (
                  <tr key={r.rung} className="ev-entry">
                    <td className="px-4 py-3 text-[12.5px] font-semibold text-ink">{r.rung}</td>
                    <td className="px-4 py-3 text-[12.5px] leading-relaxed text-slate">{r.grants}</td>
                    <td className="px-4 py-3 text-[12.5px] font-medium leading-relaxed text-teal">{r.cutoff}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </section>

      {/* Sub-processors */}
      <section className="ev-section mb-5">
        <p className="ev-label mb-2">Sub-processors ({SUB_PROCESSORS.length})</p>
        <div className="ev-card">
          <p className="mb-3 text-[13px] leading-relaxed text-slate">
            The full set of third parties that process routed data. We name them all, and we update this list before
            adding another.
          </p>
          <ul className="m-0 flex list-none flex-col gap-2.5 p-0">
            {SUB_PROCESSORS.map((s) => (
              <li key={s.name} className="text-[13px] leading-relaxed text-slate">
                <span className="font-semibold text-ink">{s.name}</span> — {s.role}
              </li>
            ))}
          </ul>
        </div>
      </section>

      {/* Retention, deletion & export */}
      <section className="ev-section mb-5">
        <p className="ev-label mb-2">Data retention, deletion &amp; export</p>
        <div className="ev-card space-y-3">
          <p className="text-[13px] leading-relaxed text-slate">{RETENTION}</p>
          <p className="text-[13px] leading-relaxed text-slate">{DELETION_EXPORT}</p>
        </div>
      </section>

      {/* Security posture */}
      <section className="ev-section mb-5">
        <p className="ev-label mb-2">Security posture — architecture, not badges</p>
        <div className="ev-card space-y-4">
          {POSTURE.map((p) => (
            <div key={p.title}>
              <h3 className="text-[13.5px] font-semibold text-ink">{p.title}</h3>
              <p className="mt-0.5 text-[13px] leading-relaxed text-slate">{p.body}</p>
            </div>
          ))}
        </div>
      </section>

      {/* What Tideover does NOT claim — the honesty box */}
      <section className="ev-section mb-5">
        <p className="ev-label mb-2">What Tideover does not claim</p>
        <div className="ev-card ev-eta space-y-3">
          <p className="text-[13px] leading-relaxed text-ink">
            Tideover is a pilot-stage product and we will not dress it up. We do not hold SOC 2. We have not completed
            a third-party penetration test or security audit. We do not claim &ldquo;bank-level&rdquo; or
            &ldquo;military-grade&rdquo; encryption, and we do not claim to be &ldquo;GDPR compliant&rdquo; or to carry
            any certification.
          </p>
          <p className="text-[13px] leading-relaxed text-slate">
            What we can give you is everything on this page: what we store, what we drop, who processes it, and how you
            cut us off in one action. The safety here is structural — we hold as little as the job needs — rather than a
            badge we point at. That honesty is the credibility.
          </p>
        </div>
      </section>

      {/* For your technical reviewer */}
      <section className="ev-section mb-5">
        <p className="ev-label mb-2">For your technical reviewer</p>
        <div className="ev-card space-y-3">
          <p className="text-[13px] leading-relaxed text-slate">
            The reasoning behind every data-exposure and auth decision above is written down as Architecture Decision
            Records (<span className="font-mono text-[12px]">docs/adr/</span>) in the Tideover repository — each a short
            record of the &ldquo;why&rdquo; a reviewer can read without archaeology. We share the repository, or any
            specific record, with your technical reviewer on request. The most relevant to a data-handling review:
          </p>
          <ul className="m-0 flex list-none flex-col gap-2 p-0">
            {KEY_ADRS.map((a) => (
              <li key={a.id} className="text-[12.5px] leading-relaxed text-slate">
                <span className="font-mono text-[12px] font-semibold text-ink">{a.id}</span> — {a.what}.
              </li>
            ))}
          </ul>
        </div>
      </section>

      {/* Compliance context + contact */}
      <footer className="ev-section mt-7 border-t border-border pt-5">
        <p className="ev-label mb-2">Controller / processor, compliance context &amp; contact</p>
        <div className="space-y-3 text-[13px] leading-relaxed text-slate">
          <p>
            If you are a merchant using Tideover, you are the data controller for your customers&rsquo; personal data;
            Tideover is your processor and handles what you route to us on your instructions. If Tideover ever helps
            send email on your behalf, each message will identify the sender (your brand), carry a valid physical postal
            address, and honor opt-out requests promptly, consistent with the US CAN-SPAM Act — a standard your own
            counsel applies to your sending, not a certification Tideover holds.
          </p>
          <p>
            Questions, or a deletion or export request, go to{" "}
            <a className="font-semibold text-teal" href={`mailto:${CONTACT_EMAIL}`}>
              {CONTACT_EMAIL}
            </a>
            , and I&rsquo;ll answer them myself. Physical postal address: {POSTAL_ADDRESS}.
          </p>
          <p className="font-semibold text-ink">— Dylan</p>
        </div>
      </footer>
    </div>
  );
}
