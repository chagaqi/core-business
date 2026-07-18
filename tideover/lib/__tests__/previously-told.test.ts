import assert from "node:assert/strict";
import { test } from "node:test";
import { getPreviouslyTold } from "@/lib/service";
import { getRepositories } from "@/lib/repositories";
import type { Ticket } from "@/lib/types";

// Isolated synthetic merchant/customer so these inserts never collide with the
// seed. getPreviouslyTold filters by merchantId+customerId, so this pair is a
// private sandbox in the shared in-memory store.
const M = "mch_c3test";
const C = "cus_c3test";

function mk(over: Partial<Ticket> & { id: string; status: Ticket["status"] }): Ticket {
  return {
    merchantId: M,
    customerId: C,
    orderId: "ord_c3test",
    channel: "gorgias",
    externalId: null,
    subject: "checking in",
    body: "any update?",
    type: "wismo",
    sentiment: "calm",
    createdAt: "2026-06-20T00:00:00.000Z",
    firstResponseSec: null,
    tags: [],
    ...over,
  };
}

// Two prior sent replies (with stamped draft bands), one drafted (never sent),
// and the open ticket currently being handled — all for the same customer.
async function seedSandbox() {
  const repos = getRepositories();
  await repos.tickets.create(
    mk({
      id: "tkt_c3_sent_old",
      status: "sent",
      draft: {
        id: "drf_old",
        text: "old draft",
        confidenceBand: "ships in weeks 10–12",
        priority: "normal",
        draftedBy: "deterministic",
        riskScore: 40,
        recommendedGiftId: null,
        createdAt: "2026-06-21T00:00:00.000Z",
      },
      sent: {
        text: "You're in production now — I'll flag the moment it ships.",
        approvedBy: "Dylan",
        sentAt: "2026-06-22T00:00:00.000Z",
        externalId: "c3_old",
      },
    }),
  );
  await repos.tickets.create(
    mk({
      id: "tkt_c3_sent_new",
      status: "sent",
      draft: {
        id: "drf_new",
        text: "new draft",
        confidenceBand: "ships in weeks 7–9",
        priority: "normal",
        draftedBy: "deterministic",
        riskScore: 35,
        recommendedGiftId: null,
        createdAt: "2026-06-27T00:00:00.000Z",
      },
      sent: {
        text: "Good news — it's cleared QC and moves to freight next.",
        approvedBy: "Dylan",
        sentAt: "2026-06-28T00:00:00.000Z",
        externalId: "c3_new",
      },
    }),
  );
  // A drafted-but-never-sent ticket must be ignored (no sent.text).
  await repos.tickets.create(mk({ id: "tkt_c3_drafted", status: "drafted" }));
  // The open ticket the operator is handling right now.
  await repos.tickets.create(mk({ id: "tkt_c3_open", status: "open" }));
}

test("returns the latest prior sent reply, with its quoted band", async () => {
  await seedSandbox();
  const prior = await getPreviouslyTold(M, C, "tkt_c3_open");
  assert.ok(prior, "a prior sent reply exists");
  assert.equal(prior!.ticketId, "tkt_c3_sent_new");
  assert.equal(prior!.text, "Good news — it's cleared QC and moves to freight next.");
  assert.equal(prior!.sentAt, "2026-06-28T00:00:00.000Z");
  assert.equal(prior!.band, "ships in weeks 7–9");
});

test("excludes the current ticket (never quotes itself)", async () => {
  // Handling the newest sent ticket itself → falls back to the older sent reply.
  const prior = await getPreviouslyTold(M, C, "tkt_c3_sent_new");
  assert.ok(prior);
  assert.equal(prior!.ticketId, "tkt_c3_sent_old");
  assert.equal(prior!.band, "ships in weeks 10–12");
});

test("excludes non-sent tickets", async () => {
  const repos = getRepositories();
  // A customer whose only tickets are open/drafted has nothing previously told.
  await repos.tickets.create(
    mk({ id: "tkt_c3_only_open", customerId: "cus_c3open", status: "open" }),
  );
  await repos.tickets.create(
    mk({ id: "tkt_c3_only_drafted", customerId: "cus_c3open", status: "drafted" }),
  );
  const prior = await getPreviouslyTold(M, "cus_c3open", "tkt_c3_only_open");
  assert.equal(prior, null);
});

test("returns null when the customer has no tickets at all (first contact)", async () => {
  const prior = await getPreviouslyTold(M, "cus_c3nobody", "tkt_whatever");
  assert.equal(prior, null);
});

test("a RESOLVED ticket that carried a sent reply still counts (told is told)", async () => {
  const repos = getRepositories();
  // A ticket that has since moved to "resolved" but carries a delivered reply —
  // the customer was still told it, so it must surface (keyed on sent.text, not status).
  await repos.tickets.create(
    mk({
      id: "tkt_c3_resolved",
      customerId: "cus_c3resolved",
      status: "resolved",
      sent: {
        text: "Shipped and on its way — tracking is in your inbox.",
        approvedBy: "Dylan",
        sentAt: "2026-06-29T00:00:00.000Z",
        externalId: "c3_resolved",
      },
    }),
  );
  await repos.tickets.create(
    mk({ id: "tkt_c3_resolved_open", customerId: "cus_c3resolved", status: "open" }),
  );
  const prior = await getPreviouslyTold(M, "cus_c3resolved", "tkt_c3_resolved_open");
  assert.ok(prior, "a resolved-with-sent reply is previously told");
  assert.equal(prior!.ticketId, "tkt_c3_resolved");
});

test("`now` bounds the search — a reply sent after now is not yet 'previously told'", async () => {
  // As of just before the older reply, the newer reply hasn't been sent yet, and
  // neither reply predates this instant → nothing previously told.
  const before = await getPreviouslyTold(M, C, "tkt_c3_open", new Date("2026-06-21T00:00:00.000Z"));
  assert.equal(before, null);
  // As of between the two sends, only the older one counts.
  const between = await getPreviouslyTold(M, C, "tkt_c3_open", new Date("2026-06-25T00:00:00.000Z"));
  assert.equal(between!.ticketId, "tkt_c3_sent_old");
});

test("works on real seed data — Mara has a prior sent reply (band unstamped in seed)", async () => {
  // cus_p9l4ma3fgp2e (Mara) has multiple open tickets plus prior sent replies;
  // the most recent sent is tkt_mt0r81wobqx9 (sentAt 2026-07-01). Seed sent
  // tickets carry no draft, so band is null — the strip shows the text alone.
  const prior = await getPreviouslyTold("mch_lumen0001", "cus_p9l4ma3fgp2e", "tkt_jsh1jesewrlu");
  assert.ok(prior, "Mara has a prior sent reply on file");
  assert.equal(prior!.ticketId, "tkt_mt0r81wobqx9");
  assert.equal(prior!.text, "(approved day-stage reassurance reply)");
  assert.equal(prior!.sentAt, "2026-07-01T03:40:56.001Z");
  assert.equal(prior!.band, null);
});
