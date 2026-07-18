"use client";

import { useEffect } from "react";
import { Button } from "@/components/ui/Button";

/**
 * Route-segment error boundary for every /app surface (UX-12). Renders INSIDE
 * the operator shell (Sidebar stays put) so a junior CS rep never loses the
 * nav — only the page content fails, and it's recoverable in one click.
 */
export default function AppError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    // Surfaced for local/ops debugging only — never shown to the operator.
    console.error(error);
  }, [error]);

  return (
    <div className="flex min-h-[60vh] flex-col items-start justify-center gap-4 p-8">
      <div className="max-w-md">
        <p className="kicker">Something went wrong</p>
        <h1 className="font-serif text-[26px] leading-tight text-ink">
          Something went wrong on this page.
        </h1>
        <p className="mt-1.5 text-[14px] leading-relaxed text-ink-mute">
          Nothing was lost. Try again, or head back to the dashboard.
        </p>
      </div>
      <div className="flex items-center gap-3">
        <Button variant="primary" onClick={() => reset()}>
          Try again
        </Button>
        <Button variant="ghost" href="/app">
          Back to dashboard
        </Button>
      </div>
    </div>
  );
}
