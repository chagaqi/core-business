import type {
  Customer,
  DayStageKey,
  Gift,
  Merchant,
  MerchantUpdate,
  Order,
  OutcomeEvent,
  ProductionStageKey,
  ScriptVariant,
  SocialSignal,
  StatusView,
  Ticket,
} from "@/lib/types";

/**
 * Repository interfaces — the seam that lets MongoDB Atlas swap in behind the
 * exact same async contract the JSON driver implements today. Every surface,
 * engine caller, and API route depends on THESE, never on the JSON files.
 */

export interface Page<T> {
  items: T[];
  total: number;
}

export interface TicketFilter {
  merchantId?: string;
  status?: Ticket["status"];
  customerId?: string;
  orderId?: string;
}

export interface MerchantRepository {
  findById(id: string): Promise<Merchant | null>;
  findBySlug(slug: string): Promise<Merchant | null>;
  /** Resolve an inbound address local-part → merchant (ADR-0008 email ingest). */
  findByInboxToken(token: string): Promise<Merchant | null>;
  /**
   * Resolve an Auth0 user (`sub` claim) → the merchant they own (ADR-0020
   * tenancy; one merchant per user v1). Seed/demo merchants have no ownerSub
   * and are never returned. Both drivers implement the same strict equality.
   */
  findByOwnerSub(sub: string): Promise<Merchant | null>;
  /**
   * Resolve an Auth0 user (`sub`) → the merchant they OWN or are a MEMBER of
   * (seats). Strict equality on ownerSub, containment on memberSubs; seed/demo
   * merchants match nothing. One merchant per user still holds across both
   * roles, so at most one merchant resolves.
   */
  findByMemberOrOwnerSub(sub: string): Promise<Merchant | null>;
  list(): Promise<Merchant[]>;
  create(merchant: Merchant): Promise<Merchant>;
  /** Patch values must not be explicitly `undefined`; drivers may drop or retain such keys. */
  update(id: string, patch: Partial<Merchant>): Promise<Merchant>;
}

export interface OrderRepository {
  findById(id: string): Promise<Order | null>;
  findByToken(lookupKey: string): Promise<Order | null>;
  listByMerchant(merchantId: string): Promise<Order[]>;
  listByCustomer(customerId: string): Promise<Order[]>;
  /** Insert a new order (CSV import, ADR-0010). `id` is unique across the collection. */
  create(order: Order): Promise<Order>;
  /** Patch values must not be explicitly `undefined`; drivers may drop or retain such keys. */
  update(id: string, patch: Partial<Order>): Promise<Order>;
}

export interface CustomerRepository {
  findById(id: string): Promise<Customer | null>;
  findByEmail(merchantId: string, email: string): Promise<Customer | null>;
  listByMerchant(merchantId: string): Promise<Customer[]>;
  /** Insert a new customer (CSV import, ADR-0010). Import dedupes by email first. */
  create(customer: Customer): Promise<Customer>;
  /** Patch values must not be explicitly `undefined`; drivers may drop or retain such keys. */
  update(id: string, patch: Partial<Customer>): Promise<Customer>;
}

export interface TicketRepository {
  findById(id: string): Promise<Ticket | null>;
  /** idempotency lookup: the ticket already ingested for a vendor event, if any */
  findByExternalId(
    merchantId: string,
    channel: Ticket["channel"],
    externalId: string,
  ): Promise<Ticket | null>;
  list(filter: TicketFilter): Promise<Ticket[]>;
  create(ticket: Ticket): Promise<Ticket>;
  /** Patch values must not be explicitly `undefined`; drivers may drop or retain such keys. */
  update(id: string, patch: Partial<Ticket>): Promise<Ticket>;
  /**
   * Atomic compare-and-set on status (EN-09/PR-10). Applies `patch` (which itself
   * sets the new status) ONLY if the ticket's current status is one of
   * `fromStatuses`; returns the updated ticket, or null when it didn't match (a
   * concurrent writer already moved it). On Mongo this is one
   * findOneAndUpdate({ id, status: { $in } }); on the JSON store the read+write
   * runs in a single synchronous tick — so two concurrent approveSend calls can
   * never both claim the same ticket (no double-send). Patch values must not be
   * explicitly `undefined`.
   */
  compareAndSetStatus(
    id: string,
    fromStatuses: Ticket["status"][],
    patch: Partial<Ticket>,
  ): Promise<Ticket | null>;
}

