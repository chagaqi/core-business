import { getRepositories } from "@/lib/repositories";
import { getTenantSession } from "@/lib/tenant";
import { TEAM_SEAT_CAP, memberSubsOf, pendingInvitesOf } from "@/lib/team";
import { MerchantSwitcher } from "@/components/product/MerchantSwitcher";
import { NoMerchantState } from "@/components/product/NoMerchantState";
import { TeamManager } from "@/components/product/TeamManager";
import type { Metadata } from "next";

export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "Team — Tideover" };

/**
 * Seats (team) management. Lists the workspace's members + pending invites;
 * the OWNER adds teammates by email and removes members/invites through
 * /api/team. An invited teammate attaches automatically the first time they
 * sign in with that (verified) email — no outbound email is sent, the owner
 * shares the sign-in link. Reads ?merchant= like every other operator surface;
 * in auth0 mode the tenant seam scopes the list to the caller's own workspace.
 */
export default async function TeamPage({
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

  const session = await getTenantSession();
  const isOwner = Boolean(session && merchant.ownerSub && merchant.ownerSub === session.sub);

  return (
    <div className="flex flex-col gap-6 px-6 py-6">
      <header className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <p className="kicker">Team</p>
          <h1 className="font-serif text-[34px] leading-tight text-ink">Seats &amp; invites</h1>
          <p className="max-w-[560px] text-[13px] text-ink-mute">
            Add a teammate by email. They join this workspace automatically the first time they
            sign in with that address (it must be verified) &mdash; no invite email is sent, so
            share the sign-in link with them yourself.
          </p>
        </div>
        <MerchantSwitcher
          merchants={merchants.map((m) => ({ id: m.id, name: m.name }))}
          current={merchantId}
        />
      </header>

      <TeamManager
        isOwner={isOwner}
        members={memberSubsOf(merchant)}
        invites={pendingInvitesOf(merchant)}
        seatCap={TEAM_SEAT_CAP}
      />
    </div>
  );
}
