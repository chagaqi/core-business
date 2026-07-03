import type {
  Customer,
  DayStageKey,
  Gift,
  Merchant,
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
  /** Patch values must not be explicitly `undefined`; drivers may drop or retain such keys. */
  update(id: string, patch: Partial<Order>): Promise<Order>;
}

export interface CustomerRepository {
  findById(id: string): Promise<Customer | null>;
  findByEmail(merchantId: string, email: string): Promise<Customer | null>;
  listByMerchant(merchantId: string): Promise<Customer[]>;
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
}

export interface GiftRepository {
  listByMerchant(merchantId: string): Promise<Gift[]>;
  findById(id: string): Promise<Gift | null>;
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
}
