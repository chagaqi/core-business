import assert from "node:assert/strict";
import { test } from "node:test";
import { classify, detectCaptcha, detectPlatform, hasContactForm } from "@/lib/formfill/detect";

const SHOPIFY_OPEN = `<!doctype html><html><head><link href="//cdn.shopify.com/s/x.css"></head>
<body><form action="/contact" method="post">
<input type="hidden" name="form_type" value="contact"><input type="hidden" name="utf8" value="✓">
<input type="text" name="contact[name]"><input type="email" name="contact[email]">
<textarea name="contact[body]"></textarea><button>Send</button></form></body></html>`;

const SHOPIFY_CAPTCHA = SHOPIFY_OPEN.replace("<button>Send</button>", '<div class="g-recaptcha" data-sitekey="x"></div><button>Send</button>');

const GENERIC_OPEN = `<html><body><form action="https://forms.example/submit" method="post">
<input type="email" name="your-email"><textarea name="message"></textarea></form></body></html>`;

const WOO_CAPTCHA = `<html><head><link href="/wp-content/plugins/contact-form-7/x.css"></head>
<body><form class="wpcf7-form"><input type="email" name="your-email"><textarea name="your-message"></textarea>
<div class="h-captcha" data-sitekey="y"></div></form></body></html>`;

const NO_FORM = `<html><body><h1>Contact</h1><p>Email us at hello@store.example</p></body></html>`;

const CF_CHALLENGE = `<html><head><title>Just a moment...</title></head><body>
<div id="cf-challenge"></div><script>window.__cf_chl_opt={}</script></body></html>`;

// ── captcha + platform detection ──────────────────────────────────────────────────

test("detectCaptcha: identifies recaptcha, hcaptcha, turnstile; null when clean", () => {
  assert.equal(detectCaptcha(SHOPIFY_CAPTCHA), "recaptcha");
  assert.equal(detectCaptcha(WOO_CAPTCHA), "hcaptcha");
  assert.equal(detectCaptcha('<div class="cf-turnstile"></div>'), "turnstile");
  assert.equal(detectCaptcha(SHOPIFY_OPEN), null);
});

test("detectPlatform: shopify / woocommerce / generic", () => {
  assert.equal(detectPlatform(SHOPIFY_OPEN), "shopify");
  assert.equal(detectPlatform(WOO_CAPTCHA), "woocommerce");
  assert.equal(detectPlatform(GENERIC_OPEN), "generic");
});

test("hasContactForm: true for a form with email + textarea (or the Shopify std fields)", () => {
  assert.equal(hasContactForm(SHOPIFY_OPEN), true);
  assert.equal(hasContactForm(GENERIC_OPEN), true);
  assert.equal(hasContactForm(NO_FORM), false);
});

// ── classification (the precedence that keeps captcha'd forms out of "open") ────────

test("classify: an open Shopify contact form is shopify-open", () => {
  const c = classify(SHOPIFY_OPEN, 200);
  assert.equal(c.class, "shopify-open");
  assert.equal(c.platform, "shopify");
  assert.equal(c.captcha, null);
});

test("classify: a captcha on the form makes it captcha-gated, never open", () => {
  assert.equal(classify(SHOPIFY_CAPTCHA, 200).class, "captcha-gated");
  assert.equal(classify(WOO_CAPTCHA, 200).class, "captcha-gated");
});

test("classify: a generic email+textarea form with no captcha is form-open", () => {
  assert.equal(classify(GENERIC_OPEN, 200).class, "form-open");
});

test("classify: no form → no-form", () => {
  assert.equal(classify(NO_FORM, 200).class, "no-form");
});

test("classify: a 403 or a Cloudflare challenge is blocked (never evaded)", () => {
  assert.equal(classify(SHOPIFY_OPEN, 403).class, "blocked", "403 status");
  assert.equal(classify(CF_CHALLENGE, 200).class, "blocked", "challenge interstitial even on a 200");
});
