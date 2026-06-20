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

function frtDelta(live: number | null, baseline: number) {
  if (live == null) return undefined;
  if (live === baseline) return { text: "flat vs baseline", tone: "flat" as const };
  const faster = live < baseline;
  const pct = Math.round((Math.abs(live - baseline) / Math.max(1, baseline)) * 100);
  return {
    text: `${faster ? "↓" : "↑"} ${pct}% vs baseline`,
    tone: (faster ? "up" : "down") as "up" | "down",
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

  const { baseline, live } = data;
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
          delta={frtDelta(live.medianFrtSec, baseline.medianFrtSec)}
          sublabel={`baseline ${formatFrt(baseline.medianFrtSec)}`}
        />
        <MetricTile
          proof
          label="WISMO / 100 orders"
          value={live.wismoPer100Orders}
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
