import { NextResponse } from "next/server";
import { z } from "zod";
import { verifyStatusToken } from "@/lib/ids";
import { getRepositories } from "@/lib/repositories";
import { getAdapter } from "@/lib/channel-adapters/registry";
import { ingestTicket } from "@/lib/service";

/**
 * POST /api/widget-submit — the native embeddable widget / status-page AskBox.
 * A customer's question (scoped by their status token) becomes a real ticket via
 * the Mock channel, flowing into the same ingest→draft pipeline as any helpdesk.
 */
const Body = z.object({ token: z.string(), message: z.string().min(1) });

export async function POST(req: Request) {
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
  const result = await ingestTicket(normalized);
  if ("error" in result) return NextResponse.json({ error: result.error }, { status: 422 });
  return NextResponse.json({ status: "received", ticketId: result.ticket.id });
}
