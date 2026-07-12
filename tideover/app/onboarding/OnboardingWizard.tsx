"use client";

import { useEffect, useRef, useState, type ReactNode } from "react";
import { clsx } from "clsx";
import { Button } from "@/components/ui/Button";
import { Field, TextInput, TextArea, Select } from "@/components/ui/Field";
import { Logo } from "@/components/ui/Logo";
import { ProgressRail, MobileProgress } from "@/app/onboarding/WizardShell";
import { DataSourcePicker } from "@/components/product/DataSourcePicker";
import { ConnectPanel } from "@/app/onboarding/ConnectPanel";
import {
  GiftCatalogEditor,
  SUGGESTED_GIFTS,
  giftsValid,
  newGiftRow,
  GIFT_TIER_OPTIONS,
  type GiftRow,
  type GiftKind,
  type GiftTier,
} from "@/app/onboarding/GiftCatalogEditor";
import type { ConnectKit } from "@/lib/ingest-templates";
import type { ImportFormat, MappedRow } from "@/lib/csv";

/**
 * Merchant onboarding. A single guided flow — five named steps in one boxed card
 * with a vertical progress rail — that collects brand voice, current tools, and
 * the real production timeline, then STAGES the merchant's backer CSV in-flow so
 * the final submit is one atomic call: create merchant + import backers. It POSTs
 * to /api/onboarding and lands on an action-first "you're set — {N} backers
 * imported" screen pointed straight at the inbox. Connecting your data is an
 * integral step, not an afterthought. Relative day bands, never hard dates.
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

interface ImportCounts {
  customersCreated: number;
  ordersCreated: number;
  skipped: number;
  datelessRows: number;
  unparseableMoneyRows: number;
  /** import chunks fully persisted (each ≤500 rows). */
  chunksPersisted?: number;
  /** set when the import stopped partway — re-uploading the same file resumes. */
  failedAtChunk?: number | null;
}

type OnboardingResult = {
  merchantId: string;
  slug: string;
  connect?: ConnectKit;
  imported?: ImportCounts | null;
  previews: Preview[];
};

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

// One guided flow: five named steps. "Connect your data" is a real step BEFORE
// review; the final step is the review + finish. No mode toggle — the box always
// reads as the same five steps.
const STEPS = ["Brand & voice", "Real timeline", "Goodwill gifts", "Connect your data", "Review & finish"];
const GIFT_STEP_LABEL = "Goodwill gifts";

// Card title + one-line subhead per step — the boxed frame's heading. Subheads
// state mechanics only (proof-only): what the answers become, never a result.
const STEP_META: Array<{ title: string; subhead: string }> = [
  { title: "Brand & voice", subhead: "How you look and sound to a customer who's waiting." },
  {
    title: "Real timeline",
    subhead: "The window and the stages. We turn these into confidence bands, never a hard date.",
  },
  {
    title: "Goodwill gifts",
    subhead: "Small gestures the cockpit can offer a customer who has waited a long time. Start from ours and edit.",
  },
  {
    title: "Connect your data",
    subhead: "Bring in the backer list you already hold. It stages here and imports the moment you finish.",
  },
  { title: "Review & finish", subhead: "Everything we'll use to build your playbook. Check it, then finish." },
];

const PREVIEW_LABEL: Record<string, string> = {
  "day-7": "Day 7 — calm confirmation",
  "day-30": "Day 30 — proof of movement",
  "day-60": "Day 60 — acknowledge + next step",
  "day-89": "Day 89 — straight & tracking-soon",
};

const STAGE_LABEL = "text-[13px] font-semibold text-ink";

// ── site-analysis autofill (UX-90) ───────────────────────────────────────────
// Shape mirrors POST /api/analyze (lib/site-analyze). Kept local so this client
// file never imports the node-runtime analyzer module.
type SiteGiftCandidate = { label: string; tier: GiftTier; source: "site" | "fallback" };
type AnalyzeResponse =
  | {
      ok: true;
      platform: string;
      brandName?: string;
      accentColor?: string;
      estimatedDelivery?: string;
      rewardTiers?: Array<{ title: string; amountUsd: number }>;
      giftCandidates?: SiteGiftCandidate[];
    }
  | { ok: false; reason: string };

type AnalyzeState =
  | { status: "idle" }
  | { status: "loading"; host: string }
  | { status: "done"; host: string; count: number }
  | { status: "error" };

