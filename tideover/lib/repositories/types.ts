import type {
  Customer,
  Gift,
  Merchant,
  Order,
  SocialSignal,
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
  update(id: string, patch: Partial<Merchant>): Promise<Merchant>;
}

export interface OrderRepository {
  findById(id: string): Promise<Order | null>;
  findByToken(lookupKey: string): Promise<Order | null>;
  listByMerchant(merchantId: string): Promise<Order[]>;
  listByCustomer(customerId: string): Promise<Order[]>;
  update(id: string, patch: Partial<Order>): Promise<Order>;
}

export interface CustomerRepository {
  findById(id: string): Promise<Customer | null>;
  findByEmail(merchantId: string, email: string): Promise<Customer | null>;
  listByMerchant(merchantId: string): Promise<Customer[]>;
  update(id: string, patch: Partial<Customer>): Promise<Customer>;
}

export interface TicketRepository {
  findById(id: string): Promise<Ticket | null>;
  list(filter: TicketFilter): Promise<Ticket[]>;
  create(ticket: Ticket): Promise<Ticket>;
  update(id: string, patch: Partial<Ticket>): Promise<Ticket>;
}

export interface GiftRepository {
  listByMerchant(merchantId: string): Promise<Gift[]>;
  findById(id: string): Promise<Gift | null>;
}

export interface SocialSignalRepository {
  listByMerchant(merchantId: string): Promise<SocialSignal[]>;
}

export interface Repositories {
  merchants: MerchantRepository;
  orders: OrderRepository;
  customers: CustomerRepository;
  tickets: TicketRepository;
  gifts: GiftRepository;
  social: SocialSignalRepository;
}
