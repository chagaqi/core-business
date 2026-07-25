import type { StageDef } from "@/lib/types";

/**
 * Client-safe onboarding defaults (SWAN SPRINT P2). The chat flow renders and
 * scales these in the browser, so they must not live in lib/onboarding.ts —
 * that module pulls getRepositories → next/headers, which cannot enter a
 * client bundle. lib/onboarding.ts imports the same constant from here: one
 * source of truth, two runtimes.
 */
export interface IntakeStage {
  key: StageDef["key"];
  label: string;
  from: number;
  to: number;
  blurb: string;
}

export const DEFAULT_STAGES: IntakeStage[] = [
  { key: "sourcing", label: "Sourcing", from: 0, to: 12, blurb: "components are being sourced" },
  { key: "tooling", label: "Tooling & sampling", from: 12, to: 32, blurb: "tooling and the first samples are underway" },
  { key: "production", label: "Production run", from: 32, to: 72, blurb: "your unit is on the production line" },
  { key: "qc", label: "QC & inspection", from: 72, to: 84, blurb: "your unit is going through quality control" },
  { key: "freight", label: "Freight", from: 84, to: 104, blurb: "your batch is in transit to the warehouse" },
  { key: "dispatch", label: "Pick, pack & dispatch", from: 104, to: 118, blurb: "your order is being packed for dispatch" },
];
