import { newId, newStatusToken } from "@/lib/ids";
import { getRepositories } from "@/lib/repositories";
import { DEFAULT_ORDER_VALUE_CENTS, IMPORT_ROW_CAP, type MappedRow } from "@/lib/csv";
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
 *
 * Scale (the ICP ships 5k–50k backers): rows persist in chunks of
 * IMPORT_CHUNK_SIZE through the repos' bulk methods, so neither driver builds
 * one giant array operation. The email + importKey dedupe maps span the WHOLE
 * import (preloaded once, then maintained across chunks), and a re-run of the
 * same file after a mid-import failure is idempotent: already-persisted rows
 * are skipped by importKey, and any order left unlinked by the failure (order
 * inserted, customer patch never ran) is re-linked, never duplicated.
 */

const DAY_MS = 86_400_000;

// The cap LIVES in lib/csv.ts (client-safe, so the wizard enforces the same
// number without pulling server deps); re-exported here for the server-side
// callers that historically import it from this module.
export { IMPORT_ROW_CAP };

/**
 * Rows persisted per repository write. Small enough that neither driver builds
 * a giant single array op (Mongo insertMany per chunk, JSON store pushes), big
 * enough that a 50k import is ~100 round-trips, not 50k.
 */
export const IMPORT_CHUNK_SIZE = 500;

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
  /** chunks FULLY persisted (each ≤ IMPORT_CHUNK_SIZE rows). All counts above
   *  describe persisted chunks only, so a partial failure reports exactly what
   *  landed. */
  chunksPersisted: number;
  /** 1-based index of the chunk whose persistence failed, or null when the
   *  import completed. A failed chunk may have partially persisted rows; a
   *  re-run of the same file dedupes them by importKey (idempotent resume). */
  failedAtChunk: number | null;
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

/** Per-customer link work accumulated within one chunk: the order ids to append
 *  and the LTV to add, written as ONE update per customer per chunk. */
interface LinkPatch {
  customer: Customer;
  addOrderIds: string[];
  addLtv: number;
}

function linkPatchFor(map: Map<string, LinkPatch>, customer: Customer): LinkPatch {
  let p = map.get(customer.id);
  if (!p) {
    p = { customer, addOrderIds: [], addLtv: 0 };
    map.set(customer.id, p);
  }
  return p;
}

