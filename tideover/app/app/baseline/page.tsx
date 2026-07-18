import type { Metadata } from "next";
import { getRepositories } from "@/lib/repositories";
import { formatBaseline } from "@/lib/baseline";
import { MerchantSwitcher } from "@/components/product/MerchantSwitcher";
import { NoMerchantState } from "@/components/product/NoMerchantState";
import { PrintButton } from "./PrintButton";

/**
 * Day-0 Baseline Report (M4) — the cold-outreach proof-of-method artifact.
 *
 * A print-first, branded one-pager showing a merchant's OWN support baseline as
 * captured before Tideover touched anything. It is the honest before-picture:
 * the starting point against which every later result is reported as a change.
 *
 * PROOF-ONLY (critical): every number here is the merchant's own pre-Tideover
 * measurement. There is NO projected improvement, NO "we'll cut this by X%", NO
 * fabricated outcome, and NO hard date anywhere. Claiming a result would destroy
 * the whole value of the artifact, which is that it is measured, not promised.
 *
 * Behind the F2 auth gate in live mode via middleware's /app/:path* matcher.
 * Respects ?merchant= like the other /app surfaces. Reuses the .evpack print
 * isolation + SAMPLE DATA watermark pattern from M2.
 */

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Day-0 support baseline",
  robots: { index: false, follow: false },
};

export default async function BaselinePage({
  searchParams,
}: {
  searchParams: { merchant?: string };
}) {
  const repos = getRepositories();
  const merchants = await repos.merchants.list();
  if (merchants.length === 0) {
    return <NoMerchantState />;
  }
  const merchantId =
    searchParams.merchant && merchants.some((m) => m.id === searchParams.merchant)
      ? searchParams.merchant
      : merchants[0].id;
  const merchant = merchants.find((m) => m.id === merchantId)!;
  const baseline = formatBaseline(merchant);

  return (
    <div className="evpack">
      {baseline.isDemo && (
        <div className="ev-watermark" aria-hidden="true">
          <span>SAMPLE DATA</span>
        </div>
      )}

      {/* Toolbar — never printed */}
      <div className="no-print mb-6 flex flex-wrap items-center justify-between gap-3">
        <p className="text-[12px] text-ink-mute">Operator view · day-0 baseline report</p>
        <div className="flex items-center gap-3">
          <MerchantSwitcher
            merchants={merchants.map((m) => ({ id: m.id, name: m.name }))}
            current={merchantId}
          />
          <PrintButton />
        </div>
      </div>

      {/* Document header */}
      <header className="ev-section mb-6">
        <p className="kicker">Day-0 support baseline</p>
        <h1 className="ev-doc-title mt-1 text-ink">
          {baseline.merchantName} — support baseline, captured{" "}
          <time dateTime={baseline.capturedOnIso}>{baseline.capturedOn}</time>
        </h1>
        <p className="mt-3 max-w-[64ch] text-[13.5px] leading-relaxed text-slate">
          This is the day-0 starting point: {baseline.merchantName}&rsquo;s own support numbers,
          measured before Tideover changed anything. It claims no result — it only records where
          things stood at onboarding. From here on, every result is reported as a change against
          these exact numbers, so any change is always measured against your baseline, never
          against a guess.
        </p>
      </header>

      {/* The four baseline metrics */}
      <section className="ev-section mb-5">
        <p className="ev-label mb-3">
          {baseline.measured ? "The baseline — four measured numbers" : "The baseline — not captured yet"}
        </p>
        <div className="bl-grid">
          {baseline.metrics.map((m) => (
            <div key={m.key} className="bl-stat">
              <p className="ev-label">{m.label}</p>
              <p className="bl-stat-value mt-1.5">{m.value}</p>
              <p className="mt-2 text-[12.5px] leading-relaxed text-slate">{m.gloss}</p>
            </div>
          ))}
        </div>
      </section>

      {/* How this was captured */}
      <section className="ev-section mb-5">
        <p className="ev-label mb-2">How this was captured</p>
        <div className="ev-card bl-hero">
          {baseline.measured ? (
            <>
              <p className="text-[13.5px] leading-relaxed text-ink">
                These numbers were measured from {baseline.merchantName}&rsquo;s own helpdesk export at
                onboarding — or, where no export was available, from a seven-day silent-measurement
                window that watched real ticket flow without altering it. They are measured facts, not
                self-reported guesses or round-number estimates.
              </p>
              <p className="ev-meta mt-3 max-w-[70ch]">
                A baseline is only useful if it is real. Nothing here is projected, and no future
                outcome is claimed — this is the before-picture on its own terms. Later reports show
                the current value of each number next to its baseline, so any change is visible and
                attributable.
              </p>
            </>
          ) : (
            <>
              <p className="text-[13.5px] leading-relaxed text-ink">
                {baseline.merchantName}&rsquo;s baseline hasn&rsquo;t been captured yet. Connect a
                helpdesk export at onboarding, or run a seven-day silent-measurement window, and these
                four numbers fill in.
              </p>
              <p className="ev-meta mt-3 max-w-[70ch]">
                Until then they read &ldquo;not yet measured&rdquo; — never a zero result. A baseline
                is only useful if it is real, so nothing is shown here until it has actually been
                measured.
              </p>
            </>
          )}
        </div>
      </section>

      {/* Proof-only footer */}
      <footer className="ev-section mt-7 border-t border-border pt-5">
        <p className="ev-meta max-w-[72ch]">
          Proof-only: these are {baseline.merchantName}&rsquo;s starting numbers, not a Tideover
          result. This report makes no prediction, promises no percentage change, and sets no
          delivery date — it exists so that every result reported later can be checked against the
          same measured starting point.
        </p>
      </footer>
    </div>
  );
}
