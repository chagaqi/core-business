"use client";

import Link from "next/link";
import { usePathname, useSearchParams } from "next/navigation";
import { clsx } from "clsx";
import { Logo } from "@/components/ui/Logo";

/**
 * Left navigation for the /app product surfaces. Active state via usePathname.
 * Preserves the ?merchant= param across links (read client-side) so the operator
 * stays on the same merchant when moving between surfaces.
 */
const NAV: Array<{ href: string; label: string; hint: string }> = [
  { href: "/app", label: "Dashboard", hint: "Refund-risk overview" },
  { href: "/app/inbox", label: "Inbox", hint: "Operator cockpit" },
  { href: "/app/customers", label: "Customers", hint: "LTV + risk" },
  { href: "/app/gifts", label: "Gifts", hint: "Goodwill engine" },
  { href: "/app/social", label: "Social", hint: "Signal monitor" },
];

export function Sidebar({ operator }: { operator: string }) {
  const pathname = usePathname();
  const params = useSearchParams();
  const merchant = params.get("merchant");
  const suffix = merchant ? `?merchant=${merchant}` : "";

  const isActive = (href: string) =>
    href === "/app" ? pathname === "/app" : pathname.startsWith(href);

  return (
    <aside className="flex w-60 shrink-0 flex-col border-r border-border bg-paper">
      <div className="border-b border-border px-5 py-5">
        <Logo href={`/app${suffix}`} />
      </div>

      <nav className="flex flex-1 flex-col gap-1 p-3">
        {NAV.map((item) => {
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
              <span
                className={clsx(
                  "text-[14px] font-semibold",
                  active ? "text-teal" : "text-ink",
                )}
              >
                {item.label}
              </span>
              <span className="text-[11px] text-ink-mute">{item.hint}</span>
            </Link>
          );
        })}
      </nav>

      <div className="border-t border-border px-5 py-4">
        <div className="flex items-center gap-2.5">
          <span className="flex h-8 w-8 items-center justify-center rounded-full bg-teal text-[13px] font-semibold text-ink-inverse">
            {operator.slice(0, 1).toUpperCase()}
          </span>
          <div className="leading-tight">
            <div className="text-[13px] font-semibold text-ink">{operator}</div>
            <div className="text-[11px] text-ink-mute">Operator</div>
          </div>
        </div>
        <p className="mt-3 rounded-md border border-dashed border-border px-2.5 py-1.5 text-[10px] uppercase tracking-wider text-ink-mute">
          Demo data
        </p>
      </div>
    </aside>
  );
}
