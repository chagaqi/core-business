/**
 * Loading skeleton for the customer-facing status page (UX-13/UX-38). An
 * anxious backer should see "loading," never a blank white flash — dimmed
 * panel outlines on the same sand background, no data, no logic.
 */
export default function StatusLoading() {
  return (
    <div className="min-h-screen bg-sand" aria-busy="true" aria-live="polite">
      <header className="border-b border-border bg-paper">
        <div className="wrap flex items-center gap-3 py-5">
          <div className="h-9 w-9 animate-pulse rounded-lg bg-sand-2" />
          <div className="h-4 w-32 animate-pulse rounded bg-sand-2" />
        </div>
      </header>

      <main className="wrap max-w-[720px] py-10 md:py-14">
        <div className="mb-8 flex flex-col gap-3">
          <div className="h-7 w-4/5 animate-pulse rounded bg-sand-2" />
          <div className="flex gap-2">
            <div className="h-5 w-24 animate-pulse rounded-full bg-sand-2" />
            <div className="h-5 w-28 animate-pulse rounded-full bg-sand-2" />
          </div>
        </div>

        <div className="mb-6 h-3 w-full animate-pulse rounded-full bg-sand-2" />

        <div className="mb-6 rounded-xl border border-border bg-paper p-5">
          <div className="h-24 w-full animate-pulse rounded-lg bg-sand-2" />
        </div>

        <div className="mb-6 rounded-xl border border-border bg-paper p-5">
          <div className="h-32 w-full animate-pulse rounded-lg bg-sand-2" />
        </div>

        <div className="rounded-xl border border-border bg-paper p-5">
          <div className="h-16 w-full animate-pulse rounded-lg bg-sand-2" />
        </div>
      </main>
    </div>
  );
}
