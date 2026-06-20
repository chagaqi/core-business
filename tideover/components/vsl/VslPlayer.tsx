/**
 * A 16:9 placeholder video frame for the VSL pages. Dashed border, a play glyph,
 * and a literal "[ VSL PLACEHOLDER ]" label — no fabricated view counts, no fake
 * thumbnail. An optional poster image can sit behind the frame.
 */
export function VslPlayer({ title, poster }: { title: string; poster?: string }) {
  return (
    <div
      className="relative grid aspect-video place-items-center overflow-hidden rounded-2xl border border-dashed border-border bg-paper text-center"
      style={{
        backgroundImage: poster
          ? `url(${poster})`
          : "repeating-linear-gradient(135deg, transparent, transparent 11px, rgba(14,83,102,0.025) 11px, rgba(14,83,102,0.025) 22px)",
        backgroundSize: poster ? "cover" : undefined,
        backgroundPosition: "center",
      }}
      role="img"
      aria-label={`Video placeholder: ${title}`}
    >
      <div className="relative flex flex-col items-center">
        <span className="mb-3 inline-flex h-16 w-16 items-center justify-center rounded-full bg-accent-card opacity-80" aria-hidden>
          <svg width="26" height="26" viewBox="0 0 24 24" fill="none">
            <path d="M8 5l11 7-11 7V5Z" fill="#0E5366" />
          </svg>
        </span>
        <div className="text-[12px] font-semibold uppercase tracking-[0.14em] text-terracotta">[ VSL PLACEHOLDER ]</div>
        <p className="mt-2 max-w-[420px] px-4 text-[13px] text-ink-mute">{title}</p>
      </div>
    </div>
  );
}
