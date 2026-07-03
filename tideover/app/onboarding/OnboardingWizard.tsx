"use client";

import { useMemo, useState } from "react";
import { clsx } from "clsx";
import { Button } from "@/components/ui/Button";
import { Field, TextInput, TextArea, Select } from "@/components/ui/Field";
import { Stepper } from "@/components/ui/Stepper";
import { Logo } from "@/components/ui/Logo";

/**
 * Near-frictionless merchant onboarding. A multi-step discovery wizard that
 * collects brand voice, current tools, the real production timeline, and support
 * reality, then POSTs to /api/onboarding and shows the generated day-stage
 * reassurance scripts for review. A "6-question fast-start" toggle collapses to
 * just the essentials. Honest day bands, never hard dates.
 */

type Helpdesk = "mock" | "gorgias" | "tidio" | "intercom" | "email";
type StageKey = "sourcing" | "tooling" | "production" | "qc" | "freight" | "dispatch";

interface StageRow {
  key: StageKey;
  label: string;
  from: number;
  to: number;
  blurb: string;
}

interface Preview {
  stageKey: string;
  text: string;
}

const TONE_OPTIONS = [
  "Warm",
  "Calm",
  "Honest",
  "Playful",
  "Premium",
  "Down-to-earth",
  "Reassuring",
  "Concise",
];

const HELPDESK_OPTIONS: Array<{ value: Helpdesk; label: string }> = [
  { value: "gorgias", label: "Gorgias" },
  { value: "tidio", label: "Tidio" },
  { value: "intercom", label: "Intercom" },
  { value: "email", label: "Email inbox" },
  { value: "mock", label: "None yet / just testing" },
];

const DEFAULT_STAGES: StageRow[] = [
  { key: "sourcing", label: "Sourcing", from: 0, to: 12, blurb: "components are being sourced" },
  { key: "tooling", label: "Tooling & sampling", from: 12, to: 32, blurb: "tooling and the first samples are underway" },
  { key: "production", label: "Production run", from: 32, to: 72, blurb: "your unit is on the production line" },
  { key: "qc", label: "QC & inspection", from: 72, to: 84, blurb: "your unit is going through quality control" },
  { key: "freight", label: "Freight", from: 84, to: 104, blurb: "your batch is in transit to the warehouse" },
  { key: "dispatch", label: "Pick, pack & dispatch", from: 104, to: 118, blurb: "your order is being packed for dispatch" },
];

const FULL_STEPS = ["Brand & voice", "Current tools", "Real timeline", "Support reality", "Review & generate"];
const FAST_STEPS = ["Essentials", "Timeline", "Review & generate"];

const PREVIEW_LABEL: Record<string, string> = {
  "day-7": "Day 7 — calm confirmation",
  "day-30": "Day 30 — proof of movement",
  "day-60": "Day 60 — acknowledge + next step",
  "day-89": "Day 89 — honest & tracking-soon",
};

const STAGE_LABEL = "text-[13px] font-semibold text-ink";

