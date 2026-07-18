"use client";

import { Button } from "@/components/ui/Button";

/**
 * Print / Save as PDF trigger for the Day-0 Baseline Report. Print-first by
 * design — no PDF library. The browser's print dialog ("Save as PDF") renders
 * the report against the `@media print` rules in globals.css into a clean
 * one-page document, which becomes the screenshot/attachment for cold outreach.
 */
export function PrintButton() {
  return (
    <Button variant="ghost" onClick={() => window.print()}>
      Print / Save as PDF
    </Button>
  );
}
