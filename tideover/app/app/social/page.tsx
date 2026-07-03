import { getRepositories } from "@/lib/repositories";
import { scoreFeed } from "@/lib/engines";
import { MerchantSwitcher } from "@/components/product/MerchantSwitcher";
import { Tag } from "@/components/ui/Badge";
import { clsx } from "clsx";

export const dynamic = "force-dynamic";

const PLATFORM_LABEL: Record<string, string> = {
  twitter: "Twitter",
  reddit: "Reddit",
  instagram: "Instagram",
};

export default async function SocialPage({
  searchParams,
}: {
  searchParams: { merchant?: string };
}) {
  const repos = getRepositories();
  const merchants = await repos.merchants.list();
  if (merchants.length === 0) {
    return <div className="p-8 text-ink-mute">No merchants seeded.</div>;
  }
  const merchantId =
    searchParams.merchant && merchants.some((m) => m.id === searchParams.merchant)
      ? searchParams.merchant
      : merchants[0].id;

  const merchant = merchants.find((m) => m.id === merchantId)!;
  const posts = await repos.social.listByMerchant(merchantId);
  const scored = scoreFeed(posts, merchant);
  const flaggedCount = scored.filter((s) => s.flagged).length;

  return (
    <div className="flex flex-col gap-6 px-6 py-6">
      <header className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <div className="flex items-center gap-2">
            <p className="kicker">Social-signal monitor</p>
            <span className="inline-flex items-center rounded-full bg-terracotta px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider text-ink-inverse">
              Add-on
            </span>
          </div>
          <h1 className="font-serif text-[34px] leading-tight text-ink">
            Public wait-anxiety
          </h1>
          <p className="text-[13px] text-ink-mute">
            {flaggedCount} flagged of {scored.length} scored posts. Outreach is drafted
            only — never auto-posted.
          </p>
        </div>
        <MerchantSwitcher
          merchants={merchants.map((m) => ({ id: m.id, name: m.name }))}
          current={merchantId}
        />
      </header>

      {scored.length === 0 ? (
        <div className="proof-placeholder">No social signals for this merchant.</div>
      ) : (
        <div className="flex flex-col gap-3">
          {scored.map((s) => (
            <article
              key={s.id}
              className={clsx(
                "panel p-4",
                s.flagged && "border-l-4 border-l-risk-red",
              )}
            >
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div className="flex items-center gap-2">
                  <Tag>{PLATFORM_LABEL[s.platform] ?? s.platform}</Tag>
                  <span className="text-[13px] font-semibold text-ink">@{s.author}</span>
                  {s.flagged ? (
                    <span className="pill pill-red">Flagged</span>
                  ) : (
                    <span className="text-[12px] text-ink-mute">Monitoring</span>
                  )}
                </div>
                <span className="text-[12px] text-ink-mute">
                  Signal score{" "}
                  <span className="font-semibold tabular-nums text-slate">
                    {s.signalScore}
                  </span>
                </span>
              </div>

              <p className="mt-2 text-[14px] leading-relaxed text-slate">{s.text}</p>

              {s.matchedKeywords.length > 0 ? (
                <div className="mt-2 flex flex-wrap items-center gap-1.5">
                  <span className="text-[11px] uppercase tracking-wider text-ink-mute">
                    Matched
                  </span>
                  {s.matchedKeywords.map((k) => (
                    <span
                      key={k}
                      className="rounded-full bg-[rgba(192,70,59,0.1)] px-2 py-0.5 text-[11px] font-medium text-risk-red"
                    >
                      {k}
                    </span>
                  ))}
                </div>
              ) : null}

              {s.suggestedOutreach ? (
                <div className="mt-3 rounded-lg border border-border bg-accent-card p-3">
                  <div className="flex items-center justify-between">
                    <span className="text-[11px] font-semibold uppercase tracking-wider text-teal">
                      Suggested proactive outreach
                    </span>
                    <span className="text-[11px] text-ink-mute">
                      Draft only — human-approved
                    </span>
                  </div>
                  <p className="mt-1.5 text-[13px] leading-relaxed text-slate">
                    {s.suggestedOutreach}
                  </p>
                </div>
              ) : null}
            </article>
          ))}
        </div>
      )}

      <p className="rounded-xl border border-dashed border-border bg-sand px-4 py-3 text-[12px] text-ink-mute">
        Proof-only: scoring is deterministic (relevance × wait-anxiety keywords). This
        monitor is an optional add-on; nothing here posts publicly without an operator.
      </p>
    </div>
  );
}
