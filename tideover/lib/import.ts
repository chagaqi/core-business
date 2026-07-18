import { newId, newStatusToken } from "@/lib/ids";
import { getRepositories } from "@/lib/repositories";
import { captureCohortBaseline } from "@/lib/baseline";
import { resolveDisclosedEta } from "@/lib/status-board";
import { resolveStageFromBands } from "@/lib/time";
import { DEFAULT_ORDER_VALUE_CENTS, IMPORT_ROW_CAP, normalizeRegion, type MappedRow } from "@/lib/csv";
import type { BaselineCohort, Customer, Merchant, Order } from "@/lib/types";

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
  /** rows that carried NO country column, so `region` is recorded "unknown"
   *  rather than the old fabricated "US". Surfaced so a merchant who needs to
   *  scope an announcement to one region knows how much of their file cannot be
   *  scoped, instead of discovering it when the EU container rolls. */
  regionlessRows: number;
  /** orders stamped with the merchant's promised delivery window (`disclosedEta`)
   *  — the evidence pack's best chargeback exhibit. Was 0 of 48,180 before the
   *  merchant's own promised window became the disclosure. */
  disclosedEtaStamped: number;
  /** the day-0 cohort MEASURED from this merchant's own file at the end of the
   *  import (lib/baseline.ts). Null when nothing landed. This is the "before"
   *  picture that a renewal argument is actually made against; before it, the
   *  baseline had no write path anywhere in the repository and read "Not yet
   *  measured" forever. */
  baseline: BaselineCohort | null;
  /** chunks FULLY persisted (each ≤ IMPORT_CHUNK_SIZE rows). All counts above
   *  describe persisted chunks only, so a partial failure reports exactly what
   *  landed. */
  chunksPersisted: number;
  /** 1-based index of the chunk whose persistence failed, or null when the
   *  import completed. A failed chunk may have partially persisted rows; a
   *  re-run of the same file dedupes them by importKey (idempotent resume). */
  failedAtChunk: number | null;
}

/** Region recorded when the source row carried no country column. A missing
 *  fact, stated as missing — never rounded to "US". */
export const UNKNOWN_REGION = "unknown";

export interface ImportOptions {
  /**
   * The campaign these rows belong to, when the export has no campaign column
   * (the single-campaign case). NOT guessed from the brand name: an order's
   * campaign is a cohort key that scopes real statements to real people, and a
   * wrong one is worse than none. The row's own column always wins.
   */
  defaultCampaignName?: string;
  /** Same, for the fulfillment wave. */
  defaultWave?: string;
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
  opts: ImportOptions = {},
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
  let regionlessRows = 0;
  let disclosedEtaStamped = 0;
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
    let chunkRegionless = 0;
    let chunkDisclosed = 0;

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

      // ── the cohort keys ────────────────────────────────────────────────────
      // campaignName / wave / region are the three keys that let a merchant say a
      // true thing to exactly the people it is true for. All three already
      // existed on Order and were already READ (lib/evidence.ts); no writer ever
      // set them, and region was hardcoded "US" even when the file carried the
      // country. So p04's 48%-EU file looked entirely domestic, p08 had to panic
      // three kiln cohorts to warn one, and p09's two campaigns were separable
      // only by pledge date. The row's own column always wins; the caller's
      // default fills a missing column; nothing is invented.
      const campaignName = row.campaignName ?? opts.defaultCampaignName;
      const wave = row.wave ?? opts.defaultWave;
      // Normalize again server-side. The wizard maps rows in the BROWSER
      // (lib/csv.ts, so the raw file never leaves the merchant's machine) and
      // normalizes there — but /api/import accepts a MappedRow[] over the wire,
      // so a caller that hand-rolls the POST could put a raw country in it. A
      // region is a COHORT KEY: "DE" and "EU" scoping differently would silently
      // split a cohort in half and send half of p04's EU backers nothing.
      // normalizeRegion is idempotent, so this is free for the normal path.
      const region = normalizeRegion(row.region) ?? UNKNOWN_REGION;
      if (!row.region) chunkRegionless += 1;

