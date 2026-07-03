import { NextResponse } from "next/server";
import { createSessionValue, SESSION_COOKIE, sessionCookieOptions } from "@/lib/session";

/**
 * POST /api/login — check APP_PASSWORD, set the signed session cookie
 * (ADR-0004), 303 to ?next. Wrong password bounces back to /login with a
 * plain error. Never gated by middleware.
 */

/**
 * Only same-origin paths — no "//host", no backslash tricks, no control chars
 * (a raw tab/CR/LF survives this string check but the WHATWG URL parser strips
 * it, so "/\t//evil.com" would otherwise resolve off-origin), no schemes.
 */
function sanitizeNext(raw: FormDataEntryValue | null): string {
  if (typeof raw !== "string") return "/app";
  if (
    !raw.startsWith("/") ||
    raw.startsWith("//") ||
    raw.includes("\\") ||
    /[\u0000-\u001f\u007f]/.test(raw)
  ) {
    return "/app";
  }
  return raw;
}

/**
 * Belt-and-suspenders: even after sanitizeNext, resolve `next` against the
 * request origin and reject anything that escapes it before we redirect.
 */
function sameOriginNext(next: string, req: Request): string {
  try {
    if (new URL(next, req.url).origin !== new URL(req.url).origin) return "/app";
  } catch {
    return "/app";
  }
  return next;
}

export async function POST(req: Request) {
  const form = await req.formData().catch(() => null);
  const next = sameOriginNext(sanitizeNext(form ? form.get("next") : null), req);
  const expected = process.env.APP_PASSWORD;
  const configured = Boolean(expected && process.env.AUTH_SECRET);
  if (!configured || !form || form.get("password") !== expected) {
    const back = new URL(`/login?error=1&next=${encodeURIComponent(next)}`, req.url);
    return NextResponse.redirect(back, 303);
  }
  const res = NextResponse.redirect(new URL(next, req.url), 303);
  res.cookies.set(SESSION_COOKIE, await createSessionValue(), sessionCookieOptions());
  return res;
}
