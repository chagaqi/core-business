/**
 * Shared pricing source of truth. Both public pricing surfaces render from the
 * PLANS array below: /pricing gets the full tier cards with the monthly/annual
 * toggle (<PricingTiers/> in PricingTiers.tsx — the client half that owns the
 * toggle state), the Home pricing section gets the compact summary
 * (<PricingSummary/>, styled for a dark surface). Change a figure here and
 * both surfaces move together.
 *
 * This module is server-safe (no "use client") so route metadata and FAQ copy
 * can derive their figures from PLANS + usd() — no price literal should ever
 * live outside this file.
 *
 * NUMBERS LOCKED (Fable, 2026-07-09):
 *   Starter $299/mo · 1 seat · up to 1,000 presale orders in the wait window
 *   Growth  $499/mo · 3 seats · up to 5,000 — badge "Recommended"
 *   Scale   $749/mo · 10 seats · up to 15,000
 *   Annual = 2 months free: $2,990 / $4,990 / $7,490 (label "2 months free",
 *   never an invented %-off). Trial: 14-day free trial, no card → /onboarding.
 *   4th card: Beyond Scale, built around your volume → /book.
 *
 * Proof-only: the Growth badge is "Recommended" — never a popularity claim
 * (we have zero customers; proof-lint bans popularity claims). Every feature
 * listed exists in the codebase today; grounding modules are noted per tier.
 */

import Link from "next/link";
import { Button } from "@/components/ui/Button";
import { GET_STARTED_HREF } from "@/components/marketing/nav/nav-data";

export type BillingPeriod = "monthly" | "annual";

export type Plan = {
  name: string;
  /** locked monthly price in USD */
  monthly: number;
  /** locked annual price in USD (2 months free — 10× monthly) */
  annual: number;
  seats: string;
  cap: string;
  /** one-line job description for the compact Home summary */
  blurb: string;
  /** "Everything in X, plus:" ladder line; null on the base tier */
  ladder: string | null;
  features: readonly string[];
  recommended?: boolean;
};

export const TRIAL_LINE = "14-day free trial · no card required";
export const ANNUAL_LABEL = "2 months free";

/**
 * Feature grounding (every claim maps to a shipped module):
 *   reassurance inbox + priority queue  → app/app/inbox, lib/engines/reassurance.ts
 *   refund-risk scoring                 → lib/engines/refund-risk.ts
 *   AI-drafted replies, human approval  → app/api/draft, app/api/approve-send
 *   customer status pages               → app/status/[token]
 *   CSV backer import                   → app/api/import
 *   site-analysis autofill onboarding   → app/api/analyze, lib/site-analyze.ts
 *   helpdesk webhook ingest             → app/api/ingest/[channel]/[token]
 *   goodwill gifts (risk-gated)         → lib/engines/gift.ts, lib/gift-send.ts
 *   day-0 baseline report               → lib/baseline.ts
 *   outcome ledger + CSAT               → app/api/csat/[token], lib/data/outcome-events.json
 *   WISMO cohort forecast               → lib/forecast.ts
 *   SLA timers + escalation             → lib/escalation.ts, lib/__tests__/sla.test.ts
 *   full-data export                    → app/api/export
 */
export const PLANS: readonly Plan[] = [
  {
    name: "Starter",
    monthly: 299,
    annual: 2990,
    seats: "1 seat",
    cap: "Up to 1,000 presale orders in the wait window",
    blurb: "One operator working one presale queue.",
    ladder: null,
    features: [
      "Reassurance inbox with a priority queue",
      "Refund-risk scoring on every ticket",
      "AI-drafted replies, approved by you",
      "Customer status pages, unlimited",
      "CSV backer import",
      "Site-analysis autofill onboarding",
    ],
  },
  {
    name: "Growth",
    monthly: 499,
    annual: 4990,
    seats: "3 seats",
    cap: "Up to 5,000 presale orders in the wait window",
    blurb: "A small team splitting the queue.",
    ladder: "Everything in Starter, plus:",
    features: [
      "Helpdesk webhook ingest",
      "Goodwill gifts, gated by risk score",
      "Day-0 baseline report",
      "Outcome ledger with CSAT capture",
    ],
    recommended: true,
  },
  {
    name: "Scale",
    monthly: 749,
    annual: 7490,
    seats: "10 seats",
    cap: "Up to 15,000 presale orders in the wait window",
    blurb: "Multiple campaigns, one cockpit.",
    ladder: "Everything in Growth, plus:",
    features: [
      "WISMO cohort forecast",
      "SLA timers with escalation",
      "Full-data export",
    ],
  },
];

