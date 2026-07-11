import { assertNoHardDate } from "@/lib/proof";
import type {
  Channel,
  CustomerGroup,
  Order,
  OutcomeEvent,
  ProductionStageKey,
  StatusView,
  Ticket,
} from "@/lib/types";

/**
 * Dispute Evidence Pack assembler (M2).
 *
 * A RENDER of data that already exists after M1 — it invents nothing. Given one
 * order id it gathers, through the repository seam, exactly the fields Shopify's
 * dispute-response form asks a merchant to provide: the delivery estimate
 * disclosed at purchase, the full communication log, and the status-page view
 * log. The pure helpers below (band parsing, dispute-window orientation, comm-log
 * shaping) carry no I/O so they are trivially unit-testable; `assembleEvidencePack`
 * is the only async, repository-touching function and it stays thin.
 *
 * Proof-only doctrine: nothing here claims a chargeback win rate or any outcome.
 * The disclosed ETA is a human band (never a hard date) and is run through
 * `assertNoHardDate` before it is copied into the pack. The dispute-window footer
 * is labelled an ESTIMATE for orientation and cites Visa reason code 13.1, whose
 * 120-day clock runs from EXPECTED DELIVERY (not the sale) — the one number this
 * ICP will disqualify the whole product over if it is wrong.
 */

const DAY_MS = 86_400_000;

/** Visa 13.1 "merchandise/services not received": filable up to ~120 days after
 *  the last expected-delivery date. */
export const RC131_WINDOW_DAYS = 120;
/** Mandatory issuer wait before a 13.1 dispute can be filed. */
export const ISSUER_WAIT_DAYS = 15;
/** Hard cap: no 13.1 dispute past ~540 days from the transaction. */
export const CAP_FROM_TXN_DAYS = 540;

export interface BandDays {
  loDays: number;
  hiDays: number;
}

/**
 * Parse a disclosed ETA band ("weeks 12–14", "9–14 days", "2–3 months") into a
 * day range. The unit is read explicitly (month→30 / week→7 / day→1). Returns
 * null when the band carries no digits OR no recognized time unit — the caller
 * then omits the numeric window orientation rather than anchoring the Visa 13.1
 * date on a wrong assumption (a mis-anchored dispute date is the exact error an
 * operator disqualifies the product over).
 */
export function parseBandDays(value: string): BandDays | null {
  const nums = (value.match(/\d+/g) ?? []).map(Number);
  if (nums.length === 0) return null;
  const mult = /month/i.test(value) ? 30 : /week/i.test(value) ? 7 : /day/i.test(value) ? 1 : null;
  if (mult === null) return null;
  const a = nums[0] * mult;
  const b = (nums.length > 1 ? nums[1] : nums[0]) * mult;
  return { loDays: Math.min(a, b), hiDays: Math.max(a, b) };
}

export interface DisputeWindowOrientation {
  /** the order's transaction date (createdAt) — anchor for the 540-day cap. */
  transactionAt: string;
  disclosedAt: string;
  band: BandDays | null;
  /** upper-bound expected delivery estimate = disclosedAt + hiDays (ISO), or null. */
  expectedDeliveryEstimate: string | null;
  /** 13.1 becomes filable ~15 days after expected delivery (ISO), or null. */
  windowOpensEstimate: string | null;
  /** ~120 days after expected delivery (ISO), or null. */
  windowClosesEstimate: string | null;
  /** 540 days after the transaction (ISO) — the absolute outer cap. */
  hardCap540Estimate: string;
  /** min(windowCloses, hardCap540) — the effective exposure end (ISO), or null. */
  effectiveCloseEstimate: string | null;
  /** whole days from `now` to the effective close (negative once past), or null. */
  daysToClose: number | null;
  /** true when `now` is on/before the effective close — i.e. exposure still open. */
  isOpen: boolean;
}

/**
 * Orientation math for the dispute window. Pure and deterministic (`now` is
 * injectable). Expected delivery is taken from the UPPER bound of the disclosed
 * band — the date the buyer last expected delivery — because that is the anchor
 * the 13.1 clock actually uses. Everything is an estimate and is labelled as such
 * in the render; this is not legal advice and never an outcome prediction.
 */
