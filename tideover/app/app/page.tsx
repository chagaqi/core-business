import Link from "next/link";
import type { Metadata } from "next";
import { getDashboard } from "@/lib/service";
import { getRepositories } from "@/lib/repositories";
import { NoMerchantState } from "@/components/product/NoMerchantState";
import { MerchantSwitcher } from "@/components/product/MerchantSwitcher";
import { MetricTile } from "@/components/product/MetricTile";
import { RiskCurve } from "@/components/product/RiskCurve";
import { RiskBadge, Tag } from "@/components/ui/Badge";
import { ATTAINMENT_MIN_N } from "@/lib/sla";
import { timeAgo } from "@/lib/time";
import type { RiskColor } from "@/lib/types";

export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "Dashboard — Tideover" };

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

/** Delta vs baseline for metrics where LOWER is better (FRT, WISMO). A null
 *  baseline (unmeasured — fresh merchant) yields no delta, never a fake "0". */
function lowerIsBetterDelta(live: number | null, baseline: number | null) {
  if (live == null || baseline == null || baseline === 0) return undefined;
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
    return <NoMerchantState />;
  }
  const merchantId =
    searchParams.merchant && merchants.some((m) => m.id === searchParams.merchant)
      ? searchParams.merchant
      : merchants[0].id;

  const data = await getDashboard(merchantId);
  if (!data) {
    return <div className="p-8 text-ink-mute">No dashboard data for this merchant.</div>;
  }

  const {
    baseline,
    live,
    deflection: def,
    cohort,
    statusBoard: sb,
    queueDistribution: dist,
    disputeExposure: exp,
    slaAttainment: sla,
    queueStatus: q,
  } = data;
  const inboxHref = `/app/inbox?merchant=${merchantId}`;
  const statusHref = `/app/status?merchant=${merchantId}`;
  // C5 proof-only: show the % only above the small-n floor; below it, surface the
  // raw denominator and keep collecting (mirrors the Script Performance surface).
  const slaHasRate = sla.rate != null;
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
          {/* UX-09 live status strip: measured open-queue state, each figure a
              link into the inbox. Red is reserved for overdue; caution gold for
              due-soon + flagged. */}
          <div className="mt-2 flex flex-wrap items-center gap-x-2 gap-y-1 text-[12.5px]">
            <StatusFigure href={inboxHref} value={q.waiting} label="waiting" tone="neutral" />
            <Dot />
            <StatusFigure href={inboxHref} value={q.overdue} label="overdue" tone="red" />
            <Dot />
            <StatusFigure href={inboxHref} value={q.dueSoon} label="due soon" tone="amber" />
            <Dot />
            <StatusFigure href={inboxHref} value={q.flagged} label="flagged" tone="amber" />
          </div>
        </div>
        <MerchantSwitcher
          merchants={merchants.map((m) => ({ id: m.id, name: m.name }))}
          current={merchantId}
        />
      </header>

      {/* UX-07(b): the dashboard's first action — land the operator on their
          open work. Terracotta primary only when there's a queue to answer;
          a calm panel when the queue is clear (nothing to click). */}
      {q.waiting > 0 ? (
        <Link
          href={inboxHref}
          className="btn btn-primary btn-lg w-full justify-between gap-3 text-left no-underline"
        >
          <span>Answer your queue ({q.waiting} waiting)</span>
          <span aria-hidden="true">→</span>
        </Link>
      ) : (
        <div className="panel flex items-center gap-3 px-5 py-4">
          <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-accent-card text-teal">
            <CheckMark />
          </span>
          <div>
            <p className="text-[15px] font-semibold text-ink">All caught up</p>
            <p className="text-[12px] text-ink-mute">
              Every at-risk buyer has a reply out. New tickets land in your inbox as they arrive.
            </p>
          </div>
        </div>
      )}

      <section className="grid grid-cols-2 gap-3 lg:grid-cols-6">
        <MetricTile
          proof
          label="Median first response"
          value={formatFrt(live.medianFrtSec)}
          delta={lowerIsBetterDelta(live.medianFrtSec, baseline.medianFrtSec)}
          sublabel={
            baseline.medianFrtSec != null ? `baseline ${formatFrt(baseline.medianFrtSec)}` : "no baseline yet"
          }
        />
        <MetricTile
          proof
          label="SLA attainment"
          value={slaHasRate ? `${Math.round((sla.rate as number) * 100)}%` : `n=${sla.answered}`}
          sublabel={
            slaHasRate
              ? `${sla.met}/${sla.answered} first responses on time`
              : `collecting — rate at n≥${ATTAINMENT_MIN_N}`
          }
        />
        <MetricTile
          proof
          label="WISMO / 100 orders"
          info={'"where is my order?" tickets per 100 orders'}
          value={live.wismoPer100Orders}
          delta={lowerIsBetterDelta(live.wismoPer100Orders, baseline.wismoPer100Orders)}
          sublabel={
            baseline.wismoPer100Orders != null
              ? `baseline ${baseline.wismoPer100Orders}`
              : "no baseline yet — only you can report the desk we weren't here for"
          }
        />
        {/* Was "Saves logged". A reply to someone who threatened a chargeback is a
            reply; a gift is a tag. Neither is a measured save, so neither is called
            one. Activity, labelled as activity. */}
        <MetricTile
          proof
          label="Dispute-risk replies"
          info="Replies sent to customers who threatened a chargeback. An activity count — nothing here proves a dispute was prevented."
          value={live.disputeRiskReplies}
          sublabel={`${live.giftsAuthorized} ${live.giftsAuthorized === 1 ? "gift" : "gifts"} authorized`}
        />
        {/* Was `resolved / tickets` — a reply-completion rate labelled "Deflection",
            reading 100% for all ten merchants in the run. Now it is the real thing
            (status-page views followed by silence from that order) or it is nothing. */}
        <MetricTile
          proof
          label="Deflection"
          info="Status-page views that were NOT followed by a ticket from that order within 7 days — a question the page answered so it never reached you."
          value={def.rate != null ? `${Math.round(def.rate * 100)}%` : "—"}
          unmeasured={def.rate == null}
          sublabel={
            def.gap ??
            `${def.quietViews} of ${def.evaluatedViews} status-page views raised no ticket`
          }
        />
        <MetricTile
          proof
          label="Orders in window"
          value={data.ordersInWindow}
          sublabel={`${live.sentCount} replies sent`}
        />
      </section>

      {/* THE STATUS BOARD, on the dashboard, because a stale board is the single
          highest-frequency way this product tells a customer something false. It is
          not a nag: it is the one input the operator owns and everything else reads. */}
      <section className="panel p-5">
        <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
          <div>
            <h2 className="font-serif text-[20px] text-ink">What your replies are saying</h2>
            <p className="text-[12px] text-ink-mute">
              Every draft reads your production status before it reads your day-bands.
            </p>
          </div>
          <Link href={statusHref} className="btn btn-ghost no-underline">
            {sb.scopes.length === 0 ? "Post your first status" : "Update status"}
          </Link>
        </div>

        {sb.scopes.length === 0 ? (
          <p className="rounded-xl border border-dashed border-border bg-sand px-4 py-3 text-[12.5px] leading-relaxed text-ink-mute">
            No status posted. All {sb.totalOrders.toLocaleString("en-US")} orders are being described
            from your day-bands alone — which is your plan, not your workshop. If the plan has
            slipped, every reply is confidently describing a stage the order is not in.
          </p>
        ) : (
          <div className="flex flex-col gap-2">
            {sb.scopes.slice(0, 3).map((s) => (
              <div
                key={s.entry.id}
                className="flex flex-wrap items-baseline justify-between gap-2 rounded-xl border border-border bg-sand px-4 py-3"
              >
                <div className="min-w-0 flex-1">
                  <p className="truncate text-[13.5px] text-ink">{s.entry.headline}</p>
                  <p className="text-[12px] text-ink-mute">
                    {s.bandPhrase} · updated {timeAgo(s.entry.updatedAt)} by {s.entry.updatedBy}
                  </p>
                </div>
                <span className="whitespace-nowrap text-[12.5px] font-semibold tabular-nums text-ink">
                  {s.ordersCovered.toLocaleString("en-US")}{" "}
                  <span className="font-normal text-ink-mute">
                    {s.ordersCovered === 1 ? "customer" : "customers"}
                  </span>
                </span>
              </div>
            ))}
            {sb.ordersUncovered > 0 ? (
              <p className="text-[12px] text-ink-mute">
                {sb.ordersUncovered.toLocaleString("en-US")} of{" "}
                {sb.totalOrders.toLocaleString("en-US")} orders have no status — their replies fall
                back to your day-bands.
              </p>
            ) : null}
          </div>
        )}
      </section>

      {/* SINCE DAY 0 — the only before/after on this screen where BOTH ends are
          counted from the merchant's own file rather than reported. So it is the
          only place a delta can be stated as a fact. */}
      {cohort ? (
        <section className="panel p-5">
          <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
            <div>
              <h2 className="font-serif text-[20px] text-ink">Since day 0</h2>
              <p className="text-[12px] text-ink-mute">
                Counted from your own order file the day it landed, and counted again today.
                Measured on both ends — no projection.
              </p>
            </div>
            <Link href={`/app/baseline?merchant=${merchantId}`} className="link-quiet text-[13px]">
              Baseline report
            </Link>
          </div>
          <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
            <CohortDelta
              label="Orders past your window"
              day0={cohort.day0.ordersOverdue}
              today={cohort.today.ordersOverdue}
              lowerIsBetter
            />
            <CohortDelta
              label="Still inside the window"
              day0={cohort.day0.ordersInWait}
              today={cohort.today.ordersInWait}
            />
            <CohortDelta
              label="Median wait (days)"
              day0={cohort.day0.medianWaitDays}
              today={cohort.today.medianWaitDays}
              lowerIsBetter
            />
            <CohortDelta
              label="Longest wait (days)"
              day0={cohort.day0.maxWaitDays}
              today={cohort.today.maxWaitDays}
              lowerIsBetter
            />
          </div>
          <p className="mt-3 text-[12px] leading-relaxed text-ink-mute">
            These are counts of your cohort, not a Tideover result: a wait gets longer whether or not
            anyone replies. They are here because they are the true before-picture a renewal argument
            is made against — and because on day 0 they are the only numbers that exist.
          </p>
        </section>
      ) : null}

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
        <div className="flex flex-wrap items-center justify-between gap-2 border-b border-border px-5 py-3.5">
          <div>
            <h2 className="font-serif text-[20px] text-ink">At-risk queue</h2>
            {/* The queue SAYS what it ordered on. When every ticket scores the same —
                p08's fourteen tickets landed in one band — "sorted by risk" is not an
                explanation, it is a shrug. */}
            <p className="text-[12px] text-ink-mute">
              {dist.cohortSize === 0
                ? "Nothing open right now."
                : dist.basis === "risk"
                  ? `Ordered on a stated chargeback first, then risk — your live queue scores ${dist.min}–${dist.max}.`
                  : `Every live ticket scores ${dist.min}–${dist.max}, so risk can't order them. Ordered on longest wait, then order value.`}
            </p>
          </div>
          <Link href={inboxHref} className="link-quiet text-[13px]">
            Open inbox
          </Link>
        </div>
        {data.atRisk.length === 0 ? (
          <div className="proof-placeholder m-5">No at-risk customers right now.</div>
        ) : (
          <div className="overflow-x-auto">
          <table className="w-full min-w-[760px] text-left text-[14px]">
            <thead>
              <tr className="border-b border-border text-[11px] uppercase tracking-wider text-ink-mute">
                <th className="px-5 py-2.5 font-semibold">Customer</th>
                <th className="px-5 py-2.5 font-semibold">Group</th>
                <th className="px-5 py-2.5 font-semibold">Waiting</th>
                <th className="px-5 py-2.5 font-semibold">Why it&rsquo;s here</th>
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
                  {/* The engine computed the top driver on every ticket and the queue
                      used to throw it away, so nobody could answer "why is this on
                      top?" — the question an operator asks first, every time. */}
                  <td className="max-w-[320px] px-5 py-3 text-[13px] leading-snug text-slate">
                    {r.rankReason}
                  </td>
                  <td className="px-5 py-3 text-right">
                    <RiskBadge
                      color={r.color as RiskColor}
                      title={`${
                        r.color === "red" ? "High refund-risk" : r.color === "amber" ? "Watch" : "Standard"
                      } (${r.riskScore})${
                        r.riskPercentile != null
                          ? ` — above ${r.riskPercentile}% of your live queue`
                          : ""
                      }`}
                    >
                      {r.riskScore}
                    </RiskBadge>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          </div>
        )}
      </section>

      <p className="rounded-xl border border-dashed border-border bg-sand px-4 py-3 text-[12px] leading-relaxed text-ink-mute">
        Proof-only: every number above is either measured from {data.merchant.name}&rsquo;s own data
        or it says it is not measured and names what would make it real. Nothing on this screen is a
        projection, and no refund-reduction figure is invented.{" "}
        {baseline.medianFrtSec != null || baseline.wismoPer100Orders != null
          ? `The support baseline was reported by ${data.merchant.name} and captured ${baselineDate}; deltas compare the live period to it.`
          : `The support baseline (first-response time, WISMO rate) is still unreported — those four numbers describe the desk before Tideover arrived, so only ${data.merchant.name} can supply them, and until they do we show no delta rather than a zero.`}
      </p>
    </div>
  );
}

