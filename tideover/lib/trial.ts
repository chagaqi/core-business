import type { Merchant, TrialReminderKey } from "@/lib/types";

/**
 * The 14-day, no-card free trial (ADR-0022). The clock is DERIVED from
 * `merchant.createdAt` — no stored deadline to drift — and drives two things: a
 * countdown surface in /app (slice: UI) and the daily reminder cron
 * (/api/cron/trial-reminders). At expiry the merchant soft-locks (read-only, data
 * kept, nothing auto-bills — there is no card on file), which is enforcement built
 * on top of `phase === "expired"`, not in this module.
 *
 * Pure + deterministic: `now` is always injected so the eval, the cron, and the
 * tests all agree.
 */

export const TRIAL_DAYS = 14;
const DAY_MS = 24 * 60 * 60 * 1000;

export type TrialPhase =
  /** not a trialing merchant: demo, legacy (no owner), or already on a plan. */
  | "not-applicable"
  | "active"
  | "ending-soon"
  | "expired";

export interface TrialState {
  phase: TrialPhase;
  /** whole days remaining (0 once expired). Meaningless when not-applicable. */
  daysLeft: number;
  /** trial deadline, or null when not-applicable. */
  endsAt: Date | null;
  /**
   * The most-urgent lifecycle reminder that is due NOW and not yet sent, or null.
   * The cron sends this one and records it; the next day surfaces the next one.
   */
  dueReminder: TrialReminderKey | null;
}

/**
 * Cron-driven reminders, most-urgent first. `welcome` is sent synchronously at
 * signup (not here). Each fires once daysLeft has fallen to/below its threshold.
 */
const REMINDERS: { key: Exclude<TrialReminderKey, "welcome">; daysLeftAtMost: number }[] = [
  { key: "ended", daysLeftAtMost: 0 },
  { key: "ending", daysLeftAtMost: 2 },
  { key: "midpoint", daysLeftAtMost: 7 },
];

/** Is this a merchant whose free trial clock applies at all? */
function isTrialing(m: Merchant): boolean {
  if (m.isDemo) return false; // the open demo is never trial-gated
  if (!m.ownerSub) return false; // legacy / password-mode records carry no trial
  if (m.plan) return false; // picked a paid plan → a customer, not a trialer
  if (m.subscriptionStatus === "active" || m.subscriptionStatus === "past_due") return false;
  return true; // subscriptionStatus null or "trialing"
}

export function trialState(merchant: Merchant, now: Date): TrialState {
  if (!isTrialing(merchant)) {
    return { phase: "not-applicable", daysLeft: 0, endsAt: null, dueReminder: null };
  }

  const endsAt = new Date(new Date(merchant.createdAt).getTime() + TRIAL_DAYS * DAY_MS);
  const daysLeft = Math.max(0, Math.ceil((endsAt.getTime() - now.getTime()) / DAY_MS));

  const phase: TrialPhase = endsAt.getTime() <= now.getTime() ? "expired" : daysLeft <= 2 ? "ending-soon" : "active";

  const sent = new Set(merchant.trialRemindersSent ?? []);
  const dueReminder = REMINDERS.find((r) => daysLeft <= r.daysLeftAtMost && !sent.has(r.key))?.key ?? null;

  return { phase, daysLeft, endsAt, dueReminder };
}

/** The soft-lock predicate for the enforcement slice: an expired trial with no plan. */
export function isSoftLocked(merchant: Merchant, now: Date): boolean {
  return trialState(merchant, now).phase === "expired";
}
