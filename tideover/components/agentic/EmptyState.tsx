import Link from "next/link";
import type { ReactNode } from "react";
import { clsx } from "clsx";

export interface EmptyStateAction {
  title: string;
  body: string;
  cta: string;
  href: string;
  /** agent-flavored path — gets the ✨ prefix on its CTA link (Swan's "Help me…" pattern) */
  agent?: boolean;
}

/**
 * EmptyState (ADR-0023, backlog #5) — the ONE empty-state template every module
 * reuses: centered icon badge + heading + sub + a 2-up action-card row (manual
 * path / agent path). Never sample metrics, never placeholder charts — the empty
 * state's job is to point at the first real setup action.
 */
export function EmptyState({
  icon,
  heading,
  sub,
  tertiary,
  actions = [],
  className,
}: {
  icon: ReactNode;
  heading: string;
  sub?: string;
  tertiary?: string;
  actions?: EmptyStateAction[];
  className?: string;
}) {
  return (
    <div className={clsx("mx-auto flex max-w-xl flex-col items-center py-14 text-center", className)}>
      <div className="grid h-14 w-14 place-items-center rounded-xl border border-border bg-sand-2 text-[22px]">
        {icon}
      </div>
      <h2 className="mt-4 text-[17px] font-semibold text-ink">{heading}</h2>
      {sub ? <p className="mt-1 max-w-md text-[14px] text-slate">{sub}</p> : null}
      {tertiary ? <p className="mt-1 text-[13px] text-ink-mute">{tertiary}</p> : null}
      {actions.length > 0 ? (
        <div className={clsx("mt-6 grid w-full gap-3 text-left", actions.length > 1 && "sm:grid-cols-2")}>
          {actions.map((action) => (
            <div key={action.title} className="panel flex flex-col p-4">
              <p className="text-[14px] font-semibold text-ink">{action.title}</p>
              <p className="mt-1 flex-1 text-[13px] leading-relaxed text-slate">{action.body}</p>
              <Link
                href={action.href}
                className="mt-3 inline-flex items-center gap-1 text-[13px] font-semibold text-terracotta-700 hover:underline"
              >
                {action.agent ? <span aria-hidden>✨</span> : null}
                {action.cta} <span aria-hidden>→</span>
              </Link>
            </div>
          ))}
        </div>
      ) : null}
    </div>
  );
}

/**
 * AllCaughtUp (ADR-0023) — the quiet-inbox state: green check, "All caught up",
 * nothing needing review. The product's goal state, rendered as such.
 */
export function AllCaughtUp({
  sub = "Nothing needs your review.",
  tertiary,
  className,
}: {
  sub?: string;
  tertiary?: string;
  className?: string;
}) {
  return (
    <div className={clsx("mx-auto flex max-w-xl flex-col items-center py-14 text-center", className)}>
      <div
        aria-hidden
        className="grid h-12 w-12 place-items-center rounded-full text-[20px] text-risk-green"
        style={{ background: "rgba(62, 142, 110, 0.12)" }}
      >
        ✓
      </div>
      <h2 className="mt-4 text-[17px] font-semibold text-ink">All caught up</h2>
      <p className="mt-1 text-[14px] text-slate">{sub}</p>
      {tertiary ? <p className="mt-1 text-[13px] text-ink-mute">{tertiary}</p> : null}
    </div>
  );
}
