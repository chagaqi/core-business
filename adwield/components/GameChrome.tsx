"use client";

/**
 * GameChrome — the global gamified HUD layer for the Adwield "Command Deck".
 *
 * Ported faithfully from the approved reference (_newestsite-source.html). Owns
 * every client-side, decorative chrome element:
 *   - the cast-bar scroll-progress strip (top)
 *   - the quest-rail node tracker (left, hidden < 1360px)
 *   - the level-up player-plate sync (drives the Nav's #xpPlate / #lvlNum / #lvlRing if present)
 *   - the FFXIV-style XP toast log (fired once per section as it scrolls into view)
 *   - the XP-float that pops on any [data-xp] click
 *   - the fixed bottom hotbar / action bar
 *
 * These are purely decorative. Everything degrades gracefully and goes fully
 * static under prefers-reduced-motion (via Framer Motion's useReducedMotion()):
 * no entrances, no float, no flash, no animated bars — final states only.
 *
 * It reads section metadata straight from the live DOM (the [data-quest] /
 * [data-rare] / [data-xp] / [data-kicker] attributes the section components
 * render), so it stays self-contained and never imports the sections.
 */

import { useCallback, useEffect, useRef, useState } from "react";
import { useReducedMotion } from "framer-motion";

/* ------------------------------------------------------------------ */
/* Static data: rarities, icons, rail nodes, hotbar slots             */
/* ------------------------------------------------------------------ */

type Rarity = "" | "gold" | "crit" | "epic" | "danger" | "buff";

const STAR_ICON = (
  <svg width="17" height="17" viewBox="0 0 24 24" fill="none" aria-hidden="true">
    <path
      d="M12 3l2.5 5.2 5.5.7-4 3.9 1 5.5L12 15.6 6.9 18.3l1-5.5-4-3.9 5.5-.7z"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinejoin="round"
    />
  </svg>
);

const RARITY_ICON: Record<Rarity, React.ReactNode> = {
  "": STAR_ICON,
  gold: STAR_ICON,
  crit: (
    <svg width="17" height="17" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path d="M13 2 4 14h6l-1 8 9-12h-6z" stroke="currentColor" strokeWidth="1.5" strokeLinejoin="round" />
    </svg>
  ),
  epic: (
    <svg width="17" height="17" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path d="M12 2 22 8.5v7L12 22 2 15.5v-7z" stroke="currentColor" strokeWidth="1.5" strokeLinejoin="round" />
    </svg>
  ),
  danger: (
    <svg width="17" height="17" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path d="M12 3 22 20H2z" stroke="currentColor" strokeWidth="1.5" strokeLinejoin="round" />
      <path d="M12 9v5M12 16.5v.5" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" />
    </svg>
  ),
  buff: (
    <svg width="17" height="17" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path d="M12 2 19 5v6c0 4.5-3 7.6-7 9-4-1.4-7-4.5-7-9V5z" stroke="currentColor" strokeWidth="1.5" strokeLinejoin="round" />
      <path d="m9 11 2 2 4-4.5" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  ),
};

interface RailNode {
  href: string;
  label: string;
}

const RAIL_NODES: RailNode[] = [
  { href: "#top", label: "Start" },
  { href: "#fatigue", label: "The Fatigue Wall" },
  { href: "#loadout", label: "The Loadout" },
  { href: "#first-strike", label: "First Strike" },
  { href: "#paths", label: "Choose Your Path" },
  { href: "#guarantee", label: "Guarantee" },
  { href: "#proof", label: "Honest Proof" },
  { href: "#faq", label: "FAQ" },
];

interface HotbarSlot {
  key: string;
  href: string;
  tip: string;
  name: string;
  icon: React.ReactNode;
  primary?: boolean;
  xp?: number;
}

