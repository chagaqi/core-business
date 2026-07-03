"use client";

import { Logo } from "@/components/ui/Logo";
import { CalButton } from "@/components/booking/CalButton";

/**
 * Sticky marketing nav. Sand/blur background with a soft border. Center anchor
 * links jump to the homepage sections; the right CTA routes to /book. Client
 * component so the blurred sticky bar behaves the same across the app.
 */
const LINKS: readonly { label: string; href: string }[] = [
  { label: "The long wait", href: "#long-wait" },
  { label: "How it works", href: "#how" },
  { label: "The pilot", href: "#pilot" },
  { label: "FAQ", href: "#faq" },
];

export function Nav() {
  return (
    <nav
      aria-label="Primary"
      className="sticky top-0 z-50 border-b border-border"
      style={{
        background: "rgba(251,248,242,0.82)",
        backdropFilter: "saturate(140%) blur(12px)",
        WebkitBackdropFilter: "saturate(140%) blur(12px)",
      }}
    >
      <div className="wrap flex flex-wrap items-center justify-between gap-4 py-3.5">
        <Logo />
        <div className="hidden items-center gap-1 md:flex">
          {LINKS.map((l) => (
            <a
              key={l.href}
              href={l.href}
              className="rounded-full px-3 py-2 text-[15px] font-medium text-slate no-underline transition-colors hover:bg-[rgba(14,83,102,0.07)] hover:text-teal"
            >
              {l.label}
            </a>
          ))}
        </div>
        <CalButton>Free teardown</CalButton>
      </div>
    </nav>
  );
}
