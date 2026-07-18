/**
 * AUTHORITATIVE property sweep (ADR-0006, sprint goal 11).
 *
 * Drives computeTicketIntelligence (risk + reassurance + gift) across the full
 * cross-product of daysInWait × production stage × sentiment × representative
 * (order, customer, merchant) shapes from the real seed, plus the social-signal
 * engine over the seed feed. For EVERY produced result it asserts the proof-only
 * invariants that must hold for ALL inputs. These are properties, not snapshots,
 * so a green sweep is correct-by-construction and needs no human review.
 *
 * Fails loudly with the exact input on any violation; exits nonzero. Pure calls,
 * no I/O beyond reading the seed once — runs in well under 2s.
 */
import { computeTicketIntelligence, ltvPriorityBoost } from "@/lib/engines/index";
import { scoreFeed, DEFAULT_SOCIAL_CONFIG } from "@/lib/engines/social-signal";
import { containsHardDate } from "@/lib/proof";
import { computeTimeline, bandVariance, daysBetween } from "@/lib/time";
import {
  loadSeed,
  catalogFor,
  nowForDaysInWait,
  MERGE_FIELD_RE,
  bannedSurvivor,
  parseBandRange,
  isRelativeWindow,
} from "./_shared.mjs";

const DAYS_IN_WAIT = [0, 1, 3, 7, 14, 30, 45, 60, 75, 89, 100, 120, 150];
const STAGES = ["sourcing", "tooling", "production", "qc", "freight", "dispatch"];
const SENTIMENTS = ["calm", "anxious", "hostile", "chargeback-threat"];
const ESCALATING = new Set(["hostile", "chargeback-threat"]);
const TICKETS_LAST_7D = [0, 6]; // exercise velocity below + above the cap (4)
const VALID_RISK_BANDS = new Set(["at_risk", "watch", "standard"]);
const VALID_RISK_COLORS = new Set(["red", "amber", "green"]);
const VALID_DAY_STAGES = new Set(["day-7", "day-30", "day-60", "day-89"]);

const seed = loadSeed();

// ── representative shapes: min / median / max LTV customer per merchant, each
// with a real owned order. Spans the LTV range (which now feeds the priority
// boost, not the gift gate) and varies order value + region + group with real
// seed data. ────────────────────────────────────────────────────────────────
function pickShapes() {
  const shapes = [];
  for (const merchant of seed.merchants) {
    const catalog = catalogFor(merchant, seed.gifts);
    const custs = seed.customers
      .filter((c) => c.merchantId === merchant.id)
      .sort((a, b) => a.ltvCents - b.ltvCents);
    if (custs.length === 0) continue;
    const picks = [custs[0], custs[Math.floor(custs.length / 2)], custs[custs.length - 1]];
    const seen = new Set();
    for (const customer of picks) {
      if (seen.has(customer.id)) continue;
      seen.add(customer.id);
      const order = customer.orderIds.map((id) => seed.byOrder.get(id)).find(Boolean);
      if (!order) continue;
      shapes.push({ merchant, customer, order, catalog });
    }
  }
  return shapes;
}

const shapes = pickShapes();
if (shapes.length === 0) {
  console.error("✗ invariants: no representative shapes resolved from seed");
  process.exit(1);
}

let assertions = 0;
let combos = 0;
const violations = [];

function check(cond, ctx, msg) {
  assertions += 1;
  if (!cond) violations.push({ ...ctx, msg });
}

