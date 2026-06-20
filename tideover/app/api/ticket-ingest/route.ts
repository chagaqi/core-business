import { NextResponse } from "next/server";
import { z } from "zod";
import { getAdapter } from "@/lib/channel-adapters/registry";
import { ingestTicket } from "@/lib/service";
import type { Channel } from "@/lib/types";

/**
 * POST /api/ticket-ingest — the webhook entry point. Verifies the channel
 * signature, normalizes the payload, matches an order, persists the ticket, and
 * auto-runs the engines to attach a draft + risk + gift. Returns the new ticket.
 */
const Body = z.object({
  merchantId: z.string(),
  channel: z.enum(["mock", "gorgias", "tidio", "intercom", "email"]).default("mock"),
  externalId: z.string().nullish(),
  customerEmail: z.string().default(""),
  orderId: z.string().nullish(),
  subject: z.string().default(""),
  body: z.string().default(""),
});

export async function POST(req: Request) {
  let json: unknown;
  try {
    json = await req.clone().json();
  } catch {
    return NextResponse.json({ error: "invalid JSON" }, { status: 400 });
  }
  const parsed = Body.safeParse(json);
  if (!parsed.success) {
    return NextResponse.json({ error: "invalid body", issues: parsed.error.issues }, { status: 400 });
  }

  const channel = parsed.data.channel as Channel;
  const adapter = getAdapter(channel);
  const ok = await adapter.verifyWebhook(req);
  if (!ok && channel !== "mock") {
    return NextResponse.json({ error: "webhook signature verification failed" }, { status: 401 });
  }

  const normalized = adapter.normalizeInbound(parsed.data);
  const result = await ingestTicket(normalized);
  if ("error" in result) {
    return NextResponse.json({ status: "error", error: result.error }, { status: 422 });
  }
  return NextResponse.json({
    status: "ingested",
    ticketId: result.ticket.id,
    draft: result.ticket.draft,
  });
}
