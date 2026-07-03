import { NextResponse } from "next/server";
import { getRepositories } from "@/lib/repositories";
import { computeTimeline } from "@/lib/time";

/** GET /api/orders/[orderId]/timeline — timeline + honest confidence band. */
export async function GET(_req: Request, { params }: { params: { orderId: string } }) {
  const repos = getRepositories();
  const order = await repos.orders.findById(params.orderId);
  if (!order) return NextResponse.json({ error: "order not found" }, { status: 404 });
  const merchant = await repos.merchants.findById(order.merchantId);
  if (!merchant) return NextResponse.json({ error: "merchant not found" }, { status: 404 });
  return NextResponse.json(computeTimeline(order, merchant));
}
