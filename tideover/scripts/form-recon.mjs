/**
 * Form-recon — READ-ONLY reconnaissance over the presale-store list (GTM store-side).
 *
 * For a sample of stores, fetches the likely contact pages and classifies each as an
 * open form (cleanly submittable), captcha-gated, blocked, or no-form. It NEVER
 * submits anything and NEVER tries to defeat a captcha or challenge — it just measures
 * how much of the list is reachable via an open contact form, so we decide whether
 * the submitter is worth building and at what expected volume.
 *
 * Run: node --experimental-strip-types --import ./scripts/register-hooks.mjs scripts/form-recon.mjs --sample 60
 */
import { readFileSync, writeFileSync, mkdirSync } from "node:fs";
import { dirname } from "node:path";
import { classify } from "@/lib/formfill/detect";

const UA = "Mozilla/5.0 (compatible; TideoverResearch/1.0; +https://www.tideover.app)";
const PATHS = ["/pages/contact", "/contact", "/contact-us", "/pages/contact-us"];
const CLASS_RANK = { "shopify-open": 0, "form-open": 1, "captcha-gated": 2, "blocked": 3, "no-form": 4, "error": 5 };

function parseArgs(argv) {
  const a = { sample: 60, csv: "presale_stores.csv", out: "scripts/_data/form-recon.json", concurrency: 8 };
  for (let i = 0; i < argv.length; i++) {
    const v = argv[i + 1];
    if (argv[i] === "--sample") { a.sample = parseInt(v, 10) || 60; i++; }
    else if (argv[i] === "--csv") { a.csv = v; i++; }
    else if (argv[i] === "--out") { a.out = v; i++; }
    else if (argv[i] === "--concurrency") { a.concurrency = Math.max(1, Math.min(16, parseInt(v, 10) || 8)); i++; }
  }
  return a;
}

function loadStores(csv) {
  const lines = readFileSync(csv, "utf8").split(/\r?\n/).filter(Boolean);
  const header = lines[0].split(",");
  const di = header.indexOf("domain"), wi = header.indexOf("website"), ai = header.indexOf("presale_app");
  return lines.slice(1).map((l) => {
    const c = l.split(",");
    return { domain: c[di], website: c[wi] || `https://${c[di]}`, presale_app: c[ai] || "" };
  }).filter((s) => s.domain);
}

function sample(rows, n) {
  if (rows.length <= n) return rows;
  const step = rows.length / n;
  const out = [];
  for (let i = 0; i < n; i++) out.push(rows[Math.floor(i * step)]);
  return out;
}

async function fetchPage(url) {
  const ctrl = new AbortController();
  const t = setTimeout(() => ctrl.abort(), 9000);
  try {
    const res = await fetch(url, { headers: { "User-Agent": UA, Accept: "text/html" }, redirect: "follow", signal: ctrl.signal });
    const html = await res.text();
    return { status: res.status, html: html.slice(0, 400_000) };
  } catch {
    return { status: 0, html: "" };
  } finally {
    clearTimeout(t);
  }
}

function base(website) {
  let u = website.trim();
  if (!/^https?:\/\//i.test(u)) u = `https://${u}`;
  return u.replace(/\/+$/, "");
}

async function reconStore(store) {
  const root = base(store.website);
  let best = null;
  for (const p of PATHS) {
    const url = root + p;
    const { status, html } = await fetchPage(url);
    if (status === 0 && !html) {
      best = best ?? { ...store, url, class: "error", platform: "generic", captcha: null };
      continue;
    }
    const c = classify(html, status);
    const rec = { ...store, url, class: c.class, platform: c.platform, captcha: c.captcha };
    if (best === null || CLASS_RANK[rec.class] < CLASS_RANK[best.class]) best = rec;
    if (rec.class === "shopify-open" || rec.class === "form-open") break; // found an open form, stop probing
  }
  return best ?? { ...store, url: root, class: "error", platform: "generic", captcha: null };
}

async function pool(items, size, fn) {
  const out = new Array(items.length);
  let i = 0;
  await Promise.all(
    Array.from({ length: Math.min(size, items.length) }, async () => {
      while (i < items.length) {
        const idx = i++;
        out[idx] = await fn(items[idx]);
      }
    }),
  );
  return out;
}

async function main() {
  const args = parseArgs(process.argv.slice(2));
  const all = loadStores(args.csv);
  const picked = sample(all, args.sample);
  console.log(`Loaded ${all.length} stores; reconning a spread of ${picked.length} (read-only, no submissions) ...`);

  const results = await pool(picked, args.concurrency, reconStore);

  const byClass = {};
  const byPlatform = {};
  for (const r of results) {
    byClass[r.class] = (byClass[r.class] || 0) + 1;
    byPlatform[r.platform] = (byPlatform[r.platform] || 0) + 1;
  }
  const open = (byClass["shopify-open"] || 0) + (byClass["form-open"] || 0);
  const pct = (n) => `${Math.round((n / results.length) * 100)}%`;

  console.log(`\n── classification (${results.length} stores) ──`);
  for (const k of Object.keys(CLASS_RANK)) if (byClass[k]) console.log(`  ${k.padEnd(14)} ${String(byClass[k]).padStart(3)}  ${pct(byClass[k])}`);
  console.log(`\n  → OPEN (submittable): ${open}  ${pct(open)}   |   captcha-gated: ${byClass["captcha-gated"] || 0}   blocked: ${byClass["blocked"] || 0}`);
  console.log(`  platform: ${Object.entries(byPlatform).map(([k, v]) => `${k} ${v}`).join(" · ")}`);
  console.log(`\n  Extrapolated to ${all.length}: ~${Math.round((open / results.length) * all.length).toLocaleString("en-US")} open-form-reachable stores.`);

  console.log(`\n  examples of open forms:`);
  results.filter((r) => r.class === "shopify-open" || r.class === "form-open").slice(0, 6).forEach((r) => console.log(`    ${r.class}  ${r.url}`));

  mkdirSync(dirname(args.out), { recursive: true });
  writeFileSync(args.out, JSON.stringify(results, null, 2));
  console.log(`\n  full classified sample → ${args.out}`);
}

main().catch((e) => { console.error(`✗ form-recon failed: ${e.message}`); process.exit(1); });
