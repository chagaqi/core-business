"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/Button";

/**
 * Action row for the cockpit draft rail. Regenerate (POST /api/draft), Approve &
 * send (POST /api/approve-send with the edited text), and Escalate (visual note).
 * Every mutation calls router.refresh() so the server surfaces re-read.
 */
export function ApprovalBar({
  ticketId,
  getText,
  alreadySent,
  firstResponseSec,
}: {
  ticketId: string;
  getText: () => string;
  alreadySent: boolean;
  firstResponseSec: number | null;
}) {
  const router = useRouter();
  const [busy, setBusy] = useState<"draft" | "send" | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [escalated, setEscalated] = useState(false);
  const [sentMeta, setSentMeta] = useState<{ frt: number | null } | null>(
    alreadySent ? { frt: firstResponseSec } : null,
  );

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
    setBusy("send");
    setError(null);
    try {
      const data = (await post("/api/approve-send", {
        ticketId,
        approvedText: getText(),
      })) as { firstResponseSec?: number | null };
      setSentMeta({ frt: data.firstResponseSec ?? null });
      router.refresh();
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setBusy(null);
    }
  }

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
}

function formatFrt(sec: number): string {
  if (sec < 60) return `${sec}s`;
  const m = Math.round(sec / 60);
  if (m < 60) return `${m}m`;
  const h = Math.floor(m / 60);
  return `${h}h ${m % 60}m`;
}
