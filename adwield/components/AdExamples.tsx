"use client";

import { motion, useReducedMotion, type Variants } from "framer-motion";

/**
 * AdExamples — "The Loadout Wall" showcase (Quest 02b · between the mechanism
 * and the proof). A wall of same-shaped vertical (9:16) tiles that mirrors the
 * native social-ad format and gives the page the "this is a factory" feel that
 * Creatify gets from its scrolling ad strip — but the STRUCTURE is the only
 * thing borrowed.
 *
 * PROOF-ONLY (hard rule): every tile is a clearly-labeled PLACEHOLDER. No real
 * or implied client ads, no brand/platform logos, no "as seen on", no metric
 * overlays, no fake video playback. Each tile carries a literal `[ ad example ]`
 * label, a persistent `SAMPLE SLOT` corner badge, and an in-flavor angle/slot
 * tag (ANGLE 01 · HOOK …) so the 4-angles × 24-variations loadout reads as
 * STRUCTURE, not as a claim. When real renders exist later, tiles swap in 1:1
 * with no layout change.
 *
 * Motion: two slow CSS-keyframe marquee rows scrolling opposite directions. The
 * marquee is plain CSS `animation`, so it is fully disabled (rows render as a
 * static, mask-clipped strip) under prefers-reduced-motion via the global
 * reduced-motion block in globals.css. Hovering the strip pauses the drift
 * (`animation-play-state`); hovering a tile lifts it with a steel-blue HUD glow.
 * The header/caption reveals use framer-motion, guarded by `useReducedMotion`.
 */
export type AdExamplesProps = Record<string, never>;

const EASE_OUT = [0.2, 0.7, 0.2, 1] as const;

/** Scroll-reveal for the header/caption (mirrors the other sections' `.rv`). */
const revealVariants: Variants = {
  hidden: { opacity: 0, y: 24 },
  show: (i: number) => ({
    opacity: 1,
    y: 0,
    transition: { duration: 0.7, ease: EASE_OUT, delay: i * 0.07 },
  }),
};

function Reveal({
  children,
  i = 0,
  className,
}: {
  children: React.ReactNode;
  i?: number;
  className?: string;
}) {
  const reduce = useReducedMotion();
  return (
    <motion.div
      className={className}
      custom={i}
      variants={reduce ? undefined : revealVariants}
      initial={reduce ? false : "hidden"}
      whileInView={reduce ? undefined : "show"}
      viewport={{ once: true, amount: 0.25 }}
    >
      {children}
    </motion.div>
  );
}

interface Tile {
  /** Slot number, e.g. "07". */
  slot: string;
  /** In-flavor angle label running along the strip. */
  angle: string;
  /** Slot type, e.g. "HOOK" / "UGC". */
  kind: string;
  /** Rare-color accent token (drives the corner stripe + glow). */
  rare: "equip" | "crit" | "epic" | "gold";
  /** The single crit slot pulses (parity with the Loadout panel). */
  crit?: boolean;
  /**
   * Optional sample-video source. When set, the tile plays a muted, looping,
   * object-covered clip behind the placeholder label so the founder can preview
   * the wall WITH MOTION. These are FREE, commercially-licensed stock clips
   * served locally from /public/samples — never Adwield client work, never a
   * real render. The `sample` corner badge + `[ ad example ]` label stay on, so
   * a video tile reads as a clearly-labeled PLACEHOLDER, not portfolio.
   */
  src?: string;
}

/**
 * 16 same-shaped placeholder tiles — echoes the 24-variation loadout AS
 * STRUCTURE (4 angles, slot tags), never as a metric. Order cycles the four
 * angles so the marquee reads as a full cycle's worth of slots. Six tiles carry
 * a `src` so the wall previews with motion (muted, looping sample clips); the
 * rest stay as static hatched placeholders so the mix reads as "slots, some
 * filled with samples," never as a finished portfolio.
 */
