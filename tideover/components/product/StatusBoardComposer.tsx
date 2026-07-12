"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { clsx } from "clsx";
import { Button } from "@/components/ui/Button";
import { Field, TextInput, TextArea } from "@/components/ui/Field";
import type { ProductionStatusSource, ResolvedStageKey, StatusScope } from "@/lib/types";

/**
 * THE STATUS BOARD COMPOSER.
 *
 * One form, four fields, thirty seconds: the stage, the sentence, the weeks band,
 * and who it is about. Everything is pre-filled from the last status, so the common
 * case ("same cohort, moved on a stage, band slipped a week") is two edits and a
 * click.
 *
 * The line that makes it a product and not a form: before posting, it says HOW MANY
 * CUSTOMERS THIS SENTENCE IS ABOUT TO SPEAK FOR. Every reply Tideover drafts for
 * those orders reads this status first, so the number is not decoration — it is the
 * blast radius, and a merchant is entitled to see it before they commit. That is the
 * difference between telling the EU container's backers the truth and panicking the
 * US half who are fine.
 *
 * Proof-only: no date field exists. The timing is a band in WEEKS, and the server
 * rejects a hard date in the headline or the detail (lib/status-board.recordStatus)
 * before it can reach a single customer.
 */

export interface StageOption {
  key: ResolvedStageKey;
  label: string;
}

export interface ScopeCandidate {
  id: string;
  label: string;
  hint: string;
  /** null = merchant-wide (everyone with no more specific status). */
  scope: StatusScope | null;
  /** orders this status would actually speak for, if posted now. */
  wouldCover: number;
}

export interface BoardRow {
  id: string;
  scopeLabel: string;
  stageLabel: string;
  headline: string;
  detail: string | null;
  bandPhrase: string;
  ordersCovered: number;
  updatedBy: string;
  stamp: string;
  source: ProductionStatusSource;
}

export interface HistoryRow {
  id: string;
  scopeLabel: string;
  headline: string;
  bandPhrase: string;
  updatedBy: string;
  stamp: string;
  at: string;
}

const plural = (n: number, one: string, many: string) => (n === 1 ? one : many);
const num = (n: number) => n.toLocaleString("en-US");

/** The band exactly as a reply will quote it — mirrors lib/status-board.formatWeeksBand. */
function bandPhrase(minWeeks: number, maxWeeks: number): string {
  const lo = Math.max(0, Math.round(minWeeks));
  const hi = Math.max(lo, Math.round(maxWeeks));
  return lo === hi ? `in about ${lo} weeks` : `in weeks ${lo}–${hi}`;
}

