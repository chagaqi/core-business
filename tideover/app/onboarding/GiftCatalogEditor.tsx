"use client";

import { clsx } from "clsx";

/**
 * Goodwill-gift catalog editor for the onboarding wizard (UX-86). The merchant
 * EDITS a suggested catalog — they never author from scratch — so the flow stays
 * under the persona-B 15-minute budget. TIER is the only availability lever we
 * surface; the raw risk/wait/LTV eligibility numbers are derived server-side and
 * never shown here.
 */

export type GiftKind =
  | "early-access"
  | "founder-note"
  | "priority-dispatch"
  | "digital-perk"
  | "next-order-credit";

export type GiftTier = "base" | "mid" | "full";

export interface GiftRow {
  name: string;
  kind: GiftKind;
  tier: GiftTier;
  costCents: number;
  perceivedValueCents: number;
}

export const GIFT_KIND_OPTIONS: Array<{ value: GiftKind; label: string }> = [
  { value: "early-access", label: "Early access" },
  { value: "founder-note", label: "Founder note" },
  { value: "priority-dispatch", label: "Priority dispatch" },
  { value: "digital-perk", label: "Digital perk" },
  { value: "next-order-credit", label: "Next-order credit" },
];

export const GIFT_TIER_OPTIONS: Array<{ value: GiftTier; label: string }> = [
  { value: "base", label: "Base" },
  { value: "mid", label: "Mid" },
  { value: "full", label: "Full" },
];

/**
 * The five suggested gifts a new merchant starts from (mirrors the server-side
 * DEFAULT_GIFTS in lib/onboarding.ts: 2 base, 2 mid, 1 full → the gate is met on
 * arrival). Keep these two lists in sync.
 */
export const SUGGESTED_GIFTS: GiftRow[] = [
  { name: "Early access to the next drop", kind: "early-access", tier: "base", costCents: 0, perceivedValueCents: 4000 },
  { name: "Handwritten founder note", kind: "founder-note", tier: "mid", costCents: 500, perceivedValueCents: 3000 },
  { name: "Priority dispatch (first out the door)", kind: "priority-dispatch", tier: "mid", costCents: 1200, perceivedValueCents: 6000 },
  { name: "Digital perk pack (wallpapers + guide)", kind: "digital-perk", tier: "base", costCents: 0, perceivedValueCents: 2000 },
  { name: "$25 next-order credit", kind: "next-order-credit", tier: "full", costCents: 2500, perceivedValueCents: 2500 },
];

/** A blank-ish base gift appended when the merchant adds a row (never empty-named). */
export function newGiftRow(): GiftRow {
  return { name: "New goodwill gift", kind: "digital-perk", tier: "base", costCents: 0, perceivedValueCents: 1000 };
}

/** The advance/submit gate: >=3 gifts AND >=1 base gift (client mirror of the zod rule). */
export function giftsValid(gifts: GiftRow[]): boolean {
  return gifts.length >= 3 && gifts.some((g) => g.tier === "base");
}

const centsToDollars = (c: number): string => (c / 100 === 0 ? "0" : String(c / 100));
const dollarsToCents = (v: string): number => {
  const n = Number.parseFloat(v);
  return Number.isFinite(n) && n > 0 ? Math.round(n * 100) : 0;
};

const rowInput =
  "w-full rounded-lg border border-border bg-paper px-3 py-2 text-[14px] text-ink outline-none focus:border-teal";

function DollarField({
  label,
  cents,
  onCents,
  max,
  id,
}: {
  label: string;
  cents: number;
  onCents: (c: number) => void;
  max?: number;
  id: string;
}) {
  return (
    <label className="flex flex-col gap-1">
      <span className="text-[12px] font-medium text-ink-mute">{label}</span>
      <div className="flex items-center gap-1.5">
        <span className="text-[13px] text-ink-mute">$</span>
        <input
          type="number"
          min={0}
          max={max}
          step="0.01"
          value={centsToDollars(cents)}
          onChange={(e) => onCents(dollarsToCents(e.target.value))}
          aria-label={label}
          id={id}
          className={rowInput}
        />
      </div>
    </label>
  );
}