const TILES: Tile[] = [
  { slot: "01", angle: "Angle 01", kind: "HOOK", rare: "equip", src: "/samples/loadout-01.mp4" },
  { slot: "02", angle: "Angle 02", kind: "UGC", rare: "epic" },
  { slot: "03", angle: "Angle 03", kind: "DEMO", rare: "crit", src: "/samples/loadout-02.mp4" },
  { slot: "04", angle: "Angle 04", kind: "OFFER", rare: "gold" },
  { slot: "05", angle: "Angle 01", kind: "HOOK", rare: "equip", src: "/samples/loadout-03.mp4" },
  { slot: "06", angle: "Angle 02", kind: "UGC", rare: "epic" },
  { slot: "07", angle: "Angle 03", kind: "DEMO", rare: "crit", crit: true, src: "/samples/loadout-04.mp4" },
  { slot: "08", angle: "Angle 04", kind: "PROOF", rare: "gold" },
  { slot: "09", angle: "Angle 01", kind: "HOOK", rare: "equip", src: "/samples/loadout-05.mp4" },
  { slot: "10", angle: "Angle 02", kind: "UGC", rare: "epic" },
  { slot: "11", angle: "Angle 03", kind: "DEMO", rare: "crit", src: "/samples/loadout-06.mp4" },
  { slot: "12", angle: "Angle 04", kind: "OFFER", rare: "gold" },
  { slot: "13", angle: "Angle 01", kind: "HOOK", rare: "equip" },
  { slot: "14", angle: "Angle 02", kind: "STATIC", rare: "epic" },
  { slot: "15", angle: "Angle 03", kind: "DEMO", rare: "crit" },
  { slot: "16", angle: "Angle 04", kind: "PROOF", rare: "gold" },
];

const RARE_VAR: Record<Tile["rare"], string> = {
  equip: "var(--equip)",
  crit: "var(--crit)",
  epic: "var(--epic)",
  gold: "var(--gold)",
};

const RARE_GLOW: Record<Tile["rare"], string> = {
  equip: "var(--equip-glow)",
  crit: "var(--crit-glow)",
  epic: "var(--epic-glow)",
  gold: "var(--gold-glow)",
};

/**
 * Scoped marquee CSS. Two opposite-direction keyframe tracks; the content is
 * doubled in markup, so translating -50% / +50% loops seamlessly. The whole
 * strip pauses on hover. All of this is `animation`, so the global
 * `prefers-reduced-motion` block (globals.css) freezes it automatically.
 */
const MARQUEE_CSS = `
@keyframes ax-marquee-l { from { transform: translateX(0); } to { transform: translateX(-50%); } }
@keyframes ax-marquee-r { from { transform: translateX(-50%); } to { transform: translateX(0); } }
.ax-strip:hover .ax-track { animation-play-state: paused; }
.ax-track { animation-timing-function: linear; animation-iteration-count: infinite; will-change: transform; }
.ax-track-l { animation-name: ax-marquee-l; }
.ax-track-r { animation-name: ax-marquee-r; }
@media (prefers-reduced-motion: reduce) {
  .ax-track { transform: translateX(0) !important; }
}
`;