      // Seed the production-stage SNAPSHOT from the real elapsed wait vs the
      // merchant's own bands. This is a HINT and provenance only: every reader
      // re-derives the live stage on the way out of the repository
      // (lib/repositories/live-stage.ts), because a stage frozen at import is a
      // description of the day the merchant uploaded a file, and by day 30 it was
      // wrong on a third of everything we sent. Bands are read INCLUSIVELY and an
      // overrun wait resolves to "overrun", never a clamp to Dispatch.
      const elapsedDays = Math.max(0, Math.round((nowMs - new Date(fulfillmentStart).getTime()) / DAY_MS));
      const productionStage = resolveStageFromBands(merchant.stages, elapsedDays);
      const fulfillmentEnd = new Date(new Date(fulfillmentStart).getTime() + windowMax * DAY_MS).toISOString();

      // ── the disclosed ETA ──────────────────────────────────────────────────
      // The row's own estimate wins when the export carries one (it is the exact
      // text that buyer saw). Otherwise the merchant's own promised window IS the
      // disclosure — resolved for THIS order's cohort, so a campaign or a wave can
      // carry its own promise. This is why the field was empty on 48,180 of 48,180
      // orders: we were looking for a column that does not exist in this market,
      // when the merchant had already told us the answer at onboarding.
      const disclosure = resolveDisclosedEta(merchant, { campaignName, wave, region });
      const disclosedEta: Order["disclosedEta"] | undefined = row.disclosedEtaValue
        ? {
            value: row.disclosedEtaValue,
            source: row.etaSource ?? ("campaign-page" as const),
            disclosedAt: fulfillmentStart,
          }
        : disclosure
          ? {
              value: disclosure.value,
              source: disclosure.source,
              // When it was shown to THIS buyer: the day they paid.
              disclosedAt: fulfillmentStart,
            }
          : undefined;
      if (disclosedEta) chunkDisclosed += 1;

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
        region,
        statusToken: newStatusToken(),
        preorderEtaSource: "manual",
        importKey,
        ...(campaignName ? { campaignName } : {}),
        ...(wave ? { wave } : {}),
        ...(disclosedEta ? { disclosedEta } : {}),
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
        regionlessRows,
        disclosedEtaStamped,
        // A partial import still measured whatever landed — the merchant should
        // see the picture of the rows that made it, not a null.
        baseline: await captureCohortBaseline(merchantId, now),
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
    regionlessRows += chunkRegionless;
    disclosedEtaStamped += chunkDisclosed;
    for (const o of newOrders) if (o.importKey) persistedByImportKey.set(o.importKey, o);
    chunksPersisted = chunkIndex;
  }

  // ── the day-0 baseline ──────────────────────────────────────────────────────
  // MEASURE the cohort the merchant just handed us, and persist it. This is the
  // only write `Merchant.baseline` has ever had: it was seeded all-zeros at
  // onboarding and never written again anywhere in the repository, so
  // isBaselineMeasured was false forever and the day-0 report — the artifact a
  // merchant renews on — was an unreachable surface for every paying customer.
  const baseline = await captureCohortBaseline(merchantId, now);

  return {
    customersCreated,
    ordersCreated,
    skipped,
    datelessRows,
    unparseableMoneyRows,
    regionlessRows,
    disclosedEtaStamped,
    baseline,
    chunksPersisted,
    failedAtChunk: null,
  };
}

/**
 * Stamp the merchant's promised delivery window onto orders that carry none —
 * the backfill for every order imported before the disclosure existed. Without
 * it, `disclosedEta` stays undefined on the whole historical file and the
 * evidence pack still cannot produce its best exhibit for the customers who are
 * already disputing.
 *
 * Never overwrites an existing disclosure (the buyer saw what the buyer saw), and
 * resolves per-order so a campaign/wave override lands on the right cohort.
 * Returns how many orders it stamped.
 */
export async function backfillDisclosedEta(
  merchantId: string,
  merchantOverride?: Merchant,
): Promise<number> {
  const repos = getRepositories();
  const merchant = merchantOverride ?? (await repos.merchants.findById(merchantId));
  if (!merchant) throw new Error("unknown merchant");
  if (!merchant.disclosedEtas?.length) return 0;

  const orders = await repos.orders.listByMerchant(merchantId);
  let stamped = 0;
  for (const order of orders) {
    if (order.disclosedEta) continue;
    const disclosure = resolveDisclosedEta(merchant, {
      campaignName: order.campaignName,
      wave: order.wave,
      region: order.region,
    });
    if (!disclosure) continue;
    await repos.orders.update(order.id, {
      disclosedEta: {
        value: disclosure.value,
        source: disclosure.source,
        disclosedAt: order.fulfillmentStart,
      },
    });
    stamped += 1;
  }
  return stamped;
}
