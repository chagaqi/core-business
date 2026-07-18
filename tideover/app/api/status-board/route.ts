import { NextResponse } from "next/server";
import { z } from "zod";
import { getRepositories } from "@/lib/repositories";
import { getDemoOperator } from "@/lib/auth";
import { InvalidStatusError, recordStatus } from "@/lib/status-board";
import { withApiErrorHandling } from "@/lib/api-handler";

/**
 * POST /api/status-board — post the merchant's CURRENT production status.
 *
 * This is the one write path behind /app/status. It is thin on purpose: every
 * rule that matters (headline required, hard-date lint on the customer-facing
 * text, a weeks band that is ordered and non-negative, scope cleaning, the
 * append-only history, the denormalized merchant-wide status) lives in
 * lib/status-board.recordStatus, so a status typed by a human and a status pulled
 * from a merchant's own production sheet go through the SAME door and can never
 * say two different things to a customer.
 *
 * Operator-only surface (behind the auth gate via middleware's /api/* matcher).
 * `updatedBy` is taken from the SESSION, never from the request body — the board
 * is the evidence trail for "what did you tell this backer, and when", and a
 * client-supplied author would make it worthless.
 */
const Scope = z.object({
  campaignName: z.string().trim().max(120).optional(),
  wave: z.string().trim().max(120).optional(),
  region: z.string().trim().max(120).optional(),
});

const Body = z.object({
  merchantId: z.string().min(1),
  stageKey: z.enum(["sourcing", "tooling", "production", "qc", "freight", "dispatch", "overrun"]),
  headline: z.string().trim().min(1, "Say what is physically happening right now.").max(280),
  detail: z.string().trim().max(2000).optional(),
  minWeeks: z.number().int().min(0).max(260),
  maxWeeks: z.number().int().min(0).max(260),
  scope: Scope.optional(),
});

async function handlePOST(req: Request) {
  const parsed = Body.safeParse(await req.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues[0]?.message ?? "invalid body", issues: parsed.error.issues },
      { status: 400 },
    );
  }
  const { merchantId, stageKey, headline, detail, minWeeks, maxWeeks, scope } = parsed.data;

  const repos = getRepositories();
  const merchant = await repos.merchants.findById(merchantId);
  if (!merchant) return NextResponse.json({ error: "unknown merchant" }, { status: 404 });

  try {
    const entry = await recordStatus({
      merchantId,
      stageKey,
      headline,
      ...(detail ? { detail } : {}),
      confidenceBand: { minWeeks, maxWeeks },
      ...(scope ? { scope } : {}),
      updatedBy: getDemoOperator(merchant.name),
      source: "manual",
    });
    return NextResponse.json({ status: "posted", entry });
  } catch (err) {
    // A refused status is a PRODUCT decision (a hard date, an empty headline, an
    // inverted band), not a server fault — 422 with the reason the operator needs.
    if (err instanceof InvalidStatusError) {
      return NextResponse.json({ error: err.message }, { status: 422 });
    }
    throw err;
  }
}

export const POST = withApiErrorHandling("/api/status-board", handlePOST);
