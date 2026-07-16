/**
 * Post-deploy production smoke test. Hits the LIVE public site and asserts the
 * surfaces a prospect would see are healthy, and — extending the proof-only
 * doctrine into production — that the rendered customer status page carries a
 * confidence band and NO hard calendar date.
 *
 * Target defaults to the public custom domain (the deployment-specific *.vercel.app
 * URL sits behind Vercel SSO and 302s, so never smoke that one). Override with
 * SMOKE_URL=https://... . Reads a real status token from the seed so it never
 * hard-codes one that a reseed could invalidate.
 *
 * Run: npm run smoke   (or SMOKE_URL=https://staging... node scripts/smoke.mjs)
 * Exits non-zero on the first failure so CI / the release ritual can gate on it.
 */
import { createHmac } from "crypto";
import { readFileSync } from "fs";
import { dirname, join } from "path";
import { fileURLToPath } from "url";

const BASE = (process.env.SMOKE_URL ?? "https://www.tideover.app").replace(/\/$/, "");
const __dirname = dirname(fileURLToPath(import.meta.url));

// A valid signed status token from the seed (first order). Reading it keeps the
// smoke test correct across reseeds instead of pinning a literal token.
const orders = JSON.parse(readFileSync(join(__dirname, "..", "lib", "data", "orders.json"), "utf8"));
const seedToken = orders.find((o) => o.statusToken)?.statusToken;
if (!seedToken) {
  console.error("smoke: no statusToken in seed — cannot test /status");
  process.exit(1);
}

// The committed seed is signed with the DEV fallback secret; a deployed
// environment verifies with its own STATUS_TOKEN_SECRET (and seed-mongo.mjs
// re-signs at import to match). So the smoke must re-sign its test token the
// same way or every /status check false-fails against prod (exactly what
// hid the dead demo status links from 07-12 to 07-16). Under the fallback
// secret this is a byte-identical no-op. Requires the target environment's
// STATUS_TOKEN_SECRET in the env — the npm script loads .env.local.
const tokenSecret = process.env.STATUS_TOKEN_SECRET || "dev-only-change-me";
const raw = seedToken.split(".")[0];
const token = `${raw}.${createHmac("sha256", tokenSecret).update(raw).digest("hex").slice(0, 10)}`;
if (!process.env.STATUS_TOKEN_SECRET) {
  console.warn("smoke: STATUS_TOKEN_SECRET not in env — using the dev-fallback signature (only valid against a local/dev target)");
}

// Calendar-date shapes that must NEVER appear in a customer-facing status page
// (the band is always a relative window). Deliberately conservative: ISO dates,
// M/D/Y or D/M/Y, and "Month D" / "D Month" forms.
const MONTHS = "(?:Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)[a-z]*";
const HARD_DATE = new RegExp(
  [
    "\\b\\d{4}-\\d{2}-\\d{2}\\b", // 2026-07-03
    "\\b\\d{1,2}/\\d{1,2}/\\d{2,4}\\b", // 7/3/2026
    `\\b${MONTHS}\\s+\\d{1,2}(?:st|nd|rd|th)?\\b`, // July 3 / Jul 3rd
    `\\b\\d{1,2}(?:st|nd|rd|th)?\\s+${MONTHS}\\b`, // 3 July
  ].join("|"),
  "i",
);

const results = [];
function record(name, ok, detail = "") {
  results.push({ name, ok, detail });
  console.log(`${ok ? "✓" : "✗"}  ${name}${detail ? `  — ${detail}` : ""}`);
}

async function get(path) {
  const res = await fetch(`${BASE}${path}`, { redirect: "manual", headers: { "user-agent": "tideover-smoke" } });
  const body = res.status === 200 ? await res.text() : "";
  return { status: res.status, body };
}

async function main() {
  console.log(`smoke: ${BASE}\n`);

  // 1. Public surfaces return 200.
  for (const path of ["/", "/app", "/app/inbox", "/app/scripts", "/security", "/privacy", "/book"]) {
    try {
      const { status } = await get(path);
      record(`GET ${path} → 200`, status === 200, status === 200 ? "" : `got ${status}`);
    } catch (e) {
      record(`GET ${path} → 200`, false, e.message);
    }
  }

  // 2. Customer status page: 200, renders a band, and carries NO hard date.
  try {
    const { status, body } = await get(`/status/${token}`);
    record(`GET /status/<token> → 200`, status === 200, status === 200 ? "" : `got ${status}`);
    if (status === 200) {
      record("status page renders a confidence band", /weeks?|window|day\s+\d/i.test(body));
      const m = body.match(HARD_DATE);
      record("status page contains NO hard date (proof-only)", !m, m ? `found "${m[0]}"` : "");
    }
  } catch (e) {
    record("GET /status/<token>", false, e.message);
  }

  // 3. Status API returns valid JSON.
  try {
    const res = await fetch(`${BASE}/api/status/${token}`, { headers: { "user-agent": "tideover-smoke" } });
    const ok = res.status === 200;
    let json = null;
    if (ok) {
      try {
        json = await res.json();
      } catch {
        /* handled below */
      }
    }
    record("GET /api/status/<token> → valid JSON", ok && json != null, ok ? (json ? "" : "not JSON") : `got ${res.status}`);
  } catch (e) {
    record("GET /api/status/<token>", false, e.message);
  }

  // 4. Real-app host gate (ADR-0017), opt-in via SMOKE_REAL_URL. Points at the
  //    live operator subdomain (e.g. https://app.tideover.app). Asserts the auth
  //    gate is STRUCTURAL: an operator route must NOT return 200 (it 401s for an
  //    API path, or redirects unauthenticated browsers to /login), while a
  //    public route still 200s. Skipped entirely when SMOKE_REAL_URL is unset.
  const realBase = process.env.SMOKE_REAL_URL?.replace(/\/$/, "");
  if (realBase) {
    console.log(`\nreal-mode gate: ${realBase}`);
    async function getReal(path) {
      const res = await fetch(`${realBase}${path}`, {
        redirect: "manual",
        headers: { "user-agent": "tideover-smoke" },
      });
      return { status: res.status, location: res.headers.get("location") ?? "" };
    }
    // Operator route: must be gated — NOT 200. Accept 401 or a redirect to /login.
    try {
      const { status, location } = await getReal("/app");
      const redirectToLogin = status >= 300 && status < 400 && /\/login\b/.test(location);
      const gated = status === 401 || redirectToLogin;
      record(
        "real /app is gated (401 or redirect to /login, never 200)",
        gated,
        gated ? `got ${status}` : `got ${status}${location ? ` → ${location}` : ""}`,
      );
    } catch (e) {
      record("real /app is gated", false, e.message);
    }
    // Public route: still open on the real host.
    try {
      const { status } = await getReal("/");
      record("real / (public) → 200", status === 200, status === 200 ? "" : `got ${status}`);
    } catch (e) {
      record("real / (public) → 200", false, e.message);
    }
  }

  const failed = results.filter((r) => !r.ok);
  console.log(`\n${results.length - failed.length}/${results.length} checks passed.`);
  if (failed.length) {
    console.error(`SMOKE FAILED: ${failed.map((f) => f.name).join("; ")}`);
    process.exit(1);
  }
  console.log("SMOKE PASSED");
}

main().catch((e) => {
  console.error("smoke: unexpected error", e);
  process.exit(1);
});
