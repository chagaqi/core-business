"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import Link from "next/link";
import { FEATURE_COLUMNS, type NavItem } from "./nav-data";
import { ICONS } from "./icons";

/**
 * Features mega-menu: a trigger button + a three-column navigation panel, wrapped
 * together so a single hover region covers both. Opens on hover (with a ~150ms
 * grace timer so a diagonal cursor path to the panel doesn't dismiss it), with a
 * click/touch fallback and full keyboard support. The panel is a navigation
 * region (plain list of links, natural Tab order) — NOT an ARIA menu/menuitem
 * composite, so there's no focus trap. ESC closes and returns focus to the
 * trigger; Tab leaving the wrapper closes it. One menu, one piece of state.
 */
export function FeaturesMenu() {
  const [open, setOpen] = useState(false);
  const wrapRef = useRef<HTMLDivElement>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const panelRef = useRef<HTMLDivElement>(null);
  const closeTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const clearTimer = useCallback(() => {
    if (closeTimer.current) {
      clearTimeout(closeTimer.current);
      closeTimer.current = null;
    }
  }, []);

  const openMenu = useCallback(() => {
    clearTimer();
    setOpen(true);
  }, [clearTimer]);

  const scheduleClose = useCallback(() => {
    clearTimer();
    closeTimer.current = setTimeout(() => setOpen(false), 150);
  }, [clearTimer]);

  useEffect(() => () => clearTimer(), [clearTimer]);

  const focusFirstItem = useCallback(() => {
    const first = panelRef.current?.querySelector<HTMLAnchorElement>("a[href]");
    first?.focus();
  }, []);

  return (
    <div
      ref={wrapRef}
      className="relative"
      onMouseEnter={openMenu}
      onMouseLeave={scheduleClose}
      onBlur={(e) => {
        // Close when focus leaves the trigger+panel wrapper entirely (keyboard Tab-out).
        if (!wrapRef.current?.contains(e.relatedTarget as Node | null)) setOpen(false);
      }}
      onKeyDown={(e) => {
        if (e.key === "Escape" && open) {
          e.stopPropagation();
          setOpen(false);
          triggerRef.current?.focus();
        }
      }}
    >
      <button
        ref={triggerRef}
        type="button"
        aria-haspopup="true"
        aria-expanded={open}
        aria-controls="features-menu"
        onClick={() => (open ? setOpen(false) : openMenu())}
        onKeyDown={(e) => {
          if (e.key === "ArrowDown") {
            e.preventDefault();
            openMenu();
            // Wait a frame so the panel is mounted before focusing.
            requestAnimationFrame(focusFirstItem);
          }
        }}
        className="inline-flex items-center gap-1 rounded-full px-3 py-2 text-[15px] font-medium text-slate transition-colors hover:bg-[rgba(14,83,102,0.07)] hover:text-teal"
      >
        Features
        <svg
          width="14"
          height="14"
          viewBox="0 0 24 24"
          fill="none"
          aria-hidden
          className={`transition-transform duration-150 ${open ? "rotate-180" : ""}`}
        >
          <path d="M6 9l6 6 6-6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      </button>

      {open ? (
        <div
          ref={panelRef}
          id="features-menu"
          role="region"
          aria-label="Features"
          className="tv-menu-in absolute left-0 top-full z-50 mt-2 w-[720px] max-w-[calc(100vw-24px)] rounded-2xl border border-border bg-paper p-6 shadow-lift"
        >
          <div className="grid grid-cols-3 gap-x-7 gap-y-1">
            {FEATURE_COLUMNS.map((col) => (
              <div key={col.heading}>
                <p className="mb-2 px-3 text-[11px] font-semibold uppercase tracking-[0.12em] text-ink-mute">
                  {col.heading}
                </p>
                <ul className="m-0 flex list-none flex-col p-0">
                  {col.items.map((item) => (
                    <li key={item.label}>
                      <MenuLink item={item} onNavigate={() => setOpen(false)} />
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </div>
      ) : null}
    </div>
  );
}

function MenuLink({ item, onNavigate }: { item: NavItem; onNavigate: () => void }) {
  return (
    <Link
      href={item.href}
      onClick={onNavigate}
      className="group flex items-start gap-3 rounded-xl px-3 py-2.5 no-underline transition-colors hover:bg-[rgba(14,83,102,0.05)]"
    >
      <span className="grid h-9 w-9 flex-none place-items-center rounded-lg bg-accent-card text-teal">
        {ICONS[item.icon]}
      </span>
      <span className="min-w-0">
        <span className="flex items-center gap-2 text-[15px] font-semibold text-ink">
          {item.label}
          {item.badge === "beta" ? (
            <span
              className="pill pill-amber"
              style={{ fontSize: "10px", padding: "1px 7px", letterSpacing: "0.04em" }}
            >
              Beta
            </span>
          ) : null}
        </span>
        <span className="mt-0.5 block text-[13px] leading-snug text-ink-mute">{item.desc}</span>
      </span>
    </Link>
  );
}
