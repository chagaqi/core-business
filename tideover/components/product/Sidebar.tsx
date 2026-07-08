"use client";

import Link from "next/link";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useEffect, useState } from "react";
import { clsx } from "clsx";
import { Logo } from "@/components/ui/Logo";

/**
 * Left navigation for the /app product surfaces. Active state via usePathname.
 * Preserves the ?merchant= param across links (read client-side) so the operator
 * stays on the same merchant when moving between surfaces.
 *
 * Grouped by weight (UX-60): Daily work first and loudest, Insights second,
 * Account/admin last and quietest. Hrefs + active-state logic are unchanged —
 * this is a layout-only regrouping of the same NAV items.
 */
const NAV_GROUPS: Array<{
  label: string;
  items: Array<{ href: string; label: string; hint: string }>;
}> = [
  {
    label: "Daily",
    items: [
      { href: "/app", label: "Dashboard", hint: "Refund-risk overview" },
      { href: "/app/inbox", label: "Inbox", hint: "Operator inbox" },
    ],
  },
  {
    label: "Insights",
    items: [
      { href: "/app/customers", label: "Customers", hint: "LTV + risk" },
      { href: "/app/forecast", label: "Forecast", hint: "WISMO (where-is-my-order) load ahead" },
      { href: "/app/scripts", label: "Scripts", hint: "Performance" },
      { href: "/app/social", label: "Social", hint: "Signal monitor" },
      { href: "/app/gifts", label: "Gifts", hint: "Goodwill engine" },
    ],
  },
  {
    label: "Account",
    items: [
      { href: "/app/setup", label: "Setup", hint: "Onboarding checklist" },
      { href: "/app/updates", label: "Updates", hint: "Workshop feed" },
    ],
  },
];

interface SetupSummary {
  completed: number;
  total: number;
  allDone: boolean;
}

