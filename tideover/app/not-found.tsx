import { Logo } from "@/components/ui/Logo";
import { Button } from "@/components/ui/Button";

/**
 * Outermost 404 for anything not under /app (marketing, /login, /status,
 * /widget) — the root layout carries no shell chrome, so this is a
 * standalone branded card rather than an in-shell panel (UX-12).
 */
export default function RootNotFound() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-sand px-6">
      <div className="panel max-w-[440px] p-8 text-center">
        <div className="mb-5 flex justify-center">
          <Logo href="/" />
        </div>
        <h1 className="mb-3 text-[26px]">We couldn&rsquo;t find that page.</h1>
        <p className="mb-6 text-[15px] leading-relaxed text-ink-mute">
          The link may be out of date. Head back to Tideover, or sign in to your account.
        </p>
        <div className="flex items-center justify-center gap-3">
          <Button variant="primary" href="/">
            Go home
          </Button>
          <Button variant="ghost" href="/login">
            Sign in
          </Button>
        </div>
      </div>
    </div>
  );
}
