/**
 * Deterministic seed generator. Produces lib/data/*.json with valid, signed
 * status tokens and full referential integrity. Ids and tokens are stable
 * across runs (seeded PRNG + deterministic tokens), so demo /status links are
 * stable — but dates are relative to the epoch (default: now), so output is
 * NOT byte-identical between runs unless SEED_EPOCH pins the clock.
 *
 * Run: node scripts/gen-seed.mjs
 *      SEED_EPOCH=2026-07-01T00:00:00Z node scripts/gen-seed.mjs  # pinned time
 *                                                                 # (eval goldens)
 *
 * Token signing MUST match lib/ids.ts (sha256 over raw, hex sliced to 10), using
 * the dev-fallback secret so the seeded tokens verify at runtime out of the box.
 */
import { createHmac } from "crypto";
import { writeFileSync, mkdirSync } from "fs";
import { fileURLToPath } from "url";
import { dirname, join } from "path";

const __dirname = dirname(fileURLToPath(import.meta.url));
const DATA = join(__dirname, "..", "lib", "data");
mkdirSync(DATA, { recursive: true });

const SECRET = process.env.STATUS_TOKEN_SECRET || "dev-only-change-me";
const ALPHABET = "0123456789abcdefghijklmnopqrstuvwxyz";

// ── seeded PRNG (mulberry32) ──
let _s = 0x9e3779b9;
function rng() {
  _s |= 0;
  _s = (_s + 0x6d2b79f5) | 0;
  let t = Math.imul(_s ^ (_s >>> 15), 1 | _s);
  t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
  return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
}
const pick = (arr) => arr[Math.floor(rng() * arr.length)];
const int = (lo, hi) => lo + Math.floor(rng() * (hi - lo + 1));

let _ctr = 0;
function nano(n) {
  // deterministic id chars from the PRNG stream
  let out = "";
  for (let i = 0; i < n; i++) out += ALPHABET[Math.floor(rng() * ALPHABET.length)];
  return out;
}
function id(prefix) {
  _ctr++;
  return `${prefix}_${nano(12)}`;
}
function statusToken() {
  const raw = nano(24);
  const mac = createHmac("sha256", SECRET).update(raw).digest("hex").slice(0, 10);
  return `${raw}.${mac}`;
}
// ADR-0007: deterministic, STABLE variant ids derived from
// merchantId+stageKey+stage via HMAC — NOT the PRNG stream — so re-seeding is
// idempotent AND generating variants never advances the PRNG that mints
// order/ticket ids + tokens (those stay byte-identical).
function variantId(merchantId, stageKey, stage) {
  const h = createHmac("sha256", SECRET)
    .update(`var:${merchantId}|${stageKey}|${stage ?? "base"}`)
    .digest("hex");
  let out = "";
  for (let i = 0; i < 12; i++) out += ALPHABET[parseInt(h.slice(i * 2, i * 2 + 2), 16) % ALPHABET.length];
  return `var_${out}`;
}
// Mirrors lib/engines/reassurance.ts dayStageFor (bucket only).
function dayStageKeyFor(daysInWait) {
  if (daysInWait <= 7) return "day-7";
  if (daysInWait <= 30) return "day-30";
  if (daysInWait <= 60) return "day-60";
  return "day-89";
}
// SEED_EPOCH pins "now" for reproducible output; default keeps demo data fresh.
const DAY_MS = 86400000;
const epoch = Date.parse(process.env.SEED_EPOCH ?? "") || Date.now();
const iso = (daysAgo) => new Date(epoch - daysAgo * DAY_MS).toISOString();

// ── ADR-0005: disclosed-ETA + campaign/wave labels + status-view log ──
// All derived deterministically from values already fixed above, so adding
// them never advances the PRNG that mints ids/tokens (those stay byte-stable).
const EN = "–"; // en dash – (band ranges, matches lib/time.ts)
const EM = "—"; // em dash — (native label separator)
const daysBetweenISO = (a, b) => Math.round((Date.parse(b) - Date.parse(a)) / DAY_MS);

