import type { ReactNode } from "react";
import { clsx } from "clsx";

export interface RecapRow {
  /** ✅ / 📬 / ⚠️ / 📈 — the fixed template glyphs (ADR-0023) */
  icon: string;
  label: string;
  value: ReactNode;
}

/**
 * RecapCard (ADR-0023) — the onboarding/close recap template from the Swan chat:
 * ✅ done · ✅ every morning · 📬 where things land · ⚠️ the one open item (named
 * plainly, never hidden) · 📈 week 1. Callers supply rows in that shape.
 */
export function RecapCard({ title, rows, className }: { title?: string; rows: RecapRow[]; className?: string }) {
  return (
    <div className={clsx("panel p-4", className)}>
      {title ? <p className="mb-3 text-[15px] font-semibold text-ink">{title}</p> : null}
      <ul className="space-y-2.5">
        {rows.map((row) => (
          <li key={row.label} className="flex items-baseline gap-2.5 text-[14px] leading-relaxed">
            <span aria-hidden className="w-5 shrink-0 text-center">
              {row.icon}
            </span>
            <span>
              <span className="font-semibold text-ink">{row.label}</span>{" "}
              <span className="text-slate">{row.value}</span>
            </span>
          </li>
        ))}
      </ul>
    </div>
  );
}
