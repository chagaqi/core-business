import type {
  Customer,
  Gift,
  Merchant,
  MerchantUpdate,
  Order,
  OutcomeEvent,
  ProductionStatusEntry,
  ScriptVariant,
  SocialSignal,
  StatusView,
  Ticket,
} from "@/lib/types";

import customersJson from "@/lib/data/customers.json";
import giftsJson from "@/lib/data/gifts.json";
import merchantsJson from "@/lib/data/merchants.json";
import merchantUpdatesJson from "@/lib/data/merchant-updates.json";
import ordersJson from "@/lib/data/orders.json";
import outcomeEventsJson from "@/lib/data/outcome-events.json";
import scriptVariantsJson from "@/lib/data/script-variants.json";
import socialJson from "@/lib/data/social-feed.json";
import statusViewsJson from "@/lib/data/status-views.json";
import ticketsJson from "@/lib/data/tickets.json";

/**
 * Typed access to the generated seed (scripts/gen-seed.mjs). Cloned on read so a
 * mutable in-memory repository can't corrupt the immutable import. This is the
 * ONLY module that touches the raw JSON; everything else goes through repos.
 */
const clone = <T,>(v: T): T => JSON.parse(JSON.stringify(v)) as T;

export interface SeedData {
  merchants: Merchant[];
  customers: Customer[];
  orders: Order[];
  tickets: Ticket[];
  gifts: Gift[];
  social: SocialSignal[];
  statusViews: StatusView[];
  scriptVariants: ScriptVariant[];
  outcomeEvents: OutcomeEvent[];
  merchantUpdates: MerchantUpdate[];
  /**
   * The production status board (lib/status-board.ts). Seeded EMPTY on purpose:
   * a status is a human being's live statement about what is physically
   * happening, and a fabricated one in demo data is exactly the class of claim
   * the proof-only doctrine forbids. The demo merchants fall back to their day
   * bands, which is the honest behavior for a merchant who has not posted.
   */
  productionStatuses: ProductionStatusEntry[];
}

export function buildSeed(): SeedData {
  return {
    merchants: clone(merchantsJson as unknown as Merchant[]),
    customers: clone(customersJson as unknown as Customer[]),
    orders: clone(ordersJson as unknown as Order[]),
    tickets: clone(ticketsJson as unknown as Ticket[]),
    gifts: clone(giftsJson as unknown as Gift[]),
    social: clone(socialJson as unknown as SocialSignal[]),
    statusViews: clone(statusViewsJson as unknown as StatusView[]),
    scriptVariants: clone(scriptVariantsJson as unknown as ScriptVariant[]),
    outcomeEvents: clone(outcomeEventsJson as unknown as OutcomeEvent[]),
    merchantUpdates: clone(merchantUpdatesJson as unknown as MerchantUpdate[]),
    productionStatuses: [],
  };
}
