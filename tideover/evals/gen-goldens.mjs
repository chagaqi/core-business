/**
 * Golden GENERATOR (ADR-0006, task OS4).
 *
 * Snapshots the CURRENT computeTicketIntelligence output for the real seed
 * tickets into evals/golden/goldens.json. Each fixture stores the input refs
 * (ids + frozen `now` + ticketsLast7d) and an `expected` block of the stable,
 * meaningful fields plus a few must-contain / must-not-contain draft substrings.
 *
 * ── REGRESSION TRIPWIRE, NOT A CORRECTNESS ORACLE ──────────────────────────
 * gen-goldens captures whatever the engines do TODAY, so committing it blindly
 * would enshrine any current bug as "the spec." Therefore every fixture's
 * expected block carries "reviewed": false until Dylan reviews them once (task
 * D9) and flips them to true. Until then goldens still catch unintended output
 * drift, but are NOT claimed as verified-correct. A golden diff in a PR requires
 * an explicit engine-change / playbook-change acknowledgement + regeneration —
 * never an auto-snapshot to turn a red test green.
 *
 * Run: npm run gen-goldens
 */
import { writeFileSync, mkdirSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { computeTicketIntelligence } from "@/lib/engines/index";
import { loadSeed, catalogFor } from "./_shared.mjs";

const HERE = dirname(fileURLToPath(import.meta.url));
const OUT_DIR = join(HERE, "golden");
const OUT_FILE = join(OUT_DIR, "goldens.json");

// A fixed, deterministic clock so snapshots are reproducible regardless of the
// wall clock. Chosen near the seed's own timestamps to give a realistic spread
// of daysInWait (early-stage through overdue) across the seed tickets.
const FROZEN_NOW = "2026-07-03T12:00:00.000Z";

const seed = loadSeed();

// ticketsLast7d per customer = how many seed tickets that customer has. Stable
// and meaningful (feeds the risk velocity factor).
const ticketsByCustomer = new Map();
for (const t of seed.tickets) {
  ticketsByCustomer.set(t.customerId, (ticketsByCustomer.get(t.customerId) ?? 0) + 1);
}

const fixtures = [];
for (const ticket of seed.tickets) {
  const order = seed.byOrder.get(ticket.orderId);
  const customer = seed.byCustomer.get(ticket.customerId);
  const merchant = seed.byMerchant.get(ticket.merchantId);
  if (!order || !customer || !merchant) continue; // seed-check guarantees FKs; skip defensively.

  const catalog = catalogFor(merchant, seed.gifts);
  const ticketsLast7d = ticketsByCustomer.get(customer.id) ?? 0;
  const now = new Date(FROZEN_NOW);

  const { risk, reassurance, gift } = computeTicketIntelligence({
    ticket,
    order,
    customer,
    merchant,
    catalog,
    ticketsLast7d,
    now,
  });

  fixtures.push({
    id: `gld_${ticket.id}`,
    input: {
      ticketId: ticket.id,
      orderId: order.id,
      customerId: customer.id,
      merchantId: merchant.id,
      sentiment: ticket.sentiment,
      ticketsLast7d,
      now: FROZEN_NOW,
    },
    expected: {
      // Regression tripwire only — NOT verified-correct until task D9 review.
      reviewed: false,
      stageKey: reassurance.stageKey,
      overdue: reassurance.overdue,
      priority: reassurance.priority,
      // bucket, not the raw score, so trivial score drift doesn't churn goldens.
      riskBand: risk.band,
      topDriver: risk.topDriver,
      giftId: gift.gift ? gift.gift.id : null,
      // stable draft substrings: first name always merges in; braces never remain.
      mustContain: [customer.firstName],
      mustNotContain: ["{", "}"],
    },
  });
}

mkdirSync(OUT_DIR, { recursive: true });
writeFileSync(OUT_FILE, JSON.stringify(fixtures, null, 2) + "\n", "utf8");

const reviewed = fixtures.filter((f) => f.expected.reviewed).length;
console.log(
  `✓ wrote ${fixtures.length} golden fixtures → evals/golden/goldens.json ` +
    `(${reviewed} reviewed, ${fixtures.length - reviewed} pending D9 review). ` +
    `frozen now=${FROZEN_NOW}`,
);
