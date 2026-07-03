import { computeScriptPerformance, SCRIPT_PERF_MIN_N } from "@/lib/service";
import { getRepositories } from "@/lib/repositories";
import { MerchantSwitcher } from "@/components/product/MerchantSwitcher";
import { Tag } from "@/components/ui/Badge";
import type { DayStageKey, ProductionStageKey } from "@/lib/types";

/**
 * Script Performance (ADR-0007, task E3) — the "measured, not invented" surface.
 *
 * One row per script variant, showing only facts folded out of the reply_sent
 * outcome ledger: how many times each template was sent, and how much operators
 * edited the draft before sending. It INVENTS NOTHING.
 *
 * Proof-only discipline is the whole point of this page:
 *  - small-sample humility: below SCRIPT_PERF_MIN_N sends a variant reads
 *    "collecting data (n=X)" — never a rate the sample can't support;
 *  - no verdict: rows are ordered by slot (day-stage → production stage), never
 *    ranked by performance, and the word "winner" appears nowhere;
 *  - edit-rate is framed as one signal, not a judgement.
 *
 * Behind the F2 auth gate in live mode via middleware's /app/:path* matcher.
 */

export const dynamic = "force-dynamic";

const DAY_STAGE_ORDER: Record<DayStageKey, number> = {
  "day-7": 0,
  "day-30": 1,
  "day-60": 2,
  "day-89": 3,
};

const DAY_STAGE_LABEL: Record<DayStageKey, string> = {
  "day-7": "Day 7",
  "day-30": "Day 30",
  "day-60": "Day 60",
  "day-89": "Day 89",
};

const PROD_STAGE_ORDER: Record<ProductionStageKey, number> = {
  sourcing: 0,
  tooling: 1,
  production: 2,
  qc: 3,
  freight: 4,
  dispatch: 5,
};

const preview = (text: string): string =>
  text.length > 100 ? `${text.slice(0, 99).trimEnd()}…` : text;

function NBadge({ n }: { n: number }) {
  return (
    <span className="inline-flex items-center rounded-full border border-border bg-sand px-2 py-0.5 text-[11px] font-semibold tabular-nums text-slate">
      n={n}
    </span>
  );
}

/**
 * One measured-outcome cell with small-N humility baked in: when the rollup
 * gated the rate to null (its own sample is below SCRIPT_PERF_MIN_N) we show
 * "collecting data (n=X)" — never a rate the sample can't support. `count` is the
 * metric's OWN denominator (replies / sends / csat responses), not total sends.
 */
function OutcomeCell({
  rate,
  count,
  render,
}: {
  rate: number | null;
  count: number;
  render: (rate: number) => string;
}) {
  if (rate === null) {
    return <span className="text-[12px] text-ink-mute">collecting data (n={count})</span>;
  }
  return (
    <span className="text-[13px] text-ink">
      {render(rate)} <span className="text-ink-mute">· n={count}</span>
    </span>
  );
}

