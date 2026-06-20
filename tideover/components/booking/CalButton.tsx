import { Button, type ButtonVariant } from "@/components/ui/Button";
import type { ReactNode } from "react";

/**
 * The single booking CTA used across the marketing site + VSL pages. Navigates
 * to the dedicated /book route (parity with Adwield's CalButton → /book).
 */
export function CalButton({
  children,
  variant = "primary",
  large = false,
  className,
}: {
  children: ReactNode;
  variant?: ButtonVariant;
  large?: boolean;
  className?: string;
}) {
  return (
    <Button href="/book" variant={variant} large={large} className={className}>
      {children}
    </Button>
  );
}
