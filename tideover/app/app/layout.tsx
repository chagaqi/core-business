import type { ReactNode } from "react";
import { Sidebar } from "@/components/product/Sidebar";
import { DemoBadge } from "@/components/ui/DemoBadge";
import { TrialBanner } from "@/components/product/TrialBanner";
import { getDemoOperator, isDemoMode } from "@/lib/auth";
import { authMode } from "@/lib/auth-mode";
import { getRepositories } from "@/lib/repositories";
import { trialState } from "@/lib/trial";

/**
 * Product shell for every /app surface: fixed Sidebar + scrollable main column.
 * Data fetching lives in the pages; the layout only sets up the chrome.
 *
 * Single mount point for the SAMPLE DATA marker: in demo mode the entire hosted
 * operator app is seeded sample data, so <DemoBadge/> here covers every /app
 * surface at once (dashboard, inbox, customers, gifts, scripts, social,
 * updates). A real pilot sets DEMO_MODE=false → no badge. It is additive to the
 * three print artifacts' .ev-watermark and, being a bottom-right corner pill,
 * never overlaps that centered diagonal overlay.
 */
export default async function AppLayout({ children }: { children: ReactNode }) {
  // Real merchants must never see the founder's name in the sidebar (ADR-0004
  // single-operator seam): fall back to the merchant's own brand name. Demo mode
  // ignores the fallback and keeps "Dylan".
  const merchants = await getRepositories().merchants.list();
  const operator = getDemoOperator(merchants[0]?.name);
  const demo = isDemoMode();
  // Mode-aware sign-out (ADR-0020): in real+auth0 mode the live session is the
  // Auth0 SDK cookie, so sign-out must be a full-page navigation through the
  // SDK's /auth/logout (which also clears the tenant hint via the middleware).
  // Password/demo deployments keep the legacy POST /api/logout path — the
  // /auth/* routes don't exist there.
  const signOutHref = !demo && authMode() === "auth0" ? "/auth/logout" : null;
  // Trial countdown / expiry bar — real trialing merchant only (in real mode the
  // list is tenant-scoped to the caller's own merchant; demo merchants are
  // not-applicable and render nothing).
  const trial = !demo && merchants[0] ? trialState(merchants[0], new Date()) : null;
  return (
    // Stack on narrow widths (Sidebar renders its own mobile top bar + drawer),
    // restore the fixed sidebar + main row at lg. Desktop layout is unchanged.
    <div className="flex min-h-screen flex-col bg-sand lg:flex-row">
      <Sidebar operator={operator} isDemo={demo} signOutHref={signOutHref} />
      <main className="min-w-0 flex-1">
        {trial ? <TrialBanner phase={trial.phase} daysLeft={trial.daysLeft} /> : null}
        {children}
      </main>
      {demo && <DemoBadge />}
    </div>
  );
}
