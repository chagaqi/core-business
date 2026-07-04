import assert from "node:assert/strict";
import { test } from "node:test";
import { computeSetupChecklist, type SetupState } from "@/lib/setup";
import type { Merchant, MerchantUpdate, Order, StatusView, Ticket } from "@/lib/types";

/**
 * U4 setup checklist — proof that every item is DERIVED from real state, never a
 * stored flag. Each test builds a minimal state and asserts the five items flip
 * exactly when the underlying reality is present.
 */

function merchant(over: Partial<Merchant> = {}): Merchant {
  return {
    id: "mch_t",
    name: "Test Co",
    slug: "test-co",
    isDemo: false,
    inboxToken: "tok",
    brand: {
      voice: "Warm and plain",
      tone: ["Warm"],
      banned: [],
      signoff: "— Test",
      logoText: "Test Co",
      colors: { primary: "#000", bg: "#fff", ink: "#111" },
    },
    helpdesk: "gorgias",
    preorderApp: "",
    fulfillmentWindowDays: { min: 90, max: 120 },
    stages: [],
    playbook: {
      "day-7": { base: "", byStage: {} },
      "day-30": { base: "", byStage: {} },
      "day-60": { base: "", byStage: {} },
      "day-89": { base: "", byStage: {} },
    },
    ltvTiers: { standard: 0, high: 50000, vip: 200000 },
    giftCatalogIds: [],
    slaWindows: { amStart: "9:00", pmStart: "15:00", tz: "ET" },
    baseline: {
      capturedOn: "2026-01-01T00:00:00.000Z",
      medianFrtSec: 0,
      wismoPer100Orders: 0,
      ticketsPerWeek: 0,
      repeatWismoPct: 0,
    },
    createdAt: "2026-01-01T00:00:00.000Z",
    ...over,
  };
}

function order(over: Partial<Order> = {}): Order {
  return {
    id: "ord_t",
    merchantId: "mch_t",
    customerId: "cus_t",
    group: "ks-backer",
    orderValueCents: 30000,
    createdAt: "2026-01-01T00:00:00.000Z",
    fulfillmentStart: "2026-01-01T00:00:00.000Z",
    fulfillmentEnd: "2026-04-01T00:00:00.000Z",
    productionStage: "production",
    region: "US",
    statusToken: "raw.mac",
    preorderEtaSource: "manual",
    ...over,
  };
}

function ticket(over: Partial<Ticket> = {}): Ticket {
  return {
    id: "tkt_t",
    merchantId: "mch_t",
    customerId: "cus_t",
    orderId: "ord_t",
    channel: "gorgias",
    externalId: null,
    subject: "where is my order",
    body: "hi",
    type: "wismo",
    sentiment: "anxious",
    createdAt: "2026-01-02T00:00:00.000Z",
    firstResponseSec: null,
    status: "open",
    tags: [],
    ...over,
  };
}

function statusView(over: Partial<StatusView> = {}): StatusView {
  return {
    id: "sv_t",
    orderId: "ord_t",
    merchantId: "mch_t",
    token: "raw.mac",
    viewedAt: "2026-01-03T00:00:00.000Z",
    ...over,
  };
}

function update(over: Partial<MerchantUpdate> = {}): MerchantUpdate {
  return {
    id: "upd_t",
    merchantId: "mch_t",
    text: "Quality control is underway.",
    createdAt: "2026-01-03T00:00:00.000Z",
    ...over,
  };
}

const EMPTY: SetupState = {
  merchant: merchant(),
  orders: [],
  tickets: [],
  updates: [],
  statusViews: [],
};

function itemDone(state: SetupState, key: string): boolean {
  return computeSetupChecklist(state).items.find((i) => i.key === key)!.done;
}

test("shape: five items, ordered quick-win-first, total is 5", () => {
  const c = computeSetupChecklist(EMPTY);
  assert.equal(c.total, 5);
  assert.equal(c.items.length, 5);
  assert.deepEqual(
    c.items.map((i) => i.key),
    ["brand", "import", "helpdesk", "first-reply", "status-visible"],
  );
});

test("empty merchant: brand is done (post-onboarding), everything else not", () => {
  // Even a bare merchant carries a configured brand (logoText from onboarding),
  // so item 1 is the only one done on an otherwise-empty state.
  const c = computeSetupChecklist(EMPTY);
  assert.equal(itemDone(EMPTY, "brand"), true);
  assert.equal(itemDone(EMPTY, "import"), false);
  assert.equal(itemDone(EMPTY, "helpdesk"), false);
  assert.equal(itemDone(EMPTY, "first-reply"), false);
  assert.equal(itemDone(EMPTY, "status-visible"), false);
  assert.equal(c.completed, 1);
  assert.equal(c.allDone, false);
});