// The estimate disclosed to the buyer at purchase: a human weeks-band covering
// the whole fulfillment window (never a hard date), consistent with the order's
// own window + day-stage. e.g. a ~75-day window → "weeks 9–11".
function disclosedValue(order) {
  const total = Math.max(1, daysBetweenISO(order.fulfillmentStart, order.fulfillmentEnd));
  const loW = Math.max(1, Math.round((total * 0.88) / 7));
  const hiW = Math.max(loW + 1, Math.round(total / 7));
  return `weeks ${loW}${EN}${hiW}`;
}
const DISCLOSE_SOURCES = ["campaign-page", "checkout", "update"];
function disclosedEtaFor(order, idx) {
  return {
    value: disclosedValue(order),
    source: DISCLOSE_SOURCES[idx % DISCLOSE_SOURCES.length],
    disclosedAt: order.createdAt,
  };
}
// Campaign/wave are pure display strings (no Wave CRUD — on the cut list), and
// native only to crowdfunding groups; new-preorder orders stay bare (no wave).
const CAMPAIGN_BY_MERCHANT = {
  mch_lumen0001: `Aurora Lantern ${EM} Kickstarter`,
  mch_atelier02: `Nordic Weekender ${EM} Kickstarter`,
};
const WAVE_BY_REGION = {
  US: `Wave 1 ${EM} US hub`,
  CA: `Wave 1 ${EM} US hub`,
  EU: `Wave 2 ${EM} EU hub`,
  UK: `Wave 2 ${EM} EU hub`,
  AU: `Wave 3 ${EM} APAC hub`,
};
function applyLabels(order) {
  if (order.group === "ks-backer" || order.group === "late-pledge") {
    order.campaignName = CAMPAIGN_BY_MERCHANT[order.merchantId] ?? `Campaign ${EM} Kickstarter`;
    order.wave = WAVE_BY_REGION[order.region] ?? `Wave 1 ${EM} main hub`;
  }
}
// Realistic view-log metadata. IP prefixes are the first two octets only
// (documentation/TEST-NET ranges) — never a full or identifying address.
const IP_PREFIXES = ["203.0", "198.51", "192.0", "72.14", "24.6", "81.2"];
const USER_AGENTS = [
  "Mozilla/5.0 (iPhone; CPU iPhone OS 17_5 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.5 Mobile/15E148 Safari/604.1",
  "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126.0.0.0 Safari/537.36",
  "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.4 Safari/605.1.15",
  "Mozilla/5.0 (Linux; Android 14; Pixel 8) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/125.0.0.0 Mobile Safari/537.36",
];

// ── shared stage definitions ──
const STAGES = [
  { key: "sourcing", label: "Sourcing", dayBand: { from: 0, to: 12 }, blurb: "components are being sourced" },
  { key: "tooling", label: "Tooling & sampling", dayBand: { from: 12, to: 32 }, blurb: "tooling and the first samples are underway" },
  { key: "production", label: "Production run", dayBand: { from: 32, to: 72 }, blurb: "your unit is on the production line" },
  { key: "qc", label: "QC & inspection", dayBand: { from: 72, to: 84 }, blurb: "your unit is going through quality control" },
  { key: "freight", label: "Freight", dayBand: { from: 84, to: 104 }, blurb: "your batch is in transit to the warehouse" },
  { key: "dispatch", label: "Pick, pack & dispatch", dayBand: { from: 104, to: 118 }, blurb: "your order is being packed for dispatch" },
];
const STAGE_KEYS = STAGES.map((s) => s.key);

