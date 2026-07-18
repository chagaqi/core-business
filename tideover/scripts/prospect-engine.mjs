/**
 * Tideover prospect engine — the outbound pipeline (GTM §4).
 *
 * Orchestrates Dylan's Apify actors (ScrapersDelight crowdfunding scrapers +
 * local-business-enricher) into a ranked, CASL-logged, draft-ready outreach list.
 * The scoring / compliance / drafting logic is the tested lib/prospect/* modules;
 * this script is the Apify I/O + file glue only.
 *
 * Flow: scrape funded campaigns (enrichCreators=true → creator website) → keep ICP
 * fits → enrich those websites → email → score + CASL + draft → dedupe vs already-
 * contacted → rank → write outreach list.
 *
 * Run (real):   APIFY_TOKEN=... node --experimental-strip-types --import ./scripts/register-hooks.mjs scripts/prospect-engine.mjs --platform kickstarter --category "Tabletop Games" --max 100
 * Run (dry):    node --experimental-strip-types --import ./scripts/register-hooks.mjs scripts/prospect-engine.mjs --fixture scripts/_fixtures/prospect-sample.json
 *
 * Never sends anything. Output is a file for Dylan to review + approve (copy standard:
 * no AI email ships unedited). Marking-as-contacted happens after a real send, not here.
 */
import { readFileSync, writeFileSync, mkdirSync, existsSync } from "node:fs";
import { dirname } from "node:path";
import { isFit } from "@/lib/prospect/scoring";
import { buildLeads, dedupeLeads, rankLeads } from "@/lib/prospect/pipeline";

const OWNER = "ScrapersDelight";
const SLUGS = {
  kickstarter: "kickstarter-scraper",
  indiegogo: "indiegogo-scraper",
  gamefound: "gamefound-scraper",
};
const ENRICHER = "local-business-enricher";

function parseArgs(argv) {
  const a = { platform: "kickstarter", category: "", state: "successful", max: 100, fixture: "", out: "", contacted: "scripts/_data/contacted.json" };
  for (let i = 0; i < argv.length; i++) {
    const k = argv[i];
    const v = argv[i + 1];
    if (k === "--platform") { a.platform = v; i++; }
    else if (k === "--category") { a.category = v; i++; }
    else if (k === "--state") { a.state = v; i++; }
    else if (k === "--max") { a.max = parseInt(v, 10) || 100; i++; }
    else if (k === "--fixture") { a.fixture = v; i++; }
    else if (k === "--out") { a.out = v; i++; }
    else if (k === "--contacted") { a.contacted = v; i++; }
  }
  if (!a.out) a.out = `scripts/_data/prospects-${a.platform}.json`;
  return a;
}

async function runActor(slug, input) {
  const tok = process.env.APIFY_TOKEN;
  if (!tok) throw new Error("APIFY_TOKEN not set (needed for a live run; use --fixture for a dry run)");
  const url = `https://api.apify.com/v2/acts/${OWNER}~${slug}/run-sync-get-dataset-items?token=${tok}`;
  const res = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(input),
  });
  if (!res.ok) throw new Error(`${slug} ${res.status}: ${(await res.text()).slice(0, 300)}`);
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

function toCsv(leads) {
  const esc = (v) => `"${String(v ?? "").replace(/"/g, '""')}"`;
  const head = ["rank", "score", "tier", "platform", "project", "email", "confidence", "trigger", "subject", "project_url", "source_url"];
  const rows = leads.map((l, i) =>
    [i + 1, l.score.distressScore, l.score.tier, l.platform ?? "", l.projectName, l.email, l.emailConfidence ?? "", l.score.trigger, l.draft.subject, l.projectUrl, l.casl.sourceUrl].map(esc).join(","),
  );
  return [head.map(esc).join(","), ...rows].join("\n");
}

function writeOut(path, leads) {
  mkdirSync(dirname(path), { recursive: true });
  writeFileSync(path, JSON.stringify(leads, null, 2));
  const csvPath = path.replace(/\.json$/, ".csv");
  writeFileSync(csvPath, toCsv(leads));
  return csvPath;
}

async function main() {
  const args = parseArgs(process.argv.slice(2));
  const now = new Date();

  let campaigns;
  let contacts;

  if (args.fixture) {
    const fx = JSON.parse(readFileSync(args.fixture, "utf8"));
    campaigns = fx.campaigns ?? [];
    contacts = fx.contacts ?? [];
    console.log(`[dry-run] fixture: ${campaigns.length} campaigns, ${contacts.length} contacts`);
  } else {
    const slug = SLUGS[args.platform];
    if (!slug) throw new Error(`unknown platform "${args.platform}" (kickstarter|indiegogo|gamefound)`);
    console.log(`[1/3] scraping ${args.platform} state=${args.state}${args.category ? ` category="${args.category}"` : ""} max=${args.max} ...`);
    campaigns = await runActor(slug, {
      mode: "search",
      searchState: args.state,
      category: args.category || undefined,
      maxItems: args.max,
      enrichCreators: true,
    });
    campaigns = campaigns.map((c) => ({ ...c, platform: args.platform }));
    console.log(`      ${campaigns.length} campaigns scraped`);

    const fits = campaigns.filter(isFit);
    console.log(`[2/3] ${fits.length} ICP fits → enriching creator sites for a contact ...`);
    const businesses = fits.map((c) => ({ id: c.pid, website: c.website, company: c.project_name }));
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
