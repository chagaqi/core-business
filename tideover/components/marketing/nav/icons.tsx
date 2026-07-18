import type { ReactNode } from "react";
import type { IconName } from "./nav-data";

/**
 * Hand-rolled 24px stroke icons for the Features mega-menu. No icon dependency —
 * the codebase draws its own SVGs (see Logo, Hero's ShieldCheck). Each glyph
 * inherits `currentColor` from the icon tile (text-teal), stroke-width ~1.7 to
 * match the house line weight. One glyph per menu item, keyed by IconName.
 */
function Svg({ children }: { children: ReactNode }) {
  return (
    <svg
      width="22"
      height="22"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.7"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden
    >
      {children}
    </svg>
  );
}

export const ICONS: Record<IconName, ReactNode> = {
  // Reassurance inbox — a tray with a settling line
  inbox: (
    <Svg>
      <path d="M3.5 12 6 5.6A1.9 1.9 0 0 1 7.8 4.4h8.4A1.9 1.9 0 0 1 18 5.6L20.5 12v6a1.5 1.5 0 0 1-1.5 1.5H5A1.5 1.5 0 0 1 3.5 18v-6Z" />
      <path d="M3.5 12h4.7l1 2h5.6l1-2h4.7" />
    </Svg>
  ),
  // Refund-risk scoring — a gauge with a needle
  gauge: (
    <Svg>
      <path d="M4 16a8 8 0 1 1 16 0" />
      <path d="M12 16l3.5-3.6" />
      <circle cx="12" cy="16" r="1.1" />
    </Svg>
  ),
  // Customer status pages — a page with a where's-my-order pin
  statusPage: (
    <Svg>
      <rect x="4.5" y="3" width="15" height="18" rx="2" />
      <path d="M12 7.6a2.1 2.1 0 0 1 2.1 2.1c0 1.6-2.1 3.6-2.1 3.6s-2.1-2-2.1-3.6A2.1 2.1 0 0 1 12 7.6Z" />
      <path d="M8.5 17h7" />
    </Svg>
  ),
  // Goodwill gifts — a wrapped box
  gift: (
    <Svg>
      <rect x="4.5" y="9.5" width="15" height="10.5" rx="1.4" />
      <path d="M3 9.5h18M12 9.5V20" />
      <path d="M12 9.5S9.4 9.4 8.5 8 8.7 5.1 10 5.7 12 9.5 12 9.5Zm0 0s2.6.1 3.5-1.3-.2-2.9-1.5-2.3S12 9.5 12 9.5Z" />
    </Svg>
  ),
  // WISMO cohort forecast — a cresting wave over a horizon
  forecast: (
    <Svg>
      <path d="M4 13.5c2.4 0 2.4-3 4.8-3s2.4 3 4.8 3 2.4-3 4.8-3" />
      <path d="M4 19h16" />
    </Svg>
  ),
  // Day-0 baseline report — bars on a baseline
  baseline: (
    <Svg>
      <path d="M4 20h16" />
      <path d="M7 20v-7M12 20V8M17 20v-4.5" />
    </Svg>
  ),
  // Script performance — a reply bubble with a check
  script: (
    <Svg>
      <path d="M4 5.5h16a1 1 0 0 1 1 1v8.5a1 1 0 0 1-1 1H9.5L5.5 19v-2.5H4a1 1 0 0 1-1-1V6.5a1 1 0 0 1 1-1Z" />
      <path d="M8.5 10.8l2 2 4-4" />
    </Svg>
  ),
  // Dispute evidence pack — a document file with a folded corner
  evidence: (
    <Svg>
      <path d="M6.5 3h6.5l4.5 4.5V20a1 1 0 0 1-1 1h-10a1 1 0 0 1-1-1V4a1 1 0 0 1 1-1Z" />
      <path d="M13 3v4.5h4.5" />
      <path d="M8.5 12.5h7M8.5 16h4.5" />
    </Svg>
  ),
  // Escalation flags — a raised flag
  flag: (
    <Svg>
      <path d="M6 21V4" />
      <path d="M6 5h10.5l-2.2 3 2.2 3H6" />
    </Svg>
  ),
  // CSV backer import — an arrow dropping into a tray
  import: (
    <Svg>
      <path d="M4 15v3a1.6 1.6 0 0 0 1.6 1.6h12.8A1.6 1.6 0 0 0 20 18v-3" />
      <path d="M12 3.5v10M8.4 10.2l3.6 3.6 3.6-3.6" />
    </Svg>
  ),
  // Webhook ingest — a two-link chain
  webhook: (
    <Svg>
      <path d="M9.5 14.5l-2.6 2.6a3 3 0 0 1-4.2-4.2l2.6-2.6" />
      <path d="M14.5 9.5l2.6-2.6a3 3 0 0 1 4.2 4.2l-2.6 2.6" />
      <path d="M9.6 14.4l4.8-4.8" />
    </Svg>
  ),
  // Security — a shield with a check
  shield: (
    <Svg>
      <path d="M12 3 5 6v5.2c0 4 2.9 6.7 7 8.3 4.1-1.6 7-4.3 7-8.3V6l-7-3Z" />
      <path d="M9 11.5l2 2 4-4.2" />
    </Svg>
  ),
  // Procurement — a clipboard with lines
  clipboard: (
    <Svg>
      <rect x="5" y="4.5" width="14" height="16.5" rx="2" />
      <rect x="9" y="2.6" width="6" height="3.4" rx="1.1" />
      <path d="M8.5 11h7M8.5 14.5h5" />
    </Svg>
  ),
  // Watch a walkthrough — a play glyph
  play: (
    <Svg>
      <circle cx="12" cy="12" r="9" />
      <path d="M10.2 8.6l5.4 3.4-5.4 3.4V8.6Z" />
    </Svg>
  ),
};
