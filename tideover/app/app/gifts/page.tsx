import { getQueue } from "@/lib/service";
import { getRepositories } from "@/lib/repositories";
import { recommendGift } from "@/lib/engines";
import { MerchantSwitcher } from "@/components/product/MerchantSwitcher";
import { Tag } from "@/components/ui/Badge";

export const dynamic = "force-dynamic";

const KIND_LABEL: Record<string, string> = {
  "early-access": "Early access",
  "founder-note": "Founder note",
  "priority-dispatch": "Priority dispatch",
  "digital-perk": "Digital perk",
  "next-order-credit": "Next-order credit",
};

const dollars = (cents: number) => `$${(cents / 100).toFixed(0)}`;

export default async function GiftsPage({
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

  const merchant = merchants.find((m) => m.id === merchantId)!;
  const [catalog, queue] = await Promise.all([
    repos.gifts.listByMerchant(merchantId),
    getQueue(merchantId),
  ]);

  const recommendations = queue
    .filter((r) => r.band !== "standard")
    .map((r) => ({
      row: r,
      result: recommendGift({
        customer: r.customer,
        order: r.order,
        daysInWait: r.daysInWait,
        riskScore: r.riskScore,
        highTierCents: merchant.ltvTiers.high,
        catalog,
      }),
    }))
    .filter((x) => x.result.gift !== null);

  return (
    <div className="flex flex-col gap-6 px-6 py-6">
      <header className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <p className="kicker">Gift engine</p>
          <h1 className="font-serif text-[34px] leading-tight text-ink">
            Goodwill catalog
          </h1>
          <p className="text-[13px] text-ink-mute">
            One-click goodwill, gated on lifetime value + wait + risk.
          </p>
        </div>
        <MerchantSwitcher
          merchants={merchants.map((m) => ({ id: m.id, name: m.name }))}
          current={merchantId}
        />
      </header>

      <section>
        <h2 className="mb-3 font-serif text-[20px] text-ink">Catalog</h2>
        {catalog.length === 0 ? (
          <div className="proof-placeholder">No gifts configured for this merchant.</div>
        ) : (
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {catalog.map((g) => (
              <div key={g.id} className="panel flex flex-col gap-2 p-4">
                <div className="flex items-center justify-between gap-2">
                  <h3 className="text-[15px] font-semibold text-ink">{g.name}</h3>
                  <Tag>{KIND_LABEL[g.kind] ?? g.kind}</Tag>
                </div>
                <div className="flex gap-4 text-[13px]">
                  <span className="text-slate">
                    Cost <span className="font-semibold text-ink">{dollars(g.costCents)}</span>
                  </span>
                  <span className="text-slate">
                    Perceived{" "}
                    <span className="font-semibold text-ink">
                      {dollars(g.perceivedValueCents)}
                    </span>
                  </span>
                </div>
                <div className="mt-1 border-t border-border pt-2 text-[12px] text-ink-mute">
                  Eligible at LTV ≥ {dollars(g.eligibility.minLtvCents)} · wait ≥{" "}
                  {g.eligibility.minWaitDays}d · risk ≥ {g.eligibility.minRiskScore}
                </div>
              </div>
            ))}
          </div>
        )}
      </section>

      <section>
        <h2 className="mb-3 font-serif text-[20px] text-ink">Current recommendations</h2>
        {recommendations.length === 0 ? (
          <div className="proof-placeholder">
            No at-risk customer currently warrants a gift.
          </div>
        ) : (
          <div className="panel overflow-hidden">
            <table className="w-full text-left text-[14px]">
              <thead>
                <tr className="border-b border-border text-[11px] uppercase tracking-wider text-ink-mute">
                  <th className="px-5 py-2.5 font-semibold">Customer</th>
                  <th className="px-5 py-2.5 text-right font-semibold">Risk</th>
                  <th className="px-5 py-2.5 font-semibold">Recommended gift</th>
                  <th className="px-5 py-2.5 text-right font-semibold">ROI</th>
                  <th className="px-5 py-2.5 font-semibold">Why</th>
                </tr>
              </thead>
              <tbody>
                {recommendations.map(({ row, result }) => (
                  <tr
                    key={row.ticket.id}
                    className="border-b border-border last:border-0 hover:bg-sand"
                  >
                    <td className="px-5 py-3 font-semibold text-ink">
                      {row.customer.firstName}
                    </td>
                    <td className="px-5 py-3 text-right tabular-nums text-slate">
                      {row.riskScore}
                    </td>
                    <td className="px-5 py-3 text-slate">{result.gift!.name}</td>
                    <td className="px-5 py-3 text-right tabular-nums text-slate">
                      {result.roi != null ? `${result.roi}×` : "—"}
                    </td>
                    <td className="max-w-[320px] px-5 py-3 text-[12px] text-ink-mute">
                      {result.reasoning}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </div>
  );
}