function playbook(brandName, signoff) {
  const base7 = `Hey {first_name} — totally get that waiting on something you've already paid for can feel like a long time. Quick reassurance: your ${brandName} order is confirmed and on schedule — {stage_blurb}. Current window is {eta_band}, and I'll message you the moment it moves to the next stage so you don't have to ask. You're in good hands.`;
  const base30 = `Hi {first_name} — a month in, and I want you to have a real update, not a brush-off. Right now {stage_blurb}, and you're still tracking {eta_band}. Nothing about your order has slipped. I'll keep you posted as it moves.`;
  const base60 = `Totally fair to feel that at the two-month mark, {first_name} — you've been patient and I appreciate it. Here's exactly where things stand: {stage_blurb}. Current ship window is {eta_band}, and I'll send tracking the moment it generates. Want me to flag it for priority dispatch so you're first out the door?`;
  const base89 = `{first_name} — you've waited longer than anyone should have to, and I'm not going to give you a canned line. The honest status: {stage_blurb}. Your tracking is generating and I'll have it to you {eta_band}. I'd rather you let me see this through than route it to your bank — I'm on it personally.`;
  return {
    "day-7": { base: base7, byStage: { qc: base7.replace("on schedule", "in the home stretch"), dispatch: base7 } },
    "day-30": { base: base30, byStage: {} },
    "day-60": { base: base60, byStage: {} },
    "day-89": { base: base89, byStage: {} },
  };
}

// ── merchants ──
const merchants = [
  {
    id: "mch_lumen0001",
    name: "Lumen Forge",
    slug: "lumen-forge",
    isDemo: true,
    brand: {
      voice: "Warm, plain-spoken maker. Talks like a fellow builder, never corporate.",
      tone: ["warm", "earnest", "nerdy-technical"],
      banned: ["unfortunately", "please be advised", "as per"],
      signoff: "— The Lumen Forge crew",
      logoText: "Lumen Forge",
      colors: { primary: "#0E5366", bg: "#FBF8F2", ink: "#11252A" },
    },
    helpdesk: "gorgias",
    preorderApp: "PreProduct",
    fulfillmentWindowDays: { min: 95, max: 120 },
    stages: STAGES,
    playbook: playbook("Lumen Forge", "— The Lumen Forge crew"),
    ltvTiers: { standard: 0, high: 50000, vip: 200000 },
    giftCatalogIds: [],
    slaWindows: { amStart: "9:00", pmStart: "15:00", tz: "ET" },
    baseline: { capturedOn: iso(35), medianFrtSec: 27000, wismoPer100Orders: 150, ticketsPerWeek: 38, repeatWismoPct: 62 },
    createdAt: iso(40),
  },
  {
    id: "mch_atelier02",
    name: "Atelier Noord",
    slug: "atelier-noord",
    isDemo: true,
    brand: {
      voice: "Premium, understated, design-led. Calm confidence, no exclamation points.",
      tone: ["premium", "understated", "earnest"],
      banned: ["super", "guys", "!!"],
      signoff: "— Atelier Noord",
      logoText: "Atelier Noord",
      colors: { primary: "#0E5366", bg: "#FBF8F2", ink: "#11252A" },
    },
    helpdesk: "email",
    preorderApp: "Timesact",
    fulfillmentWindowDays: { min: 70, max: 100 },
    stages: STAGES,
    playbook: playbook("Atelier Noord", "— Atelier Noord"),
    ltvTiers: { standard: 0, high: 60000, vip: 250000 },
    giftCatalogIds: [],
    slaWindows: { amStart: "8:30", pmStart: "14:30", tz: "CET" },
    baseline: { capturedOn: iso(28), medianFrtSec: 19000, wismoPer100Orders: 95, ticketsPerWeek: 22, repeatWismoPct: 55 },
    createdAt: iso(33),
  },
];

