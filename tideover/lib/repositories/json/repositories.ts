import { newId, verifyStatusToken } from "@/lib/ids";
import type {
  Gift,
  Merchant,
  MerchantUpdate,
  OutcomeEvent,
  SocialSignal,
  StatusView,
  Ticket,
} from "@/lib/types";
import { store } from "@/lib/repositories/json/store";
import type {
  CustomerRepository,
  GiftRepository,
  Lead,
  LeadRepository,
  MerchantRepository,
  MerchantUpdateRepository,
  OrderRepository,
  OutcomeEventRepository,
  Repositories,
  ScriptVariantRepository,
  SocialSignalRepository,
  StatusViewRepository,
  TicketFilter,
  TicketRepository,
} from "@/lib/repositories/types";

/** Deterministic order: viewedAt ascending, id as tiebreak (matches Mongo). */
function byViewedAt(a: StatusView, b: StatusView): number {
  if (a.viewedAt !== b.viewedAt) return a.viewedAt < b.viewedAt ? -1 : 1;
  return a.id < b.id ? -1 : a.id > b.id ? 1 : 0;
}

/** Deterministic order: observedAt ascending, id as tiebreak (matches Mongo). */
function byObservedAt(a: OutcomeEvent, b: OutcomeEvent): number {
  if (a.observedAt !== b.observedAt) return a.observedAt < b.observedAt ? -1 : 1;
  return a.id < b.id ? -1 : a.id > b.id ? 1 : 0;
}

/** Deterministic order: createdAt DESC (newest first), id desc tiebreak (matches Mongo). */
function byCreatedAtDesc(a: MerchantUpdate, b: MerchantUpdate): number {
  if (a.createdAt !== b.createdAt) return a.createdAt > b.createdAt ? -1 : 1;
  return a.id > b.id ? -1 : a.id < b.id ? 1 : 0;
}

/**
 * Cross-driver list order (EN-11/16). Identical to the Mongo driver's findWhere
 * sort ({ createdAt: 1, id: 1 }): createdAt ascending, id ascending as the
 * tiebreak. Collections without a createdAt (customers, gifts, social) fall
 * straight through to id order — exactly what Mongo yields when the sort field
 * is absent (a missing field sorts as null, so every doc ties on it and id
 * breaks the tie). Without this the JSON driver returned raw insertion order,
 * so demo (JSON) and prod (Mongo) could list the SAME data in DIFFERENT orders.
 */
function byCreatedAtThenId<T extends { id: string }>(a: T, b: T): number {
  const ac = (a as { createdAt?: string }).createdAt;
  const bc = (b as { createdAt?: string }).createdAt;
  if (ac !== bc) {
    // A missing createdAt mirrors Mongo's "null sorts first". Only relevant if a
    // collection ever mixed shapes; today each collection is uniform.
    if (ac === undefined) return -1;
    if (bc === undefined) return 1;
    return ac < bc ? -1 : 1;
  }
  return a.id < b.id ? -1 : a.id > b.id ? 1 : 0;
}

/**
 * Sorted COPY of a list in the cross-driver deterministic order. A copy (not an
 * in-place sort) so the backing store array's insertion order is never mutated;
 * callers can't rely on array identity anyway — the Mongo driver returns fresh
 * arrays from toArray() too.
 */
function ordered<T extends { id: string }>(list: T[]): T[] {
  return [...list].sort(byCreatedAtThenId);
}

/**
 * Mirror Mongo's duplicate-key failure (code 11000) so lib/service.ts's
 * isDuplicateKeyError classifies a JSON-driver uniqueness violation identically.
 * Keeps the customer-dedup backstop (EN-24) behaviorally driver-agnostic.
 */
function duplicateKeyError(message: string): Error {
  return Object.assign(new Error(message), { code: 11000 });
}

/**
 * JSON-backed repository implementations over the in-memory store. Async by
 * design so the MongoDB driver is a drop-in behind the identical interface.
 */

function patch<T extends { id: string }>(list: T[], id: string, p: Partial<T>): T {
  const i = list.findIndex((x) => x.id === id);
  if (i === -1) throw new Error(`not found: ${id}`);
  list[i] = { ...list[i], ...p };
  return list[i];
}

