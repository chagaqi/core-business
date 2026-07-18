import { lookup } from "node:dns/promises";
import { isIP } from "node:net";

/**
 * Deterministic website / Kickstarter analysis for onboarding autofill (UX-90).
 *
 * The wizard sends a merchant's own site or campaign URL; this module fetches it
 * behind a strict SSRF guard and pulls brand + reward signals out with regex /
 * JSON / meta-tag parsing only — NO LLM, NO network in the extraction layer, so
 * the whole thing is unit-testable on inline HTML. An LLM refinement pass can
 * layer on later; nothing here depends on a key existing.
 *
 * Everything is fail-soft: an absent or unparseable field is simply omitted, and
 * a page that yields nothing still returns generic-but-safe fallback gift
 * candidates the wizard can show as suggestions (clearly flagged not-site-derived).
 *
 * SECURITY: /api/analyze fetches an operator-supplied URL, so this is an SSRF
 * surface. `assertUrlAllowed` is the gate — scheme + port + DNS-resolved-IP range
 * checks, re-run on every redirect hop. See the route + middleware for the
 * operator-auth gating that backs this up in real mode. Residual DNS-rebinding
 * risk is documented at `assertUrlAllowed`.
 */

export type Platform = "kickstarter" | "indiegogo" | "shopify" | "generic";
export type GiftTier = "base" | "mid" | "full";

export interface RewardTier {
  title: string;
  amountUsd: number;
}

export interface GiftCandidate {
  label: string;
  tier: GiftTier;
  source: "site" | "fallback";
}

export interface SiteAnalysis {
  platform: Platform;
  brandName?: string;
  accentColor?: string;
  estimatedDelivery?: string;
  rewardTiers?: RewardTier[];
  giftCandidates: GiftCandidate[];
}

// ---------------------------------------------------------------------------
// SSRF guard
// ---------------------------------------------------------------------------

/** Injectable DNS resolver so the guard is unit-testable without real lookups. */
export type LookupFn = (hostname: string) => Promise<Array<{ address: string; family: number }>>;
const defaultLookup: LookupFn = (hostname) => lookup(hostname, { all: true, verbatim: true });

export type GuardResult = { ok: true; url: URL } | { ok: false; reason: string };

function ipv4ToInt(ip: string): number | null {
  const parts = ip.split(".");
  if (parts.length !== 4) return null;
  let n = 0;
  for (const p of parts) {
    if (!/^\d{1,3}$/.test(p)) return null;
    const b = Number(p);
    if (b > 255) return null;
    n = n * 256 + b;
  }
  return n >>> 0;
}

function inCidr4(n: number, base: string, bits: number): boolean {
  const b = ipv4ToInt(base);
  if (b === null) return false;
  const mask = bits === 0 ? 0 : (0xffffffff << (32 - bits)) >>> 0;
  return (n & mask) === (b & mask);
}

// Private, loopback, link-local (incl. cloud metadata 169.254.169.254), CGNAT,
// benchmarking, multicast and reserved ranges — anything not a real public host.
const BLOCKED_V4: Array<[string, number]> = [
  ["0.0.0.0", 8],
  ["10.0.0.0", 8],
  ["100.64.0.0", 10],
  ["127.0.0.0", 8],
  ["169.254.0.0", 16],
  ["172.16.0.0", 12],
  ["192.0.0.0", 24],
  ["192.0.2.0", 24],
  ["192.168.0.0", 16],
  ["198.18.0.0", 15],
  ["224.0.0.0", 4],
  ["240.0.0.0", 4],
];

function isBlockedIpv4(ip: string): boolean {
  const n = ipv4ToInt(ip);
  if (n === null) return true; // unparseable → fail closed
  return BLOCKED_V4.some(([base, bits]) => inCidr4(n, base, bits));
}

