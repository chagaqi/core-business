import { newId, newStatusToken } from "@/lib/ids";
import { getRepositories } from "@/lib/repositories";
import { DEFAULT_ORDER_VALUE_CENTS, type MappedRow } from "@/lib/csv";
import type { Customer, Order } from "@/lib/types";

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
  const windowMax = Math.max(1, merchant.fulfillmentWindowDays.max);
  const fulfillmentEnd = new Date(now.getTime() + windowMax * DAY_MS).toISOString();

  let customersCreated = 0;
  let ordersCreated = 0;
  let skipped = 0;

  // Order-level idempotency (ADR-0010): a re-import must not duplicate orders.
  // We dedupe on the source row's own id (importKey), covering both an intra-run
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

    // Dedupe by (merchantId, email): reuse an existing customer, else create one.
    let customer = await repos.customers.findByEmail(merchantId, email);
    const isNewCustomer = !customer;
    if (!customer) {
      const created: Customer = {
        id: newId("cus"),
        merchantId,
        email,
        firstName: row.firstName?.trim() || email.split("@")[0],
        ltvCents: row.orderValueCents ?? DEFAULT_ORDER_VALUE_CENTS,
        orderIds: [],
        ticketCount: 0,
        lastSentiment: "calm",
      };
      await repos.customers.create(created);
      customer = created;
      customersCreated += 1;
    }

    const importKey = row.sourceKey ? `${merchantId}:${row.sourceKey}` : undefined;
    if (importKey) {
      if (!isNewCustomer && !loadedCustomers.has(customer.id)) {
        const existing = await repos.orders.listByCustomer(customer.id);
        for (const o of existing) if (o.importKey) seenImportKeys.add(o.importKey);
        loadedCustomers.add(customer.id);
      }
      if (seenImportKeys.has(importKey)) {
        // This exact source order was already imported — skip, don't duplicate.
        skipped += 1;
        continue;
      }
      seenImportKeys.add(importKey);
    }

    const order: Order = {
      id: newId("ord"),
      merchantId,
      customerId: customer.id,
      // ADR-0010: a Kickstarter import defaults to ks-backer unless the reward
      // tier clearly indicated another group.
      group: row.group ?? "ks-backer",
      orderValueCents: row.orderValueCents ?? DEFAULT_ORDER_VALUE_CENTS,
      createdAt: nowIso,
      fulfillmentStart: nowIso,
      fulfillmentEnd,
      productionStage: "production",
      region: "US",
      statusToken: newStatusToken(),
      preorderEtaSource: "manual",
      ...(importKey ? { importKey } : {}),
      // Capture the disclosed ETA ONLY when the source row carried one; never
      // synthesize a band or a hard date (proof-only guardrail). The source
      // label follows the export (KS = campaign page, BackerKit = checkout).
      ...(row.disclosedEtaValue
        ? {
            disclosedEta: {
              value: row.disclosedEtaValue,
              source: row.etaSource ?? ("campaign-page" as const),
              disclosedAt: nowIso,
            },
          }
        : {}),
    };
    await repos.orders.create(order);
    ordersCreated += 1;

    // Link the order onto the customer (re-read via the seam kept it current).
    await repos.customers.update(customer.id, {
      orderIds: [...customer.orderIds, order.id],
    });
  }

  return { customersCreated, ordersCreated, skipped };
}
