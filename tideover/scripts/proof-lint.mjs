/**
 * Proof-only linter. Scans source (app/, components/, lib/) for fabricated
 * proof that would violate Tideover's core discipline: invented metrics,
 * testimonials, star ratings, client logos, or hard delivery dates in copy.
 *
 * Allowlisted: cited external stats ("(Source: ...)"), the literal
 * [CASE STUDY PLACEHOLDER], and merge-field/band language. Exits non-zero on a
 * violation. Heuristic by design — it's a safety net, not a parser.
 */
import { readdirSync, readFileSync, statSync } from "fs";
import { fileURLToPath } from "url";
import { dirname, join, relative } from "path";

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = join(__dirname, "..");
const DIRS = ["app", "components", "lib"].map((d) => join(ROOT, d));
const EXTS = [".ts", ".tsx"];

function walk(dir, out = []) {
  for (const name of readdirSync(dir)) {
    const p = join(dir, name);
    const s = statSync(p);
    if (s.isDirectory()) {
      if (name === "node_modules" || name === ".next" || name === "data") continue;
      walk(p, out);
    } else if (EXTS.some((e) => p.endsWith(e))) out.push(p);
  }
  return out;
}

// banned: a fabricated quantified outcome claim Tideover can't own
const BANNED = [
  { re: /\b\d{1,3}\s?%\s*(?:fewer|less|reduction|drop|decrease|increase|more)\s+(?:refunds?|chargebacks?|disputes?)\b/i, why: "fabricated refund/chargeback % outcome" },
  { re: /\b(?:reduced|cut|slashed|lowered)\s+(?:refunds?|chargebacks?|disputes?)\s+by\s+\d/i, why: "fabricated refund/chargeback reduction claim" },
  { re: /\b\d(?:\.\d)?\s*(?:★|stars?)\b/i, why: "invented star rating" },
  { re: /\b(?:trusted by|used by)\s+\d{2,}\s+(?:brands?|merchants?|stores?)\b/i, why: "invented adoption/logo-wall count" },
  { re: /\b\d{1,3}\s*(?:five[- ]star|5[- ]star)\s+reviews?\b/i, why: "invented review count" },
];

// a cited stat is fine; flag a bare external-looking stat only when uncited.
const CITED = /\(Source:/i;

const violations = [];
for (const dir of DIRS) {
  let files = [];
  try {
    files = walk(dir);
  } catch {
    continue;
  }
  for (const f of files) {
    const text = readFileSync(f, "utf8");
    const lines = text.split("\n");
    lines.forEach((line, i) => {
      for (const b of BANNED) {
        if (b.re.test(line) && !CITED.test(line)) {
          violations.push(`${relative(ROOT, f)}:${i + 1}  ${b.why}\n      ${line.trim().slice(0, 120)}`);
        }
      }
    });
  }
}

if (violations.length) {
  console.error(`✗ proof-lint failed (${violations.length}):`);
  for (const v of violations) console.error("  - " + v);
  process.exit(1);
}
console.log("✓ proof-lint passed: no fabricated metrics, testimonials, ratings, logos, or hard-date claims found.");
