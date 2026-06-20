import type { DayStageKey, Merchant, Order, Sentiment } from "@/lib/types";
import { computeTimeline, stageBlurb } from "@/lib/time";
import { assertNoHardDate } from "@/lib/proof";

/**
 * ENGINE 1 — Stage-Aware Reassurance.
 *
 * Maps an order's days-in-wait to a day-stage (7/30/60/89), selects the
 * merchant's playbook template (stage-specific override or base), and merges in
 * the order's honest confidence band + production-stage blurb in the merchant's
 * voice. Output is a draft only — never auto-sent. The band is guaranteed to be
 * a relative window (assertNoHardDate), never a calendar date.
 */

export function dayStageFor(daysInWait: number): { key: DayStageKey; overdue: boolean } {
  if (daysInWait <= 7) return { key: "day-7", overdue: false };
  if (daysInWait <= 30) return { key: "day-30", overdue: false };
  if (daysInWait <= 60) return { key: "day-60", overdue: false };
  if (daysInWait <= 89) return { key: "day-89", overdue: false };
  return { key: "day-89", overdue: true };
}

export interface ReassuranceInput {
  order: Order;
  merchant: Merchant;
  firstName: string;
  sentiment: Sentiment;
  now?: Date;
}

export interface ReassuranceResult {
  draftText: string;
  confidenceBand: string;
  priority: "normal" | "escalated";
  stageKey: DayStageKey;
  overdue: boolean;
  managerNote: string | null;
}

function mergeFields(
  template: string,
  vars: { first_name: string; brand: string; eta_band: string; stage_blurb: string; next_window: string },
): string {
  return template
    .replaceAll("{first_name}", vars.first_name)
    .replaceAll("{brand}", vars.brand)
    .replaceAll("{eta_band}", vars.eta_band)
    .replaceAll("{stage_blurb}", vars.stage_blurb)
    .replaceAll("{next_window}", vars.next_window);
}

function stripBanned(text: string, banned: string[]): string {
  let out = text;
  for (const word of banned) {
    const re = new RegExp(`\\b${word.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}\\b`, "gi");
    out = out.replace(re, "").replace(/\s{2,}/g, " ");
  }
  return out.trim();
}

export function draftReassurance(input: ReassuranceInput): ReassuranceResult {
  const { order, merchant, firstName, sentiment } = input;
  const now = input.now ?? new Date();
  const timeline = computeTimeline(order, merchant, now);
  const { key: stageKey, overdue } = dayStageFor(timeline.daysInWait);

  const stage = merchant.playbook[stageKey];
  const template = stage.byStage[order.productionStage] ?? stage.base;

  // next reassurance window from the merchant's SLA (e.g. "the afternoon update")
  const nextWindow = "the next update window";

  // For overdue orders the confidence band is a full honest sentence, which reads
  // awkwardly when merged mid-template — substitute a grammatically-neutral phrase.
  const etaBand = timeline.overdue
    ? "as soon as it's ready, and I'll update you the moment it moves"
    : timeline.confidenceBand.replace(/^ships\s+/i, "");

  let draftText = mergeFields(template, {
    first_name: firstName,
    brand: merchant.name,
    eta_band: etaBand,
    stage_blurb: stageBlurb(merchant, order.productionStage),
    next_window: nextWindow,
  });
  draftText = stripBanned(draftText, merchant.brand.banned);
  draftText = `${draftText}\n\n${merchant.brand.signoff}`;

  // proof-only: a template must never resolve to a hard date.
  assertNoHardDate(draftText);

  const escalated = sentiment === "hostile" || sentiment === "chargeback-threat";

  return {
    draftText,
    confidenceBand: timeline.confidenceBand,
    priority: escalated ? "escalated" : "normal",
    stageKey,
    overdue,
    managerNote: escalated
      ? "High-risk customer — prioritize human approval this window before it routes to a dispute."
      : null,
  };
}
