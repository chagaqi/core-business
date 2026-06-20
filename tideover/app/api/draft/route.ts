import { NextResponse } from "next/server";
import { z } from "zod";
import { regenerateDraft } from "@/lib/service";

/** POST /api/draft — (re)generate the engine draft for a ticket. Idempotent. */
const Body = z.object({ ticketId: z.string(), regenerate: z.boolean().optional() });

export async function POST(req: Request) {
  const parsed = Body.safeParse(await req.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json({ error: "invalid body" }, { status: 400 });
  }
  const ticket = await regenerateDraft(parsed.data.ticketId);
  if (!ticket) return NextResponse.json({ error: "ticket not found" }, { status: 404 });
  return NextResponse.json({ draft: ticket.draft });
}
