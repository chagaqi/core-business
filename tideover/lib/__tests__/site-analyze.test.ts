import assert from "node:assert/strict";
import { test } from "node:test";
import {
  analyzeSite,
  assertUrlAllowed,
  extractFromHtml,
  isBlockedIp,
  type FetchLike,
  type LookupFn,
} from "@/lib/site-analyze";

// ---------------------------------------------------------------------------
// Fixtures
// ---------------------------------------------------------------------------

const KS_HTML = `<!doctype html><html><head>
<title>Acme Watch — Kickstarter</title>
<meta property="og:site_name" content="Acme Watch">
<meta name="theme-color" content="#1a73e8">
</head><body>
<script>window.current_project = {"name":"Acme Watch","rewards":[
{"title":"Early Bird","minimum":49,"estimated_delivery_on":"2026-03-01"},
{"title":"Standard Pledge","minimum":89,"estimated_delivery_on":"2026-04-01"},
{"title":"Collector Bundle","minimum":249,"estimated_delivery_on":"2026-05-01"}
]};</script>
</body></html>`;
const KS_URL = new URL("https://www.kickstarter.com/projects/acme/acme-watch");

const SHOPIFY_HTML = `<!doctype html><html><head>
<title>Nimbus Bottles</title>
<meta property="og:site_name" content="Nimbus Bottles">
<meta name="theme-color" content="#0f766e">
<script src="https://cdn.shopify.com/s/files/1/app.js"></script>
</head><body><p>estimated shipping March 2026.</p></body></html>`;
const SHOPIFY_URL = new URL("https://nimbus-bottles.com/");

const BARE_HTML = `<html><head><title>Handmade Ceramics | Studio Kiln</title></head><body>Hi</body></html>`;
const BARE_URL = new URL("https://studiokiln.example/");

// ---------------------------------------------------------------------------
// Extraction — Kickstarter
// ---------------------------------------------------------------------------

test("Kickstarter fixture: brand, accent, rewards, delivery, site gift candidates", () => {
  const a = extractFromHtml(KS_HTML, KS_URL);
  assert.equal(a.platform, "kickstarter");
  assert.equal(a.brandName, "Acme Watch");
  assert.equal(a.accentColor, "#1a73e8");
  assert.equal(a.estimatedDelivery, "May 2026"); // latest reward delivery
  assert.deepEqual(a.rewardTiers, [
    { title: "Early Bird", amountUsd: 49 },
    { title: "Standard Pledge", amountUsd: 89 },
    { title: "Collector Bundle", amountUsd: 249 },
  ]);
  // 3 tiers → base / mid / full spread, all grounded in reward titles.
  assert.equal(a.giftCandidates.length, 3);
  assert.ok(a.giftCandidates.every((g) => g.source === "site"));
  assert.deepEqual(
    a.giftCandidates.map((g) => g.tier),
    ["base", "mid", "full"],
  );
  assert.ok(a.giftCandidates[0].label.includes("Early Bird"));
  assert.ok(a.giftCandidates.some((g) => g.tier === "base"));
});

test("Kickstarter rewards parse tolerantly across amount shapes (cents + amount object)", () => {
  const html = `<html><head><title>Mixed</title></head><body><script>
window.current_project = {"rewards":[
{"title":"A","minimum_cents":1500},
{"title":"B","amount":{"amount":"42.00","currency":"USD"}},
{"title":"C","pledge_amount":"120"}
]};</script></body></html>`;
  const a = extractFromHtml(html, new URL("https://www.kickstarter.com/projects/x/y"));
  assert.deepEqual(a.rewardTiers, [
    { title: "A", amountUsd: 15 },
    { title: "B", amountUsd: 42 },
    { title: "C", amountUsd: 120 },
  ]);
});

// ---------------------------------------------------------------------------
// Extraction — Shopify + bare fallback
// ---------------------------------------------------------------------------

test("Shopify fixture: platform + brand + accent + generic ETA + fallback gifts", () => {
  const a = extractFromHtml(SHOPIFY_HTML, SHOPIFY_URL);
  assert.equal(a.platform, "shopify");
  assert.equal(a.brandName, "Nimbus Bottles");
  assert.equal(a.accentColor, "#0f766e");
  assert.equal(a.estimatedDelivery, "March 2026");
  assert.equal(a.rewardTiers, undefined);
  assert.equal(a.giftCandidates.length, 3);
  assert.ok(a.giftCandidates.every((g) => g.source === "fallback"));
  assert.ok(a.giftCandidates.some((g) => g.tier === "base"));
});

test("Bare HTML fallback: generic platform, shortest title segment, fallback gifts", () => {
  const a = extractFromHtml(BARE_HTML, BARE_URL);
  assert.equal(a.platform, "generic");
  assert.equal(a.brandName, "Studio Kiln"); // shortest meaningful title segment
  assert.equal(a.accentColor, undefined);
  assert.equal(a.estimatedDelivery, undefined);
  assert.ok(a.giftCandidates.every((g) => g.source === "fallback"));
});

test("accentColor rejects non-color theme-color values", () => {
  const html = `<html><head><meta name="theme-color" content="cornflowerblue"></head></html>`;
  assert.equal(extractFromHtml(html, BARE_URL).accentColor, undefined);
});

