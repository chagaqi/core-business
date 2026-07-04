import type { Merchant, MerchantUpdate, Order, StatusView, Ticket } from "@/lib/types";

/**
 * Setup checklist (task U4) — "you're N of 5 set up".
 *
 * KEY DESIGN CHOICE: every item is DERIVED from the merchant's REAL state
 * (computed from what actually exists), never a click-to-check flag. So the list
 * always reflects reality, needs no persistence, no schema, and no store change —
 * an item reads "done" ONLY when it is genuinely true. This is more honest than a
 * checkbox someone ticked, and it is the same proof-only discipline the rest of
 * Tideover runs on: nothing here is fabricated, and there is no hard date.
 *
 * The function is PURE: it takes the already-loaded arrays and returns the five
 * derived items (ordered quick-win-first) plus the completed count. The thin
 * service wrapper `getSetupChecklist(merchantId)` in lib/service.ts does the I/O
 * (load merchant + orders/tickets/updates/statusViews) and calls this.
 */

export type SetupItemKey = "brand" | "import" | "helpdesk" | "first-reply" | "status-visible";

export interface SetupItem {
  key: SetupItemKey;
  title: string;
  /** DERIVED from real state — true only when the step genuinely exists. */
  done: boolean;
  /** one plain-English line on what this step is and how to finish it. */
  hint: string;
  /** the surface that lets the merchant complete (or review) this step. */
  href: string;
}

export interface SetupState {
  merchant: Merchant;
  orders: Order[];
  tickets: Ticket[];
  updates: MerchantUpdate[];
  statusViews: StatusView[];
}

export interface SetupChecklist {
  items: SetupItem[];
  completed: number;
  total: number;
  allDone: boolean;
  /**
   * Integration health (task F7): the createdAt of the most recent REAL (non-mock)
   * inbound, or null if none. Surfaced on the "helpdesk connected" step so a
   * silently-severed webhook (merchant deleted the rule → tickets quietly stop) is
   * visible before anyone notices the queue went empty. Derived, not stored.
   */
  lastInboundAt: string | null;
}

/** A connected helpdesk that hasn't delivered a real inbound in this long is
 *  probably severed (rule deleted / secret rotated) — worth flagging. */
export const INTEGRATION_QUIET_DAYS = 7;

export interface IntegrationHealth {
  /** true = connected, non-demo, and no real inbound within INTEGRATION_QUIET_DAYS. */
  quiet: boolean;
  /** whole days since the last real inbound, or null when none has ever arrived. */
  quietDays: number | null;
}

/**
 * Pure integration-health check (F7). Clock is injected for determinism. Only
 * flags a REAL (non-demo) merchant whose helpdesk is connected but has gone quiet
 * — demo data is intentionally static, so a demo merchant is never "quiet".
 */
export function integrationHealth(
  args: { lastInboundAt: string | null; helpdeskConnected: boolean; isDemo: boolean },
  now: Date = new Date(),
): IntegrationHealth {
  const { lastInboundAt, helpdeskConnected, isDemo } = args;
  if (lastInboundAt == null) return { quiet: false, quietDays: null };
  const days = Math.floor((now.getTime() - new Date(lastInboundAt).getTime()) / 86_400_000);
  const quiet = helpdeskConnected && !isDemo && days >= INTEGRATION_QUIET_DAYS;
  return { quiet, quietDays: days };
}

/**
 * Derive the five setup items from a merchant's real, already-loaded state.
 * Ordered quick-win-first so the operator (or Dylan onboarding one) always sees
 * the cheapest next step at the top.
 *
 *  1. Brand & voice configured — the merchant has a brand identity (set during
 *     onboarding; true for any onboarded/seeded merchant).
 *  2. Backer list imported — at least one order exists to track.
 *  3. Helpdesk connected — the merchant set a presale tag filter OR a real (non-
 *     mock) inbound has actually arrived on some channel. A mock-only ticket does
 *     NOT count: the point is that a live helpdesk/email path is wired up.
 *  4. First reply reviewed & sent — some ticket carries an approved, sent reply.
 *  5. Customers can see their status — a backer has opened their status page
 *     (a recorded StatusView) OR the merchant has posted a workshop update.
 */
export function computeSetupChecklist(state: SetupState): SetupChecklist {
  const { merchant, orders, tickets, updates, statusViews } = state;

  // (1) An onboarded merchant always has a brand identity; logoText is the one
  // field onboarding always populates (from the required brand name), so it is
  // the reliable "brand is configured" signal even when voice was left blank.
  const brandConfigured = Boolean(merchant.brand?.logoText?.trim());

  // (2) Any imported/seeded backer produces an order.
  const backersImported = orders.length > 0;

  // (3) The merchant's own presale tag filter is set, OR a real inbound landed on
  // a live channel. "mock" is the built-in test channel, so it is excluded — this
  // item only flips when a genuine helpdesk/email path is actually delivering.
  const helpdeskConnected =
    (merchant.presaleTags?.length ?? 0) > 0 || tickets.some((t) => t.channel !== "mock");

  // (4) A sent reply is anything with sent.text — the operator reviewed a draft
  // and approved it out.
  const firstReplySent = tickets.some((t) => Boolean(t.sent?.text));

  // (5) Either a backer opened their status page (StatusView logged) or the
  // merchant broadcast a VISIBLE workshop update — either means status is visible.
  // A hidden (soft-retracted) update reaches no customer, so it must not count, or
  // this item could show "done" when nothing is actually visible.
  const statusVisible = statusViews.length > 0 || updates.some((u) => !u.hidden);

  const items: SetupItem[] = [
    {
      key: "brand",
      title: "Brand & voice configured",
      done: brandConfigured,
      hint: "Your voice, tone, and sign-off, captured in onboarding. Every reassurance draft is written in this voice.",
      href: "/onboarding",
    },
    {
      key: "import",
      title: "Backer list imported",
      done: backersImported,
      hint: "Bring in your Kickstarter or BackerKit export so every backer has an order to track. Parsed in your browser; the raw file never leaves your machine.",
      href: "/onboarding",
    },
    {
      key: "helpdesk",
      title: "Helpdesk connected",
      done: helpdeskConnected,
      hint: "Point your helpdesk's presale tag at your private ingest URL, or forward your support inbox. Tagged tickets flow in structured; this flips on once a real inbound arrives.",
      href: "/onboarding",
    },
    {
      key: "first-reply",
      title: "First reply reviewed & sent",
      done: firstReplySent,
      hint: "Open the cockpit, review a drafted reassurance reply, and approve it out. The first send flips this on.",
      href: "/app/inbox",
    },
    {
      key: "status-visible",
      title: "Customers can see their status",
      done: statusVisible,
      hint: "Post a workshop update, or let a backer open their status page. Either one means customers can see where their order stands.",
      href: "/app/updates",
    },
  ];

  // Integration health (F7): the most recent REAL (non-mock) inbound. This is the
  // last confirmed delivery from the merchant's helpdesk — the signal that the
  // connection is still alive, derived from ticket dates (no store needed).
  const lastInboundAt =
    tickets
      .filter((t) => t.channel !== "mock")
      .map((t) => t.createdAt)
      .sort()
      .at(-1) ?? null;

  const completed = items.filter((i) => i.done).length;
  const total = items.length;
  return { items, completed, total, allDone: completed === total, lastInboundAt };
}