const merchants: MerchantRepository = {
  async findById(id) {
    return store.merchants.find((m) => m.id === id) ?? null;
  },
  async findBySlug(slug) {
    return store.merchants.find((m) => m.slug === slug) ?? null;
  },
  async findByInboxToken(token) {
    return store.merchants.find((m) => m.inboxToken === token) ?? null;
  },
  async findByOwnerSub(sub) {
    // Strict equality: seed/demo merchants omit ownerSub (undefined) and can
    // never match a real sub. Matches the Mongo driver's { ownerSub: sub }.
    return store.merchants.find((m) => m.ownerSub === sub) ?? null;
  },
  async findByMemberOrOwnerSub(sub) {
    // Owner OR attached member (seats). Matches the Mongo driver's
    // $or: [{ ownerSub: sub }, { memberSubs: sub }] containment query.
    return (
      store.merchants.find((m) => m.ownerSub === sub || (m.memberSubs ?? []).includes(sub)) ?? null
    );
  },
  async list() {
    return ordered(store.merchants);
  },
  async create(m: Merchant) {
    store.merchants.push(m);
    return m;
  },
  async update(id, p) {
    return patch(store.merchants, id, p);
  },
};

const orders: OrderRepository = {
  async findById(id) {
    return store.orders.find((o) => o.id === id) ?? null;
  },
  async findByToken(lookupKey) {
    return (
      store.orders.find((o) => {
        const verified = verifyStatusToken(o.statusToken);
        return verified !== null && verified === lookupKey;
      }) ?? null
    );
  },
  async listByMerchant(merchantId) {
    return ordered(store.orders.filter((o) => o.merchantId === merchantId));
  },
  async listByCustomer(customerId) {
    return ordered(store.orders.filter((o) => o.customerId === customerId));
  },
  async create(o) {
    store.orders.push(o);
    return o;
  },
  async createMany(os) {
    // Ordered pushes of copies (symmetric to gifts.createMany) — the caller's
    // objects stay clean, and a hypothetical mid-loop failure leaves a prefix,
    // matching Mongo's ordered insertMany semantics.
    for (const o of os) store.orders.push({ ...o });
    return os;
  },
  async update(id, p) {
    return patch(store.orders, id, p);
  },
};

const customers: CustomerRepository = {
  async findById(id) {
    return store.customers.find((c) => c.id === id) ?? null;
  },
  async findByEmail(merchantId, email) {
    return (
      store.customers.find(
        (c) => c.merchantId === merchantId && c.email.toLowerCase() === email.toLowerCase(),
      ) ?? null
    );
  },
  async listByMerchant(merchantId) {
    return ordered(store.customers.filter((c) => c.merchantId === merchantId));
  },
  async create(c) {
    // Uniqueness backstop for the check-then-act email dedup (EN-24): enforce the
    // same (merchantId, case-insensitive email) constraint the Mongo unique index
    // enforces, and fail the same way (code 11000) so a caller's duplicate-key
    // handling is driver-agnostic. findByEmail already lower-cases both sides, so
    // a create that races past it (or a caller that skipped the check) is refused
    // here instead of silently duplicating a backer. All current callers
    // (import.ts, ingestTicket) dedupe before create, so this never fires on the
    // single-process JSON store in practice — it's the parity/safety net.
    const existing = store.customers.find(
      (x) => x.merchantId === c.merchantId && x.email.toLowerCase() === c.email.toLowerCase(),
    );
    if (existing) {
      throw duplicateKeyError(`duplicate customer email for merchant ${c.merchantId}: ${c.email}`);
    }
    store.customers.push(c);
    return c;
  },
  async createMany(cs) {
    // Ordered inserts with the SAME (merchantId, lowercased email) uniqueness
    // backstop as single create — one shared guard, one failure shape (11000).
    // Copies are pushed so the caller's working objects are never aliased into
    // the store. Stops at the first violation (prefix persists), matching
    // Mongo's ordered insertMany.
    for (const c of cs) {
      const existing = store.customers.find(
        (x) => x.merchantId === c.merchantId && x.email.toLowerCase() === c.email.toLowerCase(),
      );
      if (existing) {
        throw duplicateKeyError(`duplicate customer email for merchant ${c.merchantId}: ${c.email}`);
      }
      store.customers.push({ ...c });
    }
    return cs;
  },
  async update(id, p) {
    return patch(store.customers, id, p);
  },
};

const tickets: TicketRepository = {
  async findById(id) {
    return store.tickets.find((t) => t.id === id) ?? null;
  },
  async findByExternalId(merchantId, channel, externalId) {
    return (
      store.tickets.find(
        (t) => t.merchantId === merchantId && t.channel === channel && t.externalId === externalId,
      ) ?? null
    );
  },
  async list(filter: TicketFilter) {
    return ordered(
      store.tickets.filter(
        (t) =>
          (!filter.merchantId || t.merchantId === filter.merchantId) &&
          (!filter.status || t.status === filter.status) &&
          (!filter.customerId || t.customerId === filter.customerId) &&
          (!filter.orderId || t.orderId === filter.orderId),
      ),
    );
  },
  async create(t: Ticket) {
    store.tickets.push(t);
    return t;
  },
  async update(id, p) {
    return patch(store.tickets, id, p);
  },
  async compareAndSetStatus(id, fromStatuses, p) {
    // Read + guard + write run in ONE synchronous tick (no await between), so a
    // concurrent approveSend can't interleave and double-claim. Returns null when
    // the ticket is missing or its status isn't in the allowed `fromStatuses`.
    const i = store.tickets.findIndex((t) => t.id === id);
    if (i === -1) return null;
    if (!fromStatuses.includes(store.tickets[i].status)) return null;
    store.tickets[i] = { ...store.tickets[i], ...p };
    return store.tickets[i];
  },
};

