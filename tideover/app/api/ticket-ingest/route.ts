import { NextResponse } from "next/server";
import { z } from "zod";
import { getAdapter } from "@/lib/channel-adapters/registry";
import { getRepositories } from "@/lib/repositories";
import { ingestTicket } from "@/lib/service";
import type { Channel } from "@/lib/types";

/**
 * POST /api/ticket-ingest?channel=<channel>[&merchant=<id>] — the webhook entry
 * point. The channel comes from the URL (configured per vendor webhook), never
 * from the unverified body. Order of operations is security-critical:
 *
 *   read raw body ONCE → verify signature over the RAW bytes → JSON.parse →
 *   validate/normalize → drop-at-edge tag filter → dedupe → persist + draft.
 *
 * Vendor timeouts (Gorgias aborts webhook deliveries at ~5s): processing stays
 * inline but bounded — repository lookups + deterministic drafting, no network
 * calls in the default configuration — so the handler responds well inside the
 * window. If a live LLM drafter is ever wired in, move drafting behind a queue
 * and ack the webhook immediately.
 */

const CHANNELS: readonly string[] = ["mock", "gorgias", "tidio", "intercom", "email"];

/** Payload must be a JSON object; vendor field shapes are the adapter's job. */
const Body = z.object({}).passthrough();

/** Payload tags: vendors send ["vip"] or [{ name: "vip" }]; anything else = none. */
function extractTags(payload: Record<string, unknown>): string[] {
  const raw = payload.tags;
  if (!Array.isArray(raw)) return [];
  const out: string[] = [];
  for (const t of raw) {
    if (typeof t === "string") out.push(t);
    else if (t && typeof t === "object" && "name" in t) {
      const name = (t as { name: unknown }).name;
      if (typeof name === "string") out.push(name);
    }
  }
  return out;
}

export async function POST(req: Request) {
  const raw = await req.text();

  const url = new URL(req.url);
  const channelParam = url.searchParams.get("channel") ?? "mock";
  if (!CHANNELS.includes(channelParam)) {
    return NextResponse.json({ error: "unknown channel" }, { status: 400 });
  }
  const channel = channelParam as Channel;

  // The mock channel is the native demo surface. In live mode (ADR-0004:
  // DEMO_MODE=false) it would be an unauthenticated ingest backdoor, so it is
  // only accepted while the app runs in demo mode.
  if (channel === "mock" && process.env.DEMO_MODE === "false") {
    return NextResponse.json({ error: "forbidden" }, { status: 403 });
  }

  // Signature first, over the exact bytes received — never parse untrusted
  // input before authenticating it. No detail on failure.
  const verified = await getAdapter(channel).verifyWebhook(raw, req.headers);
  if (!verified) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  let json: unknown;
  try {
    json = JSON.parse(raw);
  } catch {
    return NextResponse.json({ error: "invalid JSON" }, { status: 400 });
  }
  const parsed = Body.safeParse(json);
  if (!parsed.success) {
    return NextResponse.json({ error: "invalid body" }, { status: 400 });
  }
  const payload: Record<string, unknown> = parsed.data;
  // Real vendor payloads carry no Tideover merchant id; it rides on the
  // webhook URL instead.
  //
  // SECURITY (W2): merchant identity from an unsigned query param + a single
  // global webhook secret allows cross-merchant replay. Before ANY real vendor
  // is wired, move to per-merchant ingest URL + per-merchant secret (task W2)
  // so merchant identity is bound to the signed material. Live adapters are
  // stubs until then.
  if (!payload.merchantId && url.searchParams.get("merchant")) {
    payload.merchantId = url.searchParams.get("merchant");
  }

  const adapter = getAdapter(channel);
  const normalized = adapter.normalizeInbound(payload);
  if (!normalized.merchantId) {
    return NextResponse.json({ error: "invalid body" }, { status: 400 });
  }

  // Drop-at-edge: when the merchant scopes ingest to presale tags, a tagged
  // payload with no match is acked but never persisted or drafted.
  const tags = extractTags(payload);
  if (tags.length > 0) {
    const merchant = await getRepositories().merchants.findById(normalized.merchantId);
    const allowed = merchant?.presaleTags;
    if (allowed && !tags.some((t) => allowed.includes(t))) {
      console.log(
        JSON.stringify({
          event: "ticket-ingest.discarded",
          merchantId: normalized.merchantId,
          channel,
          tags,
        }),
      );
      return NextResponse.json({ status: "discarded" });
    }
  }

  const result = await ingestTicket(normalized);
  if ("error" in result) {
    return NextResponse.json({ status: "error", error: result.error }, { status: 422 });
  }
  if (result.duplicate) {
    return NextResponse.json({ status: "duplicate", ticketId: result.ticket.id });
  }
  return NextResponse.json({
    status: "ingested",
    ticketId: result.ticket.id,
    draft: result.ticket.draft,
  });
}
