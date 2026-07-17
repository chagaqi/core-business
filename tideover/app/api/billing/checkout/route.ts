import { handleCheckoutPOST } from "@/lib/billing-route";

// Operator-gated by middleware (matcher: /api/billing/:path*) AND owner-checked
// inside the handler. Stripe hosts Checkout; this only mints the session URL.
export const dynamic = "force-dynamic";

export async function POST(req: Request): Promise<Response> {
  return handleCheckoutPOST(req);
}