export interface GiftRepository {
  listByMerchant(merchantId: string): Promise<Gift[]>;
  findById(id: string): Promise<Gift | null>;
  /**
   * Bulk-insert a merchant's goodwill gift catalog in one call (UX-86
   * onboarding). Each gift's `id` is a unique prefixed nanoid minted by the
   * caller. Returns the inserted gifts in the same order; an empty input is a
   * no-op that returns `[]`. Both drivers insert copies so the caller's objects
   * are never mutated.
   */
  createMany(gifts: Gift[]): Promise<Gift[]>;
}

export interface SocialSignalRepository {
  listByMerchant(merchantId: string): Promise<SocialSignal[]>;
}

export interface StatusViewRepository {
  /** append-only: mints the id, persists the view, returns it. */
  record(v: Omit<StatusView, "id">): Promise<StatusView>;
  /** all views for an order, sorted deterministically by viewedAt (then id). */
  listByOrder(orderId: string): Promise<StatusView[]>;
}

/**
 * Outcome ledger — script variants (ADR-0007). Read-only in Phase 0; variants
 * are seeded from each merchant's playbook. `findByKey` resolves the reassurance
 * engine's variant identity (stageKey + productionStage|null) to a variant id so
 * a draft can be stamped with the template that produced it.
 */
export interface ScriptVariantRepository {
  listByMerchant(merchantId: string): Promise<ScriptVariant[]>;
  findByKey(
    merchantId: string,
    stageKey: DayStageKey,
    productionStage: ProductionStageKey | null,
  ): Promise<ScriptVariant | null>;
  getById(id: string): Promise<ScriptVariant | null>;
  /** Insert an operator-promoted variant (ADR-0014, E4). `id` is unique across the collection. */
  create(variant: ScriptVariant): Promise<ScriptVariant>;
}

/**
 * Append-only outcome events (ADR-0007). `record` mints the id and persists;
 * events are never edited or deleted. Lists are sorted deterministically by
 * observedAt (then id) so both drivers agree.
 */
export interface OutcomeEventRepository {
  record(e: Omit<OutcomeEvent, "id">): Promise<OutcomeEvent>;
  listByVariant(variantId: string): Promise<OutcomeEvent[]>;
  listByMerchant(merchantId: string): Promise<OutcomeEvent[]>;
  /**
   * CSAT is the customer's re-tappable thumbs (ADR-0012, E2): a new tap REPLACES
   * their prior one for the order, it never stacks. Removes every csat_up /
   * csat_down event for the order so the caller can append the current tap;
   * returns the count removed. ONLY csat kinds are touched — the append-only
   * reply_sent / customer_replied / reopened rows are never deleted.
   */
  deleteCsatForOrder(orderId: string): Promise<number>;
}

/**
 * Merchant workshop updates (ADR-0009). Append-only in practice; `create` mints
 * the id and persists. Lists are sorted newest-first (createdAt desc, id desc)
 * so both drivers agree. `listRecentPublic` is the customer-facing projection:
 * it excludes hidden posts and caps to `limit` — the ONLY read that crosses the
 * status-page PII boundary, and it carries the merchant's own message, no
 * customer data.
 */
export interface MerchantUpdateRepository {
  create(u: Omit<MerchantUpdate, "id">): Promise<MerchantUpdate>;
  listByMerchant(merchantId: string): Promise<MerchantUpdate[]>;
  listRecentPublic(merchantId: string, limit: number): Promise<MerchantUpdate[]>;
}

export interface Repositories {
  merchants: MerchantRepository;
  orders: OrderRepository;
  customers: CustomerRepository;
  tickets: TicketRepository;
  gifts: GiftRepository;
  social: SocialSignalRepository;
  statusViews: StatusViewRepository;
  scriptVariants: ScriptVariantRepository;
  outcomeEvents: OutcomeEventRepository;
  merchantUpdates: MerchantUpdateRepository;
}