export default async function ScriptsPage({
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
  const rows = (await computeScriptPerformance(merchantId)).slice().sort((a, b) => {
    const av = a.variant;
    const bv = b.variant;
    return (
      DAY_STAGE_ORDER[av.stageKey] - DAY_STAGE_ORDER[bv.stageKey] ||
      // base copy (productionStage null) sorts before its stage overrides
      (av.productionStage === null ? -1 : PROD_STAGE_ORDER[av.productionStage]) -
        (bv.productionStage === null ? -1 : PROD_STAGE_ORDER[bv.productionStage]) ||
      av.id.localeCompare(bv.id)
    );
  });

  const totalSends = rows.reduce((sum, r) => sum + r.sends, 0);

  return (
    <div className="flex flex-col gap-6 px-6 py-6">
      {merchant.isDemo && (
        <div className="ev-watermark" aria-hidden="true">
          <span>SAMPLE DATA</span>
        </div>
      )}

      <header className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <p className="kicker">Outcome ledger</p>
          <h1 className="font-serif text-[34px] leading-tight text-ink">
            Script performance
          </h1>
          <p className="text-[13px] text-ink-mute">
            Measured, not invented — {totalSends} sent {totalSends === 1 ? "reply" : "replies"}{" "}
            attributed across {rows.length} script {rows.length === 1 ? "variant" : "variants"}. Every
            number here is folded from the reply ledger; nothing is projected.
          </p>
        </div>
        <MerchantSwitcher
          merchants={merchants.map((m) => ({ id: m.id, name: m.name }))}
          current={merchantId}
        />
      </header>

      <p className="rounded-xl border border-dashed border-border bg-sand px-4 py-3 text-[12px] leading-relaxed text-ink-mute">
        Every column is a measured event count or ratio — one signal each, never a verdict. A rate only
        appears once that column has at least {SCRIPT_PERF_MIN_N} of its own data points; below that we
        show the raw count and keep collecting. Edit rate = how much operators changed the draft before
        sending. Customer reply = the share of inbound replies that came back calm. Reopen = replies
        followed by the customer coming back. CSAT = the customer&rsquo;s own 👍 on the status page. Quiet
        resolution = sends that got no reply and no reopen for seven days — the wait settled (the mirror of
        reopen).
      </p>

      {rows.length === 0 ? (
        <div className="proof-placeholder">No script variants seeded for this merchant.</div>
      ) : (
        <div className="panel overflow-x-auto">
          <table className="w-full min-w-[1080px] text-left text-[14px]">
            <thead>
              <tr className="border-b border-border text-[11px] uppercase tracking-wider text-ink-mute">
                <th className="px-5 py-2.5 font-semibold">Slot &amp; script</th>
                <th className="px-5 py-2.5 text-right font-semibold">Sends</th>
                <th className="px-5 py-2.5 font-semibold">Edit rate</th>
                <th className="px-5 py-2.5 font-semibold">Customer reply (calm)</th>
                <th className="px-5 py-2.5 font-semibold">Reopen rate</th>
                <th className="px-5 py-2.5 font-semibold">CSAT</th>
                <th className="px-5 py-2.5 font-semibold">Quiet resolution</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((row) => {
                const { variant } = row;
                const slot = `${DAY_STAGE_LABEL[variant.stageKey]} · ${
                  variant.productionStage ?? "base"
                }`;
                return (
                  <tr key={variant.id} className="border-b border-border last:border-0 align-top">
                    <td className="max-w-[420px] px-5 py-3.5">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="text-[13px] font-semibold text-ink">{slot}</span>
                        {variant.isDefault ? <Tag>default</Tag> : null}
                      </div>
                      <p className="mt-1 text-[12.5px] leading-relaxed text-ink-mute">
                        {preview(variant.text)}
                      </p>
                    </td>
                    <td className="px-5 py-3.5 text-right">
                      <NBadge n={row.sends} />
                    </td>
                    <td className="px-5 py-3.5">
                      {row.n < SCRIPT_PERF_MIN_N || row.avgEditedRatio === null ? (
                        <span className="text-[12px] text-ink-mute">
                          collecting data (n={row.n})
                        </span>
                      ) : (
                        <span className="text-[13px] text-ink">
                          avg edit {Math.round(row.avgEditedRatio * 100)}%{" "}
                          <span className="text-ink-mute">· n={row.n}</span>
                        </span>
                      )}
                    </td>
                    <td className="px-5 py-3.5">
                      <OutcomeCell
                        rate={row.calmResponseRate}
                        count={row.customerReplies}
                        render={(r) => `${Math.round(r * 100)}% calm`}
                      />
                    </td>
                    <td className="px-5 py-3.5">
                      <OutcomeCell
                        rate={row.reopenRate}
                        count={row.sends}
                        render={(r) => `${Math.round(r * 100)}% reopened`}
                      />
                    </td>
                    <td className="px-5 py-3.5">
                      <OutcomeCell
                        rate={row.csatRate}
                        count={row.csatResponses}
                        render={(r) => `${Math.round(r * 100)}% 👍`}
                      />
                    </td>
                    <td className="px-5 py-3.5">
                      <OutcomeCell
                        rate={row.quietResolutionRate}
                        count={row.sends}
                        render={(r) => `${Math.round(r * 100)}% settled`}
                      />
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      <p className="rounded-xl border border-dashed border-border bg-sand px-4 py-3 text-[12px] leading-relaxed text-ink-mute">
        These columns fold live from the outcome ledger — a customer reply within the attribution window,
        a reopened ticket, a 👍/👎 tap on the status page, and a daily sweep that marks a send settled when
        seven quiet days pass with no reply. On the seeded demo the samples are deliberately
        small, so most read &ldquo;collecting data&rdquo; rather than a rate: small samples are noise, and we
        would rather show the honest count than a number the data can&rsquo;t back yet.
      </p>
    </div>
  );
}
