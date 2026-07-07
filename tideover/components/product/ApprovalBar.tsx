"use client";

import { forwardRef, useEffect, useImperativeHandle, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/Button";

/** Imperative handle so the draft textarea can fire ⌘/Ctrl+Enter = approve & copy. */
export interface ApprovalBarHandle {
  send: () => void;
}

/**
 * Action row for the cockpit draft rail. Regenerate (POST /api/draft), Approve &
 * copy reply (POST /api/approve-send with the edited text), and Escalate (manager
 * note). The core action is honest manual delivery: approve marks the ticket sent
 * server-side, and the reply — WITH the customer's status link appended — is
 * copied to the clipboard for the operator to paste into their helpdesk.
 *
 * Perceivable success (UX-03): after a successful approve+copy the bar renders a
 * role="status" confirmation ("Copied — paste into {helpdesk}.") before it auto-
 * advances — a brief hold (~500ms) or a keypress moves to the next ticket. The
 * copied text stays on the clipboard across that navigation, so the paste can
 * happen any time after. It never claims "Delivered" — only "Copied".
 *
 * Chargeback ceremony (UX-16): for an escalated ticket the first click arms an
 * explicit "Confirm — chargeback risk" step (a second click sends). Normal
 * tickets stay ceremony-free.
 *
 * QA gate (ADR-0014, E4): `blocked` mirrors the hard-date gate the server
 * enforces — a hard delivery date disables approve here, and the server still
 * rejects it with a structured 422 regardless. When a send diverged from the
 * draft by more than the promote threshold, the server returns `canPromote`, and
 * the confirmation also offers "save this edit as a variant" (operator-confirmed).
 */
export const ApprovalBar = forwardRef<ApprovalBarHandle, {
  ticketId: string;
  getText: () => string;
  alreadySent: boolean;
  blocked: boolean;
  firstResponseSec: number | null;
  merchantId: string;
  nextTicketId: string | null;
  /** UX-16: an escalated ticket arms an explicit chargeback-risk confirm step. */
  priority: "normal" | "escalated";
  /** Display name of the merchant's helpdesk, for the copy confirmation label. */
  helpdesk: string;
  /** UX-01: hand the regenerated draft text back so the editor updates in place. */
  onRegenerated?: (text: string) => void;
}>(function ApprovalBar(
  {
    ticketId,
    getText,
    alreadySent,
    blocked,
    firstResponseSec,
    merchantId,
    nextTicketId,
    priority,
    helpdesk,
    onRegenerated,
  },
  ref,
) {
  const router = useRouter();
  const [busy, setBusy] = useState<"draft" | "send" | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [escalated, setEscalated] = useState(false);
  // UX-16: armed chargeback-risk confirm state (escalated tickets, first click).
  const [confirming, setConfirming] = useState(false);
  // Set once at mount: shows the "Reply sent." confirmation when a deep-linked
  // ticket is already sent. The live-send path advances instead of lingering.
  const [sentMeta] = useState<{ frt: number | null } | null>(
    alreadySent ? { frt: firstResponseSec } : null,
  );
  // Post-send confirmation (UX-03): the reply the operator copied + whether the
  // clipboard write actually succeeded, so the label stays honest either way.
  const [copied, setCopied] = useState<{ ok: boolean; text: string } | null>(null);
  // After a >threshold-edit send, the captured sent text + promote lifecycle so
  // the operator can save that edit as a tracked variant before advancing.
  const [postSend, setPostSend] = useState<{ text: string } | null>(null);
  const [promoteState, setPromoteState] = useState<"idle" | "saving" | "saved">("idle");
  // Guards against a double-send from ⌘↵ key-repeat racing the busy state.
  const sendingRef = useRef(false);

  async function post(url: string, body: Record<string, unknown>) {
    const res = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
    if (!res.ok) {
      const data = (await res.json().catch(() => null)) as
        | { error?: string; failedCheck?: string }
        | null;
      // Structured hard-date rejection (E4): explain the block precisely.
      if (data?.failedCheck === "hard_date") {
        throw new Error("Blocked: this reply has a hard delivery date. Remove it to send.");
      }
      throw new Error(data?.error ?? "Request failed");
    }
    return res.json();
  }

  function advance() {
    router.replace(
      nextTicketId
        ? `/app/inbox?merchant=${merchantId}&ticket=${nextTicketId}`
        : `/app/inbox?merchant=${merchantId}`,
    );
  }

  // Keep advance callable from an effect without re-arming it every render.
  const advanceRef = useRef(advance);
  advanceRef.current = advance;

  // Auto-advance after the confirmation renders (UX-03): hold ~500ms so success
  // is perceivable, THEN move to the next ticket. Suppressed while a promote
  // decision is pending or the clipboard write failed — both need an explicit
  // operator action first. A queue keypress (j/k/Enter, owned by QueueKeyboard)
  // navigates on its own and remounts this bar, which clears the timer — so the
  // impatient-operator "advance on keypress" path falls out for free, with no
  // competing global listener here. The reply stays on the clipboard across the
  // navigation, so the paste can happen any time after.
  useEffect(() => {
    if (!copied || !copied.ok || postSend) return;
    const timer = setTimeout(() => advanceRef.current(), 500);
    return () => clearTimeout(timer);
  }, [copied, postSend]);

  async function copyToClipboard(text: string): Promise<boolean> {
    try {
      if (typeof navigator !== "undefined" && navigator.clipboard?.writeText) {
        await navigator.clipboard.writeText(text);
        return true;
      }
    } catch {
      /* clipboard blocked — fall through to the manual-copy fallback */
    }
    return false;
  }

  async function regenerate() {
    setBusy("draft");
    setError(null);
    try {
      const data = (await post("/api/draft", { ticketId, regenerate: true })) as {
        draft?: { text?: string };
      };
      // UX-01: thread the fresh draft back into the editor so it no longer shows
      // stale text. No router.refresh() — the textarea is client-owned now.
      if (data?.draft?.text) onRegenerated?.(data.draft.text);
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setBusy(null);
    }
  }

  async function approveSend() {
    // Mirror the server hard-date gate: refuse to send while a hard date is present.
    if (blocked) {
      setError("Can't send — this reply has a hard delivery date. Remove it to send.");
      return;
    }
    // UX-16: an escalated ticket needs an explicit second click to confirm.
    if (priority === "escalated" && !confirming) {
      setConfirming(true);
      setError(null);
      return;
    }
    if (sendingRef.current) return; // ⌘↵ key-repeat / double-click guard.
    sendingRef.current = true;
    setBusy("send");
    setError(null);
    setConfirming(false);
    try {
      const editorText = getText();
      const data = (await post("/api/approve-send", { ticketId, approvedText: editorText })) as {
        canPromote?: boolean;
        sentText?: string;
      };
      // Copy the DELIVERED reply (the operator's text + the appended status link),
      // falling back to the editor text if the server didn't echo it.
      const toCopy = data?.sentText ?? editorText;
      const ok = await copyToClipboard(toCopy);
      setCopied({ ok, text: toCopy });
      setBusy(null);
      // Meaningful edit → pause on the promote affordance instead of advancing.
      // sendingRef stays true so a stray ⌘↵ can't re-fire the (already-sent) send.
      if (data?.canPromote) setPostSend({ text: editorText });
    } catch (e) {
      setError((e as Error).message);
      setBusy(null);
      sendingRef.current = false;
    }
  }

  async function promote() {
    if (!postSend) return;
    setPromoteState("saving");
    setError(null);
    try {
      await post("/api/variants/promote", { ticketId, text: postSend.text });
      setPromoteState("saved");
    } catch (e) {
      setError((e as Error).message);
      setPromoteState("idle");
    }
  }

  // Expose a stable send() that always calls the latest approveSend closure.
  const approveSendRef = useRef(approveSend);
  approveSendRef.current = approveSend;
  useImperativeHandle(ref, () => ({ send: () => void approveSendRef.current() }), []);

  if (sentMeta) {
    return (
      <div className="rounded-lg bg-accent-card px-3 py-2.5">
        <p className="text-[13px] font-semibold text-teal">Reply sent.</p>
        {sentMeta.frt != null ? (
          <p className="text-[12px] text-slate">First response in {formatFrt(sentMeta.frt)}.</p>
        ) : null}
      </div>
    );
  }

  // Post-send confirmation (UX-03): perceivable success in a live region. Honest
  // label — "Copied", never "Delivered". Offers the promote affordance (E4) or a
  // "Next ticket →" control depending on whether a save decision is pending.
  if (copied) {
    return (
      <div
        role="status"
        aria-live="polite"
        className="flex flex-col gap-2 rounded-lg bg-accent-card px-3 py-2.5"
      >
        <p className="text-[13px] font-semibold text-teal">
          {copied.ok ? `Copied — paste into ${helpdesk}.` : `Approved — copy the reply, then paste into ${helpdesk}.`}
        </p>
        {error ? <p className="text-[12px] font-medium text-risk-red">{error}</p> : null}
        {!copied.ok ? (
          <>
            <p className="text-[12px] text-slate">Your browser blocked the clipboard.</p>
            <textarea
              readOnly
              value={copied.text}
              onFocus={(e) => e.currentTarget.select()}
              className="min-h-[96px] w-full rounded-md border border-border bg-paper px-2 py-1.5 text-[12.5px] text-ink"
              aria-label="Reply to copy manually"
            />
          </>
        ) : null}

        {postSend && promoteState !== "saved" ? (
          <>
            <p className="text-[12px] text-slate">
              You rewrote this draft substantially (over 30%). Save it as a tracked variant so it
              competes in the panel?
            </p>
            <div className="flex flex-wrap items-center gap-2">
              <Button
                variant="primary"
                onClick={promote}
                disabled={promoteState === "saving"}
                className="flex-1"
              >
                {promoteState === "saving" ? "Saving…" : "Save this edit as a variant"}
              </Button>
              <Button variant="ghost" onClick={advance}>
                Not now
              </Button>
            </div>
          </>
        ) : (
          <>
            {promoteState === "saved" ? (
              <p className="text-[12px] text-slate">
                Saved as a variant — it now competes in Script performance.
              </p>
            ) : null}
            <div className="flex items-center gap-2">
              {!copied.ok ? (
                <Button
                  variant="ghost"
                  onClick={async () => {
                    const ok = await copyToClipboard(copied.text);
                    setCopied({ ok, text: copied.text });
                  }}
                >
                  Copy reply
                </Button>
              ) : null}
              <Button variant="primary" onClick={advance} className="flex-1">
                Next ticket →
              </Button>
            </div>
          </>
        )}
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-2">
      {error ? <p className="text-[12px] font-medium text-risk-red">{error}</p> : null}
      {blocked ? (
        <p className="rounded-lg border border-risk-red/30 bg-[rgba(197,58,50,0.06)] px-3 py-2 text-[12px] font-medium text-risk-red">
          Send blocked — remove the hard delivery date. Tideover only sends confidence bands.
        </p>
      ) : null}
      {confirming ? (
        <p className="rounded-lg border border-risk-amber/30 bg-[rgba(138,102,18,0.08)] px-3 py-2 text-[12px] text-amber-status">
          Chargeback risk — sends immediately, no recall. Click again to confirm.
        </p>
      ) : null}
      {escalated ? (
        <p className="rounded-lg border border-risk-amber/30 bg-[rgba(138,102,18,0.08)] px-3 py-2 text-[12px] text-amber-status">
          Flagged for manager review this window.
        </p>
      ) : null}
      <div className="flex flex-wrap items-center gap-2">
        <Button
          variant="primary"
          onClick={approveSend}
          disabled={busy !== null || blocked}
          className="flex-1"
        >
          {busy === "send"
            ? "Copying…"
            : confirming
              ? "Confirm — chargeback risk"
              : "Approve & copy reply"}
        </Button>
        <Button variant="ghost" onClick={regenerate} disabled={busy !== null}>
          {busy === "draft" ? "Regenerating…" : "Regenerate"}
        </Button>
        <Button variant="quiet" onClick={() => setEscalated((v) => !v)} disabled={busy !== null}>
          {escalated ? "Un-escalate" : "Escalate"}
        </Button>
      </div>
    </div>
  );
});

function formatFrt(sec: number): string {
  if (sec < 60) return `${sec}s`;
  const m = Math.round(sec / 60);
  if (m < 60) return `${m}m`;
  const h = Math.floor(m / 60);
  return `${h}h ${m % 60}m`;
}
