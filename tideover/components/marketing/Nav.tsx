"use client";

import { useState } from "react";
import { Logo } from "@/components/ui/Logo";
import { CalButton } from "@/components/booking/CalButton";

/**
 * Sticky marketing nav, shared across every marketing page (Home, /how-it-works,
 * /who-its-for, /security, ...). Sand/blur background with a soft border. Center
 * links are real routes (absolute so they resolve correctly from any page);
 * "Pricing" is a same-page anchor on Home (#pricing, the Pilot section) since
 * there's no standalone /pricing page yet. The right CTA is the primary
 * "Book a pilot" action, routing to /book.
 *
 * Now that the site is multi-page, mobile gets a real menu (a hamburger toggling
 * a stacked link panel) — without it, a phone user couldn't reach any page but
 * Home. Client component for the toggle state + the blurred sticky bar.
 */
const LINKS: readonly { label: string; href: string }[] = [
  { label: "Home", href: "/" },
  { label: "How it works", href: "/how-it-works" },
  { label: "Who it's for", href: "/who-its-for" },
  { label: "Pricing", href: "/#pricing" },
  { label: "Security", href: "/security" },
];

export function Nav() {
  const [open, setOpen] = useState(false);

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
      <div className="wrap flex items-center justify-between gap-4 py-3.5">
        <Logo />

        {/* desktop links */}
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

        <div className="flex items-center gap-2">
          <CalButton>Book a pilot</CalButton>
          {/* mobile menu toggle */}
          <button
            type="button"
            aria-label={open ? "Close menu" : "Open menu"}
            aria-expanded={open}
            aria-controls="mobile-nav"
            onClick={() => setOpen((v) => !v)}
            className="inline-flex h-9 w-9 items-center justify-center rounded-lg border border-border text-ink transition-colors hover:bg-[rgba(14,83,102,0.07)] md:hidden"
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden>
              {open ? (
                <path d="M6 6l12 12M18 6L6 18" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
              ) : (
                <path d="M4 7h16M4 12h16M4 17h16" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
              )}
            </svg>
          </button>
        </div>
      </div>

      {/* mobile menu panel */}
      {open ? (
        <div id="mobile-nav" className="border-t border-border md:hidden">
          <div className="wrap flex flex-col py-2">
            {LINKS.map((l) => (
              <a
                key={l.href}
                href={l.href}
                onClick={() => setOpen(false)}
                className="rounded-lg px-3 py-2.5 text-[15px] font-medium text-slate no-underline transition-colors hover:bg-[rgba(14,83,102,0.07)] hover:text-teal"
              >
                {l.label}
              </a>
            ))}
          </div>
        </div>
      ) : null}
    </nav>
  );
}
