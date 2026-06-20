"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import type { Gift } from "@/lib/types";
import { Button } from "@/components/ui/Button";
import { Tag } from "@/components/ui/Badge";

const KIND_LABEL: Record<string, string> = {
  "early-access": "Early access",
  "founder-note": "Founder note",
  "priority-dispatch": "Priority dispatch",
  "digital-perk": "Digital perk",
  "next-order-credit": "Next-order credit",
};

const dollars = (cents: number) => `$${(cents / 100).toFixed(0)}`;

/**
 * Recommended-gift card. When the engine returns a gift, the operator can send
 * it one-click (POST /api/gift-send → router.refresh). When null, the reasoning
 * is shown muted — we only ever surface a gift when it actually helps.
 */
export function GiftSuggestion({
  ticketId,
  gift,
  reasoning,
  roi,
  alreadySent = false,
}: {
  ticketId: string;
  gift: Gift | null;
  reasoning: string;
  roi: number | null;
  alreadySent?: boolean;
}) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [sent, setSent] = useState(alreadySent);
  const [error, setError] = useState<string | null>(null);

  if (!gift) {
    return (
      <div className="panel bg-sand p-4">
        <h3 className="text-[14px] font-semibold text-ink">Goodwill gift</h3>
        <p className="mt-1 text-[13px] text-ink-mute">{reasoning}</p>
      </div>
    );
  }

  async function send() {
    if (!gift) return;
    setBusy(true);
    setError(null);
    try {
      const res = await fetch("/api/gift-send", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ticketId, giftId: gift.id }),
      });
      if (!res.ok) {
        const data = (await res.json().catch(() => null)) as { error?: string } | null;
        throw new Error(data?.error ?? "Could not send gift");
      }
      setSent(true);
      router.refresh();
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="panel p-4">
      <div className="flex items-center justify-between gap-2">
        <h3 className="text-[14px] font-semibold text-ink">Recommended gift</h3>
        <Tag>{KIND_LABEL[gift.kind] ?? gift.kind}</Tag>
      </div>

      <p className="mt-2 font-serif text-[18px] text-ink">{gift.name}</p>

      <dl className="mt-3 grid grid-cols-3 gap-2 text-center">
        <Stat label="Cost" value={dollars(gift.costCents)} />
        <Stat label="Perceived" value={dollars(gift.perceivedValueCents)} />
        <Stat label="ROI" value={roi != null ? `${roi}×` : "—"} />
      </dl>

      <p className="mt-3 text-[12px] text-slate">{reasoning}</p>

      {error ? (
        <p className="mt-2 text-[12px] font-medium text-risk-red">{error}</p>
      ) : null}

      <div className="mt-3">
        {sent ? (
          <p className="rounded-lg bg-accent-card px-3 py-2 text-[13px] font-semibold text-teal">
            Gift logged — {gift.name} sent.
          </p>
        ) : (
          <Button variant="ghost" onClick={send} disabled={busy} className="w-full">
            {busy ? "Sending…" : "Send gift"}
          </Button>
        )}
      </div>
    </div>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-lg bg-sand px-2 py-1.5">
      <div className="text-[15px] font-semibold tabular-nums text-ink">{value}</div>
      <div className="text-[10px] uppercase tracking-wider text-ink-mute">{label}</div>
    </div>
  );
}
