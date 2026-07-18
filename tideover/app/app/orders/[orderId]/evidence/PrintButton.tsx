"use client";

import { Button } from "@/components/ui/Button";

/**
 * Print / Save as PDF trigger. Print-first by design — no PDF library. The
 * browser's print dialog ("Save as PDF") renders the pack against the
 * `@media print` rules in globals.css into a clean one-to-two page document.
 */
export function PrintButton() {
  return (
    <Button variant="ghost" onClick={() => window.print()}>
      Print / Save as PDF
    </Button>
  );
}
