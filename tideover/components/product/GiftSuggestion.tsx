"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import type { Gift } from "@/lib/types";
import type { GiftAvailabilityEntry } from "@/lib/engines/gift";
import { Button } from "@/components/ui/Button";
import { Tag } from "@/components/ui/Badge";

const KIND_LABEL: Record<string, string> = {
  "early-access": "Early access",
  "founder-note": "Founder note",
  "priority-dispatch": "Priority dispatch",
  "digital-perk": "Digital perk",
  "next-order-credit": "Next-order credit",
};

// base < mid < full — orders the ladder so a rep reads the progression top-down.
const TIER_ORDER: Record<string, number> = { base: 0, mid: 1, full: 2 };

const dollars = (cents: number) => `$${(cents / 100).toFixed(0)}`;

/**
 * "Gifts available" panel (UX-86, visible half). Shows the full goodwill ladder
 * for the selected ticket, sourced from the engine's per-gift availability:
 *
 *  - the WARRANTED recommendation (`gift`) as a highlighted row with cost /
 *    perceived / ROI, when the engine volunteered one;
 *  - every other UNLOCKED gift as an active, confirm-to-send row;
 *  - every LOCKED gift shown muted with its plain-language unlock reason, so a
 *    rep learns the ladder (watch → mid, high-risk/escalation → full) in place.
 *
 * The panel never hides: on a calm ticket with nothing recommended it still lists
 * availability so the rep sees what a send would take. Sending is two-step
 * (UX-05): a first click arms an inline "Confirm / Cancel"; only Confirm POSTs
 * /api/gift-send, which re-authorizes the tier server-side before logging.
 */
