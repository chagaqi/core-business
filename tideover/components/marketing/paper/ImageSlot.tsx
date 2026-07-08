import { clsx } from "clsx";
import type { ReactNode } from "react";

/**
 * ImageSlot — a labeled placeholder for a shot-list image Dylan sources later.
 *
 * Ships a deliberate, on-brand paper-wave fallback (layered gradient + a calm
 * SVG tide + a labeled chip) so a slot reads as *intentional*, never broken.
 * The wrapper carries `data-image-slot="<id>"` and emits an HTML comment naming
 * the shot so the drop-in target is findable in both source and the rendered
 * DOM. When the real asset arrives, the caller passes it as `children` (an
 * `<Image>`/`<img>`/`<picture>`) and the fallback is replaced.
 *
 * `id` MUST match an entry in docs/marketing-redesign/IMAGE-SHOT-LIST.md.
 * Server component, zero JS.
 */
const ROUNDED: Record<string, string> = {
  none: "rounded-none",
  lg: "rounded-lg",
  xl: "rounded-xl",
  "2xl": "rounded-2xl",
  "3xl": "rounded-3xl",
};

export function ImageSlot({
  slotId,
  label,
  shot,
  aspect = "3/2",
  rounded = "2xl",
  className,
  children,
}: {
  /** Shot-list id, e.g. "hero-boat". Must exist in IMAGE-SHOT-LIST.md. */
  slotId: string;
  /** Short human label shown on the fallback (defaults to the id). */
  label?: string;
  /** One-line art-direction note from the shot list, shown muted on the fallback. */
  shot?: string;
  /** CSS aspect-ratio, e.g. "3/2", "1/1", "4/3". */
  aspect?: string;
  rounded?: keyof typeof ROUNDED;
  className?: string;
  /** The real asset once sourced — replaces the fallback when present. */
  children?: ReactNode;
}) {
  const radius = ROUNDED[rounded] ?? ROUNDED["2xl"];

  return (
    <div
      data-image-slot={slotId}
      className={clsx("relative w-full overflow-hidden", radius, className)}
      style={{ aspectRatio: aspect }}
    >
      {/* Drop-in marker for Dylan / tooling — a real comment node in the rendered DOM. */}
      <span
        hidden
        dangerouslySetInnerHTML={{
          __html: `<!-- IMAGE SLOT: ${slotId} — replace with the matching shot from docs/marketing-redesign/IMAGE-SHOT-LIST.md -->`,
        }}
      />

      {children ?? (
        <div
          aria-hidden
          className="absolute inset-0 flex items-center justify-center border border-border"
          style={{
            background:
              "linear-gradient(180deg, var(--sand) 0%, var(--sand-2) 46%, var(--accent-card) 100%)",
          }}
        >
          {/* calm layered tide — the same cut-paper motif, drawn as a fallback */}
          <svg
            className="absolute inset-x-0 bottom-0"
            viewBox="0 0 1200 260"
            preserveAspectRatio="none"
            aria-hidden
            style={{ display: "block", width: "100%", height: "62%" }}
          >
            <path d="M0 150 C220 118 420 182 640 150 C860 120 1030 180 1200 150 L1200 260 L0 260 Z" style={{ fill: "var(--accent-card)" }} />
            <path d="M0 188 C240 156 440 216 660 186 C880 158 1050 214 1200 186 L1200 260 L0 260 Z" style={{ fill: "#D2E2E4" }} />
            {/* single terracotta accent — the one bright element per shot */}
            <circle cx="900" cy="150" r="7" style={{ fill: "var(--terracotta)" }} />
          </svg>

          <div className="relative z-10 max-w-[86%] text-center">
            <span className="mb-2 inline-flex items-center gap-1.5 rounded-full border border-[#D2E2E4] bg-paper/80 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.1em] text-teal">
              <span className="h-1.5 w-1.5 rounded-full" style={{ background: "var(--terracotta)" }} />
              Image slot
            </span>
            <div className="font-serif text-[15px] font-semibold text-ink">{label ?? slotId}</div>
            {shot && <p className="mx-auto mt-1 max-w-[34ch] text-[12.5px] leading-snug text-ink-mute">{shot}</p>}
            <div className="mt-1.5 font-mono text-[11px] tracking-[0.04em] text-ink-mute">
              {slotId} · {aspect.replace("/", ":")}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
