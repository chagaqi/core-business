import { resolveStageFromBands, daysInWait } from "@/lib/time";
import { resolveStatusFor } from "@/lib/status-board";
import type { Merchant, Order, ProductionStatusEntry } from "@/lib/types";
import type { OrderRepository, Repositories } from "@/lib/repositories/types";

/**
 * THE READ SEAM — where "derive, don't freeze" actually happens.
 *
 * THE BUG THIS KILLS. `Order.productionStage` used to be a value stamped once, at
 * CSV import, that nothing ever advanced. Every status page and every draft
 * described where the order was ON THE DAY THE MERCHANT UPLOADED THEIR FILE. By
 * day 30 of the ten-merchant run, 36% of the replies we SENT stated the wrong
 * physical fact about the customer's own order, in the merchant's voice, over
 * their signature — and the two worst arms of it were arithmetic:
 *
 *   - the half-open band read, which dropped any wait landing exactly on a
 *     boundary into stages[0] (28 of p01's backers, 52-82 days in, told the paper
 *     for their book was still being sourced);
 *   - the overrun clamp, which pushed anything past the last band to the stage
 *     with the highest ceiling — always Dispatch (~4,758 of p10's 9,000 backers
 *     told their CNC machine was "out of your regional warehouse", when not one
 *     unit had been built; one of them had already written "I am building a case").
 *
 * THE FIX. The stage is a PURE FUNCTION of (days-in-wait, the merchant's own
 * bands, the merchant's own current status). So it is computed on the way OUT of
 * the repository, every time, and every consumer — the reassurance engine, the
 * LLM drafter, the status page, the risk score, the evidence pack — reads the
 * truth with zero call-site changes. Resolution order:
 *
 *   1. THE STATUS BOARD. If the merchant has posted a status that scopes to this
 *      order, that is what is happening. A human said so today. (stageSource:
 *      "status-board")
 *   2. THE BANDS, read INCLUSIVELY. (stageSource: "band")
 *   3. OVERRUN. Past every band with nothing posted: we claim nothing.
 *      (stageSource: "overrun")
 *
 * WHAT IS PERSISTED is still the import-time snapshot — kept deliberately, as a
 * HINT: it is the provenance of what we first believed, and the slot a future
 * source that genuinely knows a per-order stage (a 3PL scan, a per-unit serial)
 * would write to. It is never trusted as truth on read, and this wrapper STRIPS
 * the projected `stageSource` from every write so a resolved read can never be
 * saved back as if it were stored fact.
 *
 * Applied in lib/repositories/index.ts, symmetric to withTenantScope, so BOTH
 * drivers get identical behavior and no call site knows it is here.
 */

/**
 * THE READ CLOCK. Deriving a stage means asking "how long has this person been
 * waiting", which means asking what time it is — so the seam has a clock, and the
 * clock is INJECTABLE.
 *
 * That is not a test affordance bolted on: the ten-merchant harness had to
 * monkey-patch the global `Date` to exercise the product's core arithmetic at
 * all, because nothing in the data layer would accept a `now`. A clock you cannot
 * set is a system you cannot replay, backfill, or deterministically test — and
 * the arithmetic being tested here is the arithmetic that told a third of a
 * merchant's customers the wrong thing about their own order.
 *
 * Production never touches this. `setLiveStageClock(null)` restores wall time.
 */
let readClock: () => Date = () => new Date();

export function setLiveStageClock(clock: (() => Date) | null): void {
  readClock = clock ?? (() => new Date());
}