/** Expand any legal IPv6 text form to its 16 bytes, or null if malformed. */
function expandIpv6(ip: string): number[] | null {
  let addr = ip;
  let embeddedV4: number[] | null = null;
  if (addr.includes(".")) {
    const lastColon = addr.lastIndexOf(":");
    if (lastColon === -1) return null;
    const n = ipv4ToInt(addr.slice(lastColon + 1));
    if (n === null) return null;
    embeddedV4 = [(n >>> 24) & 255, (n >>> 16) & 255, (n >>> 8) & 255, n & 255];
    addr = addr.slice(0, lastColon + 1) + "0:0";
  }
  const halves = addr.split("::");
  if (halves.length > 2) return null;
  const head = halves[0] ? halves[0].split(":") : [];
  const tail = halves.length === 2 && halves[1] ? halves[1].split(":") : [];
  if (halves.length === 1 && head.length !== 8) return null;
  const missing = 8 - (head.length + tail.length);
  if (missing < 0) return null;
  const groups = [...head, ...Array(halves.length === 2 ? missing : 0).fill("0"), ...tail];
  if (groups.length !== 8) return null;
  const bytes: number[] = [];
  for (const g of groups) {
    if (!/^[0-9a-fA-F]{1,4}$/.test(g)) return null;
    const v = parseInt(g, 16);
    bytes.push((v >>> 8) & 255, v & 255);
  }
  if (embeddedV4) {
    bytes[12] = embeddedV4[0];
    bytes[13] = embeddedV4[1];
    bytes[14] = embeddedV4[2];
    bytes[15] = embeddedV4[3];
  }
  return bytes;
}

function isBlockedIpv6(ip: string): boolean {
  const b = expandIpv6(ip);
  if (b === null) return true; // fail closed
  const allZeroUntil = (end: number) => b.slice(0, end).every((x) => x === 0);
  // loopback ::1 and unspecified ::
  if (allZeroUntil(15) && (b[15] === 0 || b[15] === 1)) return true;
  // fc00::/7 unique-local
  if ((b[0] & 0xfe) === 0xfc) return true;
  // fe80::/10 link-local + fec0::/10 site-local (deprecated but still routable-ish)
  if (b[0] === 0xfe && ((b[1] & 0xc0) === 0x80 || (b[1] & 0xc0) === 0xc0)) return true;
  // multicast ff00::/8
  if (b[0] === 0xff) return true;
  // IPv4-mapped (::ffff:a.b.c.d) and IPv4-compatible (::a.b.c.d) → judge the v4
  const mapped = allZeroUntil(10) && b[10] === 0xff && b[11] === 0xff;
  const compat = allZeroUntil(12) && !(allZeroUntil(15) && (b[15] === 0 || b[15] === 1));
  if (mapped || compat) return isBlockedIpv4(`${b[12]}.${b[13]}.${b[14]}.${b[15]}`);
  return false;
}

/** True for any IP that is not a routable public address (fail-closed on junk). */
export function isBlockedIp(ip: string): boolean {
  const fam = isIP(ip);
  if (fam === 4) return isBlockedIpv4(ip);
  if (fam === 6) return isBlockedIpv6(ip);
  return true;
}

/**
 * Validate a URL for outbound fetch: http/https only, standard port only, and a
 * public destination IP (literal IPs judged directly; hostnames resolved and
 * EVERY returned address checked). Returns the parsed URL on success.
 *
 * KNOWN LIMITATION (DNS rebinding): we validate the resolved address, but the
 * subsequent `fetch` does its own resolution, so an attacker controlling
 * authoritative DNS could return a public IP here and a private one to fetch.
 * This guard is defense-in-depth; the primary control is that /api/analyze is
 * gated behind operator auth in real mode (middleware), so it is not an
 * unauthenticated SSRF primitive. Pinning the socket to the checked IP would
 * need a custom undici dispatcher (a dependency we are not adding).
 */
export async function assertUrlAllowed(
  raw: string,
  opts: { lookup?: LookupFn } = {},
): Promise<GuardResult> {
  let url: URL;
  try {
    url = new URL(raw);
  } catch {
    return { ok: false, reason: "invalid-url" };
  }
  if (url.protocol !== "http:" && url.protocol !== "https:") {
    return { ok: false, reason: "unsupported-scheme" };
  }
  // URL normalizes the default port to "" for http/https, so a specified 80/443
  // also lands as "". Anything else is a non-standard port we refuse.
  if (url.port !== "" && url.port !== "80" && url.port !== "443") {
    return { ok: false, reason: "blocked-port" };
  }
  const host = url.hostname.replace(/^\[|\]$/g, "").toLowerCase();
  if (!host) return { ok: false, reason: "no-host" };
  if (host === "localhost" || host.endsWith(".localhost")) return { ok: false, reason: "blocked-host" };

  if (isIP(host) !== 0) {
    return isBlockedIp(host) ? { ok: false, reason: "blocked-ip" } : { ok: true, url };
  }

  const lookupFn = opts.lookup ?? defaultLookup;
  let addrs: Array<{ address: string; family: number }>;
  try {
    addrs = await lookupFn(host);
  } catch {
    return { ok: false, reason: "dns-failed" };
  }
  if (!addrs || addrs.length === 0) return { ok: false, reason: "dns-empty" };
  if (addrs.some((a) => isBlockedIp(a.address))) return { ok: false, reason: "blocked-ip" };
  return { ok: true, url };
}

