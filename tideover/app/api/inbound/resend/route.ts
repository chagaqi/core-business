import { handleResendInbound } from "@/lib/inbound-route";

/**
 * POST /api/inbound/resend — Resend inbound webhook (ADR-0008). The handler
 * lives in @/lib/inbound-route so its body-fetch seam is unit-testable and this
 * route file exports only its HTTP verb (a Next App Router requirement).
 */
export function POST(req: Request): Promise<Response> {
  return handleResendInbound(req);
}
