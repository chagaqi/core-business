"use client";

import { useRouter } from "next/navigation";
import { useState, type ReactNode } from "react";
import { clsx } from "clsx";
import { Button } from "@/components/ui/Button";
import type { SettingsView } from "@/lib/settings-route";
import type { GiftKind, GiftTier, ProductionStageKey } from "@/lib/types";

/**
 * Per-section settings panels for /app/settings. Server-rendered snapshot in
 * (settingsView), PATCH /api/settings out — one call per section, never a
 * giant everything-form. The API enforces owner-only writes; non-owners and
 * the demo sample render read-only. Each panel tracks its own baseline: Save
 * enables only when dirty AND valid, and a successful save re-baselines from
 * the server's response (so freshly-minted gift ids land back in state).
 */

const INPUT =
  "w-full rounded-lg border border-border bg-paper px-3 py-2 text-[14px] text-ink outline-none focus:border-teal disabled:opacity-60";

const TONE_OPTIONS = [
  "Warm",
  "Calm",
  "Straightforward",
  "Playful",
  "Premium",
  "Down-to-earth",
  "Reassuring",
  "Concise",
];

const KIND_OPTIONS: Array<{ value: GiftKind; label: string }> = [
  { value: "early-access", label: "Early access" },
  { value: "founder-note", label: "Founder note" },
  { value: "priority-dispatch", label: "Priority dispatch" },
  { value: "digital-perk", label: "Digital perk" },
  { value: "next-order-credit", label: "Next-order credit" },
];

const TIER_OPTIONS: Array<{ value: GiftTier; label: string }> = [
  { value: "base", label: "Base — any risk level" },
  { value: "mid", label: "Mid — watch risk or higher" },
  { value: "full", label: "Full — high risk or escalation" },
];

const INT_RE = /^\d+$/;
const MONEY_RE = /^\d+(\.\d{1,2})?$/;
const toCents = (s: string): number => Math.round(parseFloat(s) * 100);
const fromCents = (c: number): string => (c % 100 === 0 ? String(c / 100) : (c / 100).toFixed(2));
const deepEq = (a: unknown, b: unknown): boolean => JSON.stringify(a) === JSON.stringify(b);

async function patchSettings(
  body: unknown,
): Promise<{ ok: true; view: SettingsView } | { ok: false; error: string }> {
  try {
    const res = await fetch("/api/settings", {
      method: "PATCH",
      headers: { "content-type": "application/json" },
      body: JSON.stringify(body),
    });
    const data = (await res.json().catch(() => ({}))) as SettingsView & { error?: string };
    if (!res.ok) return { ok: false, error: data.error ?? "something went wrong — try again" };
    return { ok: true, view: data };
  } catch {
    return { ok: false, error: "network error — try again" };
  }
}

// ── section shell ────────────────────────────────────────────────────────────

function Section({
  title,
  sub,
  canEdit,
  dirty,
  problem,
  busy,
  saved,
  error,
  onSave,
  children,
}: {
  title: string;
  sub: string;
  canEdit: boolean;
  dirty: boolean;
  /** First failing client-side rule, or null when the section is savable. */
  problem: string | null;
  busy: boolean;
  saved: boolean;
  error: string | null;
  onSave: () => void;
  children: ReactNode;
}) {
  return (
    <section className="rounded-xl border border-border bg-paper">
      <div className="border-b border-border px-4 py-3">
        <h2 className="text-[14px] font-semibold text-ink">{title}</h2>
        <p className="text-[12px] text-ink-mute">{sub}</p>
      </div>
      <div className="flex flex-col gap-3 px-4 py-4">{children}</div>
      {canEdit ? (
        <div className="flex flex-wrap items-center gap-3 border-t border-border px-4 py-3">
          <Button variant="primary" disabled={!dirty || problem !== null || busy} onClick={onSave}>
            {busy ? "Saving…" : "Save"}
          </Button>
          {saved && !dirty ? (
            <span className="text-[12px] font-medium text-teal">Saved</span>
          ) : null}
          {dirty && problem ? (
            <span className="text-[12px] text-terracotta-700">{problem}</span>
          ) : null}
          {error ? (
            <p
              role="alert"
              className="rounded-lg border border-terracotta-700/30 bg-sand px-3 py-1.5 text-[13px] text-terracotta-700"
            >
              {error}
            </p>
          ) : null}
        </div>
      ) : null}
    </section>
  );
}

