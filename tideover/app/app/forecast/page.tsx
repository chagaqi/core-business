import type { Metadata } from "next";
import Link from "next/link";
import { getRepositories } from "@/lib/repositories";
import { computeCohortForecast, daysUntilWindow } from "@/lib/forecast";
import { MerchantSwitcher } from "@/components/product/MerchantSwitcher";
import { NoMerchantState } from "@/components/product/NoMerchantState";

/**
 * Cohort WISMO Forecast (C7, ADR-0015) — a DEMAND estimate, not an outcome.
 *
 * Projects the inbound WISMO ("where is my order?") ticket load for the coming
 * horizon by counting the orders that cross into the anxious day-60–89 window,
 * then sizing it against the merchant's OWN baseline WISMO rate. This is the
 * "staff for the wave" panel a generic helpdesk can't produce, because it
 * doesn't model the production timeline.
 *
 * PROOF-ONLY (ADR-0002, ADR-0015): both inputs are measured — the order dates
 * (the day-60 crossing is pure arithmetic) and the merchant's own baseline rate.
 * The output is framed as expected inbound VOLUME, shown as a RANGE with the
 * method spelled out, labelled an estimate. There is no Tideover-outcome claim,
 * no hard date, and no invented number. If the baseline rate is uncalibrated we
 * show the cohort count only and never fabricate a rate.
 *
 * Behind the F2 auth gate in live mode via middleware's /app/:path* matcher.
 * Respects ?merchant= like the other /app surfaces; ?horizon= (7/14/30) picks the
 * staffing window and defaults to 7. SAMPLE DATA watermark for demo merchants.
 */

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Cohort WISMO forecast",
  robots: { index: false, follow: false },
};

const HORIZONS = [7, 14, 30] as const;

