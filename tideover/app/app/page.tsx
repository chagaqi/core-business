import Link from "next/link";
import { getDashboard } from "@/lib/service";
import { getRepositories } from "@/lib/repositories";
import { MerchantSwitcher } from "@/components/product/MerchantSwitcher";
import { MetricTile } from "@/components/product/MetricTile";
import { RiskCurve } from "@/components/product/RiskCurve";
import { RiskBadge, Tag } from "@/components/ui/Badge";
import type { RiskColor } from "@/lib/types";

export const dynamic = "force-dynamic";

function formatFrt(sec: number | null): string {
  if (sec == null) return "—";
  if (sec < 60) return `${sec}s`;
  const m = Math.round(sec / 60);
  if (m < 60) return `${m}m`;
  const h = Math.floor(m / 60);
  return `${h}h ${m % 60}m`;
}

const GROUP_LABEL: Record<string, string> = {
  "ks-backer": "KS backer",
  "late-pledge": "Late pledge",
  "new-preorder": "New preorder",
};

/** whole-dollar money with thousands separators, e.g. 3512900 → "$35,129". */
const dollars = (cents: number): string => `$${Math.round(cents / 100).toLocaleString("en-US")}`;

/** Delta vs baseline for metrics where LOWER is better (FRT, WISMO). */
function lowerIsBetterDelta(live: number | null, baseline: number) {
  if (live == null || baseline === 0) return undefined;
  if (live === baseline) return { text: "flat vs baseline", tone: "flat" as const };
  const better = live < baseline;
  const pct = Math.round((Math.abs(live - baseline) / Math.max(1, baseline)) * 100);
  return {
    text: `${better ? "↓" : "↑"} ${pct}% vs baseline`,
    tone: (better ? "up" : "down") as "up" | "down",
  };
}