// ── gifts (5 per merchant) ──
const giftKinds = [
  { kind: "early-access", name: "Early access to the next drop", cost: 0, pv: 4000, minLtv: 0, minWait: 30, minRisk: 40 },
  { kind: "founder-note", name: "Handwritten founder note", cost: 500, pv: 3000, minLtv: 0, minWait: 45, minRisk: 50 },
  { kind: "priority-dispatch", name: "Priority dispatch (first out the door)", cost: 1200, pv: 6000, minLtv: 50000, minWait: 45, minRisk: 60 },
  { kind: "digital-perk", name: "Digital perk pack (wallpapers + guide)", cost: 0, pv: 2000, minLtv: 0, minWait: 7, minRisk: 30 },
  { kind: "next-order-credit", name: "$25 next-order credit", cost: 2500, pv: 2500, minLtv: 60000, minWait: 60, minRisk: 65 },
];
const gifts = [];
for (const m of merchants) {
  for (const g of giftKinds) {
    const gid = id("gft");
    m.giftCatalogIds.push(gid);
    gifts.push({
      id: gid,
      merchantId: m.id,
      name: g.name,
      kind: g.kind,
      costCents: g.cost,
      perceivedValueCents: g.pv,
      eligibility: { minLtvCents: g.minLtv, minWaitDays: g.minWait, minRiskScore: g.minRisk },
    });
  }
}

// ── customers + orders ──
const FIRST = ["Dana", "Marcus", "Priya", "Tomás", "Ingrid", "Wes", "Aisha", "Liam", "Noor", "Felix", "Chen", "Rosa", "Kwame", "Sofia", "Otto", "Mara", "Devon", "Yuki", "Hassan", "Greta"];
const REGIONS = ["US", "EU", "UK", "CA", "AU"];
const GROUPS = ["ks-backer", "late-pledge", "new-preorder"];

const customers = [];
const orders = [];

for (const m of merchants) {
  const n = 15; // 15 customers per merchant → 30 total
  for (let i = 0; i < n; i++) {
    const cid = id("cus");
    const first = pick(FIRST);
    const orderCount = rng() < 0.25 ? 2 : 1;
    const custOrderIds = [];
    let ltv = 0;
    for (let o = 0; o < orderCount; o++) {
      const oid = id("ord");
      const value = int(6000, 38000) * (rng() < 0.15 ? 6 : 1); // some VIPs
      ltv += value;
      // spread days-in-wait across the 4 stages
      const waitBuckets = [5, 22, 48, 75, 95, 110];
      const wait = pick(waitBuckets) + int(-3, 3);
      const total = int(m.fulfillmentWindowDays.min, m.fulfillmentWindowDays.max);
      const stage = STAGE_KEYS[Math.min(STAGE_KEYS.length - 1, Math.floor((wait / total) * STAGE_KEYS.length))];
      orders.push({
        id: oid,
        merchantId: m.id,
        customerId: cid,
        group: pick(GROUPS),
        orderValueCents: value,
        createdAt: iso(wait + 1),
        fulfillmentStart: iso(wait),
        fulfillmentEnd: iso(wait - total),
        productionStage: stage,
        region: pick(REGIONS),
        statusToken: statusToken(),
        preorderEtaSource: pick(["metafield", "preorder-app", "manual"]),
      });
      custOrderIds.push(oid);
    }
    customers.push({
      id: cid,
      merchantId: m.id,
      email: `${first.toLowerCase()}${int(10, 99)}@example.com`,
      firstName: first,
      ltvCents: ltv,
      orderIds: custOrderIds,
      ticketCount: 0,
      lastSentiment: "calm",
    });
  }
}

// ── tickets ──
const SUBJECTS = {
  wismo: ["any update on my order?", "where is my order??", "did my order go through?", "hello — checking on my preorder"],
  refund: ["this is taking forever, I want a refund", "I'd like to cancel and get a refund", "starting to think I should just refund"],
  deposit: ["when is my balance charged?", "question about my deposit"],
  other: ["can I change my shipping address?", "quick question about my order"],
};
const SENT = ["calm", "calm", "anxious", "anxious", "hostile", "chargeback-threat"];
const BODIES = {
  wismo: "Hey — just making sure my order is still on track. Haven't heard anything in a while. Thanks!",
  refund: "It's been weeks and I still don't have my order. Honestly considering a refund at this point.",
  deposit: "I paid the deposit at checkout — when does the rest get charged, and does that change my ship window?",
  other: "Realized I need to update something on my order before it ships. Can you help?",
  chargeback: "Last chance before I dispute this with my bank. I paid and have nothing to show for it. This feels like a scam.",
};

