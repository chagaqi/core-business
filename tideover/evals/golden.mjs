/**
 * Golden REGRESSION runner (ADR-0006, task OS4).
 *
 * Recomputes computeTicketIntelligence for every fixture in
 * evals/golden/goldens.json and diffs the result against its stored `expected`
 * block. Any mismatch fails with a readable per-field diff — catching unintended
 * engine output drift on known tickets.
 *
 * Runs REGARDLESS of review status: the goldens are a regression tripwire the
 * moment they exist. It additionally prints how many are still pending human
 * review (task D9) so the unverified status stays visible, but it does NOT fail
 * solely because a fixture is unreviewed.
 *
 * Regenerate deliberately (npm run gen-goldens) only alongside an explicit
 * engine-change / playbook-change acknowledgement — never to make a red run green.
 */
import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { computeTicketIntelligence } from "@/lib/engines/index";
import { containsHardDate } from "@/lib/proof";
import { loadSeed, catalogFor, MERGE_FIELD_RE, bannedSurvivor } from "./_shared.mjs";

const HERE = dirname(fileURLToPath(import.meta.url));
const GOLDENS = join(HERE, "golden", "goldens.json");

const fixtures = JSON.parse(readFileSync(GOLDENS, "utf8"));
const seed = loadSeed();

const failures = [];

function recordDiff(fx, field, expected, actual) {
  failures.push({ id: fx.id, field, expected, actual });
}

for (const fx of fixtures) {
  const { input, expected } = fx;
  const order = seed.byOrder.get(input.orderId);
  const customer = seed.byCustomer.get(input.customerId);
  const merchant = seed.byMerchant.get(input.merchantId);

  if (!order || !customer || !merchant) {
    recordDiff(fx, "input", "resolvable order/customer/merchant", "missing seed entity");
    continue;
  }

  const catalog = catalogFor(merchant, seed.gifts);
  const { risk, reassurance, gift } = computeTicketIntelligence({
    ticket: { sentiment: input.sentiment },
    order,
    customer,
    merchant,
    catalog,
    ticketsLast7d: input.ticketsLast7d,
    now: new Date(input.now),
  });
  const draft = reassurance.draftText;
  const giftId = gift.gift ? gift.gift.id : null;

  // ── snapshot fields ──────────────────────────────────────────────────────
  if (reassurance.stageKey !== expected.stageKey) recordDiff(fx, "stageKey", expected.stageKey, reassurance.stageKey);
  if (reassurance.overdue !== expected.overdue) recordDiff(fx, "overdue", expected.overdue, reassurance.overdue);
  if (reassurance.priority !== expected.priority) recordDiff(fx, "priority", expected.priority, reassurance.priority);
  if (risk.band !== expected.riskBand) recordDiff(fx, "riskBand", expected.riskBand, risk.band);
  if (risk.topDriver !== expected.topDriver) recordDiff(fx, "topDriver", expected.topDriver, risk.topDriver);
  if (giftId !== expected.giftId) recordDiff(fx, "giftId", expected.giftId, giftId);

  // ── draft phrase contracts ───────────────────────────────────────────────
  for (const phrase of expected.mustContain ?? []) {
    if (!draft.includes(phrase)) recordDiff(fx, "mustContain", `draft includes "${phrase}"`, "absent");
  }
  for (const phrase of expected.mustNotContain ?? []) {
    if (draft.includes(phrase)) recordDiff(fx, "mustNotContain", `draft excludes "${phrase}"`, "present");
  }

  // ── proof-only guards (reused, always on) — the "no digit/slash date, no
  //    leftover merge field, no banned word" contract holds on every recompute. ─
  if (containsHardDate(draft)) recordDiff(fx, "proof.hardDate", "no hard date", "hard date present");
  if (MERGE_FIELD_RE.test(draft)) recordDiff(fx, "proof.mergeField", "no unresolved merge field", "merge field present");
  const survivor = bannedSurvivor(draft, merchant.brand.banned);
  if (survivor !== null) recordDiff(fx, "proof.banned", "no banned word", `"${survivor}" survived`);
}

// ── review-status notice (informational, never a failure by itself) ─────────
const reviewed = fixtures.filter((f) => f.expected.reviewed).length;
const pending = fixtures.length - reviewed;
if (pending > 0) {
  console.log(`ℹ ${pending}/${fixtures.length} goldens still pending human review (D9) — regression tripwire only, not yet verified-correct.`);
}

// ── report ──────────────────────────────────────────────────────────────────
if (failures.length) {
  console.error(`✗ golden regression FAILED: ${failures.length} field diff(s) across ${fixtures.length} fixtures`);
  for (const f of failures) {
    console.error(`  - ${f.id} · ${f.field}\n      expected: ${JSON.stringify(f.expected)}\n      actual:   ${JSON.stringify(f.actual)}`);
  }
  console.error(
    "\n  If this change to engine/playbook output is intentional, acknowledge it and regenerate:\n" +
      "    npm run gen-goldens   (then re-review — new snapshots return to reviewed:false)",
  );
  process.exit(1);
}

console.log(`✓ golden regression passed: ${fixtures.length} fixtures match current engine output.`);