export default async function DashboardPage({
  searchParams,
}: {
  searchParams: { merchant?: string };
}) {
  const repos = getRepositories();
  const merchants = await repos.merchants.list();
  if (merchants.length === 0) {
    return <div className="p-8 text-ink-mute">No merchants seeded.</div>;
  }
  const merchantId =
    searchParams.merchant && merchants.some((m) => m.id === searchParams.merchant)
      ? searchParams.merchant
      : merchants[0].id;

  const data = await getDashboard(merchantId);
  if (!data) {
    return <div className="p-8 text-ink-mute">No dashboard data for this merchant.</div>;
  }

  const { baseline, live, disputeExposure: exp } = data;
  const baselineDate = new Date(baseline.capturedOn).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });

  return (
    <div className="flex flex-col gap-6 px-6 py-6">
      <header className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <p className="kicker">Refund-risk dashboard</p>
          <h1 className="font-serif text-[34px] leading-tight text-ink">
            {data.merchant.name}
          </h1>
          <p className="text-[13px] text-ink-mute">
            {data.ordersInWindow} orders in the fulfillment window ·{" "}
            {data.atRisk.length} flagged at-risk
          </p>
        </div>
        <MerchantSwitcher
          merchants={merchants.map((m) => ({ id: m.id, name: m.name }))}
          current={merchantId}
        />
      </header>

      <section className="grid grid-cols-2 gap-3 lg:grid-cols-5">
        <MetricTile
          proof
          label="Median first response"
          value={formatFrt(live.medianFrtSec)}
          delta={lowerIsBetterDelta(live.medianFrtSec, baseline.medianFrtSec)}
          sublabel={`baseline ${formatFrt(baseline.medianFrtSec)}`}
        />
        <MetricTile
          proof
          label="WISMO / 100 orders"
          value={live.wismoPer100Orders}
          delta={lowerIsBetterDelta(live.wismoPer100Orders, baseline.wismoPer100Orders)}
          sublabel={`baseline ${baseline.wismoPer100Orders}`}
        />
        <MetricTile
          proof
          label="Saves logged"
          value={live.savesCount}
          sublabel="dispute-risk replies + gifts"
        />
        <MetricTile
          proof
          label="Deflection"
          value={live.deflectionPct != null ? `${live.deflectionPct}%` : "—"}
          sublabel="tickets resolved"
        />
        <MetricTile
          proof
          label="Orders in window"
          value={data.ordersInWindow}
          sublabel={`${live.sentCount} replies sent`}
        />
      </section>

      <section className="panel p-5">
        <div className="mb-4 flex flex-wrap items-center justify-between gap-2">
          <div>
            <h2 className="font-serif text-[20px] text-ink">GMV in open dispute window</h2>
            <p className="text-[12px] text-ink-mute">
              Your own order value currently exposed to a chargeback dispute, by rail.
            </p>
          </div>
          <span className="rounded-full border border-border bg-sand px-2.5 py-0.5 text-[11px] font-semibold uppercase tracking-wider text-ink-mute">
            Estimate · Visa 13.1 orientation
          </span>
        </div>

        {exp.orderCount === 0 ? (
          <p className="mb-3 rounded-xl border border-dashed border-border bg-sand px-4 py-2.5 text-[12px] leading-relaxed text-ink-mute">
            No orders are in the open dispute window right now — an order enters it about 15 days
            after its disclosed delivery estimate. This is a live snapshot; the figure rises as more
            orders cross that mark
            {exp.unknownCount > 0
              ? ` (${exp.unknownCount} ${exp.unknownCount === 1 ? "order is" : "orders are"} not counted — no disclosed ETA)`
              : ""}
            .
          </p>
        ) : null}

        <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
          <div className="flex flex-col gap-1 rounded-xl border border-border bg-sand p-4">
            <span className="text-[11px] font-semibold uppercase tracking-wider text-ink-mute">
              Money at risk
            </span>
            <span className="font-serif text-[30px] leading-none text-ink">
              {dollars(exp.totalCents)}
            </span>
            <span className="text-[12px] text-ink-mute">
              {exp.orderCount} {exp.orderCount === 1 ? "order" : "orders"} currently in the window
            </span>
          </div>
          <div className="flex flex-col gap-1 rounded-xl border border-border p-4">
            <span className="text-[11px] font-semibold uppercase tracking-wider text-ink-mute">
              Shopify (card)
            </span>
            <span className="font-serif text-[30px] leading-none text-ink">
              {dollars(exp.shopifyCents)}
            </span>
            <span className="text-[12px] text-ink-mute">
              {exp.shopifyCount} {exp.shopifyCount === 1 ? "order" : "orders"} · Visa 13.1 chargeback path
            </span>
          </div>
          <div className="flex flex-col gap-1 rounded-xl border border-border p-4">
            <span className="text-[11px] font-semibold uppercase tracking-wider text-ink-mute">
              Kickstarter (pledge)
            </span>
            <span className="font-serif text-[30px] leading-none text-ink">
              {dollars(exp.kickstarterCents)}
            </span>
            <span className="text-[12px] text-ink-mute">
              {exp.kickstarterCount} {exp.kickstarterCount === 1 ? "pledge" : "pledges"} · platform / backer relations
            </span>
          </div>
        </div>

        <p className="mt-4 rounded-xl border border-dashed border-border bg-sand px-4 py-3 text-[12px] leading-relaxed text-ink-mute">
          Estimate for orientation, not a guarantee: {data.merchant.name}&rsquo;s own summed order value
          whose Visa reason-code 13.1 window is currently open — past the roughly 15-day issuer wait (so a
          dispute is filable) and before the window closes (~120 days from expected delivery, capped at 540
          days from the sale). The rails carry different remedies: Shopify card orders run through a Visa 13.1
          chargeback path; Kickstarter pledges are handled through the platform and backer relations, not a
          card chargeback — so they are shown apart, never summed into one figure.
          {exp.unknownCount > 0
            ? ` ${exp.unknownCount} ${
                exp.unknownCount === 1 ? "order has" : "orders have"
              } no disclosed ETA and ${exp.unknownCount === 1 ? "is" : "are"} not counted.`
            : ""}
        </p>
      </section>

      <section className="panel p-5">
        <div className="mb-3 flex items-center justify-between">
          <h2 className="font-serif text-[20px] text-ink">Refund-risk curve</h2>
          <span className="text-[12px] text-ink-mute">Live (this period)</span>
        </div>
        <RiskCurve curve={data.riskCurve} />
      </section>

      <section className="panel overflow-hidden">
        <div className="flex items-center justify-between border-b border-border px-5 py-3.5">
          <h2 className="font-serif text-[20px] text-ink">At-risk queue</h2>
          <Link
            href={`/app/inbox?merchant=${merchantId}`}
            className="link-quiet text-[13px]"
          >
            Open cockpit
          </Link>
        </div>
        {data.atRisk.length === 0 ? (
          <div className="proof-placeholder m-5">No at-risk customers right now.</div>
        ) : (
          <table className="w-full text-left text-[14px]">
            <thead>
              <tr className="border-b border-border text-[11px] uppercase tracking-wider text-ink-mute">
                <th className="px-5 py-2.5 font-semibold">Customer</th>
                <th className="px-5 py-2.5 font-semibold">Group</th>
                <th className="px-5 py-2.5 font-semibold">Waiting</th>
                <th className="px-5 py-2.5 font-semibold">Subject</th>
                <th className="px-5 py-2.5 text-right font-semibold">Risk</th>
              </tr>
            </thead>
            <tbody>
              {data.atRisk.map((r) => (
                <tr
                  key={r.ticket.id}
                  className="border-b border-border last:border-0 hover:bg-sand"
                >
                  <td className="px-5 py-3">
                    <Link
                      href={`/app/inbox?merchant=${merchantId}&ticket=${r.ticket.id}`}
                      className="font-semibold text-teal no-underline"
                    >
                      {r.customer.firstName}
                    </Link>
                  </td>
                  <td className="px-5 py-3">
                    <Tag>{GROUP_LABEL[r.order.group] ?? r.order.group}</Tag>
                  </td>
                  <td className="px-5 py-3 text-slate">{r.daysInWait}d</td>
                  <td className="max-w-[280px] truncate px-5 py-3 text-slate">
                    {r.ticket.subject}
                  </td>
                  <td className="px-5 py-3 text-right">
                    <RiskBadge color={r.color as RiskColor}>{r.riskScore}</RiskBadge>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </section>

      <p className="rounded-xl border border-dashed border-border bg-sand px-4 py-3 text-[12px] text-ink-mute">
        Proof-only: every number above is measured against {data.merchant.name}&rsquo;s own
        baseline, captured {baselineDate}. Deltas compare the live period to that baseline —
        no refund-reduction figure is invented.
      </p>
    </div>
  );
}
