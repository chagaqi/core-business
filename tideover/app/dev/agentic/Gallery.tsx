"use client";

import { useEffect, useState } from "react";
import {
  AllCaughtUp,
  ChatTurn,
  DecisionCard,
  DraftArtifact,
  EmptyState,
  PulseDot,
  RecapCard,
  ResumeBanner,
  StreamingText,
  ThoughtRow,
  ToolChecklist,
  type ChecklistStep,
} from "@/components/agentic";

const CHECKLIST_SCRIPT = [
  "Read your product page",
  "Found your stated ship window",
  "Pulled your refund policy",
  "Detected 3 fulfillment stages",
  "Checked your update cadence",
];

function section(title: string, note?: string) {
  return (
    <div className="mb-3 mt-10 first:mt-0">
      <h2 className="font-serif text-[20px] text-ink">{title}</h2>
      {note ? <p className="text-[13px] text-ink-mute">{note}</p> : null}
    </div>
  );
}

/** Looping scripted checklist so the dot grammar (done/active/pending) is visible live. */
function useScriptedChecklist(): ChecklistStep[] {
  const [progress, setProgress] = useState(0);
  useEffect(() => {
    const timer = setInterval(() => setProgress((p) => (p + 1) % (CHECKLIST_SCRIPT.length + 2)), 1100);
    return () => clearInterval(timer);
  }, []);
  return CHECKLIST_SCRIPT.map((label, i) => ({
    label,
    note: i === 0 ? "×3" : undefined,
    state: i < progress ? "done" : i === progress ? "active" : "pending",
  }));
}

export function Gallery() {
  const checklist = useScriptedChecklist();
  const [choice, setChoice] = useState<string | null>(null);

  return (
    <main className="wrap py-10">
      <div className="mb-8 rounded-[10px] border border-border bg-sand-2 px-4 py-3 text-[13px] text-slate">
        <strong className="text-ink">DEV GALLERY — canned sample props.</strong> Visual contract for the agentic kit
        (ADR-0023). Not reachable in production. In the product, checklist lines may only come from real runner events.
      </div>

      {section("ToolChecklist + PulseDot", "muted dot = done · terracotta pulse = active · hollow = pending; loops on a script here")}
      <div className="panel max-w-lg p-5">
        <ToolChecklist steps={checklist} />
        <div className="mt-4 flex items-center gap-2 text-[13px] text-ink-mute">
          <PulseDot /> pre-first-token state
        </div>
      </div>

      {section("ThoughtRow", "finished checklists collapse into this; native <details>, expand to inspect")}
      <div className="max-w-lg space-y-3">
        <ThoughtRow toolCount={8}>
          <ToolChecklist
            steps={CHECKLIST_SCRIPT.map((label) => ({ label, state: "done" as const }))}
          />
        </ThoughtRow>
        <ThoughtRow />
      </div>

      {section("ChatTurn + StreamingText + DraftArtifact", "agent voice = regular ink · drafted artifact = indented muted italic")}
      <div className="max-w-lg space-y-4">
        <ChatTurn role="user">What does my page look like to a nervous backer?</ChatTurn>
        <ChatTurn role="agent">
          <StreamingText
            typewriter
            speedMs={45}
            text="Your page promises a ship window but never says when backers hear from you next. That gap is what turns a quiet wait into a refund request. Here is a first draft:"
          />
          <DraftArtifact title="Draft — day-30 check-in (sample)">
            Hi Sam — quick update from the workshop. Your order is in the anodizing stage, on track for the window on
            your status page. Next update lands in two weeks, sooner if anything changes. — Dylan
          </DraftArtifact>
        </ChatTurn>
      </div>

      {section("DecisionCard", "one question at a time; numbered options + Other; selection locks it")}
      <div className="max-w-lg">
        <DecisionCard
          index={{ n: 1, of: 3 }}
          question="What should replies sound like when a backer is frustrated?"
          options={["Calm and direct — short sentences, no cushioning", "Warm first, then the facts", "Match my past replies (paste two examples)"]}
          selected={choice}
          onSelect={setChoice}
        />
        {choice ? (
          <button type="button" onClick={() => setChoice(null)} className="mt-2 text-[12px] text-ink-mute hover:text-ink">
            reset
          </button>
        ) : null}
      </div>

      {section("RecapCard", "the fixed close template — the ⚠️ row names the one open item plainly")}
      <div className="max-w-lg">
        <RecapCard
          title="Setup recap (sample)"
          rows={[
            { icon: "✅", label: "Done today:", value: "voice set, 3 stages detected, 112 backers imported." },
            { icon: "✅", label: "Every morning:", value: "new tickets arrive drafted; you approve, nothing sends itself." },
            { icon: "📬", label: "Where they land:", value: "your Inbox — first batch is waiting now." },
            { icon: "⚠️", label: "Your one open item:", value: "no sending channel connected yet — replies stage as drafts until then." },
            { icon: "📈", label: "Week 1 looks like:", value: "approve a handful of replies a day; your status page absorbs the rest." },
          ]}
        />
      </div>

      {section("EmptyState + AllCaughtUp", "the one template every module reuses; manual path vs ✨ agent path")}
      <div className="panel max-w-2xl p-2">
        <EmptyState
          icon={<span aria-hidden>📦</span>}
          heading="Bring your backers in"
          sub="Tideover works from your real order list — nothing here is sample data."
          actions={[
            { title: "Import your backers", body: "Upload a Kickstarter or Shopify export. Column mapping is guided.", cta: "Import a CSV", href: "#" },
            { title: "Let the agent do it", body: "Paste your store URL and the agent maps stages, voice, and backers for you.", cta: "Help me import", href: "#", agent: true },
          ]}
        />
      </div>
      <div className="panel mt-4 max-w-2xl p-2">
        <AllCaughtUp tertiary="Sign off when you're ready." />
      </div>

      {section("ResumeBanner", "shown on every cockpit screen until setup completeness hits 100% (wiring lands with SW6)")}
      <div className="max-w-2xl overflow-hidden rounded-[10px]">
        <ResumeBanner href="#" />
      </div>
    </main>
  );
}
