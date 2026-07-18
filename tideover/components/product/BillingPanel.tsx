"use client";

import { useState } from "react";
import { clsx } from "clsx";
import { entitlementsFor } from "@/lib/entitlements";
import type { PlanKey, SubscriptionStatus } from "@/lib/types";

const PLANS: { key: PlanKey; name: string; monthly: number }[] = [
  { key: "starter", name: "Starter", monthly: 299 },
  { key: "growth", name: "Growth", monthly: 499 },
  { key: "scale", name: "Scale", monthly: 749 },
];

/** Annual = ten months (two free), matching the published ladder. */
const annualOf = (monthly: number) => monthly * 10;

export interface BillingPanelProps {
  currentPlan: PlanKey | null;
  subscriptionStatus: SubscriptionStatus | null;
  hasBillingAccount: boolean;
  trial: { phase: "not-applicable" | "active" | "ending-soon" | "expired"; daysLeft: number };
  isOwner: boolean;
}

export function BillingPanel({ currentPlan, subscriptionStatus, hasBillingAccount, trial, isOwner }: BillingPanelProps) {
  const [interval, setInterval] = useState<"month" | "year">("month");
  const [busy, setBusy] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  // An active subscriber changes plan through the Stripe Portal (modifies the one
  // subscription), never a fresh Checkout (which would double-bill).
  const subscribed = subscriptionStatus === "active" && Boolean(currentPlan);

  async function go(url: string, body?: unknown, key?: string) {
    setBusy(key ?? url);
    setError(null);
    try {
      const res = await fetch(url, {
        method: "POST",
        headers: body ? { "content-type": "application/json" } : undefined,
        body: body ? JSON.stringify(body) : undefined,
      });
      const data = (await res.json().catch(() => ({}))) as { url?: string; error?: string };
      if (!res.ok || !data.url) {
        setError(data.error ?? "Something went wrong. Try again.");
        setBusy(null);
        return;
      }
      window.location.href = data.url;
    } catch {
      setError("Network error. Try again.");
      setBusy(null);
    }
  }

  const statusLine =
    currentPlan && subscriptionStatus === "active"
      ? `You're on the ${PLANS.find((p) => p.key === currentPlan)?.name} plan.`
      : subscriptionStatus === "past_due"
        ? "Your last payment didn't go through — update it below to keep the queue running."
        : trial.phase === "expired"
          ? "Your trial has ended. Choose a plan to pick up where you left off."
          : trial.phase !== "not-applicable"
            ? `${trial.daysLeft} day${trial.daysLeft === 1 ? "" : "s"} left in your free trial. No card on file.`
            : "Choose a plan whenever you're ready.";

  return (
    <div className="flex flex-col gap-5">
      <div className="rounded-xl border border-border bg-accent-card/50 px-4 py-3 text-[13.5px] text-ink">{statusLine}</div>

      {!isOwner ? (
        <p className="text-[13px] text-ink-mute">Only the workspace owner can manage billing.</p>
      ) : (
        <>
          <div className="flex items-center gap-2">
            <span className="text-[12px] font-semibold uppercase tracking-wide text-ink-mute">Billing</span>
            <div className="inline-flex overflow-hidden rounded-full border border-border">
              {(["month", "year"] as const).map((iv) => (
                <button
                  key={iv}
                  type="button"
                  onClick={() => setInterval(iv)}
                  className={clsx(
                    "px-3 py-1 text-[12.5px] font-semibold transition",
                    interval === iv ? "bg-teal text-white" : "bg-paper text-ink-mute hover:text-ink",
                  )}
                >
                  {iv === "month" ? "Monthly" : "Annual · 2 months free"}
                </button>
              ))}
            </div>
          </div>

          <div className="grid gap-3 sm:grid-cols-3">
            {PLANS.map((p) => {
              const ent = entitlementsFor(p.key);
              const price = interval === "month" ? p.monthly : annualOf(p.monthly);
              const isCurrent = currentPlan === p.key && subscriptionStatus === "active";
              return (
                <div key={p.key} className="flex flex-col gap-2 rounded-xl border border-border bg-paper p-4">
                  <div className="text-[15px] font-semibold text-ink">{p.name}</div>
                  <div className="text-[13px] text-ink-mute">
                    ${price.toLocaleString()}/{interval === "month" ? "mo" : "yr"}
                  </div>
                  <div className="text-[12px] leading-snug text-ink-mute">
                    {ent.seatCap} seat{ent.seatCap === 1 ? "" : "s"} · up to {ent.orderCap.toLocaleString()} orders
                  </div>
                  <button
                    type="button"
                    disabled={isCurrent || busy !== null}
                    onClick={() =>
                      subscribed
                        ? go("/api/billing/portal", undefined, p.key)
                        : go("/api/billing/checkout", { plan: p.key, interval }, p.key)
                    }
                    className={clsx(
                      "mt-1 rounded-lg px-3 py-2 text-[13px] font-semibold transition",
                      isCurrent
                        ? "cursor-default border border-border bg-sand text-ink-mute"
                        : "bg-[#B85422] text-white hover:brightness-105 disabled:opacity-60",
                    )}
                  >
                    {isCurrent ? "Current plan" : busy === p.key ? "Starting…" : currentPlan ? "Switch" : "Choose"}
                  </button>
                </div>
              );
            })}
          </div>

          {hasBillingAccount ? (
            <button
              type="button"
              disabled={busy !== null}
              onClick={() => go("/api/billing/portal", undefined, "portal")}
              className="self-start text-[13px] font-semibold text-teal underline underline-offset-2 disabled:opacity-60"
            >
              {busy === "portal" ? "Opening…" : "Manage billing, invoices & cancellation →"}
            </button>
          ) : null}

          {error ? <p className="text-[12.5px] text-red-600">{error}</p> : null}
        </>
      )}
    </div>
  );
}
