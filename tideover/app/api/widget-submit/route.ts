import { NextResponse } from "next/server";
import { z } from "zod";
import { verifyStatusToken } from "@/lib/ids";
import { getRepositories } from "@/lib/repositories";
import { getAdapter } from "@/lib/channel-adapters/registry";
import { INGEST_DRAFT_TIMEOUT_MS } from "@/lib/drafting/LlmDrafter";
import { ingestTicket } from "@/lib/service";
import { createRateLimiter, clientIp } from "@/lib/rate-limit";

/**
 * POST /api/widget-submit — the native embeddable widget / status-page AskBox.
 * A customer's question (scoped by their status token) becomes a real ticket via
 * the Mock channel, flowing into the same ingest→draft pipeline as any helpdesk.
 *
 * Rate limited (20/min per IP): every accepted POST creates a ticket and may
 * spend an LLM draft call, and the status token is in every buyer's hands, so
 * an unthrottled loop means inbox flooding plus unbounded paid drafting. 20/min
 * is generous for a human filling in a question box. Per-instance caveat: see
 * lib/rate-limit.ts.
 */
const Body = z.object({ token: z.string(), message: z.string().min(1) });

const rateLimited = createRateLimiter(20);

export async function POST(req: Request) {
  if (rateLimited(clientIp(req))) {
    return NextResponse.json({ error: "rate limited" }, { status: 429 });
  }

  const parsed = Body.safeParse(await req.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: "invalid body" }, { status: 400 });

  const key = verifyStatusToken(parsed.data.token);
  if (!key) return NextResponse.json({ error: "invalid token" }, { status: 404 });

  const repos = getRepositories();
  const order = await repos.orders.findByToken(key);
  if (!order) return NextResponse.json({ error: "not found" }, { status: 404 });
  const customer = await repos.customers.findById(order.customerId);
  if (!customer) return NextResponse.json({ error: "not found" }, { status: 404 });

  const adapter = getAdapter("mock");
  const normalized = adapter.normalizeInbound({
    merchantId: order.merchantId,
    customerEmail: customer.email,
    orderId: order.id,
    subject: "Question from order status page",
    body: parsed.data.message,
  });
  // The buyer is waiting on this response: cap the optional LLM draft at
  // ~4.5s instead of the 8s default — past the deadline the deterministic
  // drafter answers and the ticket still ingests normally.
  const result = await ingestTicket(normalized, { draftTimeoutMs: INGEST_DRAFT_TIMEOUT_MS });
  if ("error" in result) return NextResponse.json({ error: result.error }, { status: 422 });
  return NextResponse.json({ status: "received", ticketId: result.ticket.id });
}
