"use client";

import Link from "next/link";
import { useCallback, useEffect, useRef, useState, type ComponentProps } from "react";
import {
  ChatTurn,
  DecisionCard,
  DraftArtifact,
  PulseDot,
  RecapCard,
  StreamingText,
  ToolChecklist,
  useAgentStream,
} from "@/components/agentic";
import { DEFAULT_STAGES, type IntakeStage } from "@/lib/onboarding-defaults";
import type { ImportFormat, MappedRow } from "@/lib/csv";
import { ConnectPanel } from "../ConnectPanel";
import { ImportPanel } from "../ImportPanel";

/**
 * OnboardingFlow (SWAN SPRINT P2, docs/SWAN-SPRINT-P2-FLOW.md) — the 8 beats as
 * ONE transcript. Scripted state machine wearing the conversational skin: the
 * agent runs only at the research/readout beats (and the engine, not the LLM,
 * produces the preview drafts). Every branch has a floor — agent off, scrape
 * failed, SSE drop, preview failed, connect skipped — the flow always reaches
 * the finish POST, which is the SAME endpoint the classic wizard uses.
 */

type BeatId =
  | "url"
  | "research"
  | "readout"
  | "brand"
  | "voice"
  | "timeline"
  | "gifts"
  | "import"
  | "drafts"
  | "creating"
  | "connect"
  | "recap";

const BEAT_ORDER: BeatId[] = [
  "url",
  "research",
  "readout",
  "brand",
  "voice",
  "timeline",
  "gifts",
  "import",
  "drafts",
  "creating",
  "connect",
  "recap",
];

interface AnalyzePrefill {
  brandName?: string;
  platform?: string;
  estimatedDelivery?: string;
}

const VOICE_PRESETS = [
  {
    label: "Warm & calm — steady workshop updates",
    tone: ["Warm", "Calm", "Straightforward"],
    voice: "Warm, calm workshop updates that tell backers exactly where things stand",
  },
  {
    label: "Direct & factual — short sentences, no cushioning",
    tone: ["Direct", "Concise", "Straightforward"],
    voice: "Direct, factual updates. Short sentences, concrete nouns, zero filler",
  },
  {
    label: "Friendly & upbeat — but always concrete",
    tone: ["Friendly", "Upbeat", "Concrete"],
    voice: "Friendly, upbeat replies that stay concrete about stages and timing",
  },
] as const;

/**
 * Scale the default stage plan onto the merchant's window. Pure arithmetic the
 * merchant SEES and confirms in the timeline beat — the confirmed numbers are
 * what gets submitted, so the engine's bands always come from their answer.
 */
export function scaleStages(windowMaxDays: number): IntakeStage[] {
  const baseMax = DEFAULT_STAGES[DEFAULT_STAGES.length - 1].to; // 118
  const f = windowMaxDays / baseMax;
  const scaled = DEFAULT_STAGES.map((s) => ({
    ...s,
    from: Math.round(s.from * f),
    to: Math.round(s.to * f),
  }));
  // guarantee contiguous, non-empty bands ending exactly at the window
  for (let i = 0; i < scaled.length; i++) {
    if (i > 0) scaled[i].from = scaled[i - 1].to;
    if (scaled[i].to <= scaled[i].from) scaled[i].to = scaled[i].from + 1;
  }
  scaled[scaled.length - 1].to = Math.max(windowMaxDays, scaled[scaled.length - 1].from + 1);
  return scaled;
}

interface Preview {
  stageKey: string;
  text: string;
}

type ConnectProps = ComponentProps<typeof ConnectPanel>;

interface CreateResult {
  merchantId: string;
  slug: string;
  connect?: ConnectProps;
  previews: Preview[];
}

