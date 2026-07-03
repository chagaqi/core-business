"use client";

import { useRef, useState } from "react";
import { TextArea } from "@/components/ui/Field";
import { ApprovalBar, type ApprovalBarHandle } from "@/components/product/ApprovalBar";
import { blocksSend, scoreReplyChecks, type ReplyCheckDimension } from "@/lib/qa";

/**
 * Right rail of the cockpit. Confidence-band chip, an editable draft (prefilled),
 * the manager note (amber callout when escalated), a Reply QA checklist, then the
 * approval actions. Holds the textarea value so the checklist re-scores live and
 * ApprovalBar can read the operator's edits on send.
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
  firstName,
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
  firstName: string;
  firstResponseSec: number | null;
  merchantId: string;
  nextTicketId: string | null;
}) {
  const [text, setText] = useState(alreadySent && sentText ? sentText : draftText);
  const textRef = useRef(text);
  textRef.current = text;
  const approvalRef = useRef<ApprovalBarHandle>(null);

  // Reply QA (ADR-0014, E4): re-scored live as the operator edits. Two AUTO checks
  // (no hard date — the gate; personalized) + two guidance prompts. Proof-only:
  // pass/guidance marks, never a fabricated quality score.
  const checks = scoreReplyChecks({ text, firstName });
  const blocked = blocksSend(checks);

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

      {!alreadySent ? <QaChecklist dimensions={checks.dimensions} /> : null}

      <ApprovalBar
        ref={approvalRef}
        ticketId={ticketId}
        getText={() => textRef.current}
        alreadySent={alreadySent}
        blocked={blocked}
        firstResponseSec={firstResponseSec}
        merchantId={merchantId}
        nextTicketId={nextTicketId}
      />
    </div>
  );
}

/** The E4 checklist: a compact pass/guidance list under the draft. */
function QaChecklist({ dimensions }: { dimensions: ReplyCheckDimension[] }) {
  return (
    <div className="rounded-lg border border-border bg-sand px-3 py-2.5">
      <p className="text-[11px] font-semibold uppercase tracking-wider text-ink-mute">
        Reply QA checklist
      </p>
      <ul className="mt-1.5 flex flex-col gap-1.5">
        {dimensions.map((d) => (
          <QaRow key={d.key} d={d} />
        ))}
      </ul>
      <p className="mt-2 text-[11px] leading-snug text-ink-mute">
        Two checks are measured automatically; two are guidance. No quality score — just what&rsquo;s
        present.
      </p>
    </div>
  );
}

function QaRow({ d }: { d: ReplyCheckDimension }) {
  const blockedFail = d.blocking && !d.pass;
  const mark = d.pass ? "✓" : blockedFail ? "✕" : "○";
  const markClass = d.pass ? "text-teal" : blockedFail ? "text-risk-red" : "text-ink-mute";
  return (
    <li className="flex items-start gap-2 text-[12.5px]">
      <span aria-hidden="true" className={`mt-[1px] font-semibold ${markClass}`}>
        {mark}
      </span>
      <span className="flex-1">
        <span className={blockedFail ? "font-semibold text-risk-red" : "font-medium text-ink"}>
          {d.label}
        </span>
        <span className="ml-1.5 text-[10px] uppercase tracking-wide text-ink-mute">
          {d.kind === "auto" ? "auto" : "guidance"}
        </span>
        {blockedFail ? <span className="ml-1.5 pill pill-red">Blocked</span> : null}
        {!d.pass ? (
          <span className="mt-0.5 block text-[11.5px] leading-snug text-ink-mute">{d.hint}</span>
        ) : null}
      </span>
    </li>
  );
}
