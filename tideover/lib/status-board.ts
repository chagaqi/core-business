import { newId } from "@/lib/ids";
import { assertNoHardDate, containsHardDate } from "@/lib/proof";
import { getRepositories } from "@/lib/repositories";
import type {
  Merchant,
  MerchantDisclosedEta,
  Order,
  ProductionStatus,
  ProductionStatusEntry,
  ProductionStatusSource,
  ResolvedStageKey,
  StatusScope,
  WeeksBand,
} from "@/lib/types";

/**
 * THE PRODUCTION STATUS BOARD — the merchant's own current word on what is
 * physically happening, and the thing every reply reads.
 *
 * WHY IT EXISTS. Before this, an order's production stage was stamped once, at
 * CSV import, and never moved again. By day 30 of the ten-merchant run, 36% of
 * the replies we sent stated the WRONG physical fact about the customer's own
 * order — in the merchant's voice, over their signature. Deriving the stage from
 * the wait (lib/time.ts resolveStageFromBands) fixes the arithmetic. It does not
 * fix the truth, because the bands are a PLAN, and our entire ICP is merchants
 * whose plan broke. When a founder says "the tooling re-cut finished Tuesday,
 * we're loading the first run", that sentence outranks every band in the system,
 * and it is the only thing that can speak for an order that is past every band.
 *
 * THE MODEL.
 *  - Append-only history (`ProductionStatusEntry`). Nothing is ever edited or
 *    deleted, because "what did you tell this backer, and when" is the exhibit a
 *    card network asks for and the exhibit we could not produce for anyone.
 *  - The CURRENT status for a scope is simply the NEWEST entry with that scope.
 *  - A status may be SCOPED to a campaign, a wave, and/or a region. Every field
 *    present in the scope must match the order; an empty scope is merchant-wide.
 *    This is the object p04 (48% EU, one rolled EU container), p08 (one kiln
 *    cohort of three) and p09 (two campaigns, 640 shared backers) needed: a way
 *    to say a true thing to exactly the people it is true for, without panicking
 *    the people it is not true for.
 *  - `getCurrentStatus(merchantId, order)` resolves the MOST SPECIFIC status that
 *    applies to one order. That is the accessor the drafting layer wires into the
 *    prompt, and it is what the read seam uses to resolve the order's live stage.
 *
 * PROOF-ONLY. A status carries a confidence band in WEEKS, never a date. The
 * headline and detail are customer-facing text and are hard-date-linted on WRITE
 * (not on read) — so a bad value is refused at the door instead of exploding
 * inside a draft, and every reader downstream can trust what it finds here.
 */

// ─── the import seam ────────────────────────────────────────────────────────
/**
 * POPULATING THE BOARD WITHOUT MAKING IT SOMEONE'S JOB.
 *
 * A status board only works if it is current, and a board that a founder has to
 * remember to update at 11pm is a board that is three weeks stale the first time
 * it matters. So the board is designed to be FED, not typed. `recordStatus` is
 * the one write path and it already takes a `source` + `sourceRef`, so an
 * importer is a function that produces `StatusImportCandidate[]` and hands them
 * here — no schema change, no second write path, and the append-only history
 * records the provenance of every line we ever told a customer.
 *
 * The four sources that are actually realistic for this ICP, in the order I would
 * build them:
 *
 *  1. THE SHEET THE OPS TEAM ALREADY KEEPS ("sheet"). Every one of the ten
 *     personas tracks production somewhere, and for the small ones it is a Google
 *     Sheet or an Airtable with a row per wave and a "where it's at" column. This
 *     is the highest-yield integration in the list: read-only, one API scope, a
 *     column map exactly like the CSV importer we already ship, and the merchant
 *     changes nothing about how they work. Poll it; the newest row per scope wins.
 *
 *  2. THE SUPPLIER EMAIL DIGEST ("email-digest"). The factory/kiln/press already
 *     emails the founder a progress note. We ALREADY own an inbound email address
 *     per merchant (Merchant.inboxToken, ADR-0008), so the merchant forwards that
 *     thread to it and we parse the note into a candidate the merchant CONFIRMS
 *     with one click. Never auto-post a supplier's words as the merchant's own —
 *     the confirm step is the product.
 *
 *  3. THE BOARD THEY RUN THE BUILD ON ("board"). Trello / Notion / Linear. A card
 *     per wave, a list per stage: moving the card between lists IS the stage
 *     change, and the card's newest comment IS the headline. Cheap webhook, but
 *     narrower — only the merchants who happen to run this way.
 *
 *  4. THE SHIPPING-PARTNER / 3PL FEED ("shipping-feed"). The only source that can
 *     prove the LAST stage rather than assert it (a container booked, a pallet
 *     received, a label bought). Highest trust, lowest coverage, and useless for
 *     the stages that matter most (tooling, production), which is where every one
 *     of these merchants is actually stuck.
 *
 * NOT BUILT HERE. This is the seam and the shape, deliberately: an importer is a
 * pure function `(rawSource) => StatusImportCandidate[]`, and `importStatuses()`
 * below is the one call that turns candidates into history. Wiring an actual
 * source is a separate lane with its own auth story.
 */
