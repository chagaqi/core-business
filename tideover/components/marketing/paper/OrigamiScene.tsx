/**
 * OrigamiScene — the hero's full-bleed papercraft ocean: crumpled paper waves
 * that ROLL FORWARD like a treadmill, a small boat that SAILS across, and white
 * cut-paper edges that make the bands read as separately-cut stacked sheets.
 *
 * Seamless treadmill (Goodkatz structure): every band's geometry is PERIODIC —
 * built by tiling one period across the run, one spare period past each edge —
 * and the loop translates the inner <g> by exactly one period in SVG USER UNITS
 * (globals.css .oc-roll-*, translate3d/linear/infinite). User-unit transforms
 * stretch with the viewBox, so the seam survives preserveAspectRatio="none".
 * All bands travel the SAME direction; front fastest → back slowest. Vertical
 * swell is a CSS-px translateY carry on each band's outer wrapper (own duration,
 * not a multiple of its X duration), so X and Y compose without merging.
 *
 * Cut-paper edges (per band, back→front inside the one rolling group): a dark
 * cast-shadow copy, a WHITE copy whose crest uses a DIFFERENT jitter seed so the
 * visible white gap varies ~2-5 units (reads as two separately-cut sheets, not an
 * outline sticker), then the colored band + its crumple facets. The boat is
 * die-cut: a merged silhouette stroked white behind the facets, plus a baked
 * contact shadow. All texture is baked geometry — never a live filter on a moving
 * layer. Reduced motion (global kill) leaves the whole landscape static + visible.
 */

// deterministic hash → [0,1)
function rnd(n: number) {
  const x = Math.sin(n * 12.9898) * 43758.5453;
  return x - Math.floor(x);
}

const PV = [1, 0.66, 0.9, 0.58, 0.82, 0.72];
const VV = [0.34, 0.5, 0.3, 0.44];

// Periodic crest points across [xS..xE] at step wave/2. y comes from one period's
// pattern (indexed mod 2·pp) so the run tiles seamlessly under a shift of P=pp·wave.
function crest(seed: number, base: number, amp: number, wave: number, pp: number, xS: number, xE: number, jit: number) {
  const half = wave / 2;
  const per = 2 * pp;
  const pat: number[] = [];
  for (let k = 0; k < per; k++) {
    const j = (rnd(seed + jit + k * 3.3) - 0.5) * amp * 0.12;
    pat.push(k % 2 === 0 ? base - amp * PV[(k / 2) % PV.length] + j : base + amp * VV[((k - 1) / 2) % VV.length] + j);
  }
  const pts: [number, number][] = [];
  const kS = Math.floor(xS / half);
  const kE = Math.ceil(xE / half);
  for (let k = kS; k <= kE; k++) {
    pts.push([Number((k * half).toFixed(1)), Number(pat[((k % per) + per) % per].toFixed(1))]);
  }
  return pts;
}
const edgeD = (pts: [number, number][]) => pts.map((p, i) => `${i ? "L" : "M"} ${p[0]} ${p[1]}`).join(" ");
const fillD = (pts: [number, number][]) => {
  const f = pts[0];
  const l = pts[pts.length - 1];
  return `${edgeD(pts)} L ${l[0]} 360 L ${f[0]} 360 Z`;
};

// Periodic crumple over [xS..xE] × [y0..360], one column per wavelength (so it
// tiles at P). Jitter + tone seed by the column's PERIOD index → seamless.
function crumpleTiled(seed: number, xS: number, xE: number, y0: number, wave: number, pp: number, rows: number, faceA: number, creaseA: number) {
  const per = pp;
  const cellH = (360 - y0) / rows;
  const pt = (r: number, c: number): [number, number] => {
    const cm = ((c % per) + per) % per;
    const jx = (rnd(seed + cm * 137 + r * 7) - 0.5) * wave * 0.5;
    const jy = r === 0 || r === rows ? 0 : (rnd(seed + cm * 71 + r * 191) - 0.5) * cellH * 0.5;
    return [Number((c * wave + jx).toFixed(1)), Number((y0 + cellH * r + jy).toFixed(1))];
  };
  const tri = (a: [number, number], b: [number, number], c: [number, number]) => `M ${a[0]} ${a[1]} L ${b[0]} ${b[1]} L ${c[0]} ${c[1]} Z`;
  const facets: { d: string; fill: string }[] = [];
  const creases: { d: string; light: boolean }[] = [];
  const hi = `rgba(255,255,255,${faceA})`;
  const sh = `rgba(17,37,42,${(faceA * 0.85).toFixed(3)})`;
  const cS = Math.floor(xS / wave);
  const cE = Math.ceil(xE / wave);
  for (let r = 0; r < rows; r++) {
    for (let c = cS; c < cE; c++) {
      const a = pt(r, c);
      const b = pt(r, c + 1);
      const d = pt(r + 1, c + 1);
      const e = pt(r + 1, c);
      const up = rnd(seed + (((c % per) + per) % per) * 13 + r * 29) > 0.5;
      facets.push({ d: tri(a, b, d), fill: up ? hi : sh });
      facets.push({ d: tri(a, d, e), fill: up ? sh : hi });
      creases.push({ d: `M ${a[0]} ${a[1]} L ${d[0]} ${d[1]}`, light: rnd(seed + c * 5 + r * 17) > 0.5 });
    }
  }
  return { facets, creases, ch: `rgba(255,255,255,${creaseA})`, cs: `rgba(17,37,42,${(creaseA * 0.7).toFixed(3)})` };
}

