/**
 * Pure-CSS/SVG bar chart of the merchant's at-risk curve. No chart libraries.
 * Each bar is one customer in the queue, colored by risk band, sorted high→low.
 */
const COLOR: Record<string, string> = {
  red: "var(--risk-red)",
  amber: "var(--risk-amber)",
  green: "var(--risk-green)",
};

export function RiskCurve({
  curve,
}: {
  curve: Array<{ label: string; risk: number; color: string }>;
}) {
  if (curve.length === 0) {
    return (
      <div className="proof-placeholder">No scored customers in this period.</div>
    );
  }

  const max = Math.max(100, ...curve.map((c) => c.risk));

  return (
    <figure
      className="flex flex-col gap-2"
      role="img"
      aria-label={`Refund-risk curve across ${curve.length} customers, highest score ${curve[0].risk}.`}
    >
      <div className="flex h-40 items-end gap-1.5">
        {curve.map((c, i) => (
          <div
            key={`${c.label}-${i}`}
            className="group relative flex flex-1 items-end"
            style={{ height: "100%" }}
          >
            <div
              className="w-full rounded-t-sm transition-opacity hover:opacity-80"
              style={{
                height: `${Math.max(4, (c.risk / max) * 100)}%`,
                background: COLOR[c.color] ?? "var(--ink-mute)",
              }}
              title={`${c.label}: risk ${c.risk}`}
            />
            <span className="pointer-events-none absolute -top-6 left-1/2 z-10 -translate-x-1/2 whitespace-nowrap rounded bg-ink px-1.5 py-0.5 text-[10px] text-ink-inverse opacity-0 transition-opacity group-hover:opacity-100">
              {c.label} · {c.risk}
            </span>
          </div>
        ))}
      </div>
      <figcaption className="flex items-center justify-between text-[11px] text-ink-mute">
        <span>Per-customer refund-risk score (0–100), highest first</span>
        <span className="flex items-center gap-3">
          <Legend color="red" label="At risk" />
          <Legend color="amber" label="Watch" />
          <Legend color="green" label="Standard" />
        </span>
      </figcaption>
    </figure>
  );
}

function Legend({ color, label }: { color: string; label: string }) {
  return (
    <span className="inline-flex items-center gap-1">
      <span
        aria-hidden
        className="inline-block h-2 w-2 rounded-sm"
        style={{ background: COLOR[color] }}
      />
      {label}
    </span>
  );
}
