import assert from "node:assert/strict";
import { test } from "node:test";
import { authorizeGiftSend } from "@/lib/gift-send";
import { getRepositories } from "@/lib/repositories";
import type { Customer, Order, Ticket } from "@/lib/types";

const LUMEN = "mch_lumen0001"; // seeded demo merchant (has a full 5-gift catalog)
const ATELIER = "mch_atelier02"; // the OTHER seeded merchant

const repos = getRepositories();
const DAY = 86400000;

// A calm, low-value, early-stage order → standard risk band, so only BASE gifts
// are unlocked. mid/full gifts must be refused by the server.
const CUS: Customer = {
  id: "cus_giftsend_t",
  merchantId: LUMEN,
  email: "giftsend@example.com",
  firstName: "Pat",
  ltvCents: 5000,
  orderIds: ["ord_giftsend_t"],
  ticketCount: 1,
  lastSentiment: "calm",
};
const ORD: Order = {
  id: "ord_giftsend_t",
  merchantId: LUMEN,
  customerId: CUS.id,
  group: "ks-backer",
  orderValueCents: 5000,
  createdAt: new Date(Date.now() - 6 * DAY).toISOString(),
  fulfillmentStart: new Date(Date.now() - 5 * DAY).toISOString(),
  fulfillmentEnd: new Date(Date.now() + 110 * DAY).toISOString(),
  productionStage: "sourcing",
  region: "US",
  statusToken: "x.y",
  preorderEtaSource: "manual",
};
const TKT: Ticket = {
  id: "tkt_giftsend_t",
  merchantId: LUMEN,
  customerId: CUS.id,
  orderId: ORD.id,
  channel: "gorgias",
  externalId: "gorgias-99991",
  subject: "any update?",
  body: "just checking in on my order, thanks",
  type: "wismo",
  sentiment: "calm",
  createdAt: new Date().toISOString(),
  firstResponseSec: null,
  status: "open",
  tags: [],
};

// Seed the fixtures into the in-memory store once (child process is isolated).
await repos.customers.create(CUS);
await repos.orders.create(ORD);
await repos.tickets.create(TKT);

async function giftOfTier(merchantId: string, tier: "base" | "mid" | "full") {
  const catalog = await repos.gifts.listByMerchant(merchantId);
  const g = catalog.find((x) => x.tier === tier);
  assert.ok(g, `${merchantId} has a ${tier} gift`);
  return g!;
}

test("gift-send REJECTS a locked (full-tier) gift for a standard-band customer with 403", async () => {
  const full = await giftOfTier(LUMEN, "full");
  const res = await authorizeGiftSend(TKT.id, full.id);
  assert.equal(res.ok, false);
  assert.equal(res.ok === false && res.status, 403);
});

test("gift-send REJECTS a mid-tier gift for a standard-band customer with 403", async () => {
  const mid = await giftOfTier(LUMEN, "mid");
  const res = await authorizeGiftSend(TKT.id, mid.id);
  assert.equal(res.ok, false);
  assert.equal(res.ok === false && res.status, 403);
});

test("gift-send REJECTS a gift from another merchant's catalog with 403", async () => {
  const foreign = await giftOfTier(ATELIER, "base");
  const res = await authorizeGiftSend(TKT.id, foreign.id);
  assert.equal(res.ok, false);
  assert.equal(res.ok === false && res.status, 403);
});

test("gift-send ALLOWS an unlocked (base-tier) gift and writes the gift-sent tag", async () => {
  const base = await giftOfTier(LUMEN, "base");
  const res = await authorizeGiftSend(TKT.id, base.id);
  assert.equal(res.ok, true);
  const updated = await repos.tickets.findById(TKT.id);
  assert.ok(updated!.tags.some((t) => t.startsWith("gift-sent:")), "logs the gift against the ticket");
});

test("gift-send 404s an unknown ticket or gift", async () => {
  const base = await giftOfTier(LUMEN, "base");
  const noTicket = await authorizeGiftSend("tkt_does_not_exist", base.id);
  assert.equal(noTicket.ok === false && noTicket.status, 404);
  const noGift = await authorizeGiftSend(TKT.id, "gft_does_not_exist");
  assert.equal(noGift.ok === false && noGift.status, 404);
});