// ── per-ticket engine sweep ────────────────────────────────────────────────
for (const shape of shapes) {
  const { merchant, customer, catalog } = shape;

  // Non-vacuous banned-word proof (once per shape). The seed templates contain
  // no banned word, so the main-loop banned check alone can never exercise
  // stripBanned — deleting the stripper would pass silently. Ban a token we KNOW
  // reaches a draft (the customer's first name) and assert the redraft removes
  // it, proving the strip path actually runs.
  {
    const bctx = { merchant: merchant.id, customer: customer.id, check: "banned-strip-executes" };
    const baseOrder = { ...shape.order, productionStage: "production" };
    const bnow = nowForDaysInWait(baseOrder, 30);
    const baseArgs = { ticket: { sentiment: "calm" }, order: baseOrder, customer, catalog, ticketsLast7d: 1, now: bnow };
    const baseDraft = computeTicketIntelligence({ ...baseArgs, merchant }).reassurance.draftText;
    if (baseDraft.includes(customer.firstName)) {
      const bannedMerchant = {
        ...merchant,
        brand: { ...merchant.brand, banned: [...merchant.brand.banned, customer.firstName] },
      };
      const redraft = computeTicketIntelligence({ ...baseArgs, merchant: bannedMerchant }).reassurance.draftText;
      check(
        bannedSurvivor(redraft, [customer.firstName]) === null,
        bctx,
        "stripBanned failed to remove a banned token present in the draft",
      );
    } else {
      check(false, bctx, "expected the customer first name in the baseline draft to prove the strip path; not found");
    }
  }

  // Banned-word COLLISION garble (sim D1). The engine's own overdue eta_band is the
  // literal phrase "as soon as it's ready..."; a merchant who bans "soon" strips the
  // middle word and, before the fix, was left with "as as it's ready" — a doubled
  // function word that reads as broken software, shipped to a real customer in the run.
  // Force a clearly-overdue order and assert banning "soon" (a) leaves no survivor and
  // (b) introduces no NEW immediately-repeated word vs the unbanned draft (comparing to
  // baseline so any legitimately-repeated word in seed prose can't false-trip this).
  {
    const cctx = { merchant: merchant.id, customer: customer.id, check: "banned-collision-no-garble" };
    const odOrder = { ...shape.order, productionStage: "production" };
    const odNow = nowForDaysInWait(odOrder, 200);
    const odArgs = { ticket: { sentiment: "calm" }, order: odOrder, customer, catalog, ticketsLast7d: 1, now: odNow };
    const doubles = (s) => (s.match(/\b(\w+)\s+\1\b/gi) || []).length;
    const baseOverdue = computeTicketIntelligence({ ...odArgs, merchant }).reassurance.draftText;
    const soonMerchant = { ...merchant, brand: { ...merchant.brand, banned: [...merchant.brand.banned, "soon"] } };
    const bannedOverdue = computeTicketIntelligence({ ...odArgs, merchant: soonMerchant }).reassurance.draftText;
    check(bannedSurvivor(bannedOverdue, ["soon"]) === null, cctx, `banned "soon" survived the overdue draft`);
    check(
      doubles(bannedOverdue) <= doubles(baseOverdue),
      cctx,
      `banning "soon" introduced a doubled-word scar: ${bannedOverdue.slice(0, 90)}`,
    );
  }

  for (const stage of STAGES) {
    const order = { ...shape.order, productionStage: stage };
    for (const days of DAYS_IN_WAIT) {
      const now = nowForDaysInWait(order, days);
      for (const sentiment of SENTIMENTS) {
        for (const ticketsLast7d of TICKETS_LAST_7D) {
          combos += 1;
          const ctx = {
            merchant: merchant.id,
            order: order.id,
            customer: customer.id,
            stage,
            days,
            sentiment,
            ticketsLast7d,
          };

          let intel;
          try {
            intel = computeTicketIntelligence({
              ticket: { sentiment },
              order,
              customer,
              merchant,
              catalog,
              ticketsLast7d,
              now,
            });
          } catch (err) {
            // a throw (e.g. engine's own assertNoHardDate) is itself a violation.
            check(false, ctx, `computeTicketIntelligence threw: ${err.message}`);
            continue;
          }

          const { risk, reassurance, gift } = intel;
          const draft = reassurance.draftText;

          // 1. no hard date ever reaches a customer-facing draft.
          check(!containsHardDate(draft), ctx, "draft contains a hard date");

          // 2. no unresolved merge field / handlebars token survives.
          check(!MERGE_FIELD_RE.test(draft), ctx, "draft has an unresolved merge field");

          // 3. no merchant banned word survives the strip.
          const survivor = bannedSurvivor(draft, merchant.brand.banned);
          check(survivor === null, ctx, `banned word survived: ${survivor}`);

          // 4. confidence band is a relative window, never a date; lo <= hi.
          const band = reassurance.confidenceBand;
          check(!containsHardDate(band), ctx, `confidence band contains a date: ${band}`);
          check(isRelativeWindow(band), ctx, `confidence band is not a relative window: ${band}`);
          const range = parseBandRange(band);
          if (range) check(range.lo <= range.hi, ctx, `band lo>hi: ${band}`);

          // 4b. WINDOW-ANCHORED band (ADR-0002, proof-only). A non-overdue order's
          //     ship band must NEVER promise delivery before the merchant's own
          //     promised window remainder. computeTimeline anchors the lower bound
          //     to Math.max(stageRemaining, windowRemaining); a regression to
          //     Math.min renders the current STAGE's exit as the ship date and
          //     promises delivery weeks-to-months early (day 48 of a 104-day window
          //     → "ships in weeks 3–5"), the incoherent-band failure the ten-backer
          //     sim flagged as a company-killer. This makes that regression fail loud.
          const tl = computeTimeline(order, merchant, now);
          if (!tl.overdue) {
            const total = Math.max(1, daysBetween(order.fulfillmentStart, order.fulfillmentEnd));
            const windowRemaining = Math.max(0, total - tl.daysInWait);
            const remainingLo = tl.daysRemainingUpper - bandVariance(total);
            check(
              remainingLo >= windowRemaining,
              ctx,
              `band promises shipment before the promised window: lo=${remainingLo}d < windowRemaining=${windowRemaining}d (band="${band}")`,
            );
          }

          // 5. escalation happens IFF sentiment is hostile / chargeback-threat.
          const shouldEscalate = ESCALATING.has(sentiment);
          check(
            (reassurance.priority === "escalated") === shouldEscalate,
            ctx,
            `escalation mismatch: priority=${reassurance.priority} shouldEscalate=${shouldEscalate}`,
          );
          check(
            (reassurance.managerNote !== null) === shouldEscalate,
            ctx,
            "managerNote presence does not match escalation",
          );

          // 6. risk score in [0,100]; band/color/rank/stageKey within valid sets.
          check(
            Number.isFinite(risk.riskScore) && risk.riskScore >= 0 && risk.riskScore <= 100,
            ctx,
            `riskScore out of range: ${risk.riskScore}`,
          );
          check(VALID_RISK_BANDS.has(risk.band), ctx, `invalid risk band: ${risk.band}`);
          check(VALID_RISK_COLORS.has(risk.color), ctx, `invalid risk color: ${risk.color}`);
          // priorityRank = (escalated?0:1000) + (1000 - score) − LTV priority boost.
          // The boost is priority-only (never touches score/band) and 0 for
          // crowdfunding pledges — which every seed order is — so it re-derives
          // here EXACTLY from ltvPriorityBoost, keeping the sweep authoritative.
          const boost = ltvPriorityBoost(order, customer);
          const baseRank = (shouldEscalate ? 0 : 1000) + (1000 - risk.riskScore);
          check(
            risk.priorityRank === baseRank - boost,
            ctx,
            `priorityRank mismatch: got=${risk.priorityRank} expected=${baseRank - boost} (boost=${boost})`,
          );
          check(VALID_DAY_STAGES.has(reassurance.stageKey), ctx, `invalid stageKey: ${reassurance.stageKey}`);

          // 7. a gift is PROACTIVELY recommended IFF (a) the customer's risk band
          //    unlocks at least one catalog gift TIER (standard→base, watch→
          //    base+mid, at_risk|escalated→base+mid+full; LTV no longer gates) AND
          //    (b) a goodwill gesture is WARRANTED — escalated OR band watch/at_risk
          //    OR daysInWait ≥ 45 (deep wait). A calm, standard-band, short-wait
          //    ticket keeps its tier AVAILABLE but is NOT proactively recommended.
          //    Re-derived independently here; both directions.
          const unlockedTierSet =
            shouldEscalate || risk.band === "at_risk"
              ? new Set(["base", "mid", "full"])
              : risk.band === "watch"
                ? new Set(["base", "mid"])
                : new Set(["base"]);
          const unlockedGifts = catalog.filter((g) => unlockedTierSet.has(g.tier));
          const warranted = shouldEscalate || risk.band !== "standard" || days >= 45;
          const expectRecommend = unlockedGifts.length > 0 && warranted;
          check(
            (gift.gift !== null) === expectRecommend,
            ctx,
            `gift decision mismatch: got=${gift.gift ? gift.gift.id : null} expectRecommend=${expectRecommend} (band=${risk.band}, escalated=${shouldEscalate}, days=${days}, warranted=${warranted}, unlocked=${unlockedGifts.length})`,
          );
          // direction A, explicit: a recommended gift is itself an unlocked tier
          // AND is only recommended when warranted.
          if (gift.gift !== null) {
            check(unlockedTierSet.has(gift.gift.tier), ctx, `recommended a locked-tier gift: ${gift.gift.tier}`);
            check(warranted, ctx, `recommended a gift without a warrant (band=${risk.band}, escalated=${shouldEscalate}, days=${days})`);
          }
        }
      }
    }
  }
}

