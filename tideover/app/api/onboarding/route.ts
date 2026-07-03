import { NextResponse } from "next/server";
import { z } from "zod";
import { createMerchantFromIntake } from "@/lib/onboarding";

/** POST /api/onboarding — turn wizard answers into a merchant + preview scripts. */
const Stage = z.object({
  key: z.enum(["sourcing", "tooling", "production", "qc", "freight", "dispatch"]),
  label: z.string(),
  from: z.number(),
  to: z.number(),
  blurb: z.string(),
});

const Body = z.object({
  brandName: z.string().min(1),
  voice: z.string().default(""),
  tone: z.array(z.string()).default([]),
  banned: z.array(z.string()).default([]),
  signoff: z.string().default(""),
  helpdesk: z.enum(["mock", "gorgias", "tidio", "intercom", "email"]).default("email"),
  preorderApp: z.string().default(""),
  windowMinDays: z.number().default(90),
  windowMaxDays: z.number().default(120),
  stages: z.array(Stage).default([]),
  worstStory: z.string().optional(),
});

export async function POST(req: Request) {
  const parsed = Body.safeParse(await req.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json({ error: "invalid body", issues: parsed.error.issues }, { status: 400 });
  }
  const { merchant, previews } = await createMerchantFromIntake(parsed.data);
  return NextResponse.json({
    merchantId: merchant.id,
    slug: merchant.slug,
    previews,
  });
}
