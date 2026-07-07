"use client";

import { Button } from "@/components/ui/Button";

/**
 * Operator-facing fallback for when an app page can't resolve a merchant/account
 * (UX-33). Replaces the leaked dev string "No merchants seeded." on the non-hot
 * operator surfaces. The two hot-file call sites (app/app/page.tsx,
 * app/app/inbox/page.tsx) still carry the raw string pending a serialized pass.
 */
export function NoMerchantState() {
  return (
    <div className="flex flex-col items-start gap-4 p-8">
      <div className="max-w-md">
        <h2 className="font-serif text-[22px] leading-tight text-ink">
          We couldn&rsquo;t load your account
        </h2>
        <p className="mt-1.5 text-[14px] leading-relaxed text-ink-mute">
          Refresh the page, or contact support if this keeps happening.
        </p>
      </div>
      <Button variant="primary" onClick={() => window.location.reload()}>
        Refresh
      </Button>
    </div>
  );
}
