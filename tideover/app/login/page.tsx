import type { Metadata } from "next";
import { redirect } from "next/navigation";
import Link from "next/link";
import { Field, TextInput } from "@/components/ui/Field";
import { Button } from "@/components/ui/Button";
import { DraftArtifact, ToolChecklist } from "@/components/agentic";
import { authMode } from "@/lib/auth-mode";
import { resolveModeFromRequest } from "@/lib/request-mode";

export const metadata: Metadata = {
  title: "Operator sign-in — Tideover",
  robots: { index: false, follow: false },
};

/**
 * SW5 (ADR-0023): split-panel auth shell — teal-700 form panel left, product
 * visual right (our own kit with SAMPLE-labeled content; never fabricated
 * testimonials — real quotes swap in when they exist).
 *
 * ADR-0020: with Auth0 accounts configured, sign-in is Auth0's hosted page —
 * the redirect below fires first in real mode, so this page renders only for
 * legacy password mode and as demo-host marketing chrome. The REAL-mode look
 * lives in Auth0 dashboard branding (Dylan item SWAUTH0).
 */
export default function LoginPage({
  searchParams,
}: {
  searchParams: { next?: string; error?: string };
}) {
  if (resolveModeFromRequest() === "real" && authMode() === "auth0") {
    const returnTo = searchParams.next || "/app/inbox";
    redirect(`/auth/login?returnTo=${encodeURIComponent(returnTo)}`);
  }
  // UX-07(a): land the operator on their queue, not the dashboard, post-login.
  const next = searchParams.next || "/app/inbox";
  return (
    <div className="flex min-h-screen">
      {/* form panel — dark teal, Swan's black stand-in (ADR-0023) */}
      <div className="flex w-full flex-col items-center justify-center bg-teal-700 px-6 py-10 lg:w-[46%]">
        <div className="w-full max-w-[400px]">
          <p className="mb-8 text-center font-serif text-[28px] tracking-tightish text-ink-inverse">
            Tideover
          </p>
          <div className="panel w-full p-8">
            <h1 className="mb-2 text-center text-[24px]">Operator sign-in</h1>
            <p className="mb-6 text-center text-[14px] leading-relaxed text-slate">
              This area is for the Tideover operator. Customers checking an order don&rsquo;t need
              to sign in — use the link from your email.
            </p>
            <form action="/api/login" method="post" className="flex flex-col gap-4">
              <input type="hidden" name="next" value={next} />
              <Field label="Password">
                <TextInput
                  type="password"
                  name="password"
                  autoFocus
                  required
                  autoComplete="current-password"
                />
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
          <p className="mt-6 text-center text-[13px]">
            <Link href="/" className="text-ink-inverse/70 underline-offset-2 hover:text-ink-inverse hover:underline">
              ← back to tideover.app
            </Link>
          </p>
        </div>
      </div>

      {/* product rail — what mornings look like, in our own kit, sample-labeled */}
      <div className="hidden flex-1 flex-col items-center justify-center bg-sand px-10 lg:flex">
        <div className="w-full max-w-[440px]">
          <p className="mb-1 text-[11px] font-semibold uppercase tracking-[0.14em] text-ink-mute">
            Every morning in Tideover — sample data
          </p>
          <p className="mb-5 font-serif text-[22px] leading-snug text-ink">
            Tickets arrive already drafted. You approve. That&rsquo;s the job.
          </p>
          <div className="panel p-5">
            <ToolChecklist
              steps={[
                { label: "Read 6 new tickets", state: "done" },
                { label: "Checked every order's real timeline", state: "done" },
                { label: "Drafted 6 replies in your voice", state: "done" },
              ]}
            />
            <div className="mt-4">
              <DraftArtifact title="Waiting for your approval (SAMPLE)">
                Hi Sam — quick update from the workshop. Your order is in the anodizing stage, on
                track for the window on your status page. Next update in two weeks, sooner if
                anything changes.
              </DraftArtifact>
            </div>
            <p className="mt-4 text-[13px] font-medium text-ink">
              Nothing sends without you hitting approve.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