const tickets = [];
// Lumen Forge gets the bulk (≥30/wk floor); Atelier fewer.
const ticketTargets = { mch_lumen0001: 30, mch_atelier02: 12 };
for (const m of merchants) {
  const mOrders = orders.filter((o) => o.merchantId === m.id);
  const count = ticketTargets[m.id];
  for (let i = 0; i < count; i++) {
    const ord = pick(mOrders);
    const cust = customers.find((c) => c.id === ord.customerId);
    const types = ["wismo", "wismo", "wismo", "refund", "deposit", "other"];
    const type = pick(types);
    let sentiment = pick(SENT);
    if (type === "refund" && rng() < 0.5) sentiment = pick(["hostile", "chargeback-threat"]);
    const isCb = sentiment === "chargeback-threat";
    const ageDays = int(0, 6);
    cust.ticketCount += 1;
    cust.lastSentiment = sentiment;
    tickets.push({
      id: id("tkt"),
      merchantId: m.id,
      customerId: cust.id,
      orderId: ord.id,
      channel: m.helpdesk,
      externalId: m.helpdesk === "mock" ? null : `${m.helpdesk}-${int(10000, 99999)}`,
      subject: isCb ? "LAST WARNING before chargeback" : pick(SUBJECTS[type]),
      body: isCb ? BODIES.chargeback : BODIES[type],
      type,
      sentiment,
      createdAt: iso(ageDays),
      firstResponseSec: null,
      status: "open",
      tags: ["presale", `presale:${type}`].concat(isCb ? ["presale:dispute-risk"] : []),
    });
  }
}

// ── showcase scenarios (make the demo land) ──
// A curated "hero" ticket on the first merchant: high-value VIP, overdue,
// chargeback-threat → lights up red + escalated + a gift recommendation, and
// sorts to the very top of the operator queue.
{
  const lumen = merchants[0];
  const heroCid = id("cus");
  const heroOid = id("ord");
  const heroTotal = 110;
  const heroWait = 116; // past the window → overdue
  customers.push({
    id: heroCid,
    merchantId: lumen.id,
    email: "dana.vip@example.com",
    firstName: "Dana",
    ltvCents: 96000,
    orderIds: [heroOid],
    ticketCount: 1,
    lastSentiment: "chargeback-threat",
  });
  orders.push({
    id: heroOid,
    merchantId: lumen.id,
    customerId: heroCid,
    group: "ks-backer",
    orderValueCents: 48000,
    createdAt: iso(heroWait + 1),
    fulfillmentStart: iso(heroWait),
    fulfillmentEnd: iso(heroWait - heroTotal),
    productionStage: "dispatch",
    region: "US",
    statusToken: statusToken(),
    preorderEtaSource: "metafield",
  });
  tickets.push({
    id: id("tkt"),
    merchantId: lumen.id,
    customerId: heroCid,
    orderId: heroOid,
    channel: lumen.helpdesk,
    externalId: `${lumen.helpdesk}-50001`,
    subject: "LAST WARNING before chargeback",
    body: BODIES.chargeback,
    type: "refund",
    sentiment: "chargeback-threat",
    createdAt: iso(0),
    firstResponseSec: null,
    status: "open",
    tags: ["presale", "presale:refund", "presale:dispute-risk"],
  });

  // Already-sent history so the dashboard shows a real before/after: fast
  // first-response times (vs the 7.5h baseline), logged saves, deflection.
  const lumenOrders = orders.filter((o) => o.merchantId === lumen.id && o.id !== heroOid);
  for (let i = 0; i < 12; i++) {
    const ord = pick(lumenOrders);
    const cust = customers.find((c) => c.id === ord.customerId);
    const isSave = i < 4; // dispute-risk turned around
    const giftSave = i < 2;
    cust.ticketCount += 1;
    const ageDays = int(2, 9);
    tickets.push({
      id: id("tkt"),
      merchantId: lumen.id,
      customerId: cust.id,
      orderId: ord.id,
      channel: lumen.helpdesk,
      externalId: `${lumen.helpdesk}-${int(20000, 29999)}`,
      subject: isSave ? "I was about to dispute, but…" : pick(SUBJECTS.wismo),
      body: isSave ? BODIES.refund : BODIES.wismo,
      type: isSave ? "refund" : "wismo",
      sentiment: isSave ? "anxious" : "calm",
      createdAt: iso(ageDays),
      firstResponseSec: int(900, 5200),
      status: "sent",
      sent: {
        text: "(approved day-stage reassurance reply)",
        approvedBy: "Chaga",
        sentAt: iso(ageDays),
        externalId: `mock_send_${i}`,
      },
      tags: ["presale", isSave ? "presale:dispute-risk" : "presale:wismo"].concat(
        giftSave ? ["gift-sent:priority-dispatch"] : [],
      ),
    });
  }
}