export interface StatusImportCandidate {
  stageKey: ResolvedStageKey;
  headline: string;
  detail?: string;
  confidenceBand: WeeksBand;
  scope?: StatusScope;
  /** the row/message/card this came from — kept so a claim is always traceable. */
  sourceRef?: string;
}

// ─── scope resolution ───────────────────────────────────────────────────────

const norm = (v: string | undefined): string | undefined => {
  const t = v?.trim().toLowerCase();
  return t ? t : undefined;
};

/**
 * The three cohort keys anything scoped is matched against. An Order is one; so
 * is a CSV row mid-import, before an Order exists — which is why this is a
 * standalone shape rather than an Order.
 */
export interface Cohort {
  campaignName?: string;
  wave?: string;
  region?: string;
}

/**
 * Does this scope apply to this cohort? Every field PRESENT in the scope must
 * match. A scope field the cohort cannot satisfy (e.g. a campaign scope on an
 * order with no campaign) does NOT match — silence is not consent.
 */
export function scopeMatches(scope: StatusScope | undefined, cohort: Cohort): boolean {
  if (!scope) return true;
  const c = norm(scope.campaignName);
  const w = norm(scope.wave);
  const r = norm(scope.region);
  if (c !== undefined && norm(cohort.campaignName) !== c) return false;
  if (w !== undefined && norm(cohort.wave) !== w) return false;
  if (r !== undefined && norm(cohort.region) !== r) return false;
  return true;
}

/** Does this scope apply to this order? See scopeMatches. */
export function scopeApplies(scope: StatusScope | undefined, order: Order): boolean {
  return scopeMatches(scope, order);
}

/**
 * How specific a scope is. Campaign (4) outranks wave (2) outranks region (1),
 * so "Deepwater" beats "the EU" beats merchant-wide (0) — a status about one
 * campaign is a stronger statement about a backer of that campaign than a status
 * about every EU backer the merchant has. Ties break on recency.
 */
export function scopeSpecificity(scope: StatusScope | undefined): number {
  if (!scope) return 0;
  return (
    (norm(scope.campaignName) ? 4 : 0) + (norm(scope.wave) ? 2 : 0) + (norm(scope.region) ? 1 : 0)
  );
}

/**
 * The single status that speaks for THIS order: of every entry whose scope
 * applies, the most specific; ties broken by the newest. Null when the merchant
 * has posted nothing that reaches this order. Pure — `entries` is the merchant's
 * whole append-only history, in any order.
 */
export function resolveStatusFor(
  entries: ProductionStatusEntry[],
  order: Order,
): ProductionStatusEntry | null {
  let best: ProductionStatusEntry | null = null;
  let bestScore = -1;
  for (const e of entries) {
    if (!scopeApplies(e.scope, order)) continue;
    const score = scopeSpecificity(e.scope);
    if (score > bestScore || (score === bestScore && best !== null && e.updatedAt > best.updatedAt)) {
      best = e;
      bestScore = score;
    }
  }
  return best;
}

/** The newest entry per DISTINCT scope — the board as an operator sees it. Pure. */
export function currentBoard(entries: ProductionStatusEntry[]): ProductionStatusEntry[] {
  const byScope = new Map<string, ProductionStatusEntry>();
  for (const e of entries) {
    const key = [norm(e.scope?.campaignName) ?? "", norm(e.scope?.wave) ?? "", norm(e.scope?.region) ?? ""].join("|");
    const held = byScope.get(key);
    if (!held || e.updatedAt > held.updatedAt) byScope.set(key, e);
  }
  return [...byScope.values()].sort(
    (a, b) => scopeSpecificity(b.scope) - scopeSpecificity(a.scope) || (a.updatedAt < b.updatedAt ? 1 : -1),
  );
}

/** The newest MERCHANT-WIDE (unscoped) entry — what gets denormalized onto the merchant. Pure. */
export function currentMerchantWide(entries: ProductionStatusEntry[]): ProductionStatusEntry | null {
  let best: ProductionStatusEntry | null = null;
  for (const e of entries) {
    if (scopeSpecificity(e.scope) !== 0) continue;
    if (!best || e.updatedAt > best.updatedAt) best = e;
  }
  return best;
}

