/**
 * OrigamiScene — the hero's full-bleed papercraft ocean, CRUMPLED then unfolded.
 *
 * A layer system of absolutely-positioned inline SVGs (no image assets, crisp at
 * any size, decorative / aria-hidden): a lightly-creased sky, three folded wave
 * bands spanning edge to edge behind a small paper sailboat, then one nearer band
 * over the hull so the boat sits IN the water, with a distant boat for scale.
 *
 * Crumple: the surfaces read as once-crumpled paper caught in raking light, baked
 * into the GEOMETRY (never a live filter on a moving layer). Each band carries a
 * coarse jittered facet mesh — faint white highlights + ink shadows (~5% tone
 * shifts) — with a sparse diagonal crease per cell, plus a lit crest edge over a
 * fold-shadow. The sky gets a lighter version; the boat keeps clean intentional
 * folds but its facets take the same subtle tonal splits so it belongs. Static
 * `.paper-grain` (grain) layers on top separately.
 *
 * All positioning, layering, entrance, and ambient drift/bob live in globals.css
 * (`.oc-*`), so this component is pure geometry. Renders as the hero background.
 */

// deterministic hash → [0,1)
function rnd(n: number) {
  const x = Math.sin(n * 12.9898) * 43758.5453;
  return x - Math.floor(x);
}

// A pleated (triangle-wave) band. Peaks vary in height (pv) and valleys in depth
// (vv) so the crest reads as folded paper, not a mechanical sawtooth. Overruns
// the viewBox (-40 → 1240) so drift never shows an edge. Returns the filled body,
// the lit crest edge, and a fold-shadow (the crest edge nudged down).
function pleat(base: number, amp: number, wave: number) {
  const x0 = -40;
  const x1 = 1240;
  const bottom = 360;
  const pv = [1, 0.66, 0.9, 0.58, 0.82, 0.72];
  const vv = [0.32, 0.5, 0.28, 0.44];
  const top: [number, number][] = [];
  let i = 0;
  for (let x = x0; x <= x1 + 0.5; x += wave / 2) {
    const y = i % 2 === 0 ? base - amp * pv[(i / 2) % pv.length] : base + amp * vv[((i - 1) / 2) % vv.length];
    top.push([x, Number(y.toFixed(1))]);
    i++;
  }
  const edge = top.map((p, k) => `${k === 0 ? "M" : "L"} ${p[0].toFixed(1)} ${p[1]}`).join(" ");
  const shadow = top.map((p, k) => `${k === 0 ? "M" : "L"} ${p[0].toFixed(1)} ${(p[1] + 4).toFixed(1)}`).join(" ");
  return { fill: `${edge} L ${x1} ${bottom} L ${x0} ${bottom} Z`, edge, shadow };
}

// A coarse crumple mesh over [x0..x1] × [y0..y1]: jittered triangle facets tinted
// faint highlight / shadow, and one diagonal crease per cell. y0 stays below the
// lowest wave valley so the mesh is always inside the band's solid fill (no clip).
function crumple(seed: number, y0: number, y1: number, cols: number, rows: number, faceA: number, creaseA: number) {
  const x0 = -40;
  const x1 = 1240;
  const cellW = (x1 - x0) / cols;
  const cellH = (y1 - y0) / rows;
  const pt = (r: number, c: number): [number, number] => {
    const edge = c === 0 || c === cols || r === 0 || r === rows;
    const jx = edge ? 0 : (rnd(seed + r * 137 + c * 7) - 0.5) * cellW * 0.55;
    const jy = edge ? 0 : (rnd(seed + r * 71 + c * 191) - 0.5) * cellH * 0.6;
    return [Number((x0 + cellW * c + jx).toFixed(1)), Number((y0 + cellH * r + jy).toFixed(1))];
  };
  const tri = (a: [number, number], b: [number, number], c: [number, number]) =>
    `M ${a[0]} ${a[1]} L ${b[0]} ${b[1]} L ${c[0]} ${c[1]} Z`;
  const facets: { d: string; fill: string }[] = [];
  const creases: { d: string; light: boolean }[] = [];
  const hi = `rgba(255,255,255,${faceA})`;
  const sh = `rgba(17,37,42,${(faceA * 0.85).toFixed(3)})`;
  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < cols; c++) {
      const a = pt(r, c);
      const b = pt(r, c + 1);
      const d = pt(r + 1, c + 1);
      const e = pt(r + 1, c);
      const up = rnd(seed + r * 13 + c * 29) > 0.5;
      facets.push({ d: tri(a, b, d), fill: up ? hi : sh });
      facets.push({ d: tri(a, d, e), fill: up ? sh : hi });
      creases.push({ d: `M ${a[0]} ${a[1]} L ${d[0]} ${d[1]}`, light: rnd(seed + r * 5 + c * 17) > 0.5 });
    }
  }
  const strokes = {
    hi: `rgba(255,255,255,${creaseA})`,
    sh: `rgba(17,37,42,${(creaseA * 0.7).toFixed(3)})`,
  };
  return { facets, creases, strokes };
}

