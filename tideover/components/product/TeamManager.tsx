"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { Button } from "@/components/ui/Button";
import type { TeamInvite } from "@/lib/types";

/**
 * Seat management panel for /app/team. Server-rendered data in, /api/team
 * mutations out (owner only — the API enforces it; non-owners see a read-only
 * list). After any successful change we router.refresh() so the server
 * component re-reads the merchant.
 */
export function TeamManager({
  isOwner,
  members,
  invites,
  seatCap,
}: {
  isOwner: boolean;
  members: string[];
  invites: TeamInvite[];
  seatCap: number;
}) {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const call = async (method: "POST" | "DELETE", body: Record<string, string>) => {
    setBusy(true);
    setError(null);
    try {
      const res = await fetch("/api/team", {
        method,
        headers: { "content-type": "application/json" },
        body: JSON.stringify(body),
      });
      const data = (await res.json().catch(() => ({}))) as { error?: string };
      if (!res.ok) {
        setError(data.error ?? "something went wrong — try again");
        return false;
      }
      return true;
    } catch {
      setError("network error — try again");
      return false;
    } finally {
      setBusy(false);
    }
  };

  const addInvite = async () => {
    if (!email.trim()) return;
    if (await call("POST", { email })) {
      setEmail("");
      router.refresh();
    }
  };

  const seatsUsed = members.length + invites.length;

  return (
    <div className="flex max-w-[640px] flex-col gap-4">
      <div className="rounded-xl border border-border bg-paper">
        <div className="flex items-center justify-between border-b border-border px-4 py-3">
          <span className="text-[13px] font-semibold text-ink">Members</span>
          <span className="text-[12px] tabular-nums text-ink-mute">
            {seatsUsed} of {seatCap} seats used (owner not counted)
          </span>
        </div>
        <ul>
          <li className="flex items-center justify-between border-b border-border px-4 py-3 last:border-b-0">
            <div className="min-w-0">
              <div className="truncate text-[14px] font-semibold text-ink">You</div>
              <div className="text-[11px] text-ink-mute">Owner — manages seats</div>
            </div>
          </li>
          {members.map((sub) => (
            <li
              key={sub}
              className="flex items-center justify-between gap-3 border-b border-border px-4 py-3 last:border-b-0"
            >
              <div className="min-w-0">
                <div className="truncate text-[14px] text-ink">{sub}</div>
                <div className="text-[11px] text-ink-mute">Member</div>
              </div>
              {isOwner ? (
                <Button
                  variant="ghost"
                  disabled={busy}
                  onClick={() => {
                    void call("DELETE", { sub }).then((ok) => ok && router.refresh());
                  }}
                >
                  Remove
                </Button>
              ) : null}
            </li>
          ))}
          {members.length === 0 ? (
            <li className="px-4 py-3 text-[13px] text-ink-mute">No teammates yet.</li>
          ) : null}
        </ul>
      </div>

      <div className="rounded-xl border border-border bg-paper">
        <div className="border-b border-border px-4 py-3 text-[13px] font-semibold text-ink">
          Pending invites
        </div>
        <ul>
          {invites.map((invite) => (
            <li
              key={invite.email}
              className="flex items-center justify-between gap-3 border-b border-border px-4 py-3 last:border-b-0"
            >
              <div className="min-w-0">
                <div className="truncate text-[14px] text-ink">{invite.email}</div>
                <div className="text-[11px] text-ink-mute">
                  Waiting for them to sign in with this address
                </div>
              </div>
              {isOwner ? (
                <Button
                  variant="ghost"
                  disabled={busy}
                  onClick={() => {
                    void call("DELETE", { email: invite.email }).then((ok) => ok && router.refresh());
                  }}
                >
                  Remove
                </Button>
              ) : null}
            </li>
          ))}
          {invites.length === 0 ? (
            <li className="px-4 py-3 text-[13px] text-ink-mute">No pending invites.</li>
          ) : null}
        </ul>
      </div>

      {isOwner ? (
        <form
          className="flex items-start gap-2"
          onSubmit={(e) => {
            e.preventDefault();
            void addInvite();
          }}
        >
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="teammate@company.com"
            aria-label="Teammate email"
            className="w-full rounded-lg border border-border bg-paper px-3 py-2 text-[14px] text-ink outline-none focus:border-teal"
          />
          <Button variant="primary" type="submit" disabled={busy || !email.trim()}>
            Invite
          </Button>
        </form>
      ) : (
        <p className="text-[12px] text-ink-mute">
          Only the workspace owner can add or remove seats.
        </p>
      )}

      {error ? (
        <p role="alert" className="rounded-lg border border-terracotta-700/30 bg-sand px-3 py-2 text-[13px] text-terracotta-700">
          {error}
        </p>
      ) : null}
    </div>
  );
}