export async function importBackerRows(
  merchantId: string,
  rows: MappedRow[],
  now: Date = new Date(),
): Promise<ImportResult> {
  if (rows.length > IMPORT_ROW_CAP) {
    throw new Error(
      `import exceeds the ${IMPORT_ROW_CAP.toLocaleString("en-US")}-row cap ` +
        `(got ${rows.length.toLocaleString("en-US")}). Split the file and import each part; ` +
        `already-imported rows are skipped, never duplicated.`,
    );
  }

  const repos = getRepositories();
  const merchant = await repos.merchants.findById(merchantId);
  if (!merchant) throw new Error("unknown merchant");

  const nowIso = now.toISOString();
  const nowMs = now.getTime();
  const windowMax = Math.max(1, merchant.fulfillmentWindowDays.max);

  // ── preload the dedupe state ONCE, spanning every chunk ────────────────────
  // Customer dedupe by (merchantId, lowercased email): working copies so LTV /
  // orderIds accumulate across chunks without re-reading per row (the old
  // per-row findByEmail was O(rows × customers) on Mongo).
  const customersByEmail = new Map<string, Customer>();
  for (const c of await repos.customers.listByMerchant(merchantId)) {
    customersByEmail.set(c.email.toLowerCase(), { ...c, orderIds: [...c.orderIds] });
  }
  // Order-level idempotency (ADR-0010): a re-import must not duplicate orders.
  // Dedupe on `importKey` — the source row's own id when the export carries one,
  // otherwise a SYNTHESIZED stable key. Preloaded from the merchant's existing
  // orders (one read; the write side is what must stay chunked) so the set
  // spans intra-run repeats AND cross-session re-imports.
  const seenImportKeys = new Set<string>();
  const persistedByImportKey = new Map<string, Order>();
  for (const o of await repos.orders.listByMerchant(merchantId)) {
    if (o.importKey) {
      seenImportKeys.add(o.importKey);
      persistedByImportKey.set(o.importKey, o);
    }
  }

  let customersCreated = 0;
  let ordersCreated = 0;
  let skipped = 0;
  let datelessRows = 0;
  let unparseableMoneyRows = 0;
  let chunksPersisted = 0;

  for (let start = 0; start < rows.length; start += IMPORT_CHUNK_SIZE) {
    const chunkIndex = chunksPersisted + 1;
    const chunk = rows.slice(start, start + IMPORT_CHUNK_SIZE);

    const newCustomers: Customer[] = [];
    const newOrders: Order[] = [];
    const linkPatches = new Map<string, LinkPatch>();
    let chunkSkipped = 0;
    let chunkDateless = 0;
    let chunkNoMoney = 0;

    for (const row of chunk) {
      const email = (row.email ?? "").trim();
      if (!email) {
        // A row with no email can't be a customer — skip it gracefully.
        chunkSkipped += 1;
        continue;
      }

      // Pledge value. Keep the $50 floor ONLY as a last resort, but COUNT the
      // fallback so the merchant sees how many rows are running on a placeholder.
      const orderValueCents = row.orderValueCents ?? DEFAULT_ORDER_VALUE_CENTS;
      if (row.orderValueCents === undefined) chunkNoMoney += 1;

      // The REAL pledge/order date anchors the whole wait (days-in-wait, stage,
      // confidence, overdue, dispute window). Fall back to import time ONLY when
      // the row carried no parseable date — and count that fallback, not silent.
      const fulfillmentStart = row.orderDate ?? nowIso;
      if (!row.orderDate) chunkDateless += 1;

      // Dedupe key: the source id when present; otherwise a stable synthetic key
      // from (merchant, email, value, pledge-date) so re-uploading an id-less
      // export can't duplicate the backer list. Uses the PARSED date (not the
      // now() fallback) so the key stays stable across re-imports.
      const importKey = row.sourceKey
        ? `${merchantId}:${row.sourceKey}`
        : `${merchantId}:syn:${email.toLowerCase()}:${orderValueCents}:${row.orderDate ?? ""}`;

      const emailKey = email.toLowerCase();
      let customer = customersByEmail.get(emailKey);

      if (seenImportKeys.has(importKey)) {
        // This exact order was already imported — skip, don't duplicate.
        chunkSkipped += 1;
        // Idempotent-resume repair: a prior run may have PERSISTED this order but
        // died before the customer link patch ran. If the persisted order isn't
        // on its customer yet, queue the link (orderIds + LTV) exactly once.
        // (Customers persist BEFORE orders within a chunk, so a persisted order
        // implies its customer exists; the working copy tracks in-run links, so
        // an already-linked order is never re-added or double-counted.)
        const persisted = persistedByImportKey.get(importKey);
        if (persisted && customer && !customer.orderIds.includes(persisted.id)) {
          const p = linkPatchFor(linkPatches, customer);
          if (!p.addOrderIds.includes(persisted.id)) {
            p.addOrderIds.push(persisted.id);
            p.addLtv += persisted.orderValueCents;
          }
        }
        continue;
      }
      seenImportKeys.add(importKey);

      if (!customer) {
        // A new customer is created with ltvCents 0 and no orders; its LTV and
        // orderIds accumulate through the SAME per-chunk link patch as every
        // other order, so a re-run after a partial failure can never seed the
        // value twice (resume-safety over the old "seed LTV at create").
        customer = {
          id: newId("cus"),
          merchantId,
          email,
          firstName: row.firstName?.trim() || email.split("@")[0],
          ltvCents: 0,
          orderIds: [],
          ticketCount: 0,
          lastSentiment: "calm",
        };
        customersByEmail.set(emailKey, customer);
        newCustomers.push(customer); // counted at flush, only if the chunk lands
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
      newOrders.push(order);

      const p = linkPatchFor(linkPatches, customer);
      p.addOrderIds.push(order.id);
      p.addLtv += orderValueCents;
    }

    // ── persist the chunk: customers → orders → link patches ────────────────
    // This write ORDER is the partial-failure story: customers before orders
    // means a persisted order always has its customer; link patches last means
    // a crash leaves at worst an unlinked order, which the repair path above
    // re-links on the next run of the same file.
    try {
      await repos.customers.createMany(newCustomers);
      await repos.orders.createMany(newOrders);
      for (const { customer, addOrderIds, addLtv } of linkPatches.values()) {
        customer.orderIds = [...customer.orderIds, ...addOrderIds];
        customer.ltvCents += addLtv;
        await repos.customers.update(customer.id, {
          orderIds: customer.orderIds,
          ltvCents: customer.ltvCents,
        });
      }
    } catch {
      // Deterministic partial failure: report exactly the chunks that fully
      // persisted and where it stopped. The failed chunk may hold partial
      // writes; a RE-RUN of the same file skips them by importKey and re-links
      // any orphaned orders (proven in lib/__tests__/import-scale.test.ts).
      return {
        customersCreated,
        ordersCreated,
        skipped,
        datelessRows,
        unparseableMoneyRows,
        chunksPersisted,
        failedAtChunk: chunkIndex,
      };
    }

    // The chunk landed — fold its counts in and mark its orders as persisted so
    // a later duplicate row in THIS run resolves against them too.
    customersCreated += newCustomers.length;
    ordersCreated += newOrders.length;
    skipped += chunkSkipped;
    datelessRows += chunkDateless;
    unparseableMoneyRows += chunkNoMoney;
    for (const o of newOrders) if (o.importKey) persistedByImportKey.set(o.importKey, o);
    chunksPersisted = chunkIndex;
  }

  return {
    customersCreated,
    ordersCreated,
    skipped,
    datelessRows,
    unparseableMoneyRows,
    chunksPersisted,
    failedAtChunk: null,
  };
}
