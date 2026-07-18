import type { StatusView, Ticket } from "@/lib/types";

/**
 * DEFLECTION — measured, or not claimed at all.
 *
 * WHAT WAS THERE BEFORE. `deflectionPct = resolved / tickets`. That is the share
 * of tickets that got a reply — a reply-completion rate — and it reads 100% for
 * anyone doing their job. It read 100% for all ten merchants in the run. It was
 * labelled "Deflection", next to a baseline tile reading "Not yet measured", on
 * the screen a merchant opens to decide whether to renew. A mislabelled tautology
 * is worse than a blank: the first merchant who thinks about it for ten seconds
 * stops trusting every other number on the page, including the true ones.
 *
 * WHAT DEFLECTION ACTUALLY IS. A ticket that never got written, because the
 * customer looked at their status page and found the answer. So it is measured
 * exactly as it is defined:
 *
 *   A status-page view is DEFLECTED when that order raised no ticket in the
 *   DEFLECTION_WINDOW_DAYS after it. The customer looked, and did not write.
 *
 * Both halves are recorded facts: the view is a row in the append-only status-view
 * ledger (ADR-0005), and the ticket is a row in the ticket store. Nothing is
 * inferred, nothing is projected, no benchmark is borrowed.
 *
 * THE THREE HONESTIES THAT MAKE IT A MEASUREMENT AND NOT A NUMBER:
 *
 *  1. A view too RECENT to judge is not counted. If someone opened their status
 *     page an hour ago, the ticket they might write is still coming; counting that
 *     hour as a deflection would inflate the rate by construction, and the metric
 *     would climb every time someone looked at a page. Those views are reported
 *     separately as `pendingViews` and excluded from the denominator.
 *  2. Below MIN_N evaluated views there is NO RATE — only the counts. A merchant
 *     whose page was viewed three times has not measured a deflection rate.
 *  3. Zero views means the metric is UNMEASURED, not zero. The surface must say
 *     what would make it real (get the status link in front of customers who have
 *     NOT written in), never render a 0% that looks like a failed result.
 *
 * Pure and deterministic — `now` is injected, no I/O.
 */

const DAY_MS = 86_400_000;

/**
 * How long after a status-page view a ticket from that order still counts as "they
 * looked and it did not settle it". Seven days mirrors the outcome ledger's other
 * attribution windows (ADR-0012) and a card network's dispute-clock granularity.
 */
export const DEFLECTION_WINDOW_DAYS = 7;

/**
 * Evaluated views needed before a RATE is shown. Below it the surface reports the
 * raw counts and keeps collecting — small-sample humility, the same floor
 * discipline as SLA attainment and Script Performance.
 */
export const DEFLECTION_MIN_N = 20;

export type DeflectionState =
  /** nobody has opened a status page yet — there is nothing to measure. */
  | "no-views"
  /** views exist, but none are old enough to judge yet. */
  | "too-recent"
  /** measured, but below the small-sample floor: counts only, no rate. */
  | "collecting"
  /** a real rate, over a real sample. */
  | "measured";

export interface DeflectionMeasure {
  state: DeflectionState;
  /** views old enough to judge (viewed at least DEFLECTION_WINDOW_DAYS ago). */
  evaluatedViews: number;
  /** of those, the ones whose order raised no ticket inside the window after. */
  quietViews: number;
  /** of those, the ones followed by a ticket from that order. */
  followedByTicket: number;
  /** quietViews / evaluatedViews — null unless state === "measured". */
  rate: number | null;
  /** views too recent to judge. Excluded from the denominator, reported anyway. */
  pendingViews: number;
  /** distinct orders whose status page has been viewed at all. */
  viewedOrders: number;
  windowDays: number;
  minN: number;
}

/**
 * Measure deflection from the two ledgers. `views` is the merchant's status-view
 * ledger; `tickets` is the merchant's tickets. A view is judged only against
 * tickets from ITS OWN order — a different customer's ticket says nothing about
 * whether this one was answered by the page.
 */
export function measureDeflection(
  views: Pick<StatusView, "orderId" | "viewedAt">[],
  tickets: Pick<Ticket, "orderId" | "createdAt">[],
  now: Date = new Date(),
): DeflectionMeasure {
  const windowMs = DEFLECTION_WINDOW_DAYS * DAY_MS;
  const nowMs = now.getTime();

  // Ticket arrival times per order, ascending — the only thing a view is judged
  // against. Order-less (unmatched) tickets carry no orderId and are skipped: we
  // cannot know whose page, if any, failed to answer them.
  const ticketTimesByOrder = new Map<string, number[]>();
  for (const t of tickets) {
    if (!t.orderId) continue;
    const ms = new Date(t.createdAt).getTime();
    if (Number.isNaN(ms)) continue;
    const held = ticketTimesByOrder.get(t.orderId);
    if (held) held.push(ms);
    else ticketTimesByOrder.set(t.orderId, [ms]);
  }
  for (const times of ticketTimesByOrder.values()) times.sort((a, b) => a - b);

  let evaluatedViews = 0;
  let quietViews = 0;
  let followedByTicket = 0;
  let pendingViews = 0;
  const viewedOrders = new Set<string>();

  for (const v of views) {
    const viewedMs = new Date(v.viewedAt).getTime();
    if (Number.isNaN(viewedMs)) continue;
    viewedOrders.add(v.orderId);

    // Too recent to judge: the ticket this view might not have prevented has not
    // had its window yet. Never counted as a deflection.
    if (viewedMs + windowMs > nowMs) {
      pendingViews += 1;
      continue;
    }

    evaluatedViews += 1;
    const times = ticketTimesByOrder.get(v.orderId) ?? [];
    // Strictly AFTER the view, inside the window. A ticket that was already open
    // when they looked is not a ticket the page failed to prevent.
    const wrote = times.some((t) => t > viewedMs && t <= viewedMs + windowMs);
    if (wrote) followedByTicket += 1;
    else quietViews += 1;
  }

  const state: DeflectionState =
    viewedOrders.size === 0 && pendingViews === 0 && evaluatedViews === 0
      ? "no-views"
      : evaluatedViews === 0
        ? "too-recent"
        : evaluatedViews < DEFLECTION_MIN_N
          ? "collecting"
          : "measured";

  return {
    state,
    evaluatedViews,
    quietViews,
    followedByTicket,
    rate: state === "measured" ? quietViews / evaluatedViews : null,
    pendingViews,
    viewedOrders: viewedOrders.size,
    windowDays: DEFLECTION_WINDOW_DAYS,
    minN: DEFLECTION_MIN_N,
  };
}

/**
 * What the tile says when there is no rate — and, crucially, WHAT WOULD MAKE IT
 * REAL. A merchant staring at "not yet measured" is owed the next action, not an
 * apology. Returns null once the rate is measured.
 */
export function deflectionGap(m: DeflectionMeasure): string | null {
  switch (m.state) {
    case "no-views":
      return "Not yet measured. Nobody has opened a status page, so there is nothing to count. This becomes real once the status link reaches customers who have NOT written in.";
    case "too-recent":
      return `Not yet measured. ${m.pendingViews} status-page ${m.pendingViews === 1 ? "view is" : "views are"} too recent to judge — a view only counts once it has had ${m.windowDays} ticket-free days behind it.`;
    case "collecting":
      return `Collecting — ${m.quietViews} of ${m.evaluatedViews} views raised no ticket. A rate needs ${m.minN} judged views; ${m.minN - m.evaluatedViews} to go.`;
    case "measured":
      return null;
  }
}
