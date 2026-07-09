/**
 * Config for the Features mega-menu (three labeled columns) + the mobile
 * accordion. Every item points at a route/anchor that ships TODAY. The deep
 * `/app/*` targets render the public sample cockpit while the marketing deploy
 * runs DEMO_MODE=true; if a hardened prod ever flips it off those routes bounce
 * to /login, so each carries a marketing `fallback` and resolveHref() switches
 * to it when NEXT_PUBLIC_DEMO_MODE === "false".
 *
 * Icons live in ./icons.tsx (this file stays .ts / JSX-free); each item names one
 * by key. Density mirrors the studied 3-column pattern (4 / 5 / 5 = 14 items).
 */

export type IconName =
  | "inbox"
  | "gauge"
  | "statusPage"
  | "gift"
  | "forecast"
  | "baseline"
  | "script"
  | "evidence"
  | "flag"
  | "import"
  | "webhook"
  | "shield"
  | "clipboard"
  | "play";

export interface NavItem {
  label: string;
  /** One-line, original descriptor (never lifted from any source). */
  desc: string;
  /** Demo/primary target — resolves to the public sample cockpit in demo mode. */
  href: string;
  /** Marketing surface to use when DEMO_MODE is off (prod-hardened). */
  fallback?: string;
  icon: IconName;
  /** Renders a small status pill after the name. */
  badge?: "beta";
}

export interface NavColumn {
  heading: string;
  items: readonly NavItem[];
}

export const FEATURE_COLUMNS: readonly NavColumn[] = [
  {
    heading: "Product",
    items: [
      {
        label: "Reassurance inbox",
        desc: "WISMO tickets triaged, with a calm draft already waiting on each",
        href: "/app/inbox",
        fallback: "/#demo",
        icon: "inbox",
      },
      {
        label: "Refund-risk scoring",
        desc: "See which waiting orders are about to churn",
        href: "/app/customers",
        fallback: "/how-it-works",
        icon: "gauge",
      },
      {
        label: "Customer status pages",
        desc: "A branded where's-my-order page that reads the timeline",
        href: "/app/updates",
        fallback: "/how-it-works",
        icon: "statusPage",
      },
      {
        label: "Goodwill gifts",
        desc: "Risk-unlocked make-goods, only when they'll save the order",
        href: "/app/gifts",
        fallback: "/how-it-works",
        icon: "gift",
      },
    ],
  },
  {
    heading: "Signals & ops",
    items: [
      {
        label: "WISMO cohort forecast",
        desc: "Predicts the where-is-it wave before it hits the inbox",
        href: "/app/forecast",
        fallback: "/how-it-works",
        icon: "forecast",
      },
      {
        label: "Day-0 baseline report",
        desc: "Your starting numbers, captured before we touch a thing",
        href: "/app/baseline",
        fallback: "/how-it-works",
        icon: "baseline",
      },
      {
        label: "Script performance",
        desc: "Which replies calm people, and which don't",
        href: "/app/scripts",
        fallback: "/how-it-works",
        icon: "script",
      },
      {
        label: "Dispute evidence pack",
        // Points at the cockpit, not a specific order: seed order ids are
        // generated, so no id is guaranteed stable to hardcode here.
        desc: "One-click proof file the moment a chargeback lands",
        href: "/app",
        fallback: "/how-it-works",
        icon: "evidence",
      },
      {
        label: "Escalation flags",
        desc: "The few tickets a human must take, surfaced early",
        href: "/app/inbox",
        fallback: "/#demo",
        icon: "flag",
      },
    ],
  },
  {
    heading: "Connect & trust",
    items: [
      {
        label: "CSV backer import",
        desc: "Bring Kickstarter and BackerKit backers in minutes",
        href: "/onboarding",
        icon: "import",
      },
      {
        label: "Webhook ingest",
        desc: "Live order events straight from your store",
        href: "/app/setup",
        fallback: "/how-it-works",
        icon: "webhook",
        badge: "beta",
      },
      {
        label: "Security",
        desc: "How we handle your data and your customers'",
        href: "/security",
        icon: "shield",
      },
      {
        label: "Procurement",
        desc: "Vendor docs, DPA, and the buyer paperwork",
        href: "/procurement",
        icon: "clipboard",
      },
      {
        label: "Watch a walkthrough",
        desc: "Short video tours of the engine at work",
        href: "/vsl/landing-vsl",
        icon: "play",
      },
    ],
  },
];

/*
 * RESERVED — Case study (top-nav slot), rendered NOWHERE today.
 * Their model runs a "Case Study" nav item; ours has no real equivalent yet
 * (proof-only doctrine forbids a fabricated cohort). Light this only when a real
 * pilot cohort produces numbers, then point it at a /case-study page built on the
 * milestone structure (problem -> what changed -> measured deltas vs. the day-0
 * baseline -> verdict) using real numbers only. Until then: [CASE STUDY PLACEHOLDER].
 *   { label: "Case study", href: "/case-study" }
 */

/**
 * NEXT_PUBLIC_DEMO_MODE is inlined at build time (identical on server + client,
 * so no hydration drift). Unset => demo (the marketing deploy default).
 */
const DEMO_MODE = process.env.NEXT_PUBLIC_DEMO_MODE !== "false";

/** Effective href for an item given the current build's demo flag. */
export function resolveHref(item: NavItem): string {
  return DEMO_MODE ? item.href : item.fallback ?? item.href;
}
