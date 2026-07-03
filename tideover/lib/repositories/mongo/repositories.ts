import type { Collection, Document, Filter, MatchKeysAndValues } from "mongodb";
import { verifyStatusToken } from "@/lib/ids";
import type { Customer, Gift, Merchant, Order, SocialSignal, Ticket } from "@/lib/types";
import { getDb } from "@/lib/repositories/mongo/client";
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
 * MongoDB repository implementations (ADR-0003). Documents are the domain
 * objects verbatim: `id` stays the prefixed nanoid, dates stay ISO strings,
 * money stays integer cents. Mongo's _id never escapes this module — stripped
 * via projection on every read, and writes insert copies so callers' objects
 * are never mutated. Observable semantics match the JSON driver 1:1 so
 * engines, lib/service.ts, and API routes need zero changes.
 */

const noId = { projection: { _id: 0 } };

async function col<T extends Document>(name: string): Promise<Collection<T>> {
  return (await getDb()).collection<T>(name);
}

async function findWhere<T extends Document>(name: string, filter: Filter<T>): Promise<T[]> {
  const c = await col<T>(name);
  // Deterministic order: Mongo's natural order can shift after updates/moves,
  // whereas the JSON driver returns stable file order. createdAt then id keeps
  // seed order (e.g. merchants[0] stays Lumen, which app pages rely on);
  // collections without createdAt fall through to id order.
  return (await c.find(filter, noId).sort({ createdAt: 1, id: 1 }).toArray()) as T[];
}

async function findOneWhere<T extends Document>(name: string, filter: Filter<T>): Promise<T | null> {
  const c = await col<T>(name);
  return (await c.findOne(filter, noId)) as T | null;
}

async function insert<T extends { id: string } & Document>(name: string, doc: T): Promise<T> {
  const c = await col<T>(name);
  // Insert a copy: insertOne mutates its argument by attaching _id.
  await c.insertOne({ ...doc } as Parameters<typeof c.insertOne>[0]);
  return doc;
}

async function updateById<T extends { id: string } & Document>(
  name: string,
  id: string,
  patch: Partial<T>,
): Promise<T> {
  const c = await col<T>(name);
  const set: Record<string, unknown> = {};
  for (const [k, v] of Object.entries(patch)) if (v !== undefined) set[k] = v;
  // Mongo rejects an empty $set; the JSON driver treats an empty patch as a
  // no-op, so read instead. Top-level $set = the JSON driver's shallow merge.
  const doc =
    Object.keys(set).length === 0
      ? await c.findOne({ id } as Filter<T>, noId)
      : await c.findOneAndUpdate(
          { id } as Filter<T>,
          { $set: set as MatchKeysAndValues<T> },
          { returnDocument: "after", projection: { _id: 0 } },
        );
  if (!doc) throw new Error(`not found: ${id}`);
  return doc as T;
}

const escapeRegex = (s: string): string => s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

const merchants: MerchantRepository = {
  async findById(id) {
    return findOneWhere<Merchant>("merchants", { id });
  },
  async findBySlug(slug) {
    return findOneWhere<Merchant>("merchants", { slug });
  },
  async list() {
    return findWhere<Merchant>("merchants", {});
  },
  async create(m: Merchant) {
    return insert("merchants", m);
  },
  async update(id, p) {
    return updateById<Merchant>("merchants", id, p);
  },
};

const orders: OrderRepository = {
  async findById(id) {
    return findOneWhere<Order>("orders", { id });
  },
  async findByToken(lookupKey) {
    // Narrow on the indexed `<raw>.` token prefix, then apply the JSON
    // driver's exact verify-and-compare predicate so semantics stay identical.
    const candidates = await findWhere<Order>("orders", {
      statusToken: { $regex: `^${escapeRegex(lookupKey)}\\.` },
    });
    return candidates.find((o) => verifyStatusToken(o.statusToken) === lookupKey) ?? null;
  },
  async listByMerchant(merchantId) {
    return findWhere<Order>("orders", { merchantId });
  },
  async listByCustomer(customerId) {
    return findWhere<Order>("orders", { customerId });
  },
  async update(id, p) {
    return updateById<Order>("orders", id, p);
  },
};

const customers: CustomerRepository = {
  async findById(id) {
    return findOneWhere<Customer>("customers", { id });
  },
  async findByEmail(merchantId, email) {
    // Case-insensitive match done in JS (same predicate as the JSON driver)
    // over the merchant's customers, so unicode casing can't diverge.
    const list = await findWhere<Customer>("customers", { merchantId });
    return list.find((c) => c.email.toLowerCase() === email.toLowerCase()) ?? null;
  },
  async listByMerchant(merchantId) {
    return findWhere<Customer>("customers", { merchantId });
  },
  async update(id, p) {
    return updateById<Customer>("customers", id, p);
  },
};

const tickets: TicketRepository = {
  async findById(id) {
    return findOneWhere<Ticket>("tickets", { id });
  },
  async findByExternalId(merchantId, channel, externalId) {
    return findOneWhere<Ticket>("tickets", { merchantId, channel, externalId });
  },
  async list(filter: TicketFilter) {
    // Falsy checks mirror the JSON driver: "" and undefined both mean no filter.
    const q: Partial<Pick<Ticket, "merchantId" | "status" | "customerId" | "orderId">> = {};
    if (filter.merchantId) q.merchantId = filter.merchantId;
    if (filter.status) q.status = filter.status;
    if (filter.customerId) q.customerId = filter.customerId;
    if (filter.orderId) q.orderId = filter.orderId;
    return findWhere<Ticket>("tickets", q);
  },
  async create(t: Ticket) {
    return insert("tickets", t);
  },
  async update(id, p) {
    return updateById<Ticket>("tickets", id, p);
  },
};

const gifts: GiftRepository = {
  async listByMerchant(merchantId) {
    return findWhere<Gift>("gifts", { merchantId });
  },
  async findById(id) {
    return findOneWhere<Gift>("gifts", { id });
  },
};

const social: SocialSignalRepository = {
  async listByMerchant(merchantId) {
    return findWhere<SocialSignal>("social", { merchantId });
  },
};

export const mongoRepositories: Repositories = {
  merchants,
  orders,
  customers,
  tickets,
  gifts,
  social,
};