export default async function ForecastPage({
  searchParams,
}: {
  searchParams: { merchant?: string; horizon?: string };
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

  const parsedHorizon = Number(searchParams.horizon);
  const horizonDays = (HORIZONS as readonly number[]).includes(parsedHorizon)
    ? parsedHorizon
    : 7;

  const orders = await repos.orders.listByMerchant(merchantId);
  const baseline = merchant.baseline.wismoPer100Orders;
  // The window is the MERCHANT'S OWN promised window, not a hardcoded 60–89: nine of
  // the ten merchants in the run forecast an empty cohort because their backers cross
  // day 60 months before anyone expects a parcel.
  const f = computeCohortForecast(
    orders,
    baseline,
    merchant.fulfillmentWindowDays,
    new Date(),
    horizonDays,
  );
  const calibrated = f.calibrated;

  const ordersById = new Map(orders.map((o) => [o.id, o]));
  const cohort = f.cohortOrderIds
    .map((id) => ordersById.get(id))
    .filter((o): o is NonNullable<typeof o> => Boolean(o))
    .map((o) => ({ order: o, crossesInDays: daysUntilWindow(o, f.windowEnterDay, new Date()) }))
    .sort((a, b) => a.crossesInDays - b.crossesInDays);

  const rangeLabel = calibrated
    ? f.expectedLow === f.expectedHigh
      ? `${f.expectedLow}`
      : `${f.expectedLow}–${f.expectedHigh}`
    : null;

  return (
    <div className="evpack">
      {merchant.isDemo && (
        <div className="ev-watermark" aria-hidden="true">
          <span>SAMPLE DATA</span>
        </div>
      )}

      {/* Toolbar */}
      <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
        <p className="text-[12px] text-ink-mute">Operator view · cohort WISMO forecast</p>
        <MerchantSwitcher
          merchants={merchants.map((m) => ({ id: m.id, name: m.name }))}
          current={merchantId}
        />
      </div>

      {/* Header */}
      <header className="ev-section mb-6">
        <p className="kicker">Cohort WISMO forecast</p>
        <h1 className="ev-doc-title mt-1 text-ink">Staff for the wave, not the average</h1>
        <p className="mt-3 max-w-[66ch] text-[13.5px] leading-relaxed text-slate">
          &ldquo;Where is my order?&rdquo; tickets don&rsquo;t arrive evenly — they spike as a cohort
          crosses into the window <strong className="font-semibold">you promised</strong>, because
          that is the week a buyer starts expecting a parcel. For {merchant.name} that is day&nbsp;
          {f.windowEnterDay}–{f.windowExitDay}
          {f.windowSource === "default"
            ? " (our default — you have no fulfillment window on file yet)"
            : ", from your own fulfillment window"}
          . This sizes the incoming load from {merchant.name}&rsquo;s own measured numbers: the order
          dates, that window, and the day-0 baseline WISMO rate. It projects expected inbound volume
          so you can staff — it is not a Tideover result and sets no delivery date.
        </p>

        {f.overdueOrders > 0 ? (
          <p className="mt-3 max-w-[66ch] rounded-lg border border-dashed border-border bg-sand px-4 py-2.5 text-[13px] leading-relaxed text-ink">
            <strong className="font-semibold">
              {f.overdueOrders.toLocaleString("en-US")}{" "}
              {f.overdueOrders === 1 ? "order is" : "orders are"} already past your window
            </strong>{" "}
            and are <em>not</em> in this forecast. They are not a wave that is coming — they are a
            queue that is here. A forecast that quietly dropped them is how a merchant whose plan
            has blown reads &ldquo;0 expected&rdquo; and concludes the product has nothing to say to
            them.
          </p>
        ) : null}
      </header>

      {/* Horizon selector */}
      <div className="ev-section mb-5 flex items-center gap-2">
        <span className="ev-label">Staffing window</span>
        <div className="flex gap-1.5">
          {HORIZONS.map((h) => {
            const active = h === horizonDays;
            return (
              <Link
                key={h}
                href={`/app/forecast?merchant=${merchantId}&horizon=${h}`}
                className={
                  active
                    ? "rounded-md bg-teal px-3 py-1 text-[12.5px] font-semibold text-ink-inverse no-underline"
                    : "rounded-md border border-border px-3 py-1 text-[12.5px] font-semibold text-ink-mute no-underline hover:bg-sand"
                }
                aria-current={active ? "page" : undefined}
              >
                next {h} days
              </Link>
            );
          })}
        </div>
      </div>

      {/* Headline */}
      <section className="ev-section mb-5">
        <div className="ev-card bl-hero">
          {calibrated ? (
            <>
              <p className="ev-label">Expected WISMO tickets · next {horizonDays} days</p>
              <p className="mt-1.5 font-serif text-[46px] leading-none text-ink">
                ≈ {rangeLabel}
              </p>
              <p className="mt-2 max-w-[62ch] text-[13.5px] leading-relaxed text-slate">
                {f.enteringWindow === 0 ? (
                  <>
                    A quiet stretch for late-wait anxiety: no orders cross into the day&nbsp;
                    {f.windowEnterDay}–{f.windowExitDay} window in the next {horizonDays} days, so no
                    cohort-driven WISMO wave is building right now.
                  </>
                ) : (
                  <>
                    That&rsquo;s the inbound WISMO load likely to land in the next {horizonDays} days
                    as this cohort crosses into the anxious window — a range, because it&rsquo;s a
                    planning estimate, not a count.
                  </>
                )}
              </p>
            </>
          ) : (
            <>
              <p className="ev-label">Cohort entering the day-{f.windowEnterDay}–{f.windowExitDay} window</p>
              <p className="mt-1.5 font-serif text-[46px] leading-none text-ink">
                {f.enteringWindow}{" "}
                <span className="text-[20px] text-ink-mute">
                  order{f.enteringWindow === 1 ? "" : "s"}
                </span>
              </p>
              <p className="mt-2 max-w-[62ch] text-[13.5px] leading-relaxed text-slate">
                {f.uncalibratedReason}
              </p>
            </>
          )}
        </div>
      </section>

      {/* The cohort + the method */}
      <section className="ev-section mb-5">
        <p className="ev-label mb-2">The method — your own numbers, shown</p>
        <div className="ev-card">
          <p className="text-[14px] leading-relaxed text-ink">
            <strong className="font-semibold">{f.enteringWindow}</strong>{" "}
            order{f.enteringWindow === 1 ? "" : "s"} cross{f.enteringWindow === 1 ? "es" : ""} into
            the day&nbsp;{f.windowEnterDay}–{f.windowExitDay} window in the next {horizonDays} days.
          </p>
          {calibrated ? (
            <p className="mt-2 text-[14px] leading-relaxed text-ink">
              {f.enteringWindow} order{f.enteringWindow === 1 ? "" : "s"} ×{" "}
              {merchant.name}&rsquo;s baseline{" "}
              <strong className="font-semibold">{f.baselineWismoPer100} WISMO per 100 orders</strong>{" "}
              = <strong className="font-semibold">~{f.expectedMid}</strong> expected, shown as{" "}
              <strong className="font-semibold">{rangeLabel}</strong> to carry a ±
              {Math.round(f.bandPct * 100)}% planning band.
            </p>
          ) : (
            <p className="mt-2 text-[13px] leading-relaxed text-ink-mute">
              No baseline WISMO rate on file, so no ticket-load figure is sized — the cohort count
              above is the measured fact we can stand behind today.
            </p>
          )}

          {cohort.length > 0 && (
            <div className="mt-4 border-t border-border pt-3">
              <p className="ev-label mb-2">The orders in this cohort</p>
              <ul className="flex flex-col gap-1">
                {cohort.map(({ order, crossesInDays }) => (
                  <li
                    key={order.id}
                    className="flex items-center justify-between text-[12.5px] text-slate"
                  >
                    <span className="tabular-nums text-ink-mute">{order.id}</span>
                    <span>
                      {order.group} · crosses day {f.windowEnterDay} in{" "}
                      {crossesInDays === 0 ? "under a day" : `~${crossesInDays} day${crossesInDays === 1 ? "" : "s"}`}
                    </span>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      </section>

      {/* Estimate label */}
      <section className="ev-section mb-5">
        <div className="ev-card ev-eta">
          <p className="text-[13.5px] leading-relaxed text-ink">
            <strong className="font-semibold">Estimate for planning, not a guarantee</strong> — built
            from your own order dates and your own baseline rate. It sizes expected inbound WISMO
            volume so you can staff the week; it is not a promise about delivery and names no date.
          </p>
        </div>
      </section>

      {/* Proof-only footer */}
      <footer className="ev-section mt-7 border-t border-border pt-5">
        <p className="ev-meta max-w-[74ch]">
          Proof-only: both inputs are measured — the day-{f.windowEnterDay} crossing is arithmetic on{" "}
          {merchant.name}&rsquo;s real order dates, and the rate is {merchant.name}&rsquo;s own day-0
          baseline. Nothing here projects a Tideover outcome, promises a percentage change, or sets a
          delivery date. It is a workload estimate you can check line by line.
        </p>
      </footer>
    </div>
  );
}