// ── social-signal sweep over the real seed feed ────────────────────────────
const threshold = DEFAULT_SOCIAL_CONFIG.flagThreshold;
for (const merchant of seed.merchants) {
  const posts = seed.social.filter((p) => p.merchantId === merchant.id);
  const scored = scoreFeed(posts, merchant);
  for (const s of scored) {
    combos += 1;
    const ctx = { merchant: merchant.id, signal: s.id, platform: s.platform };

    check(
      Number.isFinite(s.signalScore) && s.signalScore >= 0 && s.signalScore <= 100,
      ctx,
      `signalScore out of range: ${s.signalScore}`,
    );

    // flagged IFF relevance>0 && negativity>0 && score>=threshold. relevance +
    // negativity recomputed from the post + returned matchedKeywords.
    const relevance = (s.mentionsBrand ? 0.6 : 0) + (s.mentionsCampaign ? 0.4 : 0);
    const negativity = Math.min(1, s.matchedKeywords.length / 3);
    const expectFlagged = relevance > 0 && negativity > 0 && s.signalScore >= threshold;
    check(s.flagged === expectFlagged, ctx, `flag mismatch: flagged=${s.flagged} expected=${expectFlagged}`);

    if (s.flagged) {
      check(s.suggestedOutreach !== null, ctx, "flagged signal has no suggested outreach");
      if (s.suggestedOutreach) {
        check(!containsHardDate(s.suggestedOutreach), ctx, "outreach contains a hard date");
        check(!MERGE_FIELD_RE.test(s.suggestedOutreach), ctx, "outreach has an unresolved merge field");
        const survivor = bannedSurvivor(s.suggestedOutreach, merchant.brand.banned);
        check(survivor === null, ctx, `outreach banned word survived: ${survivor}`);
      }
    } else {
      check(s.suggestedOutreach === null, ctx, "unflagged signal still drafted outreach");
    }
  }
}

// ── report ─────────────────────────────────────────────────────────────────
if (violations.length) {
  console.error(`✗ invariants FAILED: ${violations.length} violation(s) across ${combos} combos`);
  for (const v of violations.slice(0, 40)) {
    const { msg, ...input } = v;
    console.error(`  - ${msg}\n      input: ${JSON.stringify(input)}`);
  }
  if (violations.length > 40) console.error(`  … and ${violations.length - 40} more`);
  process.exit(1);
}

console.log(
  `✓ invariants passed: ${assertions} assertions over ${combos} combos ` +
    `(${shapes.length} seed shapes × ${DAYS_IN_WAIT.length} daysInWait × ${STAGES.length} stages × ${SENTIMENTS.length} sentiments × ${TICKETS_LAST_7D.length} velocities + social feed). 0 violations.`,
);
