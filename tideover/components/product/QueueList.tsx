"use client";

import Link from "next/link";
import { clsx } from "clsx";
import type { RiskColor } from "@/lib/types";
import type { SlaChipView } from "@/lib/sla";
import { RiskBadge, Tag } from "@/components/ui/Badge";
import { SlaChip } from "@/components/product/SlaChip";

/** Plain, serializable shape passed from the server cockpit page. */
export interface QueueItem {
  ticketId: string;
  firstName: string;
  group: string;
  subject: string;
  daysInWait: number;
  riskScore: number;
  color: RiskColor;
  escalated: boolean;
  /** F/UX-10 — operator persisted a follow-up self-flag on this ticket. */
  flagged: boolean;
  /** C5 — the ticket's computed first-response SLA chip (countdown + basis). */
  sla: SlaChipView;
  /**
   * Why this ticket is where it is, in plain words — e.g. "said they will
   * dispute the charge — risk 74 · long time already waiting · above 62% of
   * your live queue" (lib/queue-rank.ts). The ten-merchant run found an operator
   * cannot act on an order they cannot explain: in a crisis every ticket scores
   * high, the ranking looks arbitrary, and trust in the queue dies. The rank is
   * only useful if it can answer "why is this on top?" without asking anyone.
   */
  rankReason?: string;
}

const GROUP_LABEL: Record<string, string> = {
  "ks-backer": "KS backer",
  "late-pledge": "Late pledge",
  "new-preorder": "New preorder",
};

/** Worded risk severity (a11y): a non-color channel for the RiskBadge, so the
 *  queue's risk signal isn't conveyed by hue alone. */
function riskLabel(color: RiskColor, score: number): string {
  const severity = color === "red" ? "High refund-risk" : color === "amber" ? "Watch" : "Standard";
  return `${severity} (${score})`;
}

export function QueueList({
  rows,
  selectedId,
  merchantId,
}: {
  rows: QueueItem[];
  selectedId: string | null;
  merchantId: string;
}) {
  if (rows.length === 0) {
    return (
      <div className="flex flex-col items-center gap-2.5 px-6 py-12 text-center">
        <span className="flex h-9 w-9 items-center justify-center rounded-full bg-accent-card text-teal">
          <CheckMark />
        </span>
        <p className="text-[14px] font-semibold text-ink">Queue clear</p>
        <p className="text-[12px] text-ink-mute">
          Nothing waiting — every at-risk buyer has a reply out.
        </p>
      </div>
    );
  }

  return (
    <ul className="flex flex-col divide-y divide-border">
      {rows.map((r) => {
        const active = r.ticketId === selectedId;
        return (
          <li key={r.ticketId}>
            <Link
              data-queue-item={r.ticketId}
              href={`/app/inbox?merchant=${merchantId}&ticket=${r.ticketId}`}
              className={clsx(
                "block px-4 py-3 no-underline transition",
                active
                  ? "bg-accent-card"
                  : "hover:bg-sand",
              )}
              aria-current={active ? "true" : undefined}
            >
              <div className="flex items-center justify-between gap-2">
                <span className="truncate text-[14px] font-semibold text-ink">
                  {r.firstName}
                </span>
                <span className="flex shrink-0 items-center gap-1.5">
                  {r.escalated ? (
                    // UX-02: a labeled, visible red pill (act-now) beside the risk
                    // badge — replaces the near-invisible 6px dot. aria-label kept.
                    <span aria-label="escalated" className="pill pill-red">
                      Escalated
                    </span>
                  ) : null}
                  <RiskBadge color={r.color} title={riskLabel(r.color, r.riskScore)}>
                    {r.riskScore}
                  </RiskBadge>
                </span>
              </div>
              <p className="mt-1 truncate text-[12px] text-slate">{r.subject}</p>
              {r.rankReason ? (
                // "Why is this on top?" — answered on the row, not buried.
                <p className="mt-1 line-clamp-2 text-[11.5px] leading-snug text-ink-mute" title={r.rankReason}>
                  {r.rankReason}
                </p>
              ) : null}
              <div className="mt-1.5 flex items-center justify-between gap-2">
                <span className="flex items-center gap-2">
                  <Tag>{GROUP_LABEL[r.group] ?? r.group}</Tag>
                  {r.flagged ? (
                    // F/UX-10: persisted operator follow-up flag (caution gold).
                    <span className="pill pill-amber">Flagged</span>
                  ) : null}
                  <span className="text-[11px] text-ink-mute">
                    {r.daysInWait}d waiting
                  </span>
                </span>
                <SlaChip chip={r.sla} />
              </div>
            </Link>
          </li>
        );
      })}
    </ul>
  );
}

/** Small calm check for the queue-clear state. Inherits currentColor. */
function CheckMark() {
  return (
    <svg
      width="16"
      height="16"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2.5"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <path d="M20 6 9 17l-5-5" />
    </svg>
  );
}
