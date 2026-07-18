import { getRepositories } from "@/lib/repositories";
import { getIngestHealth, type IngestEventKind, type IngestFailure } from "@/lib/ingest-health";
import type { Merchant } from "@/lib/types";

/**
 * Ingest status (ADR-0021, part 2). The one function that decides whether a
 * merchant's helpdesk connection is HEALTHY, or is quietly on fire.
 *
 * It exists because the old check had the polarity backwards. `integrationHealth`
 * (lib/setup.ts) returns `{ quiet: false }` when `lastInboundAt` is null — i.e.
 * a merchant from whom NOTHING HAS EVER ARRIVED is reported as fine, which is
 * exactly the merchant who is broken. Meanwhile the setup checklist flips
 * "helpdesk connected" to a green ✓ on the mere presence of a presale tag filter,
 * which the merchant sets in ONBOARDING, before a single ticket exists. So the
 * broken install looks, on every surface we own, indistinguishable from a good
 * one having a slow week. Four of ten simulated merchants died in that gap.
 *
 * The rule here is the inversion: once a merchant has told us they have a
 * helpdesk, SILENCE IS THE ALARM. Not-yet-connected is a calm "idle"; connected
 * and mute is red.
 *
 * PURITY: `deriveIngestStatus` is pure (clock injected) and is the whole policy.
 * `getIngestStatus` is the thin I/O wrapper other surfaces call — the cockpit can
 * badge itself with one import and no knowledge of any of this.
 */

/** How long a previously-delivering helpdesk may stay mute before it is an alarm. */
export const QUIET_ALARM_DAYS = 3;

export type IngestLevel =
  /** connected and delivering. */
  | "ok"
  /** delivering, but something needs attention (unmatched tickets, past rejects). */
  | "warn"
  /** NOTHING IS GETTING THROUGH. The queue is empty for a reason. */
  | "alarm"
  /** no helpdesk connected yet — nothing is wrong, there is just nothing wired. */
  | "idle";

export interface IngestStatus {
  level: IngestLevel;
  /** the loud line. */
  headline: string;
  /** what is actually happening, in the merchant's terms. */
  detail: string;
  /** the copy-paste fix, when there is one. */
  fix: string | null;
  /** true once the merchant has a tag rule set OR anything has hit their endpoint. */
  configured: boolean;
  lastInboundAt: string | null;
  /** whole days since the last real inbound; null when none has ever arrived. */
  quietDays: number | null;
  counts: Record<IngestEventKind, number>;
  lastFailure: IngestFailure | null;
  /** short badge text for the cockpit rail. Null when there is nothing to say. */
  badge: string | null;
}

export interface IngestStatusInput {
  isDemo: boolean;
  /** the merchant's drop-at-edge tag rule (set in onboarding). */
  presaleTags: readonly string[] | undefined;
  /** createdAt of the most recent REAL (non-mock) ticket, or null. DURABLE. */
  lastInboundAt: string | null;
  /** best-effort, process-local diagnosis (lib/ingest-health.ts). */
  health: ReturnType<typeof getIngestHealth>;
}

function daysSince(iso: string, now: Date): number {
  return Math.max(0, Math.floor((now.getTime() - new Date(iso).getTime()) / 86_400_000));
}

function plural(n: number, word: string): string {
  return `${n} ${word}${n === 1 ? "" : "s"}`;
}

/**
 * PURE. The order of the rules is the product decision: the loudest true thing
 * wins, and "nothing is arriving" outranks everything except an active rejection
 * (which explains WHY nothing is arriving).
 */