/** A single vertical 9:16 PLACEHOLDER ad tile. */
function AdTile({ tile }: { tile: Tile }) {
  const accent = RARE_VAR[tile.rare];
  const glow = RARE_GLOW[tile.rare];
  const reduce = useReducedMotion();
  // A video tile previews with motion ONLY when motion is allowed. Under
  // prefers-reduced-motion we fall back to the static hatched placeholder so
  // nothing autoplays.
  const isVideo = Boolean(tile.src) && !reduce;

  return (
    <div
      className="group relative flex aspect-[9/16] w-[156px] flex-none flex-col overflow-hidden rounded-[6px] border border-frame bg-[linear-gradient(180deg,var(--panel-a),var(--panel-b))] transition-[box-shadow,transform,border-color] duration-200 hover:-translate-y-1 hover:border-[color-mix(in_srgb,var(--equip)_55%,transparent)] hover:shadow-[inset_0_0_0_1px_color-mix(in_srgb,var(--equip)_30%,transparent),inset_0_0_44px_-10px_var(--equip-glow),0_18px_40px_-22px_#000] sm:w-[176px]"
    >
      {/* left rarity stripe (parity with .slot-item) */}
      <span
        className="absolute inset-y-0 left-0 z-20 w-[3px]"
        style={{ background: accent }}
        aria-hidden="true"
      />

      {/* persistent corner badge — the literal trust signal (stays on video tiles) */}
      <span className="absolute right-[7px] top-[7px] z-20 rounded-[3px] border border-frame-soft bg-[rgba(8,11,18,0.72)] px-[6px] py-[3px] font-mono text-[8px] uppercase leading-none tracking-[0.16em] text-ink-mute">
        Sample slot
      </span>

      {/* slot tag (top-left) */}
      <div className="relative z-20 flex items-center gap-[6px] px-[11px] pt-[11px]">
        <span
          className="font-mono text-[9px] uppercase leading-none tracking-[0.14em]"
          style={{ color: accent }}
        >
          {tile.angle}
        </span>
      </div>

      {/* center body — a muted sample loop (motion) OR the hatched placeholder */}
      <div
        className="relative m-[9px] mt-[8px] flex flex-1 items-center justify-center overflow-hidden rounded-[4px] border border-dashed border-frame text-center"
        style={{
          backgroundImage: isVideo
            ? undefined
            : "repeating-linear-gradient(135deg, transparent, transparent 9px, rgba(190,220,255,0.025) 9px, rgba(190,220,255,0.025) 18px)",
        }}
      >
        {isVideo && (
          <>
            {/* free, commercially-licensed SAMPLE clip — true 9:16 vertical
                footage object-covered into the matching 9:16 frame, so it fills
                the tile cleanly with no crop. muted/loop/autoplay/playsInline;
                metadata-only preload keeps the wall light. This is a placeholder
                preview, never client work. */}
            <video
              className="absolute inset-0 h-full w-full object-cover opacity-[0.82]"
              src={tile.src}
              muted
              loop
              autoPlay
              playsInline
              preload="metadata"
              aria-hidden="true"
            />
            {/* legibility veil so the labels read over the footage */}
            <span
              className="pointer-events-none absolute inset-0 bg-[linear-gradient(180deg,rgba(8,11,18,0.55),rgba(8,11,18,0.12)_38%,rgba(8,11,18,0.62))]"
              aria-hidden="true"
            />
            {/* explicit SAMPLE chip — keeps a video tile clearly a placeholder */}
            <span className="absolute bottom-[7px] left-[7px] z-10 rounded-[3px] border border-frame-soft bg-[rgba(8,11,18,0.7)] px-[5px] py-[2px] font-mono text-[8px] uppercase leading-none tracking-[0.16em] text-gold">
              sample
            </span>
          </>
        )}

        {/* faint play glyph — only on the static (non-video) tiles */}
        {!isVideo && (
          <span
            className="pointer-events-none absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-[26px] opacity-20 transition-opacity duration-200 group-hover:opacity-35"
            aria-hidden="true"
          >
            <svg width="34" height="34" viewBox="0 0 34 34" fill="none">
              <circle cx="17" cy="17" r="15.5" stroke={accent} strokeWidth="1.2" />
              <path d="M14 12 L23 17 L14 22 Z" fill={accent} />
            </svg>
          </span>
        )}

        <div className="relative z-10 px-2">
          <div className="font-mono text-[10px] uppercase leading-tight tracking-[0.12em] text-gold">
            [ ad example ]
          </div>
          {!isVideo && (
            <p className="mt-[6px] font-mono text-[9px] leading-[1.4] tracking-[0.04em] text-ink-mute">
              your loadout
              <br />
              renders here
            </p>
          )}
        </div>
      </div>

      {/* footer slot line: 9:16 · variation · kind */}
      <div className="relative z-20 flex items-center justify-between gap-2 px-[11px] pb-[11px]">
        <span className="font-mono text-[9px] uppercase leading-none tracking-[0.1em] text-ink-mute">
          9:16 · v{tile.slot}
        </span>
        <span className="inline-flex items-center gap-[5px] font-mono text-[9px] uppercase leading-none tracking-[0.1em] text-ink-soft">
          <span
            className={tile.crit ? "dot crit" : "dot"}
            style={
              tile.crit
                ? undefined
                : { background: accent, boxShadow: `0 0 10px ${glow}` }
            }
            aria-hidden="true"
          />
          {tile.crit ? "CRIT" : tile.kind}
        </span>
      </div>
    </div>
  );
}

/**
 * One marquee row. Renders the tile set TWICE back-to-back; the CSS track
 * translates by half its width on an infinite linear loop, so the seam is
 * invisible. `dir = "l"` drifts left, `"r"` drifts right.
 */
