import Link from "next/link";
import { clsx } from "clsx";
import type { ReactNode } from "react";

/**
 * Shared button. Renders an <a>/<Link> when href is given, else a <button>.
 * Variants map to the .btn-* classes in globals.css. Use this everywhere for a
 * single CTA style source of truth.
 */
export type ButtonVariant = "primary" | "ghost" | "ondark" | "quiet";

const VARIANT: Record<ButtonVariant, string> = {
  primary: "btn btn-primary",
  ghost: "btn btn-ghost",
  ondark: "btn btn-ondark",
  quiet: "link-quiet",
};

export function Button({
  children,
  href,
  variant = "primary",
  large = false,
  className,
  onClick,
  type = "button",
  disabled,
  "aria-label": ariaLabel,
}: {
  children: ReactNode;
  href?: string;
  variant?: ButtonVariant;
  large?: boolean;
  className?: string;
  onClick?: () => void;
  type?: "button" | "submit";
  disabled?: boolean;
  /** Accessible name when the visible text alone is ambiguous (e.g. a list of
   *  identical "Remove" buttons — WCAG 2.4.6 label-in-context). */
  "aria-label"?: string;
}) {
  const cls = clsx(VARIANT[variant], large && variant !== "quiet" && "btn-lg", className);
  if (href) {
    const external = href.startsWith("http");
    if (external) {
      return (
        <a href={href} className={cls} target="_blank" rel="noreferrer" aria-label={ariaLabel}>
          {children}
        </a>
      );
    }
    return (
      <Link href={href} className={cls} aria-label={ariaLabel}>
        {children}
      </Link>
    );
  }
  return (
    <button type={type} className={cls} onClick={onClick} disabled={disabled} aria-label={ariaLabel}>
      {children}
    </button>
  );
}
