import Link from "next/link";
import { getQueue } from "@/lib/service";
import { getRepositories } from "@/lib/repositories";
import { MerchantSwitcher } from "@/components/product/MerchantSwitcher";
import { RiskBadge } from "@/components/ui/Badge";
import type { RiskColor, Sentiment } from "@/lib/types";

export const dynamic = "force-dynamic";

const SENTIMENT_LABEL: Record<Sentiment, string> = {
  calm: "Calm",
  anxious: "Anxious",
  hostile: "Hostile",
  "chargeback-threat": "Chargeback threat",
};

const dollars = (cents: number) => `$${(cents / 100).toFixed(0)}`;

export default async function CustomersPage({
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

  const [customers, queue] = await Promise.all([
    repos.customers.listByMerchant(merchantId),
    getQueue(merchantId),
  ]);

  // highest live risk + a linkable open ticket, keyed by customer.
  const riskByCustomer = new Map<
    string,
    { score: number; color: RiskColor; ticketId: string }
  >();
  for (const r of queue) {
    const prev = riskByCustomer.get(r.customer.id);
    if (!prev || r.riskScore > prev.score) {
      riskByCustomer.set(r.customer.id, {
        score: r.riskScore,
        color: r.color as RiskColor,
        ticketId: r.ticket.id,
      });
    }
  }

  const rows = customers
    .map((c) => ({ customer: c, risk: riskByCustomer.get(c.id) ?? null }))
    .sort((a, b) => (b.risk?.score ?? -1) - (a.risk?.score ?? -1));

  return (
    <div className="flex flex-col gap-6 px-6 py-6">
      <header className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <p className="kicker">Customers</p>
          <h1 className="font-serif text-[34px] leading-tight text-ink">
            {customers.length} on file
          </h1>
          <p className="text-[13px] text-ink-mute">Sorted by live refund-risk.</p>
        </div>
        <MerchantSwitcher
          merchants={merchants.map((m) => ({ id: m.id, name: m.name }))}
          current={merchantId}
        />
      </header>

      <section className="panel overflow-hidden">
        <table className="w-full text-left text-[14px]">
          <thead>
            <tr className="border-b border-border text-[11px] uppercase tracking-wider text-ink-mute">
              <th className="px-5 py-2.5 font-semibold">Customer</th>
              <th className="px-5 py-2.5 font-semibold">Email</th>
              <th className="px-5 py-2.5 text-right font-semibold">LTV</th>
              <th className="px-5 py-2.5 text-right font-semibold">Tickets</th>
              <th className="px-5 py-2.5 font-semibold">Last sentiment</th>
              <th className="px-5 py-2.5 text-right font-semibold">Risk</th>
            </tr>
          </thead>
          <tbody>
            {rows.map(({ customer, risk }) => (
              <tr
                key={customer.id}
                className="border-b border-border last:border-0 hover:bg-sand"
              >
                <td className="px-5 py-3">
                  {risk ? (
                    <Link
                      href={`/app/inbox?merchant=${merchantId}&ticket=${risk.ticketId}`}
                      className="font-semibold text-teal no-underline"
                    >
                      {customer.firstName}
                    </Link>
                  ) : (
                    <span className="font-semibold text-ink">{customer.firstName}</span>
                  )}
                </td>
                <td className="px-5 py-3 text-slate">{customer.email}</td>
                <td className="px-5 py-3 text-right tabular-nums text-slate">
                  {dollars(customer.ltvCents)}
                </td>
                <td className="px-5 py-3 text-right tabular-nums text-slate">
                  {customer.ticketCount}
                </td>
                <td className="px-5 py-3 text-slate">
                  {SENTIMENT_LABEL[customer.lastSentiment]}
                </td>
                <td className="px-5 py-3 text-right">
                  {risk ? (
                    <RiskBadge color={risk.color}>{risk.score}</RiskBadge>
                  ) : (
                    <span className="text-[12px] text-ink-mute">no open ticket</span>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </section>
    </div>
  );
}
