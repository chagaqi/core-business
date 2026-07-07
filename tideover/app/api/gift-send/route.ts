import { NextResponse } from "next/server";
import { z } from "zod";
import { authorizeGiftSend } from "@/lib/gift-send";

/**
 * POST /api/gift-send — one-click gift dispatch. Logs the gift against the
 * ticket (so it shows in the cockpit + saves log). Never auto-fires; only the
 * operator's click reaches here — and the server re-authorizes the gift against
 * the ticket's live risk band before writing the tag (UX-86), so a tampered or
 * stale client can't log a locked gift.
 */
const Body = z.object({ ticketId: z.string(), giftId: z.string() });

export async function POST(req: Request) {
  const parsed = Body.safeParse(await req.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: "invalid body" }, { status: 400 });

  const result = await authorizeGiftSend(parsed.data.ticketId, parsed.data.giftId);
  if (!result.ok)
    return NextResponse.json({ error: result.error, reason: result.reason }, { status: result.status });

  return NextResponse.json({ status: "sent", gift: result.gift, ticketId: result.ticketId });
}
