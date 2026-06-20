"use client";

import { useEffect, useRef, useState } from "react";
import {
  motion,
  useInView,
  useReducedMotion,
  type Variants,
} from "framer-motion";

/**
 * Loadout — Quest 02 · "The Mechanism · 4×24 Framework".
 *
 * The 4×24 LOADOUT GRID, rebuilt as a real visual inventory in the Command Deck
 * idiom: four angle columns (Mechanism / Identity / Objection / Proof), each
 * with a header (Angle 0n · name · one-line sub) and six inventory-SLOT tiles
 * beneath it (v01..v24 as small slot tiles, not raw text). The single CRIT slot
 * (Angle 02 · slot 2) is a legendary slot — crit-amber treatment, "CRIT" label,
 * glow. "24" is a descriptive number (4 angles × 6 variations), not a proof
 * metric; the slots are empty inventory, not client work. All motion respects
 * prefers-reduced-motion.
 *
 * Styling follows the AdExamples idiom: Tailwind utilities on the project's
 * design tokens (frame / panel-a/b / gold / equip / crit / ink-*) plus the
 * shared global classes (.panel, .win-title, .gem, .dot). One small scoped
 * <style> block carries the crit-slot pulse keyframe, frozen under the global
 * reduced-motion block.
 */
export type LoadoutProps = Record<string, never>;

/** Cubic ease-out matched to the reference's reveal curve. */
const EASE_OUT = [0.2, 0.7, 0.2, 1] as const;

/** Reveal variants mirroring the reference `.rv` (translateY 24px -> 0). */
const revealVariants: Variants = {
  hidden: { opacity: 0, y: 24 },
  show: (i: number) => ({
    opacity: 1,
    y: 0,
    transition: { duration: 0.7, ease: EASE_OUT, delay: i * 0.07 },
  }),
};

/** A scroll-reveal wrapper. `i` drives the staggered delay (reference --i*70ms). */
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

/** Count-up that ticks to `to` on first scroll-in (reference cubic ease-out). */
function CountUp({ to }: { to: number }) {
  const reduce = useReducedMotion();
  const ref = useRef<HTMLSpanElement>(null);
  const inView = useInView(ref, { once: true, amount: 0.6 });
  const [value, setValue] = useState(reduce ? to : 0);

  useEffect(() => {
    if (reduce || !inView) return;
    const duration = 900;
    let raf = 0;
    let start: number | null = null;
    const step = (ts: number) => {
      if (start === null) start = ts;
      const t = Math.min(1, (ts - start) / duration);
      const eased = 1 - Math.pow(1 - t, 3);
      setValue(Math.round(to * eased));
      if (t < 1) raf = requestAnimationFrame(step);
    };
    raf = requestAnimationFrame(step);
    return () => cancelAnimationFrame(raf);
  }, [inView, reduce, to]);

  return (
    <span ref={ref} className="cu">
      {value}
    </span>
  );
}

interface AngleSlot {
  /** Slot label, e.g. "v01". The single crit slot reads "CRIT". */
  label: string;
  crit?: boolean;
}

interface Angle {
  id: string;
  /** Two-digit index that reads big in the column header. */
  index: string;
  name: string;
  sub: string;
  slots: AngleSlot[];
}

const ANGLES: Angle[] = [
  {
    id: "Angle 01",
    index: "01",
    name: "Mechanism",
    sub: "Why it works, shown not claimed.",
    slots: [
      { label: "v01" },
      { label: "v02" },
      { label: "v03" },
      { label: "v04" },
      { label: "v05" },
      { label: "v06" },
    ],
  },
  {
    id: "Angle 02",
    index: "02",
    name: "Identity",
    sub: "Who it's for, in their words.",
    slots: [
      { label: "v07" },
      { label: "CRIT", crit: true },
      { label: "v09" },
      { label: "v10" },
      { label: "v11" },
      { label: "v12" },
    ],
  },
  {
    id: "Angle 03",
    index: "03",
    name: "Objection",
    sub: "The doubt that stalls the buy.",
    slots: [
      { label: "v13" },
      { label: "v14" },
      { label: "v15" },
      { label: "v16" },
      { label: "v17" },
      { label: "v18" },
    ],
  },
  {
    id: "Angle 04",
    index: "04",
    name: "Proof",
    sub: "Reviews and results, screened.",
    slots: [
      { label: "v19" },
      { label: "v20" },
      { label: "v21" },
      { label: "v22" },
      { label: "v23" },
      { label: "v24" },
    ],
  },
];