/** Resolve one order against an already-loaded merchant + status history. Pure. */
export function withLiveStageFor(
  order: Order,
  merchant: Merchant | null,
  statuses: ProductionStatusEntry[],
  now: Date = new Date(),
): Order {
  // No merchant (deleted, or a tenant-scoped read that dead-ended): we cannot
  // derive anything, so we hand back the stored snapshot untouched rather than
  // guess. Marked as such — a reader can see the claim is not live.
  if (!merchant) return { ...order, stageSource: "band" };

  const status = resolveStatusFor(statuses, order);
  if (status) {
    return { ...order, productionStage: status.stageKey, stageSource: "status-board" };
  }

  const elapsed = daysInWait(order, now);
  const stage = resolveStageFromBands(merchant.stages, elapsed);
  return {
    ...order,
    productionStage: stage,
    stageSource: stage === "overrun" ? "overrun" : "band",
  };
}

/** The projected field never goes back to disk. */
function stripProjected<T extends object>(o: T): T {
  const copy = { ...o } as T & { stageSource?: unknown };
  delete copy.stageSource;
  return copy;
}

function liveOrders(base: OrderRepository, repos: Repositories): OrderRepository {
  // One merchant + one status-history read per repository CALL (not per order),
  // memoized for the duration of that call — so listByMerchant(48,180 orders)
  // costs exactly two extra reads, not 96,360.
  const load = async (merchantId: string) => {
    const [merchant, statuses] = await Promise.all([
      repos.merchants.findById(merchantId),
      repos.productionStatuses.listByMerchant(merchantId),
    ]);
    return { merchant, statuses };
  };

  const resolveMany = async (orders: Order[]): Promise<Order[]> => {
    if (orders.length === 0) return orders;
    const now = readClock();
    const cache = new Map<string, { merchant: Merchant | null; statuses: ProductionStatusEntry[] }>();
    const out: Order[] = [];
    for (const o of orders) {
      let ctx = cache.get(o.merchantId);
      if (!ctx) {
        ctx = await load(o.merchantId);
        cache.set(o.merchantId, ctx);
      }
      out.push(withLiveStageFor(o, ctx.merchant, ctx.statuses, now));
    }
    return out;
  };

  const resolveOne = async (order: Order | null): Promise<Order | null> => {
    if (!order) return null;
    const { merchant, statuses } = await load(order.merchantId);
    return withLiveStageFor(order, merchant, statuses, readClock());
  };

  return {
    async findById(id) {
      return resolveOne(await base.findById(id));
    },
    async findByToken(lookupKey) {
      return resolveOne(await base.findByToken(lookupKey));
    },
    async listByMerchant(merchantId) {
      return resolveMany(await base.listByMerchant(merchantId));
    },
    async listByCustomer(customerId) {
      return resolveMany(await base.listByCustomer(customerId));
    },
    async create(order) {
      // Writes persist the SNAPSHOT the caller minted (lib/import.ts), never a
      // resolved read. Return the live view so a caller that uses the result
      // immediately sees the same stage every other reader will.
      const saved = await base.create(stripProjected(order));
      return (await resolveOne(saved)) ?? saved;
    },
    async createMany(orders) {
      const saved = await base.createMany(orders.map(stripProjected));
      return resolveMany(saved);
    },
    async update(id, p) {
      const saved = await base.update(id, stripProjected(p) as Partial<Order>);
      return (await resolveOne(saved)) ?? saved;
    },
  };
}

/**
 * One wrapper per driver, cached. getRepositories() is called on every request
 * and every service function, so the wrapper must be STABLE: a fresh object each
 * call would allocate needlessly and — worse — silently break anything holding a
 * reference to it (the repository spies our own service tests hang on
 * `repos.orders.listByMerchant` to prove getQueue does not N+1).
 */
const wrapped = new WeakMap<Repositories, Repositories>();

/**
 * Wrap a driver so every order that leaves it carries its LIVE production stage.
 * Everything else passes through untouched — `merchants`, `tickets`, and the rest
 * are the driver's own objects, by identity.
 */
export function withLiveStage(repos: Repositories): Repositories {
  const held = wrapped.get(repos);
  if (held) return held;
  const live: Repositories = { ...repos, orders: liveOrders(repos.orders, repos) };
  wrapped.set(repos, live);
  return live;
}
