import { newId, newStatusToken } from "@/lib/ids";
import { getRepositories } from "@/lib/repositories";
import { DEFAULT_ORDER_VALUE_CENTS, type MappedRow } from "@/lib/csv";
import type { Customer, Order, ProductionStageKey, StageDef } from "@/lib/types";

/**
 * Backer-list import (ADR-0010, Rung 0). Turns the mapped rows from a merchant's
 * own Kickstarter/BackerKit export into customers + orders. The raw file was
 * parsed client-side; only the structured `MappedRow[]` reaches here.
 *
 * Proof-only: every field is the merchant's own data — nothing is fabricated.
 * `disclosedEta` is captured ONLY when the source row carried an estimate; it is
 * never synthesized, and no hard delivery date is invented (the value stays the
 * merchant's own human band, e.g. "weeks 9–11").
 */

const DAY_MS = 86_400_000;

/** Hard cap per request so a giant export can't stall the route. */
export const IMPORT_ROW_CAP = 2000;

export interface ImportResult {
  customersCreated: number;
  ordersCreated: number;
  skipped: number;
  /** rows that carried NO parseable order/pledge date, so `fulfillmentStart` /
   *  `createdAt` fell back to import time. Surfaced (not silent) so the merchant
   *  knows their wait math is anchored to now() for these rows, not real dates. */
  datelessRows: number;
  /** rows with no parseable pledge amount, defaulted to DEFAULT_ORDER_VALUE_CENTS.
   *  Surfaced so the $50 floor feeding LTV/gift math isn't a silent fiction. */
  unparseableMoneyRows: number;
}

/**
 * Derive an order's INITIAL production stage from how long the backer has
 * already been waiting (import time − real pledge date) against the merchant's
 * stage day-bands. A data-layer computation kept OUT of the engine (ADR-0006):
 * the engine still just reads `order.productionStage`; we only seed a truthful
 * starting value instead of the old hardcoded "production".
 *
 * KNOWN LIMITATION (follow-up): this is a point-in-time snapshot taken at import.
 * Nothing advances it as real days pass, so it goes stale — a scheduled
 * re-derivation (or deriving stage on read) is a separate task.
 */
function deriveInitialStage(stages: StageDef[], elapsedDays: number): ProductionStageKey {
  // No configured stages → preserve the historical default rather than crash.
  if (stages.length === 0) return "production";
  const d = Math.max(0, elapsedDays);
  // Half-open [from, to) bands are contiguous in the seeded merchant config.
  for (const s of stages) {
    if (d >= s.dayBand.from && d < s.dayBand.to) return s.key;
  }
  // Past every band → the latest stage (highest ceiling); before all → the first.
  const latest = stages.reduce((a, b) => (b.dayBand.to > a.dayBand.to ? b : a));
  if (d >= latest.dayBand.to) return latest.key;
  return stages[0].key;
}

