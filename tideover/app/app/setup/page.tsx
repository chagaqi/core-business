import Link from "next/link";
import { clsx } from "clsx";
import { getSetupChecklist } from "@/lib/service";
import { getRepositories } from "@/lib/repositories";
import { MerchantSwitcher } from "@/components/product/MerchantSwitcher";
import { NoMerchantState } from "@/components/product/NoMerchantState";
import { Button } from "@/components/ui/Button";
import { type SetupItemKey } from "@/lib/setup";
import { ConnectPanel } from "@/app/onboarding/ConnectPanel";
import { ImportPanel } from "@/app/onboarding/ImportPanel";
import { helpdeskSetups } from "@/lib/ingest-templates";
import { getIngestStatus, type IngestStatus } from "@/lib/setup-status";
import { computeTimeline } from "@/lib/time";
import type { Metadata } from "next";

/**
 * Setup checklist (task U4) — "you're N of 5 set up".
 *
 * Every item is DERIVED from the merchant's real state (see lib/setup.ts), never
 * a click-to-check flag: an item shows done ONLY when it is genuinely true, so
 * the page can't drift from reality and nothing is fabricated. Done steps are
 * checked and muted; the FIRST not-done step is highlighted as "do this next"
 * with its hint and a link to the surface that completes it. When all five are
 * derived-done the page shows a clean "you're fully set up" state.
 *
 * Operator surface: server-rendered, behind the F2 auth gate via middleware's
 * /app/:path* matcher, and respects ?merchant= like every other /app page.
 */

export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "Setup — Tideover" };

/** Page-level CTA label for the "do this next" step (presentation only). */
const CTA_LABEL: Record<SetupItemKey, string> = {
  brand: "Review brand & voice",
  import: "Import your backer list",
  helpdesk: "Connect your helpdesk",
  "first-reply": "Open the inbox",
  "status-visible": "Post an update",
};

/**
 * The ingest health banner (ADR-0021 §2). A broken webhook used to look exactly
 * like a quiet week — a calm, empty queue and a green "helpdesk connected" ✓ that
 * flipped on the moment a tag filter was saved in onboarding, before a single
 * ticket existed. This is the surface that refuses to let that happen: once a
 * merchant has told us they have a helpdesk, SILENCE IS AN ALARM, it says why,
 * and it says exactly what to paste where.
 */
