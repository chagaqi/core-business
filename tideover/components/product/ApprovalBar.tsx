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
 */
export const ApprovalBar = forwardRef<ApprovalBarHandle, {
  ticketId: string;
  getText: () => string;
  alreadySent: boolean;
  firstResponseSec: number | null;
  merchantId: string;
  nextTicketId: string | null;
}>(function ApprovalBar(
  { ticketId, getText, alreadySent, firstResponseSec, merchantId, nextTicketId },
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
  // Guards against a double-send from ⌘↵ key-repeat racing the busy state.
  const sendingRef = useRef(false);

  async function post(url: string, body: Record<string, unknown>) {
    const res = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
    if (!res.ok) {
      const data = (await res.json().catch(() => null)) as { error?: string } | null;
      throw new Error(data?.error ?? "Request failed");
    }
    return res.json();
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
    if (sendingRef.current) return; // ⌘↵ key-repeat / double-click guard.
    sendingRef.current = true;
    setBusy("send");
    setError(null);
    try {
      await post("/api/approve-send", { ticketId, approvedText: getText() });
      // Advance: replace() to the next ticket (or just ?merchant when the queue
      // is now empty). The page is force-dynamic, so this navigation refetches
      // the queue — where the just-sent ticket is already filtered out — with no
      // separate refresh() (which would flash the sent ticket for a frame first).
      router.replace(
        nextTicketId
          ? `/app/inbox?merchant=${merchantId}&ticket=${nextTicketId}`
          : `/app/inbox?merchant=${merchantId}`,
      );
      // Leave busy set through the navigation; DraftRail remounts on the new
      // ticket (keyed by id), giving fresh state.
    } catch (e) {
      setError((e as Error).message);
      setBusy(null);
      sendingRef.current = false;
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

  return (
    <div className="flex flex-col gap-2">
      {error ? (
        <p className="text-[12px] font-medium text-risk-red">{error}</p>
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
          disabled={busy !== null}
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
