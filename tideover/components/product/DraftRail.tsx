"use client";

import { useRef, useState } from "react";
import { TextArea } from "@/components/ui/Field";
import { ApprovalBar, type ApprovalBarHandle } from "@/components/product/ApprovalBar";
import { blocksSend, scoreReplyChecks, type ReplyCheckDimension } from "@/lib/qa";
import type { DraftAlternates } from "@/lib/draft-alternates";

type DraftMode = "standard" | "brief" | "deEscalate";

const MODE_LABEL: Record<DraftMode, string> = {
  standard: "Standard",
  brief: "Brief",
  deEscalate: "De-escalate",
};

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
  flagged,
  sentText,
  firstName,
  firstResponseSec,
  merchantId,
  nextTicketId,
  helpdesk,
  alternates,
}: {
  ticketId: string;
  draftText: string;
  confidenceBand: string;
  priority: "normal" | "escalated";
  managerNote: string | null;
  overdue: boolean;
  alreadySent: boolean;
  /** F/UX-10 (4b): the ticket's persisted operator follow-up flag, so the
   *  approval action reflects the flagged state on first paint. */
  flagged: boolean;
  sentText: string | null;
  firstName: string;
  firstResponseSec: number | null;
  merchantId: string;
  nextTicketId: string | null;
  /** Display name of the merchant's helpdesk, for the copy confirmation label. */
  helpdesk: string;
  /**
   * C2 — the three toggleable views of this draft. Optional so the rail behaves
   * exactly as before when absent. `standard` is byte-identical to `draftText`.
   */
  alternates?: DraftAlternates;
}) {
  const [text, setText] = useState(alreadySent && sentText ? sentText : draftText);
  const [mode, setMode] = useState<DraftMode>("standard");
  // The last text the rail seeded programmatically (initial draft, an alternate,
  // or a regenerate). Anything typed since diverges from it → the editor is dirty.
  const seededRef = useRef(text);
  const textRef = useRef(text);
  textRef.current = text;
  const approvalRef = useRef<ApprovalBarHandle>(null);
  // UX-01: a brief "New draft ready" cue after a regenerate updates the editor.
  const [regenCue, setRegenCue] = useState(false);

  function updateText(next: string) {
    setText(next);
    if (regenCue) setRegenCue(false); // any edit clears the cue
  }

  // C2 toggle: swap the editor's seed text to the chosen alternate. This only
  // re-seeds the SAME editable textarea the operator sends from — it changes
  // nothing about Approve & copy (which still posts the live editor text). Shown
  // only while the draft is still editable (an already-sent reply is frozen).
  const alternateFor = (m: DraftMode): string =>
    m === "brief"
      ? alternates!.brief
      : m === "deEscalate"
        ? alternates!.deEscalate
        : alternates!.standard;
  // Only offer an alternate that ACTUALLY differs from Standard — a tab that
  // re-seeds identical text would be misleading (e.g. De-escalate is a no-op
  // while the engine's wording is sentiment-invariant). Standard always shows;
  // the toggle appears only when there's a real choice.
  const visibleModes: DraftMode[] = alternates
    ? (["standard", "brief", "deEscalate"] as DraftMode[]).filter(
        (m) => m === "standard" || alternateFor(m) !== alternates.standard,
      )
    : [];
  const showToggle = !alreadySent && alternates != null && visibleModes.length > 1;
  function selectMode(m: DraftMode) {
    const next = alternateFor(m);
    setMode(m);
    seededRef.current = next; // a deliberate re-seed, not an unsaved edit
    updateText(next);
  }

  // UX-01: apply the regenerated draft to the visible editor. Guard unsaved edits
  // with a confirm so a regenerate never silently discards the operator's typing.
  function handleRegenerated(next: string) {
    const dirty = textRef.current !== seededRef.current;
    if (dirty && typeof window !== "undefined") {
      const ok = window.confirm("Discard your edits and load the fresh draft?");
      if (!ok) return;
    }
    seededRef.current = next;
    setText(next);
    setRegenCue(true);
  }

  // Reply QA (ADR-0014, E4): re-scored live as the operator edits. Two AUTO checks
  // (no hard date — the gate; personalized) + two guidance prompts. Proof-only:
  // pass/guidance marks, never a fabricated quality score.
  const checks = scoreReplyChecks({ text, firstName });
  const blocked = blocksSend(checks);

  // UX-06: the confidence-band chip is neutral by default. Green is reserved for
  // when NOTHING is wrong (not overdue, normal priority) — so a green chip never
  // sits next to a red Overdue pill or an escalated ticket.
  const nothingWrong = !overdue && priority === "normal";

  return (
    <div className="panel flex flex-col gap-3 p-4">
      <div className="flex items-center justify-between gap-2">
        <h3 className="text-[14px] font-semibold text-ink">Reassurance draft</h3>
        <span
          className={
            nothingWrong
              ? "pill pill-green"
              : "inline-flex items-center rounded-full border border-border bg-sand px-2.5 py-0.5 text-[11px] font-medium text-ink-mute"
          }
        >
          {confidenceBand}
        </span>
      </div>

      <div className="flex flex-wrap gap-2">
        <span className="inline-flex items-center rounded-full border border-border bg-sand px-2.5 py-0.5 text-[11px] font-medium text-slate">
          {priority === "escalated" ? "Escalated priority" : "Normal priority"}
        </span>
        {overdue ? <span className="pill pill-red">Overdue</span> : null}
        <span className="inline-flex items-center rounded-full border border-border bg-sand px-2.5 py-0.5 text-[11px] font-medium text-ink-mute">
          Draft only · human-approved
        </span>
      </div>

      {managerNote ? (
        <div className="rounded-lg border border-risk-amber/30 bg-[rgba(138,102,18,0.08)] px-3 py-2.5">
          <p className="text-[12px] font-semibold uppercase tracking-wider text-amber-status">
            Manager note
          </p>
          <p className="mt-0.5 text-[13px] text-slate">{managerNote}</p>
        </div>
      ) : null}

      {showToggle ? (
        <div>
          <div
            role="group"
            aria-label="Draft version"
            className="inline-flex w-full rounded-lg border border-border bg-sand p-0.5"
          >
            {visibleModes.map((m) => {
              const active = mode === m;
              return (
                <button
                  key={m}
                  type="button"
                  aria-pressed={active}
                  onClick={() => selectMode(m)}
                  className={`flex-1 rounded-md px-2.5 py-1 text-[12px] font-medium transition-colors ${
                    active ? "bg-teal text-ink-inverse shadow-sm" : "text-slate hover:text-ink"
                  }`}
                >
                  {MODE_LABEL[m]}
                </button>
              );
            })}
          </div>
          <p className="mt-1 text-[11px] leading-snug text-ink-mute">
            {mode === "brief"
              ? "Trimmed to the greeting, the confidence band, and the sign-off."
              : mode === "deEscalate"
                ? "The engine's calmest, highest-reassurance wording."
                : "The full drafted reply, as it ships today."}
          </p>
        </div>
      ) : null}

      {regenCue ? (
        <p className="text-[11px] font-medium text-teal" role="status" aria-live="polite">
          New draft ready.
        </p>
      ) : null}

      <TextArea
        value={text}
        onChange={(e) => updateText(e.target.value)}
        onKeyDown={(e) => {
          // The one input-context shortcut: ⌘/Ctrl+Enter = Approve & copy,
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
        initialFlagged={flagged}
        blocked={blocked}
        firstResponseSec={firstResponseSec}
        merchantId={merchantId}
        nextTicketId={nextTicketId}
        priority={priority}
        helpdesk={helpdesk}
        onRegenerated={handleRegenerated}
      />

      {!alreadySent ? (
        <p className="text-[11px] leading-snug text-ink-mute">
          Your customer&rsquo;s status link is included when you copy.
        </p>
      ) : null}
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
