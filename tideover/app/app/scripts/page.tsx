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
        Edit rate = how much operators changed the draft before sending; lower means the script landed
        closer to what got sent. It is one signal, not a verdict — and it only appears once a variant has
        at least {SCRIPT_PERF_MIN_N} sends. Below that we show the raw count and keep collecting.
      </p>

      {rows.length === 0 ? (
        <div className="proof-placeholder">No script variants seeded for this merchant.</div>
      ) : (
        <div className="panel overflow-x-auto">
          <table className="w-full min-w-[640px] text-left text-[14px]">
            <thead>
              <tr className="border-b border-border text-[11px] uppercase tracking-wider text-ink-mute">
                <th className="px-5 py-2.5 font-semibold">Slot &amp; script</th>
                <th className="px-5 py-2.5 text-right font-semibold">Sends</th>
                <th className="px-5 py-2.5 font-semibold">Edit rate (measured)</th>
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
                    <td className="max-w-[460px] px-5 py-3.5">
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
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      <p className="rounded-xl border border-dashed border-border bg-sand px-4 py-3 text-[12px] leading-relaxed text-ink-mute">
        Richer outcome columns — customer reply, reopen, CSAT — populate once the pilot is live. Those
        events are defined in the ledger but not emitted in Phase 0, so they are honestly absent here
        rather than filled with placeholder numbers.
      </p>
    </div>
  );
}
