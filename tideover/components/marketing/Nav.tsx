"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Logo } from "@/components/ui/Logo";
import { FeaturesMenu } from "@/components/marketing/nav/FeaturesMenu";
import { FEATURE_COLUMNS } from "@/components/marketing/nav/nav-data";

/**
 * Sticky marketing header, shared across every marketing page. IA (structure):
 * Logo · Features (mega) · Pricing · How it works · FAQ ‖ Book a demo · Log in ·
 * Get started. One filled element only — the terracotta "Get started" pill
 * (rule D1: terracotta = action); the booking CTA is a plain text link.
 *
 * Dylan (2026-07-09): the live demo is reserved for a booked demo call, so the
 * old "Live demo" slot now points at the real /pricing page and the booking CTA
 * reads "Book a demo". Center links are the real /pricing + /how-it-works routes
 * and the Home #faq anchor, so they resolve from any page. Client component for
 * the mega-menu, the mobile accordion, and the scroll-aware lift.
 */

const CENTER_LINKS: readonly { label: string; href: string }[] = [
  { label: "Pricing", href: "/pricing" },
  { label: "How it works", href: "/how-it-works" },
  { label: "FAQ", href: "/#faq" },
];

const linkCls =
  "rounded-full px-3 py-2 text-[15px] font-medium text-slate no-underline transition-colors hover:bg-[rgba(14,83,102,0.07)] hover:text-teal";

export function Nav() {
  const [open, setOpen] = useState(false);
  const [featOpen, setFeatOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 8);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  const closeMobile = () => {
    setOpen(false);
    setFeatOpen(false);
  };

  return (
    <nav
      aria-label="Primary"
      className={`sticky top-0 z-50 border-b border-border ${
        scrolled ? "shadow-[0_6px_24px_-18px_rgba(17,37,42,0.5)]" : ""
      }`}
      style={{
        background: "rgba(251,248,242,0.82)",
        backdropFilter: "saturate(140%) blur(12px)",
        WebkitBackdropFilter: "saturate(140%) blur(12px)",
      }}
    >
      <div className="wrap flex items-center gap-3 py-4">
        <Logo />

        {/* desktop center links */}
        <div className="hidden items-center gap-1 md:flex">
          <FeaturesMenu />
          {CENTER_LINKS.map((l) => (
            <Link key={l.href} href={l.href} className={linkCls}>
              {l.label}
            </Link>
          ))}
        </div>

        {/* right group: account actions + primary pill */}
        <div className="ml-auto flex items-center gap-2">
          <div className="hidden items-center gap-2 md:flex">
            <Link href="/book" className={linkCls}>
              Book a demo
            </Link>
            <span className="h-5 w-px bg-border" aria-hidden />
            <Link href="/login" className={linkCls}>
              Log in
            </Link>
            <Link
              href="/onboarding"
              className="btn btn-primary group rounded-full"
              style={{ padding: "11px 20px", fontSize: "15px" }}
            >
              Get started
              <span aria-hidden className="transition-transform duration-150 group-hover:translate-x-0.5">
                &rarr;
              </span>
            </Link>
          </div>

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
        <div id="mobile-nav" className="max-h-[calc(100vh-66px)] overflow-y-auto border-t border-border md:hidden">
          <div className="wrap flex flex-col py-3">
            {/* Features accordion */}
            <button
              type="button"
              aria-expanded={featOpen}
              aria-controls="mobile-features"
              onClick={() => setFeatOpen((v) => !v)}
              className="flex items-center justify-between rounded-lg px-3 py-2.5 text-[15px] font-medium text-slate transition-colors hover:bg-[rgba(14,83,102,0.07)]"
            >
              Features
              <svg
                width="16"
                height="16"
                viewBox="0 0 24 24"
                fill="none"
                aria-hidden
                className={`transition-transform duration-150 ${featOpen ? "rotate-180" : ""}`}
              >
                <path d="M6 9l6 6 6-6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </button>
            {featOpen ? (
              <div id="mobile-features" className="mb-1 flex flex-col gap-4 px-3 pb-2 pt-1">
                {FEATURE_COLUMNS.map((col) => (
                  <div key={col.heading}>
                    <p className="mb-1.5 text-[11px] font-semibold uppercase tracking-[0.12em] text-ink-mute">
                      {col.heading}
                    </p>
                    <ul className="m-0 flex list-none flex-col gap-0.5 p-0">
                      {col.items.map((item) => (
                        <li key={item.label}>
                          <Link
                            href={item.href}
                            onClick={closeMobile}
                            className="flex flex-col rounded-lg px-2 py-1.5 no-underline transition-colors hover:bg-[rgba(14,83,102,0.05)]"
                          >
                            <span className="flex items-center gap-2 text-[14.5px] font-semibold text-ink">
                              {item.label}
                              {item.badge === "beta" ? (
                                <span
                                  className="pill pill-amber"
                                  style={{ fontSize: "10px", padding: "1px 7px", letterSpacing: "0.04em" }}
                                >
                                  Beta
                                </span>
                              ) : null}
                            </span>
                            <span className="text-[12.5px] leading-snug text-ink-mute">{item.desc}</span>
                          </Link>
                        </li>
                      ))}
                    </ul>
                  </div>
                ))}
              </div>
            ) : null}

            {/* flat links */}
            {CENTER_LINKS.map((l) => (
              <Link
                key={l.href}
                href={l.href}
                onClick={closeMobile}
                className="rounded-lg px-3 py-2.5 text-[15px] font-medium text-slate no-underline transition-colors hover:bg-[rgba(14,83,102,0.07)] hover:text-teal"
              >
                {l.label}
              </Link>
            ))}
            <Link
              href="/book"
              onClick={closeMobile}
              className="rounded-lg px-3 py-2.5 text-[15px] font-medium text-slate no-underline transition-colors hover:bg-[rgba(14,83,102,0.07)] hover:text-teal"
            >
              Book a demo
            </Link>
            <Link
              href="/login"
              onClick={closeMobile}
              className="rounded-lg px-3 py-2.5 text-[15px] font-medium text-slate no-underline transition-colors hover:bg-[rgba(14,83,102,0.07)] hover:text-teal"
            >
              Log in
            </Link>

            {/* primary pill, full width */}
            <Link
              href="/onboarding"
              onClick={closeMobile}
              className="btn btn-primary mt-2 w-full rounded-full"
            >
              Get started &rarr;
            </Link>
          </div>
        </div>
      ) : null}
    </nav>
  );
}