type Band = { cls: string; roll: string; color: string; edge: string; base: number; amp: number; wave: number; pp: number; seed: number; rows: number; grad?: boolean };

const BANDS: Band[] = [
  { cls: "oc-band-a", roll: "oc-roll-a", color: "#ECE3D0", edge: "#FAF6EE", base: 150, amp: 34, wave: 158, pp: 4, seed: 11, rows: 2 },
  { cls: "oc-band-b", roll: "oc-roll-b", color: "#C9DEE1", edge: "#E6F1F2", base: 150, amp: 38, wave: 132, pp: 5, seed: 23, rows: 2 },
  { cls: "oc-band-c", roll: "oc-roll-c", color: "#ABCFD3", edge: "#CFE4E6", base: 150, amp: 38, wave: 116, pp: 5, seed: 41, rows: 2 },
  { cls: "oc-band-front", roll: "oc-roll-d", color: "url(#oc-deep-water)", edge: "#AFD3D6", base: 142, amp: 38, wave: 102, pp: 6, seed: 67, rows: 4, grad: true },
];

function BandLayer({ b }: { b: Band }) {
  const P = b.pp * b.wave;
  const xS = -b.wave;
  const xE = 1200 + P + b.wave;
  const colored = crest(b.seed, b.base, b.amp, b.wave, b.pp, xS, xE, 0);
  const white = crest(b.seed, b.base - 4, b.amp, b.wave, b.pp, xS, xE, 50); // different jitter → varying gap
  const dark = crest(b.seed, b.base - 7, b.amp, b.wave, b.pp, xS, xE, 0);
  const cr = crumpleTiled(b.seed, xS, xE, 168, b.wave, b.pp, b.rows, b.grad ? 0.06 : 0.055, b.grad ? 0.14 : 0.12);
  return (
    <div className={`oc-band ${b.cls}`} aria-hidden>
      <svg preserveAspectRatio="none" viewBox="0 0 1200 360">
        {b.grad && (
          <defs>
            <linearGradient id="oc-deep-water" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0" stopColor="#94BEC3" />
              <stop offset="1" stopColor="#7AA9AF" />
            </linearGradient>
          </defs>
        )}
        <g className={b.roll}>
          <path d={fillD(dark)} fill="rgba(17,37,42,0.13)" />
          <path d={fillD(white)} fill="#FFFFFF" />
          <path d={fillD(colored)} fill={b.color} />
          {cr.facets.map((f, k) => (
            <path key={`f${k}`} d={f.d} fill={f.fill} />
          ))}
          {cr.creases.map((c, k) => (
            <path key={`c${k}`} d={c.d} fill="none" stroke={c.light ? cr.ch : cr.cs} strokeWidth={0.7} strokeLinecap="round" />
          ))}
          <path d={edgeD(colored)} fill="none" stroke={b.edge} strokeWidth={1.6} strokeLinejoin="round" opacity={0.55} />
        </g>
      </svg>
    </div>
  );
}

// A classic folded newspaper boat (viewBox 200×110): central triangular peak +
// two upturned hull tips + clean lit/shadow diamond facets. Silhouette = the
// outer outline (for the die-cut white margin). Recreated as original geometry
// in our palette — the single warm terracotta accent object on the teal sea.
const BOAT_SIL = "M14 48 L72 56 L100 8 L128 56 L186 48 L100 98 Z";

