import type { Metadata } from "next";
import { getRepositories } from "@/lib/repositories";
import { getStatusHistory, formatWeeksBand, scopeApplies, scopeSpecificity } from "@/lib/status-board";
import { summarizeStatusBoard } from "@/lib/service";
import { timeAgo } from "@/lib/time";
import { MerchantSwitcher } from "@/components/product/MerchantSwitcher";
import { NoMerchantState } from "@/components/product/NoMerchantState";
import {
  StatusBoardComposer,
  type ScopeCandidate,
  type StageOption,
  type BoardRow,
  type HistoryRow,
} from "@/components/product/StatusBoardComposer";
import type { Order, ProductionStatusEntry, StatusScope } from "@/lib/types";

/**
 * THE PRODUCTION STATUS BOARD — /app/status.
 *
 * The one place the founder or ops lead says what is physically happening, and the
 * thing every reply then reads (lib/repositories/live-stage.ts resolves an order's
 * stage from this board BEFORE it falls back to the day-bands, so a status posted
 * here is in the next draft with no further wiring).
 *
 * It exists because the bands are a PLAN and our entire ICP is merchants whose plan
 * broke. In the ten-merchant run the production stage was frozen at CSV import and
 * nothing advanced it, so by day 30, 36% of the replies we sent stated the wrong
 * physical fact about the customer's own order — in the merchant's voice, over
 * their signature. Deriving the stage from the wait fixes the arithmetic. Only a
 * human can fix the truth.
 *
 * THE DESIGN CONSTRAINT IS TIME. A board a founder has to remember to update at
 * 11pm is three weeks stale the first time it matters. So this is one screen, one
 * form, four fields, with the stage / band / scope pre-filled from what they told
 * us last — and it shows, before they post, exactly how many customers the sentence
 * they just typed is about to speak for.
 */

export const dynamic = "force-dynamic";
export const metadata: Metadata = {
  title: "Production status — Tideover",
  robots: { index: false, follow: false },
};

/** Distinct non-empty values of one cohort key across the merchant's orders. */
function distinct(orders: Order[], pick: (o: Order) => string | undefined): string[] {
  const seen = new Map<string, string>();
  for (const o of orders) {
    const v = pick(o)?.trim();
    if (!v) continue;
    const key = v.toLowerCase();
    if (!seen.has(key)) seen.set(key, v);
  }
  return [...seen.values()].sort((a, b) => a.localeCompare(b));
}

/**
 * How many orders a status posted with THIS scope would actually speak for, right
 * now: the orders it matches, minus any order already spoken for by a MORE SPECIFIC
 * status on the board (the same most-specific-wins rule the drafting layer applies).
 *
 * This number is the whole point of the screen. "Post" on a support tool usually
 * means "write a row"; here it means "the next N replies will say this", and a
 * merchant is entitled to see N before they commit to it — that is the difference
 * between telling the EU container's backers the truth and panicking the US half
 * who are fine.
 */
function wouldCover(orders: Order[], board: ProductionStatusEntry[], scope: StatusScope | undefined): number {
  const mine = scopeSpecificity(scope);
  let n = 0;
  for (const o of orders) {
    if (!scopeApplies(scope, o)) continue;
    // A strictly more specific status already on the board keeps this order.
    const outranked = board.some((e) => scopeSpecificity(e.scope) > mine && scopeApplies(e.scope, o));
    if (!outranked) n += 1;
  }
  return n;
}

