import { NextResponse } from "next/server";
import { getRepositories } from "@/lib/repositories";
import { scoreFeed } from "@/lib/engines/social-signal";

/** GET /api/social-signal-feed?merchantId= — scored + flagged social posts. */
export async function GET(req: Request) {
  const merchantId = new URL(req.url).searchParams.get("merchantId");
  if (!merchantId) return NextResponse.json({ error: "merchantId required" }, { status: 400 });
  const repos = getRepositories();
  const merchant = await repos.merchants.findById(merchantId);
  if (!merchant) return NextResponse.json({ error: "merchant not found" }, { status: 404 });
  const posts = await repos.social.listByMerchant(merchantId);
  const scored = scoreFeed(posts, merchant);
  return NextResponse.json({
    posts: scored,
    flaggedCount: scored.filter((p) => p.flagged).length,
  });
}