test("brand: not done when the brand has no logo text", () => {
  const state: SetupState = {
    ...EMPTY,
    merchant: merchant({
      brand: { voice: "", tone: [], banned: [], signoff: "", logoText: "   ", colors: { primary: "", bg: "", ink: "" } },
    }),
  };
  assert.equal(itemDone(state, "brand"), false);
});

test("import: done as soon as one order exists", () => {
  const withOrder: SetupState = { ...EMPTY, orders: [order()] };
  assert.equal(itemDone(withOrder, "import"), true);
});

test("merchant with orders but no sent reply → item 2 (import) done, item 4 (first-reply) not", () => {
  const state: SetupState = {
    ...EMPTY,
    orders: [order()],
    tickets: [ticket({ status: "open" })], // inbound, but nothing sent yet
  };
  assert.equal(itemDone(state, "import"), true);
  assert.equal(itemDone(state, "first-reply"), false);
});

test("first-reply: done once a ticket carries a sent reply", () => {
  const state: SetupState = {
    ...EMPTY,
    tickets: [
      ticket({
        status: "sent",
        sent: { text: "You're in good hands.", approvedBy: "Dylan", sentAt: "2026-01-04T00:00:00.000Z", externalId: "x" },
      }),
    ],
  };
  assert.equal(itemDone(state, "first-reply"), true);
});

test("helpdesk: done via a non-mock inbound channel (a real inbound arrived)", () => {
  const emailInbound: SetupState = { ...EMPTY, tickets: [ticket({ channel: "email" })] };
  assert.equal(itemDone(emailInbound, "helpdesk"), true);
});

test("helpdesk: done via presaleTags even with only a mock ticket", () => {
  const state: SetupState = {
    ...EMPTY,
    merchant: merchant({ presaleTags: ["presale"] }),
    tickets: [ticket({ channel: "mock" })],
  };
  assert.equal(itemDone(state, "helpdesk"), true);
});

test("helpdesk: NOT done when the only ticket is mock and no presaleTags set", () => {
  const state: SetupState = { ...EMPTY, tickets: [ticket({ channel: "mock" })] };
  assert.equal(itemDone(state, "helpdesk"), false);
});

test("status-visible: done via a status view", () => {
  const state: SetupState = { ...EMPTY, statusViews: [statusView()] };
  assert.equal(itemDone(state, "status-visible"), true);
});

test("status-visible: done via a posted workshop update (no views yet)", () => {
  const state: SetupState = { ...EMPTY, updates: [update()] };
  assert.equal(itemDone(state, "status-visible"), true);
});

test("status-visible: a HIDDEN update alone does NOT count (no customer can see it)", () => {
  // A soft-retracted update reaches nobody, so it must not flip the item to done.
  const state: SetupState = { ...EMPTY, updates: [update({ hidden: true })] };
  assert.equal(itemDone(state, "status-visible"), false);
  // ...but a visible update alongside a hidden one still counts.
  const withVisible: SetupState = { ...EMPTY, updates: [update({ hidden: true }), update({ id: "upd_v" })] };
  assert.equal(itemDone(withVisible, "status-visible"), true);
});

test("completed count reflects exactly the derived-done items", () => {
  // orders + a real-channel inbound + a status view → brand, import, helpdesk,
  // status-visible done (4); first-reply still not sent.
  const state: SetupState = {
    ...EMPTY,
    orders: [order()],
    tickets: [ticket({ channel: "email", status: "open" })],
    statusViews: [statusView()],
  };
  const c = computeSetupChecklist(state);
  assert.equal(c.completed, 4);
  assert.equal(c.allDone, false);
  assert.equal(itemDone(state, "first-reply"), false);
});

test("allDone only when all five are truly derived-done", () => {
  const state: SetupState = {
    merchant: merchant({ presaleTags: ["presale"] }),
    orders: [order()],
    tickets: [
      ticket({
        channel: "email",
        status: "sent",
        sent: { text: "sent", approvedBy: "Dylan", sentAt: "2026-01-04T00:00:00.000Z", externalId: "x" },
      }),
    ],
    updates: [update()],
    statusViews: [statusView()],
  };
  const c = computeSetupChecklist(state);
  assert.equal(c.completed, 5);
  assert.equal(c.total, 5);
  assert.equal(c.allDone, true);
  assert.ok(c.items.every((i) => i.done));
});