/** Shared per-section save-state plumbing. */
function useSave() {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const run = async (body: unknown, onOk: (view: SettingsView) => void) => {
    setBusy(true);
    setError(null);
    const res = await patchSettings(body);
    setBusy(false);
    if (!res.ok) {
      setSaved(false);
      setError(res.error);
      return;
    }
    onOk(res.view);
    setSaved(true);
    router.refresh();
  };
  return { busy, saved, error, run, clearSaved: () => setSaved(false) };
}

// ── brand voice ──────────────────────────────────────────────────────────────

function BrandSection({ canEdit, initial }: { canEdit: boolean; initial: SettingsView["brand"] }) {
  const [baseline, setBaseline] = useState(initial);
  const [signoff, setSignoff] = useState(initial.signoff);
  const [voice, setVoice] = useState(initial.voice);
  const [tone, setTone] = useState<string[]>(initial.tone);
  const [banned, setBanned] = useState<string[]>(initial.banned);
  const [bannedInput, setBannedInput] = useState("");
  const { busy, saved, error, run, clearSaved } = useSave();

  const state = { voice, tone, banned, signoff };
  const dirty = !deepEq(state, baseline);
  const problem = signoff.trim() ? null : "Add a signoff — every reply ends with it.";

  const toneOptions = [...TONE_OPTIONS, ...tone.filter((t) => !TONE_OPTIONS.includes(t))];
  const toggleTone = (t: string) => {
    clearSaved();
    setTone((cur) =>
      cur.includes(t) ? cur.filter((x) => x !== t) : cur.length >= 8 ? cur : [...cur, t],
    );
  };
  const addBanned = () => {
    const w = bannedInput.trim();
    if (!w || w.length > 40 || banned.length >= 50) return;
    if (banned.some((b) => b.toLowerCase() === w.toLowerCase())) return;
    clearSaved();
    setBanned((cur) => [...cur, w]);
    setBannedInput("");
  };

  const save = () =>
    run(
      { section: "brand", signoff: signoff.trim(), voice: voice.trim(), tone, banned },
      (view) => {
        setBaseline(view.brand);
        setSignoff(view.brand.signoff);
        setVoice(view.brand.voice);
        setTone(view.brand.tone);
        setBanned(view.brand.banned);
      },
    );

  return (
    <Section
      title="Brand voice"
      sub="How every drafted reply sounds: the signoff it ends with, the tone it keeps, and the words it never uses."
      canEdit={canEdit}
      dirty={dirty}
      problem={problem}
      busy={busy}
      saved={saved}
      error={error}
      onSave={() => void save()}
    >
      <div className="grid gap-3 sm:grid-cols-2">
        <label className="flex flex-col gap-1 text-[12px] font-medium text-ink-mute">
          Signoff
          <input
            className={INPUT}
            value={signoff}
            disabled={!canEdit}
            onChange={(e) => {
              clearSaved();
              setSignoff(e.target.value);
            }}
            placeholder="— Dana, founder"
          />
        </label>
        <label className="flex flex-col gap-1 text-[12px] font-medium text-ink-mute">
          Voice
          <input
            className={INPUT}
            value={voice}
            disabled={!canEdit}
            onChange={(e) => {
              clearSaved();
              setVoice(e.target.value);
            }}
            placeholder="warm, direct, no corporate filler"
          />
        </label>
      </div>

      <div className="flex flex-col gap-1.5">
        <span className="text-[12px] font-medium text-ink-mute">Tone</span>
        <div className="flex flex-wrap gap-2">
          {toneOptions.map((t) => {
            const on = tone.includes(t);
            return (
              <button
                key={t}
                type="button"
                disabled={!canEdit}
                onClick={() => toggleTone(t)}
                aria-pressed={on}
                className={clsx(
                  "rounded-full border px-3.5 py-1.5 text-[13px] font-medium transition disabled:cursor-default",
                  on
                    ? "border-teal bg-teal text-ink-inverse"
                    : "border-border bg-paper text-slate",
                  canEdit && !on && "hover:border-teal-300",
                )}
              >
                {t}
              </button>
            );
          })}
        </div>
      </div>

      <div className="flex flex-col gap-1.5">
        <span className="text-[12px] font-medium text-ink-mute">
          Banned words — stripped from every draft before you see it
        </span>
        <div className="flex flex-wrap gap-2">
          {banned.map((w) => (
            <span
              key={w}
              className="inline-flex items-center gap-1.5 rounded-full border border-border bg-sand px-3 py-1 text-[13px] text-ink"
            >
              {w}
              {canEdit ? (
                <button
                  type="button"
                  aria-label={`Remove banned word ${w}`}
                  className="text-ink-mute hover:text-terracotta-700"
                  onClick={() => {
                    clearSaved();
                    setBanned((cur) => cur.filter((x) => x !== w));
                  }}
                >
                  ×
                </button>
              ) : null}
            </span>
          ))}
          {banned.length === 0 ? (
            <span className="text-[13px] text-ink-mute">No banned words yet.</span>
          ) : null}
        </div>
        {canEdit ? (
          <div className="mt-1 flex items-start gap-2">
            <input
              className={INPUT}
              value={bannedInput}
              onChange={(e) => setBannedInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  e.preventDefault();
                  addBanned();
                }
              }}
              placeholder="e.g. unfortunately"
              aria-label="Add a banned word"
            />
            <Button variant="ghost" disabled={!bannedInput.trim()} onClick={addBanned}>
              Add
            </Button>
          </div>
        ) : null}
      </div>
    </Section>
  );
}