export default async function StatusPage({
  searchParams,
}: {
  searchParams: { merchant?: string };
}) {
  const repos = getRepositories();
  const merchants = await repos.merchants.list();
  if (merchants.length === 0) return <NoMerchantState />;

  const merchantId =
    searchParams.merchant && merchants.some((m) => m.id === searchParams.merchant)
      ? searchParams.merchant
      : merchants[0].id;
  const merchant = merchants.find((m) => m.id === merchantId)!;

  const [orders, history] = await Promise.all([
    repos.orders.listByMerchant(merchantId),
    getStatusHistory(merchantId),
  ]);

  const summary = summarizeStatusBoard(history, orders);
  const board = summary.scopes.map((s) => s.entry);

  // The scope pick-list is built from the merchant's OWN cohort keys — no free-text
  // field to mistype, and every option carries the count it would reach.
  const candidates: ScopeCandidate[] = [
    {
      id: "all",
      label: "Everyone waiting",
      hint: "Every order with no more specific status",
      scope: null,
      wouldCover: wouldCover(orders, board, undefined),
    },
    ...distinct(orders, (o) => o.campaignName).map((v) => ({
      id: `campaign:${v}`,
      label: v,
      hint: "Campaign",
      scope: { campaignName: v } as StatusScope,
      wouldCover: wouldCover(orders, board, { campaignName: v }),
    })),
    ...distinct(orders, (o) => o.wave).map((v) => ({
      id: `wave:${v}`,
      label: v,
      hint: "Wave / batch",
      scope: { wave: v } as StatusScope,
      wouldCover: wouldCover(orders, board, { wave: v }),
    })),
    ...distinct(orders, (o) => o.region)
      // "unknown" is a missing fact from the import, not a cohort you can address.
      .filter((v) => v.toLowerCase() !== "unknown")
      .map((v) => ({
        id: `region:${v}`,
        label: v,
        hint: "Region",
        scope: { region: v } as StatusScope,
        wouldCover: wouldCover(orders, board, { region: v }),
      })),
  ];

  const stages: StageOption[] = [
    ...merchant.stages.map((s) => ({ key: s.key, label: s.label })),
    {
      key: "overrun" as const,
      label: "Past every stage I planned",
    },
  ];

  const current = summary.scopes[0]?.entry ?? null;
  const boardRows: BoardRow[] = summary.scopes.map((s) => ({
    id: s.entry.id,
    scopeLabel: scopeLabel(s.entry.scope),
    stageLabel: stageLabelFor(merchant.stages, s.entry.stageKey),
    headline: s.entry.headline,
    detail: s.entry.detail ?? null,
    bandPhrase: s.bandPhrase,
    ordersCovered: s.ordersCovered,
    updatedBy: s.entry.updatedBy,
    stamp: timeAgo(s.entry.updatedAt),
    source: s.entry.source,
  }));

  const historyRows: HistoryRow[] = [...history]
    .sort((a, b) => (a.updatedAt < b.updatedAt ? 1 : -1))
    .slice(0, 30)
    .map((e) => ({
      id: e.id,
      scopeLabel: scopeLabel(e.scope),
      headline: e.headline,
      bandPhrase: formatWeeksBand(e.confidenceBand),
      updatedBy: e.updatedBy,
      stamp: timeAgo(e.updatedAt),
      at: new Date(e.updatedAt).toISOString(),
    }));

  return (
    <div className="flex flex-col gap-6 px-6 py-6">
      <header className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <p className="kicker">Production status</p>
          <h1 className="font-serif text-[34px] leading-tight text-ink">
            What is actually happening
          </h1>
          <p className="max-w-[620px] text-[13px] leading-relaxed text-ink-mute">
            Say it once, here. Every reply Tideover drafts reads this before it reads your day-bands
            &mdash; so this is the sentence your customers get, in your voice. No dates: the weeks
            band carries the timing.
          </p>
        </div>
        <MerchantSwitcher
          merchants={merchants.map((m) => ({ id: m.id, name: m.name }))}
          current={merchantId}
        />
      </header>

      <StatusBoardComposer
        merchantId={merchantId}
        stages={stages}
        candidates={candidates}
        board={boardRows}
        history={historyRows}
        totalOrders={summary.totalOrders}
        ordersUncovered={summary.ordersUncovered}
        historyCount={summary.historyCount}
        defaults={{
          stageKey: current?.stageKey ?? merchant.stages[0]?.key ?? "production",
          minWeeks: current?.confidenceBand.minWeeks ?? 1,
          maxWeeks: current?.confidenceBand.maxWeeks ?? 3,
        }}
      />

      <p className="rounded-xl border border-dashed border-border bg-sand px-4 py-3 text-[12px] leading-relaxed text-ink-mute">
        Proof-only: a status is checked for a hard delivery date before it saves, and the history is
        append-only &mdash; nothing here is edited or deleted, because &ldquo;what did you tell this
        backer, and when&rdquo; is the exhibit a card network asks for.
      </p>
    </div>
  );
}

/** Human name for a scope. An empty scope is everyone. */
function scopeLabel(scope: StatusScope | undefined): string {
  if (!scope) return "Everyone waiting";
  const parts = [scope.campaignName, scope.wave, scope.region].filter(Boolean);
  return parts.length ? parts.join(" · ") : "Everyone waiting";
}

function stageLabelFor(stages: Array<{ key: string; label: string }>, key: string): string {
  if (key === "overrun") return "Past every planned stage";
  return stages.find((s) => s.key === key)?.label ?? key;
}