// ---------------------------------------------------------------------------
// SSRF: isBlockedIp
// ---------------------------------------------------------------------------

test("isBlockedIp blocks private / reserved / mapped ranges", () => {
  for (const ip of [
    "127.0.0.1",
    "10.1.2.3",
    "172.16.5.5",
    "172.31.255.255",
    "192.168.1.1",
    "169.254.169.254", // cloud metadata
    "100.64.0.1", // CGNAT
    "0.0.0.0",
    "224.0.0.1", // multicast
    "::1",
    "::",
    "fc00::1",
    "fd12:3456::1",
    "fe80::1",
    "::ffff:127.0.0.1", // IPv4-mapped loopback
    "::ffff:10.0.0.1",
  ]) {
    assert.equal(isBlockedIp(ip), true, `${ip} should be blocked`);
  }
});

test("isBlockedIp allows real public addresses", () => {
  for (const ip of ["8.8.8.8", "93.184.216.34", "1.1.1.1", "2606:2800:220:1:248:1893:25c8:1946"]) {
    assert.equal(isBlockedIp(ip), false, `${ip} should be allowed`);
  }
  assert.equal(isBlockedIp("not-an-ip"), true); // junk fails closed
});

// ---------------------------------------------------------------------------
// SSRF: assertUrlAllowed
// ---------------------------------------------------------------------------

const publicLookup: LookupFn = async () => [{ address: "93.184.216.34", family: 4 }];
const privateLookup: LookupFn = async () => [{ address: "10.0.0.5", family: 4 }];

test("assertUrlAllowed enforces scheme, port, host and resolved-IP rules", async () => {
  assert.equal((await assertUrlAllowed("ftp://example.com/")).ok, false);
  assert.equal((await assertUrlAllowed("file:///etc/passwd")).ok, false);

  const port = await assertUrlAllowed("http://93.184.216.34:8080/");
  assert.deepEqual(port, { ok: false, reason: "blocked-port" });

  const literalPrivate = await assertUrlAllowed("http://169.254.169.254/latest/meta-data/");
  assert.deepEqual(literalPrivate, { ok: false, reason: "blocked-ip" });

  assert.equal((await assertUrlAllowed("http://localhost/")).ok, false);

  const resolvesPrivate = await assertUrlAllowed("http://intranet.example/", {
    lookup: privateLookup,
  });
  assert.deepEqual(resolvesPrivate, { ok: false, reason: "blocked-ip" });

  const okResult = await assertUrlAllowed("https://example.com/path", { lookup: publicLookup });
  assert.equal(okResult.ok, true);
});

test("assertUrlAllowed treats a DNS failure as blocked", async () => {
  const failing: LookupFn = async () => {
    throw new Error("ENOTFOUND");
  };
  assert.deepEqual(await assertUrlAllowed("http://nope.example/", { lookup: failing }), {
    ok: false,
    reason: "dns-failed",
  });
});

// ---------------------------------------------------------------------------
// analyzeSite: fetch guards (content-type, size cap) + happy path (mocked fetch)
// ---------------------------------------------------------------------------

function htmlResponse(body: string, contentType = "text/html; charset=utf-8"): Response {
  return new Response(body, { status: 200, headers: { "content-type": contentType } });
}

test("analyzeSite rejects a non-HTML content-type", async () => {
  const fetchImpl: FetchLike = async () => htmlResponse("{}", "application/json");
  const res = await analyzeSite("http://93.184.216.34/", { fetchImpl });
  assert.deepEqual(res, { ok: false, reason: "not-html" });
});

test("analyzeSite enforces the response size cap", async () => {
  const big = "x".repeat(5000);
  const fetchImpl: FetchLike = async () => htmlResponse(`<html>${big}</html>`);
  const res = await analyzeSite("http://93.184.216.34/", { fetchImpl, maxBytes: 64 });
  assert.deepEqual(res, { ok: false, reason: "too-large" });
});

test("analyzeSite blocks a cross-domain redirect", async () => {
  const fetchImpl: FetchLike = async () =>
    new Response(null, { status: 302, headers: { location: "https://evil.test/" } });
  const res = await analyzeSite("https://example.com/", { fetchImpl, lookup: publicLookup });
  assert.deepEqual(res, { ok: false, reason: "cross-domain-redirect" });
});

test("analyzeSite happy path returns extracted analysis (mocked fetch)", async () => {
  const fetchImpl: FetchLike = async () => htmlResponse(KS_HTML);
  const res = await analyzeSite("https://www.kickstarter.com/projects/acme/acme-watch", {
    fetchImpl,
    lookup: publicLookup,
  });
  assert.equal(res.ok, true);
  if (res.ok) {
    assert.equal(res.brandName, "Acme Watch");
    assert.ok(res.giftCandidates.length >= 1);
    assert.equal(res.platform, "kickstarter");
  }
});

test("analyzeSite refuses an SSRF target before fetching", async () => {
  let called = false;
  const fetchImpl: FetchLike = async () => {
    called = true;
    return htmlResponse("<html></html>");
  };
  const res = await analyzeSite("http://169.254.169.254/", { fetchImpl });
  assert.deepEqual(res, { ok: false, reason: "blocked-ip" });
  assert.equal(called, false); // guard runs before any fetch
});