export function deriveIngestStatus(input: IngestStatusInput, now: Date = new Date()): IngestStatus {
  const { isDemo, presaleTags, lastInboundAt, health } = input;
  const { counts, lastFailure } = health;

  const configured = (presaleTags?.length ?? 0) > 0 || health.total > 0;
  const quietDays = lastInboundAt ? daysSince(lastInboundAt, now) : null;
  const delivered = counts.accepted + counts.duplicate + counts.unmatched;
  const everDelivered = lastInboundAt !== null || delivered > 0;
  const base = {
    configured,
    lastInboundAt,
    quietDays,
    counts,
    lastFailure,
  };

  // Demo data is static and synthetic — it must never raise a production alarm,
  // and it must never be dressed up as a live, healthy integration either.
  if (isDemo) {
    return {
      ...base,
      level: "idle",
      headline: "Sample data — ingest is simulated",
      detail:
        "This is the demo workspace. Its tickets are seeded, not delivered by a helpdesk, so there is no live connection to report on.",
      fix: null,
      badge: null,
    };
  }

  // (1) Actively being turned away. The most actionable state there is: we know
  // exactly who is knocking, and exactly why we are refusing them.
  const rejects = counts.rejected + counts.invalid;
  const rejectingNow =
    rejects > 0 &&
    (health.lastAcceptedAt === null ||
      (health.lastRejectedAt !== null && health.lastRejectedAt > health.lastAcceptedAt));
  if (rejectingNow) {
    return {
      ...base,
      level: "alarm",
      headline: "Your helpdesk is being turned away at the door",
      detail: `${plural(rejects, "payload")} from your helpdesk ${
        rejects === 1 ? "was" : "were"
      } refused and never reached your queue${
        lastFailure?.reason ? ` — last reason: ${lastFailure.reason}` : ""
      }. Your queue is not quiet; it is cut off. Every one of these tickets is still sitting in your helpdesk, unanswered.`,
      fix: lastFailure?.fix ?? null,
      badge: "Ingest failing",
    };
  }

  // (2) THE SILENT KILLER. A merchant who told us they have a helpdesk, and from
  // whom nothing has ever arrived, is not calm. They are broken and cannot see it.
  if (configured && !everDelivered) {
    return {
      ...base,
      level: "alarm",
      headline: "Nothing has ever arrived from your helpdesk",
      detail:
        "You have a presale tag rule set, but not one ticket has reached Tideover. An empty queue here does not mean a quiet week — it means your helpdesk is not delivering. Send a test event below: it will tell you in one click whether the connection works.",
      fix: "Open Connect your helpdesk below, re-check the ingest URL and the credential against what your helpdesk is sending, then press Send a test event.",
      badge: "No inbound ever",
    };
  }

  // (3) The tag rule is eating everything. Auth is fine; the door is fine; the
  // merchant's own filter is discarding every ticket that arrives.
  if (counts.discarded > 0 && delivered === 0) {
    return {
      ...base,
      level: "alarm",
      headline: "Every ticket is being dropped by your tag rule",
      detail: `${plural(
        counts.discarded,
        "ticket",
      )} reached Tideover and ${counts.discarded === 1 ? "was" : "were"} discarded because ${
        counts.discarded === 1 ? "its tags" : "their tags"
      } didn't match your presale filter${
        presaleTags?.length ? ` (${presaleTags.join(", ")})` : ""
      }. Nothing was stored. The connection works — the filter is the problem.`,
      fix: lastFailure?.fix ?? null,
      badge: "All tickets dropped",
    };
  }

  // (4) It used to deliver and has gone mute.
  if (quietDays !== null && quietDays >= QUIET_ALARM_DAYS) {
    return {
      ...base,
      level: "alarm",
      headline: `No inbound in ${plural(quietDays, "day")}`,
      detail:
        "Your helpdesk was delivering and has stopped. A deleted rule, a rotated secret or a disabled webhook all look exactly like this. Assume the queue is wrong until a test event lands.",
      fix: "Open Connect your helpdesk below and press Send a test event. If the test lands but real tickets don't, the rule in your helpdesk is no longer firing.",
      badge: `Quiet ${quietDays}d`,
    };
  }

  // (5) Delivering, with something worth a second look.
  if (counts.unmatched > 0) {
    return {
      ...base,
      level: "warn",
      headline: `${plural(counts.unmatched, "ticket")} arrived with no matching order`,
      detail:
        "These tickets are in your queue but not tied to a backer's order, so they carry no wait, no stage and no drafted reassurance. They are usually a customer writing from a different email than the one they pledged with.",
      fix: "Open the inbox and filter for presale:unmatched to attach them by hand.",
      badge: "Unmatched tickets",
    };
  }
  if (rejects > 0) {
    return {
      ...base,
      level: "warn",
      headline: `${plural(rejects, "payload")} ${rejects === 1 ? "was" : "were"} refused earlier`,
      detail:
        "Your helpdesk is delivering now, but some payloads were turned away before that. If those tickets never re-sent, they are still unanswered in your helpdesk.",
      fix: lastFailure?.fix ?? null,
      badge: null,
    };
  }

  // (6) Nothing wired yet. Not an error — there is just nothing to be wrong.
  if (!configured) {
    return {
      ...base,
      level: "idle",
      headline: "Helpdesk not connected yet",
      detail:
        "Nothing is wrong — you just haven't pointed a helpdesk at Tideover. Connect one below and tickets arrive structured, filtered by your own tag rule.",
      fix: null,
      badge: null,
    };
  }

  // (7) Connected and delivering.
  return {
    ...base,
    level: "ok",
    headline: "Your helpdesk is delivering",
    detail:
      quietDays === null
        ? "Tickets are reaching Tideover."
        : `Last ticket arrived ${quietDays === 0 ? "today" : `${plural(quietDays, "day")} ago`}. Nothing has been refused or dropped.`,
    fix: null,
    badge: null,
  };
}

/**
 * The I/O wrapper. One call, for /app/setup and for any surface that wants to
 * badge the state (the cockpit rail): `(await getIngestStatus(id)).badge`.
 *
 * `lastInboundAt` is the durable half — the createdAt of the newest REAL
 * (non-mock) ticket, exactly the signal lib/setup.ts already derives. It is what
 * makes the alarm survive a restart even though the counters do not.
 */
export async function getIngestStatus(
  merchantId: string,
  now: Date = new Date(),
): Promise<IngestStatus | null> {
  const repos = getRepositories();
  const merchant: Merchant | null = await repos.merchants.findById(merchantId);
  if (!merchant) return null;
  const tickets = await repos.tickets.list({ merchantId });
  const lastInboundAt =
    tickets
      .filter((t) => t.channel !== "mock")
      .map((t) => t.createdAt)
      .sort()
      .at(-1) ?? null;

  return deriveIngestStatus(
    {
      isDemo: merchant.isDemo,
      presaleTags: merchant.presaleTags,
      lastInboundAt,
      health: getIngestHealth(merchantId),
    },
    now,
  );
}