export async function importBackerRows(
  merchantId: string,
  rows: MappedRow[],
  now: Date = new Date(),
): Promise<ImportResult> {
  const repos = getRepositories();
  const merchant = await repos.merchants.findById(merchantId);
  if (!merchant) throw new Error("unknown merchant");

  const nowIso = now.toISOString();
  const nowMs = now.getTime();
  const windowMax = Math.max(1, merchant.fulfillmentWindowDays.max);

  let customersCreated = 0;
  let ordersCreated = 0;
  let skipped = 0;
  let datelessRows = 0;
  let unparseableMoneyRows = 0;

  // Order-level idempotency (ADR-0010): a re-import must not duplicate orders.
  // We dedupe on `importKey` — the source row's own id when the export carries
  // one, otherwise a SYNTHESIZED stable key (see below). Covers both an intra-run
  // repeat and a cross-session re-import (an existing customer's prior imported
  // order keys are loaded lazily, once).
  const seenImportKeys = new Set<string>();
  const loadedCustomers = new Set<string>();

  for (const row of rows.slice(0, IMPORT_ROW_CAP)) {
    const email = (row.email ?? "").trim();
    if (!email) {
      // A row with no email can't be a customer — skip it gracefully.
      skipped += 1;
      continue;
    }

    // Pledge value. Keep the $50 floor ONLY as a last resort, but COUNT the
    // fallback so the merchant sees how many rows are running on a placeholder.
    const orderValueCents = row.orderValueCents ?? DEFAULT_ORDER_VALUE_CENTS;
    if (row.orderValueCents === undefined) unparseableMoneyRows += 1;

    // The REAL pledge/order date anchors the whole wait (days-in-wait, stage,
    // confidence, overdue, dispute window). Fall back to import time ONLY when
    // the row carried no parseable date — and count that fallback, not silent.
    const fulfillmentStart = row.orderDate ?? nowIso;
    if (!row.orderDate) datelessRows += 1;

    // Dedupe key: the source id when present; otherwise a stable synthetic key
    // from (merchant, email, value, pledge-date) so re-uploading an id-less
    // export can't duplicate the backer list. Uses the PARSED date (not the
    // now() fallback) so the key stays stable across re-imports.
    const importKey = row.sourceKey
      ? `${merchantId}:${row.sourceKey}`
      : `${merchantId}:syn:${email.toLowerCase()}:${orderValueCents}:${row.orderDate ?? ""}`;

    // Dedupe by (merchantId, email): reuse an existing customer, else create one.
    let customer = await repos.customers.findByEmail(merchantId, email);
    const isNewCustomer = !customer;

    // Load an existing customer's prior imported keys once, for cross-session
    // dedupe. (A customer created earlier THIS run is also "existing" here.)
    if (!isNewCustomer && customer && !loadedCustomers.has(customer.id)) {
      const existing = await repos.orders.listByCustomer(customer.id);
      for (const o of existing) if (o.importKey) seenImportKeys.add(o.importKey);
      loadedCustomers.add(customer.id);
    }
    if (seenImportKeys.has(importKey)) {
      // This exact order was already imported — skip, don't duplicate.
      skipped += 1;
      continue;
    }
    seenImportKeys.add(importKey);

    // Create the customer only AFTER the dedupe check, so a deduped row never
    // leaves an orphan customer behind. LTV seeds from this first order's value.
    if (!customer) {
      const created: Customer = {
        id: newId("cus"),
        merchantId,
        email,
        firstName: row.firstName?.trim() || email.split("@")[0],
        // ltvCents accumulates pledge value across a backer's orders (below).
        ltvCents: orderValueCents,
        orderIds: [],
        ticketCount: 0,
        lastSentiment: "calm",
      };
      await repos.customers.create(created);
      customer = created;
      customersCreated += 1;
    }

    // Seed the INITIAL production stage from the real elapsed wait vs the
    // merchant's stage day-bands (data-layer only; the engine is untouched).
    const elapsedDays = Math.max(0, Math.round((nowMs - new Date(fulfillmentStart).getTime()) / DAY_MS));
    const productionStage = deriveInitialStage(merchant.stages, elapsedDays);
    const fulfillmentEnd = new Date(new Date(fulfillmentStart).getTime() + windowMax * DAY_MS).toISOString();

    const order: Order = {
      id: newId("ord"),
      merchantId,
      customerId: customer.id,
      // ADR-0010: a Kickstarter import defaults to ks-backer unless the reward
      // tier clearly indicated another group.
      group: row.group ?? "ks-backer",
      orderValueCents,
      createdAt: fulfillmentStart,
      fulfillmentStart,
      fulfillmentEnd,
      productionStage,
      region: "US",
      statusToken: newStatusToken(),
      preorderEtaSource: "manual",
      importKey,
      // Capture the disclosed ETA ONLY when the source row carried one; never
      // synthesize a band or a hard date (proof-only guardrail). The source
      // label follows the export (KS = campaign page, BackerKit = checkout).
      // disclosedAt is the pledge date — when the estimate was shown at purchase.
      ...(row.disclosedEtaValue
        ? {
            disclosedEta: {
              value: row.disclosedEtaValue,
              source: row.etaSource ?? ("campaign-page" as const),
              disclosedAt: fulfillmentStart,
            },
          }
        : {}),
    };
    await repos.orders.create(order);
    ordersCreated += 1;

    // Link the order onto the customer. For an EXISTING customer gaining another
    // order, also accumulate the pledge value into LTV (a new customer already
    // seeded its LTV from this order above, so don't double-count).
    const patch: Partial<Customer> = { orderIds: [...customer.orderIds, order.id] };
    if (!isNewCustomer) patch.ltvCents = customer.ltvCents + orderValueCents;
    await repos.customers.update(customer.id, patch);
  }

  return { customersCreated, ordersCreated, skipped, datelessRows, unparseableMoneyRows };
}
