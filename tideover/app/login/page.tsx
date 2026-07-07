import type { Metadata } from "next";
import { Logo } from "@/components/ui/Logo";
import { Field, TextInput } from "@/components/ui/Field";
import { Button } from "@/components/ui/Button";

export const metadata: Metadata = {
  title: "Operator sign-in — Tideover",
  robots: { index: false, follow: false },
};

export default function LoginPage({
  searchParams,
}: {
  searchParams: { next?: string; error?: string };
}) {
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