const HOTBAR_SLOTS: HotbarSlot[] = [
  {
    key: "1",
    href: "#first-strike",
    tip: "Claim First Strike — free",
    name: "Strike",
    primary: true,
    xp: 40,
    icon: (
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" aria-hidden="true">
        <path d="M13 2 4 14h6l-1 8 9-12h-6z" stroke="currentColor" strokeWidth="1.6" strokeLinejoin="round" />
      </svg>
    ),
  },
  {
    key: "2",
    href: "#fatigue",
    tip: "The Fatigue Wall",
    name: "Wall",
    icon: (
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" aria-hidden="true">
        <path d="M12 3 22 20H2z" stroke="currentColor" strokeWidth="1.5" strokeLinejoin="round" />
        <path d="M12 9v5M12 16.5v.5" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" />
      </svg>
    ),
  },
  {
    key: "3",
    href: "#loadout",
    tip: "The Loadout — 4×24",
    name: "Loadout",
    icon: (
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" aria-hidden="true">
        <path d="M12 2 22 8.5v7L12 22 2 15.5v-7z" stroke="currentColor" strokeWidth="1.5" strokeLinejoin="round" />
        <path d="M12 7v10M7 9.5v5M17 9.5v5" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" />
      </svg>
    ),
  },
  {
    key: "4",
    href: "#paths",
    tip: "Hire a Knight (DFY)",
    name: "Knight",
    icon: (
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" aria-hidden="true">
        <path d="M12 2 19 5v6c0 4.5-3 7.6-7 9-4-1.4-7-4.5-7-9V5Z" stroke="currentColor" strokeWidth="1.5" strokeLinejoin="round" />
        <path d="M12 7v8M8.5 11h7" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
      </svg>
    ),
  },
  {
    key: "5",
    href: "#paths",
    tip: "Build a Forge (DWY)",
    name: "Forge",
    icon: (
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" aria-hidden="true">
        <path d="M4 14h16l-2 7H6Z" stroke="currentColor" strokeWidth="1.5" strokeLinejoin="round" />
        <path d="M9 14c0-3 1.5-4 1.5-6S9 5 9 5M14.5 14c0-2.5 1.2-3.4 1.2-5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
      </svg>
    ),
  },
  {
    key: "6",
    href: "#guarantee",
    tip: "The No-Risk Loadout",
    name: "Buff",
    icon: (
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" aria-hidden="true">
        <path d="M12 2 19 5v6c0 4.5-3 7.6-7 9-4-1.4-7-4.5-7-9V5z" stroke="currentColor" strokeWidth="1.5" strokeLinejoin="round" />
        <path d="m9 11 2 2 4-4.5" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    ),
  },
];

/* ------------------------------------------------------------------ */
/* Runtime types                                                      */
/* ------------------------------------------------------------------ */

interface ToastItem {
  id: number;
  kicker: string;
  title: string;
  rare: Rarity;
  xp: number;
}

interface XpFloat {
  id: number;
  x: number;
  y: number;
  amt: string;
}

export interface GameChromeProps {
  /** Optional extra className on the root fragment wrapper (unused; here for parity). */
  className?: string;
}

const MAX_TOASTS = 4;

/* ------------------------------------------------------------------ */
/* Component                                                          */
/* ------------------------------------------------------------------ */

