import type { Metadata } from "next";
import { assembleEvidencePack } from "@/lib/evidence";
import type { CommLogEntry } from "@/lib/evidence";
import type { CustomerGroup } from "@/lib/types";
import { PrintButton } from "./PrintButton";

/**
 * Dispute Evidence Pack — operator-side, per-order print view (M2).
 *
 * Renders exactly the fields Shopify's dispute-response form asks a merchant to
 * provide, assembled by lib/evidence.ts from data that already exists after M1.
 * This is the merchant's OWN dispute evidence, so the customer email is allowed
 * here (unlike the public /status page). Framed as "the fields Shopify asks for",
 * never "win your dispute" — no outcome is claimed anywhere.
 *
 * Behind the F2 auth gate in live mode via middleware's /app/:path* matcher.
 */

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Dispute evidence pack",
  robots: { index: false, follow: false },
};

const fmtDateTime = (iso: string): string =>
  `${new Intl.DateTimeFormat("en-US", { dateStyle: "medium", timeStyle: "short", timeZone: "UTC" }).format(
    new Date(iso),
  )} UTC`;

const fmtDate = (iso: string): string =>
  new Intl.DateTimeFormat("en-US", { dateStyle: "medium", timeZone: "UTC" }).format(new Date(iso));

const dollars = (cents: number): string => `$${(cents / 100).toFixed(2)}`;

const GROUP_LABEL: Record<CustomerGroup, string> = {
  "ks-backer": "Kickstarter backer",
  "late-pledge": "Late pledge",
  "new-preorder": "New preorder",
};

const ETA_SOURCE_LABEL: Record<"campaign-page" | "checkout" | "update", string> = {
  "campaign-page": "campaign page",
  checkout: "checkout",
  update: "campaign update",
};

const KIND_LABEL: Record<CommLogEntry["kind"], string> = {
  inbound: "Inbound",
  "outbound-sent": "Outbound",
};

function NotFound() {
  return (
    <div className="flex min-h-screen items-center justify-center px-6">
      <div className="panel max-w-[460px] p-8 text-center">
        <p className="kicker">Evidence pack</p>
        <h1 className="mb-3 font-serif text-[26px] text-ink">Order not found</h1>
        <p className="text-[14px] leading-relaxed text-slate">
          No order matches that id. Check the order id and try again — the link is
          <code className="mx-1 rounded bg-sand px-1.5 py-0.5 text-[13px]">/app/orders/&lt;orderId&gt;/evidence</code>.
        </p>
      </div>
    </div>
  );
}