export function Sidebar({ operator, isDemo }: { operator: string; isDemo: boolean }) {
  const pathname = usePathname();
  const router = useRouter();
  const params = useSearchParams();
  const merchant = params.get("merchant");
  const suffix = merchant ? `?merchant=${merchant}` : "";
  const [helpOpen, setHelpOpen] = useState(false);
  // Mobile off-canvas drawer (below lg the sidebar is a fixed panel). Closes on
  // any route change so tapping a nav item dismisses it.
  const [mobileOpen, setMobileOpen] = useState(false);
  useEffect(() => {
    setMobileOpen(false);
  }, [pathname]);

  // Live "N/5" setup badge, DERIVED from real state via /api/setup-status. Fail-
  // silent: if it hasn't loaded (or errors) the nav just shows no badge, never a
  // fabricated count. Re-fetches when the operator switches merchant.
  const [setup, setSetup] = useState<SetupSummary | null>(null);
  useEffect(() => {
    let cancelled = false;
    const q = merchant ? `?merchant=${encodeURIComponent(merchant)}` : "";
    fetch(`/api/setup-status${q}`, { cache: "no-store" })
      .then((r) => (r.ok ? r.json() : null))
      .then((d) => {
        if (!cancelled && d && typeof d.completed === "number" && typeof d.total === "number") {
          setSetup({ completed: d.completed, total: d.total, allDone: Boolean(d.allDone) });
        }
      })
      .catch(() => {
        /* badge is optional — a failed load simply shows no badge */
      });
    return () => {
      cancelled = true;
    };
  }, [merchant]);

  const isActive = (href: string) =>
    href === "/app" ? pathname === "/app" : pathname.startsWith(href);

  // UX-44: footer was a dead account-menu-looking <div>. Sign out for real.
  const handleSignOut = () => {
    fetch("/api/logout", { method: "POST" }).then(() => router.push("/login"));
  };

  return (
    <>
      {/* Mobile top bar (below lg): in-flow above the page, holds the logo + a
          menu button that opens the drawer. Hidden at lg where the aside is a
          static column. */}
      <div className="flex items-center justify-between border-b border-border bg-paper px-4 py-3 lg:hidden">
        <Logo href={`/app${suffix}`} />
        <button
          type="button"
          onClick={() => setMobileOpen(true)}
          aria-label="Open navigation menu"
          aria-expanded={mobileOpen}
          aria-controls="app-sidebar"
          className="inline-flex h-9 w-9 items-center justify-center rounded-lg border border-border text-ink hover:bg-sand"
        >
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" aria-hidden="true">
            <path d="M3 6h18M3 12h18M3 18h18" />
          </svg>
        </button>
      </div>

      {/* Scrim behind the open drawer (mobile only). */}
      {mobileOpen ? (
        <div
          className="fixed inset-0 z-40 bg-ink/40 lg:hidden"
          aria-hidden="true"
          onClick={() => setMobileOpen(false)}
        />
      ) : null}

      <aside
        id="app-sidebar"
        className={clsx(
          "flex w-60 shrink-0 flex-col overflow-y-auto border-r border-border bg-paper",
          // Off-canvas drawer below lg; static in-flow column at lg+.
          "fixed inset-y-0 left-0 z-50 transition-transform duration-200 lg:static lg:z-auto lg:translate-x-0 lg:transition-none",
          mobileOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0",
        )}
      >
        <div className="flex items-center justify-between border-b border-border px-5 py-5">
          <Logo href={`/app${suffix}`} />
          <button
            type="button"
            onClick={() => setMobileOpen(false)}
            aria-label="Close navigation menu"
            className="inline-flex h-8 w-8 items-center justify-center rounded-lg text-ink-mute hover:bg-sand hover:text-ink lg:hidden"
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" aria-hidden="true">
              <path d="M18 6 6 18M6 6l12 12" />
            </svg>
          </button>
        </div>

      <nav className="flex flex-1 flex-col gap-3 p-3">
        {NAV_GROUPS.map((group, groupIndex) => (
          <div
            key={group.label}
            className={clsx(
              "flex flex-col gap-1",
              groupIndex > 0 && "border-t border-border pt-3",
            )}
          >
            <span className="px-3 pb-0.5 text-[10px] font-semibold uppercase tracking-wider text-ink-mute">
              {group.label}
            </span>
            {group.items.map((item) => {
              const active = isActive(item.href);
              return (
                <Link
                  key={item.href}
                  href={`${item.href}${suffix}`}
                  className={clsx(
                    "group flex flex-col rounded-lg px-3 py-2.5 no-underline transition",
                    active ? "bg-accent-card" : "hover:bg-sand",
                  )}
                  aria-current={active ? "page" : undefined}
                >
                  <span className="flex items-center justify-between gap-2">
                    <span
                      className={clsx(
                        "text-[14px] font-semibold",
                        active ? "text-teal" : "text-ink",
                      )}
                    >
                      {item.label}
                    </span>
                    {item.href === "/app/setup" && setup && !setup.allDone ? (
                      <span
                        // UX-51: quiet informational count, not a colored/urgent
                        // alert — setup steps are founder/admin work a rep
                        // can't act on, so this shouldn't read as a blocker.
                        // True role-scoping (hiding this for non-admin reps) is
                        // deferred pending a real role model.
                        className="flex-none rounded-full border border-border px-1.5 py-0.5 text-[10px] font-semibold tabular-nums text-ink-mute"
                        title={`${setup.completed} of ${setup.total} setup steps complete`}
                      >
                        {setup.completed}/{setup.total}
                      </span>
                    ) : null}
                  </span>
                  <span className="text-[11px] text-ink-mute">{item.hint}</span>
                </Link>
              );
            })}
          </div>
        ))}
      </nav>

      <div className="border-t border-border px-5 py-4">
        <div className="flex items-center gap-2.5">
          <span className="flex h-8 w-8 items-center justify-center rounded-full bg-teal text-[13px] font-semibold text-ink-inverse">
            {operator.slice(0, 1).toUpperCase()}
          </span>
          <div className="min-w-0 flex-1 leading-tight">
            <div className="truncate text-[13px] font-semibold text-ink">{operator}</div>
            <div className="text-[11px] text-ink-mute">Operator</div>
          </div>
        </div>

        <div className="mt-3 flex items-center gap-3 text-[12px]">
          <button
            type="button"
            onClick={() => setHelpOpen((open) => !open)}
            aria-expanded={helpOpen}
            className="font-medium text-ink-mute underline-offset-2 hover:text-ink hover:underline"
          >
            Need help?
          </button>
          <button
            type="button"
            onClick={handleSignOut}
            className="font-medium text-terracotta-700 underline-offset-2 hover:underline"
          >
            Sign out
          </button>
        </div>

        {helpOpen ? (
          <div className="mt-3 rounded-md border border-border bg-sand-2 px-3 py-2.5">
            <div className="text-[11px] font-semibold uppercase tracking-wider text-ink-mute">
              What&rsquo;s safe to send
            </div>
            <ul className="mt-1.5 space-y-1 text-[12px] leading-relaxed text-ink-mute">
              <li>Every draft is human-approved before it sends.</li>
              <li>Tideover never sends a hard delivery date, only confidence bands.</li>
              <li>Unsure? Use Flag for follow-up.</li>
            </ul>
            <p className="mt-1.5 text-[11px] text-ink-mute">
              Still stuck?{" "}
              <a href="mailto:contact@tideover.app" className="text-terracotta-700 underline-offset-2 hover:underline">
                contact@tideover.app
              </a>
            </p>
          </div>
        ) : null}

        {/* UX-04: only demo mode is seeded sample data — a real-mode merchant
            must never see their live data mislabeled. Gated on the host-derived
            mode (ADR-0017), mirroring the layout's DemoBadge. */}
        {isDemo ? (
          <p className="mt-3 rounded-md border border-dashed border-border px-2.5 py-1.5 text-[10px] uppercase tracking-wider text-ink-mute">
            Demo data
          </p>
        ) : null}
      </div>
      </aside>
    </>
  );
}
