/**
 * Types for the contact-form outreach tool (GTM store-side lane). Handles ONLY open
 * forms; anything with a CAPTCHA or bot-detection is classified and SKIPPED, never
 * defeated. Detection is pure + tested here; fetching/submitting is the scripts.
 */

export type FormPlatform = "shopify" | "woocommerce" | "generic";

export type FormClass =
  | "shopify-open" // Shopify standard contact form, no captcha — cleanly reachable
  | "form-open" // a generic contact form (email + message), no captcha — reachable
  | "captcha-gated" // has reCAPTCHA / hCaptcha / Turnstile — SKIP (other channel)
  | "no-form" // no contact form found on the page
  | "blocked" // 403 / challenge / anti-bot — SKIP, never evade
  | "error"; // fetch failed / timeout

export type CaptchaKind = "recaptcha" | "hcaptcha" | "turnstile" | null;

export interface Classification {
  class: FormClass;
  platform: FormPlatform;
  captcha: CaptchaKind;
}

/** A form ready to submit: its action URL + the mapped field names. */
export interface FormSpec {
  action: string;
  method: "post";
  platform: FormPlatform;
  /** the field to place the sender's email in. */
  emailField: string | null;
  /** the field for the message body. */
  messageField: string | null;
  nameField: string | null;
  subjectField: string | null;
  /** hidden inputs to echo back verbatim (Shopify form_type, utf8, etc.). */
  hidden: Record<string, string>;
}
