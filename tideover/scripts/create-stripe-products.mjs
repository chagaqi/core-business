/**
 * One-off: create the Tideover Products + Prices in Stripe from the published
 * ladder (ADR-0022). Raw fetch — no SDK needed for this — reading STRIPE_SECRET_KEY
 * from the environment (never printed). Run with the key loaded from .env.local:
 *
 *   npm run stripe:products
 *   (→ node --env-file-if-exists=.env.local scripts/create-stripe-products.mjs)
 *
 * Use a TEST key (sk_test_…) first — it creates everything in Stripe TEST mode, so
 * the whole trial→checkout→paid flow can be proven with fake cards before going
 * live. Prints the price-id env vars to add to .env.local + Vercel. Each product is
 * tagged metadata[tideover_plan] so a future re-run can be made idempotent; today,
 * run it ONCE per mode (test, then live) to avoid duplicate products.
 */
const KEY = process.env.STRIPE_SECRET_KEY;
if (!KEY) {
  console.error("✗ STRIPE_SECRET_KEY is not set. Add it to tideover/.env.local, then: npm run stripe:products");
  process.exit(1);
}
const MODE = KEY.startsWith("sk_live_") ? "LIVE" : "test";

async function stripe(path, params) {
  const res = await fetch(`https://api.stripe.com/v1/${path}`, {
    method: "POST",
    headers: { authorization: `Bearer ${KEY}`, "content-type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams(params),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(`${path} → ${res.status} ${JSON.stringify(data.error ?? data)}`);
  return data;
}

// unit_amount is in cents; annual = the published /pricing annual figure.
const PLANS = [
  { key: "starter", name: "Tideover Starter", monthly: 29_900, annual: 299_000 },
  { key: "growth", name: "Tideover Growth", monthly: 49_900, annual: 499_000 },
  { key: "scale", name: "Tideover Scale", monthly: 74_900, annual: 749_000 },
];

console.log(`Creating ${PLANS.length} products in Stripe ${MODE} mode…\n`);
const env = [];
for (const p of PLANS) {
  const product = await stripe("products", { name: p.name, "metadata[tideover_plan]": p.key });
  const m = await stripe("prices", {
    product: product.id,
    unit_amount: String(p.monthly),
    currency: "usd",
    "recurring[interval]": "month",
    "metadata[tideover_plan]": p.key,
    "metadata[tideover_interval]": "month",
  });
  const a = await stripe("prices", {
    product: product.id,
    unit_amount: String(p.annual),
    currency: "usd",
    "recurring[interval]": "year",
    "metadata[tideover_plan]": p.key,
    "metadata[tideover_interval]": "year",
  });
  console.log(`✓ ${p.name}: ${product.id}  ·  monthly ${m.id}  ·  annual ${a.id}`);
  env.push(`STRIPE_PRICE_${p.key.toUpperCase()}_MONTHLY=${m.id}`);
  env.push(`STRIPE_PRICE_${p.key.toUpperCase()}_ANNUAL=${a.id}`);
}

console.log(`\nAdd these to tideover/.env.local and Vercel (${MODE} mode):\n${env.join("\n")}`);
