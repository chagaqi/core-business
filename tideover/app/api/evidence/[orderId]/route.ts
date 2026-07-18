import { NextResponse } from "next/server";
import { withApiErrorHandling } from "@/lib/api-handler";
import { assembleEvidencePack } from "@/lib/evidence";

/**
 * GET /api/evidence/[orderId] — the Dispute Evidence Pack as structured JSON.
 * The machine-readable twin of /app/orders/[orderId]/evidence (the print view):
 * same assembler, same fields — disclosed ETA + disclosure timestamp, the full
 * communication log (sent replies with real sentAt), the status-page view
 * ledger, CSAT acknowledgment, gift gestures, campaign/wave labels.
 *
 * Operator-gated by the middleware matcher (/api/evidence/:path*). Tenancy
 * (ADR-0020) flows through the assembler's merchants.findById resolution: in
 * auth0 scoped mode a foreign order's merchant resolves null, so the route
 * answers 404 — indistinguishable from "does not exist". Demo mode stays
 * unscoped; a demo merchant's pack carries isDemo=true, which every render of
 * this payload must surface as the SAMPLE DATA watermark.
 */

export const dynamic = "force-dynamic";

async function handleGET(_req: Request, ctx: { params: { orderId: string } }) {
  const pack = await assembleEvidencePack(ctx.params.orderId);
  if (!pack) return NextResponse.json({ error: "order not found" }, { status: 404 });
  return NextResponse.json(pack);
}

export const GET = withApiErrorHandling("/api/evidence/[orderId]", handleGET);
