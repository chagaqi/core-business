/**
 * Config for the Features mega-menu (three labeled columns) + the mobile
 * accordion, and the mirrored footer product column.
 *
 * MARKETING-ONLY linking (Dylan, 2026-07-09): Features must never route a
 * visitor into the /app cockpit — the live demo is reserved for a booked demo
 * call. Every item points at a public MARKETING surface that ships today: the
 * relevant /how-it-works anchor, a real page (/security, /procurement,
 * /onboarding, /vsl/*), and nothing under /app. Items without a natural
 * on-page anchor fall to the /how-it-works top. (This replaces the former
 * DEMO_MODE href/fallback split; there is no cockpit deep-link left to gate.)
 *
 * Icons live in ./icons.tsx (this file stays .ts / JSX-free); each item names one
 * by key. Density mirrors the studied 3-column pattern (4 / 5 / 5 = 14 items).
 */

/**
 * "Get started" CTA destination (ADR-0020). The real onboarding lives on the
 * real-app host (login-gated there), so a PUBLIC MARKETING build points the
 * CTA at `https://<real host>/onboarding` — the same host-awareness pattern as
 * lib/service.ts appUrl(), but build-time: this file feeds client components,
 * so it reads the NEXT_PUBLIC_ twin (inlined at build, like
 * NEXT_PUBLIC_DEMO_MODE). Set NEXT_PUBLIC_REAL_APP_HOST=app.tideover.app on
 * the marketing deploy; unset (demo/preview builds) falls back to the local
 * relative /onboarding sandbox — exactly today's behavior.
 */
const REAL_APP_HOST = process.env.NEXT_PUBLIC_REAL_APP_HOST?.trim().replace(/\/+$/, "");
export const GET_STARTED_HREF = REAL_APP_HOST
  ? `https://${REAL_APP_HOST}/onboarding`
  : "/onboarding";

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
  /** Marketing destination — a public page/anchor. Never an /app cockpit route. */
  href: string;
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
        href: "/how-it-works#replies",
        icon: "inbox",
      },
      {
        label: "Refund-risk scoring",
        desc: "See which waiting orders are about to churn",
        href: "/how-it-works#pipeline",
        icon: "gauge",
      },
      {
        label: "Customer status pages",
        desc: "A branded where's-my-order page that reads the timeline",
        href: "/how-it-works",
        icon: "statusPage",
      },
      {
        label: "Goodwill gifts",
        desc: "Risk-unlocked make-goods, only when they'll save the order",
        href: "/how-it-works",
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
        href: "/how-it-works",
        icon: "forecast",
      },
      {
        label: "Day-0 baseline report",
        desc: "Your starting numbers, captured before we touch a thing",
        href: "/how-it-works",
        icon: "baseline",
      },
      {
        label: "Script performance",
        desc: "Which replies calm people, and which don't",
        href: "/how-it-works#replies",
        icon: "script",
      },
      {
        label: "Dispute evidence pack",
        desc: "One-click proof file the moment a chargeback lands",
        href: "/how-it-works",
        icon: "evidence",
      },
      {
        label: "Escalation flags",
        desc: "The few tickets a human must take, surfaced early",
        href: "/how-it-works#approval",
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
        href: GET_STARTED_HREF,
        icon: "import",
      },
      {
        label: "Webhook ingest",
        desc: "Live order events straight from your store",
        href: "/how-it-works#stack",
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
