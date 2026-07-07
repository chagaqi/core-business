import { z } from "zod";

/**
 * Onboarding request validation, kept out of the route handler so it can be
 * unit-tested without importing `next/server`. The `/api/onboarding` route and
 * the wizard's server contract both derive from this single schema.
 */

/** A merchant-authored goodwill gift (UX-86). costCents capped at $500. */
export const GiftInputSchema = z.object({
  name: z.string().min(1),
  kind: z.enum([
    "early-access",
    "founder-note",
    "priority-dispatch",
    "digital-perk",
    "next-order-credit",
  ]),
  tier: z.enum(["base", "mid", "full"]),
  costCents: z.number().int().min(0).max(50000),
  perceivedValueCents: z.number().int().min(0),
});

const StageSchema = z.object({
  key: z.enum(["sourcing", "tooling", "production", "qc", "freight", "dispatch"]),
  label: z.string(),
  from: z.number(),
  to: z.number(),
  blurb: z.string(),
});

export const OnboardingBodySchema = z.object({
  brandName: z.string().min(1),
  voice: z.string().default(""),
  tone: z.array(z.string()).default([]),
  banned: z.array(z.string()).default([]),
  signoff: z.string().default(""),
  helpdesk: z.enum(["mock", "gorgias", "tidio", "intercom", "email"]).default("email"),
  preorderApp: z.string().default(""),
  windowMinDays: z.number().default(90),
  windowMaxDays: z.number().default(120),
  stages: z.array(StageSchema).default([]),
  worstStory: z.string().optional(),
  // Tolerant gate: absent/empty passes (the write path substitutes the default
  // catalog); a non-empty catalog must carry >=3 gifts AND >=1 base gift — the
  // same rule the wizard enforces client-side before advancing/submitting.
  gifts: z
    .array(GiftInputSchema)
    .default([])
    .superRefine((gifts, ctx) => {
      if (gifts.length === 0) return;
      if (gifts.length < 3) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: "Add at least 3 goodwill gifts.",
        });
      }
      if (!gifts.some((g) => g.tier === "base")) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: "Include at least one Base gift (every waiting customer).",
        });
      }
    }),
});

export type OnboardingBody = z.infer<typeof OnboardingBodySchema>;