/** The 4th card — no fixed figures, sized on a call. */
export const CUSTOM_PLAN = {
  name: "Beyond Scale",
  line: "Built around your volume",
  detail: "Seats and order caps sized to your catalog, with everything in Scale.",
  cta: { label: "Book a call", href: "/book" },
} as const;

export const usd = (n: number) => `$${n.toLocaleString("en-US")}`;

/* ────────────────────────────────────────────────────────────────────────── */
/* Tier cards — composed by <PricingTiers/> (PricingTiers.tsx). Light surface. */
/* ────────────────────────────────────────────────────────────────────────── */

export function TierCard({ plan, period }: { plan: Plan; period: BillingPeriod }) {
  const annual = period === "annual";
  return (
    <div
      className={`panel relative flex h-full flex-col p-7 ${
        plan.recommended
          ? "border-teal shadow-[0_14px_36px_-18px_rgba(14,83,102,0.35)] transition-[transform,box-shadow] duration-[0.34s] ease-[cubic-bezier(0.2,0.7,0.2,1)] hover:-translate-y-1 hover:shadow-[var(--elev-3)]"
          : "lift"
      }`}
    >
      {plan.recommended && (
        <span className="absolute -top-3 left-7 inline-flex items-center rounded-full bg-teal px-3 py-1 text-[12px] font-bold uppercase tracking-wide text-white">
          Recommended
        </span>
      )}

      <h3 className="mb-2 font-serif text-[22px] font-semibold text-teal">{plan.name}</h3>

      <div className="mb-1 flex items-baseline gap-1.5">
        <span className="font-serif text-[38px] font-semibold leading-none text-ink">
          {usd(annual ? plan.annual : plan.monthly)}
        </span>
        <span className="text-[15px] text-ink-mute">{annual ? "/yr" : "/mo"}</span>
      </div>
      <div className="mb-5 min-h-[20px] text-[13.5px] font-semibold text-teal">
        {annual ? ANNUAL_LABEL : `or ${usd(plan.annual)}/yr (${ANNUAL_LABEL})`}
      </div>

      <div className="mb-5 border-t border-border pt-4">
        <div className="text-[15px] font-semibold text-ink">{plan.seats}</div>
        <div className="mt-1 text-[14px] leading-snug text-slate">{plan.cap}</div>
      </div>

      {plan.ladder && <div className="mb-3 text-[13.5px] font-semibold text-ink-mute">{plan.ladder}</div>}
      <ul className="m-0 mb-7 flex list-none flex-col gap-2.5 p-0">
        {plan.features.map((f) => (
          <li key={f} className="flex items-start gap-2.5 text-[14.5px] leading-snug text-slate">
            <span className="mt-px flex-none font-bold text-teal" aria-hidden>
              &#10003;
            </span>
            {f}
          </li>
        ))}
      </ul>

      <div className="mt-auto">
        {/* GET_STARTED_HREF (ADR-0020): on the www marketing host the relative
            /onboarding is the DEMO sandbox — the trial CTA must point at the
            real-app host's login-gated onboarding, same as the nav CTA. */}
        <Button href={GET_STARTED_HREF} variant={plan.recommended ? "primary" : "ghost"} className="w-full">
          Start free trial
        </Button>
        <p className="mb-0 mt-2.5 text-center text-[12.5px] text-ink-mute">{TRIAL_LINE}</p>
      </div>
    </div>
  );
}

