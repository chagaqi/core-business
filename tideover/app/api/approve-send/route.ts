import { NextResponse } from "next/server";
import { z } from "zod";
import { approveSend } from "@/lib/service";
import { assertNoHardDate } from "@/lib/proof";

/**
 * POST /api/approve-send — human approval gate. The (possibly edited) reply is
 * checked for hard dates (proof-only) then sent through the channel adapter.
 * No novel reply is ever sent without passing through here.
 */
const Body = z.object({
  ticketId: z.string(),
  approvedText: z.string().optional(),
  channel: z.enum(["mock", "gorgias", "tidio", "intercom", "email"]).optional(),
});

export async function POST(req: Request) {
  const parsed = Body.safeParse(await req.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json({ error: "invalid body" }, { status: 400 });
  }
  if (parsed.data.approvedText) {
    try {
      assertNoHardDate(parsed.data.approvedText);
    } catch (e) {
      // Structured reason (ADR-0014, E4) so the cockpit can explain the block
      // precisely and mirror it on the send button. The enforcement is real: a
      // hard date is physically un-sendable — this is the throw, surfaced.
      return NextResponse.json(
        { error: (e as Error).message, failedCheck: "hard_date" },
        { status: 422 },
      );
    }
  }
  const result = await approveSend(parsed.data.ticketId, parsed.data.approvedText, parsed.data.channel);
  if ("error" in result) {
    return NextResponse.json({ error: result.error }, { status: 422 });
  }
  return NextResponse.json({
    status: "sent",
    sentAt: result.ticket.sent?.sentAt,
    externalId: result.ticket.sent?.externalId,
    firstResponseSec: result.ticket.firstResponseSec,
    // The delivered reply WITH the customer's status link appended — the exact
    // text the cockpit copies to the clipboard for the operator to paste.
    sentText: result.ticket.sent?.text,
    // true when this call didn't perform the send (already delivered / lost a
    // concurrent race). The cockpit still copies + confirms, but doesn't re-send.
    alreadySent: result.alreadySent,
    // E4: measured operator edit + whether it clears the promote threshold (with a
    // real parent variant), so the cockpit can offer "save this edit as a variant".
    editedRatio: result.editedRatio,
    canPromote: result.canPromote,
  });
}