// ── wait window ──────────────────────────────────────────────────────────────

function WindowSection({
  canEdit,
  initial,
}: {
  canEdit: boolean;
  initial: SettingsView["window"];
}) {
  const [baseline, setBaseline] = useState(initial);
  const [min, setMin] = useState(String(initial.min));
  const [max, setMax] = useState(String(initial.max));
  const { busy, saved, error, run, clearSaved } = useSave();

  const minOk = INT_RE.test(min) && Number(min) >= 1 && Number(min) <= 730;
  const maxOk = INT_RE.test(max) && Number(max) >= 1 && Number(max) <= 730;
  const ordered = minOk && maxOk && Number(max) >= Number(min);
  const problem = !minOk
    ? "Min days must be a whole number from 1 to 730."
    : !maxOk
      ? "Max days must be a whole number from 1 to 730."
      : !ordered
        ? "Max days must be at least min days."
        : null;
  const dirty = !deepEq({ min, max }, { min: String(baseline.min), max: String(baseline.max) });

  const save = () =>
    run(
      { section: "window", windowMinDays: Number(min), windowMaxDays: Number(max) },
      (view) => {
        setBaseline(view.window);
        setMin(String(view.window.min));
        setMax(String(view.window.max));
      },
    );

  return (
    <Section
      title="Wait window"
      sub="Your realistic fulfillment window in days. Stage day bands and the confidence bands your customers see derive from it — never a hard date."
      canEdit={canEdit}
      dirty={dirty}
      problem={problem}
      busy={busy}
      saved={saved}
      error={error}
      onSave={() => void save()}
    >
      <div className="grid max-w-[360px] grid-cols-2 gap-3">
        <label className="flex flex-col gap-1 text-[12px] font-medium text-ink-mute">
          Min days
          <input
            className={INPUT}
            inputMode="numeric"
            value={min}
            disabled={!canEdit}
            onChange={(e) => {
              clearSaved();
              setMin(e.target.value);
            }}
          />
        </label>
        <label className="flex flex-col gap-1 text-[12px] font-medium text-ink-mute">
          Max days
          <input
            className={INPUT}
            inputMode="numeric"
            value={max}
            disabled={!canEdit}
            onChange={(e) => {
              clearSaved();
              setMax(e.target.value);
            }}
          />
        </label>
      </div>
    </Section>
  );
}

