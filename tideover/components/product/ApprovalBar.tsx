"use client";

import { forwardRef, useImperativeHandle, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/Button";

/** Imperative handle so the draft textarea can fire ⌘/Ctrl+Enter = send. */
export interface ApprovalBarHandle {
  send: () => void;
}

/**
 * Action row for the cockpit draft rail. Regenerate (POST /api/draft), Approve &
 * send (POST /api/approve-send with the edited text), and Escalate (visual note).
 * Every mutation calls router.refresh() so the server surfaces re-read.
 *
 * Approve-and-advance: after a successful send, the just-sent ticket drops out of
 * the open queue on re-read, so we router.replace() to `nextTicketId` (the queue
 * item that followed the selected one, computed server-side) — or fall back to
 * `?merchant=…` alone when the queue is now empty. Exposes an imperative `send()`
 * so DraftRail's textarea can reuse this exact path for ⌘/Ctrl+Enter.
 *
 * QA gate (ADR-0014, E4): `blocked` mirrors the hard-date gate the server enforces
 * — a hard delivery date disables send here, and the server still rejects it with
 * a structured 422 regardless. When a send diverged from the draft by more than
 * the promote threshold, the server returns `canPromote`, and this bar pauses on a
 * "save this edit as a variant" affordance instead of advancing (operator-
 * confirmed, never silent).
 */
export const ApprovalBar = forwardRef<ApprovalBarHandle, {
  ticketId: string;
  getText: () => string;
  alreadySent: boolean;
  blocked: boolean;
  firstResponseSec: number | null;
  merchantId: string;
  nextTicketId: string | null;
}>(function ApprovalBar(
  { ticketId, getText, alreadySent, blocked, firstResponseSec, merchantId, nextTicketId },
  ref,
) {
  const router = useRouter();
  const [busy, setBusy] = useState<"draft" | "send" | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [escalated, setEscalated] = useState(false);
  // Set once at mount: shows the "Reply sent." confirmation when a deep-linked
  // ticket is already sent. The live-send path advances instead of lingering.
  const [sentMeta] = useState<{ frt: number | null } | null>(
    alreadySent ? { frt: firstResponseSec } : null,
  );
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

  async function regenerate() {
    setBusy("draft");
    setError(null);
    try {
      await post("/api/draft", { ticketId, regenerate: true });
      router.refresh();
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
    if (sendingRef.current) return; // ⌘↵ key-repeat / double-click guard.
    sendingRef.current = true;
    setBusy("send");
    setError(null);
    try {
      const sentText = getText();
      const data = (await post("/api/approve-send", { ticketId, approvedText: sentText })) as {
        canPromote?: boolean;
      };
      if (data?.canPromote) {
        // Meaningful edit: pause here to offer saving it as a variant. sendingRef
        // stays true so a stray ⌘↵ can't re-send the (already-sent) ticket.
        setPostSend({ text: sentText });
        setBusy(null);
        return;
      }
      // Advance: replace() to the next ticket (or just ?merchant when the queue
      // is now empty). The page is force-dynamic, so this navigation refetches
      // the queue — where the just-sent ticket is already filtered out — with no
      // separate refresh() (which would flash the sent ticket for a frame first).
      advance();
      // Leave busy set through the navigation; DraftRail remounts on the new
      // ticket (keyed by id), giving fresh state.
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
          <p className="text-[12px] text-slate">
            First response in {formatFrt(sentMeta.frt)}.
          </p>
        ) : null}
      </div>
    );
  }

  // Post-send promote affordance (E4): the send succeeded and diverged from the
  // draft by more than the promote threshold — offer to save it as a variant.
  if (postSend) {
    return (
      <div className="flex flex-col gap-2 rounded-lg bg-accent-card px-3 py-2.5">
        <p className="text-[13px] font-semibold text-teal">Reply sent.</p>
        {promoteState === "saved" ? (
          <>
            <p className="text-[12px] text-slate">
              Saved as a variant — it now competes in Script performance.
            </p>
            <Button variant="primary" onClick={advance} className="w-full">
              Next ticket
            </Button>
          </>
        ) : (
          <>
            <p className="text-[12px] text-slate">
              You rewrote this draft substantially (over 30%). Save it as a tracked variant so it
              competes in the panel?
            </p>
            {error ? <p className="text-[12px] font-medium text-risk-red">{error}</p> : null}
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
        )}
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-2">
      {error ? (
        <p className="text-[12px] font-medium text-risk-red">{error}</p>
      ) : null}
      {blocked ? (
        <p className="rounded-lg border border-risk-red/30 bg-[rgba(197,58,50,0.06)] px-3 py-2 text-[12px] font-medium text-risk-red">
          Send blocked — remove the hard delivery date. Tideover only sends confidence bands.
        </p>
      ) : null}
      {escalated ? (
        <p className="rounded-lg border border-risk-amber/30 bg-[rgba(217,118,47,0.08)] px-3 py-2 text-[12px] text-terracotta-600">
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
          {busy === "send" ? "Sending…" : "Approve & send"}
        </Button>
        <Button variant="ghost" onClick={regenerate} disabled={busy !== null}>
          {busy === "draft" ? "Regenerating…" : "Regenerate"}
        </Button>
        <Button
          variant="quiet"
          onClick={() => setEscalated((v) => !v)}
          disabled={busy !== null}
        >
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