function IngestBanner({ status }: { status: IngestStatus }) {
  if (status.level === "idle") return null;
  const alarm = status.level === "alarm";
  const warn = status.level === "warn";
  const failures = status.counts.rejected + status.counts.invalid + status.counts.discarded;

  return (
    <section
      role={alarm ? "alert" : undefined}
      className={clsx(
        "rounded-xl border p-5",
        alarm && "border-risk-red bg-risk-red/10",
        warn && "border-amber-400 bg-amber-50",
        status.level === "ok" && "border-border bg-sand",
      )}
    >
      <div className="flex items-start gap-3">
        <span
          aria-hidden="true"
          className={clsx(
            "mt-0.5 flex h-6 w-6 flex-none items-center justify-center rounded-full text-[13px] font-bold",
            alarm && "bg-risk-red text-ink-inverse",
            warn && "bg-amber-400 text-ink",
            status.level === "ok" && "bg-teal text-ink-inverse",
          )}
        >
          {alarm ? "!" : warn ? "!" : "✓"}
        </span>
        <div className="min-w-0 flex-1">
          <h2
            className={clsx(
              "text-[15px] font-semibold",
              alarm ? "text-risk-red" : "text-ink",
            )}
          >
            {status.headline}
          </h2>
          <p className="mt-1 max-w-[680px] text-[13.5px] leading-relaxed text-slate">
            {status.detail}
          </p>

          {status.fix && (
            <div className="mt-3 rounded-lg border border-border bg-paper p-3">
              <p className="mb-1 text-[11px] font-bold uppercase tracking-wider text-ink-mute">
                How to fix it
              </p>
              <p className="text-[13px] leading-relaxed text-ink">{status.fix}</p>
            </div>
          )}

          {status.lastFailure && (
            <p className="mt-2 text-[12px] leading-relaxed text-ink-mute">
              Last failure: <strong>{status.lastFailure.kind}</strong>
              {status.lastFailure.reason ? ` (${status.lastFailure.reason})` : ""} on the{" "}
              {status.lastFailure.channel} endpoint
              {status.lastFailure.detail ? ` — ${status.lastFailure.detail}` : ""}.
            </p>
          )}

          {/* The counters, only when there is something to count. Rejected /
              discarded payloads NEVER became tickets — they are the tickets the
              merchant thinks they don't have. */}
          {(failures > 0 || status.counts.unmatched > 0) && (
            <dl className="mt-3 flex flex-wrap gap-x-6 gap-y-1 text-[12px] text-ink-mute">
              {status.counts.rejected > 0 && (
                <div>
                  <dt className="inline font-semibold text-ink">{status.counts.rejected}</dt>{" "}
                  <dd className="inline">refused at the door</dd>
                </div>
              )}
              {status.counts.invalid > 0 && (
                <div>
                  <dt className="inline font-semibold text-ink">{status.counts.invalid}</dt>{" "}
                  <dd className="inline">off-template bodies</dd>
                </div>
              )}
              {status.counts.discarded > 0 && (
                <div>
                  <dt className="inline font-semibold text-ink">{status.counts.discarded}</dt>{" "}
                  <dd className="inline">dropped by your tag rule</dd>
                </div>
              )}
              {status.counts.unmatched > 0 && (
                <div>
                  <dt className="inline font-semibold text-ink">{status.counts.unmatched}</dt>{" "}
                  <dd className="inline">with no matching order</dd>
                </div>
              )}
              <div>
                <dt className="inline font-semibold text-ink">{status.counts.accepted}</dt>{" "}
                <dd className="inline">delivered into your queue</dd>
              </div>
            </dl>
          )}

          <p className="mt-2 text-[11px] leading-relaxed text-ink-mute">
            Counted since this server last started, so the totals can under-report after a deploy.
            Whether anything has <em>ever</em> arrived is read from your real tickets and is always
            accurate.
          </p>
        </div>
      </div>
    </section>
  );
}

