import assert from "node:assert/strict";
import { test } from "node:test";
import {
  assembleEvidencePack,
  buildCommLog,
  computeDisputeWindow,
  extractCsat,
  extractGiftGestures,
  parseBandDays,
  CAP_FROM_TXN_DAYS,
  RC131_WINDOW_DAYS,
} from "@/lib/evidence";
import { jsonRepositories } from "@/lib/repositories/json/repositories";
import { __setTenantScopeForTests } from "@/lib/tenant";
import { AUTH0_ENV_VARS } from "@/lib/auth-mode";
import type { OutcomeEvent, Ticket } from "@/lib/types";

const DAY = 86_400_000;

test("parseBandDays reads a weeks band", () => {
  assert.deepEqual(parseBandDays("weeks 12–14"), { loDays: 84, hiDays: 98 });
});

test("parseBandDays reads a days band and orders lo/hi", () => {
  assert.deepEqual(parseBandDays("14–9 days"), { loDays: 9, hiDays: 14 });
});

test("parseBandDays returns null when there is no number", () => {
  assert.equal(parseBandDays("in the next day or two"), null);
});

test("computeDisputeWindow anchors expected delivery to the band upper bound", () => {
  const disclosedAt = "2026-04-20T00:00:00.000Z";
  const w = computeDisputeWindow(
    { value: "weeks 12–14", source: "campaign-page", disclosedAt },
    "2026-04-19T00:00:00.000Z",
    new Date("2026-06-01T00:00:00.000Z"),
  );
  // expected delivery = disclosedAt + 98 days (upper bound)
  const expectedMs = new Date(disclosedAt).getTime() + 98 * DAY;
  assert.equal(new Date(w.expectedDeliveryEstimate!).getTime(), expectedMs);
  // window closes ~120 days after expected delivery
  assert.equal(
    new Date(w.windowClosesEstimate!).getTime(),
    expectedMs + RC131_WINDOW_DAYS * DAY,
  );
  // opens 15 days after expected delivery
  assert.equal(new Date(w.windowOpensEstimate!).getTime(), expectedMs + 15 * DAY);
});

test("computeDisputeWindow reports open while now is before the effective close", () => {
  const w = computeDisputeWindow(
    { value: "weeks 12–14", source: "checkout", disclosedAt: "2026-04-20T00:00:00.000Z" },
    "2026-04-19T00:00:00.000Z",
    new Date("2026-06-01T00:00:00.000Z"),
  );
  assert.equal(w.isOpen, true);
  assert.ok((w.daysToClose ?? 0) > 0);
});

test("computeDisputeWindow reports closed once now is past the effective close", () => {
  const w = computeDisputeWindow(
    { value: "weeks 12–14", source: "checkout", disclosedAt: "2026-01-01T00:00:00.000Z" },
    "2026-01-01T00:00:00.000Z",
    new Date("2027-01-01T00:00:00.000Z"),
  );
  assert.equal(w.isOpen, false);
  assert.ok((w.daysToClose ?? 0) < 0);
});

test("computeDisputeWindow caps the window at 540 days from the transaction", () => {
  const disclosedAt = "2026-04-20T00:00:00.000Z";
  // transaction 400 days before disclosure → 540-day cap lands before the 120-day close
  const transactionAt = new Date(new Date(disclosedAt).getTime() - 400 * DAY).toISOString();
  const w = computeDisputeWindow(
    { value: "weeks 12–14", source: "update", disclosedAt },
    transactionAt,
    new Date("2026-06-01T00:00:00.000Z"),
  );
  const capMs = new Date(transactionAt).getTime() + CAP_FROM_TXN_DAYS * DAY;
  assert.equal(new Date(w.effectiveCloseEstimate!).getTime(), capMs);
  assert.equal(w.effectiveCloseEstimate, w.hardCap540Estimate);
});

function ticket(over: Partial<Ticket>): Ticket {
  return {
    id: "tkt_x",
    merchantId: "mch_t",
    customerId: "cus_t",
    orderId: "ord_t",
    channel: "gorgias",
    externalId: null,
    subject: "subject",
    body: "body",
    type: "wismo",
    sentiment: "calm",
    createdAt: "2026-06-01T00:00:00.000Z",
    firstResponseSec: null,
    status: "open",
    tags: [],
    ...over,
  };
}