function BoatFacets() {
  return (
    <>
      {/* baked waterline contact shadow (moves with the boat, zero filter) */}
      <ellipse cx="100" cy="100" rx="72" ry="7" fill="rgba(17,37,42,0.15)" />
      {/* die-cut white margin: silhouette stroked white, facets paint over it */}
      <path d={BOAT_SIL} fill="#FFFFFF" stroke="#FFFFFF" strokeWidth={6} strokeLinejoin="round" style={{ paintOrder: "stroke" }} />
      {/* hull — lit left / shadow right, folded at the centre */}
      <path d="M14 48 L72 56 L100 56 L100 98 Z" fill="#D9762F" />
      <path d="M100 56 L128 56 L186 48 L100 98 Z" fill="#C25C29" />
      {/* central peak — lit left / shadow right */}
      <path d="M100 8 L72 56 L100 56 Z" fill="#E0833D" />
      <path d="M100 8 L100 56 L128 56 Z" fill="#C25C29" />
      {/* fold creases */}
      <path d="M100 8 L100 98" stroke="#A2481D" strokeWidth={1} opacity={0.4} strokeLinecap="round" />
      <path d="M72 56 L128 56" stroke="#A2481D" strokeWidth={0.8} opacity={0.28} />
      <path d="M14 48 L72 56" stroke="#A2481D" strokeWidth={0.8} opacity={0.24} />
      <path d="M128 56 L186 48" stroke="#A2481D" strokeWidth={0.8} opacity={0.24} />
    </>
  );
}

// Rayed cut-paper sun — a two-tone scalloped disc (rays behind a lighter solid
// disc), warm gold so it never fights the terracotta boat. Rays turn very slowly.
function Sun() {
  const N = 12;
  const cx = 50;
  const cy = 50;
  let d = "";
  for (let i = 0; i < N * 2; i++) {
    const ang = (Math.PI * i) / N - Math.PI / 2;
    const r = i % 2 === 0 ? 47 : 35;
    d += `${i === 0 ? "M" : "L"} ${(cx + r * Math.cos(ang)).toFixed(1)} ${(cy + r * Math.sin(ang)).toFixed(1)} `;
  }
  d += "Z";
  return (
    <svg className="oc-sun" aria-hidden viewBox="0 0 100 100">
      <g className="oc-sun-rays">
        <path d={d} fill="#E4B44C" />
      </g>
      <circle cx="50" cy="50" r="30" fill="#F0CA66" />
      <circle cx="43" cy="43" r="18" fill="#F5D77F" opacity="0.7" />
    </svg>
  );
}

// Puffy cut-paper cloud — a white rounded cluster with a faint tonal underside.
function Cloud({ className }: { className: string }) {
  return (
    <svg className={`oc-cloud ${className}`} aria-hidden viewBox="0 0 150 74">
      <g fill="#FFFFFF">
        <circle cx="44" cy="46" r="22" />
        <circle cx="76" cy="34" r="28" />
        <circle cx="110" cy="46" r="20" />
        <rect x="42" y="46" width="70" height="22" rx="11" />
      </g>
      <path d="M26 66 Q75 76 124 66" fill="none" stroke="rgba(17,37,42,0.05)" strokeWidth="3" strokeLinecap="round" />
    </svg>
  );
}

export function OrigamiScene() {
  const sky = crumpleTiled(3, 0, 1200, 40, 240, 5, 3, 0.028, 0.05);
  const backAndMid = BANDS.slice(0, 3);
  const front = BANDS[3];

  return (
    <>
      {/* Sky — a lighter-touch static crumple behind the copy (AA preserved). */}
      <svg className="oc-sky" aria-hidden preserveAspectRatio="none" viewBox="0 0 1200 500">
        {sky.facets.map((f, k) => (
          <path key={`sf${k}`} d={f.d} fill={f.fill} />
        ))}
        {sky.creases.map((c, k) => (
          <path key={`sc${k}`} d={c.d} fill="none" stroke={c.light ? sky.ch : sky.cs} strokeWidth={0.8} strokeLinecap="round" />
        ))}
      </svg>

      {/* sky objects — rayed sun + drifting cut-paper clouds, clear of the copy */}
      <Sun />
      <Cloud className="oc-cloud-1" />
      <Cloud className="oc-cloud-2" />
      <Cloud className="oc-cloud-3" />

      {backAndMid.map((b) => (
        <BandLayer key={b.cls} b={b} />
      ))}

      {/* distant boat on the horizon — a pale, faint paper boat for scale */}
      <svg className="oc-dist" aria-hidden viewBox="0 0 200 110">
        <g className="oc-dist-bob">
          <g className="oc-dist-pitch">
            <path d={BOAT_SIL} fill="#ECE4D6" stroke="#FFFFFF" strokeWidth={5} strokeLinejoin="round" style={{ paintOrder: "stroke" }} />
            <path d="M100 56 L128 56 L186 48 L100 98 Z" fill="#DBCDB8" />
            <path d="M100 8 L100 56 L128 56 Z" fill="#D3C4AD" />
          </g>
        </g>
      </svg>

      {/* the paper boat — the terracotta accent; sails L→R, riding band 2's swell */}
      <svg className="oc-boat" aria-hidden viewBox="0 0 200 110">
        <g className="oc-boat-bob">
          <g className="oc-boat-pitch">
            <BoatFacets />
          </g>
        </g>
      </svg>

      {/* nearer wave band — over the hull, largest visible water, fullest crumple */}
      <BandLayer b={front} />
    </>
  );
}
