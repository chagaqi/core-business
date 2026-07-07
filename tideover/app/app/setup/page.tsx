import Link from "next/link";
import { clsx } from "clsx";
import { getSetupChecklist } from "@/lib/service";
import { getRepositories } from "@/lib/repositories";
import { MerchantSwitcher } from "@/components/product/MerchantSwitcher";
import { NoMerchantState } from "@/components/product/NoMerchantState";
import { Button } from "@/components/ui/Button";
import { integrationHealth, type SetupItemKey } from "@/lib/setup";
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

  // Integration health (F7): flag a connected-but-quiet real helpdesk on the
  // helpdesk row. Demo merchants are never "quiet" (their data is static).
  const helpdeskDone = items.find((i) => i.key === "helpdesk")?.done ?? false;
  const health = integrationHealth({
    lastInboundAt: checklist.lastInboundAt,
    helpdeskConnected: helpdeskDone,
    isDemo: merchant.isDemo,
  });
  const lastInboundLabel =
    health.quietDays == null
      ? null
      : health.quietDays === 0
        ? "today"
        : `${health.quietDays} day${health.quietDays === 1 ? "" : "s"} ago`;

  // ?merchant= is preserved onto the in-app links so the operator stays on the
  // same merchant; the /onboarding links are merchant-agnostic and left as-is.
  const suffix = `?merchant=${merchantId}`;
  const resolveHref = (href: string) => (href.startsWith("/app") ? `${href}${suffix}` : href);
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

                  {/* Integration health (F7), on the helpdesk row only. */}
                  {item.key === "helpdesk" && lastInboundLabel && (
                    <p
                      className={clsx(
                        "mt-1.5 text-[13px] leading-relaxed",
                        health.quiet ? "font-medium text-risk-red" : "text-ink-mute",
                      )}
                    >
                      {health.quiet
                        ? `⚠ No inbound in ${lastInboundLabel} — your helpdesk may have stopped sending. Check the presale rule/webhook is still active.`
                        : `Last inbound received ${lastInboundLabel}.`}
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

      <p className="rounded-xl border border-dashed border-border bg-sand px-4 py-3 text-[12px] leading-relaxed text-ink-mute">
        Proof-only: this checklist is computed from what actually exists in your account, never a
        stored flag. A step flips to done the moment the real thing happens; there are no dates and
        nothing is invented.
      </p>
    </div>
  );
}