export function GiftSuggestion({
  ticketId,
  gift,
  reasoning,
  roi,
  availability,
  alreadySent = false,
}: {
  ticketId: string;
  gift: Gift | null;
  reasoning: string;
  roi: number | null;
  availability: GiftAvailabilityEntry[];
  alreadySent?: boolean;
}) {
  const router = useRouter();
  const [confirmingId, setConfirmingId] = useState<string | null>(null);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [sentName, setSentName] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  // One goodwill gesture per ticket: once a gift is logged (this session or a
  // prior one, via the persisted gift-sent tag), the send controls retire.
  const logged = alreadySent || sentName !== null;

  const recommendedId = gift?.id ?? null;
  // The rest of the catalog, recommendation excluded (it renders at the top).
  // Unlocked first, then locked; each group ordered base → mid → full.
  const rows = availability
    .filter((a) => a.gift.id !== recommendedId)
    .slice()
    .sort((a, b) => {
      if (a.unlocked !== b.unlocked) return a.unlocked ? -1 : 1;
      return (TIER_ORDER[a.gift.tier] ?? 9) - (TIER_ORDER[b.gift.tier] ?? 9);
    });

  async function send(giftId: string, giftName: string) {
    setBusyId(giftId);
    setError(null);
    try {
      const res = await fetch("/api/gift-send", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ticketId, giftId }),
      });
      if (!res.ok) {
        const data = (await res.json().catch(() => null)) as { error?: string } | null;
        throw new Error(data?.error ?? "Could not send gift");
      }
      setSentName(giftName);
      setConfirmingId(null);
      router.refresh();
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setBusyId(null);
    }
  }

  // Two-step confirm control for one unlocked gift (UX-05). No modal: the first
  // click flips the row into an inline confirm; only Confirm reaches the server.
  function SendControl({ id, name }: { id: string; name: string }) {
    const busy = busyId === id;
    if (confirmingId === id) {
      return (
        <div className="mt-2.5 flex flex-col gap-1.5">
          <p className="text-[12px] font-medium text-ink">Send this gift?</p>
          <div className="flex items-center gap-2">
            <Button variant="primary" onClick={() => send(id, name)} disabled={busy} className="flex-1">
              {busy ? "Sending…" : "Confirm"}
            </Button>
            <Button variant="ghost" onClick={() => setConfirmingId(null)} disabled={busy}>
              Cancel
            </Button>
          </div>
          <p className="text-[11px] text-ink-mute">
            Comes from your goodwill budget — you&rsquo;re authorized to send this.
          </p>
        </div>
      );
    }
    return (
      <Button
        variant="ghost"
        onClick={() => {
          setConfirmingId(id);
          setError(null);
        }}
        className="mt-2.5 w-full"
      >
        Send this gift
      </Button>
    );
  }

  return (
    <div className="panel p-4">
      <h3 className="text-[14px] font-semibold text-ink">Gifts available</h3>

      {/* Perceivable success (role=status): the logged confirmation stays put and
          the send controls retire, so a ticket carries at most one goodwill gift. */}
      {logged ? (
        <p
          role="status"
          aria-live="polite"
          className="mt-2 rounded-lg bg-accent-card px-3 py-2 text-[13px] font-semibold text-teal"
        >
          {sentName ? `Gift logged — ${sentName} sent.` : "A goodwill gift is already logged on this ticket."}
        </p>
      ) : null}

      {error ? <p className="mt-2 text-[12px] font-medium text-risk-red">{error}</p> : null}

      {/* Recommended (warranted) — the engine's best unlocked pick, with stats. */}
      {gift ? (
        <div className="mt-3 rounded-xl border border-border bg-accent-card p-3">
          <div className="flex items-center justify-between gap-2">
            <span className="text-[11px] font-semibold uppercase tracking-wider text-teal">
              Recommended
            </span>
            <Tag>{KIND_LABEL[gift.kind] ?? gift.kind}</Tag>
          </div>
          <p className="mt-1.5 font-serif text-[18px] text-ink">{gift.name}</p>
          <dl className="mt-2.5 grid grid-cols-3 gap-2 text-center">
            <Stat label="Cost" value={dollars(gift.costCents)} />
            <Stat label="Perceived" value={dollars(gift.perceivedValueCents)} />
            <Stat label="ROI" value={roi != null ? `${roi}×` : "—"} />
          </dl>
          <p className="mt-2.5 text-[12px] text-slate">{reasoning}</p>
          {logged ? null : <SendControl id={gift.id} name={gift.name} />}
        </div>
      ) : (
        // Calm state: nothing warranted. The panel still shows the ladder below so
        // the rep sees what a send would take — it never hides.
        <p className="mt-2 text-[13px] text-ink-mute">{reasoning}</p>
      )}

      {/* The rest of the catalog: unlocked (sendable) then locked (with reason). */}
      {rows.length > 0 ? (
        <ul className="mt-3 flex flex-col gap-2">
          {rows.map(({ gift: g, unlocked, unlockReason }) =>
            unlocked ? (
              <li key={g.id} className="rounded-lg border border-border bg-paper px-3 py-2.5">
                <div className="flex items-center justify-between gap-2">
                  <span className="text-[13px] font-semibold text-ink">{g.name}</span>
                  <Tag>{KIND_LABEL[g.kind] ?? g.kind}</Tag>
                </div>
                <div className="mt-1 flex gap-3 text-[11px] text-ink-mute tabular-nums">
                  <span>Cost {dollars(g.costCents)}</span>
                  <span>Perceived {dollars(g.perceivedValueCents)}</span>
                </div>
                {logged ? null : <SendControl id={g.id} name={g.name} />}
              </li>
            ) : (
              <li key={g.id} className="rounded-lg border border-border bg-sand px-3 py-2.5">
                <div className="flex items-center justify-between gap-2">
                  <span className="flex items-center gap-1.5 text-[13px] font-medium text-ink-mute">
                    <span className="text-amber-status">
                      <LockGlyph />
                    </span>
                    {g.name}
                  </span>
                  <Tag>{KIND_LABEL[g.kind] ?? g.kind}</Tag>
                </div>
                <p className="mt-1 text-[11px] font-medium text-amber-status">{unlockReason}</p>
              </li>
            ),
          )}
        </ul>
      ) : null}
    </div>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-lg bg-paper px-2 py-1.5">
      <div className="text-[15px] font-semibold tabular-nums text-ink">{value}</div>
      <div className="text-[10px] uppercase tracking-wider text-ink-mute">{label}</div>
    </div>
  );
}

function LockGlyph() {
  return (
    <svg
      width="13"
      height="13"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2.2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <rect x="3" y="11" width="18" height="11" rx="2" />
      <path d="M7 11V7a5 5 0 0 1 10 0v4" />
    </svg>
  );
}
