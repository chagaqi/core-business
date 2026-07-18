import { NextResponse } from "next/server";
import { z } from "zod";
import { promoteVariant } from "@/lib/service";
import { withApiErrorHandling } from "@/lib/api-handler";

/**
 * POST /api/variants/promote — operator-promoted variants (ADR-0014, E4). After a
 * meaningfully-edited send, the operator confirms saving the edit as a tracked
 * ScriptVariant. The service resolves the draft's parent variant, inherits its
 * slot, and creates a { source: "operator-promoted", parentVariantId } variant
 * that then competes in /app/scripts. Operator-confirmed — never auto-created.
 */
const Body = z.object({ ticketId: z.string(), text: z.string() });

async function handlePOST(req: Request) {
  const parsed = Body.safeParse(await req.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json({ error: "invalid body" }, { status: 400 });
  }
  const result = await promoteVariant(parsed.data.ticketId, parsed.data.text);
  if ("error" in result) {
    return NextResponse.json({ error: result.error }, { status: 422 });
  }
  return NextResponse.json({ status: "promoted", variantId: result.variant.id });
}

export const POST = withApiErrorHandling("/api/variants/promote", handlePOST);
