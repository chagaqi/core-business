"use client";

/**
 * Client half of the pricing table: the monthly/annual toggle is the only
 * piece of state on the page. Every figure, card, and copy string comes from
 * PricingParts.tsx — the server-safe source of truth — so route metadata and
 * FAQ answers can import the same numbers without a client boundary in the way.
 */

import { useState } from "react";
import { motion, useReducedMotion } from "framer-motion";
import {
  ANNUAL_LABEL,
  CustomCard,
  PLANS,
  TierCard,
  type BillingPeriod,
} from "@/components/marketing/PricingParts";

const PERIODS: readonly BillingPeriod[] = ["monthly", "annual"];

function BillingToggle({
  period,
  onChange,
}: {
  period: BillingPeriod;
  onChange: (p: BillingPeriod) => void;
}) {
  const reduce = useReducedMotion();
  const base =
    "relative rounded-full px-5 py-2.5 text-[14px] font-semibold transition-colors focus-visible:outline focus-visible:outline-2";
  return (
    <div
      role="group"
      aria-label="Billing period"
      className="relative inline-flex items-center gap-1 rounded-full border border-border bg-white p-1"
    >
      {PERIODS.map((p) => {
        const active = period === p;
        return (
          <button
            key={p}
            type="button"
            aria-pressed={active}
            onClick={() => onChange(p)}
            className={`${base} ${active ? "text-white" : "text-teal"}`}
          >
            {active && (
              // Shared-layout pill that slides to the active option (snaps instantly
              // under reduced motion). The label paints above it via z-10.
              <motion.span
                layoutId="billing-pill"
                className="absolute inset-0 rounded-full bg-teal"
                transition={reduce ? { duration: 0 } : { type: "spring", stiffness: 420, damping: 34 }}
              />
            )}
            <span className="relative z-10">
              {p === "monthly" ? (
                "Monthly"
              ) : (
                <>
                  Annual <span className={active ? "text-white/80" : "text-ink-mute"}>({ANNUAL_LABEL})</span>
                </>
              )}
            </span>
          </button>
        );
      })}
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