export function computeDisputeWindow(
  disclosedEta: NonNullable<Order["disclosedEta"]>,
  transactionAt: string,
  now: Date = new Date(),
): DisputeWindowOrientation {
  const band = parseBandDays(disclosedEta.value);
  const disclosedMs = new Date(disclosedEta.disclosedAt).getTime();
  const txnMs = new Date(transactionAt).getTime();
  const capMs = txnMs + CAP_FROM_TXN_DAYS * DAY_MS;

  const out: DisputeWindowOrientation = {
    transactionAt,
    disclosedAt: disclosedEta.disclosedAt,
    band,
    expectedDeliveryEstimate: null,
    windowOpensEstimate: null,
    windowClosesEstimate: null,
    hardCap540Estimate: new Date(capMs).toISOString(),
    effectiveCloseEstimate: null,
    daysToClose: null,
    isOpen: false,
  };

  if (band) {
    const expectedMs = disclosedMs + band.hiDays * DAY_MS;
    const closesMs = expectedMs + RC131_WINDOW_DAYS * DAY_MS;
    const effMs = Math.min(closesMs, capMs);
    out.expectedDeliveryEstimate = new Date(expectedMs).toISOString();
    out.windowOpensEstimate = new Date(expectedMs + ISSUER_WAIT_DAYS * DAY_MS).toISOString();
    out.windowClosesEstimate = new Date(closesMs).toISOString();
    out.effectiveCloseEstimate = new Date(effMs).toISOString();
    out.daysToClose = Math.round((effMs - now.getTime()) / DAY_MS);
    out.isOpen = now.getTime() <= effMs;
  }
  return out;
}

export type CommLogKind = "inbound" | "outbound-sent";

export interface CommLogEntry {
  at: string;
  kind: CommLogKind;
  /** who the entry is from, e.g. "Mara (customer)" or "Dylan (operator)". */
  actor: string;
  channel: Channel;
  /** short state word: "received" | "sent" | "drafted — not sent". */
  statusLabel: string;
  subject?: string;
  text: string;
  ticketId: string;
}

/**
 * Flatten tickets into a single chronological communication log of what the
 * customer actually experienced: every inbound customer message, and every
 * SENT reply (with the approver). Unsent drafts are deliberately excluded — a
 * draft the customer never received is not evidence and must not be transcribed
 * into a card-network dispute submission. Sorted by timestamp, ticket id tiebreak.
 */
export function buildCommLog(tickets: Ticket[], customerFirstName: string): CommLogEntry[] {
  const entries: CommLogEntry[] = [];
  for (const t of tickets) {
    entries.push({
      at: t.createdAt,
      kind: "inbound",
      actor: `${customerFirstName} (customer)`,
      channel: t.channel,
      statusLabel: "received",
      subject: t.subject,
      text: t.body,
      ticketId: t.id,
    });
    if (t.sent) {
      entries.push({
        at: t.sent.sentAt,
        kind: "outbound-sent",
        actor: `${t.sent.approvedBy} (operator)`,
        channel: t.channel,
        statusLabel: "sent",
        text: t.sent.text,
        ticketId: t.id,
      });
    }
  }
  return entries.sort((a, b) =>
    a.at < b.at ? -1 : a.at > b.at ? 1 : a.ticketId < b.ticketId ? -1 : a.ticketId > b.ticketId ? 1 : 0,
  );
}

/**
 * A gift gesture logged against a ticket — read straight off the ticket's
 * `gift-sent:<kind>` tag (UX-86, lib/gift-send.ts). The tag write stores no
 * timestamp of its own, so none is claimed here: the entry cites only the
 * ticket it was logged on. Never invented, never dated.
 */
export interface GiftGestureEntry {
  kind: string;
  ticketId: string;
  ticketSubject: string;
}

/** Read every `gift-sent:*` tag across the order's tickets. Deterministic order
 *  (ticketId, then kind) so both drivers and repeat renders agree. */
export function extractGiftGestures(tickets: Ticket[]): GiftGestureEntry[] {
  const out: GiftGestureEntry[] = [];
  for (const t of tickets) {
    for (const tag of t.tags) {
      if (tag.startsWith("gift-sent:")) {
        out.push({ kind: tag.slice("gift-sent:".length), ticketId: t.id, ticketSubject: t.subject });
      }
    }
  }
  return out.sort((a, b) =>
    a.ticketId < b.ticketId ? -1 : a.ticketId > b.ticketId ? 1 : a.kind < b.kind ? -1 : a.kind > b.kind ? 1 : 0,
  );
}

