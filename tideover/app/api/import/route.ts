import { NextResponse } from "next/server";
import { z } from "zod";
import { importBackerRows, IMPORT_ROW_CAP } from "@/lib/import";

/**
 * POST /api/import (ADR-0010, task W3) — operator-side backer-list import.
 * Client parses the CSV in the browser and POSTs only the mapped rows here.
 * Gated by the operator-auth middleware (matcher includes /api/import) so it
 * fails closed with DEMO_MODE=false. Bounded to IMPORT_ROW_CAP rows.
 */
const Row = z.object({
  firstName: z.string(),
  email: z.string(),
  group: z.enum(["ks-backer", "late-pledge", "new-preorder"]).optional(),
  orderValueCents: z.number().int().nonnegative().optional(),
  orderDate: z.string().optional(),
  disclosedEtaValue: z.string().optional(),
  sourceKey: z.string().optional(),
  etaSource: z.enum(["campaign-page", "checkout"]).optional(),
});

const Body = z.object({
  merchantId: z.string().min(1),
  rows: z.array(Row).max(IMPORT_ROW_CAP),
});

export async function POST(req: Request) {
  const parsed = Body.safeParse(await req.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json({ error: "invalid body", issues: parsed.error.issues }, { status: 400 });
  }
  try {
    const result = await importBackerRows(parsed.data.merchantId, parsed.data.rows);
    return NextResponse.json(result);
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "import failed" },
      { status: 400 },
    );
  }
}
