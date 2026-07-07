/**
 * Inbox loading skeleton (UX-13) — mirrors app/app/inbox/page.tsx's 3-column
 * grid (queue / detail / draft rail) so the layout holds still while the
 * queue loads. Pulsing muted panels only, no real data.
 */
export default function InboxLoading() {
  return (
    <div className="flex h-screen flex-col" aria-busy="true" aria-live="polite">
      <header className="flex shrink-0 flex-wrap items-center justify-between gap-3 border-b border-border bg-paper px-5 py-3">
        <div className="flex flex-col gap-2">
          <div className="h-2.5 w-28 animate-pulse rounded bg-sand-2" />
          <div className="h-6 w-24 animate-pulse rounded bg-sand-2" />
        </div>
        <div className="h-9 w-44 animate-pulse rounded-lg bg-sand-2" />
      </header>

      <div className="grid min-h-0 flex-1 grid-cols-[300px_minmax(0,1fr)_360px]">
        {/* Priority queue */}
        <div className="min-h-0 overflow-y-auto border-r border-border bg-paper p-3">
          <div className="flex flex-col gap-2">
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="h-16 w-full animate-pulse rounded-lg bg-sand-2" />
            ))}
          </div>
        </div>

        {/* Ticket detail */}
        <div className="min-h-0 overflow-y-auto bg-sand p-5">
          <div className="flex flex-col gap-4">
            <div className="h-6 w-2/3 animate-pulse rounded bg-sand-2" />
            <div className="h-24 w-full animate-pulse rounded-lg bg-sand-2" />
            <div className="h-24 w-full animate-pulse rounded-lg bg-sand-2" />
          </div>
        </div>

        {/* Draft rail */}
        <div className="min-h-0 overflow-y-auto border-l border-border bg-paper p-4">
          <div className="flex flex-col gap-3">
            <div className="h-4 w-1/2 animate-pulse rounded bg-sand-2" />
            <div className="h-32 w-full animate-pulse rounded-lg bg-sand-2" />
            <div className="h-9 w-full animate-pulse rounded-lg bg-sand-2" />
          </div>
        </div>
      </div>
    </div>
  );
}
