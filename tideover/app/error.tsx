"use client";

import { useEffect } from "react";
import { Logo } from "@/components/ui/Logo";
import { Button } from "@/components/ui/Button";

/**
 * Outermost error boundary for anything not under /app (marketing, /login,
 * /status, /widget) — the root layout carries no shell chrome, so this is a
 * standalone branded card rather than an in-shell panel (UX-12).
 */
export default function RootError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <div className="flex min-h-screen items-center justify-center bg-sand px-6">
      <div className="panel max-w-[440px] p-8 text-center">
        <div className="mb-5 flex justify-center">
          <Logo href="/" />
        </div>
        <h1 className="mb-3 text-[26px]">Something went wrong.</h1>
        <p className="mb-6 text-[15px] leading-relaxed text-ink-mute">
          Nothing was lost. Try again, or head back to Tideover.
        </p>
        <div className="flex items-center justify-center gap-3">
          <Button variant="primary" onClick={() => reset()}>
            Try again
          </Button>
          <Button variant="ghost" href="/">
            Go home
          </Button>
        </div>
      </div>
    </div>
  );
}
