import Link from "next/link";
import { clsx } from "clsx";

/**
 * ResumeBanner (ADR-0023, backlog #6) — the persistent "onboarding still in
 * progress" bar shown on every cockpit screen until setup completeness hits 100%.
 * Presentational only; the completeness check that decides WHETHER to render it
 * lands with SW6. terracotta-700 for AA-safe white text (see globals.css note).
 */
export function ResumeBanner({
  message = "Your onboarding is still in progress — pick up where you left off.",
  ctaLabel = "Continue onboarding",
  href,
  className,
}: {
  message?: string;
  ctaLabel?: string;
  href: string;
  className?: string;
}) {
  return (
    <div
      className={clsx(
        "flex flex-wrap items-center justify-between gap-x-4 gap-y-2 bg-terracotta-700 px-4 py-2.5 text-[13px] font-medium text-white",
        className,
      )}
    >
      <span>{message}</span>
      <Link
        href={href}
        className="shrink-0 rounded-full bg-white px-3.5 py-1 text-[13px] font-semibold text-terracotta-700 transition-transform hover:-translate-y-px"
      >
        {ctaLabel} <span aria-hidden>→</span>
      </Link>
    </div>
  );
}
