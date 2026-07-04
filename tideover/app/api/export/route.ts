import { NextResponse } from "next/server";
import { getRepositories } from "@/lib/repositories";
import { assembleMerchantExport } from "@/lib/export";

/**
 * GET /api/export?merchant=<id> — "Export everything" (task G6). Downloads ALL
 * of one merchant's real data as one open JSON file, so a prospect can see their
 * data is portable and theirs (no lock-in).
 *
 * OPERATOR-GATED: this exposes a merchant's full dataset, so it is listed in
 * middleware.ts's matcher and fails closed (401) without an operator session
 * when DEMO_MODE=false — exactly like /api/orders and /api/draft.
 *
 * The assembly + secret-stripping lives in lib/export.ts (unit-testable). This
 * route only resolves the merchant and shapes the HTTP download.
 */
export const dynamic = "force-dynamic";

export async function GET(req: Request) {
  const repos = getRepositories();
  const merchants = await repos.merchants.list();
  if (merchants.length === 0) {
    return NextResponse.json({ error: "no merchants" }, { status: 404 });
  }

  // Default to the first merchant when none is named (like the /app pages). A
  // named-but-unknown merchant falls through to assembleMerchantExport → null →
  // 404, so we never silently serve a different merchant's data.
  const requested = new URL(req.url).searchParams.get("merchant");
  const merchantId = requested ?? merchants[0].id;

  const data = await assembleMerchantExport(merchantId);
  if (!data) {
    return NextResponse.json({ error: "merchant not found" }, { status: 404 });
  }

  const date = data.generatedAt.slice(0, 10); // YYYY-MM-DD
  const filename = `tideover-export-${data.exportedFor.slug}-${date}.json`;

  return new NextResponse(JSON.stringify(data, null, 2), {
    status: 200,
    headers: {
      "Content-Type": "application/json; charset=utf-8",
      "Content-Disposition": `attachment; filename="${filename}"`,
      "Cache-Control": "no-store",
    },
  });
}
