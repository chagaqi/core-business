"use client";

import { usePathname, useRouter } from "next/navigation";
import { Select } from "@/components/ui/Field";

/**
 * Merchant selector. Navigates to ?merchant=<id> on the current path so every
 * surface re-reads its data for the chosen merchant.
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

  return (
    <label className="inline-flex items-center gap-2.5">
      <span className="text-[12px] font-semibold uppercase tracking-wider text-ink-mute">
        Merchant
      </span>
      <Select
        value={current}
        aria-label="Select merchant"
        className="w-auto min-w-[180px] py-2 text-[14px]"
        onChange={(e) => router.push(`${pathname}?merchant=${e.target.value}`)}
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
