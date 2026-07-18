import type { Gift, Merchant } from "@/lib/types";

/**
 * The merchant's ACTIVE goodwill catalog — the gifts the engine may recommend.
 *
 * Active = the gift's id is in merchant.giftCatalogIds. This is the exact
 * definition the eval harness already uses (evals/_shared.mjs catalogFor), so
 * runtime and evals agree on what "the catalog" means. Before the settings
 * surface existed the two sets were always identical (onboarding and the seed
 * link every gift into giftCatalogIds); settings introduces RETIRING — a
 * retired gift keeps its record (past drafts' recommendedGiftId stays
 * resolvable) but leaves giftCatalogIds, so it must stop feeding the engine.
 *
 * Result preserves the order of `gifts` (the repository's deterministic
 * cross-driver order), not the id-list order.
 */
export function activeCatalog(merchant: Merchant, gifts: Gift[]): Gift[] {
  const active = new Set(merchant.giftCatalogIds);
  return gifts.filter((g) => active.has(g.id));
}
