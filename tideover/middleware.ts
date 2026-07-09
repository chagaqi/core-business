import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { SESSION_COOKIE, verifySessionValue } from "@/lib/session";
import { resolveMode } from "@/lib/mode";

/**
 * Operator auth gate (ADR-0004, ADR-0017). The matcher lists ONLY the operator
 * surfaces — public pages (/, /book, /vsl/*, /onboarding, /status/*, /widget/*)
 * and public APIs (/api/status/*, /api/widget-submit, /api/ticket-ingest,
 * /api/inbound/*, /api/ingest/*, /api/cron/*) never hit this. The webhook ingest
 * endpoints authenticate by their own token + signature, and /api/cron/* by its
 * own bearer secret (ADR-0013), so they must stay OUT of this matcher.
 *
 * Mode is derived from the request host (ADR-0017): only the real app host is
 * gated. Every other host — including the public demo — passes through
 * untouched, and DEMO_MODE=false still forces the gate on for backcompat.
 * resolveMode is pure/Edge-safe (no next/headers), so it is legal here.
 */
export async function middleware(req: NextRequest) {
  if (resolveMode(req.headers.get("host") ?? undefined) !== "real") {
    return NextResponse.next();
  }

  const session = req.cookies.get(SESSION_COOKIE)?.value;
  if (session && (await verifySessionValue(session))) return NextResponse.next();

  const { pathname, search } = req.nextUrl;
  if (pathname.startsWith("/api/")) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }
  const login = new URL("/login", req.url);
  login.searchParams.set("next", pathname + search);
  return NextResponse.redirect(login);
}

export const config = {
  matcher: [
    "/app/:path*",
    "/api/approve-send",
    "/api/draft",
    "/api/export",
    "/api/gift-catalog/:path*",
    "/api/gift-send",
    "/api/escalate",
    "/api/social-signal-feed",
    "/api/orders/:path*",
    "/api/onboarding",
    "/api/analyze",
    "/api/import",
    "/api/updates",
    "/api/setup-status",
    "/api/variants/promote",
  ],
};
