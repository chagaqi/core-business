import type { ReactNode } from "react";
import { Sidebar } from "@/components/product/Sidebar";
import { DemoBadge } from "@/components/ui/DemoBadge";
import { getDemoOperator, isDemoMode } from "@/lib/auth";
import { getRepositories } from "@/lib/repositories";

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
  return (
    <div className="flex min-h-screen bg-sand">
      <Sidebar operator={operator} isDemo={demo} />
      <main className="min-w-0 flex-1">{children}</main>
      {demo && <DemoBadge />}
    </div>
  );
}
