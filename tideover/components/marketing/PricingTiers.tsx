"use client";

/**
 * Client half of the pricing table: the monthly/annual toggle is the only
 * piece of state on the page. Every figure, card, and copy string comes from
 * PricingParts.tsx — the server-safe source of truth — so route metadata and
 * FAQ answers can import the same numbers without a client boundary in the way.
 */

import { useState } from "react";
import {
  ANNUAL_LABEL,
  CustomCard,
  PLANS,
  TierCard,
  type BillingPeriod,
} from "@/components/marketing/PricingParts";

function BillingToggle({
  period,
  onChange,
}: {
  period: BillingPeriod;
  onChange: (p: BillingPeriod) => void;
}) {
  const base =
    "rounded-full px-5 py-2.5 text-[14px] font-semibold transition-colors focus-visible:outline focus-visible:outline-2";
  return (
    <div
      role="group"
      aria-label="Billing period"
      className="inline-flex items-center gap-1 rounded-full border border-border bg-white p-1"
    >
      <button
        type="button"
        aria-pressed={period === "monthly"}
        onClick={() => onChange("monthly")}
        className={`${base} ${period === "monthly" ? "bg-teal text-white" : "bg-transparent text-teal"}`}
      >
        Monthly
      </button>
      <button
        type="button"
        aria-pressed={period === "annual"}
        onClick={() => onChange("annual")}
        className={`${base} ${period === "annual" ? "bg-teal text-white" : "bg-transparent text-teal"}`}
      >
        Annual <span className={period === "annual" ? "text-white/80" : "text-ink-mute"}>({ANNUAL_LABEL})</span>
      </button>
    </div>
  );
}

/** The full pricing table: toggle + 4 cards. Render on a light surface. */
export function PricingTiers() {
  const [period, setPeriod] = useState<BillingPeriod>("monthly");
  return (
    <div>
      <div className="mb-9 flex justify-center">
        <BillingToggle period={period} onChange={setPeriod} />
      </div>
      <div className="grid grid-cols-1 items-stretch gap-[18px] pt-3 md:grid-cols-2 xl:grid-cols-4">
        {PLANS.map((plan) => (
          <TierCard key={plan.name} plan={plan} period={period} />
        ))}
        <CustomCard />
      </div>
    </div>
  );
}
