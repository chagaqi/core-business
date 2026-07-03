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
  async list() {
    return store.merchants;
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
    return store.orders.filter((o) => o.merchantId === merchantId);
  },
  async listByCustomer(customerId) {
    return store.orders.filter((o) => o.customerId === customerId);
  },
  async create(o) {
    store.orders.push(o);
    return o;
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
    return store.customers.filter((c) => c.merchantId === merchantId);
  },
  async create(c) {
    store.customers.push(c);
    return c;
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
    return store.tickets.filter(
      (t) =>
        (!filter.merchantId || t.merchantId === filter.merchantId) &&
        (!filter.status || t.status === filter.status) &&
        (!filter.customerId || t.customerId === filter.customerId) &&
        (!filter.orderId || t.orderId === filter.orderId),
    );
  },
  async create(t: Ticket) {
    store.tickets.push(t);
    return t;
  },
  async update(id, p) {
    return patch(store.tickets, id, p);
  },
};

const gifts: GiftRepository = {
  async listByMerchant(merchantId) {
    return store.gifts.filter((g: Gift) => g.merchantId === merchantId);
  },
  async findById(id) {
    return store.gifts.find((g: Gift) => g.id === id) ?? null;
  },
};

const social: SocialSignalRepository = {
  async listByMerchant(merchantId) {
    return store.social.filter((s: SocialSignal) => s.merchantId === merchantId);
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
    return store.scriptVariants.filter((v) => v.merchantId === merchantId);
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
};
