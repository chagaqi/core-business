import type { PriorSentReply } from "@/lib/service";

/**
 * "Previously told" strip (C3). A read-only context band rendered ABOVE the draft
 * rail whenever the selected ticket's customer was already sent a reply. It shows
 * the merchant's OWN most-recent sent reply — verbatim text plus the confidence
 * band that reply quoted (when one was stamped on its draft) — so the operator
 * keeps the new draft consistent and never contradicts a promise already made.
 *
 * Proof-only: nothing here is generated. No new date, no summary, no restated
 * promise beyond the exact words already sent. Renders nothing on first contact.
 */
export function PreviouslyTold({
  firstName,
  prior,
}: {
  firstName: string;
  prior: PriorSentReply | null;
}) {
  if (!prior) return null;
  const sent = new Date(prior.sentAt);
  const when = Number.isNaN(sent.getTime()) ? null : sent;

  return (
    <section
      aria-label={`Previously told ${firstName}`}
      className="panel relative overflow-hidden p-4"
    >
      {/* teal edge — this is the merchant's own prior promise, quoted for consistency */}
      <span aria-hidden className="absolute inset-y-0 left-0 w-1" style={{ background: "var(--teal)" }} />

      <div className="pl-2.5">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <p className="text-[12px] font-semibold text-teal">
            Previously told {firstName}
            {when ? (
              <span className="font-normal text-ink-mute">
                {" · sent "}
                <time dateTime={prior.sentAt}>{relativeSent(when)}</time>
              </span>
            ) : null}
          </p>
          {prior.band ? (
            <span className="pill pill-green" title="The confidence band this reply quoted">
              {prior.band}
            </span>
          ) : null}
        </div>

        <p className="mt-2 whitespace-pre-wrap text-[13px] leading-relaxed text-slate line-clamp-6">
          {prior.text}
        </p>

        <p className="mt-2 text-[11px] leading-snug text-ink-mute">
          Your last reply on file. Keep this one consistent with it.
        </p>
      </div>
    </section>
  );
}

/** Compact, calm relative label for when the prior reply went out. */
function relativeSent(then: Date): string {
  const days = Math.floor((Date.now() - then.getTime()) / 86400000);
  if (days <= 0) return "today";
  if (days === 1) return "yesterday";
  if (days < 30) return `${days} days ago`;
  return then.toLocaleDateString("en-US", { month: "short", day: "numeric" });
}
