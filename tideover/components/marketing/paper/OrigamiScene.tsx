/**
 * OrigamiScene — the hero's signature: a code-drawn papercraft boat riding
 * layered folded-paper waves. 100% inline SVG (no image asset, crisp at any
 * size), decorative (`aria-hidden`), and animated purely with CSS transforms so
 * it ships self-contained and JS-free.
 *
 * Composition (viewBox 480×360):
 *  - Three folded wave bands BEHIND the boat (sand-2 → light-teal → sea tint),
 *    then the boat, then one nearer band IN FRONT of the hull so the boat sits
 *    IN the water. Crests are pleated (zigzag), not smooth curves — origami.
 *  - The boat is a folded paper sailboat: a two-facet hull (lit white + teal
 *    shadow fold), a white foresail, and a terracotta mainsail — the ONE accent.
 *
 * Motion (all in globals.css, transform/opacity only; the scene IS the page's
 * one ambient element, the deliberate exception to one-ambient-element):
 *  - Entrance: wave bands rise/unfold in (staggered), the boat drops and settles.
 *  - Ambient: the boat bobs (~6s) while each band drifts horizontally at its own
 *    rate/direction, so the water reads alive but calm — a harbor, not a storm.
 *  - prefers-reduced-motion: the global kill in globals.css zeroes every
 *    animation, and every element's resting style is the finished, visible state,
 *    so the whole scene renders complete and STATIC.
 */

// A pleated (triangle-wave) wave band. Returns the filled body `d` and the
// top-edge-only `d` used for the lighter fold-crease highlight. Bands overrun
// the viewBox horizontally (-80 → 560) so the drift never exposes an edge.
function pleat(base: number, amp: number, wave: number) {
  const x0 = -80;
  const x1 = 560;
  const bottom = 360;
  const top: string[] = [];
  let i = 0;
  for (let x = x0; x <= x1 + 0.5; x += wave / 2) {
    // Sharp peaks up, shallow valleys — reads as folded crests catching light.
    const y = i % 2 === 0 ? base - amp : base + amp * 0.34;
    top.push(`${i === 0 ? "M" : "L"} ${x.toFixed(1)} ${y.toFixed(1)}`);
    i++;
  }
  const edge = top.join(" ");
  return { fill: `${edge} L ${x1} ${bottom} L ${x0} ${bottom} Z`, edge };
}

// Bands behind the boat (back → front): a warm sand crest for the distant
// shore, then two teal sea bands. enter = entrance stagger delay.
const BACK_BANDS = [
  { key: "a", color: "#EFE7D8", edge: "#FBF8F1", base: 160, amp: 9, wave: 88, drift: "oc-drift-a", enter: "0s", shadow: false },
  { key: "b", color: "#DCE9EC", edge: "#EEF5F6", base: 174, amp: 11, wave: 66, drift: "oc-drift-b", enter: "0.1s", shadow: true },
  { key: "c", color: "#C3DBDE", edge: "#DCEBEC", base: 186, amp: 12, wave: 74, drift: "oc-drift-c", enter: "0.2s", shadow: true },
] as const;

// The nearer band, painted OVER the hull so the boat sits in the water. Its
// body carries a soft top→bottom depth gradient (#oc-deep-water).
const FRONT_BAND = { edge: "#BFE0E3", base: 194, amp: 12, wave: 58, drift: "oc-drift-d", enter: "0.32s" } as const;

const CREASE = "#0E5366";

export function OrigamiScene() {
  const front = pleat(FRONT_BAND.base, FRONT_BAND.amp, FRONT_BAND.wave);

  return (
    <svg
      viewBox="0 0 480 360"
      role="presentation"
      aria-hidden
      preserveAspectRatio="xMidYMid meet"
      style={{ display: "block", width: "100%", height: "100%" }}
    >
      <defs>
        <linearGradient id="oc-deep-water" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#A9CFD3" />
          <stop offset="1" stopColor="#96C0C5" />
        </linearGradient>
      </defs>

      {/* wave bands behind the boat */}
      {BACK_BANDS.map((b) => {
        const { fill, edge } = pleat(b.base, b.amp, b.wave);
        return (
          <g key={b.key} className="oc-wave-enter" style={{ animationDelay: b.enter }}>
            <g className={b.drift}>
              <path
                d={fill}
                style={{ fill: b.color, filter: b.shadow ? "drop-shadow(0 -2px 2px rgba(17,37,42,0.06))" : undefined }}
              />
              <path d={edge} fill="none" stroke={b.edge} strokeWidth={1.4} strokeLinejoin="round" strokeLinecap="round" opacity={0.6} />
            </g>
          </g>
        );
      })}

      {/* the paper boat — drops in, then bobs; hull sits into the front band */}
      <g className="oc-boat-enter">
        <g className="oc-boat-bob">
          <g transform="translate(120,55) scale(1.33)">
            {/* hull — two folded facets split by the centre crease */}
            <path d="M2 78 L90 78 L90 104 L30 104 Z" fill="#FFFFFF" />
            <path d="M90 78 L178 78 L150 104 L90 104 Z" fill="#BAD3D7" />

            {/* foresail (white paper) */}
            <path d="M86 24 L86 78 L46 78 Z" fill="#FFFFFF" />

            {/* mainsail — terracotta, the single accent, with a lit inner fold */}
            <path d="M90 4 L90 78 L150 78 Z" fill="#D9762F" />
            <path d="M90 4 L90 78 L120 78 Z" fill="#E0833D" />

            {/* masthead pennant */}
            <path d="M90 4 L90 13 L104 8 Z" fill="#D9762F" />

            {/* fold creases */}
            <path d="M90 4 L90 104" stroke={CREASE} strokeWidth={1.1} opacity={0.42} strokeLinecap="round" />
            <path d="M4 78 L176 78" stroke={CREASE} strokeWidth={1.1} opacity={0.34} strokeLinecap="round" />
            <path d="M90 4 L120 78" stroke="#B85422" strokeWidth={1} opacity={0.5} strokeLinecap="round" />
            <path d="M86 24 L46 78" stroke={CREASE} strokeWidth={1} opacity={0.32} strokeLinecap="round" />
          </g>
        </g>
      </g>

      {/* nearer wave band, over the hull */}
      <g className="oc-wave-enter" style={{ animationDelay: FRONT_BAND.enter }}>
        <g className={FRONT_BAND.drift}>
          <path d={front.fill} style={{ fill: "url(#oc-deep-water)", filter: "drop-shadow(0 -2px 3px rgba(17,37,42,0.08))" }} />
          <path
            d={front.edge}
            fill="none"
            stroke={FRONT_BAND.edge}
            strokeWidth={1.4}
            strokeLinejoin="round"
            strokeLinecap="round"
            opacity={0.6}
          />
        </g>
      </g>
    </svg>
  );
}
