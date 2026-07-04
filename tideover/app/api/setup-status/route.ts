import { NextResponse } from "next/server";
import { getRepositories } from "@/lib/repositories";
import { getSetupChecklist } from "@/lib/service";

/**
 * GET /api/setup-status?merchant=<id> — the derived setup progress summary
 * ({completed, total, allDone}) that powers the Sidebar's "N/5" badge (task U4).
 *
 * Read-only and fully derived (see lib/setup.ts): it computes the checklist from
 * the merchant's real state and returns only the counts — no items, no PII. Like
 * the other operator surfaces it defaults to the first merchant when none is
 * named, and it is listed in middleware.ts so it fails closed (401) without an
 * operator session when DEMO_MODE=false.
 */
export const dynamic = "force-dynamic";

export async function GET(req: Request) {
  const repos = getRepositories();
  const merchants = await repos.merchants.list();
  if (merchants.length === 0) {
    return NextResponse.json({ error: "no merchants" }, { status: 404 });
  }
  const requested = new URL(req.url).searchParams.get("merchant");
  const merchantId =
    requested && merchants.some((m) => m.id === requested) ? requested : merchants[0].id;

  const checklist = await getSetupChecklist(merchantId);
  if (!checklist) {
    return NextResponse.json({ error: "merchant not found" }, { status: 404 });
  }
  return NextResponse.json(
    { completed: checklist.completed, total: checklist.total, allDone: checklist.allDone },
    { headers: { "Cache-Control": "no-store" } },
  );
}
