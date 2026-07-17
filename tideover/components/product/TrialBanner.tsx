import Link from "next/link";
import type { TrialPhase } from "@/lib/trial";

/**
 * The trial countdown / expiry bar (ADR-0022), shown across every /app surface
 * for a real trialing merchant. Demo + on-a-plan merchants get `not-applicable`
 * and render nothing. At expiry it turns into the soft-lock prompt — the server
 * routes (approve-send, import) enforce the actual lock; this is the human-facing
 * half.
 */
export function TrialBanner({ phase, daysLeft }: { phase: TrialPhase; daysLeft: number }) {
  if (phase === "not-applicable") return null;

  if (phase === "expired") {
    return (
      <div className="flex flex-wrap items-center justify-between gap-2 border-b border-[#E4A56B] bg-[#FBE7D6] px-6 py-2.5 text-[13px] text-[#7A3E12]">
        <span className="font-semibold">Your trial has ended — choose a plan to keep sending replies and importing backers.</span>
        <Link href="/app/billing" className="rounded-lg bg-[#B85422] px-3 py-1.5 font-semibold text-white no-underline hover:brightness-105">
          Choose a plan
        </Link>
      </div>
    );
  }

  const urgent = phase === "ending-soon";
  return (
    <div
      className={`flex flex-wrap items-center justify-between gap-2 border-b px-6 py-2 text-[12.5px] ${
        urgent ? "border-[#E4A56B] bg-[#FBE7D6] text-[#7A3E12]" : "border-border bg-sand text-ink-mute"
      }`}
    >
      <span>
        {daysLeft} day{daysLeft === 1 ? "" : "s"} left in your free trial{urgent ? " — no card on file, nothing auto-bills." : "."}
      </span>
      <Link href="/app/billing" className="font-semibold text-teal underline underline-offset-2">
        Choose a plan →
      </Link>
    </div>
  );
}
