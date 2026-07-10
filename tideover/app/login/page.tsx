import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { Logo } from "@/components/ui/Logo";
import { Field, TextInput } from "@/components/ui/Field";
import { Button } from "@/components/ui/Button";
import { authMode } from "@/lib/auth-mode";
import { resolveModeFromRequest } from "@/lib/request-mode";

export const metadata: Metadata = {
  title: "Operator sign-in — Tideover",
  robots: { index: false, follow: false },
};

export default function LoginPage({
  searchParams,
}: {
  searchParams: { next?: string; error?: string };
}) {
  // ADR-0020: with Auth0 accounts configured, sign-in is Auth0's hosted page —
  // this password form only exists for the legacy password mode. Demo hosts
  // never gate, so they keep rendering the form as inert marketing chrome.
  if (resolveModeFromRequest() === "real" && authMode() === "auth0") {
    const returnTo = searchParams.next || "/app/inbox";
    redirect(`/auth/login?returnTo=${encodeURIComponent(returnTo)}`);
  }
  // UX-07(a): land the operator on their queue, not the dashboard, post-login.
  const next = searchParams.next || "/app/inbox";
  return (
    <div className="flex min-h-screen items-center justify-center bg-sand px-6">
      <div className="panel w-full max-w-[400px] p-8">
        <div className="mb-6 flex justify-center">
          <Logo href="/" />
        </div>
        <h1 className="mb-2 text-center text-[26px]">Operator sign-in</h1>
        <p className="mb-6 text-center text-[15px] leading-relaxed text-slate">
          This area is for the Tideover operator. Customers checking an order don&rsquo;t need to
          sign in — use the link from your email.
        </p>
        <form action="/api/login" method="post" className="flex flex-col gap-4">
          <input type="hidden" name="next" value={next} />
          <Field label="Password">
            <TextInput type="password" name="password" autoFocus required autoComplete="current-password" />
          </Field>
          {searchParams.error ? (
            <p className="text-[14px] font-semibold text-risk-red">
              That password didn&rsquo;t match. Try again.
            </p>
          ) : null}
          <Button type="submit" className="w-full">
            Sign in
          </Button>
        </form>
      </div>
    </div>
  );
}
