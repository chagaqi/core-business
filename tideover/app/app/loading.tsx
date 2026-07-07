/**
 * Dashboard loading skeleton (UX-13) — mirrors app/app/page.tsx's layout
 * (header + 6-tile metric grid + a GMV panel) so the page never flashes
 * blank white while data loads. Pulsing muted panels only, no real data.
 */
export default function DashboardLoading() {
  return (
    <div className="flex flex-col gap-6 px-6 py-6" aria-busy="true" aria-live="polite">
      <header className="flex flex-wrap items-end justify-between gap-3">
        <div className="flex flex-col gap-2">
          <div className="h-3 w-32 animate-pulse rounded bg-sand-2" />
          <div className="h-8 w-56 animate-pulse rounded bg-sand-2" />
        </div>
        <div className="h-9 w-44 animate-pulse rounded-lg bg-sand-2" />
      </header>

      <section className="grid grid-cols-2 gap-3 lg:grid-cols-6">
        {Array.from({ length: 6 }).map((_, i) => (
          <div key={i} className="panel flex flex-col gap-3 p-4">
            <div className="h-2.5 w-3/4 animate-pulse rounded bg-sand-2" />
            <div className="h-7 w-1/2 animate-pulse rounded bg-sand-2" />
            <div className="h-2.5 w-2/3 animate-pulse rounded bg-sand-2" />
          </div>
        ))}
      </section>

      <section className="panel p-5">
        <div className="mb-4 flex flex-wrap items-center justify-between gap-2">
          <div className="flex flex-col gap-2">
            <div className="h-4 w-52 animate-pulse rounded bg-sand-2" />
            <div className="h-2.5 w-72 animate-pulse rounded bg-sand-2" />
          </div>
          <div className="h-5 w-40 animate-pulse rounded-full bg-sand-2" />
        </div>
        <div className="h-40 w-full animate-pulse rounded-lg bg-sand-2" />
      </section>
    </div>
  );
}