/** Render a weeks band as the customer-facing clause. Never a date (ADR-0002). */
export function formatWeeksBand(band: WeeksBand): string {
  const lo = Math.max(0, Math.round(band.minWeeks));
  const hi = Math.max(lo, Math.round(band.maxWeeks));
  return lo === hi ? `in about ${lo} weeks` : `in weeks ${lo}–${hi}`;
}

// ─── the disclosed ETA ──────────────────────────────────────────────────────

/**
 * THE DISCLOSED ETA — the delivery window the merchant PROMISED, resolved for
 * one cohort (most specific scope wins, exactly like a status).
 *
 * `disclosedEta` was undefined on 48,180 of 48,180 orders in the ten-merchant
 * run, so the evidence pack could not produce its single best chargeback exhibit
 * — "we told you weeks 9–11 on the day you paid, and you accepted it" — for ONE
 * customer, across fourteen packs pulled on live chargeback threats. The reason
 * is structural: no export in this market (KS backer report, KS pledge manager,
 * BackerKit, Gamefound, Shopify CSV) carries a delivery-date column, so no amount
 * of importer work was ever going to find one.
 *
 * The fix is to stop looking in the file. The merchant's own promised window IS
 * the disclosure — they published it on their campaign page and every backer read
 * it before paying. It is captured at onboarding (from the fulfillment window
 * they already give us, so it costs them nothing), overridable per campaign or
 * wave, and stamped onto every order at import.
 */
export function resolveDisclosedEta(
  merchant: Pick<Merchant, "disclosedEtas">,
  cohort: Cohort,
): MerchantDisclosedEta | null {
  let best: MerchantDisclosedEta | null = null;
  let bestScore = -1;
  for (const d of merchant.disclosedEtas ?? []) {
    if (!scopeMatches(d.scope, cohort)) continue;
    const score = scopeSpecificity(d.scope);
    if (score > bestScore) {
      best = d;
      bestScore = score;
    }
  }
  return best;
}

/**
 * The merchant's fulfillment window, expressed as the human band they would have
 * published: "weeks 9–11". Derived from the window they ALREADY gave us in
 * onboarding, so a merchant answers no extra question and every order still
 * carries a disclosure. Never a date.
 */
export function windowToDisclosedBand(windowDays: { min: number; max: number }): string {
  const loW = Math.max(1, Math.round(Math.max(0, windowDays.min) / 7));
  const hiW = Math.max(loW, Math.round(Math.max(0, windowDays.max) / 7));
  return loW === hiW ? `about ${loW} weeks` : `weeks ${loW}–${hiW}`;
}

// ─── writes ─────────────────────────────────────────────────────────────────

export class InvalidStatusError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "InvalidStatusError";
  }
}

export interface RecordStatusInput {
  merchantId: string;
  stageKey: ResolvedStageKey;
  headline: string;
  detail?: string;
  confidenceBand: WeeksBand;
  scope?: StatusScope;
  updatedBy: string;
  source?: ProductionStatusSource;
  sourceRef?: string;
}

/** Strip empty scope fields so {} and {campaignName:""} both mean merchant-wide. */
function cleanScope(scope: StatusScope | undefined): StatusScope | undefined {
  if (!scope) return undefined;
  const out: StatusScope = {};
  if (scope.campaignName?.trim()) out.campaignName = scope.campaignName.trim();
  if (scope.wave?.trim()) out.wave = scope.wave.trim();
  if (scope.region?.trim()) out.region = scope.region.trim();
  return Object.keys(out).length > 0 ? out : undefined;
}

/**
 * Post a new current status. Append-only: the previous entry is kept forever, so
 * the evidence pack can prove WHAT WAS TOLD WHEN.
 *
 * Validation happens HERE, at the one door, because every reader downstream
 * (drafts, status pages, the deterministic engine's stage blurb) treats what it
 * finds on the board as customer-facing truth:
 *  - the headline is required and hard-date-linted (ADR-0002);
 *  - the detail is hard-date-linted;
 *  - the band is weeks, ordered, and non-negative — never a date.
 *
 * Also denormalizes the newest MERCHANT-WIDE status onto Merchant.productionStatus
 * so any surface holding a merchant can render it with no second read.
 */
