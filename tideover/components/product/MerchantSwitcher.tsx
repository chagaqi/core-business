"use client";

import { useTransition } from "react";
import { usePathname, useRouter } from "next/navigation";
import { clsx } from "clsx";
import { Select } from "@/components/ui/Field";

/**
 * Merchant selector. Navigates to ?merchant=<id> on the current path so every
 * surface re-reads its data for the chosen merchant. Wrapped in useTransition
 * (UX-13) so the select visibly dims/disables while the new merchant's data
 * loads instead of looking like the click did nothing.
 */
export function MerchantSwitcher({
  merchants,
  current,
}: {
  merchants: Array<{ id: string; name: string }>;
  current: string;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const [isPending, startTransition] = useTransition();

  return (
    <label className="inline-flex items-center gap-2.5">
      <span className="text-[12px] font-semibold uppercase tracking-wider text-ink-mute">
        Merchant
      </span>
      <Select
        value={current}
        aria-label="Select merchant"
        className={clsx("w-auto min-w-[180px] py-2 text-[14px]", isPending && "opacity-50")}
        disabled={isPending}
        onChange={(e) => {
          const next = e.target.value;
          startTransition(() => {
            router.push(`${pathname}?merchant=${next}`);
          });
        }}
      >
        {merchants.map((m) => (
          <option key={m.id} value={m.id}>
            {m.name}
          </option>
        ))}
      </Select>
    </label>
  );
}