export function OnboardingFlow() {
  const [beat, setBeat] = useState<BeatId>("url");
  const [siteUrl, setSiteUrl] = useState("");
  const [prefill, setPrefill] = useState<AnalyzePrefill>({});
  const [researchSkipped, setResearchSkipped] = useState<string | null>(null);
  const [brandName, setBrandName] = useState("");
  const [voicePreset, setVoicePreset] = useState<(typeof VOICE_PRESETS)[number] | null>(null);
  const [customVoice, setCustomVoice] = useState<string | null>(null);
  const [signoff, setSignoff] = useState("");
  const [windowMin, setWindowMin] = useState(90);
  const [windowMax, setWindowMax] = useState(120);
  const [stages, setStages] = useState<IntakeStage[]>(DEFAULT_STAGES);
  const [keepGifts, setKeepGifts] = useState<boolean | null>(null);
  const [stagedRows, setStagedRows] = useState<MappedRow[]>([]);
  const [stagedFileName, setStagedFileName] = useState<string | null>(null);
  const [importChoice, setImportChoice] = useState<"upload" | "skip" | null>(null);
  const [previews, setPreviews] = useState<Preview[] | null>(null);
  const [previewFailed, setPreviewFailed] = useState(false);
  const [creating, setCreating] = useState(false);
  const [createError, setCreateError] = useState<string | null>(null);
  const [result, setResult] = useState<CreateResult | null>(null);
  const [connectSkipped, setConnectSkipped] = useState(false);

  const stream = useAgentStream();
  const previewFiredRef = useRef(false);
  const bottomRef = useRef<HTMLDivElement | null>(null);

  // Swan's anchor-to-newest: keep the freshest content in view as the
  // transcript grows (checklist lines, streamed text, new cards).
  useEffect(() => {
    const reduce = typeof window !== "undefined" && window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    bottomRef.current?.scrollIntoView({ behavior: reduce ? "auto" : "smooth", block: "end" });
  }, [beat, stream.checklist.length, stream.text, previews, result, createError, importChoice]);

  const reached = useCallback(
    (b: BeatId) => BEAT_ORDER.indexOf(beat) >= BEAT_ORDER.indexOf(b),
    [beat],
  );
  const advance = useCallback((to: BeatId) => setBeat(to), []);

  // ── beat 0 → 1: fire the show AND the structured prefill together ─────
  const submitUrl = useCallback(
    async (url: string) => {
      if (!url) {
        // the no-URL path: no research to show, straight to the questions
        setSiteUrl("(no URL — manual setup)");
        setResearchSkipped("No problem — three quick questions and you're set.");
        advance("brand");
        return;
      }
      setSiteUrl(url);
      advance("research");
      void stream.start("diagnose-page", `${url} — diagnose this page for the merchant who owns it`);
      try {
        const res = await fetch("/api/analyze", {
          method: "POST",
          headers: { "content-type": "application/json" },
          body: JSON.stringify({ url }),
        });
        const data = (await res.json()) as { ok?: boolean } & AnalyzePrefill;
        if (res.ok && data.ok) {
          setPrefill(data);
          if (data.brandName) setBrandName((prev) => prev || data.brandName || "");
        }
      } catch {
        /* prefill is a bonus, never a blocker */
      }
    },
    [advance, stream],
  );

  // research beat resolves by stream status
  useEffect(() => {
    if (beat !== "research") return;
    if (stream.status === "done") advance("readout");
    else if (stream.status === "disabled" || stream.status === "error" || stream.status === "rejected") {
      setResearchSkipped(
        stream.status === "disabled"
          ? "Skipping the live research on this host — three quick questions instead."
          : "That page didn't want to be read just now — no problem, three quick questions instead.",
      );
      advance(brandName ? "voice" : "brand");
    }
  }, [beat, stream.status, brandName, advance]);

  // ── beat 5: previews fire once on entry ───────────────────────────────
  useEffect(() => {
    if (beat !== "drafts" || previewFiredRef.current) return;
    previewFiredRef.current = true;
    void (async () => {
      try {
        const res = await fetch("/api/onboarding/preview", {
          method: "POST",
          headers: { "content-type": "application/json" },
          body: JSON.stringify(buildBody([])),
        });
        const data = (await res.json()) as { ok?: boolean; previews?: Preview[] };
        if (res.ok && data.ok && data.previews?.length) setPreviews(data.previews);
        else setPreviewFailed(true);
      } catch {
        setPreviewFailed(true);
      }
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps -- fires once per flow
  }, [beat]);

  function buildBody(importRows: MappedRow[]) {
    const preset = voicePreset ?? VOICE_PRESETS[0];
    return {
      brandName: brandName.trim(),
      voice: customVoice ?? preset.voice,
      tone: [...preset.tone],
      banned: [] as string[],
      signoff: signoff.trim() || `— ${brandName.trim()}`,
      helpdesk: "gorgias",
      preorderApp: "",
      windowMinDays: windowMin,
      windowMaxDays: windowMax,
      stages,
      gifts: [] as never[], // empty → the server builds the suggested ladder (base tier guaranteed)
      importRows,
    };
  }

  // ── beat 6: the finish POST (same endpoint as the classic wizard) ─────
  const finish = useCallback(async () => {
    advance("creating");
    setCreating(true);
    setCreateError(null);
    try {
      const res = await fetch("/api/onboarding", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify(buildBody(stagedRows)),
      });
      if (res.status === 409) {
        const data = (await res.json()) as { redirect?: string };
        window.location.assign(data.redirect ?? "/app");
        return;
      }
      if (!res.ok) {
        setCreateError(`That didn't save (HTTP ${res.status}). Nothing was lost — try again.`);
        return;
      }
      const data = (await res.json()) as CreateResult;
      setResult(data);
      advance(data.connect ? "connect" : "recap");
    } catch {
      setCreateError("That didn't save (network). Nothing was lost — try again.");
    } finally {
      setCreating(false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps -- reads current state at call time
  }, [advance, stagedRows, brandName, voicePreset, customVoice, signoff, windowMin, windowMax, stages]);

  const voiceLabel = customVoice ? "Your own words" : (voicePreset?.label ?? "");
  const openItem = connectSkipped
    ? "your helpdesk isn't connected yet — replies stage as drafts in your Inbox; connect any time from Setup."
    : importChoice === "skip"
      ? "no backers imported yet — add your CSV any time from Setup."
      : "none — you're fully set.";

  return (
    <main className="wrap max-w-2xl space-y-6 py-10">
      {/* ── Beat 0: one field ── */}
      <ChatTurn role="agent">
        <p>
          Welcome. Give me your store or campaign URL and I&apos;ll do the homework on your business —
          you watch.
        </p>
      </ChatTurn>
      {beat === "url" ? (
        <UrlCard onSubmit={submitUrl} />
      ) : (
        <ChatTurn role="user">{siteUrl}</ChatTurn>
      )}

      {/* ── Beat 1: watch it work ── */}
      {reached("research") && !researchSkipped ? (
        <ChatTurn role="agent">
          {stream.checklist.length > 0 ? <ToolChecklist steps={stream.checklist} className="mb-3" /> : null}
          {stream.text ? (
            <StreamingText text={stream.text} active={stream.status === "running"} />
          ) : stream.status === "running" ? (
            <PulseDot />
          ) : null}
        </ChatTurn>
      ) : null}
      {researchSkipped ? (
        <ChatTurn role="agent">
          <p>{researchSkipped}</p>
        </ChatTurn>
      ) : null}

      {/* ── Beat 2: the readout's one question ── */}
      {beat === "readout" ? (
        <DecisionCard
          question="Want me to set this up so backers stop asking?"
          options={["Set it up — three questions and you're live"]}
          allowOther={false}
          onSelect={() => advance(brandName ? "voice" : "brand")}
        />
      ) : null}

      {/* ── Beat 3a: brand (only when the scrape didn't find it) ── */}
      {beat === "brand" ? (
        <TextCard
          question="What's your brand called?"
          placeholder="e.g. Ledger & Loom"
          onSubmit={(v) => {
            setBrandName(v);
            advance("voice");
          }}
        />
      ) : null}
      {reached("voice") && brandName ? (
        <ChatTurn role="agent">
          <p>
            Setting up <strong>{brandName}</strong>
            {prefill.platform && !["generic", "unknown"].includes(prefill.platform)
              ? ` (${prefill.platform})`
              : ""}
            . One question at a time — three total.
          </p>
        </ChatTurn>
      ) : null}

      {/* ── Beat 3b: voice ── */}
      {beat === "voice" ? (
        <DecisionCard
          index={{ n: 1, of: 3 }}
          question="What should replies to your backers sound like?"
          options={VOICE_PRESETS.map((p) => p.label)}
          onSelect={(choice) => {
            const preset = VOICE_PRESETS.find((p) => p.label === choice);
            if (preset) setVoicePreset(preset);
            else setCustomVoice(choice);
            setSignoff(`— ${brandName}`);
            advance("timeline");
          }}
        />
      ) : null}
      {reached("timeline") ? <ChatTurn role="user">{voiceLabel}</ChatTurn> : null}

      {/* ── Beat 3c: timeline ── */}
      {beat === "timeline" ? (
        <TimelineCard
          estimatedDelivery={prefill.estimatedDelivery}
          windowMin={windowMin}
          windowMax={windowMax}
          onConfirm={(min, max) => {
            setWindowMin(min);
            setWindowMax(max);
            setStages(max === 120 ? DEFAULT_STAGES : scaleStages(max));
            advance("gifts");
          }}
        />
      ) : null}
      {reached("gifts") ? (
        <ChatTurn role="user">
          {windowMin}–{windowMax} days after close
        </ChatTurn>
      ) : null}

      {/* ── Beat 3d: gifts ── */}
      {beat === "gifts" ? (
        <DecisionCard
          index={{ n: 3, of: 3 }}
          question="When a long wait needs a goodwill gesture, start with the suggested ladder? (Always includes one that costs you nothing — you can edit all of it later in Settings.)"
          options={["Use the suggested ladder", "Fine — decide per case later"]}
          allowOther={false}
          onSelect={(choice) => {
            setKeepGifts(choice === "Use the suggested ladder");
            advance("import");
          }}
        />
      ) : null}
      {reached("import") && keepGifts !== null ? (
        <ChatTurn role="user">{keepGifts ? "Suggested ladder" : "Decide later"}</ChatTurn>
      ) : null}

      {/* ── Beat 4: backers ── */}
      {beat === "import" && importChoice === null ? (
        <DecisionCard
          question="Bring your backers in now? Real orders make everything real — drafts, timelines, the status page."
          options={["Upload my backer CSV", "Skip for now"]}
          allowOther={false}
          onSelect={(choice) => setImportChoice(choice === "Skip for now" ? "skip" : "upload")}
        />
      ) : null}
      {beat === "import" && importChoice === "upload" && stagedRows.length === 0 ? (
        <div className="panel p-4">
          <ImportPanel
            onStage={(rows: MappedRow[], _format: ImportFormat, fileName: string) => {
              setStagedRows(rows);
              setStagedFileName(fileName);
              advance("drafts");
            }}
          />
          <button
            type="button"
            className="mt-3 text-[13px] text-ink-mute hover:text-ink"
            onClick={() => {
              setImportChoice("skip");
              advance("drafts");
            }}
          >
            Skip for now instead →
          </button>
        </div>
      ) : null}
      {beat === "import" && importChoice === "skip" ? <AdvanceOnMount to="drafts" advance={advance} /> : null}
      {reached("drafts") ? (
        <ChatTurn role="user">
          {stagedRows.length > 0
            ? `Staged ${stagedRows.length.toLocaleString()} backers from ${stagedFileName ?? "CSV"}`
            : "Skipped the import for now"}
        </ChatTurn>
      ) : null}

      {/* ── Beat 5: drafts before connect ── */}
      {reached("drafts") ? (
        <ChatTurn role="agent">
          {previews ? (
            <>
              <p>Here&apos;s what I&apos;d send your backers today — your voice, your timeline (sample backer):</p>
              {previews.slice(1, 3).map((p) => (
                <DraftArtifact key={p.stageKey} title={`Draft — ${p.stageKey.replace("day-", "day ")} check-in (SAMPLE)`}>
                  {p.text}
                </DraftArtifact>
              ))}
              <p className="text-[13px] font-medium text-ink">
                Nothing sends without you hitting approve — that never changes.
              </p>
            </>
          ) : previewFailed ? (
            <p>
              Sample drafts will be waiting in your inbox after setup — the preview didn&apos;t load
              here, which blocks nothing.
            </p>
          ) : (
            <PulseDot />
          )}
        </ChatTurn>
      ) : null}
      {beat === "drafts" && (previews || previewFailed) ? (
        <DecisionCard
          question={`Good to go? I'll create ${brandName}'s workspace now.`}
          options={["Create my workspace"]}
          allowOther={false}
          onSelect={() => void finish()}
        />
      ) : null}

      {/* ── Beat 6: creating ── */}
      {beat === "creating" ? (
        <ChatTurn role="agent">
          {creating ? (
            <span className="flex items-center gap-2 text-[14px]">
              <PulseDot /> Creating your workspace…
            </span>
          ) : createError ? (
            <>
              <p>{createError}</p>
              <p className="mt-1 text-[13px]">
                <button type="button" className="btn btn-ghost px-3 py-1.5 text-[13px]" onClick={() => void finish()}>
                  Try again
                </button>{" "}
                <Link href="/onboarding?classic=1" className="link-quiet ml-2 text-[13px]">
                  or use the classic form →
                </Link>
              </p>
            </>
          ) : null}
        </ChatTurn>
      ) : null}

      {/* ── Beat 7: connect, late + skippable ── */}
      {beat === "connect" && result?.connect ? (
        <>
          <ChatTurn role="agent">
            <p>
              Last thing — to have real tickets land here already drafted, connect your helpdesk.
              Skip it and everything still works: drafts stage in your Inbox.
            </p>
          </ChatTurn>
          <div className="panel p-4">
            <ConnectPanel {...result.connect} />
          </div>
          <div className="flex gap-3">
            <button type="button" className="btn btn-primary px-4 py-2 text-[14px]" onClick={() => advance("recap")}>
              Done — finish up
            </button>
            <button
              type="button"
              className="btn btn-ghost px-4 py-2 text-[14px]"
              onClick={() => {
                setConnectSkipped(true);
                advance("recap");
              }}
            >
              Skip for now
            </button>
          </div>
        </>
      ) : null}

      {/* ── Beat 8: recap ── */}
      {beat === "recap" && result ? (
        <>
          <RecapCard
            title={`${brandName} is set up`}
            rows={[
              {
                icon: "✅",
                label: "Done today:",
                value: `voice set, ${stages.length} stages on a ${windowMin}–${windowMax} day window${
                  stagedRows.length > 0 ? `, ${stagedRows.length.toLocaleString()} backers imported` : ""
                }.`,
              },
              {
                icon: "✅",
                label: "Every morning:",
                value: "new tickets arrive drafted; you approve — nothing sends itself.",
              },
              { icon: "📬", label: "Where they land:", value: "your Inbox." },
              { icon: "⚠️", label: "Your one open item:", value: openItem },
              {
                icon: "📈",
                label: "Week 1 looks like:",
                value: "approve a handful of replies a day; your status page absorbs the rest.",
              },
            ]}
          />
          <Link href="/app/inbox" className="btn btn-primary btn-lg btn-pill">
            Open your Inbox <span className="cta-arrow">→</span>
          </Link>
        </>
      ) : null}

      <p className="pt-6 text-center text-[12px] text-ink-mute">
        Prefer a form?{" "}
        <Link href="/onboarding?classic=1" className="link-quiet">
          Use the classic setup instead
        </Link>
      </p>
      <div ref={bottomRef} aria-hidden />
    </main>
  );
}

/** effect-as-component: advance exactly once after render (skip paths) */
function AdvanceOnMount({ to, advance }: { to: BeatId; advance: (b: BeatId) => void }) {
  useEffect(() => {
    advance(to);
  }, [to, advance]);
  return null;
}

function UrlCard({ onSubmit }: { onSubmit: (url: string) => void }) {
  const [value, setValue] = useState("");
  const valid = /^https?:\/\/\S+\.\S+/.test(value.trim());
  return (
    <form
      className="panel p-4"
      onSubmit={(e) => {
        e.preventDefault();
        if (valid) onSubmit(value.trim());
      }}
    >
      <label className="mb-1 block text-[13px] font-semibold text-ink" htmlFor="flow-url">
        Store or campaign URL
      </label>
      <div className="flex gap-2">
        <input
          id="flow-url"
          value={value}
          onChange={(e) => setValue(e.target.value)}
          placeholder="https://…"
          inputMode="url"
          className="w-full rounded-[10px] border border-border bg-paper px-3.5 py-2.5 text-[14px] text-ink placeholder:text-ink-mute/60"
        />
        <button type="submit" className="btn btn-primary px-5 py-2.5 text-[14px]" disabled={!valid}>
          Let&apos;s go
        </button>
      </div>
      <p className="mt-2 text-[12px] text-ink-mute">
        No URL?{" "}
        <button type="button" className="underline hover:text-ink" onClick={() => onSubmit("")}>
          Answer three questions instead
        </button>
      </p>
    </form>
  );
}

function TextCard({
  question,
  placeholder,
  onSubmit,
}: {
  question: string;
  placeholder: string;
  onSubmit: (value: string) => void;
}) {
  const [value, setValue] = useState("");
  return (
    <form
      className="panel p-4"
      onSubmit={(e) => {
        e.preventDefault();
        if (value.trim()) onSubmit(value.trim());
      }}
    >
      <p className="mb-2 text-[15px] font-semibold text-ink">{question}</p>
      <div className="flex gap-2">
        <input
          value={value}
          onChange={(e) => setValue(e.target.value)}
          placeholder={placeholder}
          className="w-full rounded-[10px] border border-border bg-paper px-3.5 py-2.5 text-[14px] text-ink placeholder:text-ink-mute/60"
        />
        <button type="submit" className="btn btn-primary px-4 py-2.5 text-[14px]" disabled={!value.trim()}>
          Next
        </button>
      </div>
    </form>
  );
}

function TimelineCard({
  estimatedDelivery,
  windowMin,
  windowMax,
  onConfirm,
}: {
  estimatedDelivery?: string;
  windowMin: number;
  windowMax: number;
  onConfirm: (min: number, max: number) => void;
}) {
  const [min, setMin] = useState(windowMin);
  const [max, setMax] = useState(windowMax);
  const valid = min >= 7 && max > min && max <= 365;
  return (
    <div className="panel p-4">
      <div className="mb-2 text-[12px] font-medium text-ink-mute">2 of 3</div>
      <p className="mb-1 text-[15px] font-semibold text-ink">
        How long after an order closes do backers actually wait?
      </p>
      {estimatedDelivery ? (
        <p className="mb-2 text-[13px] text-slate">
          Your page says: <em>&ldquo;{estimatedDelivery}&rdquo;</em> — set the real window below.
        </p>
      ) : (
        <p className="mb-2 text-[13px] text-slate">
          Be real, not optimistic — every reply and status page runs on this window.
        </p>
      )}
      <div className="flex items-center gap-2 text-[14px] text-ink">
        <input
          type="number"
          value={min}
          min={7}
          max={364}
          onChange={(e) => setMin(Number(e.target.value))}
          className="w-24 rounded-[10px] border border-border bg-paper px-3 py-2"
          aria-label="Minimum days"
        />
        <span className="text-ink-mute">to</span>
        <input
          type="number"
          value={max}
          min={8}
          max={365}
          onChange={(e) => setMax(Number(e.target.value))}
          className="w-24 rounded-[10px] border border-border bg-paper px-3 py-2"
          aria-label="Maximum days"
        />
        <span className="text-ink-mute">days</span>
        <button
          type="button"
          className="btn btn-primary ml-auto px-4 py-2 text-[14px]"
          disabled={!valid}
          onClick={() => onConfirm(min, max)}
        >
          That&apos;s the window
        </button>
      </div>
      <p className="mt-2 text-[12px] text-ink-mute">
        Your six production stages scale onto this window — fine-tune them any time in Settings.
      </p>
    </div>
  );
}