// Placeholder perceived-value per tier, mirroring the SUGGESTED_GIFTS scale, so a
// prefilled gift is a usable row the merchant tunes — cost defaults to 0.
const GIFT_VALUE_BY_TIER: Record<GiftTier, number> = { base: 2000, mid: 4000, full: 6000 };

function kindFromLabel(label: string): GiftKind {
  const l = label.toLowerCase();
  if (/note|thank/.test(l)) return "founder-note";
  if (/priorit|dispatch|ship/.test(l)) return "priority-dispatch";
  if (/credit/.test(l)) return "next-order-credit";
  if (/early|access/.test(l)) return "early-access";
  return "digital-perk";
}

/** Map analysis candidates to catalog rows: site-sourced first, then topped up
 *  from the suggested set until the >=3-gifts / >=1-base gate is satisfied. */
function candidatesToGifts(cands: SiteGiftCandidate[]): GiftRow[] {
  const ordered = [...cands].sort(
    (a, b) => (a.source === "site" ? 0 : 1) - (b.source === "site" ? 0 : 1),
  );
  const rows: GiftRow[] = ordered.map((c) => ({
    name: c.label,
    kind: kindFromLabel(c.label),
    tier: c.tier,
    costCents: 0,
    perceivedValueCents: GIFT_VALUE_BY_TIER[c.tier],
  }));
  const names = new Set(rows.map((r) => r.name.toLowerCase()));
  for (const g of SUGGESTED_GIFTS) {
    if (rows.length >= 3 && rows.some((r) => r.tier === "base")) break;
    if (names.has(g.name.toLowerCase())) continue;
    rows.push(g);
    names.add(g.name.toLowerCase());
  }
  return rows;
}

/** Normalize a bare or full URL to something z.string().url() accepts; null if junk. */
function normalizeUrl(raw: string): string | null {
  const t = raw.trim();
  if (!t) return null;
  const withScheme = /^https?:\/\//i.test(t) ? t : `https://${t}`;
  try {
    return new URL(withScheme).toString();
  } catch {
    return null;
  }
}

function safeHost(url: string): string {
  try {
    return new URL(url).hostname.replace(/^www\./, "");
  } catch {
    return url;
  }
}

