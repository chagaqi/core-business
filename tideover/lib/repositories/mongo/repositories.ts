import type { Collection, Document, Filter, MatchKeysAndValues } from "mongodb";
import { newId, verifyStatusToken } from "@/lib/ids";
import type {
  Customer,
  Gift,
  Merchant,
  MerchantUpdate,
  Order,
  OutcomeEvent,
  ScriptVariant,
  SocialSignal,
  StatusView,
  Ticket,
} from "@/lib/types";
import { getDb } from "@/lib/repositories/mongo/client";
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
  async findByInboxToken(token) {
    return findOneWhere<Merchant>("merchants", { inboxToken: token });
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
  async create(o: Order) {
    // insert() writes a copy so Mongo's _id never touches the caller's object;
    // the unique { id: 1 } index (mongo/client.ts) rejects a duplicate order id.
    return insert("orders", o);
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
  async create(c: Customer) {
    // Same _id-stripping insert; unique { id: 1 } index guards duplicate ids.
    return insert("customers", c);
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
  async compareAndSetStatus(id, fromStatuses, p) {
    // A single atomic findOneAndUpdate gated on { id, status: { $in } }: the DB
    // matches-and-sets in one operation, so a concurrent approve that already
    // moved the ticket to "sent" finds no match here and returns null. Mirrors
    // updateById's undefined-stripping so the $set matches the JSON driver.
    const c = await col<Ticket>("tickets");
    const set: Record<string, unknown> = {};
    for (const [k, v] of Object.entries(p)) if (v !== undefined) set[k] = v;
    const doc = await c.findOneAndUpdate(
      { id, status: { $in: fromStatuses } } as Filter<Ticket>,
      { $set: set as MatchKeysAndValues<Ticket> },
      { returnDocument: "after", projection: { _id: 0 } },
    );
    return (doc as Ticket | null) ?? null;
  },
};

const gifts: GiftRepository = {
  async listByMerchant(merchantId) {
    return findWhere<Gift>("gifts", { merchantId });
  },
  async findById(id) {
    return findOneWhere<Gift>("gifts", { id });
  },
  async createMany(gs: Gift[]) {
    // Empty input is a no-op — insertMany rejects an empty array.
    if (gs.length === 0) return gs;
    const c = await col<Gift>("gifts");
    // Insert copies: insertMany mutates each argument by attaching _id, so the
    // caller's gift objects (and their giftCatalogIds link) stay clean.
    await c.insertMany(gs.map((g) => ({ ...g })) as Parameters<typeof c.insertMany>[0]);
    return gs;
  },
};

const social: SocialSignalRepository = {
  async listByMerchant(merchantId) {
    return findWhere<SocialSignal>("social", { merchantId });
  },
};

const statusViews: StatusViewRepository = {
  async record(v) {
    const sv: StatusView = { ...v, id: newId("sv") };
    return insert("status_views", sv);
  },
  async listByOrder(orderId) {
    // Deterministic order by viewedAt (the JSON driver sorts the same way);
    // findWhere sorts by createdAt/id, which these documents don't carry.
    const c = await col<StatusView>("status_views");
    return (await c
      .find({ orderId } as Filter<StatusView>, noId)
      .sort({ viewedAt: 1, id: 1 })
      .toArray()) as StatusView[];
  },
};

const scriptVariants: ScriptVariantRepository = {
  async listByMerchant(merchantId) {
    return findWhere<ScriptVariant>("script_variants", { merchantId });
  },
  async findByKey(merchantId, stageKey, productionStage) {
    // productionStage null matches the day-stage's base variant. All seeded
    // docs carry productionStage explicitly, so { …: null } is unambiguous and
    // matches the JSON driver's strict === null comparison 1:1.
    return findOneWhere<ScriptVariant>("script_variants", {
      merchantId,
      stageKey,
      productionStage,
    } as Filter<ScriptVariant>);
  },
  async getById(id) {
    return findOneWhere<ScriptVariant>("script_variants", { id });
  },
  async create(v: ScriptVariant) {
    // Same _id-stripping insert as the other create methods; the promoted
    // variant's prefixed nanoid id stays the document key.
    return insert("script_variants", v);
  },
};

const outcomeEvents: OutcomeEventRepository = {
  async record(e) {
    const oe: OutcomeEvent = { ...e, id: newId("oe") };
    return insert("outcome_events", oe);
  },
  async listByVariant(variantId) {
    // Deterministic order by observedAt then id (matches the JSON driver);
    // append-only rows carry no createdAt for findWhere's default sort.
    const c = await col<OutcomeEvent>("outcome_events");
    return (await c
      .find({ variantId } as Filter<OutcomeEvent>, noId)
      .sort({ observedAt: 1, id: 1 })
      .toArray()) as OutcomeEvent[];
  },
  async listByMerchant(merchantId) {
    const c = await col<OutcomeEvent>("outcome_events");
    return (await c
      .find({ merchantId } as Filter<OutcomeEvent>, noId)
      .sort({ observedAt: 1, id: 1 })
      .toArray()) as OutcomeEvent[];
  },
  async deleteCsatForOrder(orderId) {
    const c = await col<OutcomeEvent>("outcome_events");
    const res = await c.deleteMany({
      orderId,
      kind: { $in: ["csat_up", "csat_down"] },
    } as Filter<OutcomeEvent>);
    return res.deletedCount ?? 0;
  },
};

const merchantUpdates: MerchantUpdateRepository = {
  async create(u) {
    const upd: MerchantUpdate = { ...u, id: newId("upd") };
    return insert("merchant_updates", upd);
  },
  async listByMerchant(merchantId) {
    // Newest-first (createdAt desc, id desc) — matches the JSON driver exactly.
    const c = await col<MerchantUpdate>("merchant_updates");
    return (await c
      .find({ merchantId } as Filter<MerchantUpdate>, noId)
      .sort({ createdAt: -1, id: -1 })
      .toArray()) as MerchantUpdate[];
  },
  async listRecentPublic(merchantId, limit) {
    // Customer-facing projection: exclude hidden posts, newest-first, capped.
    // `hidden: { $ne: true }` matches both absent and false (the JSON driver's
    // `!u.hidden`). limit floored at 0 so a bad caller never inverts the cap.
    const c = await col<MerchantUpdate>("merchant_updates");
    return (await c
      .find(
        { merchantId, hidden: { $ne: true } } as Filter<MerchantUpdate>,
        noId,
      )
      .sort({ createdAt: -1, id: -1 })
      .limit(Math.max(0, limit))
      .toArray()) as MerchantUpdate[];
  },
};

export const mongoRepositories: Repositories = {
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