test("buildCommLog includes inbound + sent replies chronologically, and excludes unsent drafts", () => {
  const tickets: Ticket[] = [
    ticket({
      id: "tkt_b",
      createdAt: "2026-06-02T00:00:00.000Z",
      body: "second in",
      status: "sent",
      sent: { text: "reply sent", approvedBy: "Dylan", sentAt: "2026-06-03T00:00:00.000Z", externalId: "m1" },
    }),
    ticket({
      id: "tkt_a",
      createdAt: "2026-06-01T00:00:00.000Z",
      body: "first in",
      status: "drafted",
      draft: {
        id: "drf_1",
        text: "draft only",
        confidenceBand: "in weeks 2–3",
        priority: "normal",
        draftedBy: "deterministic",
        riskScore: 10,
        recommendedGiftId: null,
        createdAt: "2026-06-01T06:00:00.000Z",
      },
    }),
  ];
  const log = buildCommLog(tickets, "Mara");
  // tkt_a's unsent draft is excluded; only the two inbounds + the one sent reply remain.
  assert.equal(log.length, 3);
  assert.deepEqual(
    log.map((e) => e.kind),
    ["inbound", "inbound", "outbound-sent"],
  );
  assert.equal(log[0].actor, "Mara (customer)");
  assert.equal(log[0].at, "2026-06-01T00:00:00.000Z"); // tkt_a inbound, earliest
  assert.equal(log[2].actor, "Dylan (operator)");
  assert.equal(log[2].statusLabel, "sent");
});

test("extractGiftGestures reads gift-sent tags only, deterministically ordered", () => {
  const gestures = extractGiftGestures([
    ticket({ id: "tkt_b", subject: "still waiting", tags: ["presale", "gift-sent:priority-dispatch"] }),
    ticket({ id: "tkt_a", subject: "where is it", tags: ["gift-sent:card", "escalated:Dylan"] }),
    ticket({ id: "tkt_c", tags: ["presale"] }),
  ]);
  assert.deepEqual(gestures, [
    { kind: "card", ticketId: "tkt_a", ticketSubject: "where is it" },
    { kind: "priority-dispatch", ticketId: "tkt_b", ticketSubject: "still waiting" },
  ]);
});

function csatEvent(over: Partial<OutcomeEvent>): OutcomeEvent {
  return {
    id: "evt_x",
    merchantId: "mch_t",
    ticketId: "tkt_x",
    orderId: "ord_t",
    customerId: "cus_t",
    variantId: "var_x",
    stageKey: "day-30",
    sentimentAtSend: "anxious",
    kind: "csat_up",
    observedAt: "2026-07-01T00:00:00.000Z",
    ...over,
  };
}

test("extractCsat returns the LAST csat row for the order and ignores other orders/kinds", () => {
  const events: OutcomeEvent[] = [
    csatEvent({ id: "e1", kind: "reply_sent", observedAt: "2026-06-01T00:00:00.000Z" }),
    csatEvent({ id: "e2", kind: "csat_down", observedAt: "2026-06-02T00:00:00.000Z" }),
    csatEvent({ id: "e3", kind: "csat_up", orderId: "ord_other", observedAt: "2026-06-03T00:00:00.000Z" }),
    csatEvent({ id: "e4", kind: "csat_up", observedAt: "2026-06-04T00:00:00.000Z" }),
  ];
  assert.deepEqual(extractCsat(events, "ord_t"), { value: "up", observedAt: "2026-06-04T00:00:00.000Z" });
  assert.equal(extractCsat(events, "ord_none"), null);
});

// ─── assembled pack: seeded-data completeness + tenant isolation ─────────────
// Seeded demo order (mch_lumen0001): disclosedEta + status view + sent reply +
// gift-sent tag + campaign/wave labels — the full INR evidence surface.
const SEEDED_ORDER = "ord_oaoizbqal569";
// Seeded demo order with a csat_up outcome event AND a sent reply.
const SEEDED_CSAT_ORDER = "ord_mx4s8st5zaeq";

