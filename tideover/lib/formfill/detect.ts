import type { CaptchaKind, Classification, FormPlatform } from "@/lib/formfill/types";

/**
 * Pure detection over a fetched contact page. The whole point is to SEPARATE the
 * open, cleanly-submittable forms from the CAPTCHA/anti-bot ones so the outreach tool
 * only ever touches the former. Nothing here defeats a captcha or a challenge — it
 * identifies them so they get skipped. Regex over HTML (no parser dependency); the
 * Shopify standard form is a known shape, which covers most of the target list.
 */

const CAPTCHA_MARKERS: { re: RegExp; kind: Exclude<CaptchaKind, null> }[] = [
  { re: /g-recaptcha|grecaptcha|recaptcha\/api|google\.com\/recaptcha/i, kind: "recaptcha" },
  { re: /\bh-?captcha\b|hcaptcha\.com/i, kind: "hcaptcha" },
  { re: /cf-turnstile|challenges\.cloudflare\.com\/turnstile/i, kind: "turnstile" },
];

// Cloudflare / generic anti-bot interstitial markers (a challenge page, not real content).
const CHALLENGE = /__cf_chl|cf-challenge|cf_chl_opt|checking your browser before|attention required!|just a moment\.\.\./i;

export function detectCaptcha(html: string): CaptchaKind {
  for (const m of CAPTCHA_MARKERS) if (m.re.test(html)) return m.kind;
  return null;
}

export function detectPlatform(html: string): FormPlatform {
  if (/cdn\.shopify\.com|["']shopify["']|name=["']contact\[email\]["']|shopify-section/i.test(html)) return "shopify";
  if (/woocommerce|wp-content\/(plugins|themes)|wpforms|wpcf7|gform_/i.test(html)) return "woocommerce";
  return "generic";
}

/**
 * A contact-like form is present: the Shopify standard fields, or a <form> that
 * carries both an email input and a textarea (the minimum for "leave us a message").
 */
export function hasContactForm(html: string): boolean {
  const shopifyStd = /name=["']contact\[email\]["']/i.test(html) && /name=["']contact\[body\]["']/i.test(html);
  if (shopifyStd) return true;
  const hasForm = /<form[\s>]/i.test(html);
  const hasEmail = /<input[^>]+type=["']email["']/i.test(html) || /name=["'][^"']*e-?mail[^"']*["']/i.test(html);
  const hasTextarea = /<textarea[\s>]/i.test(html);
  return hasForm && hasEmail && hasTextarea;
}

const isShopifyStd = (html: string) =>
  /name=["']contact\[email\]["']/i.test(html) && /name=["']contact\[body\]["']/i.test(html);

/**
 * Classify a fetched page. `status` is the HTTP status (0 = fetch error handled by
 * the caller). Precedence: blocked/challenge → captcha-gated → form presence. A page
 * behind a challenge or carrying a captcha is never called "open".
 */
export function classify(html: string, status: number): Classification {
  const platform = detectPlatform(html);
  if (status === 403 || status === 429 || status === 503 || CHALLENGE.test(html)) {
    return { class: "blocked", platform, captcha: null };
  }
  const captcha = detectCaptcha(html);
  if (!hasContactForm(html)) return { class: "no-form", platform, captcha };
  if (captcha) return { class: "captcha-gated", platform, captcha };
  return { class: isShopifyStd(html) ? "shopify-open" : "form-open", platform, captcha };
}
