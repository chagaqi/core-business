import assert from "node:assert/strict";
import { test } from "node:test";
import {
  buildCommLog,
  computeDisputeWindow,
  parseBandDays,
  CAP_FROM_TXN_DAYS,
  RC131_WINDOW_DAYS,
} from "@/lib/evidence";
import type { Ticket } from "@/lib/types";

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
      sent: { text: "reply sent", approvedBy: "Chaga", sentAt: "2026-06-03T00:00:00.000Z", externalId: "m1" },
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
  assert.equal(log[2].actor, "Chaga (operator)");
  assert.equal(log[2].statusLabel, "sent");
});