test("assembleEvidencePack on a seeded order: disclosure, views, sent replies, gift gestures — timestamps verbatim from the ledgers", async () => {
  const pack = await assembleEvidencePack(SEEDED_ORDER);
  assert.ok(pack, "seeded order assembles");

  // Demo watermark driver: the seeded merchant is a demo merchant.
  assert.equal(pack.isDemo, true, "isDemo drives the SAMPLE DATA watermark");

  // Disclosure: present, and the timestamp is byte-for-byte the stored one.
  const order = await jsonRepositories.orders.findById(SEEDED_ORDER);
  assert.ok(order?.disclosedEta, "seeded order carries a disclosed ETA");
  assert.equal(pack.disclosedEta?.value, order!.disclosedEta!.value);
  assert.equal(pack.disclosedEta?.disclosedAt, order!.disclosedEta!.disclosedAt);

  // Status views: >=1, verbatim from the status_views ledger.
  const views = await jsonRepositories.statusViews.listByOrder(SEEDED_ORDER);
  assert.ok(views.length >= 1, "seeded order has a logged status view");
  assert.deepEqual(pack.statusViews, views);

  // Sent replies: >=1 outbound-sent entry whose timestamp is the stored sentAt.
  const tickets = await jsonRepositories.tickets.list({ orderId: SEEDED_ORDER });
  const sentTicket = tickets.find((t) => t.sent);
  assert.ok(sentTicket, "seeded order has a sent reply");
  const outbound = pack.commLog.filter((e) => e.kind === "outbound-sent");
  assert.ok(outbound.length >= 1);
  assert.ok(
    outbound.some((e) => e.at === sentTicket!.sent!.sentAt && e.ticketId === sentTicket!.id),
    "sentAt is copied verbatim into the comm log",
  );

  // Gift gestures: the seeded gift-sent tag surfaces.
  assert.ok(
    pack.giftGestures.some((g) => g.kind === "priority-dispatch"),
    "gift-sent tag surfaces as a gesture",
  );

  // Campaign/wave labels pass through.
  assert.equal(pack.order.campaignName, order!.campaignName);
  assert.equal(pack.order.wave, order!.wave);
});

test("assembleEvidencePack carries the seeded CSAT acknowledgment with its ledger timestamp", async () => {
  const pack = await assembleEvidencePack(SEEDED_CSAT_ORDER);
  assert.ok(pack);
  const events = await jsonRepositories.outcomeEvents.listByMerchant(pack!.merchant.id);
  const seeded = events.filter(
    (e) => e.orderId === SEEDED_CSAT_ORDER && (e.kind === "csat_up" || e.kind === "csat_down"),
  );
  assert.ok(seeded.length >= 1, "seed carries a csat event for this order");
  const last = seeded[seeded.length - 1];
  assert.deepEqual(pack!.csat, {
    value: last.kind === "csat_up" ? "up" : "down",
    observedAt: last.observedAt,
  });
});

test("ISOLATION: a scoped foreign session cannot assemble another merchant's pack (route answers 404 on null)", async () => {
  // Auth0 mode on so getRepositories() wraps the driver — the production seam.
  const saved = Object.fromEntries(AUTH0_ENV_VARS.map((k) => [k, process.env[k]]));
  for (const k of AUTH0_ENV_VARS) process.env[k] = "test-value";
  __setTenantScopeForTests({ kind: "scoped", sub: "auth0|foreign-evidence" });
  try {
    assert.equal(await assembleEvidencePack(SEEDED_ORDER), null, "foreign order dead-ends at the merchants seam");
  } finally {
    __setTenantScopeForTests(null);
    for (const k of AUTH0_ENV_VARS) {
      const v = saved[k];
      if (v === undefined) delete process.env[k];
      else process.env[k] = v;
    }
  }
  // Unscoped (demo/password/scripts) still assembles — identical to before.
  assert.ok(await assembleEvidencePack(SEEDED_ORDER), "unscoped access is unchanged");
});