/**
 * The customer's one-tap CSAT acknowledgment (ADR-0012): the customer opened
 * their status page and rated the merchant's most recent sent reply. For an
 * INR dispute this is direct engagement evidence — the buyer not only viewed
 * the information, they responded to it. Re-taps REPLACE (api/csat), so at
 * most one is current per order.
 */
export interface CsatAcknowledgment {
  value: "up" | "down";
  observedAt: string;
}

/** The order's current CSAT acknowledgment, or null. `events` is an
 *  observedAt-ascending merchant ledger (outcomeEvents.listByMerchant); the
 *  LAST csat row for the order is the current one. */
export function extractCsat(events: OutcomeEvent[], orderId: string): CsatAcknowledgment | null {
  for (let i = events.length - 1; i >= 0; i--) {
    const e = events[i];
    if (e.orderId !== orderId) continue;
    if (e.kind === "csat_up") return { value: "up", observedAt: e.observedAt };
    if (e.kind === "csat_down") return { value: "down", observedAt: e.observedAt };
  }
  return null;
}

export interface EvidencePack {
  generatedAt: string;
  /** merchant.isDemo — drives the "SAMPLE DATA" watermark (screenshot-leak guard). */
  isDemo: boolean;
  merchant: { id: string; name: string };
  order: {
    id: string;
    valueCents: number;
    group: CustomerGroup;
    region: string;
    productionStage: ProductionStageKey;
    createdAt: string;
    campaignName?: string;
    wave?: string;
  };
  /** operator-side pack: the merchant's OWN dispute evidence, so email is allowed. */
  customer: { firstName: string; email: string };
  disclosedEta?: NonNullable<Order["disclosedEta"]>;
  disputeWindow?: DisputeWindowOrientation;
  commLog: CommLogEntry[];
  statusViews: StatusView[];
  /** the customer's one-tap rating of a sent reply, or null if none is on file. */
  csat: CsatAcknowledgment | null;
  /** gift gestures logged against the order's tickets (`gift-sent:*` tags). */
  giftGestures: GiftGestureEntry[];
}

/**
 * Assemble the full evidence pack for one order via the repository seam. Returns
 * null when the order (or its merchant/customer) can't be resolved so the route
 * renders a clean not-found instead of crashing. The repositories module is
 * imported lazily so this file's static graph stays free of the data-driver
 * dependencies — keeping the pure helpers above cheap to unit-test in isolation.
 */
export async function assembleEvidencePack(
  orderId: string,
  now: Date = new Date(),
): Promise<EvidencePack | null> {
  const { getRepositories } = await import("@/lib/repositories");
  const repos = getRepositories();

  const order = await repos.orders.findById(orderId);
  if (!order) return null;

  const [merchant, customer, tickets, statusViews, outcomeEvents] = await Promise.all([
    repos.merchants.findById(order.merchantId),
    repos.customers.findById(order.customerId),
    repos.tickets.list({ orderId: order.id }),
    repos.statusViews.listByOrder(order.id),
    repos.outcomeEvents.listByMerchant(order.merchantId),
  ]);
  if (!merchant || !customer) return null;

  const pack: EvidencePack = {
    generatedAt: now.toISOString(),
    isDemo: merchant.isDemo,
    merchant: { id: merchant.id, name: merchant.name },
    order: {
      id: order.id,
      valueCents: order.orderValueCents,
      group: order.group,
      region: order.region,
      productionStage: order.productionStage,
      createdAt: order.createdAt,
    },
    customer: { firstName: customer.firstName, email: customer.email },
    commLog: buildCommLog(tickets, customer.firstName),
    statusViews,
    csat: extractCsat(outcomeEvents, order.id),
    giftGestures: extractGiftGestures(tickets),
  };

  if (order.campaignName) pack.order.campaignName = order.campaignName;
  if (order.wave) pack.order.wave = order.wave;

  if (order.disclosedEta) {
    // Proof-only: the disclosed band is customer-facing text; it must never be a
    // hard date. This throws loudly in dev if a bad value ever reaches the pack.
    assertNoHardDate(order.disclosedEta.value);
    pack.disclosedEta = order.disclosedEta;
    pack.disputeWindow = computeDisputeWindow(order.disclosedEta, order.createdAt, now);
  }

  return pack;
}