export default async function EvidencePackPage({ params }: { params: { orderId: string } }) {
  const pack = await assembleEvidencePack(params.orderId);
  if (!pack) return <NotFound />;

  const { order, customer, disclosedEta, disputeWindow, commLog, statusViews } = pack;

  return (
    <div className="evpack">
      {pack.isDemo && (
        <div className="ev-watermark" aria-hidden="true">
          <span>SAMPLE DATA</span>
        </div>
      )}

      {/* Toolbar — never printed */}
      <div className="no-print mb-6 flex flex-wrap items-center justify-between gap-3">
        <p className="text-[12px] text-ink-mute">
          Operator view · assembled {fmtDateTime(pack.generatedAt)}
        </p>
        <PrintButton />
      </div>

      {/* Document header */}
      <header className="ev-section mb-6">
        <p className="kicker">Dispute evidence pack</p>
        <h1 className="ev-doc-title mt-1 text-ink">{pack.merchant.name}</h1>
        <p className="mt-3 max-w-[62ch] text-[13.5px] leading-relaxed text-slate">
          This document compiles, for a single order, the fields Shopify&rsquo;s dispute-response form
          asks a merchant to provide: the delivery estimate the buyer was given at purchase, the full
          record of communication with them, and when they opened their order-status page. Every field
          is a record of information already held for this order. It is not legal advice and makes no
          claim about the outcome of any dispute.
        </p>
      </header>

      {/* Order identity */}
      <section className="ev-section mb-5">
        <p className="ev-label mb-2">Order</p>
        <div className="ev-card">
          <dl className="grid grid-cols-1 gap-x-8 gap-y-3 sm:grid-cols-2">
            <Field label="Order id" value={order.id} mono />
            <Field label="Order value" value={dollars(order.valueCents)} />
            <Field label="Customer" value={customer.firstName} />
            <Field label="Customer email" value={customer.email} mono />
            <Field label="Placed on" value={fmtDateTime(order.createdAt)} />
            <Field label="Backer group" value={GROUP_LABEL[order.group]} />
            {order.campaignName && <Field label="Campaign" value={order.campaignName} />}
            {order.wave && <Field label="Fulfillment wave" value={order.wave} />}
            <Field label="Region" value={order.region} />
            <Field label="Production stage" value={order.productionStage} />
          </dl>
        </div>
      </section>

      {/* Disclosed ETA — the centerpiece */}
      <section className="ev-section mb-5">
        <p className="ev-label mb-2">Delivery estimate disclosed at purchase</p>
        <div className="ev-card ev-eta">
          {disclosedEta ? (
            <>
              <p className="text-[15px] leading-relaxed text-ink">
                The customer was told delivery would be{" "}
                <strong className="text-teal">&ldquo;{disclosedEta.value}&rdquo;</strong>, disclosed on
                the {ETA_SOURCE_LABEL[disclosedEta.source]} on{" "}
                <strong>{fmtDateTime(disclosedEta.disclosedAt)}</strong>.
              </p>
              <p className="ev-meta mt-3">
                This is the disclosed estimate the buyer agreed to at purchase — a delivery band, not a
                fixed date. Under Visa reason code 13.1 the dispute clock runs from the expected-delivery
                date this band implies, not from the sale.
              </p>
            </>
          ) : (
            <p className="text-[14px] text-slate">No delivery estimate was recorded for this order.</p>
          )}
        </div>
      </section>

      {/* Communication log */}
      <section className="ev-section mb-5">
        <p className="ev-label mb-2">Communication log ({commLog.length})</p>
        <div className="ev-card p-0">
          {commLog.length === 0 ? (
            <p className="p-5 text-[14px] text-slate">No communication is on file for this order.</p>
          ) : (
            commLog.map((e, i) => (
              <div key={`${e.ticketId}-${i}`} className="ev-entry px-5 py-4">
                <div className="flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1">
                  <span className="text-[13px] font-semibold text-ink">
                    {KIND_LABEL[e.kind]} · {e.actor}
                  </span>
                  <span className="ev-meta tabular-nums">{fmtDateTime(e.at)}</span>
                </div>
                <div className="ev-meta mt-0.5">
                  {e.statusLabel} · {e.channel}
                  {e.subject ? ` · “${e.subject}”` : ""}
                </div>
                <p className="mt-2 whitespace-pre-wrap text-[13.5px] leading-relaxed text-slate">{e.text}</p>
              </div>
            ))
          )}
        </div>
      </section>

      {/* Status-page view log */}
      <section className="ev-section mb-5">
        <p className="ev-label mb-2">Status-page view log ({statusViews.length})</p>
        <div className="ev-card p-0">
          {statusViews.length === 0 ? (
            <p className="p-5 text-[14px] text-slate">
              No status-page views are logged for this order.
            </p>
          ) : (
            statusViews.map((v) => (
              <div key={v.id} className="ev-entry flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1 px-5 py-3">
                <span className="text-[13.5px] text-ink tabular-nums">
                  Customer opened their status page on <strong>{fmtDateTime(v.viewedAt)}</strong>
                </span>
                <span className="ev-meta">
                  {v.ipPrefix ? `IP ${v.ipPrefix}.x.x` : "IP not recorded"}
                  {v.userAgent ? ` · ${shortUa(v.userAgent)}` : ""}
                </span>
              </div>
            ))
          )}
        </div>
      </section>

      {/* Dispute-window orientation footer */}
      {disclosedEta && disputeWindow && (
        <footer className="ev-section mt-7 border-t border-border pt-5">
          <p className="ev-label mb-2">Dispute-window orientation — estimate</p>
          {disputeWindow.band && disputeWindow.expectedDeliveryEstimate ? (
            <div className="space-y-1.5 text-[13px] leading-relaxed text-slate">
              <p>
                Estimated expected delivery (upper bound of the disclosed band):{" "}
                <strong className="text-ink">~{fmtDate(disputeWindow.expectedDeliveryEstimate)}</strong>.
              </p>
              <p>
                Visa reason code 13.1 window (~120 days from expected delivery): opens on or around{" "}
                <strong className="text-ink">{fmtDate(disputeWindow.windowOpensEstimate!)}</strong> (after
                the mandatory 15-day issuer wait) and runs to about{" "}
                <strong className="text-ink">{fmtDate(disputeWindow.windowClosesEstimate!)}</strong>.
              </p>
              <p>
                Outer cap — 540 days from the transaction:{" "}
                <strong className="text-ink">~{fmtDate(disputeWindow.hardCap540Estimate)}</strong>. Effective
                end (the earlier of the two):{" "}
                <strong className="text-ink">~{fmtDate(disputeWindow.effectiveCloseEstimate!)}</strong>.
              </p>
              <p className="pt-1">
                As of {fmtDate(pack.generatedAt)}, this window{" "}
                <strong className={disputeWindow.isOpen ? "text-terracotta-600" : "text-ink-mute"}>
                  {disputeWindow.isOpen ? "appears OPEN" : "appears CLOSED"}
                </strong>{" "}
                {disputeWindow.daysToClose !== null &&
                  (disputeWindow.isOpen
                    ? `(estimated ~${disputeWindow.daysToClose} days remaining)`
                    : `(estimated ~${Math.abs(disputeWindow.daysToClose)} days past)`)}
                .
              </p>
            </div>
          ) : (
            <p className="text-[13px] leading-relaxed text-slate">
              The disclosed estimate carries no numeric band, so the 13.1 window can&rsquo;t be oriented
              automatically. Outer cap — 540 days from the transaction:{" "}
              <strong className="text-ink">~{fmtDate(disputeWindow.hardCap540Estimate)}</strong>.
            </p>
          )}
          <p className="ev-meta mt-3 max-w-[70ch]">
            These dates are estimates for orientation only, derived from the disclosed delivery band — not
            legal advice and not a prediction of any dispute outcome. Reason code 13.1 is Visa&rsquo;s
            &ldquo;merchandise/services not received&rdquo; dispute (equivalents: Mastercard 4855, Amex
            C08, Discover 4755); its ~120-day clock runs from the expected-delivery date, capped at 540
            days from the transaction.
          </p>
        </footer>
      )}
    </div>
  );
}

function shortUa(ua: string): string {
  if (/iPhone|Android|Mobile/i.test(ua)) return "mobile browser";
  if (/Macintosh|Mac OS/i.test(ua)) return "desktop (macOS)";
  if (/Windows/i.test(ua)) return "desktop (Windows)";
  return "browser";
}

function Field({ label, value, mono }: { label: string; value: string; mono?: boolean }) {
  return (
    <div>
      <dt className="ev-label">{label}</dt>
      <dd className={`mt-0.5 text-[14px] text-ink ${mono ? "font-mono text-[13px]" : ""}`}>{value}</dd>
    </div>
  );
}
