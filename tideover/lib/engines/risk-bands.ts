import type { RiskBandKey } from "@/lib/types";

/**
 * Risk-band cutoffs — the SINGLE source of truth for the score→band mapping,
 * shared by the refund-risk engine (band drives the honest dashboard at-risk
 * count + GMV-in-dispute) and the gift unlock matrix (band gates which gift
 * tiers are available). Living here — a leaf module that imports only types —
 * keeps refund-risk.ts and gift.ts from importing each other in a cycle.
 *
 *   score ≥ atRisk → "at_risk";  ≥ watch → "watch";  else "standard".
 */
export const RISK_BAND_THRESHOLDS = { atRisk: 75, watch: 50 } as const;

export function bandForScore(
  score: number,
  thresholds: { atRisk: number; watch: number } = RISK_BAND_THRESHOLDS,
): RiskBandKey {
  if (score >= thresholds.atRisk) return "at_risk";
  if (score >= thresholds.watch) return "watch";
  return "standard";
}
