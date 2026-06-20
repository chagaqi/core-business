import { verifyStatusToken } from "@/lib/ids";
import type { Gift, Merchant, SocialSignal, Ticket } from "@/lib/types";
import { store } from "@/lib/repositories/json/store";
import type {
  CustomerRepository,
  GiftRepository,
  MerchantRepository,
  OrderRepository,
  Repositories,
  SocialSignalRepository,
  TicketFilter,
  TicketRepository,
} from "@/lib/repositories/types";

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
  async update(id, p) {
    return patch(store.customers, id, p);
  },
};

const tickets: TicketRepository = {
  async findById(id) {
    return store.tickets.find((t) => t.id === id) ?? null;
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

export const jsonRepositories: Repositories = {
  merchants,
  orders,
  customers,
  tickets,
  gifts,
  social,
};
