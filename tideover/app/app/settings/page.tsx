import { getRepositories } from "@/lib/repositories";
import { getTenantSession } from "@/lib/tenant";
import { settingsView } from "@/lib/settings-route";
import { MerchantSwitcher } from "@/components/product/MerchantSwitcher";
import { NoMerchantState } from "@/components/product/NoMerchantState";
import { SettingsManager } from "@/components/product/SettingsManager";
import type { Metadata } from "next";

export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "Settings — Tideover" };

/**
 * Self-serve merchant settings — everything the onboarding wizard wrote,
 * editable the day after: brand voice (signoff/voice/tone/banned words), the
 * fulfillment wait window, production-stage labels + day bands, and the
 * goodwill gift catalog. Saves go per-section through PATCH /api/settings
 * (owner-only; members and the demo sample render read-only). Reads
 * ?merchant= like every other operator surface; in auth0 mode the tenant seam
 * scopes the list to the caller's own workspace.
 */
export default async function SettingsPage({
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

  const [gifts, session] = await Promise.all([
    repos.gifts.listByMerchant(merchantId),
    getTenantSession(),
  ]);
  const isOwner = Boolean(session && merchant.ownerSub && merchant.ownerSub === session.sub);

  return (
    <div className="flex flex-col gap-6 px-6 py-6">
      <header className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <p className="kicker">Settings</p>
          <h1 className="font-serif text-[34px] leading-tight text-ink">Workspace settings</h1>
          <p className="max-w-[560px] text-[13px] text-ink-mute">
            The voice, timeline and goodwill catalog every draft is built from. Each panel saves
            on its own.
          </p>
        </div>
        <MerchantSwitcher
          merchants={merchants.map((m) => ({ id: m.id, name: m.name }))}
          current={merchantId}
        />
      </header>

      <SettingsManager
        isOwner={isOwner}
        isDemo={merchant.isDemo}
        initial={settingsView(merchant, gifts)}
      />
    </div>
  );
}