// Back bands (back → front): a warm sand crest for the distant shore, then two
// teal sea bands.
const BACK_BANDS = [
  { cls: "oc-band-a", drift: "oc-drift-a", color: "#ECE3D0", edge: "#FAF6EE", base: 150, amp: 34, wave: 158, seed: 11 },
  { cls: "oc-band-b", drift: "oc-drift-b", color: "#C9DEE1", edge: "#E6F1F2", base: 150, amp: 38, wave: 132, seed: 23 },
  { cls: "oc-band-c", drift: "oc-drift-c", color: "#ABCFD3", edge: "#CFE4E6", base: 150, amp: 38, wave: 116, seed: 41 },
] as const;

const FRONT = { edge: "#AFD3D6", base: 142, amp: 38, wave: 102, seed: 67 };
// Mesh top sits below every band's lowest valley (~163) so it stays inside fill.
const MESH_TOP = 164;

function BandCrumple({ seed, cols, rows, faceA, creaseA }: { seed: number; cols: number; rows: number; faceA: number; creaseA: number }) {
  const { facets, creases, strokes } = crumple(seed, MESH_TOP, 360, cols, rows, faceA, creaseA);
  return (
    <>
      {facets.map((f, k) => (
        <path key={`f${k}`} d={f.d} fill={f.fill} />
      ))}
      {creases.map((c, k) => (
        <path key={`c${k}`} d={c.d} fill="none" stroke={c.light ? strokes.hi : strokes.sh} strokeWidth={0.7} strokeLinecap="round" />
      ))}
    </>
  );
}

