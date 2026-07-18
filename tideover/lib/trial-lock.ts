import { NextResponse } from "next/server";
import { isSoftLocked } from "@/lib/trial";
import type { Merchant } from "@/lib/types";

/**
 * The one place the trial/subscription soft-lock is expressed (ADR-0022). A route
 * resolves the merchant its request actually targets and passes it here; a
 * soft-locked (expired-trial or canceled) merchant gets a 402, otherwise null to
 * proceed. Centralized so approve-send, import, and any future mutation route
 * enforce identical semantics — and so the check is against the RIGHT merchant,
 * not an arbitrary first-in-list pick.
 */
export function trialLockResponse(merchant: Merchant | null | undefined, action: string): NextResponse | null {
  if (merchant && isSoftLocked(merchant, new Date())) {
    return NextResponse.json(
      { error: `Your access has paused — choose a plan to ${action}.`, failedCheck: "trial_expired" },
      { status: 402 },
    );
  }
  return null;
}
