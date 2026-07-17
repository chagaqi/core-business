import { handlePortalPOST } from "@/lib/billing-route";

// Operator-gated (matcher: /api/billing/:path*) + owner-checked. Opens the
// Stripe-hosted Billing Portal for an existing customer.
export const dynamic = "force-dynamic";

export async function POST(): Promise<Response> {
  return handlePortalPOST();
}