export function OrigamiScene() {
  const front = pleat(FRONT.base, FRONT.amp, FRONT.wave);
  const sky = crumple(3, 40, 470, 5, 3, 0.028, 0.05);

  return (
    <>
      {/* Sky — a lighter-touch crumple behind the copy (very low tone, so text
          keeps its AA contrast). Static; does not drift. */}
      <svg className="oc-sky" aria-hidden preserveAspectRatio="none" viewBox="0 0 1200 500">
        {sky.facets.map((f, k) => (
          <path key={`sf${k}`} d={f.d} fill={f.fill} />
        ))}
        {sky.creases.map((c, k) => (
          <path key={`sc${k}`} d={c.d} fill="none" stroke={c.light ? sky.strokes.hi : sky.strokes.sh} strokeWidth={0.8} strokeLinecap="round" />
        ))}
      </svg>

      {BACK_BANDS.map((b) => {
        const p = pleat(b.base, b.amp, b.wave);
        return (
          <svg key={b.cls} className={`oc-band ${b.cls}`} aria-hidden preserveAspectRatio="none" viewBox="0 0 1200 360">
            <g className={b.drift}>
              <path d={p.fill} style={{ fill: b.color }} />
              <BandCrumple seed={b.seed} cols={7} rows={3} faceA={0.055} creaseA={0.13} />
              <path d={p.shadow} fill="none" stroke="rgba(17,37,42,0.09)" strokeWidth={2.4} strokeLinejoin="round" />
              <path d={p.edge} fill="none" stroke={b.edge} strokeWidth={1.8} strokeLinejoin="round" opacity={0.6} />
            </g>
          </svg>
        );
      })}

      {/* distant boat on the horizon — muted, no terracotta, gentle far-off bob */}
      <svg className="oc-dist" aria-hidden viewBox="0 0 180 120">
        <g className="oc-dist-bob">
          <path d="M2 78 L90 78 L90 104 L30 104 Z" fill="#E7F0F0" />
          <path d="M90 78 L178 78 L150 104 L90 104 Z" fill="#C6DADC" />
          <path d="M90 22 L90 78 L144 78 Z" fill="#B2C9CC" />
          <path d="M86 36 L86 78 L50 78 Z" fill="#D8E7E7" />
        </g>
      </svg>

      {/* the paper sailboat — clean intentional folds, facets tonally split to
          belong to the crumpled world */}
      <svg className="oc-boat" aria-hidden viewBox="0 0 180 120">
        <g className="oc-boat-bob">
          {/* hull — two folded facets + faint shadow wedges for tonal life */}
          <path d="M2 78 L90 78 L90 104 L30 104 Z" fill="#FFFFFF" />
          <path d="M90 78 L178 78 L150 104 L90 104 Z" fill="#BAD3D7" />
          <path d="M30 104 L90 104 L90 92 Z" fill="rgba(17,37,42,0.05)" />
          <path d="M90 92 L90 104 L150 104 Z" fill="rgba(17,37,42,0.07)" />
          {/* foresail (white paper) with a soft inner fold */}
          <path d="M86 24 L86 78 L46 78 Z" fill="#FFFFFF" />
          <path d="M86 24 L86 78 L64 78 Z" fill="rgba(17,37,42,0.04)" />
          {/* mainsail — terracotta accent, lit inner fold + a faint leech shadow */}
          <path d="M90 4 L90 78 L150 78 Z" fill="#D9762F" />
          <path d="M90 4 L90 78 L120 78 Z" fill="#E0833D" />
          <path d="M132 78 L150 78 L90 4 Z" fill="rgba(17,37,42,0.06)" />
          {/* masthead pennant */}
          <path d="M90 4 L90 13 L104 8 Z" fill="#D9762F" />
          {/* fold creases */}
          <path d="M90 4 L90 104" stroke="#0E5366" strokeWidth={1.1} opacity={0.42} strokeLinecap="round" />
          <path d="M4 78 L176 78" stroke="#0E5366" strokeWidth={1.1} opacity={0.34} strokeLinecap="round" />
          <path d="M90 4 L120 78" stroke="#B85422" strokeWidth={1} opacity={0.5} strokeLinecap="round" />
          <path d="M86 24 L46 78" stroke="#0E5366" strokeWidth={1} opacity={0.32} strokeLinecap="round" />
        </g>
      </svg>

      {/* nearer wave band — the largest visible water, so the fullest crumple */}
      <svg className="oc-band oc-band-front" aria-hidden preserveAspectRatio="none" viewBox="0 0 1200 360">
        <defs>
          <linearGradient id="oc-deep-water" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0" stopColor="#94BEC3" />
            <stop offset="1" stopColor="#7AA9AF" />
          </linearGradient>
        </defs>
        <g className="oc-drift-d">
          <path d={front.fill} style={{ fill: "url(#oc-deep-water)" }} />
          <BandCrumple seed={FRONT.seed} cols={9} rows={5} faceA={0.06} creaseA={0.15} />
          <path d={front.shadow} fill="none" stroke="rgba(17,37,42,0.1)" strokeWidth={2.6} strokeLinejoin="round" />
          <path d={front.edge} fill="none" stroke={FRONT.edge} strokeWidth={1.8} strokeLinejoin="round" opacity={0.5} />
        </g>
      </svg>
    </>
  );
}
