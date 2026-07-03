import type { RiskFactors } from "@/lib/engines";

/**
 * Renders the risk engine's per-factor breakdown as labeled mini-bars (each 0–1)
 * plus the plain-language top driver. This is the "engine shows its work" surface
 * that makes the cockpit read as software rather than a guess.
 */
const FACTOR_META: Array<{ key: keyof RiskFactors; label: string; hint: string }> = [
  { key: "valueExposure", label: "Value exposure", hint: "order value at stake" },
  { key: "waitPressure", label: "Wait pressure", hint: "time already waiting" },
  { key: "sentiment", label: "Sentiment", hint: "tone of the message" },
  { key: "velocity", label: "Velocity", hint: "how often they ask" },
  { key: "stageLag", label: "Stage lag", hint: "behind its production stage" },
];

export function FactorBreakdown({
  factors,
  topDriver,
}: {
  factors: RiskFactors;
  topDriver: string;
}) {
  return (
    <div className="flex flex-col gap-3">
      <div className="flex flex-col gap-2.5">
        {FACTOR_META.map(({ key, label, hint }) => {
          const v = Math.max(0, Math.min(1, factors[key]));
          const pct = Math.round(v * 100);
          return (
            <div key={key} className="grid grid-cols-[120px_1fr_36px] items-center gap-2">
              <span className="text-[12px] font-medium text-ink" title={hint}>
                {label}
              </span>
              <span
                className="h-2 overflow-hidden rounded-full bg-sand-2"
                role="meter"
                aria-valuenow={pct}
                aria-valuemin={0}
                aria-valuemax={100}
                aria-label={`${label}: ${pct} percent`}
              >
                <span
                  className="block h-full rounded-full bg-teal"
                  style={{ width: `${pct}%` }}
                />
              </span>
              <span className="text-right text-[11px] tabular-nums text-ink-mute">
                {pct}
              </span>
            </div>
          );
        })}
      </div>
      <p className="rounded-lg bg-accent-card px-3 py-2 text-[12px] text-slate">
        <span className="font-semibold text-teal">Top driver:</span> {topDriver}
      </p>
    </div>
  );
}
