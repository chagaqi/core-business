import { Button } from "@/components/ui/Button";

/**
 * 404 for any unmatched /app/* route (UX-12). Renders inside the operator
 * shell so the sidebar stays put — the operator never lands on a bare page.
 */
export default function AppNotFound() {
  return (
    <div className="flex min-h-[60vh] flex-col items-start justify-center gap-4 p-8">
      <div className="max-w-md">
        <p className="kicker">Page not found</p>
        <h1 className="font-serif text-[26px] leading-tight text-ink">
          We couldn&rsquo;t find that page.
        </h1>
        <p className="mt-1.5 text-[14px] leading-relaxed text-ink-mute">
          The link may be out of date. Head back to the dashboard to keep going.
        </p>
      </div>
      <Button variant="primary" href="/app">
        Back to dashboard
      </Button>
    </div>
  );
}