// ── production stages ────────────────────────────────────────────────────────

interface StageRow {
  key: ProductionStageKey;
  label: string;
  blurb: string;
  from: string;
  to: string;
}

const toStageRows = (stages: SettingsView["stages"]): StageRow[] =>
  stages.map((s) => ({
    key: s.key,
    label: s.label,
    blurb: s.blurb,
    from: String(s.from),
    to: String(s.to),
  }));

function stagesProblem(rows: StageRow[]): string | null {
  for (const r of rows) {
    if (!r.label.trim()) return "Every stage needs a label.";
    if (!r.blurb.trim()) return "Every stage needs a one-line blurb.";
    if (!INT_RE.test(r.from) || !INT_RE.test(r.to)) {
      return `"${r.label}": day bands must be whole numbers.`;
    }
    if (Number(r.from) >= Number(r.to)) {
      return `"${r.label}": the start day must be before the end day.`;
    }
  }
  for (let i = 1; i < rows.length; i++) {
    if (Number(rows[i].from) < Number(rows[i - 1].to)) {
      return `"${rows[i].label}" overlaps "${rows[i - 1].label}" — bands must stay in order.`;
    }
  }
  return null;
}

function StagesSection({
  canEdit,
  initial,
}: {
  canEdit: boolean;
  initial: SettingsView["stages"];
}) {
  const [baseline, setBaseline] = useState(() => toStageRows(initial));
  const [rows, setRows] = useState(() => toStageRows(initial));
  const { busy, saved, error, run, clearSaved } = useSave();

  const dirty = !deepEq(rows, baseline);
  const problem = stagesProblem(rows);

  const edit = (i: number, patch: Partial<StageRow>) => {
    clearSaved();
    setRows((cur) => cur.map((r, j) => (j === i ? { ...r, ...patch } : r)));
  };

  const save = () =>
    run(
      {
        section: "stages",
        stages: rows.map((r) => ({
          key: r.key,
          label: r.label.trim(),
          blurb: r.blurb.trim(),
          from: Number(r.from),
          to: Number(r.to),
        })),
      },
      (view) => {
        setBaseline(toStageRows(view.stages));
        setRows(toStageRows(view.stages));
      },
    );

  return (
    <Section
      title="Production stages"
      sub="The stages a customer's order moves through and the day band each one covers. Reword them freely — the stage keys themselves are fixed."
      canEdit={canEdit}
      dirty={dirty}
      problem={problem}
      busy={busy}
      saved={saved}
      error={error}
      onSave={() => void save()}
    >
      <ul className="flex flex-col gap-3">
        {rows.map((r, i) => (
          <li key={r.key} className="rounded-lg border border-border bg-sand-2 p-3">
            <div className="grid gap-2 sm:grid-cols-[1fr_88px_88px]">
              <label className="flex flex-col gap-1 text-[12px] font-medium text-ink-mute">
                <span>
                  Label{" "}
                  <span className="font-normal normal-case text-ink-mute/70">({r.key})</span>
                </span>
                <input
                  className={INPUT}
                  value={r.label}
                  disabled={!canEdit}
                  onChange={(e) => edit(i, { label: e.target.value })}
                />
              </label>
              <label className="flex flex-col gap-1 text-[12px] font-medium text-ink-mute">
                From day
                <input
                  className={INPUT}
                  inputMode="numeric"
                  value={r.from}
                  disabled={!canEdit}
                  onChange={(e) => edit(i, { from: e.target.value })}
                />
              </label>
              <label className="flex flex-col gap-1 text-[12px] font-medium text-ink-mute">
                To day
                <input
                  className={INPUT}
                  inputMode="numeric"
                  value={r.to}
                  disabled={!canEdit}
                  onChange={(e) => edit(i, { to: e.target.value })}
                />
              </label>
            </div>
            <label className="mt-2 flex flex-col gap-1 text-[12px] font-medium text-ink-mute">
              Blurb — dropped into replies as &ldquo;right now {"{stage_blurb}"}&rdquo;
              <input
                className={INPUT}
                value={r.blurb}
                disabled={!canEdit}
                onChange={(e) => edit(i, { blurb: e.target.value })}
              />
            </label>
          </li>
        ))}
      </ul>
    </Section>
  );
}

