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
      <div className="proof-placeholder m-3">Queue is clear for this merchant.</div>
    );
  }

  return (
    <ul className="flex flex-col divide-y divide-border">
      {rows.map((r) => {
        const active = r.ticketId === selectedId;
        return (
          <li key={r.ticketId}>
            <Link
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