// ── social feed ──
const SOCIAL = [
  { platform: "twitter", author: "@backer_dana", text: "anyone else still waiting on their {b} preorder? starting to feel like a scam ngl", neg: true, brand: true, camp: false },
  { platform: "reddit", author: "u/kickstarter_burned", text: "Where is my order from {b}?? 80 days and no shipping update. considering a chargeback", neg: true, brand: true, camp: true },
  { platform: "instagram", author: "maker.fan", text: "loving the updates from {b}, can't wait for mine to ship!", neg: false, brand: true, camp: false },
  { platform: "twitter", author: "@gadget_grace", text: "the {b} campaign was so good, hope the delay is worth it", neg: false, brand: true, camp: true },
  { platform: "reddit", author: "u/preorder_pat", text: "is {b} legit? been months. no refund, no product. feeling ripped off", neg: true, brand: true, camp: false },
  { platform: "twitter", author: "@noise_account", text: "great weather today, going for a run", neg: false, brand: false, camp: false },
  { platform: "instagram", author: "design_daily", text: "{b} has the cleanest industrial design I've seen this year", neg: false, brand: true, camp: false },
  { platform: "reddit", author: "u/longwait_lou", text: "{b} delay thread — mine's at day 75, anyone heard anything? worried about a refund", neg: true, brand: true, camp: true },
];
const social = [];
let si = 0;
for (const m of merchants) {
  for (const s of SOCIAL) {
    si++;
    social.push({
      id: id("sig"),
      merchantId: m.id,
      platform: s.platform,
      author: s.author,
      text: s.text.replace("{b}", m.name),
      postedAt: iso(int(0, 5)),
      mentionsBrand: s.brand,
      mentionsCampaign: s.camp,
    });
  }
}

// ── ADR-0005: order fields (rng-free — appended after every id/token is fixed) ──
orders.forEach((o, idx) => {
  o.disclosedEta = disclosedEtaFor(o, idx);
  applyLabels(o);
});

// ── status-view log (append-only) ──
// Generated LAST so its PRNG draws can't shift any id/token above. Views land
// within each order's wait window [fulfillmentStart, now]. ~38% of orders get a
// view, a quarter of those get a second → a realistic spread of ~15–25 rows.
const statusViews = [];
for (const o of orders) {
  if (rng() >= 0.38) continue;
  const start = Date.parse(o.fulfillmentStart);
  const span = Math.max(DAY_MS, epoch - start);
  const n = rng() < 0.25 ? 2 : 1;
  for (let k = 0; k < n; k++) {
    statusViews.push({
      id: id("sv"),
      orderId: o.id,
      merchantId: o.merchantId,
      token: o.statusToken,
      viewedAt: new Date(start + Math.floor(rng() * span)).toISOString(),
      ipPrefix: pick(IP_PREFIXES),
      userAgent: pick(USER_AGENTS),
    });
  }
}

