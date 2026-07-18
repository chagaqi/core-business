/**
 * Tideover prospect engine — the outbound pipeline (GTM §4).
 *
 * Orchestrates Dylan's Apify actors (ScrapersDelight crowdfunding scrapers +
 * local-business-enricher) into a ranked, CASL-logged, draft-ready outreach list.
 * The scoring / compliance / drafting logic is the tested lib/prospect/* modules;
 * this script is the Apify I/O + file glue only.
 *
 * Flow: scrape campaigns FUNDED 21–180 DAYS AGO (the mid-fulfillment window, peak
 * WISMO — verified: a default "successful" scrape returns tiny just-ended campaigns)
 * with enrichCreators=true → keep ICP fits → enrich each fit's best OWN-domain (not
 * a Gumroad/Patreon link) → email → score + CASL + draft → dedupe vs already-
 * contacted → rank → write outreach list.
 *
 * Run (real):  APIFY_TOKEN=... node --experimental-strip-types --import ./scripts/register-hooks.mjs scripts/prospect-engine.mjs --platform kickstarter --category "Tabletop Games" --max 100
 * Run (dry):   node --experimental-strip-types --import ./scripts/register-hooks.mjs scripts/prospect-engine.mjs --fixture scripts/_fixtures/prospect-sample.json --out scripts/_data/dry.json
 *
 * Never sends anything. Output is a file for Dylan to review + approve (copy standard:
 * no AI email ships unedited). Marking-as-contacted happens after a real send, not here.
 */
import { readFileSync, writeFileSync, mkdirSync, existsSync } from "node:fs";
import { dirname } from "node:path";
import { isFit, bestEnrichableSite } from "@/lib/prospect/scoring";
import { buildLeads, dedupeLeads, rankLeads } from "@/lib/prospect/pipeline";

const OWNER = "ScrapersDelight";
const SLUGS = { kickstarter: "kickstarter-scraper", indiegogo: "indiegogo-scraper", gamefound: "gamefound-scraper" };
const ENRICHER = "local-business-enricher";
const APIFY = "https://api.apify.com/v2";
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

const VALUE_FLAGS = new Set([
  "--platform", "--category", "--state", "--max", "--funded-min-days", "--funded-max-days", "--fixture", "--out", "--contacted",
]);

function intArg(flag, v, min = 0) {
  const n = Number(v);
  if (!Number.isInteger(n) || n < min) throw new Error(`${flag} must be an integer >= ${min}, got "${v}"`);
  return n;
}

function parseArgs(argv) {
  const a = { platform: "kickstarter", category: "", state: "successful", max: 100, fundedMinDays: 21, fundedMaxDays: 180, fixture: "", out: "", contacted: "scripts/_data/contacted.json" };
  for (let i = 0; i < argv.length; i++) {
    const k = argv[i];
    if (!VALUE_FLAGS.has(k)) throw new Error(`unknown or misplaced argument "${k}"`);
    const v = argv[i + 1];
    if (v === undefined || VALUE_FLAGS.has(v)) throw new Error(`flag ${k} needs a value`);
    i++;
    if (k === "--platform") a.platform = v;
    else if (k === "--category") a.category = v;
    else if (k === "--state") a.state = v;
    else if (k === "--max") a.max = intArg(k, v);
    else if (k === "--funded-min-days") a.fundedMinDays = intArg(k, v);
    else if (k === "--funded-max-days") a.fundedMaxDays = intArg(k, v);
    else if (k === "--fixture") a.fixture = v;
    else if (k === "--out") a.out = v;
    else if (k === "--contacted") a.contacted = v;
  }
  if (!a.out) a.out = `scripts/_data/prospects-${a.platform}.json`;
  if (a.fundedMinDays >= a.fundedMaxDays) throw new Error(`--funded-min-days (${a.fundedMinDays}) must be < --funded-max-days (${a.fundedMaxDays})`);
  return a;
}

function token() {
  const t = process.env.APIFY_TOKEN;
  if (!t) throw new Error("APIFY_TOKEN not set (needed for a live run; use --fixture for a dry run)");
  return t;
}

/**
 * Async run: start → poll to completion → fetch dataset items. Avoids the 300s
 * synchronous ceiling that a large --max + per-creator enrichment would blow through
 * mid-run (after the compute was already billed).
 */
async function runActor(slug, input) {
  const t = token();
  const start = await fetch(`${APIFY}/acts/${OWNER}~${slug}/runs?token=${t}`, {
    method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(input),
  });
  if (!start.ok) throw new Error(`${slug} start ${start.status}: ${(await start.text()).slice(0, 300)}`);
  const { data } = await start.json();
  const { id: runId, defaultDatasetId: datasetId } = data;
  let status = data.status;
  const stopAt = Date.now() + 20 * 60 * 1000; // 20-minute overall cap
  while (status === "READY" || status === "RUNNING") {
    if (Date.now() > stopAt) throw new Error(`${slug} run ${runId} still ${status} after 20m — aborting`);
    await sleep(5000);
    const st = await fetch(`${APIFY}/actor-runs/${runId}?token=${t}`);
    if (!st.ok) throw new Error(`${slug} status poll ${st.status}`);
    status = (await st.json()).data.status;
  }
  if (status !== "SUCCEEDED") throw new Error(`${slug} run ${runId} ended ${status}`);
  const res = await fetch(`${APIFY}/datasets/${datasetId}/items?format=json&clean=true&token=${t}`);
  if (!res.ok) throw new Error(`${slug} items ${res.status}: ${(await res.text()).slice(0, 200)}`);
  const items = await res.json();
  if (!Array.isArray(items)) throw new Error(`${slug}: expected an array, got ${typeof items}`);
  return items;
}