export function OnboardingWizard() {
  const [step, setStep] = useState(0);

  // site-analysis autofill: the merchant's own URL, pasted on step 1
  const [siteUrl, setSiteUrl] = useState("");
  const [analyze, setAnalyze] = useState<AnalyzeState>({ status: "idle" });
  const [preselectSource, setPreselectSource] = useState<"kickstarter" | null>(null);

  // brand & voice
  const [brandName, setBrandName] = useState("");
  const [voice, setVoice] = useState("");
  const [tone, setTone] = useState<string[]>(["Warm", "Calm", "Straightforward"]);
  const [banned, setBanned] = useState("");
  const [signoff, setSignoff] = useState("");

  // tools (folded into the brand step)
  const [helpdesk, setHelpdesk] = useState<Helpdesk>("gorgias");
  const [preorderApp, setPreorderApp] = useState("");

  // timeline
  const [windowMin, setWindowMin] = useState(90);
  const [windowMax, setWindowMax] = useState(120);
  const [stages, setStages] = useState<StageRow[]>(DEFAULT_STAGES);

  // goodwill gifts — prefilled so the merchant edits, never authors from scratch
  const [gifts, setGifts] = useState<GiftRow[]>(SUGGESTED_GIFTS);

  // connect your data — backer rows STAGED in-flow, imported atomically on submit
  const [stagedRows, setStagedRows] = useState<MappedRow[]>([]);
  const [stagedFileName, setStagedFileName] = useState<string | null>(null);
  const [, setStagedFormat] = useState<ImportFormat | null>(null);

  // submit state
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<OnboardingResult | null>(null);

  const lastStep = STEPS.length - 1;
  const brandValid = brandName.trim().length > 0;

  // Refs let the async analysis resolver read the LATEST field state at apply time
  // so it never overwrites something the merchant typed while the fetch was in
  // flight. giftsTouched flips true the moment the merchant edits the catalog.
  const brandNameRef = useRef(brandName);
  useEffect(() => {
    brandNameRef.current = brandName;
  }, [brandName]);
  const giftsTouchedRef = useRef(false);
  const lastAnalyzedUrlRef = useRef<string | null>(null);

  // Move focus to the step heading when the step changes (skip the first render
  // so we don't grab focus / scroll on initial load). Screen readers announce the
  // new step; keyboard users land at the top of the step.
  const headingRef = useRef<HTMLHeadingElement>(null);
  const firstRender = useRef(true);
  useEffect(() => {
    if (firstRender.current) {
      firstRender.current = false;
      return;
    }
    headingRef.current?.focus();
  }, [step]);

  function toggleTone(t: string) {
    setTone((prev) => (prev.includes(t) ? prev.filter((x) => x !== t) : [...prev, t]));
  }

  function updateStage(i: number, patch: Partial<StageRow>) {
    setStages((prev) => prev.map((s, idx) => (idx === i ? { ...s, ...patch } : s)));
  }

  function updateGift(i: number, patch: Partial<GiftRow>) {
    giftsTouchedRef.current = true;
    setGifts((prev) => prev.map((g, idx) => (idx === i ? { ...g, ...patch } : g)));
  }

  function removeGift(i: number) {
    setError(null);
    giftsTouchedRef.current = true;
    setGifts((prev) => prev.filter((_, idx) => idx !== i));
  }

  function addGift() {
    setError(null);
    giftsTouchedRef.current = true;
    setGifts((prev) => [...prev, newGiftRow()]);
  }

  // Kick off site analysis when leaving step 1 (non-blocking). Fires BEFORE the
  // brand-name gate: a merchant who pastes a URL and clicks Continue with an empty
  // brand gets blocked on the gate, and the read fills that empty field in place.
  function maybeAnalyze() {
    const normalized = normalizeUrl(siteUrl);
    if (!siteUrl.trim()) return;
    if (!normalized) {
      setAnalyze({ status: "error" });
      return;
    }
    if (normalized === lastAnalyzedUrlRef.current) return;
    lastAnalyzedUrlRef.current = normalized;
    void runAnalysis(normalized);
  }

  async function runAnalysis(url: string) {
    const host = safeHost(url);
    setAnalyze({ status: "loading", host });
    try {
      const res = await fetch("/api/analyze", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ url }),
      });
      const data = (await res.json().catch(() => null)) as AnalyzeResponse | null;
      if (!data || data.ok !== true) {
        setAnalyze({ status: "error" });
        return;
      }
      setAnalyze({ status: "done", host, count: applyPrefills(data) });
    } catch {
      setAnalyze({ status: "error" });
    }
  }

  // Apply only what the merchant hasn't filled; return the count of fields we
  // actually prefilled FROM the site (fallback-only gifts do not count).
  function applyPrefills(data: Extract<AnalyzeResponse, { ok: true }>): number {
    let count = 0;
    if (data.brandName && brandNameRef.current.trim() === "") {
      setBrandName(data.brandName);
      count += 1;
    }
    if (!giftsTouchedRef.current) {
      const cands = data.giftCandidates ?? [];
      if (cands.some((c) => c.source === "site")) {
        setGifts(candidatesToGifts(cands));
        count += 1;
      }
    }
    if (data.platform === "kickstarter") {
      setPreselectSource("kickstarter");
      count += 1;
    }
    return count;
  }

  function stageImport(rows: MappedRow[], format: ImportFormat, fileName: string) {
    setError(null);
    setStagedRows(rows);
    setStagedFormat(format);
    setStagedFileName(fileName);
  }

  function clearStaged() {
    setStagedRows([]);
    setStagedFormat(null);
    setStagedFileName(null);
  }

  function next() {
    setError(null);
    // Fire the site read on any Continue attempt from step 1 (even a gate-blocked
    // one) so an empty brand name can be filled from the site in place.
    if (step === 0) maybeAnalyze();
    // brandName lives on the first step
    if (step === 0 && !brandValid) {
      setError("Please add your brand name to continue.");
      return;
    }
    // gift gate: can't leave the Goodwill gifts step without a valid catalog
    if (STEPS[step] === GIFT_STEP_LABEL && !giftsValid(gifts)) {
      setError("Add at least 3 goodwill gifts, including one Base gift, to continue.");
      return;
    }
    setStep((s) => Math.min(s + 1, lastStep));
  }

  function back() {
    setError(null);
    setStep((s) => Math.max(s - 1, 0));
  }

  // Completed steps in the rail jump back (all data is preserved in state).
  function jumpTo(i: number) {
    if (i > step) return;
    setError(null);
    setStep(i);
  }

  // Enter-to-continue: the card is a real <form>, so Enter in a text field (and
  // the primary button) advances the step, or finishes on the last one.
  function onFormSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (step < lastStep) next();
    else void submit();
  }

  async function submit() {
    if (!brandValid) {
      setError("Please add your brand name before finishing.");
      setStep(0);
      return;
    }
    if (!giftsValid(gifts)) {
      setError("Add at least 3 goodwill gifts, including one Base gift, before finishing.");
      const giftStep = STEPS.indexOf(GIFT_STEP_LABEL);
      if (giftStep >= 0) setStep(giftStep);
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
          gifts: gifts.map((g) => ({
            name: g.name.trim(),
            kind: g.kind,
            tier: g.tier,
            costCents: Math.max(0, Math.round(g.costCents)),
            perceivedValueCents: Math.max(0, Math.round(g.perceivedValueCents)),
          })),
          // Staged backer rows import atomically with the merchant create.
          importRows: stagedRows,
        }),
      });
      if (res.status === 409) {
        // Already onboarded (one workspace per login) — the API answers with
        // where home is. Route there instead of a dead-end retry loop; the
        // setup-checklist links that land here resolve the same way.
        const data = (await res.json().catch(() => null)) as { redirect?: string } | null;
        window.location.assign(data?.redirect ?? "/app");
        return;
      }
      if (!res.ok) throw new Error("request failed");
      const data = (await res.json()) as OnboardingResult;
      setResult(data);
    } catch {
      setError("Something went wrong setting up your workspace. Please try again.");
    } finally {
      setSubmitting(false);
    }
  }

  // ── success / "you're set" screen (action-first, boxed) ──────────────────
  if (result) {
    const importedBackers = result.imported?.customersCreated ?? 0;
    // A mid-import chunk failure does NOT fail the request — the API returns
    // the truncated counts with failedAtChunk set. Surface it; a truncated
    // import must never read as a clean success.
    const partialImport = result.imported?.failedAtChunk != null;
    const datelessRows = result.imported?.datelessRows ?? 0;
    const unparseableMoneyRows = result.imported?.unparseableMoneyRows ?? 0;
    return (
      <div className="wrap py-10 md:py-16">
        <div className="mx-auto max-w-[880px]">
          <div className="panel px-6 py-8 md:px-10 md:py-10">
            <div className="mb-8 flex items-center justify-between">
              <Logo href="/" />
            </div>

            <div className="mb-8">
              <p className="kicker mb-2">You&rsquo;re covered</p>
              <h1 className="mb-3 text-balance">
                {importedBackers > 0
                  ? `You're set. ${importedBackers} backer${importedBackers === 1 ? "" : "s"} imported${partialImport ? " so far" : ""}.`
                  : "You're set."}
              </h1>
              {/* Proof-only: imports create customers + orders, not tickets — a
                  reply is drafted when a backer MESSAGE arrives, so the inbox
                  starts empty. Say exactly that; never promise waiting drafts. */}
              <p className="max-w-[620px] text-[16px] leading-relaxed text-slate">
                {importedBackers > 0
                  ? `Your reassurance layer is live for ${brandName}. Your backers are in. The moment one messages you, the reply is drafted and waiting for your review — until then the inbox sits empty. Connect your helpdesk below to route those messages in.`
                  : `Your reassurance layer is live for ${brandName}. Import your backer list whenever you're ready; your setup checklist keeps the next step in front of you.`}
              </p>
            </div>

            {partialImport ? (
              <p className="mb-6 max-w-[620px] rounded-xl border border-[rgba(138,102,18,0.3)] bg-[rgba(138,102,18,0.08)] p-3 text-[13.5px] leading-relaxed text-amber-status">
                The import stopped partway &mdash; the {importedBackers} backer
                {importedBackers === 1 ? "" : "s"} above made it in. Upload the same file again from
                your setup checklist to finish; rows already imported are skipped, never duplicated.
              </p>
            ) : null}
            {datelessRows > 0 ? (
              <p className="mb-6 max-w-[620px] rounded-xl border border-[rgba(138,102,18,0.3)] bg-[rgba(138,102,18,0.08)] p-3 text-[13.5px] leading-relaxed text-amber-status">
                {datelessRows} row{datelessRows === 1 ? "" : "s"} had no readable date &mdash; those
                backers default to today. Check your export has a pledge/order date column.
              </p>
            ) : null}
            {unparseableMoneyRows > 0 ? (
              <p className="mb-6 max-w-[620px] rounded-xl border border-[rgba(138,102,18,0.3)] bg-[rgba(138,102,18,0.08)] p-3 text-[13.5px] leading-relaxed text-amber-status">
                {unparseableMoneyRows} row{unparseableMoneyRows === 1 ? "" : "s"} had no readable
                pledge amount and use the default order value.
              </p>
            ) : null}

            <div className="flex flex-wrap items-center gap-4">
              <Button href={`/app/inbox?merchant=${result.merchantId}`}>Open your inbox &rarr;</Button>
              <Button href={`/app/setup?merchant=${result.merchantId}`} variant="ghost">
                Open your setup checklist
              </Button>
            </div>

            {/* The day-stage previews are demoted: proof the drafts exist, one click away. */}
            <details className="panel mt-8 p-6">
              <summary className="cursor-pointer list-none text-[14.5px] font-semibold text-ink">
                See the replies we&rsquo;ll draft from your answers
              </summary>
              <p className="mt-3 max-w-[620px] text-[13.5px] leading-relaxed text-slate">
                Calm, in your voice, and pinned to a confidence band &mdash; never a hard date. Each goes
                out as a backer crosses that day-stage, and you approve every send.
              </p>
              <div className="mt-4 flex flex-col gap-4">
                {result.previews.map((p) => (
                  <div key={p.stageKey} className="rounded-xl border border-border bg-sand p-5">
                    <p className="kicker mb-3">{PREVIEW_LABEL[p.stageKey] ?? p.stageKey}</p>
                    <p className="whitespace-pre-line text-[15px] leading-relaxed text-slate">{p.text}</p>
                  </div>
                ))}
              </div>
            </details>

            {/* Optional next steps — never presented as required. */}
            <div className="mt-8 flex flex-col gap-5">
              {result.connect ? (
                <div>
                  <p className="mb-2 text-[13.5px] leading-relaxed text-ink-mute">
                    <strong className="text-ink">Optional.</strong> On Gorgias, Zendesk or Help
                    Scout? Route presale tickets straight in with one rule, then send a test event
                    to prove it works &mdash; now, or anytime from your setup checklist.
                  </p>
                  <ConnectPanel {...result.connect} />
                </div>
              ) : null}

              <div className="panel flex flex-wrap items-center justify-between gap-4 p-6">
                <div>
                  <h3 className="mb-1">Want a hand getting going?</h3>
                  <p className="max-w-[520px] text-[13.5px] leading-relaxed text-slate">
                    Book a short walkthrough and we&rsquo;ll set your queue up with you, live.
                  </p>
                </div>
                <Button href="/book" variant="ghost">
                  Book a walkthrough
                </Button>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // ── wizard (boxed card + progress rail) ──────────────────────────────────
  const meta = STEP_META[step];
  return (
    <div className="wrap py-10 md:py-16">
      <div className="mx-auto max-w-[880px]">
        <div className="panel">
          {/* header — logo + plain step counter, no marketing copy */}
          <div className="flex items-center justify-between gap-4 px-6 py-5 md:px-8">
            <Logo href="/" />
            <span className="hidden text-[13px] font-semibold text-ink-mute md:inline">
              Step {step + 1} of {STEPS.length}
            </span>
          </div>
          <div className="border-t border-border" aria-hidden />

          <form aria-label="Set up Tideover" onSubmit={onFormSubmit}>
            <div className="grid px-6 py-7 md:grid-cols-[196px_1fr] md:px-8 md:py-8">
              {/* progress rail — desktop only */}
              <div className="hidden md:block md:border-r md:border-border md:pr-7">
                <ProgressRail steps={STEPS} current={step} onJump={jumpTo} />
              </div>

              {/* the current step */}
              <div className="md:pl-8">
                <MobileProgress steps={STEPS} current={step} />
                {/* Always-mounted live region (a11y): screen readers only announce
                    content changes inside a PRE-EXISTING live container, so the
                    role="status" div stays mounted and the chip swaps within it.
                    Gated to the steps the analysis actually prefills (brand 0,
                    gifts 2) — the chip must not linger onto Connect/Review. */}
                <div role="status">
                  {step <= 2 && analyze.status !== "idle" ? <AnalyzeChip state={analyze} /> : null}
                </div>
                <StepFade key={step}>
                  <h2
                    ref={headingRef}
                    tabIndex={-1}
                    className="font-serif text-[22px] font-semibold text-ink focus:outline-none"
                  >
                    {meta.title}
                  </h2>
                  <p className="mt-1.5 max-w-[54ch] text-[14px] leading-relaxed text-slate">{meta.subhead}</p>
                  <div className="mt-6">
                    <StepBody
                      step={step}
                      siteUrl={siteUrl}
                      setSiteUrl={setSiteUrl}
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
                      gifts={gifts}
                      updateGift={updateGift}
                      removeGift={removeGift}
                      addGift={addGift}
                      stagedRows={stagedRows}
                      stagedFileName={stagedFileName}
                      onStage={stageImport}
                      onClearStaged={clearStaged}
                      preselectSource={preselectSource}
                    />
                  </div>
                </StepFade>

                {error ? (
                  <p role="alert" className="mt-5 text-[13.5px] font-medium text-terracotta-700">
                    {error}
                  </p>
                ) : null}
              </div>
            </div>

            {/* sticky footer — Back (ghost) left, primary action right */}
            <div className="sticky bottom-0 z-10 flex items-center justify-between gap-4 rounded-b-[14px] border-t border-border bg-paper px-6 py-4 pb-[calc(1rem+env(safe-area-inset-bottom))] md:px-8 md:pb-4">
              <Button variant="ghost" onClick={back} disabled={step === 0}>
                &larr; Back
              </Button>
              {step < lastStep ? (
                <Button type="submit">Continue &rarr;</Button>
              ) : (
                <Button type="submit" disabled={submitting}>
                  {submitting ? "Setting things up…" : "Take the queue off my plate"}
                </Button>
              )}
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}

// ── site-analysis status ─────────────────────────────────────────────────────
// The autofill confirmation. Teal accent only (terracotta stays action-only).
// States: reading → read with a real prefill count → soft-fail note.
function AnalyzeChip({ state }: { state: AnalyzeState }) {
  if (state.status === "loading") {
    return (
      <p className="mb-5 inline-flex items-center gap-2 text-[12.5px] text-ink-mute">
        <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-teal" aria-hidden />
        Reading your site…
      </p>
    );
  }
  if (state.status === "error") {
    // Step-agnostic wording: the analysis resolves AFTER the merchant has
    // moved past step 1, so "fill in below" would point at nothing there.
    return (
      <p className="mb-5 text-[12.5px] text-ink-mute">
        Couldn&rsquo;t read that URL &middot; no problem, fill things in as you go.
      </p>
    );
  }
  if (state.status === "done") {
    if (state.count > 0) {
      return (
        <p className="mb-5 inline-flex items-center gap-1.5 rounded-full border border-teal-300 bg-accent-card/60 px-3 py-1 text-[12.5px] font-medium text-ink">
          Read {state.host} &middot; {state.count} field{state.count === 1 ? "" : "s"} prefilled
        </p>
      );
    }
    return <p className="mb-5 text-[12.5px] text-ink-mute">Read {state.host}.</p>;
  }
  return null;
}

// ── step transition ──────────────────────────────────────────────────────────
// A gentle fade + slide-in on each step. Remounted per step (keyed by the caller)
// so the new content starts hidden, then transitions to visible after one frame.
// Pure CSS transition — under prefers-reduced-motion the global kill makes it
// instant (content still ends fully visible).
function StepFade({ children }: { children: ReactNode }) {
  const [shown, setShown] = useState(false);
  useEffect(() => {
    const id = requestAnimationFrame(() => setShown(true));
    return () => cancelAnimationFrame(id);
  }, []);
  return (
    <div
      className={clsx(
        "transition duration-200 ease-out",
        shown ? "translate-y-0 opacity-100" : "translate-y-1.5 opacity-0",
      )}
    >
      {children}
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

// ── timeline editor ──────────────────────────────────────────────────────────
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
        <Field label="Fulfillment window — earliest (days)" hint="A range, not a promise">
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

// ── per-step body ────────────────────────────────────────────────────────────
function StepBody(props: {
  step: number;
  siteUrl: string;
  setSiteUrl: (v: string) => void;
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
  gifts: GiftRow[];
  updateGift: (i: number, patch: Partial<GiftRow>) => void;
  removeGift: (i: number) => void;
  addGift: () => void;
  stagedRows: MappedRow[];
  stagedFileName: string | null;
  onStage: (rows: MappedRow[], format: ImportFormat, fileName: string) => void;
  onClearStaged: () => void;
  preselectSource: "kickstarter" | null;
}) {
  const { step } = props;

  // Step 0 — Brand & voice, with "where your support lives" (helpdesk + preorder
  // app) folded in so tools no longer need a standalone step.
  if (step === 0) {
    return (
      <div className="flex flex-col gap-5">
        <Field label="Your website or campaign URL" hint="We'll read it and prefill what we can.">
          <TextInput
            type="url"
            inputMode="url"
            value={props.siteUrl}
            onChange={(e) => props.setSiteUrl(e.target.value)}
            placeholder="yourbrand.com or kickstarter.com/projects/…"
          />
        </Field>
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
        {/* NOT a <Field>: Field renders a wrapping <label>, and a label's click
            target is its first labelable descendant — clicking the "Tone" text
            would silently toggle the first chip. A grouped div is the correct
            semantics for a set of toggle buttons. */}
        <div role="group" aria-label="Tone" className="flex flex-col gap-1.5">
          <span className="text-[13px] font-semibold text-ink">Tone</span>
          <span className="text-[12px] text-ink-mute">
            Pick the words that fit &mdash; these shape the reassurance copy
          </span>
          <ToneChips tone={props.tone} toggleTone={props.toggleTone} />
        </div>
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

        <div className="mt-1 border-t border-border pt-5">
          <p className="mb-4 text-[13px] font-semibold text-ink">Where your support lives</p>
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
        </div>
      </div>
    );
  }

  // Step 1 — Real timeline
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

  // Step 2 — Goodwill gifts
  if (step === 2) {
    return (
      <GiftCatalogEditor
        gifts={props.gifts}
        updateGift={props.updateGift}
        removeGift={props.removeGift}
        addGift={props.addGift}
      />
    );
  }

  // Step 3 — Connect your data (stages the backer CSV in-flow)
  if (step === 3) {
    return (
      <DataSourcePicker
        stagedRows={props.stagedRows}
        stagedFileName={props.stagedFileName}
        onStage={props.onStage}
        onClear={props.onClearStaged}
        preselect={props.preselectSource ?? undefined}
      />
    );
  }

  // Step 4 — Review & finish
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
      gifts={props.gifts}
      stagedCount={props.stagedRows.length}
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
  gifts: GiftRow[];
  stagedCount: number;
}) {
  const helpdeskLabel = HELPDESK_OPTIONS.find((o) => o.value === props.helpdesk)?.label ?? props.helpdesk;
  const tierLabel = (t: GiftRow["tier"]) => GIFT_TIER_OPTIONS.find((o) => o.value === t)?.label ?? t;
  const giftsSummary = props.gifts.map((g) => `${g.name} (${tierLabel(g.tier)})`).join(" · ");
  return (
    <div className="flex flex-col gap-5">
      <p className="text-[14px] leading-relaxed text-slate">
        Here&rsquo;s what we&rsquo;ll set up. Finish, and your reassurance layer goes live &mdash;
        any staged backers import on the spot and land in your inbox as calm, ready-to-review drafts.
      </p>
      <div>
        <ReviewRow label="Brand name" value={props.brandName} />
        <ReviewRow label="Voice" value={props.voice} />
        <ReviewRow label="Tone" value={props.tone.join(", ")} />
        <ReviewRow label="Banned words" value={props.banned} />
        <ReviewRow label="Sign-off" value={props.signoff} />
        <ReviewRow label="Preorder app" value={props.preorderApp} />
        <ReviewRow label="Helpdesk" value={helpdeskLabel} />
        <ReviewRow label="Fulfillment window" value={`days ${props.windowMin}–${props.windowMax}`} />
        <ReviewRow
          label="Stages"
          value={props.stages.map((s) => `${s.label} (${s.from}–${s.to})`).join(" · ")}
        />
        <ReviewRow label={`Goodwill gifts (${props.gifts.length})`} value={giftsSummary} />
        <ReviewRow
          label="Backers to import"
          value={
            props.stagedCount > 0
              ? `${props.stagedCount} staged — imports when you finish`
              : "None staged — import later from your setup checklist"
          }
        />
      </div>
    </div>
  );
}