// ── ADR-0007 outcome ledger: script variants ──
// Migrate every playbook `base` + `byStage[x]` into an isDefault variant. Ids
// are HMAC-derived (no PRNG draw), so this block is byte-stable and never shifts
// any id/token generated above.
const scriptVariants = [];
for (const m of merchants) {
  for (const [stageKey, pb] of Object.entries(m.playbook)) {
    scriptVariants.push({
      id: variantId(m.id, stageKey, null),
      merchantId: m.id,
      stageKey,
      productionStage: null,
      text: pb.base,
      source: "merchant-default",
      isDefault: true,
      status: "active",
      parentVariantId: null,
      createdAt: m.createdAt,
    });
    for (const [ps, text] of Object.entries(pb.byStage)) {
      scriptVariants.push({
        id: variantId(m.id, stageKey, ps),
        merchantId: m.id,
        stageKey,
        productionStage: ps,
        text,
        source: "merchant-default",
        isDefault: true,
        status: "active",
        parentVariantId: null,
        createdAt: m.createdAt,
      });
    }
  }
}

// ── ADR-0007 outcome ledger: DEMO outcome events (~24) ──
// One reply_sent per picked ticket, attributed to the variant its order's
// day-stage selects (base or byStage), with a plausible editedRatio. Generated
// LAST so its PRNG draws can't shift any id/token above. Both seed merchants are
// isDemo, so every event inherits demo lineage (never counts toward real stats).
const variantByKey = new Map(
  scriptVariants.map((v) => [`${v.merchantId}|${v.stageKey}|${v.productionStage ?? "base"}`, v]),
);
const OE_SENTIMENTS = ["calm", "calm", "anxious", "anxious", "hostile", "chargeback-threat"];
const OE_TARGETS = { mch_lumen0001: 16, mch_atelier02: 8 };
const outcomeEvents = [];
for (const m of merchants) {
  const mTickets = tickets.filter((t) => t.merchantId === m.id);
  if (mTickets.length === 0) continue;
  const target = OE_TARGETS[m.id] ?? 8;
  for (let i = 0; i < target; i++) {
    const tkt = pick(mTickets);
    const order = orders.find((o) => o.id === tkt.orderId);
    if (!order) continue;
    const daysInWait = Math.round((epoch - Date.parse(order.fulfillmentStart)) / DAY_MS);
    const stageKey = dayStageKeyFor(daysInWait);
    const pb = m.playbook[stageKey];
    const ps = pb.byStage[order.productionStage] !== undefined ? order.productionStage : null;
    const variant = variantByKey.get(`${m.id}|${stageKey}|${ps ?? "base"}`);
    if (!variant) continue;
    // Plausible operator edit: 1-in-4 unchanged (0), else a light edit in [0,0.4).
    const editedRatio = rng() < 0.25 ? 0 : Math.round(rng() * 400) / 1000;
    outcomeEvents.push({
      id: id("oe"),
      merchantId: m.id,
      ticketId: tkt.id,
      orderId: order.id,
      customerId: tkt.customerId,
      variantId: variant.id,
      stageKey,
      sentimentAtSend: pick(OE_SENTIMENTS),
      kind: "reply_sent",
      observedAt: new Date(epoch - int(0, 8) * DAY_MS).toISOString(),
      meta: { editedRatio },
    });
  }
}

// ── write ──
const write = (name, data) => writeFileSync(join(DATA, name), JSON.stringify(data, null, 2) + "\n");
write("merchants.json", merchants);
write("gifts.json", gifts);
write("customers.json", customers);
write("orders.json", orders);
write("tickets.json", tickets);
write("social-feed.json", social);
write("status-views.json", statusViews);
write("script-variants.json", scriptVariants);
write("outcome-events.json", outcomeEvents);

console.log(
  `seeded: ${merchants.length} merchants, ${customers.length} customers, ${orders.length} orders, ${tickets.length} tickets, ${gifts.length} gifts, ${social.length} social signals, ${statusViews.length} status views, ${scriptVariants.length} script variants, ${outcomeEvents.length} outcome events`,
);
console.log("sample status links:");
orders.slice(0, 3).forEach((o) => console.log(`  /status/${o.statusToken}`));
