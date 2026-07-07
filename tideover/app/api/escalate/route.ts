import { NextResponse } from "next/server";
import { z } from "zod";
import { escalateTicket } from "@/lib/service";
import { getDemoOperator } from "@/lib/auth";

/**
 * POST /api/escalate — persist (or clear) an operator's follow-up self-flag on a
 * ticket (UX-10 / EN-25). Replaces the old local-only React toggle that vanished
 * on refresh: this writes an `escalated-by:{operator}:{iso}` tag through the
 * repository seam so the flag survives a reload and surfaces on the queue row +
 * dashboard status strip.
 *
 * This is a SELF-FLAG, not a manager notification — nothing is dispatched to
 * anyone. Only the operator's own click reaches here.
 */
const Body = z.object({
  ticketId: z.string(),
  /** optional short note kept on the tag. */
  reason: z.string().max(200).optional(),
  /** true clears the flag (un-escalate). */
  undo: z.boolean().optional(),
});

export async function POST(req: Request) {
  const parsed = Body.safeParse(await req.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: "invalid body" }, { status: 400 });

  const result = await escalateTicket(parsed.data.ticketId, getDemoOperator(), {
    reason: parsed.data.reason,
    undo: parsed.data.undo,
  });
  if ("error" in result) return NextResponse.json({ error: result.error }, { status: 404 });

  return NextResponse.json({ escalated: result.escalated, ticketId: result.ticket.id });
}