export default async function SetupPage({
  searchParams,
}: {
  searchParams: { merchant?: string };
}) {
  const repos = getRepositories();
  const merchants = await repos.merchants.list();
  if (merchants.length === 0) {
    return <NoMerchantState />;
  }
  const merchantId =
    searchParams.merchant && merchants.some((m) => m.id === searchParams.merchant)
      ? searchParams.merchant
      : merchants[0].id;
  const merchant = merchants.find((m) => m.id === merchantId)!;

  const checklist = await getSetupChecklist(merchantId);
  if (!checklist) {
    return <NoMerchantState />;
  }
  const { items, completed, total, allDone } = checklist;

  // Ingest health (ADR-0021). Replaces the old F7 `integrationHealth` check on
  // this page, which reported `quiet: false` when NOTHING had ever arrived — i.e.
  // it was coded to stay silent about the one merchant who is actually broken.
  const ingest = await getIngestStatus(merchantId);

  // SW10 (backlog #11): the wait-time health signal — orders past the delivery
  // WINDOW the merchant promised (computeTimeline().overdue), and whether a
  // posted status is covering them. "overdue" = past the window, NOT "past every
  // band" (that's the OVERRUN stage) — the copy below says window, accurately
  // (pre-merge review 2026-07-27). "covered" reuses the checklist's own
  // status-visible predicate rather than inventing a second definition.
  const allOrders = await repos.orders.listByMerchant(merchantId);
  const healthNow = new Date();
  const overdueCount = allOrders.filter(
    (o) => computeTimeline(o, merchant, healthNow).overdue,
  ).length;
  const statusCovered = checklist.items.find((i) => i.key === "status-visible")?.done ?? false;
  const lastInboundLabel =
    ingest == null || ingest.quietDays == null
      ? null
      : ingest.quietDays === 0
        ? "today"
        : `${ingest.quietDays} day${ingest.quietDays === 1 ? "" : "s"} ago`;

  // ?merchant= is preserved onto the in-app links so the operator stays on the
  // same merchant. Fragment-aware: the query must sit BEFORE any #anchor
  // (checklist items point at the #import / #connect panels on this page).
  const suffix = `?merchant=${merchantId}`;
  const resolveHref = (href: string) => {
    if (!href.startsWith("/app")) return href;
    const [path, hash] = href.split("#");
    return `${path}${suffix}${hash ? `#${hash}` : ""}`;
  };
  const firstUndoneIndex = items.findIndex((i) => !i.done);

  return (
    <div className="flex flex-col gap-6 px-6 py-6">
      {merchant.isDemo && (
        <div className="ev-watermark" aria-hidden="true">
          <span>SAMPLE DATA</span>
        </div>
      )}

      <header className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <p className="kicker">Setup</p>
          <h1 className="font-serif text-[34px] leading-tight text-ink">
            You&rsquo;re {completed} of {total} set up
          </h1>
          <p className="max-w-[560px] text-[13px] text-ink-mute">
            Each step is read from your real data, not a box someone ticked. A step shows done only
            when it has actually happened, so this list always tells the truth.
          </p>
        </div>
        <MerchantSwitcher
          merchants={merchants.map((m) => ({ id: m.id, name: m.name }))}
          current={merchantId}
        />
      </header>

      {overdueCount > 0 ? (
        <div
          className="panel flex flex-wrap items-center justify-between gap-3 border-l-4 px-5 py-4"
          style={{ borderLeftColor: statusCovered ? "var(--amber-status)" : "var(--risk-red)" }}
        >
          <div>
            <p className="text-[14px] font-semibold text-ink">
              {overdueCount} order{overdueCount === 1 ? " is" : "s are"} past the delivery window you
              promised
            </p>
            <p className="max-w-[560px] text-[13px] text-slate">
              {statusCovered
                ? "Your status board is covering them — keep it fresh so every reply stays true."
                : "Buyers on these orders have no posted update, so replies fall back to the overdue reassurance instead of a real one. One posted status covers every one of them at once."}
            </p>
          </div>
          <Link href={resolveHref("/app/status")} className="btn btn-ghost px-4 py-2 text-[13px]">
            Post a status update
          </Link>
        </div>
      ) : null}

      {/* Progress: one segment per step, filled when that step is derived-done. */}
      <div className="flex items-center gap-3">
        <div className="flex flex-1 gap-1.5" aria-hidden="true">
          {items.map((it) => (
            <span
              key={it.key}
              className={clsx("h-1.5 flex-1 rounded-full", it.done ? "bg-teal" : "bg-border")}
            />
          ))}
        </div>
        <span className="text-[12px] font-semibold tabular-nums text-ink-mute">
          {completed}/{total}
        </span>
      </div>

      {/* Ingest health, ABOVE the checklist: a broken helpdesk is the loudest
          thing on this page, because it is the failure the merchant cannot see
          anywhere else — their queue just looks quiet. */}
      {ingest && <IngestBanner status={ingest} />}

      {allDone ? (
        <section className="panel flex flex-col items-start gap-3 p-6">
          <span className="flex h-9 w-9 items-center justify-center rounded-full bg-teal text-[16px] font-bold text-ink-inverse">
            ✓
          </span>
          <div>
            <h2 className="font-serif text-[22px] leading-tight text-ink">You&rsquo;re fully set up</h2>
            <p className="mt-1 max-w-[560px] text-[13.5px] leading-relaxed text-slate">
              All five steps check out against your real data: brand configured, backers imported,
              helpdesk delivering, a reply sent, and customers able to see their status. Nothing more
              to wire up.
            </p>
          </div>
          <div className="mt-1 flex flex-wrap gap-3">
            <Button href={`/app${suffix}`}>Go to the dashboard</Button>
            <Button href={`/app/inbox${suffix}`} variant="ghost">
              Open the inbox
            </Button>
          </div>
        </section>
      ) : (
        <section className="panel divide-y divide-border overflow-hidden">
          {items.map((item, i) => {
            const isNext = i === firstUndoneIndex;
            const step = i + 1;
            return (
              <div
                key={item.key}
                className={clsx(
                  "flex items-start gap-4 px-5 py-4",
                  isNext && "bg-accent-card/60",
                )}
              >
                {/* status marker: a check when done, the step number when not */}
                <span
                  className={clsx(
                    "mt-0.5 flex h-6 w-6 flex-none items-center justify-center rounded-full text-[12px] font-semibold tabular-nums",
                    item.done
                      ? "bg-teal text-ink-inverse"
                      : isNext
                        ? "border-2 border-teal text-teal"
                        : "border-2 border-border text-ink-mute",
                  )}
                  aria-hidden="true"
                >
                  {item.done ? "✓" : step}
                </span>

                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    {isNext && (
                      <span className="rounded-full bg-teal px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-ink-inverse">
                        Do this next
                      </span>
                    )}
                    <span
                      className={clsx(
                        "text-[14.5px] font-semibold",
                        item.done ? "text-ink-mute" : "text-ink",
                      )}
                    >
                      {item.title}
                    </span>
                  </div>

                  {/* The hint guides the two not-yet-done cases; done rows stay quiet. */}
                  {!item.done && (
                    <p className="mt-1 max-w-[620px] text-[13px] leading-relaxed text-slate">
                      {item.hint}
                    </p>
                  )}

                  {/* Ingest health on the helpdesk row. A ✓ here NO LONGER means
                      "a tag filter was saved" — if nothing is arriving, the row
                      says so in red, whatever the checklist thinks. */}
                  {item.key === "helpdesk" && ingest && ingest.level !== "idle" && (
                    <p
                      className={clsx(
                        "mt-1.5 text-[13px] leading-relaxed",
                        ingest.level === "alarm"
                          ? "font-semibold text-risk-red"
                          : "text-ink-mute",
                      )}
                    >
                      {ingest.level === "alarm"
                        ? `⚠ ${ingest.headline} — nothing is reaching your queue. See the alert above.`
                        : lastInboundLabel
                          ? `Last inbound received ${lastInboundLabel}.`
                          : ingest.headline}
                    </p>
                  )}

                  {isNext && (
                    <div className="mt-3">
                      <Button href={resolveHref(item.href)}>{CTA_LABEL[item.key]} &rarr;</Button>
                    </div>
                  )}
                </div>

                {/* Right rail: a quiet status word, or a quiet link for a later step. */}
                <div className="flex-none pt-0.5 text-right">
                  {item.done ? (
                    <span className="text-[12px] font-semibold text-teal">Done</span>
                  ) : isNext ? null : (
                    <Link
                      href={resolveHref(item.href)}
                      className="text-[12px] text-ink-mute no-underline hover:text-teal"
                    >
                      {CTA_LABEL[item.key]} &rarr;
                    </Link>
                  )}
                </div>
              </div>
            );
          })}
        </section>
      )}

      {/* ── Import your backer list (checklist target: #import) ─────────────
          The DIRECT-mode ImportPanel POSTs to /api/import (middleware-gated,
          tenant-scoped). This is the post-onboarding import surface: skipped
          the CSV during setup, a >10k list imported in parts, or resuming a
          partial import — re-uploads are deduped by importKey. */}
      <section id="import" aria-label="Import your backer list" className="scroll-mt-6">
        <ImportPanel merchantId={merchantId} />
      </section>

      {/* ── Connect your helpdesk (checklist target: #connect) ──────────────
          The same webhook kit shown once on the onboarding success screen —
          re-derived server-side here so it is always recoverable. */}
      <section id="connect" aria-label="Connect your helpdesk" className="scroll-mt-6">
        <ConnectPanel {...helpdeskSetups(merchant)} />
      </section>

      <p className="rounded-xl border border-dashed border-border bg-sand px-4 py-3 text-[12px] leading-relaxed text-ink-mute">
        Proof-only: this checklist is computed from what actually exists in your account, never a
        stored flag. A step flips to done the moment the real thing happens; there are no dates and
        nothing is invented.
      </p>
    </div>
  );
}