export function GiftCatalogEditor({
  gifts,
  updateGift,
  removeGift,
  addGift,
}: {
  gifts: GiftRow[];
  updateGift: (i: number, patch: Partial<GiftRow>) => void;
  removeGift: (i: number) => void;
  addGift: () => void;
}) {
  const enoughGifts = gifts.length >= 3;
  const hasBase = gifts.some((g) => g.tier === "base");

  return (
    <div className="flex flex-col gap-5">
      <div>
        <p className="text-[13.5px] leading-relaxed text-slate">
          When a wait drags on, a small goodwill gesture defuses a lot of anxiety. We&rsquo;ve
          suggested a starter set &mdash; edit anything, drop what doesn&rsquo;t fit, add your own.
        </p>
        <p className="mt-2 text-[12px] leading-relaxed text-ink-mute">
          Tier is who can receive it: <strong className="text-slate">Base</strong> = every waiting
          customer &middot; <strong className="text-slate">Mid</strong> = watch-risk &amp; up
          &middot; <strong className="text-slate">Full</strong> = high-risk / escalated.
        </p>
      </div>

      <div className="flex flex-col gap-3">
        {gifts.map((g, i) => (
          <div key={i} className="rounded-xl border border-border bg-sand p-4">
            <div className="mb-3 flex items-start gap-3">
              <input
                value={g.name}
                onChange={(e) => updateGift(i, { name: e.target.value })}
                aria-label={`gift ${i + 1} name`}
                placeholder="What the customer receives…"
                className={clsx(rowInput, "flex-1 font-semibold")}
              />
              <button
                type="button"
                onClick={() => removeGift(i)}
                aria-label={`remove gift ${i + 1}`}
                className="mt-2 shrink-0 text-[12.5px] font-medium text-ink-mute underline-offset-2 hover:text-slate hover:underline"
              >
                Remove
              </button>
            </div>
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
              <label className="flex flex-col gap-1">
                <span className="text-[12px] font-medium text-ink-mute">Kind</span>
                <select
                  value={g.kind}
                  onChange={(e) => updateGift(i, { kind: e.target.value as GiftKind })}
                  aria-label={`gift ${i + 1} kind`}
                  className={rowInput}
                >
                  {GIFT_KIND_OPTIONS.map((o) => (
                    <option key={o.value} value={o.value}>
                      {o.label}
                    </option>
                  ))}
                </select>
              </label>
              <label className="flex flex-col gap-1">
                <span className="text-[12px] font-medium text-ink-mute">Tier</span>
                <select
                  value={g.tier}
                  onChange={(e) => updateGift(i, { tier: e.target.value as GiftTier })}
                  aria-label={`gift ${i + 1} tier`}
                  className={rowInput}
                >
                  {GIFT_TIER_OPTIONS.map((o) => (
                    <option key={o.value} value={o.value}>
                      {o.label}
                    </option>
                  ))}
                </select>
              </label>
              <DollarField
                label="Cost"
                cents={g.costCents}
                onCents={(c) => updateGift(i, { costCents: Math.min(c, 50000) })}
                max={500}
                id={`gift-${i}-cost`}
              />
              <DollarField
                label="Perceived value"
                cents={g.perceivedValueCents}
                onCents={(c) => updateGift(i, { perceivedValueCents: c })}
                id={`gift-${i}-value`}
              />
            </div>
          </div>
        ))}
      </div>

      <div className="flex items-center justify-between gap-4">
        <button
          type="button"
          onClick={addGift}
          className="rounded-lg border border-dashed border-ink-mute px-3.5 py-2 text-[13px] font-semibold text-slate transition hover:border-teal hover:text-teal"
        >
          + Add a gift
        </button>
        {!enoughGifts || !hasBase ? (
          <p className="text-right text-[12.5px] font-medium text-amber-status">
            {!enoughGifts
              ? "Keep at least 3 gifts."
              : "Add at least one Base gift — the one every waiting customer can receive."}
          </p>
        ) : null}
      </div>
    </div>
  );
}
