import { NextResponse } from "next/server";
import { z } from "zod";
import { verifyStatusToken } from "@/lib/ids";
import { getRepositories } from "@/lib/repositories";

/**
 * POST /api/csat/[token] — one-tap customer CSAT (ADR-0012, E2). PUBLIC: the
 * status token authenticates it, exactly like /api/status/[token] — it is NOT
 * behind the operator gate (the middleware matcher does not list /api/csat).
 *
 * Flow: verify the token → resolve the order → find the order's most recent
 * reply_sent event → record csat_up/csat_down attributed to THAT reply's variant
 * so it folds into the Script Performance panel. If the order has no prior
 * reply_sent there is nothing to attribute, so we skip gracefully (still 200, so
 * the customer's tap is acknowledged calmly). Idempotent per order: a re-tap
 * REPLACES the prior CSAT (deleteCsatForOrder) rather than stacking.
 */
const Body = z.object({ value: z.enum(["up", "down"]) });

export async function POST(req: Request, { params }: { params: { token: string } }) {
  const parsed = Body.safeParse(await req.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: "invalid body" }, { status: 400 });

  const key = verifyStatusToken(params.token);
  if (!key) return NextResponse.json({ error: "not found" }, { status: 404 });

  const repos = getRepositories();
  const order = await repos.orders.findByToken(key);
  if (!order) return NextResponse.json({ error: "not found" }, { status: 404 });

  // Attribute to the order's most recent reply_sent (the variant that produced the
  // message the customer is rating). listByMerchant is observedAt-ascending.
  const events = await repos.outcomeEvents.listByMerchant(order.merchantId);
  const reply = events
    .filter((e) => e.kind === "reply_sent" && e.orderId === order.id)
    .at(-1);
  if (!reply) {
    // No reply to attribute the rating to — accept the tap, record nothing.
    return NextResponse.json({ status: "skipped", reason: "no reply to attribute" });
  }

  const kind = parsed.data.value === "up" ? "csat_up" : "csat_down";
  try {
    // Re-tap replaces: clear any prior csat for this order, then record the current tap.
    // The delete+record is not atomic, so two SIMULTANEOUS taps for the same order
    // could both delete then both record (a double CSAT). The UI disables the button
    // during send, so sequential re-taps are the real case and are safe; a rare
    // concurrent double-tap only inflates one order's csat count by one. If this
    // matters at scale, enforce a unique (orderId, csat) index and upsert instead.
    await repos.outcomeEvents.deleteCsatForOrder(order.id);
    await repos.outcomeEvents.record({
      merchantId: order.merchantId,
      ticketId: reply.ticketId,
      orderId: order.id,
      customerId: order.customerId,
      variantId: reply.variantId,
      stageKey: reply.stageKey,
      sentimentAtSend: reply.sentimentAtSend,
      kind,
      observedAt: new Date().toISOString(),
    });
  } catch (err) {
    console.log(
      JSON.stringify({
        event: "outcome-event.csat-failed",
        orderId: order.id,
        error: err instanceof Error ? err.message : String(err),
      }),
    );
    return NextResponse.json({ error: "could not record" }, { status: 500 });
  }
  return NextResponse.json({ status: "recorded", kind });
}