export function OnboardingWizard() {
  const [fast, setFast] = useState(false);
  const [step, setStep] = useState(0);

  // brand & voice
  const [brandName, setBrandName] = useState("");
  const [voice, setVoice] = useState("");
  const [tone, setTone] = useState<string[]>(["Warm", "Calm", "Honest"]);
  const [banned, setBanned] = useState("");
  const [signoff, setSignoff] = useState("");

  // tools
  const [helpdesk, setHelpdesk] = useState<Helpdesk>("gorgias");
  const [preorderApp, setPreorderApp] = useState("");

  // timeline
  const [windowMin, setWindowMin] = useState(90);
  const [windowMax, setWindowMax] = useState(120);
  const [stages, setStages] = useState<StageRow[]>(DEFAULT_STAGES);

  // support reality
  const [worstStory, setWorstStory] = useState("");

  // submit state
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<{ merchantId: string; slug: string; previews: Preview[] } | null>(null);

  const steps = fast ? FAST_STEPS : FULL_STEPS;
  const lastStep = steps.length - 1;
  const brandValid = brandName.trim().length > 0;

  const sampleToken = useMemo(() => "dflvtbcslipuv80vdkkg17us.bf07a04f58", []);

  function toggleTone(t: string) {
    setTone((prev) => (prev.includes(t) ? prev.filter((x) => x !== t) : [...prev, t]));
  }

  function updateStage(i: number, patch: Partial<StageRow>) {
    setStages((prev) => prev.map((s, idx) => (idx === i ? { ...s, ...patch } : s)));
  }

  function next() {
    setError(null);
    // brandName lives on the first step in both modes
    if (step === 0 && !brandValid) {
      setError("Please add your brand name to continue.");
      return;
    }
    setStep((s) => Math.min(s + 1, lastStep));
  }

  function back() {
    setError(null);
    setStep((s) => Math.max(s - 1, 0));
  }

  function switchMode(toFast: boolean) {
    setFast(toFast);
    setStep(0);
    setError(null);
  }

  async function submit() {
    if (!brandValid) {
      setError("Please add your brand name before generating.");
      setStep(0);
      return;
    }
    setSubmitting(true);
    setError(null);
    try {
      const res = await fetch("/api/onboarding", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          brandName: brandName.trim(),
          voice: voice.trim(),
          tone,
          banned: banned
            .split(",")
            .map((b) => b.trim())
            .filter(Boolean),
          signoff: signoff.trim(),
          helpdesk,
          preorderApp: preorderApp.trim(),
          windowMinDays: Number(windowMin) || 0,
          windowMaxDays: Number(windowMax) || 0,
          stages: stages.map((s) => ({
            key: s.key,
            label: s.label,
            from: Number(s.from) || 0,
            to: Number(s.to) || 0,
            blurb: s.blurb,
          })),
          worstStory: worstStory.trim() || undefined,
        }),
      });
      if (!res.ok) throw new Error("request failed");
      const data = (await res.json()) as { merchantId: string; slug: string; previews: Preview[] };
      setResult(data);
    } catch {
      setError("Something went wrong generating your playbook. Please try again.");
    } finally {
      setSubmitting(false);
    }
  }

  // ── success / review screen ──────────────────────────────────────────────
  if (result) {
    return (
      <div className="wrap max-w-[820px] py-12 md:py-16">
        <div className="mb-8 flex items-center justify-between">
          <Logo href="/" />
        </div>
        <div className="mb-8">
          <p className="kicker mb-2">Your playbook is live</p>
          <h1 className="mb-3 text-balance">{brandName} is set up on Tideover</h1>
          <p className="max-w-[620px] text-[16px] leading-relaxed text-slate">
            Here are the day-stage reassurance scripts Tideover generated from your answers. Each one
            is calm, in your voice, and uses an honest confidence band &mdash; never a hard date.
            Review them, and they&rsquo;re ready to go.
          </p>
        </div>

        <div className="flex flex-col gap-4">
          {result.previews.map((p) => (
            <div key={p.stageKey} className="panel p-6">
              <p className="kicker mb-3">{PREVIEW_LABEL[p.stageKey] ?? p.stageKey}</p>
              <p className="whitespace-pre-line text-[15px] leading-relaxed text-slate">{p.text}</p>
            </div>
          ))}
        </div>

        <div className="mt-9 flex flex-wrap items-center gap-4">
          <Button href={`/app?merchant=${result.merchantId}`}>See your cockpit</Button>
          <Button href={`/status/${sampleToken}`} variant="ghost">
            View a sample customer page
          </Button>
        </div>
      </div>
    );
  }

  // ── wizard ───────────────────────────────────────────────────────────────
  return (
    <div className="wrap max-w-[760px] py-12 md:py-16">
      <div className="mb-8 flex flex-wrap items-center justify-between gap-4">
        <Logo href="/" />
        <label className="flex cursor-pointer items-center gap-2.5 rounded-full border border-border bg-paper px-3.5 py-2">
          <input
            type="checkbox"
            checked={fast}
            onChange={(e) => switchMode(e.target.checked)}
            className="h-4 w-4 accent-[#0E5366]"
          />
          <span className="text-[13px] font-semibold text-ink">6-question fast-start</span>
        </label>
      </div>

      <div className="mb-8">
        <h1 className="mb-3 text-balance">Set up Tideover</h1>
        <p className="max-w-[600px] text-[16px] leading-relaxed text-slate">
          A few questions about your brand, your tools, and your real production timeline. We&rsquo;ll
          turn them into a working day-stage reassurance playbook &mdash; honest windows, never hard
          dates.
        </p>
      </div>

      <div className="mb-8">
        <Stepper steps={steps} current={step} />
      </div>

      <div className="panel p-6 md:p-8">
        {fast ? (
          <FastSteps
            step={step}
            brandName={brandName}
            setBrandName={setBrandName}
            helpdesk={helpdesk}
            setHelpdesk={setHelpdesk}
            windowMin={windowMin}
            setWindowMin={setWindowMin}
            windowMax={windowMax}
            setWindowMax={setWindowMax}
            stages={stages}
            updateStage={updateStage}
          />
        ) : (
          <FullSteps
            step={step}
            brandName={brandName}
            setBrandName={setBrandName}
            voice={voice}
            setVoice={setVoice}
            tone={tone}
            toggleTone={toggleTone}
            banned={banned}
            setBanned={setBanned}
            signoff={signoff}
            setSignoff={setSignoff}
            helpdesk={helpdesk}
            setHelpdesk={setHelpdesk}
            preorderApp={preorderApp}
            setPreorderApp={setPreorderApp}
            windowMin={windowMin}
            setWindowMin={setWindowMin}
            windowMax={windowMax}
            setWindowMax={setWindowMax}
            stages={stages}
            updateStage={updateStage}
            worstStory={worstStory}
            setWorstStory={setWorstStory}
          />
        )}

        {error ? <p className="mt-5 text-[13.5px] font-medium text-terracotta-600">{error}</p> : null}

        <div className="mt-8 flex items-center justify-between border-t border-border pt-6">
          <Button variant="quiet" onClick={back} disabled={step === 0}>
            &larr; Back
          </Button>
          {step < lastStep ? (
            <Button onClick={next}>Continue &rarr;</Button>
          ) : (
            <Button onClick={submit} disabled={submitting}>
              {submitting ? "Generating…" : "Generate my playbook"}
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}

// ── tone chips ──────────────────────────────────────────────────────────────
function ToneChips({ tone, toggleTone }: { tone: string[]; toggleTone: (t: string) => void }) {
  return (
    <div className="flex flex-wrap gap-2">
      {TONE_OPTIONS.map((t) => {
        const on = tone.includes(t);
        return (
          <button
            key={t}
            type="button"
            onClick={() => toggleTone(t)}
            aria-pressed={on}
            className={clsx(
              "rounded-full border px-3.5 py-1.5 text-[13px] font-medium transition",
              on
                ? "border-teal bg-teal text-ink-inverse"
                : "border-border bg-paper text-slate hover:border-teal-300",
            )}
          >
            {t}
          </button>
        );
      })}
    </div>
  );
}

// ── timeline editor (shared by both modes) ──────────────────────────────────
function TimelineEditor({
  windowMin,
  setWindowMin,
  windowMax,
  setWindowMax,
  stages,
  updateStage,
}: {
  windowMin: number;
  setWindowMin: (n: number) => void;
  windowMax: number;
  setWindowMax: (n: number) => void;
  stages: StageRow[];
  updateStage: (i: number, patch: Partial<StageRow>) => void;
}) {
  return (
    <div className="flex flex-col gap-6">
      <div className="grid grid-cols-2 gap-4">
        <Field label="Fulfillment window — earliest (days)" hint="Honest band, not a promise">
          <TextInput
            type="number"
            min={0}
            value={windowMin}
            onChange={(e) => setWindowMin(Number(e.target.value))}
          />
        </Field>
        <Field label="Fulfillment window — latest (days)">
          <TextInput
            type="number"
            min={0}
            value={windowMax}
            onChange={(e) => setWindowMax(Number(e.target.value))}
          />
        </Field>
      </div>

      <div>
        <p className={clsx(STAGE_LABEL, "mb-1")}>Production stages</p>
        <p className="mb-3 text-[12px] text-ink-mute">
          Prefilled with sensible defaults &mdash; tweak the day bands and wording to match your
          reality. These are relative day ranges from order placement, never calendar dates.
        </p>
        <div className="flex flex-col gap-3">
          {stages.map((s, i) => (
            <div key={s.key} className="rounded-xl border border-border bg-sand p-4">
              <div className="mb-3 flex flex-wrap items-center gap-3">
                <input
                  value={s.label}
                  onChange={(e) => updateStage(i, { label: e.target.value })}
                  aria-label={`${s.key} label`}
                  className="flex-1 rounded-lg border border-border bg-paper px-3 py-2 text-[14px] font-semibold text-ink outline-none focus:border-teal"
                />
                <div className="flex items-center gap-2 text-[13px] text-ink-mute">
                  <span>days</span>
                  <input
                    type="number"
                    min={0}
                    value={s.from}
                    onChange={(e) => updateStage(i, { from: Number(e.target.value) })}
                    aria-label={`${s.key} from day`}
                    className="w-16 rounded-lg border border-border bg-paper px-2 py-2 text-[14px] text-ink outline-none focus:border-teal"
                  />
                  <span>&ndash;</span>
                  <input
                    type="number"
                    min={0}
                    value={s.to}
                    onChange={(e) => updateStage(i, { to: Number(e.target.value) })}
                    aria-label={`${s.key} to day`}
                    className="w-16 rounded-lg border border-border bg-paper px-2 py-2 text-[14px] text-ink outline-none focus:border-teal"
                  />
                </div>
              </div>
              <input
                value={s.blurb}
                onChange={(e) => updateStage(i, { blurb: e.target.value })}
                aria-label={`${s.key} blurb`}
                placeholder="What's happening at this stage…"
                className="w-full rounded-lg border border-border bg-paper px-3 py-2 text-[14px] text-slate outline-none focus:border-teal"
              />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

// ── full flow steps ─────────────────────────────────────────────────────────
function FullSteps(props: {
  step: number;
  brandName: string;
  setBrandName: (v: string) => void;
  voice: string;
  setVoice: (v: string) => void;
  tone: string[];
  toggleTone: (t: string) => void;
  banned: string;
  setBanned: (v: string) => void;
  signoff: string;
  setSignoff: (v: string) => void;
  helpdesk: Helpdesk;
  setHelpdesk: (h: Helpdesk) => void;
  preorderApp: string;
  setPreorderApp: (v: string) => void;
  windowMin: number;
  setWindowMin: (n: number) => void;
  windowMax: number;
  setWindowMax: (n: number) => void;
  stages: StageRow[];
  updateStage: (i: number, patch: Partial<StageRow>) => void;
  worstStory: string;
  setWorstStory: (v: string) => void;
}) {
  const { step } = props;

  if (step === 0) {
    return (
      <div className="flex flex-col gap-5">
        <Field label="Brand name" hint="What your customers know you as">
          <TextInput
            value={props.brandName}
            onChange={(e) => props.setBrandName(e.target.value)}
            placeholder="e.g. Northwind Goods"
          />
        </Field>
        <Field label="Your voice" hint="A line or two on how you sound to customers">
          <TextArea
            value={props.voice}
            onChange={(e) => props.setVoice(e.target.value)}
            placeholder="Warm and direct, like a maker writing to a friend who backed us early…"
          />
        </Field>
        <Field label="Tone" hint="Pick the words that fit — these shape the reassurance copy">
          <ToneChips tone={props.tone} toggleTone={props.toggleTone} />
        </Field>
        <Field label="Banned words" hint="Comma-separated — we'll keep these out of every reply">
          <TextInput
            value={props.banned}
            onChange={(e) => props.setBanned(e.target.value)}
            placeholder="guaranteed, ASAP, sorry for the inconvenience"
          />
        </Field>
        <Field label="Sign-off" hint="How you close a message">
          <TextInput
            value={props.signoff}
            onChange={(e) => props.setSignoff(e.target.value)}
            placeholder="— The Northwind team"
          />
        </Field>
      </div>
    );
  }

  if (step === 1) {
    return (
      <div className="flex flex-col gap-5">
        <Field label="Helpdesk" hint="Where your support already lives — Tideover bolts on">
          <Select value={props.helpdesk} onChange={(e) => props.setHelpdesk(e.target.value as Helpdesk)}>
            {HELPDESK_OPTIONS.map((o) => (
              <option key={o.value} value={o.value}>
                {o.label}
              </option>
            ))}
          </Select>
        </Field>
        <Field label="Preorder / crowdfunding app" hint="Where your order ETAs come from (optional)">
          <TextInput
            value={props.preorderApp}
            onChange={(e) => props.setPreorderApp(e.target.value)}
            placeholder="e.g. PreProduct, BackerKit, Purple Dot"
          />
        </Field>
      </div>
    );
  }

  if (step === 2) {
    return (
      <TimelineEditor
        windowMin={props.windowMin}
        setWindowMin={props.setWindowMin}
        windowMax={props.windowMax}
        setWindowMax={props.setWindowMax}
        stages={props.stages}
        updateStage={props.updateStage}
      />
    );
  }

  if (step === 3) {
    return (
      <div className="flex flex-col gap-5">
        <div className="rounded-xl border border-border bg-accent-card/60 p-4 text-[13.5px] leading-relaxed text-slate">
          Tideover treats your waiting customers as three groups &mdash; <strong>Kickstarter backers</strong>,{" "}
          <strong>late pledges</strong>, and <strong>new preorders</strong>. Each tends to wait a
          different length and arrive with a different mood. We tune the reassurance for each;
          nothing to set up here.
        </div>
        <Field
          label="The message that scares you most"
          hint="Optional — paste a real anxious or refund-threat message so we can pressure-test the tone"
        >
          <TextArea
            value={props.worstStory}
            onChange={(e) => props.setWorstStory(e.target.value)}
            placeholder="“It's been two months with no update — I'm filing a chargeback unless I hear back today.”"
          />
        </Field>
      </div>
    );
  }

  // review
  return (
    <ReviewPanel
      brandName={props.brandName}
      voice={props.voice}
      tone={props.tone}
      banned={props.banned}
      signoff={props.signoff}
      helpdesk={props.helpdesk}
      preorderApp={props.preorderApp}
      windowMin={props.windowMin}
      windowMax={props.windowMax}
      stages={props.stages}
      worstStory={props.worstStory}
    />
  );
}

// ── fast flow steps ─────────────────────────────────────────────────────────
function FastSteps(props: {
  step: number;
  brandName: string;
  setBrandName: (v: string) => void;
  helpdesk: Helpdesk;
  setHelpdesk: (h: Helpdesk) => void;
  windowMin: number;
  setWindowMin: (n: number) => void;
  windowMax: number;
  setWindowMax: (n: number) => void;
  stages: StageRow[];
  updateStage: (i: number, patch: Partial<StageRow>) => void;
}) {
  const { step } = props;

  if (step === 0) {
    return (
      <div className="flex flex-col gap-5">
        <p className="text-[13.5px] text-ink-mute">
          The fast path: just the essentials. You can fine-tune voice and groups later from your
          cockpit.
        </p>
        <Field label="Brand name">
          <TextInput
            value={props.brandName}
            onChange={(e) => props.setBrandName(e.target.value)}
            placeholder="e.g. Northwind Goods"
          />
        </Field>
        <Field label="Helpdesk" hint="Where your support already lives">
          <Select value={props.helpdesk} onChange={(e) => props.setHelpdesk(e.target.value as Helpdesk)}>
            {HELPDESK_OPTIONS.map((o) => (
              <option key={o.value} value={o.value}>
                {o.label}
              </option>
            ))}
          </Select>
        </Field>
      </div>
    );
  }

  if (step === 1) {
    return (
      <TimelineEditor
        windowMin={props.windowMin}
        setWindowMin={props.setWindowMin}
        windowMax={props.windowMax}
        setWindowMax={props.setWindowMax}
        stages={props.stages}
        updateStage={props.updateStage}
      />
    );
  }

  return (
    <ReviewPanel
      brandName={props.brandName}
      voice=""
      tone={[]}
      banned=""
      signoff=""
      helpdesk={props.helpdesk}
      preorderApp=""
      windowMin={props.windowMin}
      windowMax={props.windowMax}
      stages={props.stages}
      worstStory=""
      fast
    />
  );
}

// ── review panel ────────────────────────────────────────────────────────────
function ReviewRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex flex-col gap-0.5 border-b border-border py-2.5 last:border-0 sm:flex-row sm:gap-4">
      <span className="w-44 flex-none text-[13px] font-semibold text-ink-mute">{label}</span>
      <span className="text-[14px] text-slate">{value || <span className="text-ink-mute">—</span>}</span>
    </div>
  );
}

function ReviewPanel(props: {
  brandName: string;
  voice: string;
  tone: string[];
  banned: string;
  signoff: string;
  helpdesk: Helpdesk;
  preorderApp: string;
  windowMin: number;
  windowMax: number;
  stages: StageRow[];
  worstStory: string;
  fast?: boolean;
}) {
  const helpdeskLabel = HELPDESK_OPTIONS.find((o) => o.value === props.helpdesk)?.label ?? props.helpdesk;
  return (
    <div className="flex flex-col gap-5">
      <p className="text-[14px] leading-relaxed text-slate">
        Here&rsquo;s what we&rsquo;ll use to build your day-stage playbook. Generate it and you&rsquo;ll
        see the reassurance scripts for days 7, 30, 60, and 89.
      </p>
      <div>
        <ReviewRow label="Brand name" value={props.brandName} />
        {!props.fast ? (
          <>
            <ReviewRow label="Voice" value={props.voice} />
            <ReviewRow label="Tone" value={props.tone.join(", ")} />
            <ReviewRow label="Banned words" value={props.banned} />
            <ReviewRow label="Sign-off" value={props.signoff} />
            <ReviewRow label="Preorder app" value={props.preorderApp} />
          </>
        ) : null}
        <ReviewRow label="Helpdesk" value={helpdeskLabel} />
        <ReviewRow label="Fulfillment window" value={`days ${props.windowMin}–${props.windowMax}`} />
        <ReviewRow
          label="Stages"
          value={props.stages.map((s) => `${s.label} (${s.from}–${s.to})`).join(" · ")}
        />
        {!props.fast && props.worstStory ? <ReviewRow label="Toughest message" value={props.worstStory} /> : null}
      </div>
    </div>
  );
}
