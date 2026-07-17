import { getRepositories } from "@/lib/repositories";
import { getTenantSession } from "@/lib/tenant";
import { trialState } from "@/lib/trial";
import { MerchantSwitcher } from "@/components/product/MerchantSwitcher";
import { NoMerchantState } from "@/components/product/NoMerchantState";
import { BillingPanel } from "@/components/product/BillingPanel";
import type { Metadata } from "next";

export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "Billing — Tideover" };

/**
 * Plan & billing (ADR-0022). Shows the trial countdown or the current plan, lets
 * the OWNER start a Stripe Checkout for any plan, and (once subscribed) opens the
 * Stripe Billing Portal for invoices + cancellation. Reads ?merchant= like every
 * operator surface; the tenant seam scopes to the caller's own workspace.
 */
export default async function BillingPage({ searchParams }: { searchParams: { merchant?: string } }) {
  const repos = getRepositories();
  const merchants = await repos.merchants.list();
  if (merchants.length === 0) return <NoMerchantState />;

  const merchantId =
    searchParams.merchant && merchants.some((m) => m.id === searchParams.merchant)
      ? searchParams.merchant
      : merchants[0].id;
  const merchant = merchants.find((m) => m.id === merchantId)!;

  const session = await getTenantSession();
  const isOwner = Boolean(session && merchant.ownerSub && merchant.ownerSub === session.sub);
  const trial = trialState(merchant, new Date());

  return (
    <div className="flex flex-col gap-6 px-6 py-6">
      <header className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <p className="kicker">Billing</p>
          <h1 className="font-serif text-[34px] leading-tight text-ink">Plan &amp; billing</h1>
          <p className="max-w-[560px] text-[13px] text-ink-mute">
            Manage your subscription. Checkout and invoices are handled securely by Stripe &mdash;
            Tideover never sees your card.
          </p>
        </div>
        <MerchantSwitcher merchants={merchants.map((m) => ({ id: m.id, name: m.name }))} current={merchantId} />
      </header>

      <BillingPanel
        currentPlan={merchant.plan ?? null}
        subscriptionStatus={merchant.subscriptionStatus ?? null}
        hasBillingAccount={Boolean(merchant.stripeCustomerId)}
        trial={{ phase: trial.phase, daysLeft: trial.daysLeft }}
        isOwner={isOwner}
      />
    </div>
  );
}