export default function GameChrome(_props: GameChromeProps) {
  const reduce = useReducedMotion();

  const [castWidth, setCastWidth] = useState(0); // 0..100 (%)
  const [activeIdx, setActiveIdx] = useState(-1);
  const [level, setLevel] = useState(1);
  const [levelFlash, setLevelFlash] = useState(false);
  const [toasts, setToasts] = useState<ToastItem[]>([]);
  const [showIds, setShowIds] = useState<Set<number>>(new Set());
  const [floats, setFloats] = useState<XpFloat[]>([]);

  const firedRef = useRef<Set<string>>(new Set());
  const idRef = useRef(0);
  const flashTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  /* -------- toast dispatch -------- */
  const pushToast = useCallback(
    (t: Omit<ToastItem, "id">) => {
      const id = ++idRef.current;
      setToasts((prev) => {
        const next = [...prev, { ...t, id }];
        return next.slice(-MAX_TOASTS);
      });

      // level up + plate flash on every quest fire
      setLevel((lvl) => lvl + 1);
      if (!reduce) {
        setLevelFlash(true);
        if (flashTimer.current) clearTimeout(flashTimer.current);
        flashTimer.current = setTimeout(() => setLevelFlash(false), 380);
      }

      // entrance (double rAF so the transition runs); skipped if reduced
      if (reduce) {
        setShowIds((s) => new Set(s).add(id));
      } else {
        requestAnimationFrame(() =>
          requestAnimationFrame(() => setShowIds((s) => new Set(s).add(id))),
        );
      }

      // auto-dismiss
      window.setTimeout(() => {
        setShowIds((s) => {
          const n = new Set(s);
          n.delete(id);
          return n;
        });
        window.setTimeout(() => {
          setToasts((prev) => prev.filter((x) => x.id !== id));
        }, 500);
      }, 3400);
    },
    [reduce],
  );

  /* -------- the scroll loop: cast-bar, plate, quest toasts, rail -------- */
  useEffect(() => {
    const root = document.documentElement;
    const vh = () => window.innerHeight || root.clientHeight || 800;

    let ticking = false;

    const update = () => {
      ticking = false;
      const H = vh();
      const max = root.scrollHeight - root.clientHeight;
      const sc = window.pageYOffset || root.scrollTop || document.body.scrollTop || 0;
      const p = max > 0 ? sc / max : 0;
      const pct = Math.min(100, Math.max(0, p * 100));
      setCastWidth(pct);

      // keep the Nav player-plate XP bar in sync if it's on the page
      const xpPlate = document.getElementById("xpPlate");
      if (xpPlate) xpPlate.style.width = pct.toFixed(2) + "%";

      // fire a toast once per section as it enters the viewport
      const questEls = Array.from(document.querySelectorAll<HTMLElement>("[data-quest]"));
      for (const q of questEls) {
        const key = q.getAttribute("data-quest") || "";
        if (!key || firedRef.current.has(key)) continue;
        const qr = q.getBoundingClientRect();
        if (qr.top < H * 0.62 && qr.bottom > 0) {
          firedRef.current.add(key);
          pushToast({
            kicker: q.getAttribute("data-kicker") || "Quest update",
            title: key,
            rare: (q.getAttribute("data-rare") as Rarity) || "",
            xp: parseInt(q.getAttribute("data-xp") || "0", 10) || 0,
          });
        }
      }

      // rail active / done state
      let idx = -1;
      RAIL_NODES.forEach((n, i) => {
        const sec = document.getElementById(n.href.replace("#", ""));
        if (sec && sec.getBoundingClientRect().top <= H * 0.42) idx = i;
      });
      setActiveIdx(idx);
    };

    const onScroll = () => {
      if (ticking) return;
      ticking = true;
      requestAnimationFrame(update);
    };

    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", onScroll);
    update();

    // a few safety ticks while sections/fonts settle
    let safety = 0;
    const iv = window.setInterval(() => {
      update();
      if (++safety > 10) window.clearInterval(iv);
    }, 320);

    return () => {
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", onScroll);
      window.clearInterval(iv);
    };
    // pushToast identity is stable for our purposes; reduce changes are rare.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pushToast]);

  /* -------- sync the Nav level-ring number + flash, null-safe -------- */
  useEffect(() => {
    const lvlNum = document.getElementById("lvlNum");
    if (lvlNum) lvlNum.textContent = String(level);
    const ring = document.getElementById("lvlRing");
    if (ring) ring.classList.toggle("flash", levelFlash);
  }, [level, levelFlash]);

  /* -------- XP-float on any [data-xp] click -------- */
  useEffect(() => {
    if (reduce) return;

    const onClick = (ev: MouseEvent) => {
      const target = ev.target as HTMLElement | null;
      const a = target?.closest?.("[data-xp]") as HTMLElement | null;
      if (!a) return;
      const amt = a.getAttribute("data-xp");
      if (!amt) return;
      const id = ++idRef.current;
      setFloats((prev) => [...prev, { id, x: ev.clientX, y: ev.clientY - 10, amt }]);
      window.setTimeout(() => {
        setFloats((prev) => prev.filter((f) => f.id !== id));
      }, 1000);
    };

    document.addEventListener("click", onClick, true);
    return () => document.removeEventListener("click", onClick, true);
  }, [reduce]);

  useEffect(() => {
    return () => {
      if (flashTimer.current) clearTimeout(flashTimer.current);
    };
  }, []);

  return (
    <>
      {/* scoped HUD styles for the elements GameChrome solely owns */}
      <style>{CHROME_CSS}</style>

      {/* cast-bar — scroll progress */}
      <div className="gc-castbar" aria-hidden="true">
        <div className="gc-castfill" style={{ width: `${castWidth}%` }} />
      </div>

      {/* quest rail — left node tracker (hidden < 1360px via CSS) */}
      <nav className="gc-rail" aria-label="Page progress">
        {RAIL_NODES.map((n, i) => {
          const cls =
            "gc-rail-node" +
            (i === activeIdx ? " active" : "") +
            (activeIdx >= 0 && i < activeIdx ? " done" : "");
          return (
            <a key={n.href + n.label} className={cls} href={n.href}>
              <span className="gc-rail-tick" aria-hidden="true" />
              <span className="gc-rail-label">{n.label}</span>
            </a>
          );
        })}
      </nav>

      {/* hotbar — fixed action bar */}
      <nav className="gc-hotbar" aria-label="Quick actions">
        <span className="gc-hb-label" aria-hidden="true">
          Action Bar
        </span>
        {HOTBAR_SLOTS.map((s, i) => (
          <span key={s.key} style={{ display: "contents" }}>
            <a
              className={"gc-skill" + (s.primary ? " primary" : "")}
              href={s.href}
              data-xp={s.xp ?? undefined}
            >
              <span className="gc-key" aria-hidden="true">
                {s.key}
              </span>
              <span className="gc-tip" role="tooltip">
                {s.tip}
              </span>
              {s.icon}
              <span className="gc-nm">{s.name}</span>
            </a>
            {i === 0 && <span className="gc-hb-sep" aria-hidden="true" />}
          </span>
        ))}
      </nav>

      {/* toast log — FFXIV-style quest feed */}
      <div className="gc-toasts" aria-live="polite" aria-atomic="false">
        {toasts.map((t) => (
          <div
            key={t.id}
            className={
              "gc-toast" + (t.rare ? ` rare-${t.rare}` : "") + (showIds.has(t.id) ? " show" : "")
            }
          >
            <div className="gc-toast-ic">{RARITY_ICON[t.rare]}</div>
            <div className="gc-toast-body">
              <div className="gc-toast-k">{t.kicker}</div>
              <div className="gc-toast-t">{t.title}</div>
            </div>
            {t.xp > 0 && <div className="gc-toast-xp">+{t.xp}</div>}
          </div>
        ))}
      </div>

      {/* XP floats — pop on [data-xp] clicks */}
      {!reduce &&
        floats.map((f) => (
          <div key={f.id} className="gc-xpfloat" style={{ left: f.x, top: f.y }}>
            +{f.amt} XP
          </div>
        ))}
    </>
  );
}

/* ------------------------------------------------------------------ */
/* Chrome CSS — ported verbatim from the reference for the elements   */
/* GameChrome owns (castbar / rail / hotbar / toasts / xpfloat).      */
/* Tokens (--equip, --gold, --cTL …) come from globals.css :root.     */
/* Reduced-motion is killed globally by globals.css, and JS-driven    */
/* motion is gated by useReducedMotion() above.                        */
/* ------------------------------------------------------------------ */

const CHROME_CSS = `
/* cast-bar style scroll progress */
.gc-castbar{position:fixed;top:66px;left:0;right:0;z-index:55;height:6px;background:rgba(0,0,0,0.55);overflow:hidden;border-bottom:1px solid rgba(0,0,0,0.5)}
.gc-castbar::before{content:"";position:absolute;inset:0;background-image:repeating-linear-gradient(90deg,transparent,transparent 38px,rgba(0,0,0,0.45) 38px,rgba(0,0,0,0.45) 40px);z-index:2;pointer-events:none}
.gc-castfill{height:100%;width:0;background:linear-gradient(90deg,var(--equip-deep),var(--equip) 70%,#cdf3ff);box-shadow:0 0 14px var(--equip-glow);transition:width .12s linear}

/* quest rail */
.gc-rail{position:fixed;left:24px;top:50%;transform:translateY(-50%);z-index:40;display:flex;flex-direction:column}
.gc-rail-node{display:flex;align-items:center;gap:11px;text-decoration:none;height:42px;position:relative;color:var(--ink-mute)}
.gc-rail-node::before{content:"";position:absolute;left:7px;top:-21px;height:21px;width:2px;background:var(--frame-soft)}
.gc-rail-node:first-child::before{display:none}
.gc-rail-tick{width:16px;height:16px;flex:none;background:var(--bg-1);border:2px solid var(--frame);transform:rotate(45deg);transition:all .3s ease;position:relative;z-index:2}
.gc-rail-label{font-family:var(--font-mono),ui-monospace,monospace;font-size:10.5px;letter-spacing:0.08em;text-transform:uppercase;opacity:0;transform:translateX(-6px);transition:all .25s ease;white-space:nowrap}
.gc-rail-node:hover .gc-rail-label,.gc-rail-node:focus-visible .gc-rail-label{opacity:1;transform:none;color:var(--ink-soft)}
.gc-rail-node.done .gc-rail-tick{border-color:var(--gold);background:var(--gold);box-shadow:0 0 12px var(--gold-glow)}
.gc-rail-node.done::before{background:var(--gold-dim)}
.gc-rail-node.active .gc-rail-tick{border-color:var(--equip);box-shadow:0 0 0 4px rgba(94,200,230,0.16),0 0 16px var(--equip-glow)}
.gc-rail-node.active .gc-rail-label{opacity:1;transform:none;color:#fff}
@media(max-width:1360px){.gc-rail{display:none}}

/* hotbar (action bar) */
.gc-hotbar{
  position:fixed;bottom:16px;left:50%;transform:translateX(-50%);z-index:70;
  display:flex;align-items:center;gap:8px;padding:9px 11px;border-radius:8px;
  background:
    var(--cTL) top 4px left 4px / 16px 16px no-repeat,
    var(--cTR) top 4px right 4px / 16px 16px no-repeat,
    var(--cBL) bottom 4px left 4px / 16px 16px no-repeat,
    var(--cBR) bottom 4px right 4px / 16px 16px no-repeat,
    linear-gradient(180deg,rgba(14,20,34,0.92),rgba(8,12,20,0.94));
  border:1px solid var(--frame);
  box-shadow:0 0 0 1px rgba(0,0,0,0.55),0 18px 50px -18px rgba(0,0,0,0.9),inset 0 1px 0 rgba(190,220,255,0.08);
  backdrop-filter:blur(10px);-webkit-backdrop-filter:blur(10px);
}
.gc-hb-label{font-family:var(--font-mono),ui-monospace,monospace;font-size:9px;letter-spacing:0.16em;text-transform:uppercase;color:var(--ink-mute);writing-mode:vertical-rl;transform:rotate(180deg);margin-right:2px}
.gc-skill{
  position:relative;width:54px;height:54px;flex:none;border-radius:7px;border:1px solid var(--frame-soft);
  background:linear-gradient(180deg,rgba(34,46,72,0.7),rgba(12,18,30,0.85));
  display:flex;align-items:center;justify-content:center;color:var(--ink-soft);text-decoration:none;
  transition:transform .14s cubic-bezier(.2,.9,.3,1.3),border-color .15s,box-shadow .15s,color .15s;
  box-shadow:inset 0 1px 0 rgba(190,220,255,0.08);
}
.gc-key{position:absolute;top:2px;left:5px;font-family:var(--font-mono),ui-monospace,monospace;font-size:9px;color:var(--ink-mute)}
.gc-nm{position:absolute;bottom:3px;left:0;right:0;text-align:center;font-family:var(--font-mono),ui-monospace,monospace;font-size:7px;letter-spacing:0.06em;text-transform:uppercase;color:var(--ink-mute);transition:color .15s}
.gc-skill:hover,.gc-skill:focus-visible{transform:translateY(-4px);border-color:var(--equip);color:#fff;box-shadow:0 10px 24px -10px var(--equip-glow),inset 0 0 16px -6px var(--equip-glow)}
.gc-skill:hover .gc-nm,.gc-skill:focus-visible .gc-nm{color:var(--equip)}
.gc-tip{position:absolute;bottom:64px;left:50%;transform:translateX(-50%) translateY(6px);background:rgba(8,12,20,0.96);border:1px solid var(--frame);color:var(--ink);font-size:11.5px;font-family:var(--font-grotesk),sans-serif;font-weight:600;white-space:nowrap;padding:6px 11px;border-radius:6px;opacity:0;pointer-events:none;transition:opacity .15s,transform .15s;box-shadow:0 10px 24px -10px rgba(0,0,0,0.8)}
.gc-skill:hover .gc-tip,.gc-skill:focus-visible .gc-tip{opacity:1;transform:translateX(-50%) translateY(0)}
.gc-skill.primary{border-color:var(--gold);color:var(--gold);background:linear-gradient(180deg,rgba(227,199,120,0.18),rgba(40,30,10,0.6));box-shadow:0 0 18px -4px var(--gold-glow),inset 0 1px 0 rgba(255,240,200,0.2);animation:gc-ready 2.6s ease-in-out infinite}
.gc-skill.primary:hover,.gc-skill.primary:focus-visible{color:#fff;border-color:var(--gold);box-shadow:0 12px 28px -8px var(--gold-glow),inset 0 0 18px -4px var(--gold-glow)}
@keyframes gc-ready{0%,100%{box-shadow:0 0 14px -4px var(--gold-glow),inset 0 1px 0 rgba(255,240,200,0.2)}50%{box-shadow:0 0 26px 0 var(--gold-glow),inset 0 1px 0 rgba(255,240,200,0.25)}}
.gc-hb-sep{width:1px;height:38px;background:var(--frame-soft);flex:none}
@media(max-width:720px){.gc-hb-label{display:none}.gc-nm{display:none}}
@media(max-width:560px){.gc-hotbar{gap:6px;padding:7px 8px;bottom:10px}.gc-skill{width:46px;height:46px}}

/* toasts (FFXIV log) */
.gc-toasts{position:fixed;right:20px;top:88px;z-index:80;display:flex;flex-direction:column;gap:10px;align-items:flex-end;pointer-events:none}
.gc-toast{
  position:relative;display:flex;align-items:center;gap:13px;min-width:248px;max-width:340px;
  border:1px solid var(--frame);border-left:3px solid var(--equip);
  background:
    var(--cTR) top 3px right 3px / 13px 13px no-repeat,
    var(--cBR) bottom 3px right 3px / 13px 13px no-repeat,
    linear-gradient(180deg,rgba(16,23,38,0.95),rgba(9,13,22,0.96));
  backdrop-filter:blur(12px);border-radius:5px;padding:12px 15px;
  box-shadow:0 18px 50px -18px rgba(0,0,0,0.8),0 0 0 1px rgba(0,0,0,0.4);
  transform:translateX(120%);opacity:0;transition:transform .45s cubic-bezier(.2,.9,.3,1.2),opacity .45s;
}
.gc-toast.show{transform:none;opacity:1}
.gc-toast.rare-crit{border-left-color:var(--crit)}
.gc-toast.rare-epic{border-left-color:var(--epic)}
.gc-toast.rare-danger{border-left-color:var(--danger)}
.gc-toast.rare-buff{border-left-color:var(--buff)}
.gc-toast.rare-gold{border-left-color:var(--gold)}
.gc-toast-ic{width:36px;height:36px;flex:none;border:1px solid var(--frame-soft);display:flex;align-items:center;justify-content:center;color:var(--equip);background:rgba(255,255,255,0.03);transform:rotate(45deg)}
.gc-toast-ic svg{transform:rotate(-45deg)}
.gc-toast.rare-crit .gc-toast-ic{color:var(--crit)}
.gc-toast.rare-epic .gc-toast-ic{color:var(--epic)}
.gc-toast.rare-danger .gc-toast-ic{color:var(--danger)}
.gc-toast.rare-buff .gc-toast-ic{color:var(--buff)}
.gc-toast.rare-gold .gc-toast-ic{color:var(--gold)}
.gc-toast-body{flex:1;min-width:0}
.gc-toast-k{font-family:var(--font-mono),ui-monospace,monospace;font-size:9px;letter-spacing:0.16em;text-transform:uppercase;color:var(--ink-mute)}
.gc-toast-t{font-size:13.5px;font-weight:600;letter-spacing:-0.01em;margin-top:2px;line-height:1.25}
.gc-toast-xp{font-family:var(--font-mono),ui-monospace,monospace;font-size:12px;font-weight:700;color:var(--gold);flex:none}
@media(max-width:560px){.gc-toasts{right:10px;top:80px;left:10px;align-items:stretch}.gc-toast{max-width:none}}

/* xp float */
.gc-xpfloat{position:fixed;z-index:90;font-family:var(--font-mono),ui-monospace,monospace;font-weight:800;font-size:17px;color:var(--gold);pointer-events:none;text-shadow:0 0 12px var(--gold-glow),0 1px 2px #000;animation:gc-xpfloat 1s ease-out forwards}
@keyframes gc-xpfloat{0%{opacity:0;transform:translateY(0) scale(.7)}15%{opacity:1;transform:translateY(-4px) scale(1.15)}100%{opacity:0;transform:translateY(-50px) scale(1)}}

@media(prefers-reduced-motion:reduce){
  .gc-castfill,.gc-rail-tick,.gc-rail-label,.gc-skill,.gc-nm,.gc-tip,.gc-toast{transition:none !important}
  .gc-skill.primary{animation:none !important}
  .gc-toast{transform:none;opacity:1}
}
`;