// ── gift catalog ─────────────────────────────────────────────────────────────

interface GiftRow {
  id?: string;
  name: string;
  kind: GiftKind;
  tier: GiftTier;
  cost: string;
  perceived: string;
}

const toGiftRows = (gifts: SettingsView["gifts"]): GiftRow[] =>
  gifts.map((g) => ({
    id: g.id,
    name: g.name,
    kind: g.kind,
    tier: g.tier,
    cost: fromCents(g.costCents),
    perceived: fromCents(g.perceivedValueCents),
  }));

function giftsProblem(rows: GiftRow[]): string | null {
  if (rows.length < 3) return "Keep at least 3 active gifts.";
  if (!rows.some((r) => r.tier === "base")) {
    return "Keep at least one Base gift (available to every waiting customer).";
  }
  for (const r of rows) {
    if (!r.name.trim()) return "Every gift needs a label.";
    if (!MONEY_RE.test(r.cost) || toCents(r.cost) > 50000) {
      return `"${r.name || "New gift"}": cost must be a dollar amount up to $500.`;
    }
    if (!MONEY_RE.test(r.perceived)) {
      return `"${r.name || "New gift"}": perceived value must be a dollar amount.`;
    }
  }
  return null;
}

function GiftsSection({
  canEdit,
  initial,
}: {
  canEdit: boolean;
  initial: SettingsView["gifts"];
}) {
  const [baseline, setBaseline] = useState(() => toGiftRows(initial));
  const [rows, setRows] = useState(() => toGiftRows(initial));
  const { busy, saved, error, run, clearSaved } = useSave();

  const dirty = !deepEq(rows, baseline);
  const problem = giftsProblem(rows);

  const edit = (i: number, patch: Partial<GiftRow>) => {
    clearSaved();
    setRows((cur) => cur.map((r, j) => (j === i ? { ...r, ...patch } : r)));
  };
  const retire = (i: number) => {
    clearSaved();
    setRows((cur) => cur.filter((_, j) => j !== i));
  };
  const add = () => {
    clearSaved();
    setRows((cur) =>
      cur.length >= 20
        ? cur
        : [...cur, { name: "", kind: "digital-perk", tier: "base", cost: "0", perceived: "0" }],
    );
  };

  const save = () =>
    run(
      {
        section: "gifts",
        gifts: rows.map((r) => ({
          ...(r.id ? { id: r.id } : {}),
          name: r.name.trim(),
          kind: r.kind,
          tier: r.tier,
          costCents: toCents(r.cost),
          perceivedValueCents: toCents(r.perceived),
        })),
      },
      (view) => {
        setBaseline(toGiftRows(view.gifts));
        setRows(toGiftRows(view.gifts));
      },
    );

  return (
    <Section
      title="Gift catalog"
      sub="The goodwill gestures the cockpit can offer a waiting customer. Retiring keeps a gift's history but stops it being offered. Keep at least 3 active, one of them Base."
      canEdit={canEdit}
      dirty={dirty}
      problem={problem}
      busy={busy}
      saved={saved}
      error={error}
      onSave={() => void save()}
    >
      <ul className="flex flex-col gap-3">
        {rows.map((r, i) => (
          <li key={r.id ?? `new-${i}`} className="rounded-lg border border-border bg-sand-2 p-3">
            <div className="flex items-start gap-2">
              <label className="flex flex-1 flex-col gap-1 text-[12px] font-medium text-ink-mute">
                Label
                <input
                  className={INPUT}
                  value={r.name}
                  disabled={!canEdit}
                  onChange={(e) => edit(i, { name: e.target.value })}
                  placeholder="e.g. Early access to the next drop"
                />
              </label>
              {canEdit ? (
                <Button variant="ghost" className="mt-5" disabled={busy} onClick={() => retire(i)}>
                  {r.id ? "Retire" : "Remove"}
                </Button>
              ) : null}
            </div>
            <div className="mt-2 grid gap-2 sm:grid-cols-[1fr_1fr_96px_96px]">
              <label className="flex flex-col gap-1 text-[12px] font-medium text-ink-mute">
                Kind
                <select
                  className={INPUT}
                  value={r.kind}
                  disabled={!canEdit}
                  onChange={(e) => edit(i, { kind: e.target.value as GiftKind })}
                >
                  {KIND_OPTIONS.map((o) => (
                    <option key={o.value} value={o.value}>
                      {o.label}
                    </option>
                  ))}
                </select>
              </label>
              <label className="flex flex-col gap-1 text-[12px] font-medium text-ink-mute">
                Tier — when it unlocks
                <select
                  className={INPUT}
                  value={r.tier}
                  disabled={!canEdit}
                  onChange={(e) => edit(i, { tier: e.target.value as GiftTier })}
                >
                  {TIER_OPTIONS.map((o) => (
                    <option key={o.value} value={o.value}>
                      {o.label}
                    </option>
                  ))}
                </select>
              </label>
              <label className="flex flex-col gap-1 text-[12px] font-medium text-ink-mute">
                Cost $
                <input
                  className={INPUT}
                  inputMode="decimal"
                  value={r.cost}
                  disabled={!canEdit}
                  onChange={(e) => edit(i, { cost: e.target.value })}
                />
              </label>
              <label className="flex flex-col gap-1 text-[12px] font-medium text-ink-mute">
                Perceived $
                <input
                  className={INPUT}
                  inputMode="decimal"
                  value={r.perceived}
                  disabled={!canEdit}
                  onChange={(e) => edit(i, { perceived: e.target.value })}
                />
              </label>
            </div>
          </li>
        ))}
      </ul>
      {canEdit ? (
        <div>
          <Button variant="ghost" disabled={rows.length >= 20 || busy} onClick={add}>
            Add gift
          </Button>
        </div>
      ) : null}
    </Section>
  );
}

// ── the manager ──────────────────────────────────────────────────────────────

export function SettingsManager({
  isOwner,
  isDemo,
  initial,
}: {
  isOwner: boolean;
  isDemo: boolean;
  initial: SettingsView;
}) {
  const canEdit = isOwner && !isDemo;
  return (
    <div className="flex max-w-[760px] flex-col gap-4">
      {isDemo ? (
        <p className="rounded-lg border border-dashed border-border bg-sand-2 px-3 py-2 text-[12px] text-ink-mute">
          <span className="font-semibold uppercase tracking-wider">Sample</span> &mdash; this demo
          workspace&rsquo;s settings are read-only.
        </p>
      ) : !isOwner ? (
        <p className="text-[12px] text-ink-mute">Only the workspace owner can change settings.</p>
      ) : null}

      <BrandSection canEdit={canEdit} initial={initial.brand} />
      <WindowSection canEdit={canEdit} initial={initial.window} />
      <StagesSection canEdit={canEdit} initial={initial.stages} />
      <GiftsSection canEdit={canEdit} initial={initial.gifts} />
    </div>
  );
}