/**
 * Scoped CSS for the loadout grid. Only the crit-slot pulse lives here as a
 * keyframe so the global `prefers-reduced-motion` block (globals.css) freezes
 * it automatically; everything else is Tailwind utilities on the design tokens.
 */
const LOADOUT_CSS = `
@keyframes lo-crit-pulse {
  0%, 100% { box-shadow: 0 0 0 1px color-mix(in srgb, var(--crit) 60%, transparent), inset 0 0 18px -6px var(--crit), 0 0 18px -6px var(--crit-glow); }
  50%      { box-shadow: 0 0 0 1px color-mix(in srgb, var(--crit) 85%, transparent), inset 0 0 26px -4px var(--crit), 0 0 30px -4px var(--crit-glow); }
}
.lo-crit { animation: lo-crit-pulse 2.6s ease-in-out infinite; }
@media (prefers-reduced-motion: reduce) {
  .lo-crit { animation: none !important; }
}
`;

/** A single inventory-slot tile (v01..v24). The crit slot is the legendary. */
function SlotTile({ slot }: { slot: AngleSlot }) {
  if (slot.crit) {
    return (
      <div
        className="lo-crit group/slot relative flex aspect-square items-center justify-center overflow-hidden rounded-[5px] border border-[color-mix(in_srgb,var(--crit)_55%,transparent)] bg-[radial-gradient(circle_at_50%_28%,color-mix(in_srgb,var(--crit)_22%,transparent),rgba(11,17,29,0.85))] text-center"
        title="Critical strike — legendary slot"
      >
        {/* hatched legendary fill, subtle */}
        <span
          className="pointer-events-none absolute inset-0 opacity-40"
          style={{
            backgroundImage:
              "repeating-linear-gradient(135deg, transparent, transparent 7px, rgba(244,162,59,0.10) 7px, rgba(244,162,59,0.10) 14px)",
          }}
          aria-hidden="true"
        />
        {/* gold corner spark */}
        <span
          className="absolute right-[5px] top-[5px] h-[6px] w-[6px] rotate-45 bg-crit shadow-[0_0_9px_var(--crit-glow)]"
          aria-hidden="true"
        />
        <span className="relative z-10 font-mono text-[10px] font-semibold uppercase leading-none tracking-[0.16em] text-crit drop-shadow-[0_0_8px_var(--crit-glow)]">
          Crit
        </span>
      </div>
    );
  }

  return (
    <div className="group/slot relative flex aspect-square items-center justify-center overflow-hidden rounded-[5px] border border-frame-soft bg-[linear-gradient(180deg,rgba(20,29,47,0.55),rgba(11,17,29,0.7))] text-center transition-[border-color,box-shadow,background] duration-200 hover:border-[color-mix(in_srgb,var(--equip)_50%,transparent)] hover:bg-[linear-gradient(180deg,rgba(28,40,64,0.7),rgba(14,21,35,0.8))] hover:shadow-[inset_0_0_18px_-8px_var(--equip-glow)]">
      {/* empty-slot crosshatch — reads as inventory, not as a real render */}
      <span
        className="pointer-events-none absolute inset-0 opacity-30"
        style={{
          backgroundImage:
            "repeating-linear-gradient(135deg, transparent, transparent 7px, rgba(190,220,255,0.04) 7px, rgba(190,220,255,0.04) 14px)",
        }}
        aria-hidden="true"
      />
      <span className="relative z-10 font-mono text-[10px] uppercase leading-none tracking-[0.12em] text-ink-mute transition-colors duration-200 group-hover/slot:text-ink-soft">
        {slot.label}
      </span>
    </div>
  );
}