// ---------------------------------------------------------------------------
// Fetch orchestration
// ---------------------------------------------------------------------------

export type FetchLike = (url: string | URL, init?: RequestInit) => Promise<Response>;

export interface AnalyzeOptions {
  lookup?: LookupFn;
  fetchImpl?: FetchLike;
  maxBytes?: number;
  timeoutMs?: number;
  maxRedirects?: number;
}

export type AnalyzeResult = ({ ok: true } & SiteAnalysis) | { ok: false; reason: string };

const USER_AGENT = "TideoverBot/1.0 (+https://tideover.app)";

function registrableDomain(host: string): string {
  if (isIP(host) !== 0) return host;
  const parts = host.split(".");
  // Approximation without a public-suffix list: last two labels. Good enough to
  // keep redirects on the same site; erring toward "different" just stops the
  // redirect chain (fail-soft), it never widens what we fetch.
  return parts.length <= 2 ? host : parts.slice(-2).join(".");
}

/** Read a response body up to `maxBytes`, throwing "too-large" past the cap. */
async function readCapped(res: Response, maxBytes: number): Promise<string> {
  const body = res.body;
  if (!body) {
    const text = await res.text();
    if (Buffer.byteLength(text) > maxBytes) throw new Error("too-large");
    return text;
  }
  const reader = body.getReader();
  const chunks: Uint8Array[] = [];
  let total = 0;
  for (;;) {
    const { done, value } = await reader.read();
    if (done) break;
    if (value) {
      total += value.byteLength;
      if (total > maxBytes) {
        await reader.cancel().catch(() => {});
        throw new Error("too-large");
      }
      chunks.push(value);
    }
  }
  return Buffer.concat(chunks).toString("utf8");
}

/**
 * Fetch and analyze `raw`. Follows at most `maxRedirects` manual redirects, each
 * one re-validated by the SSRF guard and required to stay on the same
 * registrable domain. Never throws to the caller — every failure is a tagged
 * `{ ok: false, reason }`.
 */
export async function analyzeSite(raw: string, opts: AnalyzeOptions = {}): Promise<AnalyzeResult> {
  const doFetch: FetchLike = opts.fetchImpl ?? ((u, init) => fetch(u, init));
  const maxBytes = opts.maxBytes ?? 2 * 1024 * 1024;
  const timeoutMs = opts.timeoutMs ?? 8000;
  const maxRedirects = opts.maxRedirects ?? 3;

  let current = raw;
  let originHost: string | null = null;

  for (let hop = 0; hop <= maxRedirects; hop++) {
    const guard = await assertUrlAllowed(current, { lookup: opts.lookup });
    if (!guard.ok) return { ok: false, reason: guard.reason };
    const host = guard.url.hostname.replace(/^\[|\]$/g, "").toLowerCase();
    if (originHost && registrableDomain(originHost) !== registrableDomain(host)) {
      return { ok: false, reason: "cross-domain-redirect" };
    }
    if (!originHost) originHost = host;

    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), timeoutMs);
    try {
      const res = await doFetch(guard.url, {
        redirect: "manual",
        signal: controller.signal,
        headers: { "user-agent": USER_AGENT, accept: "text/html,application/xhtml+xml" },
      });

      if (res.status >= 300 && res.status < 400) {
        const loc = res.headers.get("location");
        if (!loc) return { ok: false, reason: "redirect-no-location" };
        current = new URL(loc, guard.url).toString();
        continue;
      }
      if (res.status !== 200) return { ok: false, reason: `http-${res.status}` };

      const ctype = res.headers.get("content-type") ?? "";
      if (!/text\/html|application\/xhtml/i.test(ctype)) return { ok: false, reason: "not-html" };

      const html = await readCapped(res, maxBytes);
      return { ok: true, ...extractFromHtml(html, guard.url) };
    } catch (err) {
      const msg = err instanceof Error ? err.message : "";
      if (msg === "too-large") return { ok: false, reason: "too-large" };
      if (msg === "The operation was aborted." || (err instanceof Error && err.name === "AbortError")) {
        return { ok: false, reason: "timeout" };
      }
      return { ok: false, reason: "fetch-failed" };
    } finally {
      clearTimeout(timer);
    }
  }
  return { ok: false, reason: "too-many-redirects" };
}