export function CustomCard() {
  return (
    <div className="panel lift flex h-full flex-col p-7">
      <h3 className="mb-2 font-serif text-[22px] font-semibold text-teal">{CUSTOM_PLAN.name}</h3>
      <div className="mb-5 font-serif text-[24px] font-semibold leading-snug text-ink">{CUSTOM_PLAN.line}</div>
      <div className="mb-5 border-t border-border pt-4">
        <p className="m-0 text-[14.5px] leading-relaxed text-slate">{CUSTOM_PLAN.detail}</p>
      </div>
      <div className="mt-auto">
        <Button href={CUSTOM_PLAN.cta.href} variant="ghost" className="w-full">
          {CUSTOM_PLAN.cta.label}
        </Button>
        <p className="mb-0 mt-2.5 text-center text-[12.5px] text-ink-mute" aria-hidden>
          &nbsp;
        </p>
      </div>
    </div>
  );
}

/* ────────────────────────────────────────────────────────────────────────── */
/* Compact summary — the Home pricing section. Styled for a DARK surface.     */
/* ────────────────────────────────────────────────────────────────────────── */

/**
 * Three price-and-one-liner cards that point at /pricing for the full table.
 * Reads from the same PLANS array so the Home figures can never drift.
 */
export function PricingSummary() {
  return (
    <div className="mb-[22px]">
      <div className="grid grid-cols-1 items-stretch gap-[18px] md:grid-cols-3">
        {PLANS.map((plan) => (
          <div
            key={plan.name}
            className={`flex min-h-[150px] flex-col justify-center rounded-[22px] p-7 ${
              plan.recommended ? "md:-translate-y-3" : ""
            }`}
            style={
              plan.recommended
                ? { background: "rgba(233,180,134,0.1)", border: "1px solid rgba(233,180,134,0.55)" }
                : { background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.14)" }
            }
          >
            {plan.recommended && (
              <div className="mb-3 text-[13px] font-semibold leading-snug" style={{ color: "#F0C79E" }}>
                Recommended
              </div>
            )}
            <div className="font-serif text-[20px] font-semibold" style={{ color: "#F4F9F8" }}>
              {plan.name}
            </div>
            <div className="mt-1 font-serif text-[26px] font-semibold" style={{ color: "#F4F9F8" }}>
              {usd(plan.monthly)}/mo
            </div>
            <div className="mt-2 text-[14px] leading-snug" style={{ color: "#A9C2C0" }}>
              {plan.seats} &middot; {plan.blurb}
            </div>
          </div>
        ))}
      </div>
      <p className="mt-5 text-[14px] leading-snug" style={{ color: "#A9C2C0" }}>
        {TRIAL_LINE} &middot; annual is {ANNUAL_LABEL} &middot;{" "}
        <Link href="/pricing" className="font-semibold underline underline-offset-4" style={{ color: "#F4F9F8" }}>
          see seat counts, order caps, and the full feature table
        </Link>
      </p>
    </div>
  );
}

/* ────────────────────────────────────────────────────────────────────────── */
/* The guarantee — kept adjacent to the tiers on both surfaces. DARK styling. */
/* ────────────────────────────────────────────────────────────────────────── */

/**
 * Our plain risk-reversal. Copy held from the locked offer, reframed to
 * "your first cycle" now that the old free-cycle offer is off all public
 * pricing surfaces.
 */
export function GuaranteeBox() {
  return (
    <div
      className="rounded-[22px] p-7"
      style={{ background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.14)" }}
    >
      <div className="mb-3.5 flex items-center gap-2.5">
        <svg width="22" height="22" viewBox="0 0 24 24" fill="none" aria-hidden>
          <path
            d="M12 2 4 6v6c0 4.4 3.2 7.6 8 10 4.8-2.4 8-5.6 8-10V6l-8-4Z"
            stroke="#E9B486"
            strokeWidth="1.7"
            fill="none"
            strokeLinejoin="round"
          />
        </svg>
        <h3 className="m-0 font-serif text-[20px] font-semibold" style={{ color: "#F4F9F8" }}>
          The guarantee
        </h3>
      </div>
      <p className="m-0 text-[15px] leading-relaxed" style={{ color: "#C7DAD8" }}>
        We measure leading indicators &mdash; faster first response, fewer WISMO tickets, logged saves &mdash;
        against your own baseline. If your first cycle doesn&rsquo;t move them, you don&rsquo;t pay. The full
        refund-reduction picture takes a complete 60&ndash;120 day cycle; we report it after the first cohort
        finishes, and we&rsquo;re telling you that up front.
      </p>
    </div>
  );
}