/** One angle column: header (index / name / sub) + a 6-slot inventory grid. */
function AngleColumn({ angle, crit }: { angle: Angle; crit?: boolean }) {
  return (
    <div
      className={`relative flex flex-col rounded-[6px] border bg-[linear-gradient(180deg,var(--panel-a),var(--panel-b))] p-[14px] ${
        crit
          ? "border-[color-mix(in_srgb,var(--crit)_38%,transparent)]"
          : "border-frame-soft"
      }`}
    >
      {/* top rarity stripe — crit-amber on the legendary column, equip elsewhere */}
      <span
        className="absolute inset-x-0 top-0 h-[2px] rounded-t-[6px]"
        style={{ background: crit ? "var(--crit)" : "var(--equip)" }}
        aria-hidden="true"
      />

      {/* header */}
      <div className="mb-[12px]">
        <div className="flex items-baseline justify-between gap-2">
          <span className="font-mono text-[9.5px] uppercase leading-none tracking-[0.16em] text-ink-mute">
            {angle.id}
          </span>
          <span
            className="font-mono text-[16px] font-bold leading-none tracking-[0.04em]"
            style={{ color: crit ? "var(--crit)" : "var(--gold)" }}
            aria-hidden="true"
          >
            {angle.index}
          </span>
        </div>
        <div className="mt-[7px] text-[16px] font-bold leading-[1.1] tracking-[-0.02em] text-ink">
          {angle.name}
        </div>
        <div className="mt-[4px] text-[12px] leading-[1.4] text-ink-soft">
          {angle.sub}
        </div>
      </div>

      <div className="my-[2px] h-px bg-frame-soft" aria-hidden="true" />

      {/* 6 inventory slots (2×3) */}
      <div className="mt-[12px] grid grid-cols-3 gap-[7px]" aria-hidden="true">
        {angle.slots.map((slot) => (
          <SlotTile key={slot.label} slot={slot} />
        ))}
      </div>
    </div>
  );
}

export default function Loadout(_props: LoadoutProps) {
  void _props;

  return (
    <section
      className="section"
      id="loadout"
      data-quest="Loadout decoded"
      data-rare="epic"
      data-xp="120"
      data-kicker="Schematic acquired"
    >
      <style dangerouslySetInnerHTML={{ __html: LOADOUT_CSS }} />

      <div className="wrap">
        <Reveal className="qhead">
          <span className="qmarker" aria-hidden="true">
            <svg width="30" height="30" viewBox="0 0 30 30" fill="none">
              <path
                d="M15 4 25 9.5v11L15 26 5 20.5v-11z"
                stroke="#E3C778"
                strokeWidth="1.6"
                strokeLinejoin="round"
              />
              <path
                d="M15 9v12M9.5 12v6M20.5 12v6"
                stroke="#E3C778"
                strokeWidth="1.3"
                strokeLinecap="round"
              />
            </svg>
          </span>
          <div className="qchip">
            <span className="q">Quest 02</span>
            <span className="s">The Mechanism · 4×24 Framework</span>
          </div>
        </Reveal>

        <Reveal i={1}>
          <h2>Four angles in. Twenty-four variations out.</h2>
        </Reveal>

        <Reveal i={2}>
          <p className="lede">
            Every two weeks, <strong>4</strong> hypothesis angles become{" "}
            <strong>
              <CountUp to={24} />
            </strong>{" "}
            production-grade variations — launched and tagged in your account. Read
            at two weeks, keep what wins, reload sharper.
          </p>
        </Reveal>

        <Reveal i={3} className="panel mt-10 overflow-hidden">
          {/* title bar — reuses the shared .win-title HUD treatment */}
          <div className="win-title">
            <span className="gem" aria-hidden="true" />
            <span>Inventory · Cycle Loadout · 4 × 24</span>
            <span className="right">
              <span className="dot" aria-hidden="true" />
              Launch → Read @ 2 wk → Reload
            </span>
          </div>

          {/* the grid: 4 angle columns -> 2 on tablet -> 1 on mobile */}
          <div className="grid grid-cols-1 gap-[10px] p-[14px] sm:grid-cols-2 lg:grid-cols-4">
            {ANGLES.map((angle) => (
              <AngleColumn
                key={angle.id}
                angle={angle}
                crit={angle.slots.some((s) => s.crit)}
              />
            ))}
          </div>

          {/* honest note — styled as a proper bracketed footnote/callout */}
          <div className="border-t border-frame-soft bg-[linear-gradient(180deg,rgba(46,64,98,0.18),transparent)] px-[16px] py-[14px]">
            <div className="flex items-start gap-[11px]">
              <span
                className="mt-[2px] flex-none font-mono text-[10px] uppercase leading-none tracking-[0.16em] text-gold"
                aria-hidden="true"
              >
                [ note ]
              </span>
              <p className="text-[13px] leading-[1.55] text-ink-soft">
                <b className="font-semibold text-ink">One honest note:</b> the edge
                is operator judgment, unit economics, and real production hands —
                not the name on the framework. Volume is the method, never the
                pitch. Every claim is FTC/Meta-screened before it ships.
              </p>
            </div>
          </div>
        </Reveal>
      </div>
    </section>
  );
}
