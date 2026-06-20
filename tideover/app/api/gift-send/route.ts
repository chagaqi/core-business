import { NextResponse } from "next/server";
import { z } from "zod";
import { getRepositories } from "@/lib/repositories";

/**
 * POST /api/gift-send — one-click gift dispatch. Logs the gift against the
 * ticket (so it shows in the cockpit + saves log). Never auto-fires; only the
 * operator's click reaches here.
 */
const Body = z.object({ ticketId: z.string(), giftId: z.string() });

export async function POST(req: Request) {
  const parsed = Body.safeParse(await req.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: "invalid body" }, { status: 400 });
  const repos = getRepositories();
  const [ticket, gift] = await Promise.all([
    repos.tickets.findById(parsed.data.ticketId),
    repos.gifts.findById(parsed.data.giftId),
  ]);
  if (!ticket || !gift) return NextResponse.json({ error: "ticket or gift not found" }, { status: 404 });

  const tags = Array.from(new Set([...ticket.tags, `gift-sent:${gift.kind}`]));
  await repos.tickets.update(ticket.id, { tags });
  return NextResponse.json({ status: "sent", gift: gift.name, ticketId: ticket.id });
}