export function StatusBoardComposer({
  merchantId,
  stages,
  candidates,
  board,
  history,
  totalOrders,
  ordersUncovered,
  historyCount,
  defaults,
}: {
  merchantId: string;
  stages: StageOption[];
  candidates: ScopeCandidate[];
  board: BoardRow[];
  history: HistoryRow[];
  totalOrders: number;
  ordersUncovered: number;
  historyCount: number;
  defaults: { stageKey: ResolvedStageKey; minWeeks: number; maxWeeks: number };
}) {
  const router = useRouter();
  const [stageKey, setStageKey] = useState<ResolvedStageKey>(defaults.stageKey);
  const [headline, setHeadline] = useState("");
  const [detail, setDetail] = useState("");
  const [minWeeks, setMinWeeks] = useState(String(defaults.minWeeks));
  const [maxWeeks, setMaxWeeks] = useState(String(defaults.maxWeeks));
  const [scopeId, setScopeId] = useState(candidates[0]?.id ?? "all");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [showHistory, setShowHistory] = useState(false);

  const selected = useMemo(
    () => candidates.find((c) => c.id === scopeId) ?? candidates[0],
    [candidates, scopeId],
  );
  const lo = Number(minWeeks);
  const hi = Number(maxWeeks);
  const bandOk = Number.isFinite(lo) && Number.isFinite(hi) && lo >= 0 && hi >= lo;
  const covers = selected?.wouldCover ?? 0;
  const canPost = headline.trim().length > 0 && bandOk && !busy;

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!canPost) return;
    setBusy(true);
    setError(null);
    setNotice(null);
    try {
      const res = await fetch("/api/status-board", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          merchantId,
          stageKey,
          headline: headline.trim(),
          ...(detail.trim() ? { detail: detail.trim() } : {}),
          minWeeks: Math.round(lo),
          maxWeeks: Math.round(hi),
          ...(selected?.scope ? { scope: selected.scope } : {}),
        }),
      });
      const data = (await res.json().catch(() => ({}))) as { error?: string };
      if (!res.ok) {
        setError(data.error ?? "Something went wrong posting that status.");
        return;
      }
      setHeadline("");
      setDetail("");
      setNotice(
        covers > 0
          ? `Posted. The next reply to any of these ${num(covers)} ${plural(covers, "customer", "customers")} carries it.`
          : "Posted. No orders match this scope yet, so no reply carries it until one does.",
      );
      router.refresh();
    } catch {
      setError("Network error posting that status.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="flex flex-col gap-6">
      {/* ── the composer ─────────────────────────────────────────────────── */}
      <form onSubmit={submit} className="panel flex flex-col gap-5 p-5 md:p-6">
        <Field label="Who is this about?" hint="Only the people it is true for. Everyone else keeps the status they already have." group>
          <div className="flex flex-wrap gap-1.5">
            {candidates.map((c) => {
              const active = c.id === scopeId;
              return (
                <button
                  key={c.id}
                  type="button"
                  onClick={() => setScopeId(c.id)}
                  aria-pressed={active}
                  className={clsx(
                    "rounded-lg border px-3 py-1.5 text-left text-[12.5px] font-semibold transition",
                    active
                      ? "border-teal bg-accent-card text-teal"
                      : "border-border text-ink-mute hover:bg-sand",
                  )}
                >
                  {c.label}
                  <span className="ml-1.5 font-normal tabular-nums opacity-70">
                    {num(c.wouldCover)}
                  </span>
                </button>
              );
            })}
          </div>
        </Field>

        <Field label="Where is it, physically?" hint="The stage this cohort is actually in right now.">
          <select
            value={stageKey}
            onChange={(e) => setStageKey(e.target.value as ResolvedStageKey)}
            className="w-full rounded-lg border border-border bg-paper px-3.5 py-2.5 text-[16px] text-ink transition focus:border-teal"
          >
            {stages.map((s) => (
              <option key={s.key} value={s.key}>
                {s.label}
              </option>
            ))}
          </select>
        </Field>

        <Field
          label="What is happening?"
          hint="One sentence, in your words. This is what your customers read — write it to them, not about them."
        >
          <TextInput
            value={headline}
            onChange={(e) => setHeadline(e.target.value)}
            placeholder="The re-cut moulds cleared their first test shots and the line starts next run."
            maxLength={280}
          />
        </Field>

        <Field label="The why, if it helps (optional)" hint="The mechanism. What moved, what it means for their order.">
          <TextArea
            value={detail}
            onChange={(e) => setDetail(e.target.value)}
            placeholder="The joint housing tool had to be re-cut after the first samples pulled short. That is the stage most likely to move, and it is the stage that moved."
            maxLength={2000}
          />
        </Field>

        <Field
          label="How long, in weeks?"
          hint="A band, never a date. Every reply to this cohort quotes it back exactly as written below."
          group
        >
          <div className="flex flex-wrap items-center gap-2">
            <TextInput
              value={minWeeks}
              onChange={(e) => setMinWeeks(e.target.value)}
              inputMode="numeric"
              aria-label="Minimum weeks"
              className="w-20"
            />
            <span className="text-[13px] text-ink-mute">to</span>
            <TextInput
              value={maxWeeks}
              onChange={(e) => setMaxWeeks(e.target.value)}
              inputMode="numeric"
              aria-label="Maximum weeks"
              className="w-20"
            />
            <span className="text-[13px] text-ink-mute">weeks</span>
            {bandOk ? (
              <span className="rounded-full border border-border bg-sand px-2.5 py-0.5 text-[12px] text-ink-mute">
                reads: &ldquo;{bandPhrase(lo, hi)}&rdquo;
              </span>
            ) : (
              <span className="text-[12px] font-semibold text-risk-red">
                Whole weeks, and the upper bound cannot be below the lower one.
              </span>
            )}
          </div>
        </Field>

        {/* the blast radius — the number that makes this a decision, not a form */}
        <div className="rounded-xl border border-teal/30 bg-accent-card px-4 py-3">
          <p className="text-[13px] leading-relaxed text-ink">
            <strong className="font-semibold">
              This is what your next {num(covers)} {plural(covers, "reply", "replies")} will say.
            </strong>{" "}
            {covers > 0 ? (
              <>
                {selected?.label === "Everyone waiting" ? (
                  <>Every waiting order with no more specific status on the board.</>
                ) : (
                  <>
                    Only {selected?.label} &mdash; the other{" "}
                    {num(Math.max(0, totalOrders - covers))} keep what they already have.
                  </>
                )}
              </>
            ) : (
              <>No order on file matches this scope yet.</>
            )}
          </p>
          {headline.trim() ? (
            <p className="mt-2 border-l-2 border-teal/40 pl-3 text-[13px] italic leading-relaxed text-slate">
              &ldquo;{headline.trim()}
              {bandOk ? ` Your order ships ${bandPhrase(lo, hi)}.` : ""}&rdquo;
            </p>
          ) : null}
        </div>

        {error ? (
          <p className="rounded-lg border border-risk-red/30 bg-[rgba(192,70,59,0.08)] px-3.5 py-2.5 text-[13px] text-risk-red">
            {error}
          </p>
        ) : null}
        {notice ? (
          <p className="rounded-lg border border-risk-green/30 bg-[rgba(62,142,110,0.08)] px-3.5 py-2.5 text-[13px] text-risk-green">
            {notice}
          </p>
        ) : null}

        <div className="flex flex-wrap items-center gap-3">
          <Button type="submit" disabled={!canPost}>
            {busy ? "Posting…" : "Post this status"}
          </Button>
          <span className="text-[12px] text-ink-mute">
            Drafts read it immediately. No date can be saved here.
          </span>
        </div>
      </form>

      {/* ── the board: what each cohort is currently being told ───────────── */}
      <section className="flex flex-col gap-3">
        <div className="flex flex-wrap items-baseline justify-between gap-2">
          <h2 className="font-serif text-[20px] text-ink">What each cohort is being told</h2>
          <span className="text-[12px] text-ink-mute">
            {num(totalOrders - ordersUncovered)} of {num(totalOrders)}{" "}
            {plural(totalOrders, "order", "orders")} covered by a status
            {ordersUncovered > 0
              ? ` · ${num(ordersUncovered)} still running on your day-bands alone`
              : ""}
          </span>
        </div>

        {board.length === 0 ? (
          <div className="proof-placeholder">
            No status posted yet. Until you post one, every reply describes the stage your day-bands
            imply from the wait &mdash; which is your plan, not your workshop.
          </div>
        ) : (
          board.map((b) => (
            <article key={b.id} className="panel p-4">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <span className="rounded-full border border-teal/30 bg-accent-card px-2.5 py-0.5 text-[11px] font-semibold uppercase tracking-wider text-teal">
                  {b.scopeLabel}
                </span>
                <span className="text-[12px] tabular-nums text-ink-mute">
                  {num(b.ordersCovered)} {plural(b.ordersCovered, "customer", "customers")}
                </span>
              </div>
              <p className="mt-2 text-[15px] leading-relaxed text-ink">{b.headline}</p>
              {b.detail ? (
                <p className="mt-1.5 whitespace-pre-line text-[13.5px] leading-relaxed text-slate">
                  {b.detail}
                </p>
              ) : null}
              <div className="mt-3 flex flex-wrap items-center gap-x-2 gap-y-1 text-[12px] text-ink-mute">
                <span className="font-semibold text-ink">{b.stageLabel}</span>
                <span aria-hidden="true">·</span>
                <span>{b.bandPhrase}</span>
                <span aria-hidden="true">·</span>
                <span>
                  {b.updatedBy}, {b.stamp}
                </span>
                {b.source !== "manual" ? (
                  <>
                    <span aria-hidden="true">·</span>
                    <span>from {b.source}</span>
                  </>
                ) : null}
              </div>
            </article>
          ))
        )}
      </section>

      {/* ── the history: what you told them, and when ─────────────────────── */}
      <section className="panel p-5">
        <button
          type="button"
          onClick={() => setShowHistory((v) => !v)}
          aria-expanded={showHistory}
          className="flex w-full items-center justify-between gap-3 text-left"
        >
          <span>
            <span className="block font-serif text-[18px] text-ink">
              What you told them, and when
            </span>
            <span className="block text-[12px] text-ink-mute">
              {historyCount} {plural(historyCount, "entry", "entries")}, append-only. This is the
              chargeback exhibit.
            </span>
          </span>
          <span className="link-quiet shrink-0 text-[13px]">{showHistory ? "Hide" : "Show"}</span>
        </button>

        {showHistory ? (
          history.length === 0 ? (
            <p className="proof-placeholder mt-4">Nothing posted yet.</p>
          ) : (
            <ul className="mt-4 flex flex-col gap-2.5">
              {history.map((h) => (
                <li key={h.id} className="border-l-2 border-border pl-3">
                  <p className="text-[13.5px] leading-relaxed text-ink">{h.headline}</p>
                  <p className="text-[12px] text-ink-mute">
                    {h.scopeLabel} · {h.bandPhrase} · {h.updatedBy} ·{" "}
                    <time dateTime={h.at}>{h.stamp}</time>
                  </p>
                </li>
              ))}
            </ul>
          )
        ) : null}
      </section>
    </div>
  );
}