// ---------------------------------------------------------------------------
// Deterministic extraction
// ---------------------------------------------------------------------------

function isRecord(v: unknown): v is Record<string, unknown> {
  return typeof v === "object" && v !== null && !Array.isArray(v);
}

function safeJson(s: string): unknown {
  try {
    return JSON.parse(s);
  } catch {
    return null;
  }
}

function decodeEntities(s: string): string {
  return s
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&apos;|&#x27;|&#0*39;/gi, "'")
    .replace(/&nbsp;/g, " ")
    .replace(/&#(\d+);/g, (_m, d: string) => codePoint(Number(d)))
    .replace(/&#x([0-9a-f]+);/gi, (_m, h: string) => codePoint(parseInt(h, 16)));
}

function codePoint(n: number): string {
  return Number.isFinite(n) && n >= 0 && n <= 0x10ffff ? String.fromCodePoint(n) : "";
}

function capitalize(s: string): string {
  return s.length ? s[0].toUpperCase() + s.slice(1).toLowerCase() : s;
}

/** Content of the first <meta> whose `name`/`property` attr equals `key`. */
function metaContent(html: string, attr: "name" | "property", key: string): string | undefined {
  for (const m of html.matchAll(/<meta\b[^>]*>/gi)) {
    const tag = m[0];
    const a = tag.match(new RegExp(`\\b${attr}=["']([^"']*)["']`, "i"))?.[1];
    if (a && a.toLowerCase() === key.toLowerCase()) {
      return tag.match(/\bcontent=["']([^"']*)["']/i)?.[1];
    }
  }
  return undefined;
}

function detectPlatform(html: string, url: URL): Platform {
  const host = url.hostname.toLowerCase();
  if (/(^|\.)kickstarter\.com$/.test(host)) return "kickstarter";
  if (/(^|\.)indiegogo\.com$/.test(host)) return "indiegogo";
  if (/cdn\.shopify\.com|Shopify\.theme|myshopify\.com|shopify-features|"ShopId"/i.test(html)) {
    return "shopify";
  }
  return "generic";
}

const TITLE_SEP = /\s+[|–—•·]\s+|\s+[-:]\s+/;

function extractBrandName(html: string): string | undefined {
  const ogSite =
    metaContent(html, "property", "og:site_name") ?? metaContent(html, "name", "og:site_name");
  if (ogSite?.trim()) return decodeEntities(ogSite.trim());

  const jsonLd = extractJsonLdOrgName(html);
  if (jsonLd) return jsonLd;

  const rawTitle = html.match(/<title[^>]*>([\s\S]*?)<\/title>/i)?.[1];
  if (rawTitle) {
    const title = decodeEntities(rawTitle).replace(/\s+/g, " ").trim();
    const segs = title
      .split(TITLE_SEP)
      .map((s) => s.trim())
      .filter((s) => s.length >= 2);
    if (segs.length) {
      segs.sort((a, b) => a.length - b.length);
      return segs.find((s) => s.length <= 60) ?? title;
    }
    if (title) return title;
  }
  return undefined;
}

function extractJsonLdOrgName(html: string): string | undefined {
  const scripts = html.matchAll(
    /<script[^>]*type=["']application\/ld\+json["'][^>]*>([\s\S]*?)<\/script>/gi,
  );
  for (const m of scripts) {
    const parsed = safeJson(m[1].trim());
    if (parsed === null) continue;
    const nodes = Array.isArray(parsed) ? parsed : [parsed];
    for (const node of nodes) {
      const graph =
        isRecord(node) && Array.isArray(node["@graph"]) ? (node["@graph"] as unknown[]) : [node];
      for (const g of graph) {
        if (!isRecord(g)) continue;
        const type = g["@type"];
        const types = Array.isArray(type) ? type : [type];
        if (types.some((t) => typeof t === "string" && /Organization|Brand|WebSite/i.test(t))) {
          const name = g["name"];
          if (typeof name === "string" && name.trim()) return decodeEntities(name.trim());
        }
      }
    }
  }
  return undefined;
}

function extractAccentColor(html: string): string | undefined {
  const c = metaContent(html, "name", "theme-color")?.trim();
  if (!c) return undefined;
  if (/^#(?:[0-9a-f]{3}|[0-9a-f]{4}|[0-9a-f]{6}|[0-9a-f]{8})$/i.test(c)) return c;
  if (/^rgba?\(\s*\d{1,3}\s*,\s*\d{1,3}\s*,\s*\d{1,3}\s*(?:,\s*(?:0|1|0?\.\d+)\s*)?\)$/i.test(c)) {
    return c;
  }
  return undefined;
}

/** Grab the first balanced `{...}` object at/after `fromIndex`, string-aware. */
function extractBalancedJson(src: string, fromIndex: number): string | undefined {
  const start = src.indexOf("{", fromIndex);
  if (start === -1) return undefined;
  let depth = 0;
  let inStr = false;
  let esc = false;
  for (let i = start; i < src.length; i++) {
    const ch = src[i];
    if (inStr) {
      if (esc) esc = false;
      else if (ch === "\\") esc = true;
      else if (ch === '"') inStr = false;
    } else if (ch === '"') {
      inStr = true;
    } else if (ch === "{") {
      depth++;
    } else if (ch === "}") {
      depth--;
      if (depth === 0) return src.slice(start, i + 1);
    }
  }
  return undefined;
}

function extractKsProject(html: string): Record<string, unknown> | undefined {
  const marker = html.search(/window\.current_project\s*=\s*\{/i);
  if (marker !== -1) {
    const json = extractBalancedJson(html, marker);
    const p = json ? safeJson(json) : null;
    if (isRecord(p)) return p;
  }
  const di = html.match(/data-initial=["']([^"']+)["']/i);
  if (di) {
    const p = safeJson(decodeEntities(di[1]));
    if (isRecord(p)) return isRecord(p["project"]) ? p["project"] : p;
  }
  return undefined;
}

function round2(n: number): number {
  return Math.round(n * 100) / 100;
}

/** Pull a USD pledge amount out of a reward object across KS's various shapes. */
function rewardAmountUsd(r: Record<string, unknown>): number | null {
  const amt = r["amount"];
  if (isRecord(amt)) {
    const n = Number(amt["amount"]);
    if (Number.isFinite(n) && n > 0) return round2(n);
  }
  for (const key of ["minimum", "pledge_amount", "converted_minimum"]) {
    const v = r[key];
    const n = typeof v === "number" ? v : typeof v === "string" ? Number(v) : NaN;
    if (Number.isFinite(n) && n > 0) return round2(n);
  }
  for (const key of ["minimum_cents", "amount_cents", "pledge_amount_cents"]) {
    const v = r[key];
    if (typeof v === "number" && Number.isFinite(v) && v > 0) return round2(v / 100);
  }
  return null;
}

function rewardsFromProject(project: Record<string, unknown>): RewardTier[] | undefined {
  const rewards = project["rewards"];
  if (!Array.isArray(rewards)) return undefined;
  const tiers: RewardTier[] = [];
  for (const r of rewards) {
    if (!isRecord(r)) continue;
    const title = typeof r["title"] === "string" ? decodeEntities(r["title"].trim()) : undefined;
    const amountUsd = rewardAmountUsd(r);
    if (title && amountUsd !== null) tiers.push({ title, amountUsd });
  }
  return tiers.length ? tiers : undefined;
}

const MONTHS = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December",
];

function monthYear(d: Date): string {
  return `${MONTHS[d.getUTCMonth()]} ${d.getUTCFullYear()}`;
}

function ksEstimatedDelivery(project: Record<string, unknown>): string | undefined {
  let bestSecs: number | null = null;
  const consider = (v: unknown) => {
    if (typeof v === "number" && v > 0) {
      bestSecs = bestSecs === null ? v : Math.max(bestSecs, v);
    } else if (typeof v === "string") {
      const t = Date.parse(v);
      if (!Number.isNaN(t)) {
        const secs = Math.floor(t / 1000);
        bestSecs = bestSecs === null ? secs : Math.max(bestSecs, secs);
      }
    }
  };
  const rewards = project["rewards"];
  if (Array.isArray(rewards)) {
    for (const r of rewards) if (isRecord(r)) consider(r["estimated_delivery_on"]);
  }
  consider(project["estimated_delivery_on"]);
  if (bestSecs === null) return undefined;
  const ms = bestSecs > 1e12 ? bestSecs : bestSecs * 1000;
  return monthYear(new Date(ms));
}

function genericEta(html: string): string | undefined {
  const text = decodeEntities(html.replace(/<[^>]+>/g, " ")).replace(/\s+/g, " ");
  const m = text.match(
    /estimated\s+(?:delivery|ship(?:ping|s|ment|ped)?|dispatch)\b[^.]*?\b(January|February|March|April|May|June|July|August|September|October|November|December)\s+(\d{4})/i,
  );
  return m ? `${capitalize(m[1])} ${m[2]}` : undefined;
}

function truncateTitle(s: string): string {
  const clean = s.replace(/\s+/g, " ").trim();
  return clean.length > 48 ? clean.slice(0, 45).trimEnd() + "…" : clean;
}

/**
 * A goodwill-gift archetype per tier, GROUNDED in the extracted reward title
 * (quoted) so nothing is an invented product claim — the label only names a
 * gesture the merchant could offer that backer group.
 */
function giftLabelForTier(tier: GiftTier, rewardTitle: string): string {
  const t = truncateTitle(rewardTitle);
  if (tier === "base") return `Founder thank-you note for "${t}" backers`;
  if (tier === "mid") return `Priority dispatch for "${t}" backers`;
  return `Early access + founder note for "${t}" backers`;
}

function fallbackCandidates(): GiftCandidate[] {
  return [
    { label: "Founder thank-you note", tier: "base", source: "fallback" },
    { label: "Priority dispatch", tier: "mid", source: "fallback" },
    { label: "Next-order credit", tier: "full", source: "fallback" },
  ];
}

function buildGiftCandidates(rewards: RewardTier[] | undefined): GiftCandidate[] {
  if (!rewards || rewards.length === 0) return fallbackCandidates();
  const sorted = [...rewards].sort((a, b) => a.amountUsd - b.amountUsd);
  const n = sorted.length;
  const out: GiftCandidate[] = [];
  const seen = new Set<string>();
  for (let i = 0; i < sorted.length && out.length < 6; i++) {
    const frac = n === 1 ? 0.5 : i / (n - 1);
    const tier: GiftTier = frac < 0.34 ? "base" : frac < 0.67 ? "mid" : "full";
    const label = giftLabelForTier(tier, sorted[i].title);
    const key = label.toLowerCase();
    if (seen.has(key)) continue;
    seen.add(key);
    out.push({ label, tier, source: "site" });
  }
  // The wizard's catalog rule wants at least one Base gift; guarantee one.
  if (!out.some((g) => g.tier === "base")) {
    out.unshift({ label: "Founder thank-you note", tier: "base", source: "fallback" });
  }
  return out.slice(0, 6);
}

/**
 * Pure extraction over already-fetched HTML. Deterministic and side-effect free
 * — the whole test surface hangs off this.
 */
export function extractFromHtml(html: string, url: URL): SiteAnalysis {
  const platform = detectPlatform(html, url);
  const ksProject = platform === "kickstarter" ? extractKsProject(html) : undefined;
  const rewardTiers = ksProject ? rewardsFromProject(ksProject) : undefined;

  const brandName = extractBrandName(html);
  const accentColor = extractAccentColor(html);
  const estimatedDelivery = (ksProject && ksEstimatedDelivery(ksProject)) || genericEta(html);
  const giftCandidates = buildGiftCandidates(rewardTiers);

  const out: SiteAnalysis = { platform, giftCandidates };
  if (brandName) out.brandName = brandName;
  if (accentColor) out.accentColor = accentColor;
  if (estimatedDelivery) out.estimatedDelivery = estimatedDelivery;
  if (rewardTiers && rewardTiers.length) out.rewardTiers = rewardTiers;
  return out;
}
