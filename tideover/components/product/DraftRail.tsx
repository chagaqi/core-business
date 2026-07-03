"use client";

import { useRef, useState } from "react";
import { TextArea } from "@/components/ui/Field";
import { ApprovalBar, type ApprovalBarHandle } from "@/components/product/ApprovalBar";

/**
 * Right rail of the cockpit. Confidence-band chip, an editable draft (prefilled),
 * the manager note (amber callout when escalated), then the approval actions.
 * Holds the textarea value so ApprovalBar can read the operator's edits on send.
 */
export function DraftRail({
  ticketId,
  draftText,
  confidenceBand,
  priority,
  managerNote,
  overdue,
  alreadySent,
  sentText,
  firstResponseSec,
  merchantId,
  nextTicketId,
}: {
  ticketId: string;
  draftText: string;
  confidenceBand: string;
  priority: "normal" | "escalated";
  managerNote: string | null;
  overdue: boolean;
  alreadySent: boolean;
  sentText: string | null;
  firstResponseSec: number | null;
  merchantId: string;
  nextTicketId: string | null;
}) {
  const [text, setText] = useState(alreadySent && sentText ? sentText : draftText);
  const textRef = useRef(text);
  textRef.current = text;
  const approvalRef = useRef<ApprovalBarHandle>(null);

  return (
    <div className="panel flex flex-col gap-3 p-4">
      <div className="flex items-center justify-between gap-2">
        <h3 className="text-[14px] font-semibold text-ink">Reassurance draft</h3>
        <span className="pill pill-green">{confidenceBand}</span>
      </div>

      <div className="flex flex-wrap gap-2">
        <span className="inline-flex items-center rounded-full border border-border bg-sand px-2.5 py-0.5 text-[11px] font-medium text-slate">
          {priority === "escalated" ? "Escalated priority" : "Normal priority"}
        </span>
        {overdue ? (
          <span className="pill pill-red">Overdue</span>
        ) : null}
        <span className="inline-flex items-center rounded-full border border-border bg-sand px-2.5 py-0.5 text-[11px] font-medium text-ink-mute">
          Draft only · human-approved
        </span>
      </div>

      {managerNote ? (
        <div className="rounded-lg border border-risk-amber/30 bg-[rgba(217,118,47,0.08)] px-3 py-2.5">
          <p className="text-[12px] font-semibold uppercase tracking-wider text-terracotta-600">
            Manager note
          </p>
          <p className="mt-0.5 text-[13px] text-slate">{managerNote}</p>
        </div>
      ) : null}

      <TextArea
        value={text}
        onChange={(e) => setText(e.target.value)}
        onKeyDown={(e) => {
          // The one input-context shortcut: ⌘/Ctrl+Enter = Approve & send,
          // routed through ApprovalBar's existing send path (no duplicate fetch).
          if ((e.metaKey || e.ctrlKey) && e.key === "Enter") {
            e.preventDefault();
            approvalRef.current?.send();
          }
        }}
        disabled={alreadySent}
        className="min-h-[200px] text-[14px]"
        aria-label="Editable reassurance draft"
      />

      <ApprovalBar
        ref={approvalRef}
        ticketId={ticketId}
        getText={() => textRef.current}
        alreadySent={alreadySent}
        firstResponseSec={firstResponseSec}
        merchantId={merchantId}
        nextTicketId={nextTicketId}
      />
    </div>
  );
}