function loadSeen(path) {
  if (!existsSync(path)) return new Set();
  try {
    const arr = JSON.parse(readFileSync(path, "utf8"));
    return new Set((Array.isArray(arr) ? arr : []).map((s) => String(s).toLowerCase()));
  } catch {
    return new Set();
  }
}

/**
 * CSV cell escaping that ALSO neutralizes spreadsheet formula injection: a value
 * beginning with = + - @ (or a tab/CR that leads a cell) is prefixed with a single
 * quote so Excel/Sheets render it as text, not a live formula reading from untrusted
 * scraped fields (project titles, source URLs).
 */
function csvCell(v) {
  let s = String(v ?? "");
  if (/^[=+\-@\t\r]/.test(s)) s = `'${s}`;
  return `"${s.replace(/"/g, '""')}"`;
}

function toCsv(leads) {
  const head = ["rank", "score", "tier", "platform", "project", "email", "confidence", "trigger", "subject", "project_url", "source_url"];
  const rows = leads.map((l, i) =>
    [i + 1, l.score.distressScore, l.score.tier, l.platform ?? "", l.projectName, l.email, l.emailConfidence ?? "", l.score.trigger, l.draft.subject, l.projectUrl, l.casl.sourceUrl].map(csvCell).join(","),
  );
  return [head.map(csvCell).join(","), ...rows].join("\n");
}

function writeOut(path, leads) {
  mkdirSync(dirname(path), { recursive: true });
  writeFileSync(path, JSON.stringify(leads, null, 2));
  const csvPath = path.endsWith(".json") ? path.replace(/\.json$/, ".csv") : `${path}.csv`;
  writeFileSync(csvPath, toCsv(leads));
  return csvPath;
}

const isoDaysAgo = (daysAgo, now) => new Date(now.getTime() - daysAgo * 86_400_000).toISOString().slice(0, 10);

async function main() {
  const args = parseArgs(process.argv.slice(2));
  const now = new Date();

  if (!/_data[/\\]/.test(args.out)) {
    console.warn(`⚠ output "${args.out}" is outside scripts/_data/ — it holds scraped contact emails (PII). Do not commit it.`);
  }

  let campaigns, contacts;

  if (args.fixture) {
    const fx = JSON.parse(readFileSync(args.fixture, "utf8"));
    const raw = fx.campaigns ?? [];
    campaigns = raw.filter(isFit); // mirror the live fit filter in the dry run
    contacts = fx.contacts ?? [];
    console.log(`[dry-run] fixture: ${raw.length} campaigns (${campaigns.length} ICP fits), ${contacts.length} contacts`);
  } else {
    const slug = SLUGS[args.platform];
    if (!slug) throw new Error(`unknown platform "${args.platform}" (kickstarter|indiegogo|gamefound)`);
    const deadlineAfter = isoDaysAgo(args.fundedMaxDays, now);
    const deadlineBefore = isoDaysAgo(args.fundedMinDays, now);
    console.log(`[1/3] scraping ${args.platform} state=${args.state}${args.category ? ` category="${args.category}"` : ""} funded ${args.fundedMinDays}-${args.fundedMaxDays}d ago (${deadlineAfter}..${deadlineBefore}) max=${args.max} ...`);
    const scraped = await runActor(slug, {
      mode: "search", searchState: args.state, category: args.category || undefined,
      deadlineAfter, deadlineBefore, maxItems: args.max, enrichCreators: true,
    });
    const withPlatform = scraped.map((c) => ({ ...c, platform: args.platform }));
    console.log(`      ${withPlatform.length} campaigns scraped`);

    const fits = withPlatform.filter(isFit);
    console.log(`[2/3] ${fits.length} ICP fits → enriching creator sites for a contact ...`);
    const businesses = fits
      .map((c) => ({ id: c.pid, website: bestEnrichableSite(c), company: c.project_name }))
      .filter((b) => b.website);
    contacts = businesses.length ? await runActor(ENRICHER, { businesses }) : [];
    console.log(`      ${contacts.filter((c) => c.email).length} contacts with an email`);
    campaigns = fits;
  }

  console.log(`[3/3] scoring, CASL, drafting, dedupe, ranking ...`);
  const seen = loadSeen(args.contacted);
  const leads = rankLeads(dedupeLeads(buildLeads(campaigns, contacts, now), seen));

  const csvPath = writeOut(args.out, leads);
  const hot = leads.filter((l) => l.score.tier === "hot").length;
  const warm = leads.filter((l) => l.score.tier === "warm").length;
  console.log(`\n✓ ${leads.length} outreach-ready leads (${hot} hot, ${warm} warm), ${seen.size} suppressed as already-contacted`);
  console.log(`  → ${args.out}`);
  console.log(`  → ${csvPath}`);
  console.log(`\nNothing sent. Review + approve the drafts before any send (copy standard). Mark contacted after sending.`);
}

main().catch((err) => {
  console.error(`✗ prospect-engine failed: ${err.message}`);
  process.exit(1);
});