const gifts: GiftRepository = {
  async listByMerchant(merchantId) {
    return ordered(store.gifts.filter((g: Gift) => g.merchantId === merchantId));
  },
  async findById(id) {
    return store.gifts.find((g: Gift) => g.id === id) ?? null;
  },
  async createMany(gs: Gift[]) {
    // Push copies onto the in-memory gifts store — the same path other
    // collections persist through (store.gifts survives for the process life).
    for (const g of gs) store.gifts.push({ ...g });
    return gs;
  },
  async update(id, p) {
    return patch(store.gifts, id, p);
  },
};

const social: SocialSignalRepository = {
  async listByMerchant(merchantId) {
    return ordered(store.social.filter((s: SocialSignal) => s.merchantId === merchantId));
  },
};

const statusViews: StatusViewRepository = {
  async record(v) {
    const sv: StatusView = { ...v, id: newId("sv") };
    store.statusViews.push(sv);
    return sv;
  },
  async listByOrder(orderId) {
    return store.statusViews.filter((s) => s.orderId === orderId).sort(byViewedAt);
  },
};

const scriptVariants: ScriptVariantRepository = {
  async listByMerchant(merchantId) {
    return ordered(store.scriptVariants.filter((v) => v.merchantId === merchantId));
  },
  async findByKey(merchantId, stageKey, productionStage) {
    return (
      store.scriptVariants.find(
        (v) =>
          v.merchantId === merchantId &&
          v.stageKey === stageKey &&
          v.productionStage === productionStage,
      ) ?? null
    );
  },
  async getById(id) {
    return store.scriptVariants.find((v) => v.id === id) ?? null;
  },
  async create(v) {
    store.scriptVariants.push(v);
    return v;
  },
};

const outcomeEvents: OutcomeEventRepository = {
  async record(e) {
    const oe: OutcomeEvent = { ...e, id: newId("oe") };
    store.outcomeEvents.push(oe);
    return oe;
  },
  async listByVariant(variantId) {
    return store.outcomeEvents.filter((e) => e.variantId === variantId).sort(byObservedAt);
  },
  async listByMerchant(merchantId) {
    return store.outcomeEvents.filter((e) => e.merchantId === merchantId).sort(byObservedAt);
  },
  async deleteCsatForOrder(orderId) {
    // In-place splice so the store's array reference (held elsewhere) stays live.
    let removed = 0;
    for (let i = store.outcomeEvents.length - 1; i >= 0; i--) {
      const e = store.outcomeEvents[i];
      if (e.orderId === orderId && (e.kind === "csat_up" || e.kind === "csat_down")) {
        store.outcomeEvents.splice(i, 1);
        removed += 1;
      }
    }
    return removed;
  },
};

const merchantUpdates: MerchantUpdateRepository = {
  async create(u) {
    const upd: MerchantUpdate = { ...u, id: newId("upd") };
    store.merchantUpdates.push(upd);
    return upd;
  },
  async listByMerchant(merchantId) {
    return store.merchantUpdates.filter((u) => u.merchantId === merchantId).sort(byCreatedAtDesc);
  },
  async listRecentPublic(merchantId, limit) {
    return store.merchantUpdates
      .filter((u) => u.merchantId === merchantId && !u.hidden)
      .sort(byCreatedAtDesc)
      .slice(0, Math.max(0, limit));
  },
};

/**
 * Marketing leads live OUTSIDE the seeded store (lib/data/seed carries no
 * leads — they are visitor input, not demo data). Module-level array: writes
 * persist for the process life, restart = empty, same lifecycle the seeded
 * demo store has. Mirrors the Mongo driver's "leads" collection.
 */
const leadStore: Lead[] = [];

const leads: LeadRepository = {
  async create(l) {
    const lead: Lead = { ...l, id: newId("ld") };
    leadStore.push(lead);
    return lead;
  },
};

export const jsonRepositories: Repositories = {
  merchants,
  orders,
  customers,
  tickets,
  gifts,
  social,
  statusViews,
  scriptVariants,
  outcomeEvents,
  merchantUpdates,
  leads,
};
