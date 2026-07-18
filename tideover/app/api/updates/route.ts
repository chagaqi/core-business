import { NextResponse } from "next/server";
import { z } from "zod";
import { getRepositories } from "@/lib/repositories";
import { containsHardDate } from "@/lib/proof";
import { withApiErrorHandling } from "@/lib/api-handler";

/**
 * POST /api/updates — post one merchant "workshop update" (ADR-0009, task U2).
 * It fans out to every waiting backer's status page and becomes a
 * copy-to-Kickstarter draft in the composer. Operator-only surface (behind the
 * F2 gate via middleware). Text-only + an OPTIONAL externally-hosted image URL.
 *
 * PROOF-ONLY GUARD: the text is run through the hard-date discipline
 * (containsHardDate, the predicate assertNoHardDate throws on) BEFORE it is
 * saved — a workshop update must never promise a hard ship date. A hard date is
 * rejected 422 with a clear message rather than reaching a customer.
 */
const Body = z.object({
  merchantId: z.string().min(1),
  text: z.string().trim().min(1, "Write something before posting.").max(2000),
  // http(s) only — the update image is an externally-hosted URL (ADR-0009); a
  // data:/blob:/javascript: scheme would defeat the no-blob-storage contract.
  imageUrl: z
    .string()
    .trim()
    .url()
    .refine((u) => /^https?:\/\//i.test(u), "Image must be an http(s) URL.")
    .optional(),
});

async function handlePOST(req: Request) {
  const parsed = Body.safeParse(await req.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues[0]?.message ?? "invalid body", issues: parsed.error.issues },
      { status: 400 },
    );
  }
  const { merchantId, text, imageUrl } = parsed.data;

  const repos = getRepositories();
  const merchant = await repos.merchants.findById(merchantId);
  if (!merchant) return NextResponse.json({ error: "unknown merchant" }, { status: 404 });

  // Proof-only: a workshop update must never promise a hard delivery date.
  if (containsHardDate(text)) {
    return NextResponse.json(
      {
        error:
          "A workshop update can't promise a hard ship date. Describe the progress or use a confidence band (e.g. \"in a couple of weeks\") instead.",
      },
      { status: 422 },
    );
  }

  const update = await repos.merchantUpdates.create({
    merchantId,
    text,
    createdAt: new Date().toISOString(),
    ...(imageUrl ? { imageUrl } : {}),
  });

  return NextResponse.json({ status: "posted", update });
}

export const POST = withApiErrorHandling("/api/updates", handlePOST);
