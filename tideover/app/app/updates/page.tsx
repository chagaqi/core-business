import { getRepositories } from "@/lib/repositories";
import { timeAgo } from "@/lib/time";
import { MerchantSwitcher } from "@/components/product/MerchantSwitcher";
import { UpdateComposer, type ComposerUpdate } from "@/components/product/UpdateComposer";
import type { Merchant, MerchantUpdate } from "@/lib/types";

export const dynamic = "force-dynamic";

/**
 * Workshop update composer (ADR-0009, task U2). One post fans out to every
 * waiting backer's status page AND becomes a copy-to-Kickstarter draft. Lives
 * under /app so it sits behind the F2 auth gate. Reads ?merchant= like every
 * other operator surface. The KS draft is built server-side (pure) and handed to
 * the client only to copy — NEVER auto-posted to Kickstarter.
 */
function toKickstarterDraft(update: MerchantUpdate, merchant: Merchant): string {
  const title = `Update from ${merchant.name}`;
  const signoff = merchant.brand.signoff?.trim();
  const body = update.text.trim();
  return [title, "", body, signoff ? `\n${signoff}` : ""].join("\n").trimEnd() + "\n";
}

export default async function UpdatesPage({
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

  const raw = await repos.merchantUpdates.listByMerchant(merchantId);
  const updates: ComposerUpdate[] = raw.map((u) => ({
    id: u.id,
    text: u.text,
    stamp: timeAgo(u.createdAt),
    hidden: Boolean(u.hidden),
    ksDraft: toKickstarterDraft(u, merchant),
    ...(u.imageUrl ? { imageUrl: u.imageUrl } : {}),
  }));

  return (
    <div className="flex flex-col gap-6 px-6 py-6">
      <header className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <p className="kicker">Workshop updates</p>
          <h1 className="font-serif text-[34px] leading-tight text-ink">Latest from the workshop</h1>
          <p className="max-w-[560px] text-[13px] text-ink-mute">
            One post reaches every waiting backer&rsquo;s status page. Reuse the same words as your
            Kickstarter update &mdash; copy the draft, no auto-posting. No hard ship dates: describe
            progress, not promises.
          </p>
        </div>
        <MerchantSwitcher
          merchants={merchants.map((m) => ({ id: m.id, name: m.name }))}
          current={merchantId}
        />
      </header>

      <UpdateComposer merchantId={merchantId} updates={updates} />

      <p className="rounded-xl border border-dashed border-border bg-sand px-4 py-3 text-[12px] text-ink-mute">
        Proof-only: update text is checked for hard delivery dates before it posts. The
        &ldquo;Copy as Kickstarter update&rdquo; button drafts only &mdash; you paste it into
        Kickstarter yourself.
      </p>
    </div>
  );
}
