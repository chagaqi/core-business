import Link from "next/link";
import type { ReactNode } from "react";
import { Logo } from "@/components/ui/Logo";
import { CalButton } from "@/components/booking/CalButton";

/**
 * Shared chrome for the /vsl pages: a minimal header (Logo + back-to-home link),
 * a centered .wrap content column, and a footer CTA to /book. Renders children.
 */
export default function VslLayout({ children }: { children: ReactNode }) {
  return (
    <>
      <header
        className="sticky top-0 z-50 border-b border-border"
        style={{ background: "rgba(251,248,242,0.82)", backdropFilter: "saturate(140%) blur(12px)", WebkitBackdropFilter: "saturate(140%) blur(12px)" }}
      >
        <div className="wrap flex items-center justify-between py-3.5">
          <Logo />
          <Link
            href="/"
            className="text-[13px] font-medium text-ink-mute no-underline transition-colors hover:text-teal"
          >
            &larr; Back to home
          </Link>
        </div>
      </header>

      <main>
        <div className="wrap max-w-[820px] py-14">{children}</div>
      </main>

      <section className="section-dark">
        <div className="wrap max-w-[820px] py-14 text-center">
          <h2 className="mb-4 text-balance">See where your presale support is bleeding customers.</h2>
          <p className="mx-auto mb-7 max-w-[520px] text-[16px] leading-relaxed" style={{ color: "#BDD4D2" }}>
            Fifteen minutes on your actual setup, operator to operator. No pitch, no card.
          </p>
          <CalButton variant="ondark" large>
            Get a free 15-min teardown
          </CalButton>
        </div>
      </section>
    </>
  );
}
