import type { OutcomeEvent } from "@/lib/types";

/**
 * Scheduled-job core (ADR-0013, task F4): the `resolved_quiet` sweep.
 *
 * `resolved_quiet` is the one outcome kind E2 could not emit at ingest time — it
 * is the *absence* of a later event ("the reply settled it: no customer reply, no
 * reopen for 7 days after a send"), so it needs a time-based sweep rather than an
 * ingest hook. This module is the pure, testable core; the thin route
 * (app/api/cron/sweep-outcomes) loads a merchant's events, calls this, and records
 * whatever it returns best-effort.
 *
 * Zero I/O by design: given a merchant's outcome events and `now`, it returns the
 * `resolved_quiet` events to emit. Idempotent by construction — a re-run never
 * double-counts, because it skips any (order, variant) that already carries a
 * `resolved_quiet` (whether seeded or emitted by an earlier sweep). Same guarantee
 * as E2's reopen dedupe, just keyed on order+variant instead of just order.
 */

/** The quiet window (ADR-0013): a send with no comeback for this long has settled.
 *  Seven days mirrors E2's reply-attribution window and Visa's dispute clock. */
export const RESOLVED_QUIET_WINDOW_MS = 7 * 86400000;

/** A real customer comeback on the order that, if it lands AFTER a send, means the
 *  reply did NOT settle quietly — so no `resolved_quiet` for that send. This is
 *  order-scoped. Note `resolved_quiet` is deliberately NOT here: a prior settle is
 *  already deduped per (order, variant) by the `settled` guard below, so including
 *  it here would let one variant's settle wrongly suppress a DIFFERENT variant's
 *  legitimate settle on the same order (cross-variant under-count). */
const COMEBACK_KINDS = new Set<OutcomeEvent["kind"]>(["customer_replied", "reopened"]);

const key = (orderId: string, variantId: string): string => `${orderId}|${variantId}`;

/**
 * Given a merchant's outcome events + `now`, return the `resolved_quiet` events to
 * emit (each an `Omit<OutcomeEvent, "id">` the repository will stamp with an id).
 *
 * For each `reply_sent` older than the 7-day window whose order has NO
 * `customer_replied` / `reopened` / `resolved_quiet` recorded after it, emit one
 * `resolved_quiet` attributed to that reply's variant/stage/order. Skips any
 * (order, variant) that already has a `resolved_quiet` — from the input (seed or a
 * prior sweep) OR from earlier in THIS run (two quiet sends of the same variant on
 * one order settle it once, not twice). That guard is the whole idempotency story.
 */
export function sweepResolvedQuiet(
  events: OutcomeEvent[],
  now: Date,
): Array<Omit<OutcomeEvent, "id">> {
  const nowMs = now.getTime();

  // (order, variant) pairs already settled quiet — the idempotency guard. Seeded
  // events + prior sweeps are already in `events`; we add to it as we emit so a
  // second qualifying send on the same order+variant never double-emits.
  const settled = new Set<string>();
  for (const e of events) {
    if (e.kind === "resolved_quiet") settled.add(key(e.orderId, e.variantId));
  }

  const toEmit: Array<Omit<OutcomeEvent, "id">> = [];
  for (const reply of events) {
    if (reply.kind !== "reply_sent") continue;

    const replyMs = new Date(reply.observedAt).getTime();
    // Still inside the quiet window — too early to call it settled.
    if (nowMs - replyMs <= RESOLVED_QUIET_WINDOW_MS) continue;

    const k = key(reply.orderId, reply.variantId);
    if (settled.has(k)) continue; // already resolved_quiet for this order+variant

    // Any comeback on this order AFTER the send means the reply didn't settle it.
    const hasComeback = events.some(
      (e) =>
        e.orderId === reply.orderId &&
        COMEBACK_KINDS.has(e.kind) &&
        new Date(e.observedAt).getTime() > replyMs,
    );
    if (hasComeback) continue;

    settled.add(k); // mark within-run so a later send on the same key is skipped
    toEmit.push({
      merchantId: reply.merchantId,
      ticketId: reply.ticketId,
      orderId: reply.orderId,
      customerId: reply.customerId,
      variantId: reply.variantId,
      stageKey: reply.stageKey,
      sentimentAtSend: reply.sentimentAtSend,
      kind: "resolved_quiet",
      observedAt: now.toISOString(),
    });
  }
  return toEmit;
}