export async function recordStatus(
  input: RecordStatusInput,
  now: Date = new Date(),
): Promise<ProductionStatusEntry> {
  const repos = getRepositories();
  const merchant = await repos.merchants.findById(input.merchantId);
  if (!merchant) throw new InvalidStatusError("unknown merchant");

  const headline = input.headline.trim();
  if (!headline) throw new InvalidStatusError("a status needs a headline — what is physically happening now");
  const detail = input.detail?.trim() || undefined;

  // Proof-only, enforced at the door. A hard date on the board would be copied
  // verbatim into every reply that reads it.
  if (containsHardDate(headline)) {
    throw new InvalidStatusError(
      "the headline names a hard date. Tideover never promises a date — say what is happening and let the weeks band carry the timing.",
    );
  }
  if (detail && containsHardDate(detail)) {
    throw new InvalidStatusError(
      "the detail names a hard date. Tideover never promises a date — say what is happening and let the weeks band carry the timing.",
    );
  }

  const minWeeks = Math.round(input.confidenceBand.minWeeks);
  const maxWeeks = Math.round(input.confidenceBand.maxWeeks);
  if (!Number.isFinite(minWeeks) || !Number.isFinite(maxWeeks) || minWeeks < 0) {
    throw new InvalidStatusError("the confidence band must be a whole number of weeks, zero or more");
  }
  if (maxWeeks < minWeeks) {
    throw new InvalidStatusError("the confidence band's upper bound cannot be below its lower bound");
  }
  const confidenceBand: WeeksBand = { minWeeks, maxWeeks };
  // The band is customer-facing the moment it is rendered; prove it is date-free.
  assertNoHardDate(formatWeeksBand(confidenceBand));

  const scope = cleanScope(input.scope);
  const entry: ProductionStatusEntry = {
    id: newId("pst"),
    merchantId: merchant.id,
    stageKey: input.stageKey,
    headline,
    ...(detail ? { detail } : {}),
    confidenceBand,
    ...(scope ? { scope } : {}),
    updatedAt: now.toISOString(),
    updatedBy: input.updatedBy,
    source: input.source ?? "manual",
    ...(input.sourceRef ? { sourceRef: input.sourceRef } : {}),
  };

  await repos.productionStatuses.record(entry);

  // Denormalize the newest merchant-wide status onto the merchant record.
  if (!scope) {
    const productionStatus: ProductionStatus = {
      stageKey: entry.stageKey,
      headline: entry.headline,
      ...(entry.detail ? { detail: entry.detail } : {}),
      confidenceBand: entry.confidenceBand,
      updatedAt: entry.updatedAt,
      updatedBy: entry.updatedBy,
    };
    await repos.merchants.update(merchant.id, { productionStatus });
  }

  return entry;
}

/**
 * The import seam's one call: turn candidates from an already-maintained source
 * into board entries. Deliberately thin — every candidate goes through the SAME
 * validation and the SAME append-only history as a hand-typed status, so a bad
 * row in a spreadsheet can never say something to a customer that an operator
 * would have been refused. Returns the entries it wrote; a rejected candidate
 * throws, so a caller batching a whole sheet should catch per-row.
 */
export async function importStatuses(
  merchantId: string,
  candidates: StatusImportCandidate[],
  source: ProductionStatusSource,
  updatedBy: string,
  now: Date = new Date(),
): Promise<ProductionStatusEntry[]> {
  const out: ProductionStatusEntry[] = [];
  for (const c of candidates) {
    out.push(await recordStatus({ merchantId, ...c, source, updatedBy }, now));
  }
  return out;
}

// ─── reads ──────────────────────────────────────────────────────────────────

/**
 * THE ACCESSOR. The current production status that speaks for this ONE order —
 * the most specific scoped status that applies, or the merchant-wide one, or null
 * when the merchant has posted nothing.
 *
 * This is what the drafting layer reads to put the merchant's real, current words
 * into the prompt, and what the read seam uses to resolve the order's live stage.
 */
export async function getCurrentStatus(
  merchantId: string,
  order: Order,
): Promise<ProductionStatusEntry | null> {
  const repos = getRepositories();
  const entries = await repos.productionStatuses.listByMerchant(merchantId);
  return resolveStatusFor(entries, order);
}

/** The merchant's whole append-only board history, oldest first. The evidence. */
export async function getStatusHistory(merchantId: string): Promise<ProductionStatusEntry[]> {
  const repos = getRepositories();
  return repos.productionStatuses.listByMerchant(merchantId);
}

/** The board as an operator manages it: the current status for each distinct scope. */
export async function getBoard(merchantId: string): Promise<ProductionStatusEntry[]> {
  return currentBoard(await getStatusHistory(merchantId));
}

/**
 * Every status this order was ever under, oldest first — "what we told you, and
 * when". The chargeback exhibit the evidence pack could not produce for a single
 * customer, because nothing in the product remembered what it had said.
 */
export function statusHistoryForOrder(
  entries: ProductionStatusEntry[],
  order: Order,
): ProductionStatusEntry[] {
  return entries
    .filter((e) => scopeApplies(e.scope, order))
    .sort((a, b) => (a.updatedAt < b.updatedAt ? -1 : a.updatedAt > b.updatedAt ? 1 : a.id < b.id ? -1 : 1));
}

/** Convenience for surfaces that hold a merchant but not the board. */
export function merchantWideStatus(merchant: Merchant): ProductionStatus | null {
  return merchant.productionStatus ?? null;
}
