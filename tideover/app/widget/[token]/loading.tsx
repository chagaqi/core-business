import { WidgetFrame } from "@/components/status/WidgetFrame";

/**
 * Loading skeleton for the embeddable widget (UX-13/UX-38). Same sand
 * background + dimmed panel outlines as the full status page, scaled to the
 * widget's compact chrome, so an anxious backer never sees a blank iframe.
 * Wrapped in WidgetFrame so the host iframe still gets a height while loading.
 */
export default function WidgetLoading() {
  return (
    <WidgetFrame>
      <div className="bg-sand p-4" aria-busy="true" aria-live="polite">
        <div className="flex flex-col gap-4">
          <div className="h-3 w-3/4 animate-pulse rounded bg-sand-2" />

          <div className="h-2.5 w-full animate-pulse rounded-full bg-sand-2" />

          <div className="rounded-xl border border-border bg-paper p-4">
            <div className="h-16 w-full animate-pulse rounded-lg bg-sand-2" />
          </div>

          <div className="rounded-xl border border-border bg-paper p-4">
            <div className="h-20 w-full animate-pulse rounded-lg bg-sand-2" />
          </div>

          <div className="h-9 w-full animate-pulse rounded-lg bg-sand-2" />
        </div>
      </div>
    </WidgetFrame>
  );
}
