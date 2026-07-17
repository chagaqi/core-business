import { NextResponse } from "next/server";
import { getRepositories } from "@/lib/repositories";
import { cronAuthorized } from "@/lib/cron-auth";
import { trialState } from "@/lib/trial";
import { trialEmail } from "@/lib/trial-emails";
import { sendEmail } from "@/lib/email";

/**
 * GET /api/cron/trial-reminders — the daily trial-lifecycle mailer (ADR-0022).
 * Vercel Cron hits it; NOT in the middleware matcher (self-auths on CRON_SECRET,
 * like sweep-outcomes). For each trialing merchant it sends the single most-urgent
 * unsent reminder (lib/trial.ts drives the schedule: midpoint → ending → ended)
 * to the owner's captured email, and records it so it never double-sends. A send
 * that fails (unconfigured or transient) is NOT recorded, so it retries next run.
 */
export const dynamic = "force-dynamic";

export async function GET(req: Request): Promise<Response> {
  if (!cronAuthorized(req)) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  const repos = getRepositories();
  const now = new Date();
  const merchants = await repos.merchants.list();

  let sent = 0;
  let skipped = 0;
  for (const merchant of merchants) {
    const state = trialState(merchant, now);
    if (!state.dueReminder) continue;
    if (!merchant.ownerEmail) {
      // Owner email not captured yet (they haven't logged in since the field
      // shipped). Skip without recording, so the reminder still fires once we have it.
      skipped += 1;
      continue;
    }

    const email = trialEmail(state.dueReminder, { merchantName: merchant.name, daysLeft: state.daysLeft });
    const result = await sendEmail({ to: merchant.ownerEmail, subject: email.subject, html: email.html });

    if (result.sent) {
      await repos.merchants.update(merchant.id, {
        trialRemindersSent: [...(merchant.trialRemindersSent ?? []), state.dueReminder],
      });
      sent += 1;
    } else {
      console.log(
        JSON.stringify({
          event: "cron.trial-reminders.send-skipped",
          merchantId: merchant.id,
          reminder: state.dueReminder,
          reason: result.reason,
        }),
      );
      skipped += 1;
    }
  }

  return NextResponse.json({ merchants: merchants.length, sent, skipped });
}
