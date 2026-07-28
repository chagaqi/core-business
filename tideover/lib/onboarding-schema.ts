import { z } from "zod";
import { IMPORT_ROW_CAP } from "@/lib/import";

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

/**
 * A single mapped backer row STAGED client-side by the wizard's "Connect your
 * data" step. Submitted WITH the onboarding POST so create-merchant + import is
 * one atomic call (no two-phase "finish onboarding, then go connect your data").
 * Mirrors the /api/import Row contract and the csv `MappedRow` shape exactly.
 */
const ImportRowSchema = z.object({
  firstName: z.string(),
  email: z.string(),
  group: z.enum(["ks-backer", "late-pledge", "new-preorder"]).optional(),
  orderValueCents: z.number().int().nonnegative().optional(),
  orderDate: z.string().optional(),
  disclosedEtaValue: z.string().optional(),
  sourceKey: z.string().optional(),
  etaSource: z.enum(["campaign-page", "checkout"]).optional(),
});

export const OnboardingBodySchema = z.object({
  brandName: z.string().min(1),
  voice: z.string().default(""),
  tone: z.array(z.string()).default([]),
  banned: z.array(z.string()).default([]),
  signoff: z.string().default(""),
  helpdesk: z.enum(["mock", "gorgias", "tidio", "intercom", "email"]).default("email"),
  preorderApp: z.string().default(""),
  // Bounded (pre-merge review 2026-07-27): these reach Date arithmetic in
  // buildStagePreviews, and an unbounded value threw a RangeError AFTER the
  // merchant was persisted — a half-built workspace the user couldn't retry
  // into. Finite integer days only; the object-level refine below enforces max>min.
  windowMinDays: z.number().int().min(1).max(3650).default(90),
  windowMaxDays: z.number().int().min(2).max(3650).default(120),
  stages: z.array(StageSchema).default([]),
  // Backer rows staged in the wizard's "Connect your data" step, parsed
  // client-side and submitted here so create-merchant + import is ONE atomic
  // call. Absent/empty → no import (the server behaves exactly as before).
  // Bounded to the same row cap the standalone /api/import route enforces.
  // NOTE: the removed `worstStory` field (D-onboarding revamp) is intentionally
  // gone; old clients that still send it pass fine — zod strips unknown keys.
  importRows: z
    .array(ImportRowSchema)
    .max(
      IMPORT_ROW_CAP,
      `imports are capped at ${IMPORT_ROW_CAP.toLocaleString("en-US")} rows per file; split larger exports and import each part`,
    )
    .default([]),
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
}).superRefine((body, ctx) => {
  if (body.windowMaxDays <= body.windowMinDays) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      path: ["windowMaxDays"],
      message: "The longest wait must be greater than the shortest.",
    });
  }
});

export type OnboardingBody = z.infer<typeof OnboardingBodySchema>;
