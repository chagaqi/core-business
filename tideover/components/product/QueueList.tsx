"use client";

import Link from "next/link";
import { clsx } from "clsx";
import type { RiskColor } from "@/lib/types";
import { RiskBadge, Tag } from "@/components/ui/Badge";

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
}

const GROUP_LABEL: Record<string, string> = {
  "ks-backer": "KS backer",
  "late-pledge": "Late pledge",
  "new-preorder": "New preorder",
};

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
                <span className="flex items-center gap-2 truncate">
                  {r.escalated ? (
                    <span
                      aria-label="escalated"
                      className="inline-block h-1.5 w-1.5 shrink-0 rounded-full bg-risk-red"
                    />
                  ) : null}
                  <span className="truncate text-[14px] font-semibold text-ink">
                    {r.firstName}
                  </span>
                </span>
                <RiskBadge color={r.color}>{r.riskScore}</RiskBadge>
              </div>
              <p className="mt-1 truncate text-[12px] text-slate">{r.subject}</p>
              <div className="mt-1.5 flex items-center gap-2">
                <Tag>{GROUP_LABEL[r.group] ?? r.group}</Tag>
                <span className="text-[11px] text-ink-mute">
                  {r.daysInWait}d waiting
                </span>
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
