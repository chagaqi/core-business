import type { DayStageKey } from "@/lib/types";

/**
 * A warm, stage-appropriate reassurance message. The register shifts with the
 * day-stage:
 *  - day-7  : calm confirmation ("you're in, nothing's wrong")
 *  - day-30 : proof of movement ("here's what's actually happening")
 *  - day-60 : acknowledge the wait + one concrete next step
 *  - day-89 : honest, no spin, tracking-soon
 * Always uses the customer's first name + the merchant's name + the current
 * stageBlurb, and signs off in the merchant's voice. NO hard dates ever.
 */
function paragraphs({
  stageKey,
  firstName,
  merchantName,
  stageBlurb,
}: {
  stageKey: DayStageKey;
  firstName: string;
  merchantName: string;
  stageBlurb: string;
}): string[] {
  switch (stageKey) {
    case "day-7":
      return [
        `Hi ${firstName} — your ${merchantName} order is confirmed and moving exactly as it should.`,
        `Right now, ${stageBlurb}. Waiting on something you've already paid for can feel long, so we'll keep this page current and reach out the moment anything shifts. Nothing is stuck.`,
      ];
    case "day-30":
      return [
        `${firstName}, a month in — and we want you to see real movement, not a brush-off.`,
        `Here's what's actually happening: ${stageBlurb}. You're still tracking to the window above, and nothing has slipped. We'll keep updating this page as each stage clears.`,
      ];
    case "day-60":
      return [
        `${firstName} — you've been patient through the two-month mark, and we don't take that for granted.`,
        `Here's exactly where things stand: ${stageBlurb}. The honest next step: we'll send your tracking the moment it generates, and you can ask us anything below — a real person will follow up.`,
      ];
    case "day-89":
    default:
      return [
        `${firstName} — you've waited longer than anyone should have to, and we won't give you a canned line.`,
        `The honest status: ${stageBlurb}. Your tracking is close, and we'll get it to you as soon as it's live. We'd rather see this through for you personally than have you wondering — we're on it.`,
      ];
  }
}

export function ReassuranceCard({
  stageKey,
  firstName,
  merchantName,
  stageBlurb,
  signoff,
  accent,
}: {
  stageKey: DayStageKey;
  firstName: string;
  merchantName: string;
  stageBlurb: string;
  signoff: string;
  accent?: string;
}) {
  const body = paragraphs({ stageKey, firstName, merchantName, stageBlurb });
  return (
    <div className="rounded-2xl border border-border bg-accent-card/60 p-6 md:p-7">
      <p className="kicker mb-3" style={accent ? { color: accent } : undefined}>
        A note from {merchantName}
      </p>
      <div className="flex flex-col gap-3 text-[15.5px] leading-relaxed text-slate">
        {body.map((p, i) => (
          <p key={i}>{p}</p>
        ))}
      </div>
      <p className="mt-5 font-serif text-[16px] italic text-ink">{signoff}</p>
    </div>
  );
}