/**
 * One day-0 → today figure. BOTH ends are counts taken from the merchant's own order
 * file (lib/baseline.measureCohort), so the arrow is a fact, not a claim — and the
 * copy never attributes the movement to Tideover, because a wait clock moves on its
 * own. Zero-to-zero renders as "flat", never as a green win.
 */
function CohortDelta({
  label,
  day0,
  today,
  lowerIsBetter = false,
}: {
  label: string;
  day0: number;
  today: number;
  lowerIsBetter?: boolean;
}) {
  const diff = today - day0;
  const better = lowerIsBetter ? diff < 0 : diff > 0;
  const tone = diff === 0 ? "text-ink-mute" : better ? "text-risk-green" : "text-risk-red";
  const arrow = diff === 0 ? "" : diff > 0 ? "↑" : "↓";
  return (
    <div className="flex flex-col gap-1 rounded-xl border border-border bg-sand p-4">
      <span className="text-[11px] font-semibold uppercase tracking-wider text-ink-mute">
        {label}
      </span>
      <span className="font-serif text-[28px] leading-none text-ink tabular-nums">
        {today.toLocaleString("en-US")}
      </span>
      <span className="mt-1 text-[12px] text-ink-mute">
        <span className={`font-semibold ${tone}`}>
          {diff === 0 ? "flat" : `${arrow} ${Math.abs(diff).toLocaleString("en-US")}`}
        </span>{" "}
        vs {day0.toLocaleString("en-US")} on day 0
      </span>
    </div>
  );
}

/** One figure in the UX-09 status strip: a value + label linking into the inbox.
 *  Tone colors the number only when it's non-zero — red for overdue (act-now),
 *  caution gold for due-soon/flagged, neutral otherwise. */
function StatusFigure({
  href,
  value,
  label,
  tone,
}: {
  href: string;
  value: number;
  label: string;
  tone: "neutral" | "red" | "amber";
}) {
  const active = value > 0;
  const color =
    tone === "red" && active
      ? "text-risk-red"
      : tone === "amber" && active
        ? "text-amber-status"
        : "text-ink";
  return (
    <Link href={href} className="link-quiet no-underline">
      <span className={`font-semibold tabular-nums ${color}`}>{value}</span>{" "}
      <span className="text-ink-mute">{label}</span>
    </Link>
  );
}

/** Quiet separator dot for the status strip. */
function Dot() {
  return (
    <span aria-hidden="true" className="text-ink-mute">
      ·
    </span>
  );
}

/** Small calm check for the "All caught up" state. Inherits currentColor. */
function CheckMark() {
  return (
    <svg
      width="18"
      height="18"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2.5"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <path d="M20 6 9 17l-5-5" />
    </svg>
  );
}
