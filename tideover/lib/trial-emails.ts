import { renderEmailShell } from "@/lib/email";
import type { TrialReminderKey } from "@/lib/types";

/**
 * The trial-lifecycle emails (ADR-0022). Sent to the ACCOUNT OWNER — welcome at
 * signup, the rest by the daily cron (lib/trial.ts drives the schedule). Copy is
 * customer-facing: proof-only (no fabricated metrics, no promised dates), tight,
 * and warm. Flagged for Dylan's voice review like the pricing copy.
 */

const APP = process.env.NEXT_PUBLIC_REAL_APP_HOST ? `https://${process.env.NEXT_PUBLIC_REAL_APP_HOST}` : "https://app.tideover.app";
// The in-app billing page is where a returning merchant actually picks a paid plan
// (Stripe Checkout, session-gated) — not the public marketing /pricing page.
const BILLING = `${APP}/app/billing`;

export interface TrialEmail {
  subject: string;
  html: string;
}

function days(n: number): string {
  return `${n} day${n === 1 ? "" : "s"}`;
}

function button(href: string, label: string): string {
  return `<a href="${href}" style="display:inline-block;margin-top:10px;background:#D9762F;color:#ffffff;text-decoration:none;font-weight:600;font-size:14px;padding:11px 20px;border-radius:9px">${label}</a>`;
}

function shell(bodyHtml: string, preheader: string): string {
  return renderEmailShell(`${bodyHtml}<p style="margin:18px 0 0">— Dylan, Tideover</p>`, { preheader });
}

/**
 * Build the email for a lifecycle milestone. `welcome` ignores daysLeft; the cron
 * milestones (`midpoint`, `ending`, `ended`) use it for the countdown line.
 */
export function trialEmail(kind: TrialReminderKey, ctx: { merchantName: string; daysLeft: number }): TrialEmail {
  const name = ctx.merchantName;
  const left = days(ctx.daysLeft);

  switch (kind) {
    case "welcome":
      return {
        subject: "Your Tideover trial is live — 14 days, no card",
        html: shell(
          `<p style="margin:0 0 12px">Welcome, ${name}. Your workspace is open for the next 14 days, and there's no card on file — nothing bills automatically.</p>
<p style="margin:0 0 4px">The fastest way to feel it work: import your backer list, then open the queue. The at-risk buyers are already sorted to the top with a drafted reply waiting for your approval.</p>
${button(APP, "Open my queue")}`,
          "14 days, no card. Import your backers and work the queue.",
        ),
      };
    case "midpoint":
      return {
        subject: "Halfway through your Tideover trial",
        html: shell(
          `<p style="margin:0 0 12px">You're halfway in, ${name} — ${left} left on the trial. Still no card on file.</p>
<p style="margin:0 0 4px">If you haven't yet: approve a draft and post one production-status update. That's the loop that keeps backers calm without you writing every reply.</p>
${button(APP, "Back to the queue")}`,
          `${left} left on your trial.`,
        ),
      };
    case "ending":
      return {
        subject: `${left} left on your Tideover trial`,
        html: shell(
          `<p style="margin:0 0 12px">Your trial ends in ${left}, ${name}. Nothing charges automatically — there's no card on file — so if you do nothing, the workspace just pauses and your data stays put.</p>
<p style="margin:0 0 4px">To keep the queue running without a break, pick a plan whenever you're ready.</p>
${button(BILLING, "See the plans")}`,
          `${left} left — pick a plan to keep the queue running.`,
        ),
      };
    case "ended":
      return {
        subject: "Your Tideover trial has ended",
        html: shell(
          `<p style="margin:0 0 12px">Your trial has ended, ${name}. Your workspace is read-only for now, your data is exactly where you left it, and nothing was charged.</p>
<p style="margin:0 0 4px">Pick a plan whenever you want to pick back up — you'll land right where you stopped.</p>
${button(BILLING, "Choose a plan")}`,
          "Your data is safe and nothing was charged. Pick a plan to continue.",
        ),
      };
    default: {
      const _exhaustive: never = kind;
      return _exhaustive;
    }
  }
}
