"use client";

import Link from "next/link";

export type CalButtonVariant = "primary" | "crit" | "ghost" | "quiet";

export interface CalButtonProps {
  /** The button label / content. */
  children: React.ReactNode;
  /** Extra classes appended after the variant's base classes. */
  className?: string;
  /** Visual style. Defaults to "primary". */
  variant?: CalButtonVariant;
  /** Use the large button size (ignored for the "quiet" variant). */
  large?: boolean;
}

const VARIANT_CLASS: Record<CalButtonVariant, string> = {
  primary: "btn btn-primary",
  crit: "btn btn-crit",
  ghost: "btn btn-ghost",
  quiet: "link-quiet",
};

/**
 * The single source of truth for every booking CTA on the site.
 *
 * Booking now lives on its OWN route — `/book` (the dedicated booking page with
 * the inline Cal calendar). So this component renders a Next.js `<Link>` that
 * NAVIGATES to `/book` — it no longer opens a popup or smooth-scrolls to a
 * `#book` anchor. The same `.btn`/`.link-quiet` classes style the `<Link>`'s
 * anchor identically to the old `<a>`/`<button>`, so every existing
 * `<CalButton ... />` call site across the site auto-repoints to `/book` with no
 * other edits. The props/usage signature (children, className, variant, large)
 * is unchanged.
 *
 * `data-xp` keeps GameChrome's XP-float firing on click (parity with the old
 * CTA). Stays a client component so prefetch + the existing call-site mix work.
 */
export default function CalButton({
  children,
  className,
  variant = "primary",
  large = false,
}: CalButtonProps) {
  const base = VARIANT_CLASS[variant];
  const sizeClass = large && variant !== "quiet" ? " btn-lg" : "";
  const classes = `${base}${sizeClass}${className ? ` ${className}` : ""}`;

  return (
    <Link href="/book" className={classes} data-xp="40">
      {children}
    </Link>
  );
}
