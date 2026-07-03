import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { SESSION_COOKIE, verifySessionValue } from "@/lib/session";

/**
 * Operator auth gate (ADR-0004). The matcher lists ONLY the operator surfaces —
 * public pages (/, /book, /vsl/*, /onboarding, /status/*, /widget/*) and public
 * APIs (/api/status/*, /api/widget-submit, /api/ticket-ingest) never hit this.
 * DEMO_MODE unset/true = everything passes through untouched.
 */
export async function middleware(req: NextRequest) {
  if (process.env.DEMO_MODE !== "false") return NextResponse.next();

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
    "/api/gift-catalog/:path*",
    "/api/gift-send",
    "/api/social-signal-feed",
    "/api/orders/:path*",
    "/api/onboarding",
  ],
};