function MarqueeRow({
  tiles,
  dir,
  duration,
}: {
  tiles: Tile[];
  dir: "l" | "r";
  duration: number;
}) {
  const doubled = [...tiles, ...tiles];
  return (
    <div
      className="ax-strip relative overflow-hidden"
      style={{
        WebkitMaskImage:
          "linear-gradient(90deg, transparent, #000 7%, #000 93%, transparent)",
        maskImage:
          "linear-gradient(90deg, transparent, #000 7%, #000 93%, transparent)",
      }}
    >
      <div
        className={`ax-track ax-track-${dir} flex w-max gap-[14px] py-[2px]`}
        style={{ animationDuration: `${duration}s` }}
      >
        {doubled.map((tile, idx) => (
          <AdTile key={`${tile.slot}-${idx}`} tile={tile} />
        ))}
      </div>
    </div>
  );
}

export default function AdExamples(_props: AdExamplesProps) {
  void _props;

  // Two rows, offset content so the wall doesn't read as a mirror.
  const rowA = TILES;
  const rowB = [...TILES.slice(8), ...TILES.slice(0, 8)];

  return (
    <section
      // Leads the page directly under the hero (it took the Equipped Kit box's
      // place), so the top padding is tightened from the default `.section` 88px
      // to ~30px — that lifts the FIRST tile row above the fold on a 1440x900
      // desktop. A compact header sits over the wall; the full explainer drops
      // below it, so the wall (the point) is the thing that leads.
      className="section !pt-[30px] !pb-[72px] md:!pt-[34px]"
      id="examples"
      data-quest="Loadout wall surveyed"
      data-rare="equip"
      data-xp="100"
      data-kicker="Wall surveyed"
    >
      <style dangerouslySetInnerHTML={{ __html: MARQUEE_CSS }} />

      <div className="wrap">
        {/* compact lead header — quest chip + the headline on one tight block */}
        <Reveal className="flex flex-wrap items-end justify-between gap-x-6 gap-y-3">
          <div className="qhead !mb-0">
            <span className="qmarker" aria-hidden="true">
              <svg width="30" height="30" viewBox="0 0 30 30" fill="none">
                <rect
                  x="5"
                  y="6"
                  width="8"
                  height="18"
                  rx="1.4"
                  stroke="#E3C778"
                  strokeWidth="1.5"
                />
                <rect
                  x="17"
                  y="6"
                  width="8"
                  height="18"
                  rx="1.4"
                  stroke="#E3C778"
                  strokeWidth="1.5"
                />
                <path
                  d="M7.6 11.5h2.8M19.6 11.5h2.8"
                  stroke="#E3C778"
                  strokeWidth="1.3"
                  strokeLinecap="round"
                />
              </svg>
            </span>
            <div className="qchip">
              <span className="q">Quest 02b</span>
              <span className="s">The Loadout Wall</span>
            </div>
          </div>

          <h2 className="!mt-0 max-w-[16ch] text-right text-[clamp(22px,2.4vw,30px)] !leading-[1.1]">
            This is the shape of a loadout.
          </h2>
        </Reveal>
      </div>

      {/* full-bleed strip — the wall escapes .wrap so it reads as a factory.
          Pulled up tight under the header so its first row clears the fold. */}
      <Reveal i={1} className="relative mt-7">
        <div className="flex flex-col gap-[14px]">
          <MarqueeRow tiles={rowA} dir="l" duration={56} />
          <MarqueeRow tiles={rowB} dir="r" duration={64} />
        </div>
      </Reveal>

      <div className="wrap">
        <Reveal i={2}>
          <p className="mx-auto mt-8 max-w-[72ch] text-center text-[14px] leading-[1.6] text-ink-mute">
            A wall of vertical slots in the native ad shape &mdash; the
            weapon&rsquo;s output, laid out. Every tile is a labeled{" "}
            <strong className="text-ink">placeholder</strong>; the moving ones are
            free <strong className="text-ink">sample</strong> clips standing in for
            motion, never client work. 4 angles &times; 24 variations, every two
            weeks &mdash; launched and tagged in your account. The moment a real
            loadout ships, it swaps in here in your product&rsquo;s place. No mock
            metrics, no borrowed logos, no &ldquo;as seen on.&rdquo;
          </p>
        </Reveal>
      </div>
    </section>
  );
}
